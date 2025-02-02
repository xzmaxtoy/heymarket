#!/bin/bash

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Create version-specific backup directory
VERSION="1.1.0"
BACKUP_VERSION_DIR="$BACKUP_DIR/v$VERSION"
mkdir -p $BACKUP_VERSION_DIR

# Create archive of the entire project
tar --exclude="node_modules" \
    --exclude=".git" \
    --exclude="dist" \
    --exclude="build" \
    --exclude="coverage" \
    --exclude="$BACKUP_DIR" \
    -czf "$BACKUP_VERSION_DIR/heymarket-endpoint_v${VERSION}_${TIMESTAMP}.tar.gz" .

# Backup database (if needed)
# pg_dump your_database > "$BACKUP_VERSION_DIR/database_${TIMESTAMP}.sql"

# Create a manifest file
echo "Backup created on: $(date)" > "$BACKUP_VERSION_DIR/MANIFEST.txt"
echo "Version: $VERSION" >> "$BACKUP_VERSION_DIR/MANIFEST.txt"
echo "Git commit: $(git rev-parse HEAD)" >> "$BACKUP_VERSION_DIR/MANIFEST.txt"
echo "Git branch: $(git rev-parse --abbrev-ref HEAD)" >> "$BACKUP_VERSION_DIR/MANIFEST.txt"
echo -e "\nFiles included:" >> "$BACKUP_VERSION_DIR/MANIFEST.txt"
tar -tvf "$BACKUP_VERSION_DIR/heymarket-endpoint_v${VERSION}_${TIMESTAMP}.tar.gz" >> "$BACKUP_VERSION_DIR/MANIFEST.txt"

echo "Backup completed successfully!"
echo "Backup location: $BACKUP_VERSION_DIR/heymarket-endpoint_v${VERSION}_${TIMESTAMP}.tar.gz"
echo "Manifest file: $BACKUP_VERSION_DIR/MANIFEST.txt"
