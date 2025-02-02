import { promisify } from 'util';
import axios from 'axios';
import config from '../config/config.js';
import { addHeymarketAuth } from '../middleware/auth.js';
import { isDuplicateMessage, recordMessage } from '../utils/messageHistory.js';
import { employeeList } from '../utils/employeeList.js';

const sleep = promisify(setTimeout);

// Priority delay mapping (in milliseconds)
const PRIORITY_DELAYS = {
  high: 120,    // ~8 messages per second
  normal: 200,  // 5 messages per second
  low: 500      // 2 messages per second
};

/**
 * Handles the core message processing logic for a batch
 */
class BatchProcessor {
  /**
   * Process a single message
   * @param {object} recipient - Recipient details
   * @param {object} template - Message template
   * @param {object} auth - Authentication details
   * @param {object} options - Processing options
   * @returns {Promise<object>} Processing result
   */
  static async processMessage(recipient, template, auth, options = {}) {
    let attempts = 0;
    
    while (attempts < options.maxAttempts) {
      try {
        if (attempts > 0) {
          const backoffTime = attempts === 1 
            ? options.backoffMinutes * 60 * 1000 
            : 60000;
          await sleep(backoffTime);
        }

        // Check for duplicates (skip for employees)
        if (!employeeList.isEmployee(recipient.phoneNumber)) {
          const isDuplicate = await isDuplicateMessage(
            recipient.phoneNumber,
            template.id,
            template.text,
            recipient.variables
          );
          
          if (isDuplicate) {
            return {
              status: 'skipped',
              reason: 'duplicate_message',
              timestamp: new Date().toISOString()
            };
          }
        }

        // Create message from template
        const message = template.createMessage(
          recipient.phoneNumber,
          recipient.variables,
          recipient.overrides
        );

        // Send message
        const response = await this.sendMessage(message, auth);

        // Record sent message for duplicate tracking
        if (!employeeList.isEmployee(recipient.phoneNumber)) {
          await recordMessage(
            recipient.phoneNumber,
            template.id,
            template.text,
            recipient.variables
          );
        }

        return {
          status: 'success',
          messageId: response.data.message?.id || response.data.id,
          timestamp: response.data.message?.created_at || response.data.created_at || new Date().toISOString(),
          attempts: attempts + 1
        };

      } catch (error) {
        attempts++;
        
        if (attempts === options.maxAttempts) {
          return {
            status: 'failed',
            error: error.message,
            errorCategory: this.categorizeError(error),
            rateLimitInfo: error.response?.status === 429 ? {
              limit: error.response?.headers?.['x-ratelimit-limit'],
              remaining: error.response?.headers?.['x-ratelimit-remaining'],
              reset: error.response?.headers?.['x-ratelimit-reset']
            } : null,
            timestamp: new Date().toISOString(),
            attempts
          };
        }

        // Handle rate limits
        if (error.response?.status === 429) {
          await sleep(60000); // Wait 60 seconds on rate limit
        }
      }
    }
  }

  /**
   * Send message to Heymarket API
   * @private
   */
  static async sendMessage(message, auth) {
    console.log('Sending message:', {
      phoneNumber: message.phoneNumber,
      messageLength: message.message?.length,
      hasAttachments: !!message.attachments?.length,
      auth: {
        hasApiKey: !!auth.apiKey,
        headers: Object.keys(auth.headers || {})
      }
    });

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
        local_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...(message.isPrivate && { private: true }),
        ...(message.author && { author: message.author }),
        ...(message.attachments && { media_url: message.attachments[0] })
      },
      timeout: 10000
    };

    try {
      console.log('Message config:', {
        url: messageConfig.url,
        method: messageConfig.method,
        data: {
          ...messageConfig.data,
          text: messageConfig.data.text?.substring(0, 50) + '...' // Truncate for logging
        }
      });

      const response = await axios(messageConfig);
      
      console.log('Message sent successfully:', {
        messageId: response.data.message?.id || response.data.id,
        timestamp: response.data.message?.created_at || response.data.created_at
      });

      return response;
    } catch (error) {
      console.error('Error sending message:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Categorize error type
   * @private
   */
  static categorizeError(error) {
    if (error.response?.status === 429) return 'rate_limit';
    if (error.response?.status === 400) return 'invalid_request';
    if (error.code === 'ECONNABORTED') return 'timeout';
    if (error.code === 'ECONNREFUSED') return 'network_error';
    return 'unknown';
  }

  /**
   * Get delay based on priority
   */
  static getProcessingDelay(priority) {
    return PRIORITY_DELAYS[priority] || PRIORITY_DELAYS.normal;
  }
}

export default BatchProcessor;
