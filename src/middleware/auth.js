import config from '../config/config.js';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware to validate requests to our backend
 */
export const authenticate = (req, res, next) => {
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
export const addHeymarketAuth = (req) => {
  if (!req.apiKey) {
    throw new Error('No API key available');
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log auth details
  console.log('Auth headers:', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    hasApiKey: true,
    timestamp: new Date().toISOString()
  });

  // Use the API key from environment for Heymarket API requests
  return {
    headers: {
      'Authorization': `Bearer ${config.heymarketApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Id': requestId
    },
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    }
  };
};
