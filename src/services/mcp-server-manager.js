/**
 * MCP Server Manager - จัดการ MCP Servers ทั้งหมด
 * สร้างโดย: NEXUS IDE AI Assistant
 */

const EventEmitter = require('events');
const { MCPClient } = require('./mcp-client');
const fs = require('fs').promises;
const path = require('path');

class MCPServerManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            configPath: options.configPath || './config/mcp-servers.json',
            autoReconnect: options.autoReconnect !== false,
            healthCheckInterval: options.healthCheckInterval || 30000,
            ...options
        };
        
        this.client = new MCPClient();
        this.servers = new Map();
        this.tools = new Map();
        this.healthCheckTimer = null;
        this.isInitialized = false;
        
        console.log('🎛️ MCP Server Manager สร้างเสร็จสิ้น');
    }
    
    /**
     * เริ่มต้น Server Manager
     */
    async initialize() {
        try {
            console.log('🚀 กำลังเริ่มต้น MCP Server Manager...');
            
            // เริ่มต้น MCP Client
            await this.client.initialize();
            
            // โหลดการตั้งค่า servers
            await this.loadServerConfig();
            
            // ตั้งค่า event handlers
            this.setupEventHandlers();
            
            // เริ่ม health check
            this.startHealthCheck();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ MCP Server Manager เริ่มต้นเสร็จสิ้น');
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้น MCP Server Manager:', error);
            throw error;
        }
    }
    
    /**
     * โหลดการตั้งค่า servers
     */
    async loadServerConfig() {
        try {
            const configExists = await fs.access(this.options.configPath).then(() => true).catch(() => false);
            
            if (configExists) {
                const configData = await fs.readFile(this.options.configPath, 'utf8');
                const config = JSON.parse(configData);
                
                for (const serverConfig of config.servers || []) {
                    await this.addServer(serverConfig);
                }
                
                console.log(`📋 โหลดการตั้งค่า ${config.servers?.length || 0} servers`);
            } else {
                console.log('📋 ไม่พบไฟล์การตั้งค่า servers, ใช้การตั้งค่าเริ่มต้น');
                await this.createDefaultConfig();
            }
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการโหลดการตั้งค่า:', error);
        }
    }
    
    /**
     * สร้างการตั้งค่าเริ่มต้น
     */
    async createDefaultConfig() {
        const defaultConfig = {
            version: '1.0.0',
            servers: [
                {
                    name: 'git-memory',
                    type: 'stdio',
                    command: 'node',
                    args: ['src/index.js'],
                    cwd: process.cwd(),
                    capabilities: ['memory', 'git', 'search'],
                    enabled: true
                },
                {
                    name: 'file-system',
                    type: 'stdio',
                    command: 'node',
                    args: ['servers/file-system/server.js'],
                    cwd: process.cwd(),
                    capabilities: ['files', 'directories'],
                    enabled: false
                },
                {
                    name: 'web-search',
                    type: 'stdio',
                    command: 'node',
                    args: ['servers/web-search/server.js'],
                    cwd: process.cwd(),
                    capabilities: ['search', 'web'],
                    enabled: false
                }
            ]
        };
        
        // สร้างโฟลเดอร์ config ถ้าไม่มี
        const configDir = path.dirname(this.options.configPath);
        await fs.mkdir(configDir, { recursive: true });
        
        // บันทึกการตั้งค่าเริ่มต้น
        await fs.writeFile(this.options.configPath, JSON.stringify(defaultConfig, null, 2));
        
        console.log('📋 สร้างการตั้งค่าเริ่มต้นเสร็จสิ้น');
    }
    
    /**
     * เพิ่ม server ใหม่
     */
    async addServer(serverConfig) {
        try {
            if (this.servers.has(serverConfig.name)) {
                console.warn(`⚠️ Server ${serverConfig.name} มีอยู่แล้ว`);
                return false;
            }
            
            const server = {
                ...serverConfig,
                status: 'disconnected',
                lastConnected: null,
                reconnectAttempts: 0,
                tools: new Map(),
                stats: {
                    totalCalls: 0,
                    successfulCalls: 0,
                    failedCalls: 0,
                    averageResponseTime: 0
                }
            };
            
            this.servers.set(serverConfig.name, server);
            
            // เชื่อมต่อถ้า enabled
            if (serverConfig.enabled !== false) {
                await this.connectServer(serverConfig.name);
            }
            
            console.log(`📡 เพิ่ม server: ${serverConfig.name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ เกิดข้อผิดพลาดในการเพิ่ม server ${serverConfig.name}:`, error);
            return false;
        }
    }
    
    /**
     * เชื่อมต่อกับ server
     */
    async connectServer(serverName) {
        try {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`ไม่พบ server: ${serverName}`);
            }
            
            if (server.status === 'connected') {
                console.log(`📡 ${serverName} เชื่อมต่ออยู่แล้ว`);
                return true;
            }
            
            server.status = 'connecting';
            
            // เชื่อมต่อผ่าน MCP Client
            await this.client.connect(serverName, server);
            
            // อัพเดทสถานะ
            server.status = 'connected';
            server.lastConnected = new Date();
            server.reconnectAttempts = 0;
            
            // โหลด tools ของ server
            await this.loadServerTools(serverName);
            
            this.emit('serverConnected', serverName);
            console.log(`✅ เชื่อมต่อกับ ${serverName} สำเร็จ`);
            
            return true;
            
        } catch (error) {
            const server = this.servers.get(serverName);
            if (server) {
                server.status = 'error';
                server.reconnectAttempts++;
            }
            
            console.error(`❌ ไม่สามารถเชื่อมต่อกับ ${serverName}:`, error);
            
            // ลองเชื่อมต่อใหม่ถ้าเปิดใช้งาน auto reconnect
            if (this.options.autoReconnect && server && server.reconnectAttempts < 3) {
                setTimeout(() => {
                    this.connectServer(serverName);
                }, 5000 * server.reconnectAttempts);
            }
            
            return false;
        }
    }
    
    /**
     * โหลด tools ของ server
     */
    async loadServerTools(serverName) {
        try {
            // ส่ง request เพื่อขอรายการ tools
            const toolsResult = await this.client.callTool('list_tools', {});
            
            const server = this.servers.get(serverName);
            if (server && toolsResult.tools) {
                for (const tool of toolsResult.tools) {
                    server.tools.set(tool.name, tool);
                    this.tools.set(tool.name, {
                        ...tool,
                        server: serverName
                    });
                }
                
                console.log(`🔧 โหลด ${toolsResult.tools.length} tools จาก ${serverName}`);
            }
            
        } catch (error) {
            console.warn(`⚠️ ไม่สามารถโหลด tools จาก ${serverName}:`, error.message);
        }
    }
    
    /**
     * ตัดการเชื่อมต่อกับ server
     */
    async disconnectServer(serverName) {
        try {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`ไม่พบ server: ${serverName}`);
            }
            
            await this.client.disconnect(serverName);
            
            server.status = 'disconnected';
            
            // ลบ tools ของ server นี้
            for (const toolName of server.tools.keys()) {
                this.tools.delete(toolName);
            }
            server.tools.clear();
            
            this.emit('serverDisconnected', serverName);
            console.log(`📡 ตัดการเชื่อมต่อกับ ${serverName}`);
            
        } catch (error) {
            console.error(`❌ เกิดข้อผิดพลาดในการตัดการเชื่อมต่อ ${serverName}:`, error);
        }
    }
    
    /**
     * ลบ server
     */
    async removeServer(serverName) {
        await this.disconnectServer(serverName);
        this.servers.delete(serverName);
        console.log(`🗑️ ลบ server: ${serverName}`);
    }
    
    /**
     * เรียกใช้ tool
     */
    async callTool(toolName, params = {}) {
        try {
            const tool = this.tools.get(toolName);
            if (!tool) {
                throw new Error(`ไม่พบ tool: ${toolName}`);
            }
            
            const server = this.servers.get(tool.server);
            if (!server || server.status !== 'connected') {
                throw new Error(`Server ${tool.server} ไม่ได้เชื่อมต่อ`);
            }
            
            const startTime = Date.now();
            
            // เรียกใช้ tool ผ่าน client
            const result = await this.client.callTool(toolName, params);
            
            // อัพเดทสถิติ
            const responseTime = Date.now() - startTime;
            server.stats.totalCalls++;
            server.stats.successfulCalls++;
            server.stats.averageResponseTime = 
                (server.stats.averageResponseTime * (server.stats.successfulCalls - 1) + responseTime) / server.stats.successfulCalls;
            
            return result;
            
        } catch (error) {
            // อัพเดทสถิติ error
            const tool = this.tools.get(toolName);
            if (tool) {
                const server = this.servers.get(tool.server);
                if (server) {
                    server.stats.totalCalls++;
                    server.stats.failedCalls++;
                }
            }
            
            throw error;
        }
    }
    
    /**
     * ตั้งค่า event handlers
     */
    setupEventHandlers() {
        this.client.on('connected', (serverName) => {
            this.emit('serverConnected', serverName);
        });
        
        this.client.on('disconnected', (serverName) => {
            const server = this.servers.get(serverName);
            if (server) {
                server.status = 'disconnected';
            }
            this.emit('serverDisconnected', serverName);
        });
    }
    
    /**
     * เริ่ม health check
     */
    startHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        
        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthCheck();
        }, this.options.healthCheckInterval);
        
        console.log('💓 เริ่ม health check');
    }
    
    /**
     * ทำ health check
     */
    async performHealthCheck() {
        for (const [serverName, server] of this.servers) {
            if (server.status === 'connected') {
                try {
                    // ส่ง ping เพื่อตรวจสอบการเชื่อมต่อ
                    await this.client.callTool('ping', {});
                } catch (error) {
                    console.warn(`⚠️ Health check failed for ${serverName}:`, error.message);
                    server.status = 'error';
                    
                    // ลองเชื่อมต่อใหม่
                    if (this.options.autoReconnect) {
                        setTimeout(() => {
                            this.connectServer(serverName);
                        }, 1000);
                    }
                }
            }
        }
    }
    
    /**
     * หยุด health check
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
            console.log('💓 หยุด health check');
        }
    }
    
    /**
     * รับรายการ servers ที่เชื่อมต่ออยู่
     */
    getConnectedServers() {
        const connected = [];
        for (const [name, server] of this.servers) {
            if (server.status === 'connected') {
                connected.push({
                    name,
                    capabilities: server.capabilities,
                    toolCount: server.tools.size,
                    stats: server.stats
                });
            }
        }
        return connected;
    }
    
    /**
     * รับรายการ tools ที่ใช้ได้ทั้งหมด
     */
    getAvailableTools() {
        return Array.from(this.tools.values());
    }
    
    /**
     * รับสถานะของ servers ทั้งหมด
     */
    getServerStatus() {
        const status = {};
        for (const [name, server] of this.servers) {
            status[name] = {
                status: server.status,
                lastConnected: server.lastConnected,
                reconnectAttempts: server.reconnectAttempts,
                toolCount: server.tools.size,
                stats: server.stats
            };
        }
        return status;
    }
    
    /**
     * บันทึกการตั้งค่า
     */
    async saveConfig() {
        try {
            const config = {
                version: '1.0.0',
                servers: Array.from(this.servers.values()).map(server => ({
                    name: server.name,
                    type: server.type,
                    command: server.command,
                    args: server.args,
                    cwd: server.cwd,
                    capabilities: server.capabilities,
                    enabled: server.status !== 'disabled'
                }))
            };
            
            await fs.writeFile(this.options.configPath, JSON.stringify(config, null, 2));
            console.log('💾 บันทึกการตั้งค่าเสร็จสิ้น');
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการบันทึกการตั้งค่า:', error);
        }
    }
    
    /**
     * ปิดระบบ
     */
    async shutdown() {
        console.log('🛑 กำลังปิดระบบ MCP Server Manager...');
        
        this.stopHealthCheck();
        await this.client.disconnectAll();
        
        this.emit('shutdown');
        console.log('✅ ปิดระบบ MCP Server Manager เสร็จสิ้น');
    }
}

module.exports = { MCPServerManager };