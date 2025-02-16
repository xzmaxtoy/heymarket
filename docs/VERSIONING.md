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

## Branch Management

### Primary Branches
- `master`: The main production branch containing stable code
- `develop`: Integration branch for feature development
- `stable-v1`: Stable version branch for v1.x maintenance

### Special Branches
- `archive/master-deprecated`: Historical reference of old master branch
- `backup/pre-optimization`: Backup branch for major optimizations
- `rollback-v2.1.0`: Recovery point for version 2.1.0

### Feature Branches
- Created from: `master` or `develop`
- Naming convention: `feature/<feature-name>`
- Merged back to: `master` after review
- Deleted after: successful merge and deployment

### Fix Branches
- Created from: `master`
- Naming convention: `fix/<issue-name>`
- Merged back to: `master`
- Deleted after: successful merge and deployment

### Branch Cleanup
- Regular cleanup of merged feature branches
- Preservation of important historical branches
- Maintenance of clean and organized repository structure

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
