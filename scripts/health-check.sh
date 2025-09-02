#!/bin/bash

# =============================================================================
# Git Memory MCP Server - Production Health Check Script
# =============================================================================
# Description: Comprehensive health check for production deployment
# Author: NEXUS AI Development Team
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/health-check.log"
CONFIG_FILE="${PROJECT_ROOT}/config/production.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
MAX_RETRIES=5
RETRY_DELAY=2
TIMEOUT=10

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Command '$1' not found. Please install it first."
        return 1
    fi
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_basic_health() {
    log_info "Checking basic application health..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s --max-time $TIMEOUT "$HEALTH_CHECK_URL" > /dev/null; then
            log_success "✓ Application is responding to health checks"
            return 0
        fi
        
        retries=$((retries + 1))
        log_warning "Health check failed (attempt $retries/$MAX_RETRIES)"
        
        if [ $retries -lt $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "✗ Application health check failed after $MAX_RETRIES attempts"
    return 1
}

check_api_endpoints() {
    log_info "Checking critical API endpoints..."
    
    local endpoints=(
        "/health"
        "/api/v1/status"
        "/api/v1/mcp/servers"
        "/api/v1/auth/status"
    )
    
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        local url="${API_BASE_URL%/api/v1}${endpoint}"
        
        if curl -f -s --max-time $TIMEOUT "$url" > /dev/null; then
            log_success "✓ Endpoint $endpoint is accessible"
        else
            log_error "✗ Endpoint $endpoint is not accessible"
            failed_endpoints+=("$endpoint")
        fi
    done
    
    if [ ${#failed_endpoints[@]} -eq 0 ]; then
        log_success "All API endpoints are healthy"
        return 0
    else
        log_error "Failed endpoints: ${failed_endpoints[*]}"
        return 1
    fi
}

check_database_connection() {
    log_info "Checking database connection..."
    
    # Check if we can connect to the database
    if curl -f -s --max-time $TIMEOUT "${API_BASE_URL}/health/database" > /dev/null; then
        log_success "✓ Database connection is healthy"
        return 0
    else
        log_error "✗ Database connection failed"
        return 1
    fi
}

check_redis_connection() {
    log_info "Checking Redis connection..."
    
    # Check if we can connect to Redis
    if curl -f -s --max-time $TIMEOUT "${API_BASE_URL}/health/redis" > /dev/null; then
        log_success "✓ Redis connection is healthy"
        return 0
    else
        log_error "✗ Redis connection failed"
        return 1
    fi
}

check_mcp_servers() {
    log_info "Checking MCP servers status..."
    
    local response
    if response=$(curl -f -s --max-time $TIMEOUT "${API_BASE_URL}/mcp/servers/status"); then
        local active_servers=$(echo "$response" | jq -r '.active_servers // 0' 2>/dev/null || echo "0")
        local total_servers=$(echo "$response" | jq -r '.total_servers // 0' 2>/dev/null || echo "0")
        
        if [ "$active_servers" -gt 0 ]; then
            log_success "✓ MCP servers are running ($active_servers/$total_servers active)"
            return 0
        else
            log_warning "⚠ No active MCP servers found"
            return 1
        fi
    else
        log_error "✗ Failed to get MCP servers status"
        return 1
    fi
}

check_system_resources() {
    log_info "Checking system resources..."
    
    # Check CPU usage
    local cpu_usage
    if command -v top &> /dev/null; then
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' || echo "0")
        if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo 0) )); then
            log_warning "⚠ High CPU usage: ${cpu_usage}%"
        else
            log_success "✓ CPU usage is normal: ${cpu_usage}%"
        fi
    fi
    
    # Check memory usage
    local mem_usage
    if command -v free &> /dev/null; then
        mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        if (( $(echo "$mem_usage > 80" | bc -l 2>/dev/null || echo 0) )); then
            log_warning "⚠ High memory usage: ${mem_usage}%"
        else
            log_success "✓ Memory usage is normal: ${mem_usage}%"
        fi
    fi
    
    # Check disk usage
    local disk_usage
    if command -v df &> /dev/null; then
        disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        if [ "$disk_usage" -gt 80 ]; then
            log_warning "⚠ High disk usage: ${disk_usage}%"
        else
            log_success "✓ Disk usage is normal: ${disk_usage}%"
        fi
    fi
}

check_ssl_certificate() {
    log_info "Checking SSL certificate..."
    
    local domain="${DOMAIN:-localhost}"
    
    if [ "$domain" != "localhost" ]; then
        local cert_info
        if cert_info=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
            local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 30 ]; then
                log_warning "⚠ SSL certificate expires in $days_until_expiry days"
            else
                log_success "✓ SSL certificate is valid (expires in $days_until_expiry days)"
            fi
        else
            log_error "✗ Failed to check SSL certificate"
            return 1
        fi
    else
        log_info "Skipping SSL check for localhost"
    fi
}

check_log_errors() {
    log_info "Checking for recent errors in logs..."
    
    local app_log="${PROJECT_ROOT}/logs/app.log"
    local error_log="${PROJECT_ROOT}/logs/error.log"
    
    local error_count=0
    
    # Check application logs for errors in the last hour
    if [ -f "$app_log" ]; then
        local recent_errors
        recent_errors=$(grep -c "ERROR\|FATAL" "$app_log" | tail -100 || echo "0")
        if [ "$recent_errors" -gt 10 ]; then
            log_warning "⚠ Found $recent_errors recent errors in application log"
            error_count=$((error_count + recent_errors))
        fi
    fi
    
    # Check error logs
    if [ -f "$error_log" ]; then
        local recent_errors
        recent_errors=$(wc -l < "$error_log" | tail -50 || echo "0")
        if [ "$recent_errors" -gt 5 ]; then
            log_warning "⚠ Found $recent_errors entries in error log"
            error_count=$((error_count + recent_errors))
        fi
    fi
    
    if [ "$error_count" -eq 0 ]; then
        log_success "✓ No significant errors found in logs"
    else
        log_warning "⚠ Total error indicators: $error_count"
    fi
}

check_performance_metrics() {
    log_info "Checking performance metrics..."
    
    # Check response time
    local response_time
    if response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time $TIMEOUT "$HEALTH_CHECK_URL"); then
        local response_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null || echo "0")
        
        if (( $(echo "$response_time > 1.0" | bc -l 2>/dev/null || echo 0) )); then
            log_warning "⚠ Slow response time: ${response_ms}ms"
        else
            log_success "✓ Response time is good: ${response_ms}ms"
        fi
    else
        log_error "✗ Failed to measure response time"
        return 1
    fi
}

# =============================================================================
# Main Health Check Function
# =============================================================================

run_health_checks() {
    log_info "Starting comprehensive health check..."
    log_info "Timestamp: $(date)"
    log_info "Health Check URL: $HEALTH_CHECK_URL"
    log_info "API Base URL: $API_BASE_URL"
    
    local failed_checks=()
    local total_checks=0
    
    # Array of check functions
    local checks=(
        "check_basic_health"
        "check_api_endpoints"
        "check_database_connection"
        "check_redis_connection"
        "check_mcp_servers"
        "check_system_resources"
        "check_ssl_certificate"
        "check_log_errors"
        "check_performance_metrics"
    )
    
    # Run all checks
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        log_info "Running $check..."
        
        if ! $check; then
            failed_checks+=("$check")
        fi
        
        echo "" # Add spacing between checks
    done
    
    # Summary
    log_info "Health check summary:"
    log_info "Total checks: $total_checks"
    log_info "Failed checks: ${#failed_checks[@]}"
    
    if [ ${#failed_checks[@]} -eq 0 ]; then
        log_success "🎉 All health checks passed!"
        return 0
    else
        log_error "❌ Failed checks: ${failed_checks[*]}"
        return 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

main() {
    # Check required commands
    check_command "curl" || exit 1
    
    # Create logs directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Load environment variables if config file exists
    if [ -f "$CONFIG_FILE" ]; then
        # shellcheck source=/dev/null
        source "$CONFIG_FILE"
    fi
    
    # Run health checks
    if run_health_checks; then
        log_success "Health check completed successfully"
        exit 0
    else
        log_error "Health check failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show version information"
        echo "  --quiet, -q    Run in quiet mode"
        echo "  --verbose, -V  Run in verbose mode"
        exit 0
        ;;
    --version|-v)
        echo "Git Memory MCP Server Health Check v1.0.0"
        exit 0
        ;;
    --quiet|-q)
        exec > /dev/null 2>&1
        ;;
    --verbose|-V)
        set -x
        ;;
esac

# Run main function
main "$@"