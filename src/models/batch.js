import { promisify } from 'util';
import axios from 'axios';
import config from '../config/config.js';
import { addHeymarketAuth } from '../middleware/auth.js';
import { getTemplate } from './template.js';

const sleep = promisify(setTimeout);

// Batch status storage
const batches = new Map();

// Priority delay mapping (in milliseconds)
const PRIORITY_DELAYS = {
  high: 500,    // 2 messages per second
  normal: 1000, // 1 message per second
  low: 2000     // 0.5 messages per second
};

class Batch {
  constructor(id, template, recipients, options = {}) {
    this.id = id;
    this.template = template;
    this.recipients = recipients;
    this.options = {
      scheduleTime: options.scheduleTime,
      priority: options.priority || 'normal',
      retryStrategy: {
        maxAttempts: options.retryStrategy?.maxAttempts || 3,
        backoffMinutes: options.retryStrategy?.backoffMinutes || 5
      }
    };

    this.status = 'pending';
    this.progress = {
      total: recipients.length,
      pending: recipients.length,
      processing: 0,
      completed: 0,
      failed: 0
    };
    this.timing = {
      created: new Date().toISOString(),
      started: null,
      estimated_completion: null
    };
    this.errors = {
      categories: {},
      samples: []
    };
    this.metrics = {
      messages_per_second: 0,
      success_rate: 0,
      credits_used: 0
    };
    this.results = [];
  }

  /**
   * Start batch processing
   */
  async start(auth) {
    if (this.options.scheduleTime) {
      const scheduledTime = new Date(this.options.scheduleTime);
      const now = new Date();
      if (scheduledTime > now) {
        const delay = scheduledTime - now;
        await sleep(delay);
      }
    }

    this.status = 'processing';
    this.timing.started = new Date().toISOString();
    
    // Calculate estimated completion time
    const totalTime = this.recipients.length * PRIORITY_DELAYS[this.options.priority];
    const estimatedCompletion = new Date(Date.now() + totalTime);
    this.timing.estimated_completion = estimatedCompletion.toISOString();

    const startTime = Date.now();
    let successCount = 0;

    for (const recipient of this.recipients) {
      this.progress.pending--;
      this.progress.processing++;

      let attempts = 0;
      let success = false;

      while (attempts < this.options.retryStrategy.maxAttempts && !success) {
        try {
          if (attempts > 0) {
            // Wait before retry using exponential backoff
            const backoffTime = this.options.retryStrategy.backoffMinutes * 60 * 1000 * Math.pow(2, attempts - 1);
            await sleep(backoffTime);
          }

          // Create message from template
          const message = this.template.createMessage(
            recipient.phoneNumber,
            recipient.variables,
            recipient.overrides
          );

    // Send message
    const messageConfig = {
      ...addHeymarketAuth(auth),
      url: `${config.heymarketBaseUrl}/message/send`,
            method: 'POST',
            data: {
              inbox_id: 21571,
              creator_id: 45507,
              phone_number: message.phoneNumber,
              text: message.message,
              local_id: `${this.id}_${Date.now()}`,
              ...(message.isPrivate && { private: true }),
              ...(message.author && { author: message.author }),
              ...(message.attachments && { media_url: message.attachments[0] })
            },
            timeout: 10000
          };

          console.log('Sending message:', {
            phoneNumber: message.phoneNumber,
            text: message.message,
            attempt: attempts + 1
          });

          const response = await axios(messageConfig);
          
          console.log('API Response:', response.data);
          console.log('Message sent successfully:', {
            messageId: response.data.message?.id || response.data.id,
            status: response.data.message?.status || response.data.status
          });
          
          // Record success
          this.results.push({
            phoneNumber: recipient.phoneNumber,
            status: 'success',
            messageId: response.data.message?.id || response.data.id,
            timestamp: response.data.message?.created_at || response.data.created_at || new Date().toISOString(),
            attempts: attempts + 1
          });

          success = true;
          successCount++;
          this.progress.completed++;
          this.metrics.credits_used++;

        } catch (error) {
          console.error('Error sending message:', {
            phoneNumber: message.phoneNumber,
            attempt: attempts + 1,
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          attempts++;
          
          // Categorize error
          const category = this.categorizeError(error);
          this.errors.categories[category] = (this.errors.categories[category] || 0) + 1;

          // Store error sample
          if (this.errors.samples.length < 10) {
            this.errors.samples.push({
              phoneNumber: recipient.phoneNumber,
              error: error.message,
              category,
              timestamp: new Date().toISOString()
            });
          }

          // If final attempt failed, record failure
          if (attempts === this.options.retryStrategy.maxAttempts) {
            this.results.push({
              phoneNumber: recipient.phoneNumber,
              status: 'failed',
              error: error.message,
              errorCategory: category,
              timestamp: new Date().toISOString(),
              attempts
            });
            this.progress.failed++;
          }
        }
      }

      this.progress.processing--;

      // Update metrics
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      this.metrics.messages_per_second = (this.progress.completed + this.progress.failed) / elapsedSeconds;
      this.metrics.success_rate = (successCount / (this.progress.completed + this.progress.failed)) * 100;

      // Respect priority-based rate limiting
      await sleep(PRIORITY_DELAYS[this.options.priority]);
    }

    this.status = 'completed';
  }

  /**
   * Categorize error type
   */
  categorizeError(error) {
    if (error.response?.status === 429) return 'rate_limit';
    if (error.response?.status === 400) return 'invalid_request';
    if (error.code === 'ECONNABORTED') return 'timeout';
    if (error.code === 'ECONNREFUSED') return 'network_error';
    return 'unknown';
  }

  /**
   * Get current batch state
   */
  getState() {
    return {
      batchId: this.id,
      status: this.status,
      progress: this.progress,
      timing: this.timing,
      errors: this.errors,
      metrics: this.metrics
    };
  }

  /**
   * Get detailed results
   */
  getResults() {
    return this.results;
  }
}

/**
 * Create and start a new batch
 */
async function createBatch(templateId, recipients, options, auth) {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const batchId = options.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check for duplicate batch ID
  if (options.batchId && batches.has(batchId)) {
    throw new Error('Duplicate batch ID');
  }

  const batch = new Batch(batchId, template, recipients, options);
  batches.set(batchId, batch);

  // Start processing
  batch.start(auth).catch(error => {
    console.error('Batch processing error:', error);
    batch.status = 'failed';
    batch.errors.categories['system'] = (batch.errors.categories['system'] || 0) + 1;
    batch.errors.samples.push({
      error: error.message,
      category: 'system',
      timestamp: new Date().toISOString()
    });
  });

  // Clean up old batches after 24 hours
  setTimeout(() => {
    batches.delete(batchId);
  }, 24 * 60 * 60 * 1000);

  return batch;
}

/**
 * Get batch by ID
 */
function getBatch(batchId) {
  return batches.get(batchId);
}

export { createBatch, getBatch };
