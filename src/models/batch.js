import { promisify } from 'util';
import { Template, getTemplate } from './template.js';
import BatchProcessor from './BatchProcessor.js';
import BatchState from './BatchState.js';

const sleep = promisify(setTimeout);

// Batch status storage
const batches = new Map();

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

    // Initialize state manager
    this.state = new BatchState(id, {
      total_recipients: recipients.length
    });

    this.isPaused = false;
    this.currentRecipientIndex = 0;
    this.lastAuth = null;
  }

  /**
   * Start batch processing
   */
  async start(auth) {
    this.lastAuth = auth;

    try {
      // Handle scheduled batches
      if (this.options.scheduleTime) {
        const scheduledTime = new Date(this.options.scheduleTime);
        const now = new Date();
        if (scheduledTime > now) {
          const delay = scheduledTime - now;
          await sleep(delay);
        }
      }

      await this.state.start();
      const startTime = Date.now();

      // Process each recipient
      for (let i = this.currentRecipientIndex; i < this.recipients.length; i++) {
        if (this.isPaused) {
          this.currentRecipientIndex = i;
          return;
        }

        const recipient = this.recipients[i];
        this.state.startProcessingMessage();

        // Process message
        const result = await BatchProcessor.processMessage(
          recipient,
          this.template,
          auth,
          {
            maxAttempts: this.options.retryStrategy.maxAttempts,
            backoffMinutes: this.options.retryStrategy.backoffMinutes
          }
        );

        // Record result and update metrics
        await this.state.recordResult(result);
        this.state.updateMetrics(startTime);

        // Respect rate limits
        await sleep(BatchProcessor.getProcessingDelay(this.options.priority));
      }

      await this.state.complete();
    } catch (error) {
      console.error('Batch processing error:', error);
      await this.state.fail(error);
    }
  }

  /**
   * Pause batch processing
   */
  async pause() {
    if (this.state.status !== 'processing') {
      throw new Error('Can only pause processing batches');
    }
    this.isPaused = true;
  }

  /**
   * Resume batch processing
   */
  async resume() {
    if (this.state.status !== 'paused') {
      throw new Error('Can only resume paused batches');
    }
    this.isPaused = false;
    await this.start(this.lastAuth);
  }

  /**
   * Get current batch state
   */
  getState() {
    return this.state.getState();
  }

  /**
   * Get detailed results
   */
  getResults() {
    return this.state.results;
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
    batch.start(auth).catch(async error => {
      console.error('Batch processing error:', error);
      await batch.state.fail(error);
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
