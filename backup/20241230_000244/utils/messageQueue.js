import { promisify } from 'util';
import axios from 'axios';
import config from '../config/config.js';
import { addHeymarketAuth } from '../middleware/auth.js';

const sleep = promisify(setTimeout);

// In-memory storage for batch status
const batchStatus = new Map();

/**
 * Process messages in queue with rate limiting
 */
async function processMessageQueue(batchId, messages, auth) {
  const results = {
    total: messages.length,
    completed: 0,
    successful: 0,
    failed: 0,
    details: []
  };

  // Update initial status
  batchStatus.set(batchId, { ...results, status: 'processing' });

  for (const msg of messages) {
    try {
      // Add delay between messages to respect rate limits
      await sleep(1000);

      const messageConfig = {
        ...addHeymarketAuth(auth),
        url: `${config.heymarketBaseUrl}/message/send`,
        method: 'POST',
        data: {
          inbox_id: 21571,
          creator_id: 45507,
          phone_number: formatPhoneNumber(msg.phoneNumber),
          text: msg.message,
          local_id: `batch_${batchId}_${Date.now()}`,
          ...(msg.isPrivate && { private: true }),
          ...(msg.author && { author: msg.author }),
          ...(msg.attachments && { media_url: msg.attachments[0] })
        },
        timeout: 10000
      };

      const response = await axios(messageConfig);

      results.details.push({
        phoneNumber: msg.phoneNumber,
        status: 'success',
        messageId: response.data.id,
        timestamp: response.data.created_at || new Date().toISOString()
      });

      results.successful++;
    } catch (error) {
      results.details.push({
        phoneNumber: msg.phoneNumber,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      results.failed++;
    }

    results.completed++;
    batchStatus.set(batchId, { ...results, status: 'processing' });
  }

  // Update final status
  batchStatus.set(batchId, { 
    ...results, 
    status: 'completed',
    completedAt: new Date().toISOString()
  });

  // Clean up old status after 24 hours
  setTimeout(() => {
    batchStatus.delete(batchId);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Format phone number to E.164 format without plus sign
 */
function formatPhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  } else if (cleaned.length === 11 && !cleaned.startsWith('1')) {
    cleaned = '1' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Get status of a batch operation
 */
function getBatchStatus(batchId) {
  return batchStatus.get(batchId);
}

/**
 * Start processing a new batch of messages
 */
function startBatch(messages, auth) {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  processMessageQueue(batchId, messages, auth);
  return batchId;
}

export { startBatch, getBatchStatus };
