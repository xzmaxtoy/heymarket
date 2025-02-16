import { batchManager } from '../models/v2/BatchManager.js';
import { supabase } from '../services/supabase.js';
import { batches, getBatch } from '../models/batch.js';
import { emitBatchUpdate, emitBatchError, emitBatchComplete } from '../websocket/server.js';
import axios from 'axios';
import config from '../config/config.js';
import { addHeymarketAuth } from '../middleware/auth.js';
import { 
  ERROR_CATEGORIES, 
  TIMEOUT_CONFIG, 
  DEFAULT_METADATA,
  determineErrorCategory 
} from './errorCategories.js';

class MessageQueue {
  constructor() {
    this.queues = new Map(); // batchId -> queue
    this.processing = new Map(); // batchId -> processing state
    this.retryTimeouts = new Map(); // messageId -> timeout
    this.authTokens = new Map(); // batchId -> auth token
    this.concurrency = 5; // Process 5 messages at a time
    this.completionDelay = 30000; // Wait 30 seconds before checking completion
    this.completionChecks = new Map(); // batchId -> timeout
  }

  /**
   * Add messages to queue for a batch
   * @param {Array} messages - Array of messages to add
   * @param {Object} options - Options for batch processing
   * @param {boolean} options.autoStart - Whether to start processing immediately
   * @param {Object} options.auth - Auth details if autoStart is true
   */
  async addBatch(messages, options = {}) {
    const batchId = messages[0]?.batchId;
    if (!batchId) return;

    // Initialize queue if not exists
    if (!this.queues.has(batchId)) {
      this.queues.set(batchId, new Map()); // Use Map to track messages by ID
      this.processing.set(batchId, false);
    }

    // Add messages to queue, deduplicating by messageId
    const queue = this.queues.get(batchId);
    messages.forEach(msg => {
      if (!queue.has(msg.messageId)) {
        queue.set(msg.messageId, msg);
      }
    });

    console.log(`Added ${messages.length} messages to queue for batch ${batchId} (${queue.size} unique)`);

    // Update pending count
    await batchManager.updateProgress(batchId, {
      pending: queue.size,
      processing: 0
    });

    // Auto-start if requested and not already processing
    if (options.autoStart && options.auth && !this.processing.get(batchId)) {
      await this.processBatch(batchId, options.auth);
    }
  }

  /**
   * Process messages in a batch
   */
  async processBatch(batchId, auth) {
    if (!this.queues.has(batchId)) {
      console.log(`No messages in queue for batch ${batchId}`);
      return;
    }

    // Check if already processing
    if (this.processing.get(batchId)) {
      console.log(`Batch ${batchId} is already being processed`);
      return;
    }

    // Store auth token for this batch
    this.authTokens.set(batchId, auth);

    this.processing.set(batchId, true);
    const queue = this.queues.get(batchId);

    try {
      // Get batch from old system
      const oldBatch = getBatch(batchId);
      if (oldBatch) {
        // Start processing through old batch system
        await oldBatch.start(auth);
        return;
      }

      console.log(`Processing ${queue.length} messages for batch ${batchId}`);

      // Update processing count
      await batchManager.updateProgress(batchId, {
        pending: queue.length,
        processing: Math.min(queue.length, this.concurrency)
      });

      // Otherwise use new system
      const messages = Array.from(queue.values());
      while (messages.length > 0) {
        // Process messages in chunks
        const chunk = messages.splice(0, this.concurrency);
        await Promise.all(chunk.map(msg => this.processMessage(msg)));

        // Update progress after each chunk
        if (messages.length > 0) {
          await batchManager.updateProgress(batchId, {
            pending: messages.length,
            processing: Math.min(messages.length, this.concurrency)
          });
        }
      }

      // Clear processed messages from queue
      queue.clear();

      // Schedule completion check
      this.scheduleCompletionCheck(batchId);

    } catch (error) {
      console.error('Error processing batch:', error);
      await batchManager.updateStatus(batchId, 'failed', {
        error: error.message
      });
      emitBatchError(batchId, {
        error: error.message,
        state: await batchManager.getBatch(batchId)
      });
    } finally {
      this.processing.set(batchId, false);
    }
  }

  /**
   * Schedule completion check with delay
   */
  scheduleCompletionCheck(batchId) {
    // Clear any existing check
    const existingCheck = this.completionChecks.get(batchId);
    if (existingCheck) {
      clearTimeout(existingCheck);
    }

    // Schedule new check
    const timeout = setTimeout(async () => {
      await this.checkBatchCompletion(batchId);
    }, this.completionDelay);

    this.completionChecks.set(batchId, timeout);
  }

  /**
   * Check if batch is complete
   */
  async checkBatchCompletion(batchId) {
    try {
      console.log(`Checking completion status for batch ${batchId}`);

      // Initialize for pagination
      let allLogs = [];
      let page = 0;
      const pageSize = 1000;

      // Fetch all logs with pagination
      while (true) {
        console.log(`Fetching page ${page} for batch ${batchId}`);
        const { data, error } = await supabase
          .from('sms_batch_log')
          .select('status')
          .eq('batch_id', batchId)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allLogs = allLogs.concat(data);
        console.log(`Retrieved ${data.length} records, total so far: ${allLogs.length}`);
        
        if (data.length < pageSize) break;
        page++;
      }

      // Count statuses
      const counts = allLogs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {});

      const total = allLogs.length;
      const completed = counts.completed || 0;
      const failed = counts.failed || 0;
      const pending = counts.pending || 0;
      const processing = counts.processing || 0;

      console.log('Batch status counts:', {
        batchId,
        total,
        completed,
        failed,
        pending,
        processing
      });

      // Update progress
      await batchManager.updateProgress(batchId, {
        total,
        completed,
        failed,
        pending,
        processing
      });

      // Calculate success rate
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      // Update metrics
      await batchManager.updateMetrics(batchId, {
        success_rate: successRate,
        credits_used: completed,
        messages_per_second: total > 0 ? total / (this.completionDelay / 1000) : 0
      });

      // Check if complete
      if (pending === 0 && processing === 0) {
        // All messages are either completed or failed
        const status = failed === total ? 'failed' : 'completed';
        await batchManager.updateStatus(batchId, status);

        // Clean up
        this.queues.delete(batchId);
        this.processing.delete(batchId);
        this.authTokens.delete(batchId);
        this.completionChecks.delete(batchId);

        // Emit completion
        const batch = await batchManager.getBatch(batchId);
        if (status === 'completed') {
          emitBatchComplete(batchId, batch);
        } else {
          emitBatchError(batchId, {
            error: 'All messages failed',
            state: batch
          });
        }
      } else {
        // Still has pending or processing messages, schedule another check
        this.scheduleCompletionCheck(batchId);
      }
    } catch (error) {
      console.error('Error checking batch completion:', error);
    }
  }

  /**
   * Process a single message
   */
  async processMessage(message) {
    const { batchId, messageId, phoneNumber, variables } = message;
    
    try {
      // Get auth token for this batch
      const auth = this.authTokens.get(batchId);
      if (!auth) {
        throw new Error('No auth token found for batch');
      }

      // Get message from batch log
      const { data: log, error: logError } = await supabase
        .from('sms_batch_log')
        .select('*')
        .eq('id', messageId)
        .single();

      if (logError) throw logError;
      if (!log) throw new Error('Message log not found');

      // Get current attempt number and timeout config
      const attempts = log.attempts || 0;
      const timeoutConfig = TIMEOUT_CONFIG[`attempt${attempts + 1}`] || TIMEOUT_CONFIG.attempt3;

      // Update status to processing
      await batchManager.updateMessageStatus(messageId, 'processing');

      // Generate message content
      let content = log.message;
      Object.entries(variables || {}).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      console.log('Sending message:', {
        phoneNumber,
        content,
        batchId,
        messageId,
        attempt: attempts + 1,
        timeout: timeoutConfig.timeout
      });

      // Send message with progressive timeout
      const messageConfig = {
        ...addHeymarketAuth(auth),
        url: `${config.heymarketBaseUrl}/message/send`,
        method: 'POST',
        data: {
          inbox_id: 21571,
          creator_id: 45507,
          channel: 'sms',
          phone_number: phoneNumber.startsWith('1') ? phoneNumber : `1${phoneNumber}`,
          text: content,
          local_id: `${batchId}_${Date.now()}`
        },
        timeout: timeoutConfig.timeout
      };

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
      
      // Update message status
      await batchManager.updateMessageStatus(messageId, 'completed', {
        phoneNumber,
        messageId: response.data.message?.id || response.data.id
      });

      // Schedule completion check
      this.scheduleCompletionCheck(batchId);

    } catch (error) {
      console.error('Error processing message:', error);

      // Get current attempts
      const { data: log } = await supabase
        .from('sms_batch_log')
        .select('attempts')
        .eq('id', messageId)
        .single();

      const attempts = (log?.attempts || 0) + 1;

      // Get current metadata
      const currentMetadata = log.metadata || DEFAULT_METADATA;
      
      if (attempts < currentMetadata.retryStrategy.maxAttempts) {
        // Schedule retry with progressive timeout
        const timeout = setTimeout(() => {
          this.retryMessage(message);
        }, currentMetadata.retryStrategy.backoffMinutes * 60 * 1000);

        this.retryTimeouts.set(messageId, timeout);

        // Update status with timeout tracking
        await batchManager.updateMessageStatus(messageId, 'pending', {
          error: error.message,
          errorCategory: determineErrorCategory(error),
          attempts,
          metadata: {
            ...currentMetadata,
            timeoutHistory: [
              ...(currentMetadata.timeoutHistory || []),
              {
                attempt: attempts + 1,
                timeout: timeoutConfig.timeout,
                error: error.message,
                timestamp: new Date().toISOString()
              }
            ]
          }
        });
      } else {
        // Mark as failed after max attempts
        await batchManager.updateMessageStatus(messageId, 'failed', {
          error: error.message,
          errorCategory: ERROR_CATEGORIES.MAX_RETRIES,
          phoneNumber,
          metadata: {
            ...currentMetadata,
            timeoutHistory: [
              ...(currentMetadata.timeoutHistory || []),
              {
                attempt: attempts + 1,
                timeout: timeoutConfig.timeout,
                error: error.message,
                timestamp: new Date().toISOString(),
                final: true
              }
            ]
          }
        });
      }

      // Schedule completion check
      this.scheduleCompletionCheck(batchId);
    }
  }

  /**
   * Retry a failed message
   */
  async retryMessage(message) {
    const { messageId, batchId } = message;
    this.retryTimeouts.delete(messageId);

    const queue = this.queues.get(batchId);
    if (queue && !queue.has(message.messageId)) {
      queue.set(message.messageId, message);
      if (!this.processing.get(batchId)) {
        const auth = this.authTokens.get(batchId);
        if (auth) {
          await this.processBatch(batchId, auth);
        }
      }
    }
  }

  /**
   * Cancel batch processing
   */
  async cancelBatch(batchId) {
    // Clear queue
    this.queues.delete(batchId);
    this.processing.delete(batchId);
    this.authTokens.delete(batchId);

    // Clear any pending retries
    const batch = await batchManager.getBatch(batchId);
    batch.results.forEach(result => {
      const timeout = this.retryTimeouts.get(result.messageId);
      if (timeout) {
        clearTimeout(timeout);
        this.retryTimeouts.delete(result.messageId);
      }
    });

    // Clear completion check
    const completionCheck = this.completionChecks.get(batchId);
    if (completionCheck) {
      clearTimeout(completionCheck);
      this.completionChecks.delete(batchId);
    }

    // Update status
    await batchManager.updateStatus(batchId, 'cancelled');
    emitBatchUpdate(batchId, await batchManager.getBatch(batchId));
  }
}

export const messageQueue = new MessageQueue();
