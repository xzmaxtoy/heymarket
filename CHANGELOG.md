# Changelog

All notable changes to this project will be documented in this file.

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
