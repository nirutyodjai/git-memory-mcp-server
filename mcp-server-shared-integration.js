#!/usr/bin/env node

/**
 * MCP Server Shared Integration Module
 * โมดูลสำหรับ MCP Servers ในการเชื่อมต่อและแชร์ข้อมูลผ่าน Git Memory
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class MCPServerSharedIntegration {
    constructor(serverId, serverType, serverPort, coordinatorPort = 3500) {
        this.serverId = serverId;
        this.serverType = serverType;
        this.serverPort = serverPort;
        this.coordinatorPort = coordinatorPort;
        this.coordinatorUrl = `http://localhost:${coordinatorPort}`;
        this.wsUrl = `ws://localhost:${coordinatorPort}`;
        
        this.ws = null;
        this.isConnected = false;
        this.heartbeatInterval = null;
        this.sharedData = new Map();
        this.subscriptions = new Set();
        
        this.capabilities = [
            'data-sharing',
            'real-time-sync',
            'git-memory-integration',
            'cross-server-communication'
        ];
    }

    // ลงทะเบียนกับ Shared Data Coordinator
    async register() {
        try {
            const response = await this.makeRequest('POST', '/register', {
                serverId: this.serverId,
                serverType: this.serverType,
                port: this.serverPort,
                capabilities: this.capabilities
            });
            
            if (response.success) {
                console.log(`✅ Server ${this.serverId} registered successfully`);
                this.connectWebSocket();
                this.startHeartbeat();
                return true;
            } else {
                console.error('❌ Registration failed:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Registration error:', error.message);
            return false;
        }
    }

    // เชื่อมต่อ WebSocket
    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log(`🔌 WebSocket connected for ${this.serverId}`);
                this.isConnected = true;
                
                // Subscribe to relevant channels
                this.subscribeToChannel('global');
                this.subscribeToChannel(this.serverType);
                this.subscribeToChannel(this.serverId);
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('WebSocket message parse error:', error);
                }
            });
            
            this.ws.on('close', () => {
                console.log(`🔌 WebSocket disconnected for ${this.serverId}`);
                this.isConnected = false;
                
                // Attempt to reconnect after 5 seconds
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.log('🔄 Attempting to reconnect WebSocket...');
                        this.connectWebSocket();
                    }
                }, 5000);
            });
            
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    // จัดการข้อความ WebSocket
    handleWebSocketMessage(message) {
        const { type, dataType, serverId, data, metadata, channel } = message;
        
        switch (type) {
            case 'data-update':
                this.handleDataUpdate(dataType, serverId, data, metadata);
                break;
            case 'subscription-confirmed':
                console.log(`📡 Subscribed to channel: ${channel}`);
                break;
            case 'channel-broadcast':
                this.handleChannelBroadcast(channel, data);
                break;
            case 'sync-request':
                this.handleSyncRequest(message);
                break;
        }
    }

    // จัดการการอัปเดตข้อมูล
    handleDataUpdate(dataType, serverId, data, metadata) {
        if (serverId !== this.serverId) {
            console.log(`📥 Received ${dataType} data from ${serverId}`);
            
            // เก็บข้อมูลใน local cache
            const key = `${serverId}:${dataType}`;
            this.sharedData.set(key, {
                data: data,
                metadata: metadata,
                timestamp: new Date(),
                source: serverId
            });
            
            // เรียก callback ถ้ามี
            this.onDataReceived(dataType, serverId, data, metadata);
        }
    }

    // จัดการ channel broadcast
    handleChannelBroadcast(channel, data) {
        console.log(`📢 Channel broadcast on ${channel}:`, data);
        this.onChannelMessage(channel, data);
    }

    // จัดการ sync request
    handleSyncRequest(message) {
        // ส่งข้อมูลปัจจุบันกลับไป
        const syncData = this.prepareSyncData();
        this.sendWebSocketMessage({
            type: 'sync-response',
            serverId: this.serverId,
            data: syncData
        });
    }

    // แชร์ข้อมูล
    async shareData(dataType, data, metadata = {}) {
        try {
            const response = await this.makeRequest('POST', `/share/${dataType}`, {
                serverId: this.serverId,
                data: data,
                metadata: {
                    ...metadata,
                    serverType: this.serverType,
                    timestamp: new Date().toISOString()
                }
            });
            
            if (response.success) {
                console.log(`📤 Shared ${dataType} data successfully`);
                return true;
            } else {
                console.error('❌ Data sharing failed:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Data sharing error:', error.message);
            return false;
        }
    }

    // ดึงข้อมูลแชร์
    async getSharedData(dataType, serverId = null) {
        try {
            const url = serverId ? `/share/${dataType}?serverId=${serverId}` : `/share/${dataType}`;
            const response = await this.makeRequest('GET', url);
            
            if (response.success) {
                return response.data;
            } else {
                console.error('❌ Failed to get shared data:', response.error);
                return [];
            }
        } catch (error) {
            console.error('❌ Get shared data error:', error.message);
            return [];
        }
    }

    // Subscribe to channel
    subscribeToChannel(channel) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendWebSocketMessage({
                type: 'subscribe',
                serverId: this.serverId,
                payload: { channel: channel }
            });
            this.subscriptions.add(channel);
        }
    }

    // Broadcast to channel
    broadcastToChannel(channel, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendWebSocketMessage({
                type: 'broadcast',
                serverId: this.serverId,
                payload: {
                    channel: channel,
                    data: data
                }
            });
        }
    }

    // ส่งข้อความ WebSocket
    sendWebSocketMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    // Git Memory operations
    async commitToGitMemory(message) {
        try {
            const response = await this.makeRequest('POST', '/git-memory/commit', {
                message: message
            });
            
            if (response.success) {
                console.log(`📝 Git commit successful: ${message}`);
                return true;
            } else {
                console.error('❌ Git commit failed:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Git commit error:', error.message);
            return false;
        }
    }

    // เริ่ม heartbeat
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await this.makeRequest('POST', '/heartbeat', {
                    serverId: this.serverId
                });
            } catch (error) {
                console.error('Heartbeat error:', error.message);
            }
        }, 30000); // Every 30 seconds
    }

    // หยุด heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // เตรียมข้อมูลสำหรับ sync
    prepareSyncData() {
        const syncData = {
            serverId: this.serverId,
            serverType: this.serverType,
            capabilities: this.capabilities,
            sharedData: Array.from(this.sharedData.entries()),
            subscriptions: Array.from(this.subscriptions),
            timestamp: new Date().toISOString()
        };
        
        return syncData;
    }

    // ทำ HTTP request
    async makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: this.coordinatorPort,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            if (data && (method === 'POST' || method === 'PUT')) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    // Callback functions (override ในแต่ละ server)
    onDataReceived(dataType, serverId, data, metadata) {
        // Override this method in your MCP server
        console.log(`📥 Data received: ${dataType} from ${serverId}`);
    }

    onChannelMessage(channel, data) {
        // Override this method in your MCP server
        console.log(`📢 Channel message on ${channel}:`, data);
    }

    // ปิดการเชื่อมต่อ
    disconnect() {
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close();
        }
        
        console.log(`🔌 ${this.serverId} disconnected from shared data coordinator`);
    }

    // Helper methods สำหรับ MCP servers
    
    // แชร์ memory data
    async shareMemory(memoryData) {
        return await this.shareData('memory', memoryData, {
            type: 'memory-update',
            size: JSON.stringify(memoryData).length
        });
    }

    // แชร์ session data
    async shareSession(sessionData) {
        return await this.shareData('session', sessionData, {
            type: 'session-update',
            sessionId: sessionData.id || 'unknown'
        });
    }

    // แชร์ configuration
    async shareConfig(configData) {
        return await this.shareData('config', configData, {
            type: 'config-update',
            version: configData.version || '1.0.0'
        });
    }

    // แชร์ logs
    async shareLogs(logData) {
        return await this.shareData('logs', logData, {
            type: 'log-entry',
            level: logData.level || 'info'
        });
    }

    // ดึง memory data จาก servers อื่น
    async getSharedMemory(serverId = null) {
        return await this.getSharedData('memory', serverId);
    }

    // ดึง session data จาก servers อื่น
    async getSharedSessions(serverId = null) {
        return await this.getSharedData('session', serverId);
    }

    // ดึง configuration จาก servers อื่น
    async getSharedConfigs(serverId = null) {
        return await this.getSharedData('config', serverId);
    }

    // ดึง logs จาก servers อื่น
    async getSharedLogs(serverId = null) {
        return await this.getSharedData('logs', serverId);
    }
}

module.exports = MCPServerSharedIntegration;