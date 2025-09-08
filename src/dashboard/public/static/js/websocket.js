/**
 * NEXUS IDE Security Dashboard - WebSocket & Real-time Communication
 * Advanced WebSocket client with auto-reconnection and message handling
 */

class WebSocketManager {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectInterval: 3000,
            maxReconnectAttempts: 10,
            heartbeatInterval: 30000,
            messageQueueSize: 100,
            ...options
        };
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.messageQueue = [];
        this.eventHandlers = new Map();
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        
        this.init();
    }

    /**
     * Initialize WebSocket connection
     */
    init() {
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        this.ws.onopen = (event) => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Process queued messages
            this.processMessageQueue();
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Emit connection event
            this.emit('connected', event);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.stopHeartbeat();
            
            // Emit disconnection event
            this.emit('disconnected', event);
            
            // Schedule reconnection if not intentional close
            if (event.code !== 1000) {
                this.scheduleReconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };
    }

    /**
     * Handle incoming messages
     * @param {Object} data - Message data
     */
    handleMessage(data) {
        const { type, payload, timestamp } = data;
        
        switch (type) {
            case 'heartbeat':
                this.handleHeartbeat(payload);
                break;
                
            case 'security_event':
                this.handleSecurityEvent(payload);
                break;
                
            case 'system_status':
                this.handleSystemStatus(payload);
                break;
                
            case 'performance_metrics':
                this.handlePerformanceMetrics(payload);
                break;
                
            case 'compliance_update':
                this.handleComplianceUpdate(payload);
                break;
                
            case 'threat_alert':
                this.handleThreatAlert(payload);
                break;
                
            case 'audit_result':
                this.handleAuditResult(payload);
                break;
                
            default:
                console.warn('Unknown message type:', type);
                break;
        }
        
        // Emit generic message event
        this.emit('message', data);
    }

    /**
     * Handle heartbeat message
     * @param {Object} payload - Heartbeat data
     */
    handleHeartbeat(payload) {
        // Send heartbeat response
        this.send({
            type: 'heartbeat_response',
            payload: {
                timestamp: Date.now(),
                clientId: this.getClientId()
            }
        });
    }

    /**
     * Handle security event
     * @param {Object} payload - Security event data
     */
    handleSecurityEvent(payload) {
        // Update security events in dashboard
        if (window.securityDashboard) {
            window.securityDashboard.addSecurityEvent(payload);
        }
        
        // Show notification for high-priority events
        if (payload.severity === 'high' || payload.severity === 'critical') {
            if (window.notificationManager) {
                window.notificationManager.show({
                    type: 'warning',
                    title: 'Security Alert',
                    message: payload.message,
                    duration: 10000
                });
            }
        }
        
        this.emit('security_event', payload);
    }

    /**
     * Handle system status update
     * @param {Object} payload - System status data
     */
    handleSystemStatus(payload) {
        // Update system status indicators
        if (window.securityDashboard) {
            window.securityDashboard.updateSystemStatus(payload);
        }
        
        this.emit('system_status', payload);
    }

    /**
     * Handle performance metrics
     * @param {Object} payload - Performance metrics data
     */
    handlePerformanceMetrics(payload) {
        // Update performance charts
        if (window.chartManager) {
            window.chartManager.addRealTimeData('performance-chart', {
                values: [payload.cpu, payload.memory, payload.network]
            });
        }
        
        this.emit('performance_metrics', payload);
    }

    /**
     * Handle compliance update
     * @param {Object} payload - Compliance data
     */
    handleComplianceUpdate(payload) {
        // Update compliance status
        if (window.securityDashboard) {
            window.securityDashboard.updateComplianceStatus(payload);
        }
        
        this.emit('compliance_update', payload);
    }

    /**
     * Handle threat alert
     * @param {Object} payload - Threat alert data
     */
    handleThreatAlert(payload) {
        // Show critical threat notification
        if (window.notificationManager) {
            window.notificationManager.show({
                type: 'error',
                title: 'Threat Detected',
                message: payload.description,
                duration: 0, // Persistent notification
                actions: [
                    {
                        text: 'View Details',
                        action: () => {
                            if (window.securityDashboard) {
                                window.securityDashboard.showThreatDetails(payload);
                            }
                        }
                    },
                    {
                        text: 'Block IP',
                        action: () => {
                            this.send({
                                type: 'block_ip',
                                payload: { ip: payload.sourceIp }
                            });
                        }
                    }
                ]
            });
        }
        
        this.emit('threat_alert', payload);
    }

    /**
     * Handle audit result
     * @param {Object} payload - Audit result data
     */
    handleAuditResult(payload) {
        // Update audit results
        if (window.securityDashboard) {
            window.securityDashboard.updateAuditResults(payload);
        }
        
        this.emit('audit_result', payload);
    }

    /**
     * Send message to server
     * @param {Object} data - Message data
     */
    send(data) {
        const message = {
            ...data,
            timestamp: Date.now(),
            clientId: this.getClientId()
        };
        
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                this.queueMessage(message);
            }
        } else {
            this.queueMessage(message);
        }
    }

    /**
     * Queue message for later sending
     * @param {Object} message - Message to queue
     */
    queueMessage(message) {
        if (this.messageQueue.length >= this.options.messageQueueSize) {
            this.messageQueue.shift(); // Remove oldest message
        }
        this.messageQueue.push(message);
    }

    /**
     * Process queued messages
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send queued message:', error);
                this.messageQueue.unshift(message); // Put back at front
                break;
            }
        }
    }

    /**
     * Start heartbeat timer
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            this.send({
                type: 'heartbeat',
                payload: {
                    timestamp: Date.now()
                }
            });
        }, this.options.heartbeatInterval);
    }

    /**
     * Stop heartbeat timer
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('max_reconnect_attempts');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        this.reconnectTimer = setTimeout(() => {
            this.init();
        }, delay);
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get client ID
     * @returns {string} Client ID
     */
    getClientId() {
        if (!this.clientId) {
            this.clientId = 'client_' + Math.random().toString(36).substr(2, 9);
        }
        return this.clientId;
    }

    /**
     * Close WebSocket connection
     */
    close() {
        this.stopHeartbeat();
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.ws) {
            this.ws.close(1000, 'Client closing connection');
        }
    }

    /**
     * Get connection status
     * @returns {Object} Connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
        };
    }
}

/**
 * Real-time Data Manager
 * Manages real-time data updates and synchronization
 */
class RealTimeDataManager {
    constructor(wsManager) {
        this.wsManager = wsManager;
        this.dataStreams = new Map();
        this.subscribers = new Map();
        
        this.setupEventHandlers();
    }

    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        this.wsManager.on('message', (data) => {
            this.handleDataUpdate(data);
        });
    }

    /**
     * Handle data update
     * @param {Object} data - Update data
     */
    handleDataUpdate(data) {
        const { type, payload } = data;
        
        // Store data in stream
        if (!this.dataStreams.has(type)) {
            this.dataStreams.set(type, []);
        }
        
        const stream = this.dataStreams.get(type);
        stream.push({
            ...payload,
            timestamp: Date.now()
        });
        
        // Keep only last 1000 data points
        if (stream.length > 1000) {
            stream.splice(0, stream.length - 1000);
        }
        
        // Notify subscribers
        this.notifySubscribers(type, payload);
    }

    /**
     * Subscribe to data stream
     * @param {string} streamType - Stream type
     * @param {Function} callback - Callback function
     * @returns {string} Subscription ID
     */
    subscribe(streamType, callback) {
        const subscriptionId = 'sub_' + Math.random().toString(36).substr(2, 9);
        
        if (!this.subscribers.has(streamType)) {
            this.subscribers.set(streamType, new Map());
        }
        
        this.subscribers.get(streamType).set(subscriptionId, callback);
        
        return subscriptionId;
    }

    /**
     * Unsubscribe from data stream
     * @param {string} streamType - Stream type
     * @param {string} subscriptionId - Subscription ID
     */
    unsubscribe(streamType, subscriptionId) {
        if (this.subscribers.has(streamType)) {
            this.subscribers.get(streamType).delete(subscriptionId);
        }
    }

    /**
     * Notify subscribers
     * @param {string} streamType - Stream type
     * @param {Object} data - Data to send
     */
    notifySubscribers(streamType, data) {
        if (this.subscribers.has(streamType)) {
            this.subscribers.get(streamType).forEach((callback, subscriptionId) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in subscriber ${subscriptionId}:`, error);
                }
            });
        }
    }

    /**
     * Get historical data
     * @param {string} streamType - Stream type
     * @param {number} limit - Number of records to return
     * @returns {Array} Historical data
     */
    getHistoricalData(streamType, limit = 100) {
        if (!this.dataStreams.has(streamType)) {
            return [];
        }
        
        const stream = this.dataStreams.get(streamType);
        return stream.slice(-limit);
    }

    /**
     * Clear data stream
     * @param {string} streamType - Stream type
     */
    clearStream(streamType) {
        if (this.dataStreams.has(streamType)) {
            this.dataStreams.get(streamType).length = 0;
        }
    }

    /**
     * Get all stream types
     * @returns {Array} Stream types
     */
    getStreamTypes() {
        return Array.from(this.dataStreams.keys());
    }
}

// Initialize WebSocket connection when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get WebSocket URL from environment or default
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    // Initialize WebSocket manager
    window.wsManager = new WebSocketManager(wsUrl);
    
    // Initialize real-time data manager
    window.realTimeDataManager = new RealTimeDataManager(window.wsManager);
    
    // Setup connection status indicator
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
        window.wsManager.on('connected', () => {
            statusIndicator.className = 'status-indicator connected';
            statusIndicator.title = 'Connected to server';
        });
        
        window.wsManager.on('disconnected', () => {
            statusIndicator.className = 'status-indicator disconnected';
            statusIndicator.title = 'Disconnected from server';
        });
        
        window.wsManager.on('error', () => {
            statusIndicator.className = 'status-indicator error';
            statusIndicator.title = 'Connection error';
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebSocketManager, RealTimeDataManager };
}