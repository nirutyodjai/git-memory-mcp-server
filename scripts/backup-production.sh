#!/bin/bash

# Git Memory MCP Server - Production Backup Script
# This script performs comprehensive backups of the production environment
# Usage: ./backup-production.sh [full|incremental|database|files]

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
fi

# Backup configuration
BACKUP_TYPE=${1:-"full"}
BACKUP_BASE_DIR="/var/backups/git-memory"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_DATE}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
COMPRESSION_LEVEL=6

# Database configuration
DB_HOST=${DATABASE_HOST:-"localhost"}
DB_PORT=${DATABASE_PORT:-"5432"}
DB_NAME=${DATABASE_NAME:-"git_memory_prod"}
DB_USER=${DATABASE_USER:-"git_memory_app"}
DB_PASSWORD=${DATABASE_PASSWORD}

# S3 configuration (optional)
S3_BUCKET=${BACKUP_S3_BUCKET:-""}
S3_REGION=${BACKUP_S3_REGION:-"us-east-1"}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-""}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-""}

# Notification configuration
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
EMAIL_RECIPIENT=${BACKUP_EMAIL_RECIPIENT:-""}

# Application directories
APP_DIR="/opt/git-memory-mcp-server"
LOGS_DIR="/var/log/git-memory"
CONFIG_DIR="/etc/git-memory"
SSL_DIR="/etc/ssl/git-memory"

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${BACKUP_BASE_DIR}/backup.log"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${BACKUP_BASE_DIR}/backup.log" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "${BACKUP_BASE_DIR}/backup.log"
}

# =============================================================================
# Notification Functions
# =============================================================================

send_slack_notification() {
    local message="$1"
    local color="$2"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Git Memory Backup\",
                    \"text\": \"$message\",
                    \"footer\": \"Production Server\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
}

send_email_notification() {
    local subject="$1"
    local message="$2"
    
    if [ -n "$EMAIL_RECIPIENT" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$EMAIL_RECIPIENT" || true
    fi
}

# =============================================================================
# Utility Functions
# =============================================================================

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check required commands
    local required_commands=("pg_dump" "tar" "gzip" "docker")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    mkdir -p "${BACKUP_BASE_DIR}/logs"
    
    # Check disk space (require at least 5GB free)
    local available_space=$(df "$BACKUP_BASE_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 5242880 ]; then  # 5GB in KB
        log_error "Insufficient disk space. At least 5GB required."
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

get_backup_size() {
    local path="$1"
    if [ -f "$path" ]; then
        du -h "$path" | cut -f1
    elif [ -d "$path" ]; then
        du -sh "$path" | cut -f1
    else
        echo "0B"
    fi
}

# =============================================================================
# Database Backup Functions
# =============================================================================

backup_database() {
    log "Starting database backup..."
    
    local db_backup_file="${BACKUP_DIR}/database_${BACKUP_DATE}.sql"
    local db_backup_compressed="${db_backup_file}.gz"
    
    # Set PostgreSQL password
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create database dump
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-owner --no-privileges --create --clean \
        --format=plain > "$db_backup_file"; then
        
        # Compress the dump
        gzip -"$COMPRESSION_LEVEL" "$db_backup_file"
        
        local backup_size=$(get_backup_size "$db_backup_compressed")
        log_success "Database backup completed: $backup_size"
        
        # Verify backup integrity
        if gzip -t "$db_backup_compressed"; then
            log_success "Database backup integrity verified"
        else
            log_error "Database backup integrity check failed"
            return 1
        fi
    else
        log_error "Database backup failed"
        return 1
    fi
    
    # Backup database statistics
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "\copy (SELECT * FROM monitoring.get_db_stats()) TO '${BACKUP_DIR}/db_stats_${BACKUP_DATE}.csv' WITH CSV HEADER" || true
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "\copy (SELECT * FROM monitoring.get_table_stats()) TO '${BACKUP_DIR}/table_stats_${BACKUP_DATE}.csv' WITH CSV HEADER" || true
    
    unset PGPASSWORD
}

# =============================================================================
# Application Files Backup Functions
# =============================================================================

backup_application_files() {
    log "Starting application files backup..."
    
    local app_backup_file="${BACKUP_DIR}/application_${BACKUP_DATE}.tar.gz"
    
    # Create application backup
    if tar -czf "$app_backup_file" \
        -C "$(dirname "$APP_DIR")" \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='tmp' \
        --exclude='.git' \
        "$(basename "$APP_DIR")"; then
        
        local backup_size=$(get_backup_size "$app_backup_file")
        log_success "Application files backup completed: $backup_size"
    else
        log_error "Application files backup failed"
        return 1
    fi
}

backup_configuration_files() {
    log "Starting configuration files backup..."
    
    local config_backup_file="${BACKUP_DIR}/configuration_${BACKUP_DATE}.tar.gz"
    
    # Backup configuration files
    tar -czf "$config_backup_file" \
        -C / \
        --exclude='*.key' \
        --exclude='*password*' \
        etc/nginx \
        etc/ssl/git-memory \
        etc/systemd/system/git-memory* \
        opt/git-memory-mcp-server/config \
        opt/git-memory-mcp-server/.env.production 2>/dev/null || true
    
    local backup_size=$(get_backup_size "$config_backup_file")
    log_success "Configuration files backup completed: $backup_size"
}

backup_logs() {
    log "Starting logs backup..."
    
    local logs_backup_file="${BACKUP_DIR}/logs_${BACKUP_DATE}.tar.gz"
    
    # Backup recent logs (last 7 days)
    find "$LOGS_DIR" -name "*.log" -mtime -7 -type f | \
        tar -czf "$logs_backup_file" -T - 2>/dev/null || true
    
    # Backup Docker logs
    docker logs git-memory-app > "${BACKUP_DIR}/docker_app_${BACKUP_DATE}.log" 2>&1 || true
    docker logs git-memory-nginx > "${BACKUP_DIR}/docker_nginx_${BACKUP_DATE}.log" 2>&1 || true
    docker logs git-memory-postgres > "${BACKUP_DIR}/docker_postgres_${BACKUP_DATE}.log" 2>&1 || true
    docker logs git-memory-redis > "${BACKUP_DIR}/docker_redis_${BACKUP_DATE}.log" 2>&1 || true
    
    local backup_size=$(get_backup_size "$logs_backup_file")
    log_success "Logs backup completed: $backup_size"
}

# =============================================================================
# Docker Backup Functions
# =============================================================================

backup_docker_volumes() {
    log "Starting Docker volumes backup..."
    
    local volumes_backup_file="${BACKUP_DIR}/docker_volumes_${BACKUP_DATE}.tar.gz"
    
    # Get list of Docker volumes
    local volumes=$(docker volume ls -q | grep git-memory || true)
    
    if [ -n "$volumes" ]; then
        # Create temporary container to backup volumes
        docker run --rm \
            -v "${BACKUP_DIR}:/backup" \
            $(echo "$volumes" | sed 's/^/-v /; s/$/:/data\/&:ro/') \
            alpine:latest \
            tar -czf "/backup/docker_volumes_${BACKUP_DATE}.tar.gz" -C /data . || true
        
        local backup_size=$(get_backup_size "$volumes_backup_file")
        log_success "Docker volumes backup completed: $backup_size"
    else
        log "No Docker volumes found to backup"
    fi
}

backup_docker_images() {
    log "Starting Docker images backup..."
    
    local images_backup_file="${BACKUP_DIR}/docker_images_${BACKUP_DATE}.tar"
    
    # Get list of Git Memory related images
    local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep git-memory || true)
    
    if [ -n "$images" ]; then
        docker save $images > "$images_backup_file"
        gzip "$images_backup_file"
        
        local backup_size=$(get_backup_size "${images_backup_file}.gz")
        log_success "Docker images backup completed: $backup_size"
    else
        log "No Docker images found to backup"
    fi
}

# =============================================================================
# SSL Certificates Backup
# =============================================================================

backup_ssl_certificates() {
    log "Starting SSL certificates backup..."
    
    local ssl_backup_file="${BACKUP_DIR}/ssl_certificates_${BACKUP_DATE}.tar.gz"
    
    if [ -d "$SSL_DIR" ]; then
        tar -czf "$ssl_backup_file" -C "$(dirname "$SSL_DIR")" "$(basename "$SSL_DIR")"
        
        local backup_size=$(get_backup_size "$ssl_backup_file")
        log_success "SSL certificates backup completed: $backup_size"
    else
        log "SSL directory not found: $SSL_DIR"
    fi
}

# =============================================================================
# Cloud Storage Upload
# =============================================================================

upload_to_s3() {
    if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log "Starting upload to S3..."
        
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION="$S3_REGION"
        
        # Upload backup directory to S3
        if command -v aws >/dev/null 2>&1; then
            aws s3 sync "$BACKUP_DIR" "s3://${S3_BUCKET}/backups/${BACKUP_DATE}/" \
                --storage-class STANDARD_IA \
                --delete || log_error "S3 upload failed"
            
            log_success "Backup uploaded to S3: s3://${S3_BUCKET}/backups/${BACKUP_DATE}/"
        else
            log_error "AWS CLI not found, skipping S3 upload"
        fi
        
        unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION
    fi
}

# =============================================================================
# Cleanup Functions
# =============================================================================

cleanup_old_backups() {
    log "Starting cleanup of old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "[0-9]*" -mtime +"$RETENTION_DAYS" -exec rm -rf {} \; || true
    
    # Remove old log files
    find "${BACKUP_BASE_DIR}/logs" -name "*.log" -mtime +"$RETENTION_DAYS" -delete || true
    
    # Cleanup S3 old backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
        aws s3 ls "s3://${S3_BUCKET}/backups/" | \
            awk '{print $2}' | \
            while read -r backup_date; do
                if [ -n "$backup_date" ]; then
                    backup_timestamp=$(date -d "${backup_date%/}" +%s 2>/dev/null || echo 0)
                    current_timestamp=$(date +%s)
                    age_days=$(( (current_timestamp - backup_timestamp) / 86400 ))
                    
                    if [ "$age_days" -gt "$RETENTION_DAYS" ]; then
                        aws s3 rm "s3://${S3_BUCKET}/backups/${backup_date}" --recursive || true
                        log "Removed old S3 backup: ${backup_date}"
                    fi
                fi
            done
    fi
    
    log_success "Cleanup completed"
}

# =============================================================================
# Backup Verification
# =============================================================================

verify_backup() {
    log "Starting backup verification..."
    
    local verification_passed=true
    
    # Check if backup directory exists and is not empty
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR")" ]; then
        log_error "Backup directory is empty or doesn't exist"
        verification_passed=false
    fi
    
    # Verify database backup
    if [ -f "${BACKUP_DIR}/database_${BACKUP_DATE}.sql.gz" ]; then
        if ! gzip -t "${BACKUP_DIR}/database_${BACKUP_DATE}.sql.gz"; then
            log_error "Database backup is corrupted"
            verification_passed=false
        fi
    else
        log_error "Database backup file not found"
        verification_passed=false
    fi
    
    # Verify application backup
    if [ -f "${BACKUP_DIR}/application_${BACKUP_DATE}.tar.gz" ]; then
        if ! tar -tzf "${BACKUP_DIR}/application_${BACKUP_DATE}.tar.gz" >/dev/null 2>&1; then
            log_error "Application backup is corrupted"
            verification_passed=false
        fi
    fi
    
    if [ "$verification_passed" = true ]; then
        log_success "Backup verification passed"
        return 0
    else
        log_error "Backup verification failed"
        return 1
    fi
}

# =============================================================================
# Main Backup Functions
# =============================================================================

perform_full_backup() {
    log "Starting full backup..."
    
    backup_database
    backup_application_files
    backup_configuration_files
    backup_logs
    backup_docker_volumes
    backup_docker_images
    backup_ssl_certificates
    
    log_success "Full backup completed"
}

perform_incremental_backup() {
    log "Starting incremental backup..."
    
    # For incremental, we backup only changed files in the last 24 hours
    local incremental_backup_file="${BACKUP_DIR}/incremental_${BACKUP_DATE}.tar.gz"
    
    find "$APP_DIR" -mtime -1 -type f | \
        tar -czf "$incremental_backup_file" -T - 2>/dev/null || true
    
    backup_database
    backup_logs
    
    log_success "Incremental backup completed"
}

perform_database_backup() {
    log "Starting database-only backup..."
    backup_database
    log_success "Database backup completed"
}

perform_files_backup() {
    log "Starting files-only backup..."
    backup_application_files
    backup_configuration_files
    backup_ssl_certificates
    log_success "Files backup completed"
}

# =============================================================================
# Main Script Logic
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    log "=== Git Memory MCP Server Backup Started ==="
    log "Backup type: $BACKUP_TYPE"
    log "Backup directory: $BACKUP_DIR"
    
    # Check prerequisites
    check_prerequisites
    
    # Perform backup based on type
    case "$BACKUP_TYPE" in
        "full")
            perform_full_backup
            ;;
        "incremental")
            perform_incremental_backup
            ;;
        "database")
            perform_database_backup
            ;;
        "files")
            perform_files_backup
            ;;
        *)
            log_error "Invalid backup type: $BACKUP_TYPE"
            echo "Usage: $0 [full|incremental|database|files]"
            exit 1
            ;;
    esac
    
    # Verify backup
    if verify_backup; then
        # Upload to cloud storage
        upload_to_s3
        
        # Cleanup old backups
        cleanup_old_backups
        
        # Calculate backup size and duration
        local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Create backup summary
        cat > "${BACKUP_DIR}/backup_summary.txt" << EOF
Git Memory MCP Server Backup Summary
====================================
Backup Type: $BACKUP_TYPE
Backup Date: $(date -d @$start_time)
Backup Size: $backup_size
Duration: ${duration}s
Status: SUCCESS
Location: $BACKUP_DIR
S3 Location: ${S3_BUCKET:+s3://$S3_BUCKET/backups/$BACKUP_DATE/}
Retention: $RETENTION_DAYS days
EOF
        
        log_success "=== Backup completed successfully ==="
        log "Backup size: $backup_size"
        log "Duration: ${duration}s"
        
        # Send success notification
        send_slack_notification "✅ Backup completed successfully\nType: $BACKUP_TYPE\nSize: $backup_size\nDuration: ${duration}s" "good"
        send_email_notification "Git Memory Backup Success" "Backup completed successfully. Type: $BACKUP_TYPE, Size: $backup_size, Duration: ${duration}s"
        
    else
        log_error "=== Backup failed ==="
        
        # Send failure notification
        send_slack_notification "❌ Backup failed\nType: $BACKUP_TYPE\nCheck logs for details" "danger"
        send_email_notification "Git Memory Backup Failed" "Backup failed. Type: $BACKUP_TYPE. Check logs for details."
        
        exit 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Handle script interruption
trap 'log_error "Backup interrupted"; exit 1' INT TERM

# Run main function
main "$@"

exit 0