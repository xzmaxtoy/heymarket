# Backup System Documentation

## Overview

This document outlines the backup system for the Heymarket Endpoint project. The system provides automated backups for each release version and includes both code and relevant configuration files.

## Backup Structure

```
backups/
├── v{VERSION}/                    # Version-specific directory (e.g., v1.1.0)
│   ├── MANIFEST.txt              # Backup manifest with metadata
│   └── heymarket-endpoint_v{VERSION}_{TIMESTAMP}.tar.gz  # Backup archive
└── {DATE}.tar.gz                 # Daily backups (if configured)
```

## Backup Script

The backup system uses `scripts/backup.sh` to create version-specific backups. The script:

1. Creates timestamped archives
2. Excludes unnecessary files (node_modules, .git, etc.)
3. Generates a manifest file with metadata
4. Organizes backups by version

### Usage

```bash
# Create a backup for current version
./scripts/backup.sh

# The script will:
# 1. Create version directory if it doesn't exist
# 2. Generate backup archive
# 3. Create manifest file
# 4. Output backup location
```

### Manifest File

Each backup includes a MANIFEST.txt file containing:
- Backup creation timestamp
- Version number
- Git commit hash
- Git branch
- List of included files

## Excluded Files

The following are excluded from backups:
- node_modules/
- .git/
- dist/
- build/
- coverage/
- Previous backups

## Backup Contents

Each backup archive contains:
1. Source Code
   - Frontend React application
   - Backend Node.js server
   - API routes and models
   - Utility functions

2. Configuration
   - Environment configurations
   - TypeScript configurations
   - Build settings
   - Database schemas

3. Documentation
   - API documentation
   - Implementation guides
   - System architecture docs
   - Changelog

## Restore Process

To restore from a backup:

1. Extract the archive:
   ```bash
   tar -xzf backups/v{VERSION}/heymarket-endpoint_v{VERSION}_{TIMESTAMP}.tar.gz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify the restoration:
   - Check git status
   - Verify file integrity
   - Test key functionality

## Best Practices

1. Version Control
   - Always create backups before major updates
   - Tag releases in git before backup
   - Include version number in backup name

2. Backup Verification
   - Check manifest file for completeness
   - Verify archive integrity
   - Test restoration process periodically

3. Backup Management
   - Keep at least 3 previous versions
   - Document any manual changes
   - Verify backup contents regularly

4. Security
   - Store backups in secure location
   - Encrypt sensitive data
   - Restrict backup access

## Example Backup Flow

1. Pre-release:
   ```bash
   # Tag release
   git tag -a v1.1.0 -m "Release version 1.1.0"
   
   # Create backup
   ./scripts/backup.sh
   ```

2. Verify backup:
   ```bash
   # Check manifest
   cat backups/v1.1.0/MANIFEST.txt
   
   # List archive contents
   tar -tvf backups/v1.1.0/heymarket-endpoint_v1.1.0_{TIMESTAMP}.tar.gz
   ```

3. Document backup:
   ```bash
   # Add backup details to changelog
   echo "- Created backup v1.1.0" >> CHANGELOG.md
   ```

## Troubleshooting

1. Missing Files
   - Check excluded patterns in backup script
   - Verify file permissions
   - Check for .gitignore conflicts

2. Restore Failures
   - Verify version compatibility
   - Check for missing dependencies
   - Validate environment configuration

3. Space Issues
   - Clean old backups
   - Verify disk space
   - Check file sizes

## Maintenance

1. Regular Tasks
   - Remove old backups
   - Verify backup integrity
   - Update backup documentation

2. Monitoring
   - Check backup sizes
   - Monitor backup success/failure
   - Track restore tests

3. Updates
   - Review exclusion patterns
   - Update backup script
   - Maintain documentation

## Recovery Scenarios

1. Full System Recovery
   ```bash
   # Extract latest backup
   tar -xzf backups/v1.1.0/heymarket-endpoint_v1.1.0_latest.tar.gz
   
   # Install dependencies
   npm install
   
   # Verify system
   npm test
   ```

2. Partial Recovery
   ```bash
   # Extract specific files
   tar -xzf backup.tar.gz --strip-components=1 path/to/files
   ```

3. Configuration Recovery
   ```bash
   # Extract config files only
   tar -xzf backup.tar.gz --strip-components=1 "*.json" "*.config.js"
