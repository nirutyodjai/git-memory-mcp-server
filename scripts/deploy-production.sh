#!/bin/bash

# =============================================================================
# Git Memory MCP Server - Production Deployment Script
# =============================================================================
# This script handles the complete deployment process for production environment
# Usage: ./scripts/deploy-production.sh [OPTIONS]
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/git-memory/deployment.log"
DEPLOYMENT_DATE=$(date '+%Y-%m-%d_%H-%M-%S')
DEPLOYMENT_TAG="production-${DEPLOYMENT_DATE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SKIP_BACKUP=false
SKIP_TESTS=false
SKIP_BUILD=false
FORCE_DEPLOY=false
ROLLBACK_ON_FAILURE=true
DRY_RUN=false
VERBOSE=false

# Deployment Configuration
APP_NAME="git-memory-mcp-server"
DOMAIN="gitmemory.comdee.co.th"
DEPLOYMENT_USER="git-memory"
DEPLOYMENT_PATH="/opt/git-memory"
BACKUP_PATH="/var/backups/git-memory"
LOG_PATH="/var/log/git-memory"

# Docker Configuration
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
DOCKER_IMAGE_TAG="git-memory:production"

# =============================================================================
# Helper Functions
# =============================================================================

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
    
    # Log to file if log directory exists
    if [[ -d "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Error handler
error_handler() {
    local line_number=$1
    log "ERROR" "Deployment failed at line $line_number"
    
    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
        log "INFO" "Initiating automatic rollback..."
        rollback_deployment
    fi
    
    send_notification "❌ Production deployment failed at line $line_number"
    exit 1
}

# Set error trap
trap 'error_handler $LINENO' ERR

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

log_info() {
    log "INFO" "$1"
}

log_success() {
    log "SUCCESS" "$1"
}

log_warning() {
    log "WARN" "$1"
}

log_error() {
    log "ERROR" "$1"
}

# Send notification
send_notification() {
    local message="$1"
    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    
    if [[ -n "$webhook_url" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$webhook_url" >/dev/null 2>&1 || true
    fi
    
    # Email notification (if configured)
    local email_to="${ALERT_EMAIL_TO:-}"
    if [[ -n "$email_to" ]]; then
        echo "$message" | mail -s "Git Memory MCP Server Deployment" "$email_to" 2>/dev/null || true
    fi
}

check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "git" "node" "npm")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            log "ERROR" "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log "ERROR" "Docker daemon is not running"
        exit 1
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log "ERROR" "Production environment file not found: .env.production"
        exit 1
    fi
    
    # Check disk space (minimum 5GB)
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    local min_space=5242880 # 5GB in KB
    
    if [[ $available_space -lt $min_space ]]; then
        log "ERROR" "Insufficient disk space. Available: $(($available_space/1024/1024))GB, Required: 5GB"
        exit 1
    fi
    
    # Check memory (minimum 2GB)
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [[ $available_memory -lt 2048 ]]; then
        log "WARN" "Low available memory: ${available_memory}MB. Recommended: 2GB+"
    fi
    
    log "SUCCESS" "All prerequisites satisfied"
}

# Create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log "INFO" "Skipping backup creation"
        return 0
    fi
    
    log "INFO" "Creating pre-deployment backup..."
    
    local backup_script="$SCRIPT_DIR/backup-production.sh"
    if [[ -f "$backup_script" ]]; then
        bash "$backup_script" --type full --tag "pre-deployment-$DEPLOYMENT_DATE"
        log "SUCCESS" "Backup created successfully"
    else
        log "WARN" "Backup script not found, skipping backup"
    fi
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "INFO" "Skipping tests"
        return 0
    fi
    
    log "INFO" "Running test suite..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        log "INFO" "Installing dependencies..."
        npm ci --production=false
    fi
    
    # Run tests
    npm test
    
    # Run security audit
    npm audit --audit-level moderate
    
    log "SUCCESS" "All tests passed"
}

setup_directories() {
    log_info "Setting up directories..."
    
    # Create deployment directories
    mkdir -p $DEPLOYMENT_PATH
    mkdir -p $BACKUP_PATH
    mkdir -p $LOG_PATH
    mkdir -p /var/lib/git-memory/data
    mkdir -p /var/lib/postgresql/data
    
    # Create deployment user if not exists
    if ! id "$DEPLOYMENT_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $DEPLOYMENT_PATH $DEPLOYMENT_USER
        log_success "Created deployment user: $DEPLOYMENT_USER"
    fi
    
    # Set proper permissions
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $DEPLOYMENT_PATH
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $BACKUP_PATH
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER $LOG_PATH
    chown -R $DEPLOYMENT_USER:$DEPLOYMENT_USER /var/lib/git-memory
    
    log_success "Directories setup completed"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        log_warning ".env file not found. Creating from .env.production template..."
        cp .env.production .env
        
        # Generate secure passwords
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        REDIS_PASSWORD=$(openssl rand -base64 32)
        GRAFANA_PASSWORD=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 64)
        CSRF_SECRET=$(openssl rand -base64 32)
        SESSION_SECRET=$(openssl rand -base64 32)
        
        # Update .env file with generated passwords
        sed -i "s/CHANGE_THIS_TO_SECURE_RANDOM_STRING_IN_PRODUCTION/$JWT_SECRET/g" .env
        sed -i "s/CHANGE_THIS_CSRF_SECRET_KEY/$CSRF_SECRET/g" .env
        sed -i "s/CHANGE_THIS_SESSION_SECRET_KEY/$SESSION_SECRET/g" .env
        
        # Create Docker environment file
        cat > .env.docker << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
EOF
        
        log_success "Environment files created with secure passwords"
        log_warning "Please review and update .env file with your specific configuration"
    else
        log_success "Environment file already exists"
    fi
}

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    SSL_DIR="./ssl"
    mkdir -p $SSL_DIR
    
    # Check if SSL certificates exist
    if [[ ! -f "$SSL_DIR/gitmemory.comdee.co.th.crt" ]]; then
        log_warning "SSL certificates not found. Generating self-signed certificates for development..."
        
        # Generate self-signed certificate (for development/testing)
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout $SSL_DIR/gitmemory.comdee.co.th.key \
            -out $SSL_DIR/gitmemory.comdee.co.th.crt \
            -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Comdee/OU=IT/CN=gitmemory.comdee.co.th"
        
        log_warning "Self-signed certificates generated. Replace with proper SSL certificates for production!"
    else
        log_success "SSL certificates found"
    fi
}

setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    NGINX_CONFIG_DIR="./config/nginx"
    mkdir -p $NGINX_CONFIG_DIR/sites-available
    
    # Create main nginx.conf
    cat > $NGINX_CONFIG_DIR/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Include site configurations
    include /etc/nginx/sites-available/*;
}
EOF
    
    # Create site configuration
    cat > $NGINX_CONFIG_DIR/sites-available/gitmemory.conf << 'EOF'
upstream git_memory_app {
    server git-memory-app:8080;
    keepalive 32;
}

upstream git_memory_dashboard {
    server git-memory-app:8081;
    keepalive 16;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name gitmemory.comdee.co.th;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name gitmemory.comdee.co.th;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/gitmemory.comdee.co.th.crt;
    ssl_certificate_key /etc/nginx/ssl/gitmemory.comdee.co.th.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Main API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://git_memory_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Dashboard routes
    location /dashboard/ {
        proxy_pass http://git_memory_dashboard/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://git_memory_app/health;
        access_log off;
    }
    
    # Metrics (restrict access)
    location /metrics {
        allow 127.0.0.1;
        allow 172.20.0.0/16;
        deny all;
        proxy_pass http://git-memory-app:9090/metrics;
    }
    
    # Static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Root redirect
    location = / {
        return 301 /dashboard/;
    }
}
EOF
    
    log_success "Nginx configuration created"
}

setup_monitoring() {
    log_info "Setting up monitoring configuration..."
    
    # Create monitoring directories
    mkdir -p ./config/prometheus
    mkdir -p ./config/grafana/provisioning/datasources
    mkdir -p ./config/grafana/provisioning/dashboards
    mkdir -p ./config/loki
    mkdir -p ./config/promtail
    
    # Prometheus configuration
    cat > ./config/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'git-memory-app'
    static_configs:
      - targets: ['git-memory-app:9090']
    scrape_interval: 5s
    metrics_path: '/metrics'
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
    
    # Grafana datasource
    cat > ./config/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
EOF
    
    # Loki configuration
    cat > ./config/loki/loki.yml << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
EOF
    
    # Promtail configuration
    cat > ./config/promtail/promtail.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: git-memory-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: git-memory
          __path__: /var/log/git-memory/*.log
  
  - job_name: nginx-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log
EOF
    
    log_success "Monitoring configuration created"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log "INFO" "Skipping build"
        return 0
    fi
    
    log "INFO" "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    rm -rf dist/ build/ .next/
    
    # Build application
    npm run build
    
    # Build Docker images
    log "INFO" "Building Docker images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    log "SUCCESS" "Application built successfully"
}

# Deploy application
deploy_application() {
    log "INFO" "Deploying application to production..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would execute deployment commands"
        return 0
    fi
    
    # Stop existing services gracefully
    log "INFO" "Stopping existing services..."
    docker-compose -f docker-compose.production.yml down --timeout 30
    
    # Remove unused Docker resources
    docker system prune -f
    
    # Start services
    log "INFO" "Starting production services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    log "INFO" "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "Up (healthy)"; then
            log "SUCCESS" "Services are healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log "INFO" "Waiting for services... ($attempt/$max_attempts)"
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log "ERROR" "Services failed to become healthy within timeout"
        return 1
    fi
}

build_and_deploy() {
    log_info "Building and deploying application..."
    
    # Stop existing containers
    if docker-compose -f $DOCKER_COMPOSE_FILE ps -q | grep -q .; then
        log_info "Stopping existing containers..."
        docker-compose -f $DOCKER_COMPOSE_FILE down
    fi
    
    # Build new images
    log_info "Building Docker images..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Deployment completed successfully"
}

# Run database migrations
run_migrations() {
    log "INFO" "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Wait for database to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose -f docker-compose.production.yml exec -T app npx prisma db push >/dev/null 2>&1; then
            log "SUCCESS" "Database is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log "INFO" "Waiting for database... ($attempt/$max_attempts)"
        sleep 5
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log "ERROR" "Database failed to become ready within timeout"
        return 1
    fi
    
    # Run migrations
    docker-compose -f docker-compose.production.yml exec -T app npx prisma migrate deploy
    
    # Seed database if needed
    docker-compose -f docker-compose.production.yml exec -T app npm run seed:prod
    
    log "SUCCESS" "Database migrations completed"
}

# Verify deployment
verify_deployment() {
    log "INFO" "Verifying deployment..."
    
    local base_url="https://gitmemory.comdee.co.th"
    local api_url="$base_url/api/v1"
    
    # Check health endpoint
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url/health" || echo "000")
    if [[ "$health_response" != "200" ]]; then
        log "ERROR" "Health check failed. HTTP status: $health_response"
        return 1
    fi
    
    # Check API endpoints
    local endpoints=("/auth/status" "/mcp/status" "/monitoring/metrics")
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url$endpoint" || echo "000")
        if [[ "$response" =~ ^[45] ]]; then
            log "WARN" "Endpoint $endpoint returned HTTP $response"
        else
            log "INFO" "Endpoint $endpoint: OK"
        fi
    done
    
    # Check Docker services
    local failed_services=$(docker-compose -f docker-compose.production.yml ps --services --filter "status=exited")
    if [[ -n "$failed_services" ]]; then
        log "ERROR" "Failed services detected: $failed_services"
        return 1
    fi
    
    # Check resource usage
    local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemPerc}}" | grep -v CONTAINER | awk '{print $2}' | sed 's/%//' | sort -nr | head -1)
    if [[ ${memory_usage%.*} -gt 90 ]]; then
        log "WARN" "High memory usage detected: ${memory_usage}%"
    fi
    
    log "SUCCESS" "Deployment verification completed"
}

# Rollback deployment
rollback_deployment() {
    log "INFO" "Rolling back deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Get previous deployment tag
    local previous_tag=$(git tag -l "production-*" | sort -V | tail -2 | head -1)
    
    if [[ -n "$previous_tag" ]]; then
        log "INFO" "Rolling back to $previous_tag"
        git checkout "$previous_tag"
        
        # Rebuild and redeploy
        docker-compose -f docker-compose.production.yml down
        docker-compose -f docker-compose.production.yml build
        docker-compose -f docker-compose.production.yml up -d
        
        log "SUCCESS" "Rollback completed"
    else
        log "ERROR" "No previous deployment tag found for rollback"
    fi
}

# Tag deployment
tag_deployment() {
    log "INFO" "Tagging deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Create deployment tag
    git tag -a "$DEPLOYMENT_TAG" -m "Production deployment on $DEPLOYMENT_DATE"
    
    # Push tag to remote (if configured)
    if git remote get-url origin >/dev/null 2>&1; then
        git push origin "$DEPLOYMENT_TAG" || log "WARN" "Failed to push tag to remote"
    fi
    
    log "SUCCESS" "Deployment tagged as $DEPLOYMENT_TAG"
}

# Cleanup old deployments
cleanup_old_deployments() {
    log "INFO" "Cleaning up old deployments..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old deployment tags (keep last 10)
    local old_tags=$(git tag -l "production-*" | sort -V | head -n -10)
    if [[ -n "$old_tags" ]]; then
        echo "$old_tags" | xargs -r git tag -d
        log "INFO" "Removed old deployment tags"
    fi
    
    # Clean up old log files (keep last 30 days)
    find /var/log/git-memory -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    log "SUCCESS" "Cleanup completed"
}

check_service_health() {
    log "INFO" "Checking service health..."
    
    # Check main application
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log "SUCCESS" "Main application is healthy"
    else
        log "ERROR" "Main application health check failed"
        return 1
    fi
    
    # Check database
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U git_memory_user > /dev/null 2>&1; then
        log "SUCCESS" "Database is healthy"
    else
        log "ERROR" "Database health check failed"
        return 1
    fi
    
    # Check Redis
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log "SUCCESS" "Redis is healthy"
    else
        log "ERROR" "Redis health check failed"
        return 1
    fi
}

# Setup directories
setup_directories() {
    log "INFO" "Setting up deployment directories..."
    
    # Create deployment directories
    mkdir -p "$DEPLOYMENT_PATH"
    mkdir -p "$LOG_PATH"
    mkdir -p "$BACKUP_PATH"
    mkdir -p "/var/lib/git-memory/data"
    mkdir -p "/etc/git-memory"
    
    # Set proper permissions
    chown -R "$DEPLOYMENT_USER:$DEPLOYMENT_USER" "$DEPLOYMENT_PATH"
    chown -R "$DEPLOYMENT_USER:$DEPLOYMENT_USER" "$LOG_PATH"
    chown -R "$DEPLOYMENT_USER:$DEPLOYMENT_USER" "$BACKUP_PATH"
    
    log "SUCCESS" "Deployment directories created"
}

# Setup environment
setup_environment() {
    log "INFO" "Setting up production environment..."
    
    # Copy environment file
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        cp "$PROJECT_ROOT/.env.production" "$DEPLOYMENT_PATH/.env"
        chown "$DEPLOYMENT_USER:$DEPLOYMENT_USER" "$DEPLOYMENT_PATH/.env"
        chmod 600 "$DEPLOYMENT_PATH/.env"
        log "SUCCESS" "Environment file copied"
    else
        log "WARN" "No .env.production file found"
    fi
}

# Setup SSL certificates
setup_ssl() {
    log "INFO" "Setting up SSL certificates..."
    
    local ssl_dir="/etc/ssl/git-memory"
    mkdir -p "$ssl_dir"
    
    # Generate self-signed certificate if none exists
    if [[ ! -f "$ssl_dir/server.crt" ]]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$ssl_dir/server.key" \
            -out "$ssl_dir/server.crt" \
            -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Git Memory/CN=$DOMAIN"
        
        chmod 600 "$ssl_dir/server.key"
        chmod 644 "$ssl_dir/server.crt"
        
        log "SUCCESS" "Self-signed SSL certificate generated"
        log "WARN" "Replace with proper SSL certificate for production"
    else
        log "INFO" "SSL certificate already exists"
    fi
}

# Setup Nginx reverse proxy
setup_nginx() {
    log "INFO" "Setting up Nginx reverse proxy..."
    
    # Install Nginx if not present
    if ! command_exists nginx; then
        apt-get update && apt-get install -y nginx
    fi
    
    # Create Nginx configuration
    cat > "/etc/nginx/sites-available/git-memory" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/ssl/git-memory/server.crt;
    ssl_certificate_key /etc/ssl/git-memory/server.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Main application
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Grafana monitoring
    location /monitoring/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/git-memory" "/etc/nginx/sites-enabled/"
    rm -f "/etc/nginx/sites-enabled/default"
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    
    log "SUCCESS" "Nginx configured and reloaded"
}

# Setup monitoring
setup_monitoring() {
    log "INFO" "Setting up monitoring configuration..."
    
    # Create monitoring directories
    mkdir -p "/etc/prometheus"
    mkdir -p "/etc/grafana/provisioning/dashboards"
    mkdir -p "/etc/grafana/provisioning/datasources"
    
    # Copy monitoring configurations if they exist
    if [[ -d "$PROJECT_ROOT/monitoring" ]]; then
        cp -r "$PROJECT_ROOT/monitoring/"* "/etc/prometheus/" 2>/dev/null || true
        cp -r "$PROJECT_ROOT/grafana/"* "/etc/grafana/provisioning/" 2>/dev/null || true
    fi
    
    log "SUCCESS" "Monitoring configuration completed"
}

setup_systemd() {
    log "INFO" "Setting up systemd service..."
    
    cat > /etc/systemd/system/git-memory.service << EOF
[Unit]
Description=Git Memory MCP Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOYMENT_PATH
ExecStart=/usr/local/bin/docker-compose -f $DOCKER_COMPOSE_FILE up -d
ExecStop=/usr/local/bin/docker-compose -f $DOCKER_COMPOSE_FILE down
TimeoutStartSec=0
User=$DEPLOYMENT_USER
Group=$DEPLOYMENT_USER

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable git-memory.service
    
    log "SUCCESS" "Systemd service created and enabled"
}

setup_backup_cron() {
    log "INFO" "Setting up backup cron job..."
    
    # Create backup script
    cat > /usr/local/bin/git-memory-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/git-memory"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /opt/git-memory/docker-compose.production.yml exec -T postgres pg_dump -U git_memory_user git_memory_prod > $BACKUP_DIR/database_$DATE.sql

# Backup application data
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz -C /var/lib/git-memory data

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x /usr/local/bin/git-memory-backup.sh
    
    # Add to crontab (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/git-memory-backup.sh >> /var/log/git-memory/backup.log 2>&1") | crontab -
    
    log "SUCCESS" "Backup cron job created"
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Production Deployment Script for Git Memory MCP Server

OPTIONS:
    --skip-backup          Skip pre-deployment backup
    --skip-tests           Skip running tests
    --skip-build           Skip building application
    --force                Force deployment even if checks fail
    --no-rollback          Disable automatic rollback on failure
    --dry-run              Show what would be done without executing
    --verbose              Enable verbose output
    --help                 Show this help message

EXAMPLES:
    $0                     # Full deployment with all checks
    $0 --skip-tests        # Deploy without running tests
    $0 --dry-run           # Preview deployment actions
    $0 --force --no-rollback # Force deploy without rollback

ENVIRONMENT VARIABLES:
    SLACK_WEBHOOK_URL      Slack webhook for notifications
    ALERT_EMAIL_TO         Email addresses for alerts
    
EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                set -x
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

show_deployment_info() {
    log "SUCCESS" "=============================================================================="
    log "SUCCESS" "                    DEPLOYMENT COMPLETED SUCCESSFULLY"
    log "SUCCESS" "=============================================================================="
    echo
    log "INFO" "Application URLs:"
    echo "  • Main API: https://$DOMAIN/api"
    echo "  • Dashboard: https://$DOMAIN/dashboard"
    echo "  • Health Check: https://$DOMAIN/health"
    echo
    log "INFO" "Monitoring URLs:"
    echo "  • Grafana: http://$(hostname -I | awk '{print $1}'):3001"
    echo "  • Prometheus: http://$(hostname -I | awk '{print $1}'):9091"
    echo
    log "INFO" "Important Files:"
    echo "  • Application: $DEPLOYMENT_PATH"
    echo "  • Logs: $LOG_PATH"
    echo "  • Backups: $BACKUP_PATH"
    echo "  • Environment: $DEPLOYMENT_PATH/.env"
    echo
    log "INFO" "Management Commands:"
    echo "  • Start: systemctl start git-memory"
    echo "  • Stop: systemctl stop git-memory"
    echo "  • Status: systemctl status git-memory"
    echo "  • Logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo
    log "WARN" "Next Steps:"
    echo "  1. Update .env file with your specific configuration"
    echo "  2. Replace self-signed SSL certificates with proper ones"
    echo "  3. Configure DNS to point $DOMAIN to this server"
    echo "  4. Test all functionality"
    echo "  5. Set up monitoring alerts"
    echo
    log "SUCCESS" "=============================================================================="
}

# =============================================================================
# Main Execution
# =============================================================================

# Main deployment function
main() {
    log "INFO" "Starting production deployment..."
    log "INFO" "Deployment tag: $DEPLOYMENT_TAG"
    
    # Load environment variables
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        set -a
        source "$PROJECT_ROOT/.env.production"
        set +a
    fi
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Send start notification
    send_notification "🚀 Starting production deployment of Git Memory MCP Server"
    
    # Deployment steps
    check_prerequisites
    create_backup
    run_tests
    build_application
    deploy_application
    run_migrations
    verify_deployment
    tag_deployment
    cleanup_old_deployments
    
    # Calculate deployment time
    local end_time=$(date +%s)
    local start_time=${start_time:-$end_time}
    local duration=$((end_time - start_time))
    
    log "SUCCESS" "Production deployment completed successfully!"
    log "INFO" "Deployment duration: ${duration}s"
    log "INFO" "Application URL: https://gitmemory.comdee.co.th"
    log "INFO" "API URL: https://gitmemory.comdee.co.th/api/v1"
    log "INFO" "Monitoring: https://gitmemory.comdee.co.th:3001"
    
    # Send success notification
    send_notification "✅ Production deployment completed successfully! Duration: ${duration}s"
    
    # Also run original setup functions for system configuration
    setup_directories
    setup_environment
    setup_ssl
    setup_nginx
    setup_monitoring
    setup_systemd
    setup_backup_cron
    
    show_deployment_info
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Record start time
start_time=$(date +%s)

# Parse arguments
parse_arguments "$@"

# Run main function
main

exit 0