#!/bin/bash

# Production startup script for Git Memory MCP Server
# This script handles database migrations, health checks, and graceful startup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="git-memory-mcp-server"
LOG_FILE="logs/production.log"
PID_FILE="/tmp/${APP_NAME}.pid"
HEALTH_CHECK_URL="http://localhost:${PORT:-3000}/health"
MAX_STARTUP_TIME=120
HEALTH_CHECK_INTERVAL=5

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR")
            echo -e "${RED}[$timestamp] ERROR: $message${NC}" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] WARN: $message${NC}" | tee -a "$LOG_FILE"
            ;;
        "INFO")
            echo -e "${BLUE}[$timestamp] INFO: $message${NC}" | tee -a "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[$timestamp] SUCCESS: $message${NC}" | tee -a "$LOG_FILE"
            ;;
        *)
            echo "[$timestamp] $level: $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Error handler
error_handler() {
    local exit_code=$?
    local line_number=$1
    log "ERROR" "Script failed at line $line_number with exit code $exit_code"
    
    # Cleanup on error
    if [[ -f "$PID_FILE" ]]; then
        rm -f "$PID_FILE"
    fi
    
    exit $exit_code
}

# Set error trap
trap 'error_handler $LINENO' ERR

# Graceful shutdown handler
shutdown_handler() {
    log "INFO" "Received shutdown signal, gracefully stopping application..."
    
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Stopping process $pid"
            kill -TERM "$pid"
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [[ $count -lt 30 ]]; do
                sleep 1
                ((count++))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                log "WARN" "Force killing process $pid"
                kill -KILL "$pid"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    log "SUCCESS" "Application stopped gracefully"
    exit 0
}

# Set shutdown trap
trap shutdown_handler SIGTERM SIGINT

# Pre-flight checks
pre_flight_checks() {
    log "INFO" "Running pre-flight checks..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log "ERROR" "Do not run this application as root for security reasons"
        exit 1
    fi
    
    # Check required environment variables
    local required_vars=("NODE_ENV" "DATABASE_URL")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log "ERROR" "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if port is available
    local port=${PORT:-3000}
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        log "ERROR" "Port $port is already in use"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p logs data/git-repos data/backups
    
    # Check disk space (minimum 1GB)
    local available_space=$(df . | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 1048576 ]]; then
        log "WARN" "Low disk space: $(($available_space / 1024))MB available"
    fi
    
    log "SUCCESS" "Pre-flight checks completed"
}

# Database setup
setup_database() {
    log "INFO" "Setting up database..."
    
    # Run database migrations
    if ! npx prisma migrate deploy; then
        log "ERROR" "Database migration failed"
        exit 1
    fi
    
    # Generate Prisma client (in case of version mismatch)
    if ! npx prisma generate; then
        log "ERROR" "Prisma client generation failed"
        exit 1
    fi
    
    log "SUCCESS" "Database setup completed"
}

# Health check function
health_check() {
    local url=$1
    local timeout=${2:-10}
    
    if command -v curl >/dev/null 2>&1; then
        curl -f -s --max-time "$timeout" "$url" >/dev/null
    elif command -v wget >/dev/null 2>&1; then
        wget -q --timeout="$timeout" -O /dev/null "$url"
    else
        log "ERROR" "Neither curl nor wget is available for health checks"
        return 1
    fi
}

# Wait for application to be ready
wait_for_ready() {
    log "INFO" "Waiting for application to be ready..."
    
    local start_time=$(date +%s)
    local current_time
    local elapsed_time
    
    while true; do
        current_time=$(date +%s)
        elapsed_time=$((current_time - start_time))
        
        if [[ $elapsed_time -gt $MAX_STARTUP_TIME ]]; then
            log "ERROR" "Application failed to start within $MAX_STARTUP_TIME seconds"
            return 1
        fi
        
        if health_check "$HEALTH_CHECK_URL" 5; then
            log "SUCCESS" "Application is ready and responding to health checks"
            return 0
        fi
        
        log "INFO" "Waiting for application... (${elapsed_time}s elapsed)"
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Start application
start_application() {
    log "INFO" "Starting $APP_NAME in production mode..."
    
    # Start the application in background
    node dist/index.js &
    local app_pid=$!
    
    # Save PID
    echo $app_pid > "$PID_FILE"
    
    log "INFO" "Application started with PID $app_pid"
    
    # Wait for application to be ready
    if ! wait_for_ready; then
        log "ERROR" "Application startup failed"
        if kill -0 "$app_pid" 2>/dev/null; then
            kill -TERM "$app_pid"
        fi
        rm -f "$PID_FILE"
        exit 1
    fi
    
    # Monitor application
    monitor_application "$app_pid"
}

# Monitor application health
monitor_application() {
    local app_pid=$1
    log "INFO" "Monitoring application health..."
    
    while true; do
        # Check if process is still running
        if ! kill -0 "$app_pid" 2>/dev/null; then
            log "ERROR" "Application process $app_pid has died"
            rm -f "$PID_FILE"
            exit 1
        fi
        
        # Check application health
        if ! health_check "$HEALTH_CHECK_URL" 10; then
            log "WARN" "Health check failed, but process is still running"
        fi
        
        sleep 30
    done
}

# Main execution
main() {
    log "INFO" "Starting production deployment of $APP_NAME"
    log "INFO" "Node.js version: $(node --version)"
    log "INFO" "Environment: ${NODE_ENV:-development}"
    log "INFO" "Port: ${PORT:-3000}"
    
    # Run startup sequence
    pre_flight_checks
    setup_database
    start_application
}

# Execute main function
main "$@"