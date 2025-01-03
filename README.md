# Heymarket API Endpoint

A Node.js Express API service that provides endpoints for interacting with the Heymarket messaging platform. This service handles message retrieval, customer information, and provides various endpoints for accessing messaging data.

## Features

- Message retrieval by date range with pagination
- Message lookup by phone number
- Customer information integration
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

## API Endpoints

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
  "message": "Detailed error message"
}
```

Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 429: Rate Limit Exceeded
- 500: Internal Server Error

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
├── routes/
│   └── messages.js      # Message-related routes
└── index.js             # Application entry point
```

## Deployment

### Azure Web App Deployment

1. Login to Azure:
```bash
az login
```

2. Deploy the application:
```bash
az webapp up --name heymarket-api --resource-group your-resource-group --runtime "NODE|18-lts" --sku F1 --location your-location
```

3. Configure environment variables in Azure:
```bash
az webapp config appsettings set --name heymarket-api --resource-group your-resource-group --settings NODE_ENV=production HEYMARKET_API_KEY=your-api-key CORS_ORIGIN=your-domain
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
