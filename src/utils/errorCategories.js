/**
 * Error categories for message processing
 */
export const ERROR_CATEGORIES = {
  // Timeout categories
  TIMEOUT_10S: 'TIMEOUT_10S',
  TIMEOUT_20S: 'TIMEOUT_20S',
  TIMEOUT_30S: 'TIMEOUT_30S',
  
  // Other error types
  MAX_RETRIES: 'MAX_RETRIES',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR'
};

/**
 * Timeout configuration for progressive retry attempts
 */
export const TIMEOUT_CONFIG = {
  attempt1: { 
    timeout: 10000, 
    category: ERROR_CATEGORIES.TIMEOUT_10S 
  },
  attempt2: { 
    timeout: 20000, 
    category: ERROR_CATEGORIES.TIMEOUT_20S 
  },
  attempt3: { 
    timeout: 30000, 
    category: ERROR_CATEGORIES.TIMEOUT_30S 
  }
};

/**
 * Default metadata structure for message processing
 */
export const DEFAULT_METADATA = {
  priority: 'normal',
  retryStrategy: {
    maxAttempts: 3,
    backoffMinutes: 5,
    timeoutConfig: TIMEOUT_CONFIG
  },
  timeoutHistory: [],
  errorHistory: []
};

/**
 * Determine error category based on error object
 */
export function determineErrorCategory(error) {
  if (error.code === 'ECONNABORTED') {
    // For timeout errors, category depends on the current timeout value
    const timeout = error.config?.timeout || 10000;
    if (timeout >= 30000) return ERROR_CATEGORIES.TIMEOUT_30S;
    if (timeout >= 20000) return ERROR_CATEGORIES.TIMEOUT_20S;
    return ERROR_CATEGORIES.TIMEOUT_10S;
  }

  if (error.response?.status === 401) {
    return ERROR_CATEGORIES.AUTH_ERROR;
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
    return ERROR_CATEGORIES.NETWORK_ERROR;
  }

  return ERROR_CATEGORIES.API_ERROR;
}
