/**
 * MCP Client - ไคลเอนต์สำหรับเชื่อมต่อกับ MCP Servers
 * สร้างโดย: NEXUS IDE AI Assistant
 */

const EventEmitter = require('events');
const { spawn } = require('child_process');
const WebSocket = require('ws');

class MCPClient extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            timeout: options.timeout || 30000,
            retries: options.retries || 3,
            ...options
        };
        
        this.connections = new Map();
        this.tools = new Map();
        this.isInitialized = false;
        
        console.log('🔌 MCP Client สร้างเสร็จสิ้น');
    }
    
    /**
     * เริ่มต้น MCP Client
     */
    async initialize() {
        try {
            console.log('🚀 กำลังเริ่มต้น MCP Client...');
            
            // ตั้งค่าการเชื่อมต่อพื้นฐาน
            this.setupEventHandlers();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ MCP Client เริ่มต้นเสร็จสิ้น');
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้น MCP Client:', error);
            throw error;
        }
    }
    
    /**
     * เชื่อมต่อกับ MCP Server
     */
    async connect(serverName, config) {
        try {
            console.log(`🔗 กำลังเชื่อมต่อกับ ${serverName}...`);
            
            const connection = {
                name: serverName,
                config,
                status: 'connecting',
                tools: new Map(),
                lastPing: Date.now()
            };
            
            // สร้างการเชื่อมต่อตามประเภท
            if (config.type === 'websocket') {
                await this.connectWebSocket(connection);
            } else if (config.type === 'stdio') {
                await this.connectStdio(connection);
            } else {
                throw new Error(`ประเภทการเชื่อมต่อไม่รองรับ: ${config.type}`);
            }
            
            this.connections.set(serverName, connection);
            this.emit('connected', serverName);
            
            console.log(`✅ เชื่อมต่อกับ ${serverName} สำเร็จ`);
            return true;
            
        } catch (error) {
            console.error(`❌ ไม่สามารถเชื่อมต่อกับ ${serverName}:`, error);
            throw error;
        }
    }
    
    /**
     * เชื่อมต่อผ่าน WebSocket
     */
    async connectWebSocket(connection) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(connection.config.url);
            
            ws.on('open', () => {
                connection.ws = ws;
                connection.status = 'connected';
                resolve();
            });
            
            ws.on('message', (data) => {
                this.handleMessage(connection.name, JSON.parse(data));
            });
            
            ws.on('error', (error) => {
                connection.status = 'error';
                reject(error);
            });
            
            ws.on('close', () => {
                connection.status = 'disconnected';
                this.emit('disconnected', connection.name);
            });
        });
    }
    
    /**
     * เชื่อมต่อผ่าน STDIO
     */
    async connectStdio(connection) {
        return new Promise((resolve, reject) => {
            const process = spawn(connection.config.command, connection.config.args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            connection.process = process;
            connection.status = 'connected';
            
            process.stdout.on('data', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(connection.name, message);
                } catch (error) {
                    console.warn('⚠️ ไม่สามารถแปลงข้อความจาก STDIO:', error);
                }
            });
            
            process.stderr.on('data', (data) => {
                console.error(`❌ ${connection.name} STDERR:`, data.toString());
            });
            
            process.on('error', (error) => {
                connection.status = 'error';
                reject(error);
            });
            
            process.on('exit', (code) => {
                connection.status = 'disconnected';
                this.emit('disconnected', connection.name);
            });
            
            // รอให้ process เริ่มต้น
            setTimeout(resolve, 1000);
        });
    }
    
    /**
     * เรียกใช้ Tool
     */
    async callTool(toolName, params = {}) {
        try {
            // หา server ที่มี tool นี้
            const serverName = this.findServerForTool(toolName);
            if (!serverName) {
                throw new Error(`ไม่พบ tool: ${toolName}`);
            }
            
            const connection = this.connections.get(serverName);
            if (!connection || connection.status !== 'connected') {
                throw new Error(`Server ${serverName} ไม่ได้เชื่อมต่อ`);
            }
            
            // สร้าง request
            const request = {
                id: this.generateRequestId(),
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: params
                }
            };
            
            // ส่ง request
            await this.sendRequest(connection, request);
            
            // รอ response
            return await this.waitForResponse(request.id);
            
        } catch (error) {
            console.error(`❌ เกิดข้อผิดพลาดในการเรียก tool ${toolName}:`, error);
            throw error;
        }
    }
    
    /**
     * ส่ง request
     */
    async sendRequest(connection, request) {
        if (connection.ws) {
            connection.ws.send(JSON.stringify(request));
        } else if (connection.process) {
            connection.process.stdin.write(JSON.stringify(request) + '\n');
        } else {
            throw new Error('ไม่มีการเชื่อมต่อที่ใช้ได้');
        }
    }
    
    /**
     * รอ response
     */
    async waitForResponse(requestId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, this.options.timeout);
            
            const handler = (response) => {
                if (response.id === requestId) {
                    clearTimeout(timeout);
                    this.removeListener('response', handler);
                    
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                }
            };
            
            this.on('response', handler);
        });
    }
    
    /**
     * จัดการข้อความที่ได้รับ
     */
    handleMessage(serverName, message) {
        if (message.id && (message.result || message.error)) {
            // Response message
            this.emit('response', message);
        } else if (message.method) {
            // Request/Notification message
            this.emit('request', serverName, message);
        }
    }
    
    /**
     * หา server ที่มี tool
     */
    findServerForTool(toolName) {
        for (const [serverName, connection] of this.connections) {
            if (connection.tools.has(toolName)) {
                return serverName;
            }
        }
        return null;
    }
    
    /**
     * สร้าง request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * ตั้งค่า event handlers
     */
    setupEventHandlers() {
        this.on('connected', (serverName) => {
            console.log(`📡 เชื่อมต่อกับ ${serverName} แล้ว`);
        });
        
        this.on('disconnected', (serverName) => {
            console.log(`📡 ตัดการเชื่อมต่อกับ ${serverName}`);
        });
    }
    
    /**
     * รับรายการ tools ที่ใช้ได้
     */
    getAvailableTools() {
        const tools = [];
        for (const [serverName, connection] of this.connections) {
            for (const [toolName, toolInfo] of connection.tools) {
                tools.push({
                    name: toolName,
                    server: serverName,
                    ...toolInfo
                });
            }
        }
        return tools;
    }
    
    /**
     * รับสถานะการเชื่อมต่อ
     */
    getConnectionStatus() {
        const status = {};
        for (const [serverName, connection] of this.connections) {
            status[serverName] = {
                status: connection.status,
                toolCount: connection.tools.size,
                lastPing: connection.lastPing
            };
        }
        return status;
    }
    
    /**
     * ปิดการเชื่อมต่อ
     */
    async disconnect(serverName) {
        const connection = this.connections.get(serverName);
        if (!connection) return;
        
        if (connection.ws) {
            connection.ws.close();
        } else if (connection.process) {
            connection.process.kill();
        }
        
        this.connections.delete(serverName);
        console.log(`📡 ตัดการเชื่อมต่อกับ ${serverName}`);
    }
    
    /**
     * ปิดการเชื่อมต่อทั้งหมด
     */
    async disconnectAll() {
        for (const serverName of this.connections.keys()) {
            await this.disconnect(serverName);
        }
    }
}

module.exports = { MCPClient };