# =============================================================================
# ENTERPRISE SECURITY DASHBOARD - MULTI-STAGE DOCKER BUILD
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Image with Security Hardening
# -----------------------------------------------------------------------------
FROM node:18-alpine AS base

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dashboard -u 1001

# Security: Update packages and install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        dumb-init \
        curl \
        ca-certificates && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# -----------------------------------------------------------------------------
# Stage 2: Dependencies Installation
# -----------------------------------------------------------------------------
FROM base AS deps

# Install dependencies with security audit
RUN npm ci --only=production --audit && \
    npm cache clean --force

# Install development dependencies for building
RUN npm ci --only=development

# -----------------------------------------------------------------------------
# Stage 3: Build Stage
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application (if build script exists)
RUN npm run build 2>/dev/null || echo "No build script found, skipping..."

# Run security audit
RUN npm audit --audit-level moderate

# -----------------------------------------------------------------------------
# Stage 4: Production Image
# -----------------------------------------------------------------------------
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Security: Set proper file permissions
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R dashboard:nodejs /app

# Copy production dependencies
COPY --from=deps --chown=dashboard:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=dashboard:nodejs /app/config ./config
COPY --from=builder --chown=dashboard:nodejs /app/middleware ./middleware
COPY --from=builder --chown=dashboard:nodejs /app/routes ./routes
COPY --from=builder --chown=dashboard:nodejs /app/utils ./utils
COPY --from=builder --chown=dashboard:nodejs /app/public ./public
COPY --from=builder --chown=dashboard:nodejs /app/server.js ./
COPY --from=builder --chown=dashboard:nodejs /app/package*.json ./

# Security: Remove unnecessary files
RUN rm -rf /app/node_modules/.cache /tmp/* /var/tmp/*

# Security: Set file permissions
RUN chmod -R 755 /app && \
    chmod -R 700 /app/logs /app/uploads /app/temp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Switch to non-root user
USER dashboard

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Metadata
# -----------------------------------------------------------------------------
LABEL maintainer="Security Team <security@yourdomain.com>"
LABEL version="1.0.0"
LABEL description="Enterprise Security Dashboard"
LABEL org.opencontainers.image.title="Security Dashboard"
LABEL org.opencontainers.image.description="Enterprise-grade security monitoring dashboard"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Your Organization"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/your-org/security-dashboard"

# Security labels
LABEL security.scan="enabled"
LABEL security.updates="auto"
LABEL security.non-root="true"