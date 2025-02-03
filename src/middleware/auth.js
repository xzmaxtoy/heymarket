import config from '../config/config.js';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware to validate requests to our backend
 */
export const authenticate = (req, res, next) => {
  // Skip auth for root and health check routes
  if (req.path === '/' || req.path === '/health') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header'
      });
    }

    // Basic validation of bearer token
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format'
      });
    }

    // Store the API key for use in outgoing requests
    req.apiKey = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Adds Heymarket API authentication to outgoing requests
 */
export const addHeymarketAuth = (auth) => {
  // Handle both object and string formats
  let creatorId, inboxId;

  if (typeof auth === 'object') {
    // Old format: { headers: { 'x-creator-id': '...', 'x-inbox-id': '...' } }
    creatorId = auth.headers?.['x-creator-id'];
    inboxId = auth.headers?.['x-inbox-id'];
  } else if (typeof auth === 'string') {
    // New format: Bearer token string
    // Use default values since headers aren't passed
    creatorId = '45507';
    inboxId = '21571';
  } else {
    throw new Error('Invalid auth format');
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log auth details
  console.log('Adding Heymarket auth headers:', {
    requestId,
    hasApiKey: true,
    creatorId,
    inboxId,
    timestamp: new Date().toISOString()
  });

  // Use the API key from environment for Heymarket API requests
  return {
    headers: {
      'Authorization': `Bearer ${config.heymarketApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Id': requestId,
      'X-Creator-Id': creatorId,
      'X-Inbox-Id': inboxId
    },
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    }
  };
};
