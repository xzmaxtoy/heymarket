# Timeout Handling Implementation

## Overview

This document outlines the implementation of improved timeout handling and error tracking for batch message processing. The changes aim to provide better error categorization, progressive timeouts, and detailed tracking of timeout-related issues.

## Current Issues

1. Status Tracking Limitations:
- Timeouts don't have specific error categories
- All retry attempts use the same timeout value (10000ms)
- No tracking of timeout durations
- No distinction between timeout vs other failures

2. Current Status Flow:
```
pending -> processing -> completed
                     -> pending (on retry)
                     -> failed (after max retries)
```

## Implementation Plan

### 1. Error Categories

Define specific error categories for better tracking:

```javascript
const ERROR_CATEGORIES = {
  TIMEOUT_10S: 'TIMEOUT_10S',
  TIMEOUT_20S: 'TIMEOUT_20S',
  TIMEOUT_30S: 'TIMEOUT_30S',
  MAX_RETRIES: 'MAX_RETRIES',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR'
};
```

### 2. Progressive Timeout Strategy

Implement increasing timeouts for retry attempts:

```javascript
const TIMEOUT_CONFIG = {
  attempt1: { timeout: 10000, category: ERROR_CATEGORIES.TIMEOUT_10S },
  attempt2: { timeout: 20000, category: ERROR_CATEGORIES.TIMEOUT_20S },
  attempt3: { timeout: 30000, category: ERROR_CATEGORIES.TIMEOUT_30S }
};
```

### 3. Enhanced Metadata Structure

Update the metadata structure to track timeout history:

```javascript
const defaultMetadata = {
  priority: 'normal',
  retryStrategy: {
    maxAttempts: 3,
    backoffMinutes: 5,
    timeoutConfig: TIMEOUT_CONFIG
  },
  timeoutHistory: [],
  errorHistory: []
};
```

### 4. Database Usage

The implementation will utilize existing columns in the sms_batch_log table:

| Column          | Usage                                    |
|-----------------|------------------------------------------|
| status          | Message status (pending, processing, etc) |
| error_message   | Detailed error description               |
| error_category  | Specific error category                  |
| attempts        | Number of retry attempts                 |
| metadata        | JSON with timeout and error history      |

### 5. Error Handling Flow

New error handling process:

1. On Timeout:
   ```javascript
   {
     error_category: TIMEOUT_CONFIG[`attempt${attempts + 1}`].category,
     metadata: {
       timeoutHistory: [
         {
           attempt: attempts + 1,
           timeout: timeoutConfig.timeout,
           timestamp: new Date().toISOString()
         }
       ]
     }
   }
   ```

2. On Other Errors:
   ```javascript
   {
     error_category: determineErrorCategory(error),
     metadata: {
       errorHistory: [
         {
           attempt: attempts + 1,
           category: errorCategory,
           message: error.message,
           timestamp: new Date().toISOString()
         }
       ]
     }
   }
   ```

### 6. Analytics Improvements

New metrics to be tracked:

1. Timeout Statistics:
   - Success rate per timeout duration
   - Average attempts before success
   - Most common timeout durations

2. Error Distribution:
   - Percentage of each error category
   - Timeout vs other errors ratio
   - Success rate after retries

3. Performance Metrics:
   - Average response time per attempt
   - Timeout frequency by time of day
   - Success rate by retry attempt

## Implementation Steps

1. Code Changes:
   - Add error categories and timeout configuration
   - Update message processing logic
   - Enhance error handling and categorization
   - Implement timeout history tracking

2. Testing:
   - Verify timeout progression
   - Validate error categorization
   - Test retry mechanism
   - Check metadata storage

3. Monitoring:
   - Add timeout-specific logging
   - Implement new analytics
   - Create timeout monitoring dashboard

## Expected Benefits

1. Better Error Understanding:
   - Clear categorization of failures
   - Detailed timeout history
   - Better error patterns visibility

2. Improved Success Rates:
   - Progressive timeouts for better completion
   - Optimized retry strategy
   - Reduced false failures

3. Enhanced Monitoring:
   - Detailed timeout analytics
   - Better error tracking
   - Performance pattern identification

## Future Improvements

1. Dynamic Timeout Adjustment:
   - Adjust timeouts based on message size
   - Learn from successful delivery patterns
   - Implement adaptive timeout strategies

2. Advanced Analytics:
   - Predictive timeout modeling
   - Pattern-based optimization
   - Real-time timeout adjustments

3. Error Prevention:
   - Proactive timeout adjustment
   - Load-based retry scheduling
   - Smart queue management
