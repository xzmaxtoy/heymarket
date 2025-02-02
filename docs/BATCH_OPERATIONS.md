# Batch Operations

## Overview

The batch operations system handles the creation, monitoring, and management of SMS batch campaigns. It includes variable handling, rate limiting, and real-time status updates.

## Features

### Variable Handling
- Template variable extraction and validation
- Customer-specific variable mapping
- Optimized storage in batch logs
- Variable consistency checks

### Rate Limiting
- Priority-based rate control:
  * High: ~8 messages/second
  * Normal: 5 messages/second
  * Low: 2 messages/second
- Automatic retry with backoff
- Rate limit monitoring and analytics

### Real-time Monitoring
- WebSocket status updates
- Progress tracking
- Error categorization
- Performance metrics

## Implementation Details

### Creating a Batch

```typescript
interface BatchCreate {
  text: string;
  recipients: Array<{
    phoneNumber: string;
    variables: Record<string, string>;
  }>;
  options?: {
    scheduleTime?: string;
    priority?: 'high' | 'normal' | 'low';
    autoStart?: boolean;
  };
}
```

### Batch Status

```typescript
interface BatchStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
  };
  metrics: {
    messagesPerSecond: number;
    successRate: number;
  };
}
```

### Error Handling

- Categorized error tracking
- Automatic retries for recoverable errors
- Detailed error logging
- Rate limit-specific handling

## Best Practices

1. Variable Management
   - Only store variables used in templates
   - Validate variables before batch creation
   - Keep variable names consistent

2. Rate Limiting
   - Use "normal" priority for most batches
   - Split large batches into smaller chunks
   - Monitor rate limit headers

3. Error Handling
   - Implement proper retry strategies
   - Log detailed error information
   - Monitor error patterns

## API Endpoints

### Create Batch
```
POST /api/batch
```

### Get Status
```
GET /api/batch/:id
```

### Get Analytics
```
GET /api/batch/:id/analytics
```

### Get Errors
```
GET /api/batch/:id/errors
