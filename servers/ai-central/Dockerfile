# =============================================================================
# NEXUS IDE - AI Central Server Dockerfile
# =============================================================================
# 
# Multi-stage Docker build for NEXUS IDE AI Central Server
# Optimized for production deployment with security and performance in mind
# 
# Build stages:
# 1. base       - Common base configuration
# 2. deps       - Install dependencies
# 3. build      - Build application
# 4. production - Final production image
# 5. development - Development image with dev tools
# 
# Usage:
# - Production: docker build --target production -t nexus-ai-central:latest .
# - Development: docker build --target development -t nexus-ai-central:dev .
# - Build args: docker build --build-arg NODE_VERSION=20 -t nexus-ai-central .
# 
# =============================================================================

# =============================================================================
# Build Arguments
# =============================================================================
ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.19
ARG APP_USER=nexus
ARG APP_UID=1001
ARG APP_GID=1001

# =============================================================================
# Base Stage - Common Configuration
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

# Build arguments
ARG APP_USER
ARG APP_UID
ARG APP_GID

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
        dumb-init \
        curl \
        wget \
        ca-certificates \
        tzdata \
        tini \
        su-exec && \
    rm -rf /var/cache/apk/*

# Create application user and group
RUN addgroup -g ${APP_GID} ${APP_USER} && \
    adduser -D -u ${APP_UID} -G ${APP_USER} -s /bin/sh ${APP_USER}

# Set timezone
ENV TZ=Asia/Bangkok
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create application directories
RUN mkdir -p /app /app/logs /app/uploads /app/cache /app/data && \
    chown -R ${APP_USER}:${APP_USER} /app

# Set working directory
WORKDIR /app

# =============================================================================
# Dependencies Stage - Install Node.js Dependencies
# =============================================================================
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies with optimizations
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Install development dependencies in separate layer
FROM deps AS deps-dev
RUN npm ci --no-audit --no-fund

# =============================================================================
# Build Stage - Build Application
# =============================================================================
FROM deps-dev AS build

# Copy source code
COPY . .

# Build application (if you have build scripts)
RUN npm run build 2>/dev/null || echo "No build script found, skipping..."

# Run tests (optional)
RUN npm test 2>/dev/null || echo "No test script found, skipping..."

# Clean up development dependencies
RUN npm prune --production

# =============================================================================
# Production Stage - Final Production Image
# =============================================================================
FROM base AS production

# Build arguments
ARG APP_USER

# Set production environment
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PROGRESS=false

# Application configuration
ENV PORT=4200
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
ENV MAX_CONCURRENT_REQUESTS=200
ENV REQUEST_TIMEOUT=30000
ENV CACHE_TTL=3600

# Security configurations
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384"
ENV UV_THREADPOOL_SIZE=16

# Copy production dependencies
COPY --from=deps --chown=${APP_USER}:${APP_USER} /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/package*.json ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ai-central-api.js ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ai-models-integration.js ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ai-code-features.js ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ai-conversation.js ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ai-debugging.js ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ai-optimization.js ./
COPY --from=build --chown=${APP_USER}:${APP_USER} /app/ecosystem.config.js ./

# Copy configuration files (if any)
COPY --chown=${APP_USER}:${APP_USER} config/ ./config/ 2>/dev/null || echo "No config directory found"
COPY --chown=${APP_USER}:${APP_USER} scripts/ ./scripts/ 2>/dev/null || echo "No scripts directory found"

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Starting NEXUS IDE AI Central Server..."' >> /app/start.sh && \
    echo 'echo "Node.js version: $(node --version)"' >> /app/start.sh && \
    echo 'echo "NPM version: $(npm --version)"' >> /app/start.sh && \
    echo 'echo "Environment: $NODE_ENV"' >> /app/start.sh && \
    echo 'echo "Port: $PORT"' >> /app/start.sh && \
    echo 'echo "Host: $HOST"' >> /app/start.sh && \
    echo 'echo "Log Level: $LOG_LEVEL"' >> /app/start.sh && \
    echo 'echo "Max Concurrent Requests: $MAX_CONCURRENT_REQUESTS"' >> /app/start.sh && \
    echo 'echo "Request Timeout: $REQUEST_TIMEOUT"' >> /app/start.sh && \
    echo 'echo "Cache TTL: $CACHE_TTL"' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'exec node ai-central-api.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown ${APP_USER}:${APP_USER} /app/start.sh

# Create health check script
RUN echo '#!/bin/sh' > /app/healthcheck.sh && \
    echo 'curl -f http://localhost:$PORT/health || exit 1' >> /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh && \
    chown ${APP_USER}:${APP_USER} /app/healthcheck.sh

# Switch to non-root user
USER ${APP_USER}

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["/app/start.sh"]

# =============================================================================
# Development Stage - Development Image with Dev Tools
# =============================================================================
FROM base AS development

# Build arguments
ARG APP_USER

# Set development environment
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=info
ENV LOG_LEVEL=debug

# Install development tools
RUN apk add --no-cache \
        git \
        bash \
        vim \
        nano \
        htop \
        procps \
        net-tools && \
    rm -rf /var/cache/apk/*

# Install global development packages
RUN npm install -g \
        nodemon \
        pm2 \
        @nestjs/cli \
        typescript \
        ts-node \
        eslint \
        prettier

# Copy development dependencies
COPY --from=deps-dev --chown=${APP_USER}:${APP_USER} /app/node_modules ./node_modules

# Copy source code
COPY --chown=${APP_USER}:${APP_USER} . .

# Create development startup script
RUN echo '#!/bin/bash' > /app/dev-start.sh && \
    echo 'set -e' >> /app/dev-start.sh && \
    echo 'echo "Starting NEXUS IDE AI Central Server in Development Mode..."' >> /app/dev-start.sh && \
    echo 'echo "Node.js version: $(node --version)"' >> /app/dev-start.sh && \
    echo 'echo "NPM version: $(npm --version)"' >> /app/dev-start.sh && \
    echo 'echo "Environment: $NODE_ENV"' >> /app/dev-start.sh && \
    echo 'echo "Starting with nodemon for auto-reload..."' >> /app/dev-start.sh && \
    echo 'exec nodemon --inspect=0.0.0.0:9229 ai-central-api.js' >> /app/dev-start.sh && \
    chmod +x /app/dev-start.sh && \
    chown ${APP_USER}:${APP_USER} /app/dev-start.sh

# Switch to non-root user
USER ${APP_USER}

# Expose ports (app + debugger)
EXPOSE 4200 9229

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4200/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start in development mode
CMD ["/app/dev-start.sh"]

# =============================================================================
# Labels and Metadata
# =============================================================================
LABEL maintainer="NEXUS IDE Team <team@nexus-ide.com>"
LABEL version="1.0.0"
LABEL description="NEXUS IDE AI Central Server - Next-Generation AI-Powered Development Environment"
LABEL org.opencontainers.image.title="NEXUS IDE AI Central Server"
LABEL org.opencontainers.image.description="AI Central Server for NEXUS IDE with multi-model AI integration"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="NEXUS IDE"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/nexus-ide/ai-central-server"
LABEL org.opencontainers.image.documentation="https://docs.nexus-ide.com/ai-central-server"

# =============================================================================
# Docker Build Commands Reference
# =============================================================================
# 
# Production Build:
# docker build --target production -t nexus-ai-central:latest .
# docker build --target production -t nexus-ai-central:v1.0.0 .
# 
# Development Build:
# docker build --target development -t nexus-ai-central:dev .
# 
# Multi-platform Build:
# docker buildx build --platform linux/amd64,linux/arm64 -t nexus-ai-central:latest .
# 
# Build with Custom Args:
# docker build --build-arg NODE_VERSION=18 --build-arg APP_USER=myuser -t nexus-ai-central .
# 
# Build with No Cache:
# docker build --no-cache -t nexus-ai-central:latest .
# 
# Build and Push:
# docker build -t nexus-ai-central:latest . && docker push nexus-ai-central:latest
# 
# Run Production Container:
# docker run -d --name nexus-ai-central -p 4200:4200 nexus-ai-central:latest
# 
# Run Development Container:
# docker run -d --name nexus-ai-central-dev -p 4200:4200 -p 9229:9229 -v $(pwd):/app nexus-ai-central:dev
# 
# Debug Container:
# docker run -it --rm nexus-ai-central:latest sh
# 
# Check Image Size:
# docker images nexus-ai-central
# 
# Inspect Image:
# docker inspect nexus-ai-central:latest
# 
# =============================================================================