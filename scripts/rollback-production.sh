#!/bin/bash

# =============================================================================
# Production Rollback Script for Git Memory MCP Server
# =============================================================================
# Description: Emergency rollback script for production environment
# Author: NEXUS AI Development Team
# Version: 1.0.0
# Usage: ./rollback-production.sh [backup_timestamp]
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/opt/backups/git-memory-mcp-server"
LOG_FILE="/var/log/git-memory-rollback.log"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
MAX_ROLLBACK_ATTEMPTS=3
HEALTH_CHECK_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# =============================================================================
# Notification Functions
# =============================================================================
send_slack_notification() {
    local message="$1"
    local color="$2"
    local title="$3"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$title\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Server\", \"value\": \"$(hostname)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || log_warn "Failed to send Slack notification"
    fi
}

send_email_alert() {
    local subject="$1"
    local body="$2"
    
    if command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" "${ALERT_EMAIL:-admin@comdee.co.th}" || log_warn "Failed to send email alert"
    fi
}

# =============================================================================
# Utility Functions
# =============================================================================
check_prerequisites() {
    log_info "${BLUE}Checking prerequisites...${NC}"
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "git" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check if backup directory exists
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

get_current_version() {
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        jq -r '.version' "$PROJECT_ROOT/package.json"
    else
        echo "unknown"
    fi
}

get_available_backups() {
    find "$BACKUP_DIR" -name "backup_*" -type d | sort -r | head -10
}

select_backup() {
    local backup_timestamp="$1"
    
    if [[ -n "$backup_timestamp" ]]; then
        local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
        if [[ -d "$backup_path" ]]; then
            echo "$backup_path"
            return 0
        else
            log_error "Backup not found: $backup_path"
            return 1
        fi
    fi
    
    log_info "Available backups:"
    local backups=()
    while IFS= read -r -d '' backup; do
        backups+=("$backup")
        local backup_name=$(basename "$backup")
        local backup_date=$(echo "$backup_name" | sed 's/backup_//' | sed 's/_/ /g')
        log_info "  - $backup_name ($backup_date)"
    done < <(find "$BACKUP_DIR" -name "backup_*" -type d -print0 | sort -rz)
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        log_error "No backups available"
        return 1
    fi
    
    # Use the most recent backup
    echo "${backups[0]}"
}

# =============================================================================
# Health Check Functions
# =============================================================================
check_service_health() {
    local service_name="$1"
    local max_attempts=30
    local attempt=1
    
    log_info "Checking health of service: $service_name"
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps "$service_name" | grep -q "Up"; then
            log_success "Service $service_name is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Service $service_name not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Service $service_name failed health check"
    return 1
}

check_application_health() {
    local max_attempts=30
    local attempt=1
    
    log_info "Checking application health..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/health" >/dev/null 2>&1; then
            log_success "Application is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Application not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Application failed health check"
    return 1
}

check_database_health() {
    log_info "Checking database connectivity..."
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
        log_success "Database is healthy"
        return 0
    else
        log_error "Database health check failed"
        return 1
    fi
}

# =============================================================================
# Rollback Functions
# =============================================================================
stop_services() {
    log_info "${YELLOW}Stopping current services...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Graceful shutdown
    docker-compose -f docker-compose.prod.yml stop || {
        log_warn "Graceful stop failed, forcing shutdown..."
        docker-compose -f docker-compose.prod.yml kill
    }
    
    # Remove containers
    docker-compose -f docker-compose.prod.yml rm -f
    
    log_success "Services stopped"
}

restore_application_code() {
    local backup_path="$1"
    
    log_info "${YELLOW}Restoring application code...${NC}"
    
    # Backup current state
    local current_backup="$BACKUP_DIR/rollback_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$current_backup"
    
    # Copy current application files
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='logs' \
        "$PROJECT_ROOT/" "$current_backup/app/" || {
        log_error "Failed to backup current application state"
        return 1
    }
    
    # Restore application files from backup
    if [[ -d "$backup_path/app" ]]; then
        rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='logs' \
            "$backup_path/app/" "$PROJECT_ROOT/" || {
            log_error "Failed to restore application files"
            return 1
        }
    else
        log_error "Application backup not found in: $backup_path/app"
        return 1
    fi
    
    log_success "Application code restored"
}

restore_database() {
    local backup_path="$1"
    
    log_info "${YELLOW}Restoring database...${NC}"
    
    # Check if database backup exists
    if [[ ! -f "$backup_path/database.sql" ]]; then
        log_warn "Database backup not found, skipping database restore"
        return 0
    fi
    
    # Start only database service
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml up -d postgres
    
    # Wait for database to be ready
    sleep 30
    
    # Drop and recreate database
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;"
    
    # Restore database
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$backup_path/database.sql" || {
        log_error "Failed to restore database"
        return 1
    }
    
    log_success "Database restored"
}

restore_redis() {
    local backup_path="$1"
    
    log_info "${YELLOW}Restoring Redis data...${NC}"
    
    # Check if Redis backup exists
    if [[ ! -f "$backup_path/redis.rdb" ]]; then
        log_warn "Redis backup not found, skipping Redis restore"
        return 0
    fi
    
    # Start only Redis service
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml up -d redis
    
    # Wait for Redis to be ready
    sleep 10
    
    # Stop Redis to restore data
    docker-compose -f docker-compose.prod.yml stop redis
    
    # Copy backup file
    docker cp "$backup_path/redis.rdb" "$(docker-compose -f docker-compose.prod.yml ps -q redis):/data/dump.rdb" || {
        log_error "Failed to restore Redis data"
        return 1
    }
    
    # Restart Redis
    docker-compose -f docker-compose.prod.yml start redis
    
    log_success "Redis data restored"
}

start_services() {
    log_info "${YELLOW}Starting services...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Start all services
    docker-compose -f docker-compose.prod.yml up -d || {
        log_error "Failed to start services"
        return 1
    }
    
    # Wait for services to be ready
    sleep 30
    
    log_success "Services started"
}

verify_rollback() {
    log_info "${BLUE}Verifying rollback...${NC}"
    
    # Check service health
    local services=("postgres" "redis" "git-memory-app" "nginx")
    for service in "${services[@]}"; do
        check_service_health "$service" || return 1
    done
    
    # Check application health
    check_application_health || return 1
    
    # Check database connectivity
    check_database_health || return 1
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    local endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3000/api/v1/version"
        "http://localhost:3000/api/v1/auth/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -f -s "$endpoint" >/dev/null 2>&1; then
            log_error "API endpoint failed: $endpoint"
            return 1
        fi
    done
    
    log_success "Rollback verification completed successfully"
}

# =============================================================================
# Main Rollback Function
# =============================================================================
perform_rollback() {
    local backup_timestamp="${1:-}"
    local attempt=1
    
    while [[ $attempt -le $MAX_ROLLBACK_ATTEMPTS ]]; do
        log_info "${BLUE}Starting rollback attempt $attempt/$MAX_ROLLBACK_ATTEMPTS...${NC}"
        
        # Select backup
        local backup_path
        backup_path=$(select_backup "$backup_timestamp") || {
            log_error "Failed to select backup"
            return 1
        }
        
        log_info "Using backup: $backup_path"
        
        # Perform rollback steps
        if stop_services && \
           restore_application_code "$backup_path" && \
           restore_database "$backup_path" && \
           restore_redis "$backup_path" && \
           start_services && \
           verify_rollback; then
            
            log_success "${GREEN}Rollback completed successfully!${NC}"
            
            # Send success notification
            send_slack_notification \
                "Rollback completed successfully on attempt $attempt" \
                "good" \
                "🔄 Production Rollback Success"
            
            return 0
        else
            log_error "Rollback attempt $attempt failed"
            ((attempt++))
            
            if [[ $attempt -le $MAX_ROLLBACK_ATTEMPTS ]]; then
                log_info "Retrying rollback in 30 seconds..."
                sleep 30
            fi
        fi
    done
    
    log_error "${RED}All rollback attempts failed!${NC}"
    
    # Send failure notification
    send_slack_notification \
        "All rollback attempts failed after $MAX_ROLLBACK_ATTEMPTS tries" \
        "danger" \
        "🚨 Production Rollback Failed"
    
    send_email_alert \
        "CRITICAL: Production Rollback Failed" \
        "All rollback attempts have failed. Manual intervention required immediately."
    
    return 1
}

# =============================================================================
# Main Script
# =============================================================================
main() {
    local backup_timestamp="${1:-}"
    
    echo -e "${BLUE}"
    echo "============================================================================="
    echo "                    Git Memory MCP Server - Emergency Rollback"
    echo "============================================================================="
    echo -e "${NC}"
    
    log_info "Starting emergency rollback process..."
    log_info "Current version: $(get_current_version)"
    log_info "Backup timestamp: ${backup_timestamp:-auto-select}"
    
    # Send start notification
    send_slack_notification \
        "Emergency rollback process started" \
        "warning" \
        "🔄 Production Rollback Started"
    
    # Check prerequisites
    check_prerequisites
    
    # Perform rollback
    if perform_rollback "$backup_timestamp"; then
        log_success "${GREEN}Emergency rollback completed successfully!${NC}"
        
        # Log final status
        log_info "Final version: $(get_current_version)"
        log_info "Services status:"
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps
        
        exit 0
    else
        log_error "${RED}Emergency rollback failed!${NC}"
        log_error "Manual intervention required immediately"
        
        exit 1
    fi
}

# =============================================================================
# Script Entry Point
# =============================================================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Trap signals for cleanup
    trap 'log_error "Rollback interrupted by signal"; exit 130' INT TERM
    
    # Create log file if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Run main function
    main "$@"
fi