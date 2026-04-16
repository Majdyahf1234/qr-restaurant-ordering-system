#!/bin/sh

# Database Backup Script
# This script creates a backup of the PostgreSQL database

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="restaurant_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Create backup
PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
  -h ${POSTGRES_HOST} \
  -U ${POSTGRES_USER} \
  -d ${POSTGRES_DB} \
  -F p \
  -f ${BACKUP_DIR}/${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "restaurant_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
