/**
 * Git Memory MCP Server - API Gateway Routes Manager
 * ระบบจัดการ routing และ load balancing สำหรับ API Gateway
 * 
 * Features:
 * - Dynamic route management
 * - Load balancing algorithms
 * - Health checking
 * - Circuit breaker pattern
 * - Request routing based on various criteria
 * - Upstream server management
 * - Route caching
 * - Failover handling
 * - Metrics collection
 * - WebSocket routing
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const EventEmitter = require('events');
const crypto = require('crypto');

class APIGatewayRoutes extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = config;
        this.routes = new Map();
        this.upstreams = new Map();
        this.healthChecks = new Map();
        this.circuitBreakers = new Map();
        this.routeCache = new Map();
        this.metrics = new Map();
        
        // Load balancing state
        this.roundRobinCounters = new Map();
        this.connectionCounts = new Map();
        
        // Health check intervals
        this.healthCheckIntervals = new Map();
        
        this.init();
    }
    
    /**
     * Initialize routes manager
     */
    async init() {
        console.log('🛣️ Initializing API Gateway Routes...');
        
        try {
            // Load upstream servers
            await this.loadUpstreams();
            
            // Setup default routes
            this.setupDefaultRoutes();
            
            // Start health checks
            this.startHealthChecks();
            
            // Setup circuit breakers
            this.setupCircuitBreakers();
            
            console.log('✅ API Gateway Routes initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize routes:', error.message);
            throw error;
        }
    }
    
    /**
     * Load upstream servers from configuration
     */
    async loadUpstreams() {
        const upstreams = this.config.upstreams || [];
        
        for (const upstream of upstreams) {
            await this.addUpstream(upstream);
        }
        
        console.log(`📡 Loaded ${upstreams.length} upstream servers`);
    }
    
    /**
     * Add upstream server
     */
    async addUpstream(upstreamConfig) {
        const {
            id,
            name,
            url,
            weight = 1,
            category = 'default',
            timeout = 30000,
            maxConnections = 100,
            metadata = {}
        } = upstreamConfig;
        
        if (!id || !name || !url) {
            throw new Error('Upstream must have id, name, and url');
        }
        
        const upstream = {
            id,
            name,
            url: new URL(url),
            weight,
            category,
            timeout,
            maxConnections,
            metadata,
            healthy: true,
            connections: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            lastHealthCheck: null,
            createdAt: new Date()
        };
        
        this.upstreams.set(id, upstream);
        
        // Initialize connection count
        this.connectionCounts.set(id, 0);
        
        // Initialize metrics
        this.metrics.set(id, {
            requests: 0,
            responses: 0,
            errors: 0,
            totalResponseTime: 0,
            lastRequestTime: null
        });
        
        console.log(`➕ Added upstream: ${name} (${url})`);
        this.emit('upstreamAdded', upstream);
        
        return upstream;
    }
    
    /**
     * Remove upstream server
     */
    removeUpstream(id) {
        const upstream = this.upstreams.get(id);
        
        if (upstream) {
            // Stop health check
            const interval = this.healthCheckIntervals.get(id);
            if (interval) {
                clearInterval(interval);
                this.healthCheckIntervals.delete(id);
            }
            
            // Clean up
            this.upstreams.delete(id);
            this.connectionCounts.delete(id);
            this.metrics.delete(id);
            this.circuitBreakers.delete(id);
            
            console.log(`➖ Removed upstream: ${upstream.name}`);
            this.emit('upstreamRemoved', upstream);
        }
    }
    
    /**
     * Setup default routes
     */
    setupDefaultRoutes() {
        // Health check route
        this.addRoute({
            path: '/health',
            method: 'GET',
            handler: this.healthCheckHandler.bind(this)
        });
        
        // Status route
        this.addRoute({
            path: '/status',
            method: 'GET',
            handler: this.statusHandler.bind(this)
        });
        
        // Metrics route
        this.addRoute({
            path: '/metrics',
            method: 'GET',
            handler: this.metricsHandler.bind(this)
        });

        // Code Llama route
        this.addRoute({
            path: '/code-llama-70b',
            method: '*',
            handler: this.proxyHandler.bind(this),
            loadBalancing: true,
            category: 'ai-ml'
        });

        this.addRoute({
            path: '/code-llama-70b/*',
            method: '*',
            handler: this.proxyHandler.bind(this),
            loadBalancing: true,
            category: 'ai-ml'
        });

        // Test AI Server route
        this.addRoute({
            path: '/test-ai-server',
            method: '*',
            handler: this.proxyHandler.bind(this),
            loadBalancing: true,
            category: 'ai-ml',
            upstream: 'test-ai-server'
        });

        this.addRoute({
            path: '/test-ai-server/*',
            method: '*',
            handler: this.proxyHandler.bind(this),
            loadBalancing: true,
            category: 'ai-ml',
            upstream: 'test-ai-server'
        });

        // Default API route (proxy to upstreams)
        this.addRoute({
            path: '/api/*',
            method: '*',
            handler: this.proxyHandler.bind(this),
            loadBalancing: true
        });
        
        // MCP route (proxy to MCP servers)
        this.addRoute({
            path: '/mcp/*',
            method: '*',
            handler: this.mcpProxyHandler.bind(this),
            loadBalancing: true,
            category: 'mcp'
        });
        
        console.log('🛣️ Default routes configured');
    }
    
    /**
     * Add route
     */
    addRoute(routeConfig) {
        const {
            path,
            method = '*',
            handler,
            middleware = [],
            loadBalancing = false,
            category = 'default',
            timeout = 30000,
            retries = 3,
            cache = false,
            cacheTTL = 300
        } = routeConfig;
        
        if (!path || !handler) {
            throw new Error('Route must have path and handler');
        }
        
        const routeId = this.generateRouteId(path, method);
        
        const route = {
            id: routeId,
            path,
            method: method.toUpperCase(),
            handler,
            middleware,
            loadBalancing,
            category,
            timeout,
            retries,
            cache,
            cacheTTL,
            requests: 0,
            responses: 0,
            errors: 0,
            avgResponseTime: 0,
            createdAt: new Date()
        };
        
        this.routes.set(routeId, route);
        
        console.log(`🛣️ Added route: ${method} ${path}`);
        this.emit('routeAdded', route);
        
        return route;
    }
    
    /**
     * Remove route
     */
    removeRoute(path, method = '*') {
        const routeId = this.generateRouteId(path, method);
        const route = this.routes.get(routeId);
        
        if (route) {
            this.routes.delete(routeId);
            console.log(`🗑️ Removed route: ${method} ${path}`);
            this.emit('routeRemoved', route);
        }
    }
    
    /**
     * Generate route ID
     */
    generateRouteId(path, method) {
        return `${method.toUpperCase()}:${path}`;
    }
    
    /**
     * Find matching route
     */
    findRoute(req) {
        const { method, path } = req;
        const methodUpper = method.toUpperCase();
        
        // Check cache first
        const cacheKey = `${methodUpper}:${path}`;
        if (this.routeCache.has(cacheKey)) {
            const cached = this.routeCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.route;
            }
            this.routeCache.delete(cacheKey);
        }
        
        // Find exact match first
        const exactMatch = this.routes.get(cacheKey);
        if (exactMatch) {
            this.routeCache.set(cacheKey, {
                route: exactMatch,
                timestamp: Date.now()
            });
            return exactMatch;
        }
        
        // Find wildcard matches
        for (const [routeId, route] of this.routes) {
            if (route.method !== '*' && route.method !== methodUpper) {
                continue;
            }
            
            if (this.matchPath(path, route.path)) {
                this.routeCache.set(cacheKey, {
                    route,
                    timestamp: Date.now()
                });
                return route;
            }
        }
        
        return null;
    }
    
    /**
     * Match path with wildcards
     */
    matchPath(requestPath, routePath) {
        // Convert route path to regex
        const regexPath = routePath
            .replace(/\*/g, '.*')
            .replace(/\//g, '\\/');
        
        const regex = new RegExp(`^${regexPath}$`);
        return regex.test(requestPath);
    }
    
    /**
     * Route request
     */
    async routeRequest(req, res) {
        const startTime = Date.now();
        
        try {
            // Find matching route
            const route = this.findRoute(req);
            
            if (!route) {
                return this.sendNotFound(res);
            }
            
            // Update route metrics
            route.requests++;
            
            // Execute middleware
            for (const middleware of route.middleware) {
                await this.executeMiddleware(middleware, req, res);
            }
            
            // Execute route handler
            await route.handler(req, res, route);
            
            // Update metrics
            const responseTime = Date.now() - startTime;
            route.responses++;
            route.avgResponseTime = (route.avgResponseTime * (route.responses - 1) + responseTime) / route.responses;
            
        } catch (error) {
            console.error('❌ Route error:', error);
            
            const route = this.findRoute(req);
            if (route) {
                route.errors++;
            }
            
            this.sendError(res, error);
        }
    }
    
    /**
     * Execute middleware
     */
    async executeMiddleware(middleware, req, res) {
        return new Promise((resolve, reject) => {
            middleware(req, res, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    
    /**
     * Health check handler
     */
    async healthCheckHandler(req, res) {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            upstreams: {},
            routes: this.routes.size,
            version: '1.0.0'
        };
        
        // Check upstream health
        for (const [id, upstream] of this.upstreams) {
            healthStatus.upstreams[id] = {
                name: upstream.name,
                healthy: upstream.healthy,
                lastCheck: upstream.lastHealthCheck,
                connections: upstream.connections
            };
        }
        
        res.json(healthStatus);
    }
    
    /**
     * Status handler
     */
    async statusHandler(req, res) {
        const status = {
            gateway: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            routes: Array.from(this.routes.values()).map(route => ({
                id: route.id,
                path: route.path,
                method: route.method,
                requests: route.requests,
                responses: route.responses,
                errors: route.errors,
                avgResponseTime: route.avgResponseTime
            })),
            upstreams: Array.from(this.upstreams.values()).map(upstream => ({
                id: upstream.id,
                name: upstream.name,
                url: upstream.url.href,
                healthy: upstream.healthy,
                connections: upstream.connections,
                totalRequests: upstream.totalRequests,
                successfulRequests: upstream.successfulRequests,
                failedRequests: upstream.failedRequests,
                avgResponseTime: upstream.avgResponseTime
            }))
        };
        
        res.json(status);
    }
    
    /**
     * Metrics handler
     */
    async metricsHandler(req, res) {
        const metrics = {
            routes: {},
            upstreams: {},
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime()
            }
        };
        
        // Route metrics
        for (const [id, route] of this.routes) {
            metrics.routes[id] = {
                requests: route.requests,
                responses: route.responses,
                errors: route.errors,
                avgResponseTime: route.avgResponseTime,
                errorRate: route.requests > 0 ? (route.errors / route.requests) * 100 : 0
            };
        }
        
        // Upstream metrics
        for (const [id, upstream] of this.upstreams) {
            metrics.upstreams[id] = {
                totalRequests: upstream.totalRequests,
                successfulRequests: upstream.successfulRequests,
                failedRequests: upstream.failedRequests,
                avgResponseTime: upstream.avgResponseTime,
                connections: upstream.connections,
                healthy: upstream.healthy,
                successRate: upstream.totalRequests > 0 ? (upstream.successfulRequests / upstream.totalRequests) * 100 : 0
            };
        }
        
        res.json(metrics);
    }
    
    /**
     * Proxy handler for API routes
     */
    async proxyHandler(req, res, route) {
        if (!route.loadBalancing) {
            return this.sendError(res, new Error('No upstream configured'));
        }
        
        const upstream = this.selectUpstream(route.category);
        
        if (!upstream) {
            return this.sendError(res, new Error('No healthy upstream available'));
        }
        
        await this.proxyToUpstream(req, res, upstream);
    }
    
    /**
     * MCP proxy handler
     */
    async mcpProxyHandler(req, res, route) {
        const upstream = this.selectUpstream('mcp');
        
        if (!upstream) {
            return this.sendError(res, new Error('No MCP server available'));
        }
        
        await this.proxyToUpstream(req, res, upstream);
    }
    
    /**
     * Select upstream server using load balancing
     */
    selectUpstream(category = 'default') {
        const availableUpstreams = Array.from(this.upstreams.values())
            .filter(upstream => upstream.category === category && upstream.healthy);
        
        if (availableUpstreams.length === 0) {
            return null;
        }
        
        const algorithm = this.config.loadBalancing?.algorithm || 'round-robin';
        
        switch (algorithm) {
            case 'round-robin':
                return this.roundRobinSelect(availableUpstreams, category);
            case 'least-connections':
                return this.leastConnectionsSelect(availableUpstreams);
            case 'weighted':
                return this.weightedSelect(availableUpstreams);
            case 'ip-hash':
                return this.ipHashSelect(availableUpstreams);
            case 'health-based':
                return this.healthBasedSelect(availableUpstreams);
            default:
                return availableUpstreams[0];
        }
    }
    
    /**
     * Round-robin load balancing
     */
    roundRobinSelect(upstreams, category) {
        if (!this.roundRobinCounters.has(category)) {
            this.roundRobinCounters.set(category, 0);
        }
        
        const counter = this.roundRobinCounters.get(category);
        const selected = upstreams[counter % upstreams.length];
        
        this.roundRobinCounters.set(category, counter + 1);
        
        return selected;
    }
    
    /**
     * Least connections load balancing
     */
    leastConnectionsSelect(upstreams) {
        return upstreams.reduce((min, current) => {
            return current.connections < min.connections ? current : min;
        });
    }
    
    /**
     * Weighted load balancing
     */
    weightedSelect(upstreams) {
        const totalWeight = upstreams.reduce((sum, upstream) => sum + upstream.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const upstream of upstreams) {
            random -= upstream.weight;
            if (random <= 0) {
                return upstream;
            }
        }
        
        return upstreams[0];
    }
    
    /**
     * IP hash load balancing
     */
    ipHashSelect(upstreams) {
        // This would need the request object to get IP
        // For now, use round-robin as fallback
        return this.roundRobinSelect(upstreams, 'ip-hash');
    }
    
    /**
     * Health-based load balancing
     */
    healthBasedSelect(upstreams) {
        // Sort by response time and success rate
        const scored = upstreams.map(upstream => {
            const successRate = upstream.totalRequests > 0 ? 
                upstream.successfulRequests / upstream.totalRequests : 1;
            const responseScore = upstream.avgResponseTime > 0 ? 
                1000 / upstream.avgResponseTime : 1;
            
            return {
                upstream,
                score: successRate * responseScore
            };
        });
        
        scored.sort((a, b) => b.score - a.score);
        
        return scored[0].upstream;
    }
    
    /**
     * Proxy request to upstream
     */
    async proxyToUpstream(req, res, upstream) {
        const startTime = Date.now();
        
        // Check circuit breaker
        if (this.isCircuitOpen(upstream.id)) {
            return this.sendError(res, new Error('Circuit breaker is open'));
        }
        
        // Increment connection count
        upstream.connections++;
        this.connectionCounts.set(upstream.id, upstream.connections);
        
        try {
            const response = await this.makeUpstreamRequest(req, upstream);
            
            // Update metrics
            upstream.totalRequests++;
            upstream.successfulRequests++;
            
            const responseTime = Date.now() - startTime;
            upstream.avgResponseTime = upstream.totalRequests > 1 ? 
                (upstream.avgResponseTime * (upstream.totalRequests - 1) + responseTime) / upstream.totalRequests :
                responseTime;
            
            // Reset circuit breaker on success
            this.recordSuccess(upstream.id);
            
            // Send response
            res.status(response.statusCode);
            
            // Copy headers
            for (const [key, value] of Object.entries(response.headers)) {
                res.set(key, value);
            }
            
            res.send(response.body);
            
        } catch (error) {
            console.error(`❌ Upstream error (${upstream.name}):`, error.message);
            
            // Update metrics
            upstream.totalRequests++;
            upstream.failedRequests++;
            
            // Record failure for circuit breaker
            this.recordFailure(upstream.id);
            
            this.sendError(res, error);
            
        } finally {
            // Decrement connection count
            upstream.connections--;
            this.connectionCounts.set(upstream.id, upstream.connections);
        }
    }
    
    /**
     * Make request to upstream server
     */
    async makeUpstreamRequest(req, upstream) {
        return new Promise((resolve, reject) => {
            const { protocol, hostname, port } = upstream.url;
            const isHttps = protocol === 'https:';
            
            const options = {
                hostname,
                port: port || (isHttps ? 443 : 80),
                path: req.url,
                method: req.method,
                headers: { ...req.headers },
                timeout: upstream.timeout
            };
            
            // Remove hop-by-hop headers
            delete options.headers.host;
            delete options.headers.connection;
            
            const client = isHttps ? https : http;
            
            const proxyReq = client.request(options, (proxyRes) => {
                let body = '';
                
                proxyRes.on('data', (chunk) => {
                    body += chunk;
                });
                
                proxyRes.on('end', () => {
                    resolve({
                        statusCode: proxyRes.statusCode,
                        headers: proxyRes.headers,
                        body
                    });
                });
            });
            
            proxyReq.on('error', reject);
            proxyReq.on('timeout', () => {
                proxyReq.destroy();
                reject(new Error('Request timeout'));
            });
            
            // Send request body if present
            if (req.body) {
                proxyReq.write(JSON.stringify(req.body));
            }
            
            proxyReq.end();
        });
    }
    
    /**
     * Setup circuit breakers
     */
    setupCircuitBreakers() {
        const cbConfig = this.config.circuitBreaker || {};
        
        if (!cbConfig.enabled) {
            return;
        }
        
        for (const [id] of this.upstreams) {
            this.circuitBreakers.set(id, {
                state: 'closed', // closed, open, half-open
                failures: 0,
                lastFailureTime: null,
                nextAttempt: null,
                failureThreshold: cbConfig.failureThreshold || 5,
                resetTimeout: cbConfig.resetTimeout || 60000
            });
        }
        
        console.log('⚡ Circuit breakers configured');
    }
    
    /**
     * Check if circuit breaker is open
     */
    isCircuitOpen(upstreamId) {
        const cb = this.circuitBreakers.get(upstreamId);
        
        if (!cb) {
            return false;
        }
        
        if (cb.state === 'open') {
            if (Date.now() > cb.nextAttempt) {
                cb.state = 'half-open';
                console.log(`🔄 Circuit breaker half-open: ${upstreamId}`);
            } else {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Record success for circuit breaker
     */
    recordSuccess(upstreamId) {
        const cb = this.circuitBreakers.get(upstreamId);
        
        if (cb) {
            if (cb.state === 'half-open') {
                cb.state = 'closed';
                cb.failures = 0;
                console.log(`✅ Circuit breaker closed: ${upstreamId}`);
            }
        }
    }
    
    /**
     * Record failure for circuit breaker
     */
    recordFailure(upstreamId) {
        const cb = this.circuitBreakers.get(upstreamId);
        
        if (cb) {
            cb.failures++;
            cb.lastFailureTime = Date.now();
            
            if (cb.failures >= cb.failureThreshold) {
                cb.state = 'open';
                cb.nextAttempt = Date.now() + cb.resetTimeout;
                console.log(`🚨 Circuit breaker opened: ${upstreamId}`);
            }
        }
    }
    
    /**
     * Start health checks
     */
    startHealthChecks() {
        const healthConfig = this.config.loadBalancing || {};
        const interval = healthConfig.healthCheckInterval || 30000;
        const timeout = healthConfig.healthCheckTimeout || 5000;
        const path = healthConfig.healthCheckPath || '/health';
        
        for (const [id, upstream] of this.upstreams) {
            const healthCheckInterval = setInterval(async () => {
                await this.performHealthCheck(upstream, timeout, path);
            }, interval);
            
            this.healthCheckIntervals.set(id, healthCheckInterval);
        }
        
        console.log('❤️ Health checks started');
    }
    
    /**
     * Perform health check on upstream
     */
    async performHealthCheck(upstream, timeout, path) {
        const startTime = Date.now();
        
        try {
            const { protocol, hostname, port } = upstream.url;
            const isHttps = protocol === 'https:';
            
            const options = {
                hostname,
                port: port || (isHttps ? 443 : 80),
                path,
                method: 'GET',
                timeout
            };
            
            const client = isHttps ? https : http;
            
            await new Promise((resolve, reject) => {
                const req = client.request(options, (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Health check failed: ${res.statusCode}`));
                    }
                });
                
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Health check timeout'));
                });
                
                req.end();
            });
            
            // Mark as healthy
            if (!upstream.healthy) {
                upstream.healthy = true;
                console.log(`✅ Upstream healthy: ${upstream.name}`);
                this.emit('upstreamHealthy', upstream);
            }
            
        } catch (error) {
            // Mark as unhealthy
            if (upstream.healthy) {
                upstream.healthy = false;
                console.log(`❌ Upstream unhealthy: ${upstream.name} - ${error.message}`);
                this.emit('upstreamUnhealthy', upstream);
            }
        } finally {
            upstream.lastHealthCheck = new Date();
        }
    }
    
    /**
     * Send not found response
     */
    sendNotFound(res) {
        res.status(404).json({
            success: false,
            error: {
                code: 404,
                message: 'Route not found'
            }
        });
    }
    
    /**
     * Send error response
     */
    sendError(res, error) {
        const statusCode = error.statusCode || 500;
        
        res.status(statusCode).json({
            success: false,
            error: {
                code: statusCode,
                message: error.message || 'Internal Server Error'
            }
        });
    }
    
    /**
     * Get route statistics
     */
    getRouteStats() {
        const stats = {
            routes: this.routes.size,
            upstreams: this.upstreams.size,
            healthyUpstreams: Array.from(this.upstreams.values()).filter(u => u.healthy).length,
            totalRequests: 0,
            totalResponses: 0,
            totalErrors: 0
        };
        
        for (const route of this.routes.values()) {
            stats.totalRequests += route.requests;
            stats.totalResponses += route.responses;
            stats.totalErrors += route.errors;
        }
        
        return stats;
    }
    
    /**
     * Apply routes to Express app
     */
    applyToApp(app) {
        console.log('🛣️ Applying routes to Express app...');
        
        // Apply all registered routes
        for (const [routeKey, route] of this.routes) {
            const { path, method, handler } = route;
            
            if (method === '*') {
                // Apply to all methods
                app.all(path, handler);
            } else {
                // Apply to specific method
                app[method.toLowerCase()](path, handler);
            }
            
            console.log(`📍 Route registered: ${method} ${path}`);
        }
        
        console.log('✅ All routes applied to Express app');
    }
    
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Reload upstreams if changed
        if (newConfig.upstreams) {
            this.loadUpstreams();
        }
        
        console.log('🔄 Routes configuration updated');
        this.emit('configUpdated', newConfig);
    }
    
    /**
     * Stop routes manager
     */
    async stop() {
        console.log('🛑 Stopping routes manager...');
        
        // Stop health check intervals
        for (const [id, interval] of this.healthCheckIntervals) {
            clearInterval(interval);
            console.log(`❤️ Stopped health check: ${id}`);
        }
        
        // Clear all data
        this.routes.clear();
        this.upstreams.clear();
        this.healthChecks.clear();
        this.circuitBreakers.clear();
        this.routeCache.clear();
        this.metrics.clear();
        this.healthCheckIntervals.clear();
        
        console.log('✅ Routes manager stopped');
        this.emit('stopped');
    }
}

// Export class
module.exports = APIGatewayRoutes;

// CLI interface
if (require.main === module) {
    const routesManager = new APIGatewayRoutes({
        upstreams: [
            {
                id: 'test-1',
                name: 'Test Server 1',
                url: 'http://localhost:3001',
                category: 'api'
            },
            {
                id: 'test-2',
                name: 'Test Server 2',
                url: 'http://localhost:3002',
                category: 'api'
            }
        ],
        loadBalancing: {
            algorithm: 'round-robin',
            healthCheckInterval: 30000
        }
    });
    
    // Event listeners
    routesManager.on('initialized', () => {
        console.log('🎉 Routes manager initialized');
        console.log('📊 Stats:', routesManager.getRouteStats());
    });
    
    routesManager.on('upstreamHealthy', (upstream) => {
        console.log(`💚 Upstream back online: ${upstream.name}`);
    });
    
    routesManager.on('upstreamUnhealthy', (upstream) => {
        console.log(`💔 Upstream went offline: ${upstream.name}`);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await routesManager.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await routesManager.stop();
        process.exit(0);
    });
}