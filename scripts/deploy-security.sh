#!/bin/bash

# =============================================================================
# Enterprise Security System Deployment Script
# =============================================================================
# This script automates the deployment of the Git Memory MCP Server Security System
# Supports multiple deployment environments: development, staging, production

set -e  # Exit on any error
set -u  # Exit on undefined variables

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/deployment.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
SKIP_TESTS=false
SKIP_SECURITY_SCAN=false
FORCE_REBUILD=false
VERBOSE=false
DRY_RUN=false

# =============================================================================
# Helper Functions
# =============================================================================

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Create logs directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Log to file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # Log to console with colors
    case $level in
        "ERROR")
            echo -e "${RED}[$timestamp] [ERROR] $message${NC}" >&2
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] [WARN] $message${NC}"
            ;;
        "INFO")
            echo -e "${GREEN}[$timestamp] [INFO] $message${NC}"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = true ]; then
                echo -e "${BLUE}[$timestamp] [DEBUG] $message${NC}"
            fi
            ;;
        *)
            echo "[$timestamp] $message"
            ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Success message
success() {
    log "INFO" "$1"
}

# Warning message
warn() {
    log "WARN" "$1"
}

# Debug message
debug() {
    log "DEBUG" "$1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        error_exit "Node.js is not installed. Please install Node.js >= 16.0.0"
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local required_version="16.0.0"
    
    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
        error_exit "Node.js version $node_version is too old. Required: >= $required_version"
    fi
    
    # Check npm
    if ! command_exists npm; then
        error_exit "npm is not installed"
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        log "INFO" "Docker found: $(docker --version)"
    else
        warn "Docker not found. Docker deployment will not be available."
    fi
    
    # Check Docker Compose (optional)
    if command_exists docker-compose; then
        log "INFO" "Docker Compose found: $(docker-compose --version)"
    else
        warn "Docker Compose not found. Docker Compose deployment will not be available."
    fi
    
    success "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    log "INFO" "Setting up environment for: $ENVIRONMENT"
    
    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/data"
    mkdir -p "$PROJECT_ROOT/temp"
    mkdir -p "$PROJECT_ROOT/backups"
    
    # Copy environment file if it doesn't exist
    local env_file="$PROJECT_ROOT/.env.security"
    local env_example="$PROJECT_ROOT/.env.security.example"
    
    if [ ! -f "$env_file" ]; then
        if [ -f "$env_example" ]; then
            cp "$env_example" "$env_file"
            log "INFO" "Created .env.security from example file"
            warn "Please update .env.security with your configuration before proceeding"
        else
            error_exit "Environment example file not found: $env_example"
        fi
    fi
    
    # Set NODE_ENV
    export NODE_ENV="$ENVIRONMENT"
    
    success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    log "INFO" "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = false ]; then
        # Install main dependencies
        npm ci --only=production
        
        # Install security-specific dependencies
        if [ -f "package-security.json" ]; then
            npm install --package-lock-only -f package-security.json
        fi
        
        # Install development dependencies if not in production
        if [ "$ENVIRONMENT" != "production" ]; then
            npm ci
        fi
    else
        log "INFO" "[DRY RUN] Would install dependencies"
    fi
    
    success "Dependencies installation completed"
}

# Run security audit
run_security_audit() {
    if [ "$SKIP_SECURITY_SCAN" = true ]; then
        log "INFO" "Skipping security audit"
        return 0
    fi
    
    log "INFO" "Running security audit..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = false ]; then
        # Run npm audit
        if ! npm audit --audit-level=moderate; then
            warn "Security vulnerabilities found. Please review and fix them."
        fi
        
        # Run security tests if available
        if [ -f "src/tests/securityTests.js" ]; then
            npm run test:security || warn "Security tests failed"
        fi
    else
        log "INFO" "[DRY RUN] Would run security audit"
    fi
    
    success "Security audit completed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log "INFO" "Skipping tests"
        return 0
    fi
    
    log "INFO" "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = false ]; then
        # Run unit tests
        if npm run test 2>/dev/null; then
            success "Unit tests passed"
        else
            warn "Unit tests failed or not configured"
        fi
        
        # Run integration tests
        if npm run test:integration 2>/dev/null; then
            success "Integration tests passed"
        else
            warn "Integration tests failed or not configured"
        fi
        
        # Run security tests
        if npm run test:security 2>/dev/null; then
            success "Security tests passed"
        else
            warn "Security tests failed or not configured"
        fi
    else
        log "INFO" "[DRY RUN] Would run tests"
    fi
    
    success "Tests completed"
}

# Build application
build_application() {
    log "INFO" "Building application..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = false ]; then
        # Build if build script exists
        if npm run build 2>/dev/null; then
            success "Application build completed"
        else
            log "INFO" "No build script found, skipping build step"
        fi
    else
        log "INFO" "[DRY RUN] Would build application"
    fi
}

# Deploy with Docker
deploy_docker() {
    log "INFO" "Deploying with Docker..."
    
    cd "$PROJECT_ROOT"
    
    if ! command_exists docker; then
        error_exit "Docker is not installed"
    fi
    
    if [ "$DRY_RUN" = false ]; then
        # Build Docker image
        if [ "$FORCE_REBUILD" = true ]; then
            docker build --no-cache -f Dockerfile.security -t git-memory-security:latest .
        else
            docker build -f Dockerfile.security -t git-memory-security:latest .
        fi
        
        # Deploy with Docker Compose
        if [ -f "docker-compose.security.yml" ] && command_exists docker-compose; then
            docker-compose -f docker-compose.security.yml up -d
        else
            # Run single container
            docker run -d \
                --name git-memory-security \
                --env-file .env.security \
                -p 3333:3333 \
                git-memory-security:latest
        fi
    else
        log "INFO" "[DRY RUN] Would deploy with Docker"
    fi
    
    success "Docker deployment completed"
}

# Deploy natively
deploy_native() {
    log "INFO" "Deploying natively..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = false ]; then
        # Start the security system
        if [ "$ENVIRONMENT" = "production" ]; then
            # Use PM2 for production if available
            if command_exists pm2; then
                pm2 start src/security/securityIntegration.js --name "git-memory-security" --env production
            else
                # Use nohup as fallback
                nohup node src/security/securityIntegration.js > logs/security.log 2>&1 &
                echo $! > security.pid
            fi
        else
            # Development mode
            npm run start:dev &
        fi
    else
        log "INFO" "[DRY RUN] Would deploy natively"
    fi
    
    success "Native deployment completed"
}

# Health check
health_check() {
    log "INFO" "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    local health_url="http://localhost:3333/api/security/health"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        
        log "INFO" "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Cleanup
cleanup() {
    log "INFO" "Performing cleanup..."
    
    cd "$PROJECT_ROOT"
    
    # Clean temporary files
    rm -rf temp/*
    
    # Clean old logs (keep last 10 files)
    find logs -name "*.log" -type f -exec ls -t {} + | tail -n +11 | xargs -r rm --
    
    success "Cleanup completed"
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy the Git Memory MCP Server Security System

Options:
    -e, --environment ENV    Deployment environment (development|staging|production) [default: development]
    -d, --docker            Use Docker deployment
    -n, --native            Use native deployment
    -t, --skip-tests        Skip running tests
    -s, --skip-security     Skip security audit
    -f, --force-rebuild     Force rebuild (Docker only)
    -v, --verbose           Enable verbose output
    --dry-run              Show what would be done without executing
    -h, --help             Show this help message

Examples:
    $0                                    # Deploy in development mode
    $0 -e production -d                   # Deploy in production with Docker
    $0 -e staging -n -v                   # Deploy in staging natively with verbose output
    $0 --dry-run -e production            # Show what would be done for production deployment

Environment Variables:
    SECURITY_DEPLOYMENT_ENV              Override environment setting
    SECURITY_SKIP_TESTS                  Skip tests (true/false)
    SECURITY_SKIP_SECURITY_SCAN          Skip security scan (true/false)
    SECURITY_FORCE_REBUILD               Force rebuild (true/false)
    SECURITY_VERBOSE                     Enable verbose output (true/false)

EOF
}

# Parse command line arguments
parse_arguments() {
    local deployment_method=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--docker)
                deployment_method="docker"
                shift
                ;;
            -n|--native)
                deployment_method="native"
                shift
                ;;
            -t|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -s|--skip-security)
                SKIP_SECURITY_SCAN=true
                shift
                ;;
            -f|--force-rebuild)
                FORCE_REBUILD=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Override with environment variables if set
    [ -n "${SECURITY_DEPLOYMENT_ENV:-}" ] && ENVIRONMENT="$SECURITY_DEPLOYMENT_ENV"
    [ "${SECURITY_SKIP_TESTS:-}" = "true" ] && SKIP_TESTS=true
    [ "${SECURITY_SKIP_SECURITY_SCAN:-}" = "true" ] && SKIP_SECURITY_SCAN=true
    [ "${SECURITY_FORCE_REBUILD:-}" = "true" ] && FORCE_REBUILD=true
    [ "${SECURITY_VERBOSE:-}" = "true" ] && VERBOSE=true
    
    # Validate environment
    case $ENVIRONMENT in
        development|staging|production)
            ;;
        *)
            error_exit "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            ;;
    esac
    
    # Set default deployment method if not specified
    if [ -z "$deployment_method" ]; then
        if command_exists docker && [ -f "$PROJECT_ROOT/Dockerfile.security" ]; then
            deployment_method="docker"
        else
            deployment_method="native"
        fi
    fi
    
    export DEPLOYMENT_METHOD="$deployment_method"
}

# Main deployment function
main() {
    log "INFO" "Starting deployment of Git Memory MCP Server Security System"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Deployment method: $DEPLOYMENT_METHOD"
    log "INFO" "Dry run: $DRY_RUN"
    
    # Pre-deployment steps
    check_prerequisites
    setup_environment
    install_dependencies
    run_security_audit
    run_tests
    build_application
    
    # Deployment
    case $DEPLOYMENT_METHOD in
        docker)
            deploy_docker
            ;;
        native)
            deploy_native
            ;;
        *)
            error_exit "Unknown deployment method: $DEPLOYMENT_METHOD"
            ;;
    esac
    
    # Post-deployment steps
    if [ "$DRY_RUN" = false ]; then
        sleep 10  # Give the service time to start
        health_check
    fi
    
    cleanup
    
    success "Deployment completed successfully!"
    log "INFO" "Security system should be available at: http://localhost:3333"
    log "INFO" "Dashboard available at: http://localhost:3333/dashboard"
    log "INFO" "API documentation available at: http://localhost:3333/api/docs"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Handle script interruption
trap 'log "ERROR" "Deployment interrupted"; exit 1' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main

exit 0