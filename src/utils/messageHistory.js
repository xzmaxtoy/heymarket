import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const MESSAGE_HISTORY_FILE = 'messages.json';

// Debug logging
function logDebug(...args) {
  console.log('[MessageHistory]', ...args);
}
const HISTORY_RETENTION_DAYS = 30;

// Generate hash for message content
function generateMessageHash(templateId, text, variables) {
  // Include both text and variables in hash
  const content = JSON.stringify({
    text,
    variables
  });
  logDebug('Generating hash for:', { text, variables });
  const hash = crypto.createHash('md5').update(content).digest('hex');
  logDebug('Generated hash:', hash);
  return hash;
}

// Format phone number consistently
export function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned;
  }
  throw new Error(`Invalid phone number format: ${phone}`);
}

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Get history file path
function getHistoryFile() {
  return path.join(CACHE_DIR, MESSAGE_HISTORY_FILE);
}

// Load message history
async function loadHistory() {
  try {
    await ensureCacheDir();
    const historyFile = getHistoryFile();
    
    try {
      const data = await fs.readFile(historyFile, 'utf8');
      const history = JSON.parse(data);
      logDebug('Loaded history:', history);
      return history;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logDebug('No history file found, creating new one');
        return {};
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading message history:', error);
    return {};
  }
}

// Save message history
async function saveHistory(history) {
  try {
    await ensureCacheDir();
    const historyFile = getHistoryFile();
    logDebug('Saving history:', history);
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    logDebug('History saved successfully');
  } catch (error) {
    console.error('Error saving message history:', error);
    throw error;
  }
}

// Clean up old entries
async function cleanupOldEntries() {
  const history = await loadHistory();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - HISTORY_RETENTION_DAYS);
  
  let cleaned = false;
  for (const [phoneNumber, messages] of Object.entries(history)) {
    const validMessages = messages.filter(msg => 
      new Date(msg.timestamp) > cutoffDate
    );
    
    if (validMessages.length !== messages.length) {
      history[phoneNumber] = validMessages;
      cleaned = true;
    }
  }
  
  if (cleaned) {
    await saveHistory(history);
  }
}

// Check if message would be a duplicate
export async function isDuplicateMessage(phoneNumber, templateId, text, variables) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const messageHash = generateMessageHash(templateId, text, variables);
    
    const history = await loadHistory();
    const messages = history[formattedPhone] || [];
    
    // Check last 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - HISTORY_RETENTION_DAYS);
    
    return messages.some(msg => 
      msg.messageHash === messageHash &&
      new Date(msg.timestamp) > cutoffDate
    );
  } catch (error) {
    console.error('Error checking for duplicate message:', error);
    return false; // On error, allow message to be sent
  }
}

// Record a sent message
export async function recordMessage(phoneNumber, templateId, text, variables) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const messageHash = generateMessageHash(templateId, text, variables);
    
    const history = await loadHistory();
    
    if (!history[formattedPhone]) {
      history[formattedPhone] = [];
    }
    
    history[formattedPhone].push({
      messageHash,
      timestamp: new Date().toISOString(),
      templateId,
      text
    });
    
    await saveHistory(history);
    
    // Periodically clean up old entries (1% chance per write)
    if (Math.random() < 0.01) {
      await cleanupOldEntries();
    }
  } catch (error) {
    console.error('Error recording message:', error);
  }
}

// Get message history for a phone number
export async function getMessageHistory(phoneNumber) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const history = await loadHistory();
    return history[formattedPhone] || [];
  } catch (error) {
    console.error('Error getting message history:', error);
    return [];
  }
}

// Clear message history (for testing)
export async function clearHistory() {
  await saveHistory({});
}
