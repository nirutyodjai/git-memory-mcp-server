/**
 * Git Memory MCP Server - API Gateway Load Balancer
 * Advanced Load Balancer สำหรับ API Gateway ที่รองรับ 1000 MCP servers
 * 
 * Features:
 * - Multiple load balancing algorithms
 * - Health checking and failover
 * - Circuit breaker pattern
 * - Weighted routing
 * - Sticky sessions
 * - Geographic routing
 * - Auto-scaling integration
 * - Performance monitoring
 * - Dynamic server management
 * - Request queuing
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const os = require('os');

class APIGatewayLoadBalancer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            algorithm: 'round_robin', // round_robin, least_connections, weighted, ip_hash, health_based, geographic
            healthCheck: {
                enabled: true,
                interval: 30000,
                timeout: 5000,
                retries: 3,
                path: '/health',
                expectedStatus: 200
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                recoveryTimeout: 60000,
                halfOpenMaxCalls: 3
            },
            stickySession: {
                enabled: false,
                cookieName: 'lb_session',
                ttl: 3600000 // 1 hour
            },
            geographic: {
                enabled: false,
                regions: ['us-east', 'us-west', 'eu-west', 'asia-pacific']
            },
            queuing: {
                enabled: true,
                maxQueueSize: 1000,
                timeout: 30000
            },
            autoScaling: {
                enabled: false,
                minServers: 10,
                maxServers: 1000,
                targetCpuUtilization: 70,
                scaleUpCooldown: 300000,
                scaleDownCooldown: 600000
            },
            ...config
        };
        
        this.servers = new Map();
        this.serverGroups = new Map();
        this.currentIndex = 0;
        this.sessions = new Map();
        this.requestQueue = [];
        this.circuitBreakers = new Map();
        this.healthCheckIntervals = new Map();
        this.metrics = {
            totalRequests: 0,
            totalResponses: 0,
            totalErrors: 0,
            averageResponseTime: 0,
            requestsPerSecond: 0,
            serverMetrics: new Map()
        };
        
        this.startTime = Date.now();
        this.lastMetricsUpdate = Date.now();
        
        this.setupMetricsCollection();
        this.setupQueueProcessor();
        
        console.log('⚖️ Load Balancer initialized');
    }
    
    /**
     * Add server to load balancer
     */
    addServer(serverId, serverConfig) {
        const server = {
            id: serverId,
            host: serverConfig.host,
            port: serverConfig.port,
            weight: serverConfig.weight || 1,
            region: serverConfig.region || 'default',
            group: serverConfig.group || 'default',
            healthy: true,
            connections: 0,
            totalRequests: 0,
            totalErrors: 0,
            averageResponseTime: 0,
            lastHealthCheck: null,
            metadata: serverConfig.metadata || {},
            ...serverConfig
        };
        
        this.servers.set(serverId, server);
        
        // Add to server group
        if (!this.serverGroups.has(server.group)) {
            this.serverGroups.set(server.group, new Set());
        }
        this.serverGroups.get(server.group).add(serverId);
        
        // Initialize metrics
        this.metrics.serverMetrics.set(serverId, {
            requests: 0,
            responses: 0,
            errors: 0,
            responseTime: [],
            connections: 0,
            cpuUsage: 0,
            memoryUsage: 0
        });
        
        // Initialize circuit breaker
        this.circuitBreakers.set(serverId, {
            state: 'closed', // closed, open, half-open
            failures: 0,
            lastFailure: null,
            nextAttempt: null
        });
        
        // Start health checking
        if (this.config.healthCheck.enabled) {
            this.startHealthCheck(serverId);
        }
        
        console.log(`⚖️ Server ${serverId} added to load balancer`);
        this.emit('serverAdded', server);
        
        return server;
    }
    
    /**
     * Remove server from load balancer
     */
    removeServer(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            return false;
        }
        
        // Stop health checking
        this.stopHealthCheck(serverId);
        
        // Remove from server group
        const group = this.serverGroups.get(server.group);
        if (group) {
            group.delete(serverId);
            if (group.size === 0) {
                this.serverGroups.delete(server.group);
            }
        }
        
        // Clean up
        this.servers.delete(serverId);
        this.metrics.serverMetrics.delete(serverId);
        this.circuitBreakers.delete(serverId);
        
        console.log(`⚖️ Server ${serverId} removed from load balancer`);
        this.emit('serverRemoved', server);
        
        return true;
    }
    
    /**
     * Get next server based on load balancing algorithm
     */
    getNextServer(request = {}) {
        const availableServers = this.getAvailableServers(request.group);
        
        if (availableServers.length === 0) {
            throw new Error('No available servers');
        }
        
        let selectedServer;
        
        switch (this.config.algorithm) {
            case 'round_robin':
                selectedServer = this.roundRobinSelection(availableServers);
                break;
            case 'least_connections':
                selectedServer = this.leastConnectionsSelection(availableServers);
                break;
            case 'weighted':
                selectedServer = this.weightedSelection(availableServers);
                break;
            case 'ip_hash':
                selectedServer = this.ipHashSelection(availableServers, request.clientIp);
                break;
            case 'health_based':
                selectedServer = this.healthBasedSelection(availableServers);
                break;
            case 'geographic':
                selectedServer = this.geographicSelection(availableServers, request.region);
                break;
            default:
                selectedServer = this.roundRobinSelection(availableServers);
        }
        
        // Handle sticky sessions
        if (this.config.stickySession.enabled && request.sessionId) {
            const stickyServer = this.getStickyServer(request.sessionId, availableServers);
            if (stickyServer) {
                selectedServer = stickyServer;
            } else {
                this.setStickySession(request.sessionId, selectedServer.id);
            }
        }
        
        return selectedServer;
    }
    
    /**
     * Get available servers
     */
    getAvailableServers(group = null) {
        let servers = Array.from(this.servers.values());
        
        // Filter by group if specified
        if (group) {
            servers = servers.filter(server => server.group === group);
        }
        
        // Filter healthy servers and check circuit breaker
        return servers.filter(server => {
            const circuitBreaker = this.circuitBreakers.get(server.id);
            return server.healthy && circuitBreaker.state !== 'open';
        });
    }
    
    /**
     * Round robin selection
     */
    roundRobinSelection(servers) {
        const server = servers[this.currentIndex % servers.length];
        this.currentIndex++;
        return server;
    }
    
    /**
     * Least connections selection
     */
    leastConnectionsSelection(servers) {
        return servers.reduce((min, server) => {
            return server.connections < min.connections ? server : min;
        });
    }
    
    /**
     * Weighted selection
     */
    weightedSelection(servers) {
        const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const server of servers) {
            random -= server.weight;
            if (random <= 0) {
                return server;
            }
        }
        
        return servers[0];
    }
    
    /**
     * IP hash selection
     */
    ipHashSelection(servers, clientIp) {
        if (!clientIp) {
            return this.roundRobinSelection(servers);
        }
        
        const hash = crypto.createHash('md5').update(clientIp).digest('hex');
        const index = parseInt(hash.substring(0, 8), 16) % servers.length;
        return servers[index];
    }
    
    /**
     * Health-based selection
     */
    healthBasedSelection(servers) {
        // Sort by health score (lower response time and error rate = better)
        const scoredServers = servers.map(server => {
            const metrics = this.metrics.serverMetrics.get(server.id);
            const avgResponseTime = metrics.responseTime.length > 0 ?
                metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length : 0;
            const errorRate = metrics.requests > 0 ? metrics.errors / metrics.requests : 0;
            
            const score = avgResponseTime + (errorRate * 1000) + (server.connections * 10);
            return { server, score };
        });
        
        scoredServers.sort((a, b) => a.score - b.score);
        return scoredServers[0].server;
    }
    
    /**
     * Geographic selection
     */
    geographicSelection(servers, clientRegion) {
        if (!clientRegion) {
            return this.roundRobinSelection(servers);
        }
        
        // Prefer servers in the same region
        const regionalServers = servers.filter(server => server.region === clientRegion);
        if (regionalServers.length > 0) {
            return this.leastConnectionsSelection(regionalServers);
        }
        
        return this.leastConnectionsSelection(servers);
    }
    
    /**
     * Handle sticky sessions
     */
    getStickyServer(sessionId, availableServers) {
        const session = this.sessions.get(sessionId);
        if (!session || Date.now() > session.expires) {
            this.sessions.delete(sessionId);
            return null;
        }
        
        const server = availableServers.find(s => s.id === session.serverId);
        return server || null;
    }
    
    setStickySession(sessionId, serverId) {
        this.sessions.set(sessionId, {
            serverId,
            expires: Date.now() + this.config.stickySession.ttl
        });
    }
    
    /**
     * Process request through load balancer
     */
    async processRequest(request) {
        this.metrics.totalRequests++;
        
        try {
            // Check if request should be queued
            if (this.shouldQueueRequest()) {
                return await this.queueRequest(request);
            }
            
            const server = this.getNextServer(request);
            
            // Update server metrics
            server.connections++;
            server.totalRequests++;
            
            const serverMetrics = this.metrics.serverMetrics.get(server.id);
            serverMetrics.requests++;
            serverMetrics.connections = server.connections;
            
            const startTime = Date.now();
            
            try {
                // Forward request to server
                const response = await this.forwardRequest(server, request);
                
                const responseTime = Date.now() - startTime;
                
                // Update metrics
                server.connections--;
                server.averageResponseTime = this.updateAverageResponseTime(
                    server.averageResponseTime,
                    responseTime,
                    server.totalRequests
                );
                
                serverMetrics.responses++;
                serverMetrics.responseTime.push(responseTime);
                if (serverMetrics.responseTime.length > 100) {
                    serverMetrics.responseTime.shift();
                }
                
                this.metrics.totalResponses++;
                this.resetCircuitBreaker(server.id);
                
                return response;
                
            } catch (error) {
                // Handle server error
                server.connections--;
                server.totalErrors++;
                serverMetrics.errors++;
                this.metrics.totalErrors++;
                
                this.handleServerError(server.id, error);
                
                // Try failover
                if (this.shouldFailover(server.id)) {
                    return await this.processRequest(request);
                }
                
                throw error;
            }
            
        } catch (error) {
            console.error('⚖️ Load balancer error:', error);
            throw error;
        }
    }
    
    /**
     * Forward request to server (placeholder)
     */
    async forwardRequest(server, request) {
        // This would be implemented by the actual gateway
        // For now, simulate request forwarding
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.95) { // 95% success rate
                    resolve({ status: 200, data: 'Success' });
                } else {
                    reject(new Error('Server error'));
                }
            }, Math.random() * 100 + 50); // 50-150ms response time
        });
    }
    
    /**
     * Check if request should be queued
     */
    shouldQueueRequest() {
        if (!this.config.queuing.enabled) {
            return false;
        }
        
        const availableServers = this.getAvailableServers();
        const totalConnections = availableServers.reduce((sum, server) => sum + server.connections, 0);
        const maxConnections = availableServers.length * 100; // Assume 100 max connections per server
        
        return totalConnections > maxConnections * 0.8; // Queue when 80% capacity
    }
    
    /**
     * Queue request
     */
    async queueRequest(request) {
        if (this.requestQueue.length >= this.config.queuing.maxQueueSize) {
            throw new Error('Request queue full');
        }
        
        return new Promise((resolve, reject) => {
            const queueItem = {
                request,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            this.requestQueue.push(queueItem);
            
            // Set timeout
            setTimeout(() => {
                const index = this.requestQueue.indexOf(queueItem);
                if (index !== -1) {
                    this.requestQueue.splice(index, 1);
                    reject(new Error('Request timeout'));
                }
            }, this.config.queuing.timeout);
        });
    }
    
    /**
     * Process queued requests
     */
    setupQueueProcessor() {
        setInterval(() => {
            if (this.requestQueue.length === 0) {
                return;
            }
            
            const availableCapacity = this.getAvailableCapacity();
            const toProcess = Math.min(this.requestQueue.length, availableCapacity);
            
            for (let i = 0; i < toProcess; i++) {
                const queueItem = this.requestQueue.shift();
                
                this.processRequest(queueItem.request)
                    .then(queueItem.resolve)
                    .catch(queueItem.reject);
            }
        }, 100);
    }
    
    /**
     * Get available capacity
     */
    getAvailableCapacity() {
        const availableServers = this.getAvailableServers();
        const totalConnections = availableServers.reduce((sum, server) => sum + server.connections, 0);
        const maxConnections = availableServers.length * 100;
        
        return Math.max(0, maxConnections - totalConnections);
    }
    
    /**
     * Handle server error
     */
    handleServerError(serverId, error) {
        const circuitBreaker = this.circuitBreakers.get(serverId);
        if (!circuitBreaker) return;
        
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = Date.now();
        
        if (circuitBreaker.failures >= this.config.circuitBreaker.failureThreshold) {
            circuitBreaker.state = 'open';
            circuitBreaker.nextAttempt = Date.now() + this.config.circuitBreaker.recoveryTimeout;
            
            console.log(`⚖️ Circuit breaker opened for server ${serverId}`);
            this.emit('circuitBreakerOpened', { serverId, error });
        }
    }
    
    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker(serverId) {
        const circuitBreaker = this.circuitBreakers.get(serverId);
        if (!circuitBreaker) return;
        
        if (circuitBreaker.state === 'half-open') {
            circuitBreaker.state = 'closed';
            circuitBreaker.failures = 0;
            console.log(`⚖️ Circuit breaker closed for server ${serverId}`);
            this.emit('circuitBreakerClosed', { serverId });
        } else if (circuitBreaker.state === 'closed') {
            circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
        }
    }
    
    /**
     * Check if should failover
     */
    shouldFailover(serverId) {
        const circuitBreaker = this.circuitBreakers.get(serverId);
        return circuitBreaker && circuitBreaker.state === 'open';
    }
    
    /**
     * Start health check for server
     */
    startHealthCheck(serverId) {
        const interval = setInterval(async () => {
            await this.performHealthCheck(serverId);
        }, this.config.healthCheck.interval);
        
        this.healthCheckIntervals.set(serverId, interval);
    }
    
    /**
     * Stop health check for server
     */
    stopHealthCheck(serverId) {
        const interval = this.healthCheckIntervals.get(serverId);
        if (interval) {
            clearInterval(interval);
            this.healthCheckIntervals.delete(serverId);
        }
    }
    
    /**
     * Perform health check
     */
    async performHealthCheck(serverId) {
        const server = this.servers.get(serverId);
        if (!server) return;
        
        try {
            // Simulate health check
            const healthy = Math.random() > 0.05; // 95% uptime
            
            const wasHealthy = server.healthy;
            server.healthy = healthy;
            server.lastHealthCheck = Date.now();
            
            if (!wasHealthy && healthy) {
                console.log(`⚖️ Server ${serverId} is now healthy`);
                this.emit('serverHealthy', server);
                
                // Try to recover circuit breaker
                const circuitBreaker = this.circuitBreakers.get(serverId);
                if (circuitBreaker && circuitBreaker.state === 'open' && 
                    Date.now() >= circuitBreaker.nextAttempt) {
                    circuitBreaker.state = 'half-open';
                    console.log(`⚖️ Circuit breaker half-open for server ${serverId}`);
                }
            } else if (wasHealthy && !healthy) {
                console.log(`⚖️ Server ${serverId} is now unhealthy`);
                this.emit('serverUnhealthy', server);
            }
            
        } catch (error) {
            console.error(`⚖️ Health check failed for server ${serverId}:`, error);
            server.healthy = false;
            server.lastHealthCheck = Date.now();
        }
    }
    
    /**
     * Update average response time
     */
    updateAverageResponseTime(currentAvg, newTime, totalRequests) {
        return ((currentAvg * (totalRequests - 1)) + newTime) / totalRequests;
    }
    
    /**
     * Setup metrics collection
     */
    setupMetricsCollection() {
        setInterval(() => {
            this.updateMetrics();
        }, 5000);
    }
    
    /**
     * Update metrics
     */
    updateMetrics() {
        const now = Date.now();
        const timeDiff = (now - this.lastMetricsUpdate) / 1000;
        
        // Calculate requests per second
        const requestsDiff = this.metrics.totalRequests - (this.lastTotalRequests || 0);
        this.metrics.requestsPerSecond = requestsDiff / timeDiff;
        
        // Calculate average response time
        let totalResponseTime = 0;
        let totalResponses = 0;
        
        for (const serverMetrics of this.metrics.serverMetrics.values()) {
            if (serverMetrics.responseTime.length > 0) {
                const avgTime = serverMetrics.responseTime.reduce((a, b) => a + b, 0) / serverMetrics.responseTime.length;
                totalResponseTime += avgTime * serverMetrics.responses;
                totalResponses += serverMetrics.responses;
            }
        }
        
        this.metrics.averageResponseTime = totalResponses > 0 ? totalResponseTime / totalResponses : 0;
        
        this.lastTotalRequests = this.metrics.totalRequests;
        this.lastMetricsUpdate = now;
        
        this.emit('metricsUpdated', this.metrics);
    }
    
    /**
     * Get load balancer statistics
     */
    getStats() {
        const healthyServers = Array.from(this.servers.values()).filter(s => s.healthy).length;
        const totalServers = this.servers.size;
        
        return {
            algorithm: this.config.algorithm,
            servers: {
                total: totalServers,
                healthy: healthyServers,
                unhealthy: totalServers - healthyServers
            },
            requests: {
                total: this.metrics.totalRequests,
                responses: this.metrics.totalResponses,
                errors: this.metrics.totalErrors,
                queued: this.requestQueue.length,
                rps: this.metrics.requestsPerSecond
            },
            performance: {
                averageResponseTime: this.metrics.averageResponseTime,
                errorRate: this.metrics.totalRequests > 0 ? 
                    (this.metrics.totalErrors / this.metrics.totalRequests) * 100 : 0
            },
            circuitBreakers: {
                open: Array.from(this.circuitBreakers.values()).filter(cb => cb.state === 'open').length,
                halfOpen: Array.from(this.circuitBreakers.values()).filter(cb => cb.state === 'half-open').length
            },
            uptime: Date.now() - this.startTime
        };
    }
    
    /**
     * Get server details
     */
    getServerDetails() {
        return Array.from(this.servers.values()).map(server => {
            const metrics = this.metrics.serverMetrics.get(server.id);
            const circuitBreaker = this.circuitBreakers.get(server.id);
            
            return {
                ...server,
                metrics,
                circuitBreaker: {
                    state: circuitBreaker.state,
                    failures: circuitBreaker.failures
                }
            };
        });
    }
    
    /**
     * Update server configuration
     */
    updateServerConfig(serverId, config) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`Server ${serverId} not found`);
        }
        
        Object.assign(server, config);
        console.log(`⚖️ Server ${serverId} configuration updated`);
        this.emit('serverUpdated', server);
        
        return server;
    }
    
    /**
     * Clean up expired sessions
     */
    cleanupSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expires) {
                this.sessions.delete(sessionId);
            }
        }
    }
    
    /**
     * Start load balancer
     */
    async start() {
        console.log('⚖️ Starting load balancer...');
        
        // Start session cleanup
        if (this.config.stickySession.enabled) {
            setInterval(() => {
                this.cleanupSessions();
            }, 60000); // Clean up every minute
        }
        
        console.log('✅ Load balancer started');
        this.emit('started');
    }
    
    /**
     * Stop load balancer
     */
    async stop() {
        console.log('🛑 Stopping load balancer...');
        
        // Stop all health checks
        for (const interval of this.healthCheckIntervals.values()) {
            clearInterval(interval);
        }
        this.healthCheckIntervals.clear();
        
        console.log('✅ Load balancer stopped');
        this.emit('stopped');
    }
}

// Export class
module.exports = APIGatewayLoadBalancer;

// CLI interface
if (require.main === module) {
    const loadBalancer = new APIGatewayLoadBalancer({
        algorithm: 'least_connections',
        healthCheck: {
            enabled: true,
            interval: 30000
        },
        circuitBreaker: {
            enabled: true,
            failureThreshold: 5
        }
    });
    
    // Add some test servers
    for (let i = 1; i <= 10; i++) {
        loadBalancer.addServer(`server-${i}`, {
            host: 'localhost',
            port: 3000 + i,
            weight: Math.floor(Math.random() * 5) + 1,
            region: i <= 5 ? 'us-east' : 'us-west'
        });
    }
    
    loadBalancer.start().then(() => {
        console.log('🎉 Load balancer started successfully');
        
        // Simulate some requests
        setInterval(async () => {
            try {
                const request = {
                    clientIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
                    region: Math.random() > 0.5 ? 'us-east' : 'us-west'
                };
                
                await loadBalancer.processRequest(request);
            } catch (error) {
                // Ignore errors for demo
            }
        }, 100);
        
        // Print stats every 10 seconds
        setInterval(() => {
            const stats = loadBalancer.getStats();
            console.log('📊 Load Balancer Stats:', JSON.stringify(stats, null, 2));
        }, 10000);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await loadBalancer.stop();
        process.exit(0);
    });
}