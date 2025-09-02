# Git Memory MCP Server - Production Dockerfile
# Multi-stage build for optimized production image

# =============================================================================
# Stage 1: Build Stage
# =============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    openssh-client

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY babel.config.js ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# =============================================================================
# Stage 2: Production Stage
# =============================================================================
FROM node:18-alpine AS production

# Install production dependencies
RUN apk add --no-cache \
    dumb-init \
    git \
    openssh-client \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S git-memory -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=git-memory:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=git-memory:nodejs /app/dist ./dist
COPY --from=builder --chown=git-memory:nodejs /app/package*.json ./

# Copy essential files
COPY --chown=git-memory:nodejs git-memory-coordinator.js ./
COPY --chown=git-memory:nodejs git-memory-client.js ./
COPY --chown=git-memory:nodejs api-gateway.js ./
COPY --chown=git-memory:nodejs mcp.config.json ./
COPY --chown=git-memory:nodejs prisma ./prisma/
COPY --chown=git-memory:nodejs src ./src/
COPY --chown=git-memory:nodejs config ./config/

# Copy production environment file
COPY --chown=git-memory:nodejs .env.production ./.env

# Create necessary directories
RUN mkdir -p /app/.git-memory/logs /app/.git-memory/data /app/.git-memory/config && \
    mkdir -p /var/log/git-memory && \
    mkdir -p /var/backups/git-memory && \
    chown -R git-memory:nodejs /app/.git-memory /var/log/git-memory /var/backups/git-memory

# Set up Prisma
RUN npx prisma generate

# Switch to non-root user
USER git-memory

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose ports
EXPOSE 3000 8080 8081 9090

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "api-gateway.js"]

# =============================================================================
# Build Information
# =============================================================================
LABEL maintainer="Git Memory Team <support@git-memory.dev>"
LABEL version="2.0.0"
LABEL description="Git Memory MCP Server - Production Ready"
LABEL org.opencontainers.image.source="https://github.com/nirutyodjai/git-memory-mcp-server"
LABEL org.opencontainers.image.documentation="https://github.com/nirutyodjai/git-memory-mcp-server/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"