/**
 * NEXUS IDE Security Dashboard - WebSocket Routes
 * Enterprise-grade real-time communication and event streaming
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { EventEmitter } = require('events');
const { AUTHENTICATION } = require('../config/dashboard-config');
const logger = require('../utils/logger');
const { db } = require('../utils/database');
const { tokenUtils } = require('../utils/security');

/**
 * WebSocket Connection Manager
 */
class WebSocketManager extends EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.rooms = new Map();
        this.heartbeatInterval = 30000; // 30 seconds
        this.heartbeatTimer = null;
        this.messageQueue = new Map();
        this.rateLimits = new Map();
        this.setupHeartbeat();
    }
    
    /**
     * Initialize WebSocket server
     */
    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws',
            verifyClient: this.verifyClient.bind(this)
        });
        
        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('error', this.handleServerError.bind(this));
        
        logger.info('WebSocket server initialized', {
            path: '/ws',
            heartbeatInterval: this.heartbeatInterval
        });
        
        return this.wss;
    }
    
    /**
     * Verify client connection
     */
    async verifyClient(info) {
        try {
            const url = new URL(info.req.url, 'ws://localhost');
            const token = url.searchParams.get('token');
            
            if (!token) {
                logger.warn('WebSocket connection rejected: No token provided', {
                    origin: info.origin,
                    userAgent: info.req.headers['user-agent']
                });
                return false;
            }
            
            // Verify JWT token
            const decoded = jwt.verify(token, AUTHENTICATION.jwtSecret);
            
            // Check if user exists and is active
            const user = await this.getUserById(decoded.userId);
            if (!user || user.status !== 'active') {
                logger.warn('WebSocket connection rejected: Invalid user', {
                    userId: decoded.userId,
                    origin: info.origin
                });
                return false;
            }
            
            // Store user info for connection handler
            info.req.user = user;
            
            logger.debug('WebSocket connection verified', {
                userId: user.id,
                username: user.username,
                origin: info.origin
            });
            
            return true;
            
        } catch (error) {
            logger.warn('WebSocket connection verification failed', {
                error: error.message,
                origin: info.origin
            });
            return false;
        }
    }
    
    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req) {
        const user = req.user;
        const connectionId = this.generateConnectionId();
        
        // Store connection info
        const connectionInfo = {
            id: connectionId,
            ws,
            user,
            connectedAt: new Date(),
            lastActivity: new Date(),
            subscriptions: new Set(),
            messageCount: 0,
            isAlive: true
        };
        
        this.connections.set(connectionId, connectionInfo);
        
        // Setup connection event handlers
        ws.on('message', (data) => this.handleMessage(connectionId, data));
        ws.on('close', (code, reason) => this.handleDisconnection(connectionId, code, reason));
        ws.on('error', (error) => this.handleConnectionError(connectionId, error));
        ws.on('pong', () => this.handlePong(connectionId));
        
        // Send welcome message
        this.sendToConnection(connectionId, {
            type: 'connection',
            event: 'connected',
            data: {
                connectionId,
                serverTime: new Date().toISOString(),
                features: ['real-time-events', 'collaboration', 'monitoring']
            }
        });
        
        // Join user to their personal room
        this.joinRoom(connectionId, `user:${user.id}`);
        
        // Join user to role-based rooms
        if (user.roles) {
            user.roles.forEach(role => {
                this.joinRoom(connectionId, `role:${role}`);
            });
        }
        
        logger.info('WebSocket connection established', {
            connectionId,
            userId: user.id,
            username: user.username,
            totalConnections: this.connections.size
        });
        
        // Emit connection event
        this.emit('connection', { connectionId, user });
    }
    
    /**
     * Handle incoming WebSocket message
     */
    async handleMessage(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        try {
            // Update last activity
            connection.lastActivity = new Date();
            connection.messageCount++;
            
            // Rate limiting check
            if (!this.checkRateLimit(connectionId)) {
                this.sendError(connectionId, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
                return;
            }
            
            // Parse message
            const message = JSON.parse(data.toString());
            
            // Validate message structure
            if (!this.validateMessage(message)) {
                this.sendError(connectionId, 'Invalid message format', 'INVALID_MESSAGE');
                return;
            }
            
            logger.debug('WebSocket message received', {
                connectionId,
                userId: connection.user.id,
                type: message.type,
                event: message.event
            });
            
            // Route message to appropriate handler
            await this.routeMessage(connectionId, message);
            
        } catch (error) {
            logger.error('WebSocket message handling failed', {
                connectionId,
                userId: connection.user?.id,
                error: error.message,
                data: data.toString().substring(0, 200)
            });
            
            this.sendError(connectionId, 'Message processing failed', 'PROCESSING_ERROR');
        }
    }
    
    /**
     * Route message to appropriate handler
     */
    async routeMessage(connectionId, message) {
        const { type, event, data } = message;
        
        switch (type) {
            case 'subscription':
                await this.handleSubscription(connectionId, event, data);
                break;
                
            case 'collaboration':
                await this.handleCollaboration(connectionId, event, data);
                break;
                
            case 'monitoring':
                await this.handleMonitoring(connectionId, event, data);
                break;
                
            case 'security':
                await this.handleSecurity(connectionId, event, data);
                break;
                
            case 'system':
                await this.handleSystem(connectionId, event, data);
                break;
                
            default:
                this.sendError(connectionId, `Unknown message type: ${type}`, 'UNKNOWN_TYPE');
        }
    }
    
    /**
     * Handle subscription messages
     */
    async handleSubscription(connectionId, event, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        switch (event) {
            case 'subscribe':
                if (data.channels && Array.isArray(data.channels)) {
                    for (const channel of data.channels) {
                        if (await this.canSubscribeToChannel(connection.user, channel)) {
                            connection.subscriptions.add(channel);
                            this.joinRoom(connectionId, channel);
                            
                            logger.debug('User subscribed to channel', {
                                userId: connection.user.id,
                                channel
                            });
                        }
                    }
                }
                
                this.sendToConnection(connectionId, {
                    type: 'subscription',
                    event: 'subscribed',
                    data: {
                        channels: Array.from(connection.subscriptions)
                    }
                });
                break;
                
            case 'unsubscribe':
                if (data.channels && Array.isArray(data.channels)) {
                    for (const channel of data.channels) {
                        connection.subscriptions.delete(channel);
                        this.leaveRoom(connectionId, channel);
                    }
                }
                
                this.sendToConnection(connectionId, {
                    type: 'subscription',
                    event: 'unsubscribed',
                    data: {
                        channels: data.channels
                    }
                });
                break;
        }
    }
    
    /**
     * Handle collaboration messages
     */
    async handleCollaboration(connectionId, event, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        switch (event) {
            case 'join_session':
                const sessionId = data.sessionId;
                if (await this.canJoinSession(connection.user, sessionId)) {
                    this.joinRoom(connectionId, `session:${sessionId}`);
                    
                    // Broadcast user joined
                    this.broadcastToRoom(`session:${sessionId}`, {
                        type: 'collaboration',
                        event: 'user_joined',
                        data: {
                            sessionId,
                            user: {
                                id: connection.user.id,
                                username: connection.user.username,
                                avatar: connection.user.avatar
                            }
                        }
                    }, connectionId);
                }
                break;
                
            case 'cursor_move':
                // Broadcast cursor position to session members
                const sessionRoom = `session:${data.sessionId}`;
                this.broadcastToRoom(sessionRoom, {
                    type: 'collaboration',
                    event: 'cursor_update',
                    data: {
                        userId: connection.user.id,
                        position: data.position,
                        file: data.file
                    }
                }, connectionId);
                break;
                
            case 'code_change':
                // Broadcast code changes to session members
                const codeSessionRoom = `session:${data.sessionId}`;
                this.broadcastToRoom(codeSessionRoom, {
                    type: 'collaboration',
                    event: 'code_updated',
                    data: {
                        userId: connection.user.id,
                        changes: data.changes,
                        file: data.file,
                        timestamp: new Date().toISOString()
                    }
                }, connectionId);
                break;
        }
    }
    
    /**
     * Handle monitoring messages
     */
    async handleMonitoring(connectionId, event, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        switch (event) {
            case 'request_metrics':
                const metrics = await this.getSystemMetrics();
                this.sendToConnection(connectionId, {
                    type: 'monitoring',
                    event: 'metrics_update',
                    data: metrics
                });
                break;
                
            case 'start_monitoring':
                connection.subscriptions.add('system:metrics');
                this.joinRoom(connectionId, 'system:metrics');
                break;
                
            case 'stop_monitoring':
                connection.subscriptions.delete('system:metrics');
                this.leaveRoom(connectionId, 'system:metrics');
                break;
        }
    }
    
    /**
     * Handle security messages
     */
    async handleSecurity(connectionId, event, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        // Check if user has security permissions
        if (!this.hasSecurityPermissions(connection.user)) {
            this.sendError(connectionId, 'Insufficient permissions', 'PERMISSION_DENIED');
            return;
        }
        
        switch (event) {
            case 'subscribe_alerts':
                connection.subscriptions.add('security:alerts');
                this.joinRoom(connectionId, 'security:alerts');
                break;
                
            case 'acknowledge_alert':
                await this.acknowledgeSecurityAlert(data.alertId, connection.user.id);
                
                this.broadcastToRoom('security:alerts', {
                    type: 'security',
                    event: 'alert_acknowledged',
                    data: {
                        alertId: data.alertId,
                        acknowledgedBy: connection.user.id,
                        timestamp: new Date().toISOString()
                    }
                });
                break;
        }
    }
    
    /**
     * Handle system messages
     */
    async handleSystem(connectionId, event, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        switch (event) {
            case 'ping':
                this.sendToConnection(connectionId, {
                    type: 'system',
                    event: 'pong',
                    data: {
                        timestamp: new Date().toISOString(),
                        serverTime: Date.now()
                    }
                });
                break;
                
            case 'get_status':
                const status = await this.getSystemStatus();
                this.sendToConnection(connectionId, {
                    type: 'system',
                    event: 'status',
                    data: status
                });
                break;
        }
    }
    
    /**
     * Handle connection disconnection
     */
    handleDisconnection(connectionId, code, reason) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        // Remove from all rooms
        for (const [roomId, members] of this.rooms.entries()) {
            members.delete(connectionId);
            if (members.size === 0) {
                this.rooms.delete(roomId);
            }
        }
        
        // Remove connection
        this.connections.delete(connectionId);
        
        logger.info('WebSocket connection closed', {
            connectionId,
            userId: connection.user.id,
            code,
            reason: reason?.toString(),
            duration: Date.now() - connection.connectedAt.getTime(),
            messageCount: connection.messageCount,
            totalConnections: this.connections.size
        });
        
        // Emit disconnection event
        this.emit('disconnection', { connectionId, user: connection.user });
    }
    
    /**
     * Handle connection error
     */
    handleConnectionError(connectionId, error) {
        const connection = this.connections.get(connectionId);
        
        logger.error('WebSocket connection error', {
            connectionId,
            userId: connection?.user?.id,
            error: error.message
        });
    }
    
    /**
     * Handle server error
     */
    handleServerError(error) {
        logger.error('WebSocket server error', {
            error: error.message,
            stack: error.stack
        });
    }
    
    /**
     * Handle pong response
     */
    handlePong(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.isAlive = true;
            connection.lastActivity = new Date();
        }
    }
    
    /**
     * Send message to specific connection
     */
    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        
        try {
            const messageStr = JSON.stringify({
                ...message,
                timestamp: new Date().toISOString(),
                connectionId
            });
            
            connection.ws.send(messageStr);
            return true;
            
        } catch (error) {
            logger.error('Failed to send WebSocket message', {
                connectionId,
                error: error.message
            });
            return false;
        }
    }
    
    /**
     * Send error message to connection
     */
    sendError(connectionId, message, code) {
        this.sendToConnection(connectionId, {
            type: 'error',
            event: 'error',
            data: {
                message,
                code,
                timestamp: new Date().toISOString()
            }
        });
    }
    
    /**
     * Broadcast message to room
     */
    broadcastToRoom(roomId, message, excludeConnectionId = null) {
        const room = this.rooms.get(roomId);
        if (!room) return 0;
        
        let sentCount = 0;
        
        for (const connectionId of room) {
            if (connectionId !== excludeConnectionId) {
                if (this.sendToConnection(connectionId, message)) {
                    sentCount++;
                }
            }
        }
        
        return sentCount;
    }
    
    /**
     * Broadcast message to all connections
     */
    broadcast(message, excludeConnectionId = null) {
        let sentCount = 0;
        
        for (const connectionId of this.connections.keys()) {
            if (connectionId !== excludeConnectionId) {
                if (this.sendToConnection(connectionId, message)) {
                    sentCount++;
                }
            }
        }
        
        return sentCount;
    }
    
    /**
     * Join connection to room
     */
    joinRoom(connectionId, roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        
        this.rooms.get(roomId).add(connectionId);
        
        logger.debug('Connection joined room', {
            connectionId,
            roomId,
            roomSize: this.rooms.get(roomId).size
        });
    }
    
    /**
     * Remove connection from room
     */
    leaveRoom(connectionId, roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(connectionId);
            
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
            
            logger.debug('Connection left room', {
                connectionId,
                roomId,
                roomSize: room.size
            });
        }
    }
    
    /**
     * Setup heartbeat mechanism
     */
    setupHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            for (const [connectionId, connection] of this.connections.entries()) {
                if (!connection.isAlive) {
                    logger.debug('Terminating inactive WebSocket connection', {
                        connectionId,
                        userId: connection.user.id
                    });
                    
                    connection.ws.terminate();
                    this.connections.delete(connectionId);
                    continue;
                }
                
                connection.isAlive = false;
                connection.ws.ping();
            }
        }, this.heartbeatInterval);
    }
    
    /**
     * Check rate limit for connection
     */
    checkRateLimit(connectionId) {
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const maxRequests = 100;
        
        if (!this.rateLimits.has(connectionId)) {
            this.rateLimits.set(connectionId, {
                requests: 1,
                windowStart: now
            });
            return true;
        }
        
        const rateLimit = this.rateLimits.get(connectionId);
        
        if (now - rateLimit.windowStart > windowMs) {
            // Reset window
            rateLimit.requests = 1;
            rateLimit.windowStart = now;
            return true;
        }
        
        if (rateLimit.requests >= maxRequests) {
            return false;
        }
        
        rateLimit.requests++;
        return true;
    }
    
    /**
     * Validate message structure
     */
    validateMessage(message) {
        return message &&
               typeof message === 'object' &&
               typeof message.type === 'string' &&
               typeof message.event === 'string';
    }
    
    /**
     * Generate unique connection ID
     */
    generateConnectionId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalConnections: this.connections.size,
            totalRooms: this.rooms.size,
            connectionsByUser: this.getConnectionsByUser(),
            roomSizes: this.getRoomSizes()
        };
    }
    
    /**
     * Get connections grouped by user
     */
    getConnectionsByUser() {
        const userConnections = {};
        
        for (const connection of this.connections.values()) {
            const userId = connection.user.id;
            userConnections[userId] = (userConnections[userId] || 0) + 1;
        }
        
        return userConnections;
    }
    
    /**
     * Get room sizes
     */
    getRoomSizes() {
        const roomSizes = {};
        
        for (const [roomId, members] of this.rooms.entries()) {
            roomSizes[roomId] = members.size;
        }
        
        return roomSizes;
    }
    
    /**
     * Close all connections and cleanup
     */
    async close() {
        // Clear heartbeat timer
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        // Close all connections
        for (const connection of this.connections.values()) {
            connection.ws.close(1001, 'Server shutdown');
        }
        
        // Clear data structures
        this.connections.clear();
        this.rooms.clear();
        this.rateLimits.clear();
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        logger.info('WebSocket server closed');
    }
    
    /**
     * Helper methods (to be implemented based on your data layer)
     */
    
    async getUserById(userId) {
        // Implementation depends on your user data layer
        return {
            id: userId,
            username: 'user',
            status: 'active',
            roles: ['user']
        };
    }
    
    async canSubscribeToChannel(user, channel) {
        // Implementation depends on your permission system
        return true;
    }
    
    async canJoinSession(user, sessionId) {
        // Implementation depends on your session management
        return true;
    }
    
    hasSecurityPermissions(user) {
        return user.roles && (user.roles.includes('admin') || user.roles.includes('security'));
    }
    
    async getSystemMetrics() {
        return {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            connections: this.connections.size,
            timestamp: new Date().toISOString()
        };
    }
    
    async getSystemStatus() {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            connections: this.connections.size,
            rooms: this.rooms.size
        };
    }
    
    async acknowledgeSecurityAlert(alertId, userId) {
        // Implementation depends on your security alert system
        logger.info('Security alert acknowledged', { alertId, userId });
    }
}

// Create singleton instance
const wsManager = new WebSocketManager();

// Export WebSocket manager and setup function
module.exports = {
    WebSocketManager,
    wsManager,
    
    /**
     * Setup WebSocket server with HTTP server
     */
    setupWebSocket(server) {
        return wsManager.initialize(server);
    },
    
    /**
     * Get WebSocket manager instance
     */
    getManager() {
        return wsManager;
    }
};