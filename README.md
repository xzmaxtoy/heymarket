# Heymarket API Endpoint

A Node.js Express API service that provides endpoints for interacting with the Heymarket messaging platform. This service handles message retrieval, customer information, and provides various endpoints for accessing messaging data.

## Features

- Message retrieval by date range with pagination
- Message lookup by phone number
- Advanced customer management:
  * Customizable column visibility
  * Advanced filtering with multiple operators:
    - Contains/Does Not Contain
    - Starts With/Ends With
    - Is Null/Is Not Null
    - Equals/Greater Than/Less Than
    - Between/In List
  * Eastern Time date handling
  * Batch message sending to filtered customers
- Rate limiting and security measures
- CORS support
- Error handling and logging
- Phone number statistics and analytics

## Prerequisites

- Node.js 18.x
- npm or yarn
- Heymarket API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd heymarket-endpoint
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
NODE_ENV=development
HEYMARKET_API_KEY=your_api_key_here
CORS_ORIGIN=http://localhost:3000
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Customer Management

### Customer List Interface
The customer management interface provides a powerful way to view, filter, and manage customer data:

#### Column Visibility
- Customizable column visibility settings
- Settings persist across sessions
- Collapsible column visibility panel
- Support for all customer data fields

#### Advanced Filtering
The interface supports complex filtering with multiple operators:

- Text Fields:
  * Contains
  * Does Not Contain
  * Starts With
  * Ends With
  * Equals
  * Is Null
  * Is Not Null

- Numeric Fields:
  * Equals
  * Greater Than
  * Less Than
  * Between
  * Is Null
  * Is Not Null

- Date Fields (Eastern Time):
  * Equals
  * Greater Than
  * Less Than
  * Between
  * Is Null
  * Is Not Null

#### Batch Messaging
- Select multiple customers based on filters
- Send templated messages to selected customers
- Preview message templates with customer data
- Monitor batch send progress

## API Endpoints

### Batch Operations

#### Create Batch
```
POST /api/messages/batch
```
Create a batch of messages using a template.

Request Body:
```json
{
  "text": "Hello {{name}}, your order {{orderId}} is ready",
  "recipients": [
    {
      "phoneNumber": "1234567890",
      "variables": {
        "name": "John",
        "orderId": "ORD123"
      }
    }
  ],
  "batchId": "MY_BATCH_123",  // Optional: custom batch identifier
  "options": {
    "priority": "normal",     // high: ~8/sec, normal: 5/sec, low: 2/sec
    "retryStrategy": {
      "maxAttempts": 3,
      "backoffMinutes": 1
    }
  }
}
```

Rate Limit Handling:
- Heymarket API Limits:
  * 500 requests per minute maximum
  * Returns 429 status when exceeded
  * Provides retry-after header

- Priority Levels (messages per second):
  * high: ~8/sec (not recommended for large batches)
  * normal: 5/sec (recommended default)
  * low: 2/sec (for very large batches)

- Automatic Rate Limit Handling:
  1. Detects 429 responses from Heymarket
  2. Pauses batch processing for 60 seconds
  3. Retries failed messages with backoff
  4. Logs detailed rate limit information
  5. Provides rate limit status in batch results

- Best Practices:
  * Keep batches under 5000 messages
  * Use "normal" priority for most cases
  * Monitor batch status for rate limits
  * Check error logs for rate limit details
  * Split large batches into smaller chunks

#### Get Batch Status
```
GET /api/batch/:batchId
```
Get the status of a batch operation.

Response:
```json
{
  "success": true,
  "data": {
    "batchId": "batch_123",
    "status": "completed",
    "progress": {
      "total": 1000,
      "pending": 0,
      "processing": 0,
      "completed": 998,
      "failed": 2
    },
    "timing": {
      "created": "2024-12-25T20:09:09.554Z",
      "started": "2024-12-25T20:09:09.555Z",
      "estimated_completion": "2024-12-25T20:09:10.055Z"
    },
    "errors": {
      "categories": {
        "rate_limit": 2,
        "invalid_request": 0,
        "network_error": 0,
        "timeout": 0,
        "unknown": 0
      },
      "samples": [
        {
          "phoneNumber": "1234567890",
          "error": "Rate limit exceeded",
          "category": "rate_limit",
          "status": 429,
          "rateLimitInfo": {
            "limit": "500",
            "remaining": "0",
            "reset": "60"
          },
          "timestamp": "2024-12-25T20:09:09.800Z"
        }
      ]
    },
    "metrics": {
      "messages_per_second": 4.99,
      "success_rate": 99.8,
      "credits_used": 998
    }
  }
}
```

Note: The response includes:
- Detailed progress tracking
- Error categorization and samples
- Rate limit information
- Performance metrics

#### Get Batch Analytics
```
GET /api/batch/:batchId/analytics
```
Get analytics for a batch operation.

#### Get Batch Results
```
GET /api/batch/:batchId/results
```
Get detailed results for each message in the batch.

#### Get Batch Errors
```
GET /api/batch/:batchId/errors
```
Get error details for failed messages in the batch.

### Customer Management API

#### Get Customers
```
GET /api/customers
```
Get customers with advanced filtering.

Query Parameters:
- `filters`: JSON array of filter objects
- `page`: Page number (default: 1)
- `pageSize`: Results per page (default: 50)

Filter Object Format:
```json
{
  "column": "name",
  "operator": "contains",
  "value": "John"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "total": 100,
    "page": 1,
    "pageSize": 50
  }
}
```

### Health Check
```
GET /health
```
Returns the health status of the API.

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-23T20:13:32.942Z"
}
```

### Get Messages by Date Range
```
GET /api/messages/range
```
Query Parameters:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

Response:
```json
{
  "success": true,
  "data": {
    "phoneNumbers": [
      {
        "phoneNumber": "1234567890",
        "messageCount": 5,
        "lastStatus": "delivered"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

### Get Last Message for Phone Number
```
GET /api/messages/:phoneNumber
```
Returns the last message and customer ID for a specific phone number.

Response:
```json
{
  "success": true,
  "data": {
    "customerId": "cust_123",
    "lastMessage": {
      "id": "msg_123",
      "text": "Hello",
      "date": "2024-12-23T20:13:32.942Z",
      "sender": "Agent",
      "status": "delivered",
      "type": "text",
      "channel": "sms"
    },
    "messageStatus": "delivered",
    "totalMessages": 50,
    "phoneNumber": "1234567890"
  }
}
```

### Get All Messages for Phone Number
```
GET /api/messages/:phoneNumber/all
```
Returns all messages for a specific phone number.

Response:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "text": "Hello",
        "date": "2024-12-23T20:13:32.942Z",
        "sender": "Agent",
        "status": "delivered",
        "type": "text",
        "channel": "sms",
        "direction": "outbound",
        "attachments": []
      }
    ],
    "totalMessages": 50,
    "phoneNumber": "1234567890"
  }
}
```

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <your-api-key>
```

Error Response (401):
```json
{
  "success": false,
  "error": "No authorization header"
}
```

## Error Handling

The API uses standard HTTP status codes and consistent error response format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "rateLimitInfo": {  // Present for 429 errors
    "limit": "500",
    "remaining": "0",
    "reset": "60"
  }
}
```

Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 429: Rate Limit Exceeded (Heymarket API)
  * Includes rate limit headers
  * System automatically retries after 60 seconds
  * Detailed rate limit info in response
  * Exponential backoff for repeated rate limits
- 500: Internal Server Error

Rate Limit Error Example:
```json
{
  "success": false,
  "error": "RATE_LIMIT",
  "message": "Too many requests, please try again later",
  "rateLimitInfo": {
    "limit": "500",        // Requests per minute limit
    "remaining": "0",      // Remaining requests
    "reset": "60",         // Seconds until limit resets
    "category": "rate_limit"
  }
}
```

Rate Limit Best Practices:
1. Keep batches under 5000 messages
2. Use "normal" priority (5 msgs/sec) for large batches
3. Monitor rate limit info in batch status/results
4. Allow for automatic retries with backoff

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Rate limit headers included in responses:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining

## Project Structure

```
src/
├── config/
│   └── config.js         # Configuration management
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── error.js         # Error handling middleware
├── models/
│   ├── batch.js         # Batch processing model
│   └── template.js      # Template management model
├── public/
│   ├── customers.html   # Customer management interface
│   ├── customers.js     # Customer management logic
│   └── styles.css       # Tailwind CSS styles
├── routes/
│   ├── admin.js         # Admin routes
│   ├── batch.js         # Batch operation routes
│   ├── customers.js     # Customer management routes
│   ├── messages.js      # Message-related routes
│   └── templates.js     # Template management routes
├── utils/
│   ├── customerManager.js # Customer data management
│   ├── dateUtils.js      # Eastern Time date handling
│   ├── employeeList.js   # Employee management
│   ├── fileCache.js      # File caching utilities
│   ├── messageHistory.js # Message history tracking
│   ├── messageQueue.js   # Message queue management
│   ├── smsAppSettings.js # SMS app configuration
│   └── templateCache.js  # Template caching
└── index.js             # Application entry point
```

## Deployment

### Azure Web App Deployment

1. Login to Azure:
```bash
az login
```

2. Create deployment package:
```bash
npm run build
zip -r deploy.zip . -x "node_modules/*" ".*"
```

3. Deploy using Azure CLI:
```bash
az webapp deployment source config-zip --resource-group bradoriaapi2025group --name heymarket-api --src deploy.zip
```

4. Configure environment variables in Azure:
```bash
az webapp config appsettings set --name heymarket-api --resource-group bradoriaapi2025group --settings NODE_ENV=production HEYMARKET_API_KEY=your-api-key CORS_ORIGIN=your-domain
```

Note: The deployment script is included in package.json for convenience:
```bash
npm run deploy
```

### Current Deployment

The API is currently deployed at:
```
https://heymarket-api-dpbubhdceqb3fvge.canadaeast-01.azurewebsites.net
```

Configuration:
- Region: Canada East
- Runtime: Node.js 18 LTS
- Resource Group: bradoriaapi2025group
- SKU: Free (F1)

## Security Considerations

- HTTPS enforced in production
- API key authentication required
- Rate limiting implemented
- CORS configured for specific origins
- Helmet.js security headers enabled:
  - XSS Protection
  - Content Security Policy
  - Frame Guard
  - HSTS

## Development

### Running Tests
```bash
npm test
```

### Code Style
The project follows standard JavaScript style guidelines with ES modules.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| HEYMARKET_API_KEY | Heymarket API key | - |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential.
