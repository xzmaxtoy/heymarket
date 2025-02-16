# Changelog

## [Unreleased]

### Added
- Enhanced timeout handling with progressive timeouts (10s -> 20s -> 30s)
- Detailed error categorization for message processing
- Timeout history tracking in message metadata
- New error categories for better error tracking:
  * TIMEOUT_10S, TIMEOUT_20S, TIMEOUT_30S
  * API_ERROR, NETWORK_ERROR, AUTH_ERROR
- Improved retry mechanism with attempt-specific timeouts
- Detailed logging of timeout and error patterns

### Changed
- Updated message processing to use progressive timeouts
- Enhanced error tracking with specific categories
- Improved metadata structure for better error history
- Modified retry logic to use attempt-specific configurations

### Fixed
- Issue with timeout errors not being properly categorized
- Problem with all retries using same timeout value
- Missing tracking of timeout durations and patterns

All notable changes to this project will be documented in this file.

## [2.2.2] - 2025-02-02

### Fixed
- Batch message variables now properly use customer-specific data
- Optimized batch log storage to only include used variables
- Fixed duplicate variables in batch creation
- Improved template variable handling efficiency
- Fixed inconsistency between stored and used variables

### Technical Details
- Added template variable extraction utilities
- Updated batch creation to use customer-specific variables
- Optimized Supabase batch log storage
- Improved API payload efficiency
- Enhanced variable logging and tracking in batch processing
- Added variable consistency checks in message creation

## [2.2.1] - 2025-02-02

### Fixed
- Batch status synchronization with Supabase database
- Individual message status updates in batch logs
- Real-time status persistence for batch operations
- Proper error state handling in Supabase records

### Technical Details
- Enhanced WebSocket service to update Supabase on status changes
- Added individual message result tracking in batch state
- Improved error handling for Supabase updates
- Added fallback mechanisms for batch log updates
- Updated batch model to include detailed results in state

## [2.2.0] - 2025-02-02

### Added
- Batch control actions (pause/resume/retry)
- Real-time batch status updates via WebSocket
- Enhanced batch state management
- Progress tracking for paused batches
- Failed message retry functionality

### Technical Details
- Added batch control methods in src/models/batch.js
- Enhanced WebSocket server with batch control events
- Added frontend WebSocket service for batch control
- Implemented state persistence for paused batches
- Added error handling for batch control operations
- Updated batch progress tracking for better accuracy

## [2.1.1] - 2025-01-30

### Fixed
- WebSocket connection issues by properly initializing WebSocket server in backend
- CORS configuration for WebSocket server to allow both frontend development and production URLs
- WebSocket server import in main server file

### Technical Details
- Updated src/websocket/server.js with proper CORS configuration
- Added missing WebSocket server import in src/index.js
- Fixed WebSocket port configuration to match frontend settings

## [2.1.0] - 2024-12-29 (Stable)

### Added
- Improved rate limit handling with Heymarket API
- Custom batch ID support
- Enhanced error reporting with rate limit details
- Automatic retry mechanism with backoff
- Better logging for debugging rate limits

### Changed
- Updated rate limit handling strategy
- Enhanced batch status response with detailed metrics
- Improved documentation with rate limit examples
- Added best practices for batch operations

### Fixed
- Rate limit retry logic
- Error categorization for rate limits
- Batch progress tracking accuracy
- Rate limit header handling

### Technical Details
- Updated src/models/batch.js with improved rate limit handling
- Enhanced error logging in batch operations
- Added rate limit information to API responses
- Updated API documentation with rate limit examples

## [2.1.0-rc.1] - 2024-12-25

### Added
- Message duplicate prevention system
- Employee list integration for duplicate prevention exclusions
- Azure deployment configuration
- Deployment script in package.json

### Fixed
- Batch endpoint routing to support both /api/messages/batch and /api/batch paths
- Phone number formatting (10-digit to 11-digit conversion)
- Batch cleanup timing updated to 1 hour
- Added detailed logging for batch operations

### Changed
- Updated documentation for batch operations
- Enhanced API documentation with phone number format clarification
- Improved deployment instructions

## [2.0.0] - 2024-12-25

### Added
- Batch messaging support with rate limiting
- Template-based messaging system
- File-based template storage
- Support for custom text in batch messages
- Enhanced error handling and retry strategy
- Batch analytics and status tracking
- API documentation in OpenAPI format

### Coming Soon
- Message duplicate prevention system (planned)
- Employee list integration for duplicate prevention exclusions

### Changed
- Restructured project for better modularity
- Enhanced error responses with more details
- Improved logging system

### Technical Details
- Added src/models/template.js for template management
- Added src/models/batch.js for batch processing
- Added src/utils/templateCache.js for file-based storage
- Updated API endpoints for batch operations
- Enhanced authentication middleware

## [1.0.0] - 2024-12-24

### Added
- Initial release
- Basic message sending functionality
- Simple authentication system
- Basic error handling
- Single message endpoint

### Technical Details
- Basic project structure
- Core messaging functionality
- Authentication middleware
- Error handling middleware
