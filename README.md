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

### Batch Processing System
- Concurrent message processing (5 at a time)
- Paginated message fetching (1000 per page)
- Complete batch processing for any size
- Real-time progress tracking
- Pause/Resume functionality:
  * Pause in-progress batches
  * Complete in-flight messages
  * Resume from last position
  * Progress preservation
  * Auth-aware resumption

Detailed feature documentation:
- [Batch Operations Guide](docs/BATCH_OPERATIONS.md)
- [Customer Management Guide](docs/CUSTOMER_MANAGEMENT.md)
- [Template System Guide](docs/TEMPLATE_SYSTEM.md)

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

frontend/
├── src/
│   ├── features/        # Feature-based components
│   │   ├── analytics/   # Analytics components
│   │   ├── batches/    # Batch management
│   │   ├── customers/  # Customer management
│   │   └── templates/  # Template management
│   ├── services/       # API services
│   ├── store/          # Redux store
│   └── utils/          # Utilities
└── public/             # Static assets
```

## Documentation

- [API Documentation](api-docs.yaml)
- [Frontend Architecture](FRONTEND_ARCHITECTURE.md)
- [Version Management](docs/VERSIONING.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## Changelogs
- [Backend Changelog](CHANGELOG.md)
- [Frontend Changelog](frontend/CHANGELOG.md)

## Latest Updates (v2.3.0)

### Batch Processing Improvements
- Enhanced message queue system:
  * Complete processing of all messages
  * Paginated fetching (1000 per page)
  * Concurrent processing (5 at a time)
  * Real-time progress tracking
  * Accurate completion verification

### New Features
- Pause/Resume functionality:
  * Pause in-progress batches
  * Complete in-flight messages
  * Resume from last position
  * Progress preservation
  * Auth-aware resumption

### Optimizations
- Improved batch variable handling
- Enhanced batch log storage
- Better template system integration
- Real-time status updates
- Advanced error tracking
- Caching improvements

## License

This project is proprietary and confidential.
