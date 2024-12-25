import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(process.cwd(), 'logs');
const requestLogPath = path.join(logDir, 'batch-requests.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const requestLogger = (req, res, next) => {
  // Only log batch-related requests
  if (!req.path.includes('/batch') && !req.path.includes('/messages/batch')) {
    return next();
  }

  const timestamp = new Date().toISOString();
  const requestData = {
    timestamp,
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.method === 'POST' ? {
      template: req.body.template,
      recipientCount: req.body.recipients?.length,
      recipientSample: req.body.recipients?.slice(0, 1).map(r => ({
        phoneNumber: r.phoneNumber,
        variables: r.variables
      })),
      options: req.body.options
    } : req.body,
    query: req.query
  };

  // Format log entry
  const logEntry = `\n=== Request ${timestamp} ===\n${JSON.stringify(requestData, null, 2)}\n`;

  try {
    // Create log directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      console.log('Creating log directory:', logDir);
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create log file if it doesn't exist
    if (!fs.existsSync(requestLogPath)) {
      console.log('Creating log file:', requestLogPath);
      fs.writeFileSync(requestLogPath, '', { mode: 0o666 });
    }

    // Append to log file
    console.log('Writing to log file:', requestLogPath);
    console.log('Log entry:', logEntry);
    fs.appendFileSync(requestLogPath, logEntry, { mode: 0o666 });
    
    // Verify write
    const stats = fs.statSync(requestLogPath);
    console.log('Log file stats:', {
      size: stats.size,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid
    });
  } catch (err) {
    console.error('Error writing to request log:', {
      error: err.message,
      code: err.code,
      path: requestLogPath,
      stack: err.stack
    });
  }

  // Also log to console for immediate visibility
  console.log('\nIncoming Batch Request:', {
    timestamp,
    method: req.method,
    path: req.path,
    body: req.body
  });

  next();
};

export const getRequestHistory = (limit = 10) => {
  try {
    if (!fs.existsSync(requestLogPath)) {
      return [];
    }

    const content = fs.readFileSync(requestLogPath, 'utf8');
    const requests = content.split('\n=== Request ').slice(1); // Skip first empty element
    
    return requests
      .map(req => {
        try {
          const [timestamp, ...jsonParts] = req.split('\n');
          const jsonStr = jsonParts.join('\n');
          return JSON.parse(jsonStr);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean) // Remove any failed parses
      .slice(-limit); // Get last 'limit' entries
  } catch (error) {
    console.error('Error reading request history:', error);
    return [];
  }
};
