/**
 * Git Memory MCP Server - API Gateway WebSocket
 * WebSocket Support สำหรับ API Gateway
 * 
 * Features:
 * - WebSocket server management
 * - Real-time communication
 * - Connection pooling
 * - Message routing
 * - Authentication for WebSocket
 * - Rate limiting for WebSocket
 * - Broadcasting capabilities
 * - Room/channel management
 * - Message queuing
 * - Connection monitoring
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const crypto = require('crypto');
const url = require('url');

class APIGatewayWebSocket extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: 8081,
            host: '0.0.0.0',
            maxConnections: 10000,
            heartbeatInterval: 30000, // 30 seconds
            messageQueueSize: 1000,
            rateLimiting: {
                enabled: true,
                maxMessagesPerMinute: 60,
                windowMs: 60000
            },
            authentication: {
                enabled: true,
                tokenParam: 'token',
                apiKeyParam: 'apiKey'
            },
            compression: {
                enabled: true,
                threshold: 1024,
                level: 6
            },
            cors: {
                enabled: true,
                origin: '*'
            },
            ssl: {
                enabled: false,
                cert: null,
                key: null
            },
            clustering: {
                enabled: false,
                redisUrl: 'redis://localhost:6379'
            },
            ...config
        };
        
        this.server = null;
        this.wss = null;
        this.connections = new Map();
        this.rooms = new Map();
        this.messageQueues = new Map();
        this.rateLimiters = new Map();
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            messagesReceived: 0,
            messagesSent: 0,
            bytesReceived: 0,
            bytesSent: 0,
            errors: 0,
            startTime: Date.now()
        };
        
        this.heartbeatInterval = null;
        this.cleanupInterval = null;
        
        console.log('🔌 WebSocket system initialized');
    }
    
    /**
     * Start WebSocket server
     */
    async start() {
        try {
            const serverOptions = {
                port: this.config.port,
                host: this.config.host,
                maxPayload: 16 * 1024 * 1024, // 16MB
                perMessageDeflate: this.config.compression.enabled ? {
                    threshold: this.config.compression.threshold,
                    level: this.config.compression.level
                } : false
            };
            
            // SSL configuration
            if (this.config.ssl.enabled) {
                const https = require('https');
                const fs = require('fs');
                
                this.server = https.createServer({
                    cert: fs.readFileSync(this.config.ssl.cert),
                    key: fs.readFileSync(this.config.ssl.key)
                });
                
                serverOptions.server = this.server;
                delete serverOptions.port;
                delete serverOptions.host;
                
                this.server.listen(this.config.port, this.config.host);
            }
            
            this.wss = new WebSocket.Server(serverOptions);
            
            this.setupEventHandlers();
            this.startHeartbeat();
            this.startCleanupTasks();
            
            console.log(`🔌 WebSocket server started on ${this.config.ssl.enabled ? 'wss' : 'ws'}://${this.config.host}:${this.config.port}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to start WebSocket server:', error);
            throw error;
        }
    }
    
    /**
     * Stop WebSocket server
     */
    async stop() {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
            
            // Close all connections
            for (const [connectionId, connection] of this.connections.entries()) {
                connection.ws.close(1001, 'Server shutting down');
            }
            
            if (this.wss) {
                this.wss.close();
            }
            
            if (this.server) {
                this.server.close();
            }
            
            console.log('🔌 WebSocket server stopped');
            return true;
        } catch (error) {
            console.error('❌ Failed to stop WebSocket server:', error);
            throw error;
        }
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.wss.on('connection', (ws, request) => {
            this.handleConnection(ws, request);
        });
        
        this.wss.on('error', (error) => {
            console.error('🔌 WebSocket server error:', error);
            this.stats.errors++;
        });
        
        this.wss.on('close', () => {
            console.log('🔌 WebSocket server closed');
        });
    }
    
    /**
     * Handle new connection
     */
    async handleConnection(ws, request) {
        try {
            const connectionId = crypto.randomUUID();
            const clientIP = this.getClientIP(request);
            
            // Check connection limit
            if (this.connections.size >= this.config.maxConnections) {
                ws.close(1013, 'Server overloaded');
                return;
            }
            
            // Parse query parameters
            const query = url.parse(request.url, true).query;
            
            // Authentication
            if (this.config.authentication.enabled) {
                const authResult = await this.authenticateConnection(query, request);
                if (!authResult.success) {
                    ws.close(1008, authResult.message);
                    return;
                }
            }
            
            // Create connection object
            const connection = {
                id: connectionId,
                ws,
                ip: clientIP,
                userAgent: request.headers['user-agent'],
                connected: Date.now(),
                lastPing: Date.now(),
                lastPong: Date.now(),
                authenticated: this.config.authentication.enabled,
                user: query.user || null,
                rooms: new Set(),
                messageCount: 0,
                bytesReceived: 0,
                bytesSent: 0,
                rateLimiter: {
                    messages: [],
                    blocked: false
                }
            };
            
            this.connections.set(connectionId, connection);
            this.stats.totalConnections++;
            this.stats.activeConnections++;
            
            // Setup WebSocket event handlers
            this.setupConnectionHandlers(ws, connection);
            
            // Send welcome message
            this.sendMessage(connectionId, {
                type: 'welcome',
                connectionId,
                timestamp: Date.now()
            });
            
            console.log(`🔌 New WebSocket connection: ${connectionId} from ${clientIP}`);
            
            this.emit('connection', connection);
            
        } catch (error) {
            console.error('🔌 Error handling connection:', error);
            ws.close(1011, 'Internal server error');
            this.stats.errors++;
        }
    }
    
    /**
     * Setup connection event handlers
     */
    setupConnectionHandlers(ws, connection) {
        ws.on('message', (data) => {
            this.handleMessage(connection, data);
        });
        
        ws.on('pong', () => {
            connection.lastPong = Date.now();
        });
        
        ws.on('close', (code, reason) => {
            this.handleDisconnection(connection, code, reason);
        });
        
        ws.on('error', (error) => {
            console.error(`🔌 WebSocket error for ${connection.id}:`, error);
            this.stats.errors++;
        });
    }
    
    /**
     * Handle incoming message
     */
    async handleMessage(connection, data) {
        try {
            // Rate limiting
            if (this.config.rateLimiting.enabled) {
                const rateLimitResult = this.checkRateLimit(connection);
                if (!rateLimitResult.allowed) {
                    this.sendMessage(connection.id, {
                        type: 'error',
                        message: 'Rate limit exceeded',
                        code: 'RATE_LIMIT_EXCEEDED'
                    });
                    return;
                }
            }
            
            // Update statistics
            connection.messageCount++;
            connection.bytesReceived += data.length;
            this.stats.messagesReceived++;
            this.stats.bytesReceived += data.length;
            
            // Parse message
            let message;
            try {
                message = JSON.parse(data.toString());
            } catch (error) {
                this.sendMessage(connection.id, {
                    type: 'error',
                    message: 'Invalid JSON format',
                    code: 'INVALID_JSON'
                });
                return;
            }
            
            // Route message based on type
            await this.routeMessage(connection, message);
            
        } catch (error) {
            console.error(`🔌 Error handling message from ${connection.id}:`, error);
            this.sendMessage(connection.id, {
                type: 'error',
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            });
            this.stats.errors++;
        }
    }
    
    /**
     * Route message based on type
     */
    async routeMessage(connection, message) {
        const { type, data, target, room } = message;
        
        switch (type) {
            case 'ping':
                this.sendMessage(connection.id, {
                    type: 'pong',
                    timestamp: Date.now()
                });
                break;
                
            case 'join_room':
                await this.joinRoom(connection.id, data.room);
                break;
                
            case 'leave_room':
                await this.leaveRoom(connection.id, data.room);
                break;
                
            case 'broadcast':
                if (room) {
                    await this.broadcastToRoom(room, data, connection.id);
                } else {
                    await this.broadcast(data, connection.id);
                }
                break;
                
            case 'direct_message':
                if (target) {
                    await this.sendDirectMessage(target, data, connection.id);
                }
                break;
                
            case 'mcp_request':
                await this.handleMCPRequest(connection, data);
                break;
                
            default:
                this.emit('message', { connection, message });
                break;
        }
    }
    
    /**
     * Handle MCP request
     */
    async handleMCPRequest(connection, data) {
        try {
            // Forward request to appropriate MCP server
            const response = await this.forwardToMCPServer(data);
            
            this.sendMessage(connection.id, {
                type: 'mcp_response',
                requestId: data.requestId,
                data: response
            });
            
        } catch (error) {
            this.sendMessage(connection.id, {
                type: 'mcp_error',
                requestId: data.requestId,
                error: error.message
            });
        }
    }
    
    /**
     * Forward request to MCP server
     */
    async forwardToMCPServer(data) {
        // This would integrate with the main API Gateway routing
        // For now, return a mock response
        return {
            success: true,
            message: 'Request processed',
            timestamp: Date.now()
        };
    }
    
    /**
     * Handle disconnection
     */
    handleDisconnection(connection, code, reason) {
        // Remove from all rooms
        for (const roomName of connection.rooms) {
            this.leaveRoom(connection.id, roomName, false);
        }
        
        // Remove connection
        this.connections.delete(connection.id);
        this.stats.activeConnections--;
        
        // Clean up message queue
        this.messageQueues.delete(connection.id);
        
        console.log(`🔌 WebSocket disconnected: ${connection.id} (${code}: ${reason})`);
        
        this.emit('disconnection', { connection, code, reason });
    }
    
    /**
     * Send message to specific connection
     */
    sendMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        
        try {
            const data = JSON.stringify(message);
            connection.ws.send(data);
            
            // Update statistics
            connection.bytesSent += data.length;
            this.stats.messagesSent++;
            this.stats.bytesSent += data.length;
            
            return true;
        } catch (error) {
            console.error(`🔌 Error sending message to ${connectionId}:`, error);
            return false;
        }
    }
    
    /**
     * Broadcast message to all connections
     */
    async broadcast(message, excludeConnectionId = null) {
        const data = {
            type: 'broadcast',
            data: message,
            timestamp: Date.now()
        };
        
        let sent = 0;
        for (const [connectionId, connection] of this.connections.entries()) {
            if (connectionId !== excludeConnectionId) {
                if (this.sendMessage(connectionId, data)) {
                    sent++;
                }
            }
        }
        
        return sent;
    }
    
    /**
     * Join room
     */
    async joinRoom(connectionId, roomName) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return false;
        }
        
        // Create room if it doesn't exist
        if (!this.rooms.has(roomName)) {
            this.rooms.set(roomName, {
                name: roomName,
                connections: new Set(),
                created: Date.now(),
                messageHistory: []
            });
        }
        
        const room = this.rooms.get(roomName);
        room.connections.add(connectionId);
        connection.rooms.add(roomName);
        
        // Send confirmation
        this.sendMessage(connectionId, {
            type: 'room_joined',
            room: roomName,
            memberCount: room.connections.size
        });
        
        // Notify other room members
        this.broadcastToRoom(roomName, {
            type: 'member_joined',
            connectionId,
            memberCount: room.connections.size
        }, connectionId);
        
        console.log(`🔌 Connection ${connectionId} joined room ${roomName}`);
        return true;
    }
    
    /**
     * Leave room
     */
    async leaveRoom(connectionId, roomName, notify = true) {
        const connection = this.connections.get(connectionId);
        const room = this.rooms.get(roomName);
        
        if (!connection || !room) {
            return false;
        }
        
        room.connections.delete(connectionId);
        connection.rooms.delete(roomName);
        
        if (notify) {
            // Send confirmation
            this.sendMessage(connectionId, {
                type: 'room_left',
                room: roomName
            });
            
            // Notify other room members
            this.broadcastToRoom(roomName, {
                type: 'member_left',
                connectionId,
                memberCount: room.connections.size
            }, connectionId);
        }
        
        // Remove room if empty
        if (room.connections.size === 0) {
            this.rooms.delete(roomName);
        }
        
        console.log(`🔌 Connection ${connectionId} left room ${roomName}`);
        return true;
    }
    
    /**
     * Broadcast to room
     */
    async broadcastToRoom(roomName, message, excludeConnectionId = null) {
        const room = this.rooms.get(roomName);
        if (!room) {
            return 0;
        }
        
        const data = {
            type: 'room_broadcast',
            room: roomName,
            data: message,
            timestamp: Date.now()
        };
        
        let sent = 0;
        for (const connectionId of room.connections) {
            if (connectionId !== excludeConnectionId) {
                if (this.sendMessage(connectionId, data)) {
                    sent++;
                }
            }
        }
        
        return sent;
    }
    
    /**
     * Send direct message
     */
    async sendDirectMessage(targetConnectionId, message, fromConnectionId) {
        const data = {
            type: 'direct_message',
            from: fromConnectionId,
            data: message,
            timestamp: Date.now()
        };
        
        return this.sendMessage(targetConnectionId, data);
    }
    
    /**
     * Authenticate connection
     */
    async authenticateConnection(query, request) {
        // This would integrate with the security system
        // For now, return success if token or apiKey is provided
        const token = query[this.config.authentication.tokenParam];
        const apiKey = query[this.config.authentication.apiKeyParam];
        
        if (!token && !apiKey) {
            return {
                success: false,
                message: 'Authentication required'
            };
        }
        
        return {
            success: true,
            user: query.user || 'anonymous'
        };
    }
    
    /**
     * Check rate limit
     */
    checkRateLimit(connection) {
        const now = Date.now();
        const windowStart = now - this.config.rateLimiting.windowMs;
        
        // Clean old messages
        connection.rateLimiter.messages = connection.rateLimiter.messages
            .filter(timestamp => timestamp > windowStart);
        
        // Check limit
        if (connection.rateLimiter.messages.length >= this.config.rateLimiting.maxMessagesPerMinute) {
            connection.rateLimiter.blocked = true;
            return { allowed: false, resetTime: windowStart + this.config.rateLimiting.windowMs };
        }
        
        // Add current message
        connection.rateLimiter.messages.push(now);
        connection.rateLimiter.blocked = false;
        
        return { allowed: true };
    }
    
    /**
     * Get client IP
     */
    getClientIP(request) {
        return request.headers['x-forwarded-for'] ||
               request.headers['x-real-ip'] ||
               request.connection.remoteAddress ||
               request.socket.remoteAddress ||
               (request.connection.socket ? request.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }
    
    /**
     * Start heartbeat
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            
            for (const [connectionId, connection] of this.connections.entries()) {
                // Check if connection is alive
                if (now - connection.lastPong > this.config.heartbeatInterval * 2) {
                    console.log(`🔌 Terminating dead connection: ${connectionId}`);
                    connection.ws.terminate();
                    continue;
                }
                
                // Send ping
                if (connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.ping();
                    connection.lastPing = now;
                }
            }
        }, this.config.heartbeatInterval);
    }
    
    /**
     * Start cleanup tasks
     */
    startCleanupTasks() {
        this.cleanupInterval = setInterval(() => {
            // Clean up empty rooms
            for (const [roomName, room] of this.rooms.entries()) {
                if (room.connections.size === 0) {
                    this.rooms.delete(roomName);
                }
            }
            
            // Clean up rate limiters
            const now = Date.now();
            for (const connection of this.connections.values()) {
                const windowStart = now - this.config.rateLimiting.windowMs;
                connection.rateLimiter.messages = connection.rateLimiter.messages
                    .filter(timestamp => timestamp > windowStart);
            }
        }, 60000); // Every minute
    }
    
    /**
     * Get WebSocket statistics
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        
        return {
            ...this.stats,
            uptime,
            rooms: {
                total: this.rooms.size,
                list: Array.from(this.rooms.entries()).map(([name, room]) => ({
                    name,
                    memberCount: room.connections.size,
                    created: room.created
                }))
            },
            connections: {
                active: this.stats.activeConnections,
                total: this.stats.totalConnections,
                list: Array.from(this.connections.values()).map(conn => ({
                    id: conn.id,
                    ip: conn.ip,
                    connected: conn.connected,
                    messageCount: conn.messageCount,
                    rooms: Array.from(conn.rooms)
                }))
            }
        };
    }
    
    /**
     * Get room information
     */
    getRoomInfo(roomName) {
        const room = this.rooms.get(roomName);
        if (!room) {
            return null;
        }
        
        return {
            name: roomName,
            memberCount: room.connections.size,
            created: room.created,
            members: Array.from(room.connections).map(connectionId => {
                const connection = this.connections.get(connectionId);
                return connection ? {
                    id: connectionId,
                    ip: connection.ip,
                    connected: connection.connected
                } : null;
            }).filter(Boolean)
        };
    }
}

// Export class
module.exports = APIGatewayWebSocket;

// CLI interface
if (require.main === module) {
    const wsGateway = new APIGatewayWebSocket({
        port: 8081,
        maxConnections: 1000,
        rateLimiting: {
            enabled: true,
            maxMessagesPerMinute: 60
        },
        authentication: {
            enabled: false // Disable for testing
        }
    });
    
    wsGateway.start().then(() => {
        console.log('🔌 WebSocket Gateway started successfully');
        
        // Print stats every 10 seconds
        setInterval(() => {
            const stats = wsGateway.getStats();
            console.log('🔌 WebSocket Stats:', {
                activeConnections: stats.activeConnections,
                totalConnections: stats.totalConnections,
                messagesReceived: stats.messagesReceived,
                messagesSent: stats.messagesSent,
                rooms: stats.rooms.total,
                uptime: Math.floor(stats.uptime / 1000) + 's'
            });
        }, 10000);
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🔌 Shutting down WebSocket Gateway...');
            await wsGateway.stop();
            process.exit(0);
        });
        
    }).catch(error => {
        console.error('❌ Failed to start WebSocket Gateway:', error);
        process.exit(1);
    });
}