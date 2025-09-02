# Git Memory MCP Server - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Local Development Deployment](#local-development-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Production Deployment](#production-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)
11. [Scaling and Performance](#scaling-and-performance)

## Overview

This guide covers various deployment strategies for the Git Memory MCP Server, from local development to production-ready cloud deployments.

### Deployment Options

| Environment | Use Case | Complexity | Scalability |
|-------------|----------|------------|-------------|
| **Local Development** | Development & Testing | Low | Single Instance |
| **Docker** | Containerized Deployment | Medium | Multi-Instance |
| **Cloud (AWS/Azure/GCP)** | Production Ready | High | Auto-Scaling |
| **Kubernetes** | Enterprise Scale | Very High | Unlimited |

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

#### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps

#### Production Requirements
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD with backup
- **Network**: 10 Gbps with redundancy

### Software Dependencies

```bash
# Required
Node.js >= 18.0.0
npm >= 8.0.0
Git >= 2.30.0

# Optional (for specific deployment types)
Docker >= 20.10.0
Docker Compose >= 2.0.0
Kubernetes >= 1.20.0
Nginx >= 1.20.0
```

## Environment Configuration

### Environment Variables

Create environment-specific configuration files:

#### Development (`.env.development`)
```env
# Server Configuration
NODE_ENV=development
PORT=8080
DASHBOARD_PORT=8081
HOST=localhost

# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=dev-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Git Configuration
GIT_MEMORY_PATH=./memory-repos
GIT_USER_NAME="MCP Dev Server"
GIT_USER_EMAIL="dev@example.com"

# Rate Limiting (Relaxed for development)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_COLLECTION_INTERVAL=60000

# Security (Relaxed for development)
CORS_ORIGIN=*
API_KEY_HEADER=X-API-Key

# Logging
LOG_LEVEL=debug
LOG_FORMAT=dev
```

#### Staging (`.env.staging`)
```env
# Server Configuration
NODE_ENV=staging
PORT=8080
DASHBOARD_PORT=8081
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@staging-db:5432/mcp_staging"

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=12h
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
REFRESH_TOKEN_EXPIRES_IN=3d

# Git Configuration
GIT_MEMORY_PATH=/app/memory-repos
GIT_USER_NAME="MCP Staging Server"
GIT_USER_EMAIL="staging@yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=500

# Monitoring
HEALTH_CHECK_INTERVAL=15000
METRICS_COLLECTION_INTERVAL=30000

# Security
CORS_ORIGIN=https://staging.yourdomain.com
API_KEY_HEADER=X-API-Key

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

#### Production (`.env.production`)
```env
# Server Configuration
NODE_ENV=production
PORT=8080
DASHBOARD_PORT=8081
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@prod-db:5432/mcp_production"

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
REFRESH_TOKEN_EXPIRES_IN=1d

# Git Configuration
GIT_MEMORY_PATH=/app/memory-repos
GIT_USER_NAME="MCP Production Server"
GIT_USER_EMAIL="production@yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
HEALTH_CHECK_INTERVAL=10000
METRICS_COLLECTION_INTERVAL=15000

# Security
CORS_ORIGIN=https://yourdomain.com
API_KEY_HEADER=X-API-Key
TRUST_PROXY=true

# Logging
LOG_LEVEL=warn
LOG_FORMAT=combined

# SSL/TLS
SSL_CERT_PATH=/app/ssl/cert.pem
SSL_KEY_PATH=/app/ssl/key.pem

# External Services
REDIS_URL=redis://prod-redis:6379
ELASTICSEARCH_URL=https://prod-elasticsearch:9200
```

## Local Development Deployment

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/git-memory-mcp-server.git
cd git-memory-mcp-server

# Install dependencies
npm install

# Setup environment
cp .env.example .env.development

# Initialize database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Development with Hot Reload

```bash
# Start with nodemon for auto-restart
npm run dev:watch

# Start with debugging
npm run dev:debug

# Start only specific components
npm run dev:api-gateway
npm run dev:dashboard
```

### Development Database Setup

```bash
# Initialize SQLite database
npm run db:init

# Run migrations
npm run db:migrate

# Seed with test data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Docker Deployment

### Single Container Deployment

#### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init git

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src
COPY package*.json ./

# Create necessary directories
RUN mkdir -p /app/memory-repos /app/logs /app/data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 8080 8081

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### Build and Run

```bash
# Build Docker image
docker build -t git-memory-mcp-server .

# Run container
docker run -d \
  --name mcp-server \
  -p 8080:8080 \
  -p 8081:8081 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/memory-repos:/app/memory-repos \
  -e NODE_ENV=production \
  git-memory-mcp-server

# View logs
docker logs -f mcp-server

# Stop container
docker stop mcp-server
```

### Docker Compose Deployment

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # Main application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: mcp-server
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mcp_production
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/app/data
      - ./memory-repos:/app/memory-repos
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL database
  postgres:
    image: postgres:15-alpine
    container_name: mcp-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=mcp_production
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: mcp-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass password
    volumes:
      - redis_data:/data
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: mcp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - mcp-network

  # Monitoring with Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: mcp-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - mcp-network

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: mcp-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - mcp-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  mcp-network:
    driver: bridge
```

#### Nginx Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream mcp_backend {
        server app:8080;
    }

    upstream mcp_dashboard {
        server app:8081;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=dashboard:10m rate=5r/s;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Main API server
    server {
        listen 80;
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://mcp_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://mcp_backend/health;
        }
    }

    # Dashboard server
    server {
        listen 80;
        listen 443 ssl http2;
        server_name dashboard.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Rate limiting
        limit_req zone=dashboard burst=10 nodelay;

        location / {
            proxy_pass http://mcp_dashboard;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

##### Task Definition

```json
{
  "family": "git-memory-mcp-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "mcp-server",
      "image": "your-account.dkr.ecr.region.amazonaws.com/git-memory-mcp-server:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        },
        {
          "containerPort": 8081,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        },
        {
          "name": "DASHBOARD_PORT",
          "value": "8081"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:mcp-database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:mcp-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/git-memory-mcp-server",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

##### Service Definition

```json
{
  "serviceName": "git-memory-mcp-server",
  "cluster": "mcp-cluster",
  "taskDefinition": "git-memory-mcp-server:1",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-12345678",
        "subnet-87654321"
      ],
      "securityGroups": [
        "sg-12345678"
      ],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/mcp-tg/1234567890123456",
      "containerName": "mcp-server",
      "containerPort": 8080
    }
  ],
  "serviceRegistries": [
    {
      "registryArn": "arn:aws:servicediscovery:region:account:service/srv-12345678"
    }
  ]
}
```

##### Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

set -e

# Configuration
REGION="us-west-2"
CLUSTER_NAME="mcp-cluster"
SERVICE_NAME="git-memory-mcp-server"
IMAGE_TAG="latest"
ECR_REPOSITORY="your-account.dkr.ecr.${REGION}.amazonaws.com/git-memory-mcp-server"

echo "Starting AWS ECS deployment..."

# Build and push Docker image
echo "Building Docker image..."
docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .

echo "Pushing to ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY}
docker push ${ECR_REPOSITORY}:${IMAGE_TAG}

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${SERVICE_NAME} \
  --force-new-deployment \
  --region ${REGION}

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster ${CLUSTER_NAME} \
  --services ${SERVICE_NAME} \
  --region ${REGION}

echo "Deployment completed successfully!"
```

#### Using AWS Lambda (Serverless)

##### serverless.yml

```yaml
service: git-memory-mcp-server

provider:
  name: aws
  runtime: nodejs18.x
  region: us-west-2
  stage: ${opt:stage, 'dev'}
  environment:
    NODE_ENV: ${self:provider.stage}
    DATABASE_URL: ${ssm:/mcp/${self:provider.stage}/database-url}
    JWT_SECRET: ${ssm:/mcp/${self:provider.stage}/jwt-secret~true}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - rds:*
        - secretsmanager:GetSecretValue
      Resource: "*"

functions:
  api:
    handler: src/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    timeout: 30
    memorySize: 1024
    reservedConcurrency: 100

  dashboard:
    handler: src/lambda-dashboard.handler
    events:
      - http:
          path: /dashboard/{proxy+}
          method: ANY
          cors: true
    timeout: 30
    memorySize: 512

resources:
  Resources:
    # RDS Database
    MCPDatabase:
      Type: AWS::RDS::DBInstance
      Properties:
        DBInstanceIdentifier: mcp-${self:provider.stage}
        DBInstanceClass: db.t3.micro
        Engine: postgres
        EngineVersion: '13.7'
        MasterUsername: postgres
        MasterUserPassword: ${ssm:/mcp/${self:provider.stage}/db-password~true}
        AllocatedStorage: 20
        StorageType: gp2
        VPCSecurityGroups:
          - Ref: DatabaseSecurityGroup
        DBSubnetGroupName:
          Ref: DatabaseSubnetGroup

plugins:
  - serverless-offline
  - serverless-webpack
```

### Azure Deployment

#### Using Azure Container Instances

```yaml
# azure-container-instances.yml
apiVersion: 2019-12-01
location: eastus
name: git-memory-mcp-server
properties:
  containers:
  - name: mcp-server
    properties:
      image: youracr.azurecr.io/git-memory-mcp-server:latest
      resources:
        requests:
          cpu: 2
          memoryInGb: 4
      ports:
      - port: 8080
        protocol: TCP
      - port: 8081
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: PORT
        value: '8080'
      - name: DASHBOARD_PORT
        value: '8081'
      - name: DATABASE_URL
        secureValue: postgresql://user:pass@host:5432/db
      - name: JWT_SECRET
        secureValue: your-jwt-secret
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 8081
    dnsNameLabel: git-memory-mcp-server
tags:
  environment: production
  project: git-memory-mcp-server
type: Microsoft.ContainerInstance/containerGroups
```

#### Deploy to Azure

```bash
# Login to Azure
az login

# Create resource group
az group create --name mcp-rg --location eastus

# Deploy container instance
az deployment group create \
  --resource-group mcp-rg \
  --template-file azure-container-instances.yml

# Get public IP
az container show \
  --resource-group mcp-rg \
  --name git-memory-mcp-server \
  --query ipAddress.fqdn
```

### Google Cloud Platform Deployment

#### Using Cloud Run

```yaml
# cloudrun.yml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: git-memory-mcp-server
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "2Gi"
        run.googleapis.com/cpu: "2"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/your-project/git-memory-mcp-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Deploy to Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/your-project/git-memory-mcp-server

# Deploy to Cloud Run
gcloud run deploy git-memory-mcp-server \
  --image gcr.io/your-project/git-memory-mcp-server:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

## Production Deployment

### Production Checklist

#### Security
- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] API keys rotated
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers added
- [ ] Firewall rules configured

#### Performance
- [ ] Database optimized
- [ ] Caching implemented
- [ ] CDN configured
- [ ] Load balancing setup
- [ ] Auto-scaling configured
- [ ] Resource limits set
- [ ] Connection pooling enabled

#### Monitoring
- [ ] Health checks configured
- [ ] Logging centralized
- [ ] Metrics collection setup
- [ ] Alerting configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Uptime monitoring setup

#### Backup & Recovery
- [ ] Database backups automated
- [ ] Git repositories backed up
- [ ] Configuration backed up
- [ ] Recovery procedures tested
- [ ] Disaster recovery plan ready

### Production Environment Setup

#### Database Configuration

```sql
-- PostgreSQL production setup
-- Create database
CREATE DATABASE mcp_production;

-- Create user
CREATE USER mcp_user WITH ENCRYPTED PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE mcp_production TO mcp_user;

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Reload configuration
SELECT pg_reload_conf();
```

#### Redis Configuration

```conf
# redis.conf
bind 127.0.0.1
port 6379
requirepass secure_redis_password

# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

#### Process Management with PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'mcp-server',
      script: 'src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'mcp-dashboard',
      script: 'src/api-gateway/api-gateway-dashboard.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      error_file: './logs/dashboard-err.log',
      out_file: './logs/dashboard-out.log',
      max_memory_restart: '512M'
    }
  ]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 restart all

# Save PM2 configuration
pm2 save
pm2 startup
```

## Monitoring and Maintenance

### Health Monitoring

#### Health Check Endpoint

```javascript
// src/monitoring/health-check.js
class HealthCheck {
  async checkHealth() {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        git: await this.checkGitRepositories(),
        disk: await this.checkDiskSpace(),
        external: await this.checkExternalServices()
      }
    };

    // Determine overall status
    const failedChecks = Object.values(checks.checks)
      .filter(check => check.status !== 'healthy');
    
    if (failedChecks.length > 0) {
      checks.status = 'unhealthy';
    }

    return checks;
  }

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.ping();
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
```

### Logging Configuration

```javascript
// src/utils/logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'git-memory-mcp-server',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add Elasticsearch transport for production
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    },
    index: 'mcp-server-logs'
  }));
}

module.exports = logger;
```

### Backup Strategy

#### Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/backups/database"
RETENTION_DAYS=30
DATABASE_URL="postgresql://user:pass@host:5432/mcp_production"
S3_BUCKET="mcp-backups"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Generate backup filename
BACKUP_FILE="mcp_backup_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "Starting database backup..."

# Create database dump
pg_dump ${DATABASE_URL} > ${BACKUP_PATH}

# Compress backup
gzip ${BACKUP_PATH}
BACKUP_PATH="${BACKUP_PATH}.gz"

echo "Database backup created: ${BACKUP_PATH}"

# Upload to S3
if [ ! -z "${S3_BUCKET}" ]; then
  aws s3 cp ${BACKUP_PATH} s3://${S3_BUCKET}/database/
  echo "Backup uploaded to S3"
fi

# Clean up old backups
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "Old backups cleaned up"

echo "Backup completed successfully"
```

#### Git Repository Backup

```bash
#!/bin/bash
# scripts/backup-git-repos.sh

set -e

# Configuration
MEMORY_REPOS_DIR="./memory-repos"
BACKUP_DIR="/backups/git-repos"
S3_BUCKET="mcp-backups"

# Create backup
BACKUP_FILE="git_repos_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

mkdir -p ${BACKUP_DIR}

echo "Starting Git repositories backup..."

# Create compressed archive
tar -czf ${BACKUP_PATH} -C ${MEMORY_REPOS_DIR} .

echo "Git repositories backup created: ${BACKUP_PATH}"

# Upload to S3
if [ ! -z "${S3_BUCKET}" ]; then
  aws s3 cp ${BACKUP_PATH} s3://${S3_BUCKET}/git-repos/
  echo "Backup uploaded to S3"
fi

echo "Git repositories backup completed"
```

## Security Considerations

### SSL/TLS Configuration

```javascript
// src/utils/ssl-config.js
const fs = require('fs');
const https = require('https');

function createSSLServer(app) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    // Additional security options
    secureProtocol: 'TLSv1_2_method',
    ciphers: [
      'ECDHE-RSA-AES256-GCM-SHA512',
      'DHE-RSA-AES256-GCM-SHA512',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'DHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-SHA384'
    ].join(':'),
    honorCipherOrder: true
  };

  return https.createServer(options, app);
}

module.exports = { createSSLServer };
```

### Security Headers

```javascript
// src/security/security-headers.js
const helmet = require('helmet');

function setupSecurityHeaders(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
  }));
}

module.exports = { setupSecurityHeaders };
```

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Symptoms**: Server consuming excessive memory

**Diagnosis**:
```bash
# Monitor memory usage
node --inspect src/main.js

# Generate heap dump
kill -USR2 <pid>

# Analyze with clinic.js
npx clinic doctor -- node src/main.js
```

**Solutions**:
- Implement memory limits
- Add garbage collection tuning
- Review memory leaks in code
- Optimize database queries

#### 2. Database Connection Issues

**Symptoms**: Connection timeouts, pool exhaustion

**Diagnosis**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check long-running queries
SELECT query, state, query_start 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;
```

**Solutions**:
- Increase connection pool size
- Optimize slow queries
- Implement connection retry logic
- Add connection monitoring

#### 3. Git Repository Corruption

**Symptoms**: Git operations failing

**Diagnosis**:
```bash
# Check repository integrity
git fsck --full

# Check for corruption
git status
git log --oneline
```

**Solutions**:
- Restore from backup
- Repair repository if possible
- Implement repository validation
- Add automated backups

### Performance Optimization

#### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_sessions_user_id ON sessions(user_id);
CREATE INDEX CONCURRENTLY idx_memory_entries_timestamp ON memory_entries(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Update table statistics
ANALYZE;
```

#### Caching Strategy

```javascript
// src/utils/cache.js
const Redis = require('redis');

class CacheManager {
  constructor() {
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }
}

module.exports = CacheManager;
```

## Scaling and Performance

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
# nginx-load-balancer.conf
upstream mcp_servers {
    least_conn;
    server mcp-server-1:8080 weight=3 max_fails=3 fail_timeout=30s;
    server mcp-server-2:8080 weight=3 max_fails=3 fail_timeout=30s;
    server mcp-server-3:8080 weight=2 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://mcp_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /health {
        access_log off;
        proxy_pass http://mcp_servers/health;
    }
}
```

#### Auto-scaling with Kubernetes

```yaml
# k8s-hpa.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mcp-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mcp-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### Performance Monitoring

```javascript
// src/monitoring/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: []
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    this.metrics.cpuUsage.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    // Keep only last 100 entries
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
    
    if (this.metrics.cpuUsage.length > 100) {
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
    }
  }

  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push({
      timestamp: Date.now(),
      time: responseTime
    });
    
    // Keep only last 1000 entries
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  recordError() {
    this.metrics.errors++;
  }

  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((sum, entry) => sum + entry.time, 0) / this.metrics.responseTime.length
      : 0;
    
    return {
      ...this.metrics,
      averageResponseTime: avgResponseTime,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
    };
  }
}

module.exports = PerformanceMonitor;
```

---

**Deployment Success! 🚀**

This comprehensive deployment guide covers everything from local development to enterprise-scale production deployments. Choose the deployment strategy that best fits your needs and scale as your requirements grow.

For additional support:
- [GitHub Issues](https://github.com/your-org/git-memory-mcp-server/issues)
- [Documentation](./API.md)
- [Community Discord](https://discord.gg/git-memory-mcp)