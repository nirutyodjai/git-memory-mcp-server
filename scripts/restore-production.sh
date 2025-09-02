#!/bin/bash

# Git Memory MCP Server - Production Restore Script
# This script restores the production environment from backups
# Usage: ./restore-production.sh <backup_date> [database|files|full]

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_date> [database|files|full]"
    echo "Example: $0 20240115_143022 full"
    echo "Available backups:"
    ls -la /var/backups/git-memory/ 2>/dev/null | grep "^d" | awk '{print $9}' | grep -E "^[0-9]{8}_[0-9]{6}$" || echo "No backups found"
    exit 1
fi

BACKUP_DATE="$1"
RESTORE_TYPE="${2:-full}"

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
fi

# Backup and restore configuration
BACKUP_BASE_DIR="/var/backups/git-memory"
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_DATE}"
RESTORE_LOG="${BACKUP_BASE_DIR}/restore_$(date +"%Y%m%d_%H%M%S").log"

# Database configuration
DB_HOST=${DATABASE_HOST:-"localhost"}
DB_PORT=${DATABASE_PORT:-"5432"}
DB_NAME=${DATABASE_NAME:-"git_memory_prod"}
DB_USER=${DATABASE_USER:-"git_memory_app"}
DB_PASSWORD=${DATABASE_PASSWORD}

# Application directories
APP_DIR="/opt/git-memory-mcp-server"
LOGS_DIR="/var/log/git-memory"
CONFIG_DIR="/etc/git-memory"
SSL_DIR="/etc/ssl/git-memory"

# S3 configuration (optional)
S3_BUCKET=${BACKUP_S3_BUCKET:-""}
S3_REGION=${BACKUP_S3_REGION:-"us-east-1"}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-""}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-""}

# Notification configuration
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
EMAIL_RECIPIENT=${BACKUP_EMAIL_RECIPIENT:-""}

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$RESTORE_LOG"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$RESTORE_LOG" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$RESTORE_LOG"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" | tee -a "$RESTORE_LOG"
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
                    \"title\": \"Git Memory Restore\",
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
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        
        # Try to download from S3 if configured
        if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
            log "Attempting to download backup from S3..."
            download_from_s3
        else
            exit 1
        fi
    fi
    
    # Check required commands
    local required_commands=("psql" "pg_restore" "tar" "gzip" "docker")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    log_success "Prerequisites check completed"
}

confirm_restore() {
    echo
    echo "⚠️  WARNING: This will restore the production environment from backup!"
    echo "Backup Date: $BACKUP_DATE"
    echo "Restore Type: $RESTORE_TYPE"
    echo "Target Environment: Production"
    echo
    echo "This operation will:"
    
    case "$RESTORE_TYPE" in
        "full")
            echo "  - Stop all services"
            echo "  - Restore database (DESTRUCTIVE)"
            echo "  - Restore application files"
            echo "  - Restore configuration files"
            echo "  - Restore SSL certificates"
            echo "  - Restart all services"
            ;;
        "database")
            echo "  - Stop database-dependent services"
            echo "  - Restore database (DESTRUCTIVE)"
            echo "  - Restart services"
            ;;
        "files")
            echo "  - Stop application services"
            echo "  - Restore application files"
            echo "  - Restore configuration files"
            echo "  - Restart services"
            ;;
    esac
    
    echo
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled by user"
        exit 0
    fi
    
    echo
    read -p "Type 'RESTORE' to confirm: " -r
    if [[ $REPLY != "RESTORE" ]]; then
        log "Restore cancelled - confirmation failed"
        exit 0
    fi
    
    log "Restore confirmed by user"
}

# =============================================================================
# S3 Download Function
# =============================================================================

download_from_s3() {
    if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log "Downloading backup from S3..."
        
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION="$S3_REGION"
        
        # Create backup directory
        mkdir -p "$BACKUP_DIR"
        
        # Download backup from S3
        if aws s3 sync "s3://${S3_BUCKET}/backups/${BACKUP_DATE}/" "$BACKUP_DIR/"; then
            log_success "Backup downloaded from S3"
        else
            log_error "Failed to download backup from S3"
            exit 1
        fi
        
        unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION
    else
        log_error "S3 configuration not found"
        exit 1
    fi
}

# =============================================================================
# Service Management Functions
# =============================================================================

stop_services() {
    log "Stopping services..."
    
    # Stop Docker Compose services
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml down || true
    fi
    
    # Stop systemd services
    systemctl stop git-memory-app || true
    systemctl stop nginx || true
    
    log_success "Services stopped"
}

start_services() {
    log "Starting services..."
    
    # Start Docker Compose services
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml up -d
    fi
    
    # Start systemd services
    systemctl start nginx || true
    
    # Wait for services to be ready
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Services started"
}

check_service_health() {
    log "Checking service health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:8080/health >/dev/null 2>&1; then
            log_success "Application is healthy"
            return 0
        fi
        
        log "Waiting for application to be ready... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    log_warning "Application health check failed after $max_attempts attempts"
    return 1
}

# =============================================================================
# Database Restore Functions
# =============================================================================

restore_database() {
    log "Starting database restore..."
    
    local db_backup_file="${BACKUP_DIR}/database_${BACKUP_DATE}.sql.gz"
    
    if [ ! -f "$db_backup_file" ]; then
        log_error "Database backup file not found: $db_backup_file"
        return 1
    fi
    
    # Verify backup integrity
    if ! gzip -t "$db_backup_file"; then
        log_error "Database backup file is corrupted"
        return 1
    fi
    
    # Set PostgreSQL password
    export PGPASSWORD="$DB_PASSWORD"
    
    # Stop services that depend on database
    log "Stopping database-dependent services..."
    docker-compose -f docker-compose.production.yml stop git-memory-app || true
    
    # Create database backup before restore (safety measure)
    local safety_backup="${BACKUP_BASE_DIR}/pre_restore_$(date +"%Y%m%d_%H%M%S").sql"
    log "Creating safety backup before restore..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$safety_backup" || true
    
    # Terminate existing connections
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" || true
    
    # Drop and recreate database
    log "Dropping and recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
    
    # Restore database
    log "Restoring database from backup..."
    if gunzip -c "$db_backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log_success "Database restore completed"
    else
        log_error "Database restore failed"
        
        # Attempt to restore from safety backup
        log "Attempting to restore from safety backup..."
        if [ -f "$safety_backup" ]; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
                -c "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
            
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$safety_backup" || true
            log_warning "Restored from safety backup"
        fi
        
        unset PGPASSWORD
        return 1
    fi
    
    # Verify database restore
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    if [ "$table_count" -gt 0 ]; then
        log_success "Database verification passed: $table_count tables found"
    else
        log_error "Database verification failed: no tables found"
        unset PGPASSWORD
        return 1
    fi
    
    unset PGPASSWORD
}

# =============================================================================
# Files Restore Functions
# =============================================================================

restore_application_files() {
    log "Starting application files restore..."
    
    local app_backup_file="${BACKUP_DIR}/application_${BACKUP_DATE}.tar.gz"
    
    if [ ! -f "$app_backup_file" ]; then
        log_error "Application backup file not found: $app_backup_file"
        return 1
    fi
    
    # Verify backup integrity
    if ! tar -tzf "$app_backup_file" >/dev/null 2>&1; then
        log_error "Application backup file is corrupted"
        return 1
    fi
    
    # Create backup of current application
    if [ -d "$APP_DIR" ]; then
        local current_backup="${BACKUP_BASE_DIR}/current_app_$(date +"%Y%m%d_%H%M%S").tar.gz"
        log "Backing up current application to: $current_backup"
        tar -czf "$current_backup" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")" || true
    fi
    
    # Extract application files
    log "Extracting application files..."
    if tar -xzf "$app_backup_file" -C "$(dirname "$APP_DIR")"; then
        log_success "Application files restore completed"
    else
        log_error "Application files restore failed"
        return 1
    fi
    
    # Set proper permissions
    chown -R git-memory:git-memory "$APP_DIR" || true
    chmod -R 755 "$APP_DIR" || true
}

restore_configuration_files() {
    log "Starting configuration files restore..."
    
    local config_backup_file="${BACKUP_DIR}/configuration_${BACKUP_DATE}.tar.gz"
    
    if [ ! -f "$config_backup_file" ]; then
        log_warning "Configuration backup file not found: $config_backup_file"
        return 0
    fi
    
    # Verify backup integrity
    if ! tar -tzf "$config_backup_file" >/dev/null 2>&1; then
        log_error "Configuration backup file is corrupted"
        return 1
    fi
    
    # Create backup of current configuration
    local current_config_backup="${BACKUP_BASE_DIR}/current_config_$(date +"%Y%m%d_%H%M%S").tar.gz"
    log "Backing up current configuration..."
    tar -czf "$current_config_backup" \
        /etc/nginx \
        /etc/ssl/git-memory \
        /etc/systemd/system/git-memory* \
        "$APP_DIR/config" \
        "$APP_DIR/.env.production" 2>/dev/null || true
    
    # Extract configuration files
    log "Extracting configuration files..."
    if tar -xzf "$config_backup_file" -C /; then
        log_success "Configuration files restore completed"
    else
        log_error "Configuration files restore failed"
        return 1
    fi
    
    # Reload systemd if service files were restored
    systemctl daemon-reload || true
}

restore_ssl_certificates() {
    log "Starting SSL certificates restore..."
    
    local ssl_backup_file="${BACKUP_DIR}/ssl_certificates_${BACKUP_DATE}.tar.gz"
    
    if [ ! -f "$ssl_backup_file" ]; then
        log_warning "SSL certificates backup file not found: $ssl_backup_file"
        return 0
    fi
    
    # Verify backup integrity
    if ! tar -tzf "$ssl_backup_file" >/dev/null 2>&1; then
        log_error "SSL certificates backup file is corrupted"
        return 1
    fi
    
    # Create backup of current SSL certificates
    if [ -d "$SSL_DIR" ]; then
        local current_ssl_backup="${BACKUP_BASE_DIR}/current_ssl_$(date +"%Y%m%d_%H%M%S").tar.gz"
        log "Backing up current SSL certificates..."
        tar -czf "$current_ssl_backup" -C "$(dirname "$SSL_DIR")" "$(basename "$SSL_DIR")" || true
    fi
    
    # Extract SSL certificates
    log "Extracting SSL certificates..."
    if tar -xzf "$ssl_backup_file" -C "$(dirname "$SSL_DIR")"; then
        log_success "SSL certificates restore completed"
        
        # Set proper permissions
        chown -R root:ssl-cert "$SSL_DIR" || true
        chmod -R 640 "$SSL_DIR"/*.pem || true
        chmod -R 644 "$SSL_DIR"/*.crt || true
    else
        log_error "SSL certificates restore failed"
        return 1
    fi
}

restore_docker_volumes() {
    log "Starting Docker volumes restore..."
    
    local volumes_backup_file="${BACKUP_DIR}/docker_volumes_${BACKUP_DATE}.tar.gz"
    
    if [ ! -f "$volumes_backup_file" ]; then
        log_warning "Docker volumes backup file not found: $volumes_backup_file"
        return 0
    fi
    
    # Stop Docker services
    docker-compose -f docker-compose.production.yml down || true
    
    # Remove existing volumes
    docker volume ls -q | grep git-memory | xargs -r docker volume rm || true
    
    # Recreate volumes
    docker-compose -f docker-compose.production.yml up --no-start
    
    # Restore volume data
    log "Restoring Docker volumes..."
    docker run --rm \
        -v "${BACKUP_DIR}:/backup" \
        $(docker volume ls -q | grep git-memory | sed 's/^/-v /; s/$/:/data\/&/') \
        alpine:latest \
        tar -xzf "/backup/docker_volumes_${BACKUP_DATE}.tar.gz" -C /data || true
    
    log_success "Docker volumes restore completed"
}

# =============================================================================
# Main Restore Functions
# =============================================================================

perform_full_restore() {
    log "Starting full restore..."
    
    stop_services
    
    restore_database
    restore_application_files
    restore_configuration_files
    restore_ssl_certificates
    restore_docker_volumes
    
    start_services
    
    log_success "Full restore completed"
}

perform_database_restore() {
    log "Starting database-only restore..."
    
    restore_database
    
    # Restart services that depend on database
    docker-compose -f docker-compose.production.yml up -d git-memory-app
    
    check_service_health
    
    log_success "Database restore completed"
}

perform_files_restore() {
    log "Starting files-only restore..."
    
    stop_services
    
    restore_application_files
    restore_configuration_files
    restore_ssl_certificates
    
    start_services
    
    log_success "Files restore completed"
}

# =============================================================================
# Post-Restore Verification
# =============================================================================

verify_restore() {
    log "Starting restore verification..."
    
    local verification_passed=true
    
    # Check application health
    if ! check_service_health; then
        log_error "Application health check failed"
        verification_passed=false
    fi
    
    # Check database connectivity
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Database connectivity verified"
    else
        log_error "Database connectivity check failed"
        verification_passed=false
    fi
    unset PGPASSWORD
    
    # Check critical endpoints
    local endpoints=(
        "http://localhost:8080/health"
        "http://localhost:8080/api/v1/status"
        "https://gitmemory.comdee.co.th/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" >/dev/null 2>&1; then
            log_success "Endpoint verified: $endpoint"
        else
            log_warning "Endpoint check failed: $endpoint"
        fi
    done
    
    if [ "$verification_passed" = true ]; then
        log_success "Restore verification passed"
        return 0
    else
        log_error "Restore verification failed"
        return 1
    fi
}

# =============================================================================
# Main Script Logic
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    log "=== Git Memory MCP Server Restore Started ==="
    log "Backup date: $BACKUP_DATE"
    log "Restore type: $RESTORE_TYPE"
    log "Backup directory: $BACKUP_DIR"
    
    # Check prerequisites
    check_prerequisites
    
    # Confirm restore operation
    confirm_restore
    
    # Send start notification
    send_slack_notification "🔄 Starting restore operation\nBackup: $BACKUP_DATE\nType: $RESTORE_TYPE" "warning"
    
    # Perform restore based on type
    case "$RESTORE_TYPE" in
        "full")
            perform_full_restore
            ;;
        "database")
            perform_database_restore
            ;;
        "files")
            perform_files_restore
            ;;
        *)
            log_error "Invalid restore type: $RESTORE_TYPE"
            echo "Usage: $0 <backup_date> [database|files|full]"
            exit 1
            ;;
    esac
    
    # Verify restore
    if verify_restore; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Create restore summary
        cat > "${BACKUP_BASE_DIR}/restore_summary_$(date +"%Y%m%d_%H%M%S").txt" << EOF
Git Memory MCP Server Restore Summary
=====================================
Restore Type: $RESTORE_TYPE
Backup Date: $BACKUP_DATE
Restore Date: $(date -d @$start_time)
Duration: ${duration}s
Status: SUCCESS
Backup Location: $BACKUP_DIR
Restore Log: $RESTORE_LOG
EOF
        
        log_success "=== Restore completed successfully ==="
        log "Duration: ${duration}s"
        
        # Send success notification
        send_slack_notification "✅ Restore completed successfully\nBackup: $BACKUP_DATE\nType: $RESTORE_TYPE\nDuration: ${duration}s" "good"
        send_email_notification "Git Memory Restore Success" "Restore completed successfully. Backup: $BACKUP_DATE, Type: $RESTORE_TYPE, Duration: ${duration}s"
        
    else
        log_error "=== Restore failed ==="
        
        # Send failure notification
        send_slack_notification "❌ Restore failed\nBackup: $BACKUP_DATE\nType: $RESTORE_TYPE\nCheck logs for details" "danger"
        send_email_notification "Git Memory Restore Failed" "Restore failed. Backup: $BACKUP_DATE, Type: $RESTORE_TYPE. Check logs for details."
        
        exit 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Handle script interruption
trap 'log_error "Restore interrupted"; exit 1' INT TERM

# Run main function
main "$@"

exit 0