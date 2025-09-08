# 🚀 NEXUS IDE - Multi-stage Docker Build
# Optimized for production deployment with security and performance

# ============================================================================
# Stage 1: Build Stage
# ============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY package-main-system.json ./package.json

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript and frontend assets
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# ============================================================================
# Stage 2: Production Stage
# ============================================================================
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nexus && \
    adduser -S nexus -u 1001 -G nexus

# Install runtime dependencies
RUN apk add --no-cache \
    git \
    curl \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nexus:nexus /app/node_modules ./node_modules
COPY --from=builder --chown=nexus:nexus /app/dist ./dist
COPY --from=builder --chown=nexus:nexus /app/src ./src
COPY --from=builder --chown=nexus:nexus /app/package.json ./
COPY --from=builder --chown=nexus:nexus /app/start-nexus-ide.js ./
COPY --from=builder --chown=nexus:nexus /app/nexus-ide-integration.js ./
COPY --from=builder --chown=nexus:nexus /app/nexus-mcp-server.js ./
COPY --from=builder --chown=nexus:nexus /app/nexus-config.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/temp /app/uploads && \
    chown -R nexus:nexus /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV WS_PORT=3001
ENV LOG_LEVEL=info
ENV NEXUS_DATA_DIR=/app/data
ENV NEXUS_LOG_DIR=/app/logs
ENV NEXUS_TEMP_DIR=/app/temp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose ports
EXPOSE 3000 3001

# Switch to non-root user
USER nexus

# Start the application
CMD ["node", "start-nexus-ide.js", "--production"]

# ============================================================================
# Stage 3: Development Stage (Optional)
# ============================================================================
FROM node:18-alpine AS development

# Install development tools
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    vim \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-main-system.json ./package.json

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Set environment variables for development
ENV NODE_ENV=development
ENV DEBUG=nexus:*
ENV PORT=3000
ENV WS_PORT=3001

# Expose ports
EXPOSE 3000 3001 9229

# Start in development mode with debugging
CMD ["npm", "run", "dev"]

# ============================================================================
# Labels for metadata
# ============================================================================
LABEL maintainer="NEXUS IDE Team <team@nexus-ide.com>"
LABEL version="2.0.0"
LABEL description="NEXUS IDE - The Ultimate AI-Powered Development Environment"
LABEL org.opencontainers.image.title="NEXUS IDE"
LABEL org.opencontainers.image.description="AI-Powered Development Environment with Git Memory MCP Server"
LABEL org.opencontainers.image.version="2.0.0"
LABEL org.opencontainers.image.authors="NEXUS IDE Team"
LABEL org.opencontainers.image.url="https://nexus-ide.com"
LABEL org.opencontainers.image.source="https://github.com/nexus-ide/git-memory-mcp-server"
LABEL org.opencontainers.image.vendor="NEXUS IDE"
LABEL org.opencontainers.image.licenses="MIT"