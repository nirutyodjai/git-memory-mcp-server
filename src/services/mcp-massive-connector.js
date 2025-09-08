/**
 * MCP Massive Connector - เชื่อมต่อ MCP 2500+ ตัวพร้อมกัน
 * รองรับ distributed architecture และ auto-scaling
 */

const EventEmitter = require('events');
const cluster = require('cluster');
const os = require('os');
const WebSocket = require('ws');
const { Worker } = require('worker_threads');

class MCPMassiveConnector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            maxConnections: options.maxConnections || 2500,
            workersPerCore: options.workersPerCore || 4,
            connectionPoolSize: options.connectionPoolSize || 100,
            retryAttempts: options.retryAttempts || 3,
            healthCheckInterval: options.healthCheckInterval || 30000,
            loadBalancingStrategy: options.loadBalancingStrategy || 'round-robin',
            ...options
        };
        
        this.connections = new Map();
        this.connectionPools = new Map();
        this.workers = new Map();
        this.loadBalancer = null;
        this.healthMonitor = null;
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            failedConnections: 0,
            messagesProcessed: 0,
            averageResponseTime: 0
        };
        
        this.mcpServers = [
            // AI & ML Services
            { name: 'openai-gpt4', url: 'ws://localhost:3001', category: 'ai' },
            { name: 'anthropic-claude', url: 'ws://localhost:3002', category: 'ai' },
            { name: 'google-gemini', url: 'ws://localhost:3003', category: 'ai' },
            { name: 'meta-llama', url: 'ws://localhost:3004', category: 'ai' },
            { name: 'stability-ai', url: 'ws://localhost:3005', category: 'ai' },
            
            // Development Tools
            { name: 'github-api', url: 'ws://localhost:3010', category: 'dev' },
            { name: 'gitlab-api', url: 'ws://localhost:3011', category: 'dev' },
            { name: 'docker-hub', url: 'ws://localhost:3012', category: 'dev' },
            { name: 'kubernetes-api', url: 'ws://localhost:3013', category: 'dev' },
            { name: 'jenkins-ci', url: 'ws://localhost:3014', category: 'dev' },
            
            // Database Services
            { name: 'mongodb-atlas', url: 'ws://localhost:3020', category: 'database' },
            { name: 'postgresql', url: 'ws://localhost:3021', category: 'database' },
            { name: 'redis-cloud', url: 'ws://localhost:3022', category: 'database' },
            { name: 'elasticsearch', url: 'ws://localhost:3023', category: 'database' },
            { name: 'neo4j', url: 'ws://localhost:3024', category: 'database' },
            
            // Cloud Services
            { name: 'aws-ec2', url: 'ws://localhost:3030', category: 'cloud' },
            { name: 'azure-compute', url: 'ws://localhost:3031', category: 'cloud' },
            { name: 'gcp-compute', url: 'ws://localhost:3032', category: 'cloud' },
            { name: 'digitalocean', url: 'ws://localhost:3033', category: 'cloud' },
            { name: 'vercel', url: 'ws://localhost:3034', category: 'cloud' },
            
            // Communication
            { name: 'slack-api', url: 'ws://localhost:3040', category: 'comm' },
            { name: 'discord-api', url: 'ws://localhost:3041', category: 'comm' },
            { name: 'teams-api', url: 'ws://localhost:3042', category: 'comm' },
            { name: 'telegram-bot', url: 'ws://localhost:3043', category: 'comm' },
            { name: 'whatsapp-api', url: 'ws://localhost:3044', category: 'comm' }
        ];
        
        // Generate additional MCP servers to reach 2500
        this.generateAdditionalMCPServers();
    }
    
    generateAdditionalMCPServers() {
        const categories = ['ai', 'dev', 'database', 'cloud', 'comm', 'analytics', 'security', 'monitoring'];
        const basePort = 4000;
        
        for (let i = this.mcpServers.length; i < this.config.maxConnections; i++) {
            const category = categories[i % categories.length];
            const port = basePort + i;
            
            this.mcpServers.push({
                name: `mcp-server-${i}`,
                url: `ws://localhost:${port}`,
                category: category,
                priority: Math.floor(Math.random() * 10) + 1
            });
        }
    }
    
    async initialize() {
        console.log('🚀 Initializing MCP Massive Connector...');
        
        // Setup cluster if master process
        if (cluster.isMaster) {
            await this.setupCluster();
        } else {
            await this.setupWorker();
        }
        
        // Initialize load balancer
        this.loadBalancer = new MCPLoadBalancer(this.config.loadBalancingStrategy);
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        console.log(`✅ MCP Massive Connector initialized with ${this.config.maxConnections} potential connections`);
    }
    
    async setupCluster() {
        const numCPUs = os.cpus().length;
        const totalWorkers = numCPUs * this.config.workersPerCore;
        
        console.log(`🔧 Setting up cluster with ${totalWorkers} workers`);
        
        for (let i = 0; i < totalWorkers; i++) {
            const worker = cluster.fork();
            this.workers.set(worker.id, {
                worker,
                connections: 0,
                load: 0
            });
        }
        
        cluster.on('exit', (worker, code, signal) => {
            console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
            const newWorker = cluster.fork();
            this.workers.set(newWorker.id, {
                worker: newWorker,
                connections: 0,
                load: 0
            });
        });
    }
    
    async setupWorker() {
        // Worker process setup
        const connectionsPerWorker = Math.ceil(this.config.maxConnections / this.workers.size);
        await this.createConnectionPools(connectionsPerWorker);
    }
    
    async createConnectionPools(maxConnections) {
        const poolSize = Math.ceil(maxConnections / this.config.connectionPoolSize);
        
        for (let i = 0; i < poolSize; i++) {
            const pool = new MCPConnectionPool({
                size: this.config.connectionPoolSize,
                retryAttempts: this.config.retryAttempts
            });
            
            this.connectionPools.set(`pool-${i}`, pool);
        }
    }
    
    async connectAll() {
        console.log('🔗 Starting massive MCP connections...');
        
        const batchSize = 50; // Connect in batches to avoid overwhelming
        const batches = [];
        
        for (let i = 0; i < this.mcpServers.length; i += batchSize) {
            batches.push(this.mcpServers.slice(i, i + batchSize));
        }
        
        for (const [index, batch] of batches.entries()) {
            console.log(`📦 Connecting batch ${index + 1}/${batches.length} (${batch.length} servers)`);
            
            const promises = batch.map(server => this.connectToMCP(server));
            await Promise.allSettled(promises);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Connected to ${this.metrics.activeConnections}/${this.config.maxConnections} MCP servers`);
    }
    
    async connectToMCP(server) {
        try {
            const startTime = Date.now();
            
            const ws = new WebSocket(server.url, {
                handshakeTimeout: 5000,
                perMessageDeflate: false
            });
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    ws.terminate();
                    reject(new Error(`Connection timeout for ${server.name}`));
                }, 10000);
                
                ws.on('open', () => {
                    clearTimeout(timeout);
                    
                    const connection = {
                        id: `${server.name}-${Date.now()}`,
                        server,
                        ws,
                        status: 'connected',
                        connectedAt: new Date(),
                        lastPing: Date.now(),
                        messageCount: 0
                    };
                    
                    this.connections.set(connection.id, connection);
                    this.metrics.activeConnections++;
                    this.metrics.totalConnections++;
                    
                    // Setup message handlers
                    this.setupConnectionHandlers(connection);
                    
                    const responseTime = Date.now() - startTime;
                    this.updateAverageResponseTime(responseTime);
                    
                    console.log(`✅ Connected to ${server.name} (${responseTime}ms)`);
                    resolve(connection);
                });
                
                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.metrics.failedConnections++;
                    console.error(`❌ Failed to connect to ${server.name}:`, error.message);
                    reject(error);
                });
            });
            
        } catch (error) {
            this.metrics.failedConnections++;
            console.error(`❌ Error connecting to ${server.name}:`, error.message);
            throw error;
        }
    }
    
    setupConnectionHandlers(connection) {
        const { ws, server } = connection;
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                connection.messageCount++;
                connection.lastPing = Date.now();
                this.metrics.messagesProcessed++;
                
                this.emit('message', {
                    serverId: server.name,
                    connectionId: connection.id,
                    message
                });
                
            } catch (error) {
                console.error(`❌ Error parsing message from ${server.name}:`, error.message);
            }
        });
        
        ws.on('close', () => {
            console.log(`🔌 Connection closed: ${server.name}`);
            this.connections.delete(connection.id);
            this.metrics.activeConnections--;
            
            // Auto-reconnect after delay
            setTimeout(() => {
                this.connectToMCP(server).catch(console.error);
            }, 5000);
        });
        
        ws.on('error', (error) => {
            console.error(`❌ Connection error ${server.name}:`, error.message);
        });
        
        // Send initial ping
        this.sendPing(connection);
    }
    
    sendPing(connection) {
        if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.ping();
        }
    }
    
    async sendMessage(serverId, message) {
        const connection = Array.from(this.connections.values())
            .find(conn => conn.server.name === serverId);
            
        if (!connection) {
            throw new Error(`No connection found for server: ${serverId}`);
        }
        
        if (connection.ws.readyState !== WebSocket.OPEN) {
            throw new Error(`Connection not ready for server: ${serverId}`);
        }
        
        connection.ws.send(JSON.stringify(message));
    }
    
    async broadcast(message, category = null) {
        const connections = Array.from(this.connections.values())
            .filter(conn => !category || conn.server.category === category)
            .filter(conn => conn.ws.readyState === WebSocket.OPEN);
            
        const promises = connections.map(conn => {
            return new Promise((resolve) => {
                try {
                    conn.ws.send(JSON.stringify(message));
                    resolve(true);
                } catch (error) {
                    console.error(`❌ Broadcast error to ${conn.server.name}:`, error.message);
                    resolve(false);
                }
            });
        });
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        
        console.log(`📡 Broadcast sent to ${successful}/${connections.length} servers`);
        return successful;
    }
    
    startHealthMonitoring() {
        this.healthMonitor = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
    }
    
    performHealthCheck() {
        const now = Date.now();
        const staleConnections = [];
        
        for (const [id, connection] of this.connections) {
            const timeSinceLastPing = now - connection.lastPing;
            
            if (timeSinceLastPing > 60000) { // 1 minute
                staleConnections.push(connection);
            } else {
                this.sendPing(connection);
            }
        }
        
        // Remove stale connections
        staleConnections.forEach(conn => {
            console.log(`🧹 Removing stale connection: ${conn.server.name}`);
            conn.ws.terminate();
            this.connections.delete(conn.id);
            this.metrics.activeConnections--;
        });
        
        // Log health status
        console.log(`💓 Health Check: ${this.metrics.activeConnections} active, ${this.metrics.messagesProcessed} messages processed`);
    }
    
    updateAverageResponseTime(responseTime) {
        const alpha = 0.1; // Exponential moving average factor
        this.metrics.averageResponseTime = 
            (alpha * responseTime) + ((1 - alpha) * this.metrics.averageResponseTime);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            connectionsByCategory: this.getConnectionsByCategory(),
            topPerformingServers: this.getTopPerformingServers(),
            systemLoad: this.getSystemLoad()
        };
    }
    
    getConnectionsByCategory() {
        const categories = {};
        
        for (const connection of this.connections.values()) {
            const category = connection.server.category;
            categories[category] = (categories[category] || 0) + 1;
        }
        
        return categories;
    }
    
    getTopPerformingServers() {
        return Array.from(this.connections.values())
            .sort((a, b) => b.messageCount - a.messageCount)
            .slice(0, 10)
            .map(conn => ({
                name: conn.server.name,
                messageCount: conn.messageCount,
                category: conn.server.category
            }));
    }
    
    getSystemLoad() {
        return {
            cpuUsage: process.cpuUsage(),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
    
    async shutdown() {
        console.log('🛑 Shutting down MCP Massive Connector...');
        
        // Clear health monitor
        if (this.healthMonitor) {
            clearInterval(this.healthMonitor);
        }
        
        // Close all connections
        const closePromises = Array.from(this.connections.values()).map(conn => {
            return new Promise((resolve) => {
                if (conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.close();
                }
                resolve();
            });
        });
        
        await Promise.allSettled(closePromises);
        
        // Shutdown workers
        if (cluster.isMaster) {
            for (const workerInfo of this.workers.values()) {
                workerInfo.worker.kill();
            }
        }
        
        console.log('✅ MCP Massive Connector shutdown complete');
    }
}

class MCPConnectionPool {
    constructor(options = {}) {
        this.size = options.size || 100;
        this.retryAttempts = options.retryAttempts || 3;
        this.connections = [];
        this.available = [];
        this.busy = [];
    }
    
    async getConnection() {
        if (this.available.length > 0) {
            const conn = this.available.pop();
            this.busy.push(conn);
            return conn;
        }
        
        if (this.connections.length < this.size) {
            const conn = await this.createConnection();
            this.busy.push(conn);
            return conn;
        }
        
        // Wait for available connection
        return new Promise((resolve) => {
            const checkAvailable = () => {
                if (this.available.length > 0) {
                    const conn = this.available.pop();
                    this.busy.push(conn);
                    resolve(conn);
                } else {
                    setTimeout(checkAvailable, 10);
                }
            };
            checkAvailable();
        });
    }
    
    releaseConnection(conn) {
        const index = this.busy.indexOf(conn);
        if (index > -1) {
            this.busy.splice(index, 1);
            this.available.push(conn);
        }
    }
    
    async createConnection() {
        // Implementation for creating new connection
        return { id: Date.now(), created: new Date() };
    }
}

class MCPLoadBalancer {
    constructor(strategy = 'round-robin') {
        this.strategy = strategy;
        this.currentIndex = 0;
    }
    
    selectConnection(connections) {
        switch (this.strategy) {
            case 'round-robin':
                return this.roundRobin(connections);
            case 'least-connections':
                return this.leastConnections(connections);
            case 'random':
                return this.random(connections);
            default:
                return this.roundRobin(connections);
        }
    }
    
    roundRobin(connections) {
        if (connections.length === 0) return null;
        
        const connection = connections[this.currentIndex % connections.length];
        this.currentIndex++;
        return connection;
    }
    
    leastConnections(connections) {
        return connections.reduce((min, conn) => 
            conn.messageCount < min.messageCount ? conn : min
        );
    }
    
    random(connections) {
        return connections[Math.floor(Math.random() * connections.length)];
    }
}

module.exports = MCPMassiveConnector;

// Usage Example
if (require.main === module) {
    const connector = new MCPMassiveConnector({
        maxConnections: 2500,
        workersPerCore: 4,
        connectionPoolSize: 100,
        loadBalancingStrategy: 'least-connections'
    });
    
    connector.on('message', (data) => {
        console.log(`📨 Message from ${data.serverId}:`, data.message);
    });
    
    async function start() {
        try {
            await connector.initialize();
            await connector.connectAll();
            
            // Example: Broadcast message to all AI servers
            await connector.broadcast({
                type: 'health_check',
                timestamp: new Date().toISOString()
            }, 'ai');
            
            // Monitor metrics
            setInterval(() => {
                const metrics = connector.getMetrics();
                console.log('📊 Metrics:', JSON.stringify(metrics, null, 2));
            }, 30000);
            
        } catch (error) {
            console.error('❌ Failed to start MCP Massive Connector:', error);
        }
    }
    
    start();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await connector.shutdown();
        process.exit(0);
    });
}