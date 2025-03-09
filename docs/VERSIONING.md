# Version Management

## Overview

The project maintains separate changelogs for frontend and backend components to ensure clear tracking of changes and independent versioning.

## Structure

### Backend Changelog
Located at `/CHANGELOG.md`:
- Backend API changes
- Database schema updates
- Server configuration changes
- Performance improvements
- Security updates

### Frontend Changelog
Located at `/frontend/CHANGELOG.md`:
- UI/UX improvements
- Component updates
- State management changes
- Frontend performance optimizations
- Client-side feature additions

## Version Numbering

Both frontend and backend use semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features, backward-compatible
- PATCH: Bug fixes, backward-compatible

## Synchronization

While versions are tracked separately, some features require coordination:
- API changes should note required frontend version
- Frontend changes should note minimum backend version
- Major releases should reference related changes in the other component

## Example

Backend CHANGELOG.md:
```markdown
## [2.2.2] - 2025-02-02
- Enhanced batch variable handling
- Optimized batch log storage
Note: Requires frontend version >= 2.2.0
```

Frontend CHANGELOG.md:
```markdown
## [2.2.0] - 2025-02-02
- Updated variable handling UI
- Added template preview
Note: Requires backend version >= 2.2.2
