import { promisify } from 'util';
import axios from 'axios';
import config from '../config/config.js';
import { addHeymarketAuth } from '../middleware/auth.js';
import { Template, getTemplate } from './template.js';
import { isDuplicateMessage, recordMessage } from '../utils/messageHistory.js';
import { employeeList } from '../utils/employeeList.js';
import { emitBatchUpdate, emitBatchError, emitBatchComplete } from '../websocket/server.js';

const sleep = promisify(setTimeout);

// Batch status storage
const batches = new Map();

// Priority delay mapping (in milliseconds)
// Heymarket limit: 500 requests per minute = ~8.33 requests per second
const PRIORITY_DELAYS = {
  high: 120,    // ~8 messages per second
  normal: 200,  // 5 messages per second
  low: 500      // 2 messages per second
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

    // Emit initial processing state
    emitBatchUpdate(this.id, this.getState());

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
            let backoffTime;
            
            // Use standard exponential backoff for first retry
            if (attempts === 1) {
              backoffTime = this.options.retryStrategy.backoffMinutes * 60 * 1000;
              console.log(`First retry, waiting ${backoffTime/1000} seconds`);
            } else {
              // For subsequent retries, use longer delay for rate limits
              backoffTime = 60000; // 60 seconds minimum for rate limits
              console.log(`Rate limit retry ${attempts}, waiting ${backoffTime/1000} seconds`);
            }
            
            await sleep(backoffTime);
          }

          // Check for duplicates (skip for employees)
          if (!employeeList.isEmployee(recipient.phoneNumber)) {
            console.log('Checking duplicates for non-employee:', recipient.phoneNumber);
            const isDuplicate = await isDuplicateMessage(
              recipient.phoneNumber,
              this.template.id,
              this.template.text,
              recipient.variables
            );
            
            if (isDuplicate) {
              console.log('Duplicate message detected, skipping:', recipient.phoneNumber);
              this.results.push({
                phoneNumber: recipient.phoneNumber,
                status: 'skipped',
                reason: 'duplicate_message',
                timestamp: new Date().toISOString()
              });
              this.progress.completed++;  // Count as completed
              success = true;  // Skip further attempts
              continue;
            } else {
              console.log('No duplicate found, proceeding with send');
            }
          } else {
            console.log('Employee detected, skipping duplicate check:', recipient.phoneNumber);
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
              channel: 'sms',
              phone_number: message.phoneNumber.startsWith('1') ? message.phoneNumber : `1${message.phoneNumber}`,
              text: message.message,
              local_id: `${this.id}_${Date.now()}`,
              ...(message.isPrivate && { private: true }),
              ...(message.author && { author: message.author }),
              ...(message.attachments && { media_url: message.attachments[0] })
            },
            timeout: 10000
          };

          const formattedPhone = message.phoneNumber.startsWith('1') ? message.phoneNumber : `1${message.phoneNumber}`;
          console.log('Sending message:', {
            originalPhone: message.phoneNumber,
            formattedPhone: formattedPhone,
            text: message.message,
            attempt: attempts + 1
          });

          console.log('Sending to Heymarket API:', messageConfig);
          const response = await axios(messageConfig);
          
          console.log('API Response:', {
            data: response.data,
            status: response.status,
            headers: response.headers
          });
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

          // Record sent message for duplicate tracking
          if (!employeeList.isEmployee(recipient.phoneNumber)) {
            await recordMessage(
              recipient.phoneNumber,
              this.template.id,
              this.template.text,
              recipient.variables
            );
          }

        } catch (error) {
          const isRateLimit = error?.response?.status === 429;
          console.error('Error sending message:', {
            phoneNumber: message.phoneNumber,
            attempt: attempts + 1,
            errorType: isRateLimit ? 'RATE_LIMIT' : 'API_ERROR',
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            rateLimitInfo: isRateLimit ? {
              limit: error.response?.headers?.['x-ratelimit-limit'],
              remaining: error.response?.headers?.['x-ratelimit-remaining'],
              reset: error.response?.headers?.['x-ratelimit-reset']
            } : null
          });
          
          attempts++;
          
          // For rate limits, pause processing for 60 seconds
          if (isRateLimit) {
            console.log('Rate limit hit, pausing batch processing for 60 seconds...');
            await sleep(60000);
          }
          
          // Categorize error
          const category = this.categorizeError(error);
          this.errors.categories[category] = (this.errors.categories[category] || 0) + 1;

          // Store error sample with more details
          if (this.errors.samples.length < 10) {
            this.errors.samples.push({
              phoneNumber: recipient.phoneNumber,
              error: error.message,
              category,
              status: error.response?.status,
              rateLimitInfo: isRateLimit ? {
                limit: error.response?.headers?.['x-ratelimit-limit'],
                remaining: error.response?.headers?.['x-ratelimit-remaining'],
                reset: error.response?.headers?.['x-ratelimit-reset']
              } : null,
              timestamp: new Date().toISOString()
            });
          }

          // If final attempt failed, record failure with details
          if (attempts === this.options.retryStrategy.maxAttempts) {
            this.results.push({
              phoneNumber: recipient.phoneNumber,
              status: 'failed',
              error: error.message,
              errorCategory: category,
              rateLimitInfo: isRateLimit ? {
                limit: error.response?.headers?.['x-ratelimit-limit'],
                remaining: error.response?.headers?.['x-ratelimit-remaining'],
                reset: error.response?.headers?.['x-ratelimit-reset']
              } : null,
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

      // Emit progress update
      emitBatchUpdate(this.id, this.getState());

      // Respect priority-based rate limiting
      await sleep(PRIORITY_DELAYS[this.options.priority]);
    }

    this.status = 'completed';
    emitBatchComplete(this.id, this.getState());
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
async function createBatch(templateData, recipients, options, auth) {
  console.log('Creating batch with template data:', templateData);
  
  let template;
  
  if (!templateData) {
    console.error('Template data is missing');
    throw new Error('Template is required');
  }

  try {
    if (templateData.id) {
      // If template has ID, fetch from storage
      console.log('Fetching template with ID:', templateData.id);
      template = await getTemplate(templateData.id);
      if (!template) {
        throw new Error('Template not found');
      }
    } else if (templateData.text) {
      // If template has text, create temporary template
      console.log('Creating temporary template with text:', templateData.text);
      template = new Template(
        `temp_${Date.now()}`,
        templateData.text,
        templateData.attachments || [],
        templateData.isPrivate || false,
        templateData.author || null
      );
      console.log('Temporary template created:', template);
    } else {
      throw new Error('Template must have either id or text');
    }
  } catch (error) {
    console.error('Error creating/fetching template:', error);
    throw error;
  }

  const batchId = options.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check for duplicate batch ID
  if (options.batchId && batches.has(batchId)) {
    throw new Error('Duplicate batch ID');
  }

  const batch = new Batch(batchId, template, recipients, options);
  batches.set(batchId, batch);

  // Only start processing if autoStart is true
  if (options.autoStart) {
    batch.start(auth).catch(error => {
      console.error('Batch processing error:', error);
      batch.status = 'failed';
      batch.errors.categories['system'] = (batch.errors.categories['system'] || 0) + 1;
      batch.errors.samples.push({
        error: error.message,
        category: 'system',
        timestamp: new Date().toISOString()
      });
      emitBatchError(batch.id, {
        error: error.message,
        state: batch.getState()
      });
    });
  }

  // Clean up old batches after 1 hour
  setTimeout(() => {
    batches.delete(batchId);
  }, 60 * 60 * 1000);

  // Log batch creation
  console.log('Created batch:', {
    id: batchId,
    template: {
      id: template.id,
      text: template.text,
      author: template.author
    },
    recipientCount: recipients.length,
    options
  });

  return batch;
}

/**
 * Get batch by ID
 */
function getBatch(batchId) {
  return batches.get(batchId);
}

export { createBatch, getBatch, batches };
