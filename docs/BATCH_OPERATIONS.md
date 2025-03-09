# Batch Operations

## Overview

The batch operations system handles the creation, monitoring, and management of SMS batch campaigns. It includes variable handling, rate limiting, real-time status updates, and pause/resume functionality.

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

### Message Queue Processing
- Concurrent processing (5 messages at a time)
- Paginated message fetching (1000 per page)
- Complete batch processing regardless of size
- Real-time progress updates
- Efficient caching system

### Pause/Resume Functionality
- Pause in-progress batches
- Complete in-flight messages
- Preserve progress state
- Resume from last position
- Auth-aware resumption

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
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed';
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
  pauseInfo?: {
    pauseTime: string;
    resumeTime?: string;
  };
}
```

### Message Queue Processing

The message queue system:
- Processes messages in concurrent chunks (this.concurrency = 5)
- Fetches messages in pages of 1000
- Continues until all messages are processed
- Maintains accurate progress tracking
- Supports pause/resume operations

Example processing flow:
1. Batch created with N messages
2. Messages added to queue in pages of 1000
3. Processing starts with 5 concurrent messages
4. Progress tracked in real-time
5. Continues until all N messages complete

### Pause/Resume Implementation

The pause system:
1. Database Schema:
   - pause_time: Timestamp when batch was paused
   - resume_time: Timestamp when batch was resumed
   - status: Includes 'paused' state

2. Backend Components:
   - BatchManager: Handles database state
   - MessageQueue: Controls message processing
   - API endpoints: Manages pause/resume requests

3. Frontend Features:
   - Pause button in BatchActions
   - Visual paused state
   - Resume capability
   - Progress preservation

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

4. Batch Processing
   - Monitor progress for large batches
   - Use pause feature for control
   - Verify final completion
   - Check error logs

## API Endpoints

### Create Batch
```
POST /api/batch
```

### Get Status
```
GET /api/batch/:id
```

### Pause Batch
```
POST /api/v2/batch/:id/pause
```

### Resume Batch
```
POST /api/v2/batch/:id/resume
```

### Get Analytics
```
GET /api/batch/:id/analytics
```

### Get Errors
```
GET /api/batch/:id/errors
```

## Verification Steps

1. Batch Creation:
   - Check total message count
   - Verify database records
   - Monitor initial queue setup

2. Processing:
   - Watch progress bar (shows total count)
   - Monitor console logs for page fetching
   - Check completion status

3. Pause/Resume:
   - Verify in-flight completion
   - Check paused state
   - Confirm progress preservation
   - Test resume functionality

4. Completion:
   - Verify all messages processed
   - Check final status
   - Review error logs
   - Validate analytics data
