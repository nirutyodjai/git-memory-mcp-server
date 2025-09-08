/**
 * AI Builder System - ระบบสร้าง AI เปล่าสำหรับให้ผู้ใช้ปรับแต่งเอง
 * สร้างโดย: NEXUS IDE AI Assistant
 * วันที่: 2024
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { MCPClient } = require('../services/mcp-client');
const { MCPServerManager } = require('../services/mcp-server-manager');

class AIBuilderSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // การตั้งค่าพื้นฐาน
        this.config = {
            name: options.name || 'Custom AI',
            version: '1.0.0',
            description: options.description || 'AI ที่สร้างโดยผู้ใช้',
            capabilities: options.capabilities || [],
            memory: {
                enabled: true,
                maxSize: '1GB',
                persistent: true
            },
            learning: {
                enabled: true,
                adaptiveMode: true,
                feedbackLoop: true
            },
            personality: {
                style: options.personality?.style || 'friendly',
                language: options.personality?.language || 'th',
                expertise: options.personality?.expertise || []
            }
        };
        
        // ระบบหลัก
        this.brain = new AIBrain(this.config);
        this.memory = new AIMemorySystem(this.config.memory);
        this.learningEngine = new AILearningEngine(this.config.learning);
        this.personalityEngine = new AIPersonalityEngine(this.config.personality);
        
        // ระบบปลั๊กอิน
        this.plugins = new Map();
        this.customModules = new Map();
        
        // MCP Integration
        this.mcpClient = new MCPClient();
        this.mcpServerManager = new MCPServerManager();
        this.mcpCapabilities = new Map();
        
        // สถานะ
        this.isInitialized = false;
        this.isRunning = false;
        this.stats = {
            interactions: 0,
            learningEvents: 0,
            memoryUsage: 0,
            uptime: 0
        };
        
        console.log(`🤖 AI Builder System initialized: ${this.config.name}`);
    }
    
    /**
     * เริ่มต้นระบบ AI
     */
    async initialize() {
        try {
            console.log('🚀 กำลังเริ่มต้นระบบ AI Builder...');
            
            // เริ่มต้นระบบย่อย
            await this.brain.initialize();
            await this.memory.initialize();
            await this.learningEngine.initialize();
            await this.personalityEngine.initialize();
            
            // เริ่มต้น MCP System
            await this.initializeMCP();
            
            // โหลดปลั๊กอินและโมดูลที่มีอยู่
            await this.loadPlugins();
            await this.loadCustomModules();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ ระบบ AI Builder เริ่มต้นเสร็จสิ้น');
            return true;
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้นระบบ:', error);
            throw error;
        }
    }
    
    /**
     * เริ่มการทำงานของ AI
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        this.isRunning = true;
        this.stats.startTime = Date.now();
        
        // เริ่มระบบการเรียนรู้
        this.learningEngine.start();
        
        // เริ่มระบบติดตาม
        this.startMonitoring();
        
        this.emit('started');
        console.log('🟢 AI เริ่มทำงานแล้ว');
    }
    
    /**
     * หยุดการทำงานของ AI
     */
    async stop() {
        this.isRunning = false;
        
        // หยุดระบบต่างๆ
        this.learningEngine.stop();
        this.stopMonitoring();
        
        // บันทึกข้อมูล
        await this.saveState();
        
        this.emit('stopped');
        console.log('🔴 AI หยุดทำงานแล้ว');
    }
    
    /**
     * ประมวลผลข้อความจากผู้ใช้
     */
    async processMessage(message, context = {}) {
        if (!this.isRunning) {
            throw new Error('AI ยังไม่ได้เริ่มทำงาน');
        }
        
        try {
            this.stats.interactions++;
            
            // วิเคราะห์ข้อความ
            const analysis = await this.brain.analyzeMessage(message, context);
            
            // ค้นหาข้อมูลจากความจำ
            const memoryData = await this.memory.search(message);
            
            // สร้างบุคลิกภาพในการตอบ
            const personalityContext = this.personalityEngine.getContext();
            
            // สร้างคำตอบ
            const response = await this.brain.generateResponse({
                message,
                analysis,
                memoryData,
                personalityContext,
                context
            });
            
            // บันทึกการโต้ตอบ
            await this.memory.store({
                input: message,
                output: response,
                timestamp: Date.now(),
                context
            });
            
            // เรียนรู้จากการโต้ตอบ
            this.learningEngine.learn({
                message,
                response,
                context,
                feedback: null // จะได้รับจาก feedback ภายหลัง
            });
            
            this.emit('messageProcessed', { message, response });
            return response;
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการประมวลผล:', error);
            throw error;
        }
    }
    
    /**
     * เพิ่มความสามารถใหม่ให้ AI
     */
    async addCapability(name, capability) {
        try {
            // ตรวจสอบความถูกต้องของความสามารถ
            if (!capability.execute || typeof capability.execute !== 'function') {
                throw new Error('Capability ต้องมี execute function');
            }
            
            // เพิ่มความสามารถ
            this.brain.addCapability(name, capability);
            this.config.capabilities.push(name);
            
            console.log(`✅ เพิ่มความสามารถ "${name}" เรียบร้อยแล้ว`);
            this.emit('capabilityAdded', { name, capability });
            
        } catch (error) {
            console.error(`❌ ไม่สามารถเพิ่มความสามารถ "${name}":`, error);
            throw error;
        }
    }
    
    /**
     * ติดตั้งปลั๊กอิน
     */
    async installPlugin(pluginName, pluginCode) {
        try {
            // สร้างปลั๊กอิน
            const plugin = new AIPlugin(pluginName, pluginCode);
            await plugin.initialize();
            
            // ติดตั้ง
            this.plugins.set(pluginName, plugin);
            
            console.log(`🔌 ติดตั้งปลั๊กอิน "${pluginName}" เรียบร้อยแล้ว`);
            this.emit('pluginInstalled', { pluginName, plugin });
            
        } catch (error) {
            console.error(`❌ ไม่สามารถติดตั้งปลั๊กอิน "${pluginName}":`, error);
            throw error;
        }
    }
    
    /**
     * ปรับแต่งบุคลิกภาพ
     */
    updatePersonality(personalityConfig) {
        this.config.personality = { ...this.config.personality, ...personalityConfig };
        this.personalityEngine.updateConfig(this.config.personality);
        
        console.log('🎭 อัปเดตบุคลิกภาพเรียบร้อยแล้ว');
        this.emit('personalityUpdated', personalityConfig);
    }
    
    /**
     * ให้ feedback กับ AI
     */
    async provideFeedback(interactionId, feedback) {
        try {
            await this.learningEngine.processFeedback(interactionId, feedback);
            console.log('📝 รับ feedback เรียบร้อยแล้ว');
            this.emit('feedbackReceived', { interactionId, feedback });
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการประมวลผล feedback:', error);
            throw error;
        }
    }
    
    /**
     * ดูสถิติการทำงาน
     */
    getStats() {
        const currentTime = Date.now();
        const uptime = this.stats.startTime ? currentTime - this.stats.startTime : 0;
        
        return {
            ...this.stats,
            uptime,
            memoryUsage: this.memory.getUsage(),
            capabilities: this.config.capabilities.length,
            plugins: this.plugins.size,
            isRunning: this.isRunning
        };
    }
    
    /**
     * ส่งออกการตั้งค่า AI
     */
    async exportConfig() {
        const config = {
            ...this.config,
            plugins: Array.from(this.plugins.keys()),
            customModules: Array.from(this.customModules.keys()),
            stats: this.getStats()
        };
        
        return JSON.stringify(config, null, 2);
    }
    
    /**
     * นำเข้าการตั้งค่า AI
     */
    async importConfig(configString) {
        try {
            const config = JSON.parse(configString);
            
            // อัปเดตการตั้งค่า
            this.config = { ...this.config, ...config };
            
            // รีเซ็ตระบบ
            if (this.isRunning) {
                await this.stop();
                await this.start();
            }
            
            console.log('📥 นำเข้าการตั้งค่าเรียบร้อยแล้ว');
            this.emit('configImported', config);
            
        } catch (error) {
            console.error('❌ ไม่สามารถนำเข้าการตั้งค่า:', error);
            throw error;
        }
    }
    
    // ฟังก์ชันช่วยเหลือ
    async loadPlugins() {
        // โหลดปลั๊กอินที่มีอยู่
        console.log('🔌 กำลังโหลดปลั๊กอิน...');
    }
    
    async loadCustomModules() {
        // โหลดโมดูลที่ผู้ใช้สร้าง
        console.log('📦 กำลังโหลดโมดูลที่กำหนดเอง...');
    }
    
    /**
     * เริ่มต้นระบบ MCP
     */
    async initializeMCP() {
        try {
            console.log('🔌 กำลังเริ่มต้นระบบ MCP...');
            
            // เริ่มต้น MCP Client และ Server Manager
            await this.mcpClient.initialize();
            await this.mcpServerManager.initialize();
            
            // โหลด MCP Servers ที่มีอยู่
            await this.loadMCPServers();
            
            // เพิ่ม MCP capabilities ให้กับ AI Brain
            this.addMCPCapabilities();
            
            console.log('✅ ระบบ MCP เริ่มต้นเสร็จสิ้น');
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้น MCP:', error);
            // ไม่ throw error เพื่อให้ AI ยังทำงานได้แม้ MCP จะไม่พร้อม
        }
    }

    /**
     * โหลด MCP Servers
     */
    async loadMCPServers() {
        const defaultServers = [
            {
                name: 'git-memory',
                command: 'node',
                args: ['src/index.js'],
                capabilities: ['memory', 'git', 'search']
            },
            {
                name: 'file-system',
                command: 'node',
                args: ['servers/file-system/server.js'],
                capabilities: ['files', 'directories']
            },
            {
                name: 'web-search',
                command: 'node', 
                args: ['servers/web-search/server.js'],
                capabilities: ['search', 'web']
            }
        ];

        for (const server of defaultServers) {
            try {
                await this.mcpServerManager.addServer(server);
                console.log(`📡 เชื่อมต่อ MCP Server: ${server.name}`);
            } catch (error) {
                console.warn(`⚠️ ไม่สามารถเชื่อมต่อ ${server.name}:`, error.message);
            }
        }
    }

    /**
     * เพิ่ม MCP capabilities ให้กับ AI
     */
    addMCPCapabilities() {
        // เพิ่มความสามารถในการใช้ MCP tools
        this.brain.addCapability('mcp_call', async (toolName, params) => {
            return await this.callMCPTool(toolName, params);
        });

        // เพิ่มความสามารถในการค้นหาข้อมูล
        this.brain.addCapability('search_memory', async (query) => {
            return await this.searchInMemory(query);
        });

        // เพิ่มความสามารถในการจัดการไฟล์
        this.brain.addCapability('file_operations', async (operation, params) => {
            return await this.performFileOperation(operation, params);
        });

        // เพิ่มความสามารถในการค้นหาเว็บ
        this.brain.addCapability('web_search', async (query) => {
            return await this.performWebSearch(query);
        });
    }

    /**
     * เรียกใช้ MCP Tool
     */
    async callMCPTool(toolName, params) {
        try {
            const result = await this.mcpClient.callTool(toolName, params);
            this.stats.interactions++;
            return result;
        } catch (error) {
            console.error(`❌ MCP Tool Error (${toolName}):`, error);
            return { error: error.message };
        }
    }

    /**
     * ค้นหาในหน่วยความจำ
     */
    async searchInMemory(query) {
        try {
            return await this.callMCPTool('search_memory', { query });
        } catch (error) {
            return await this.memory.search(query); // fallback to local memory
        }
    }

    /**
     * ดำเนินการกับไฟล์
     */
    async performFileOperation(operation, params) {
        try {
            return await this.callMCPTool(`file_${operation}`, params);
        } catch (error) {
            console.error(`❌ File Operation Error (${operation}):`, error);
            return { error: error.message };
        }
    }

    /**
     * ค้นหาเว็บ
     */
    async performWebSearch(query) {
        try {
            return await this.callMCPTool('web_search', { query });
        } catch (error) {
            console.error('❌ Web Search Error:', error);
            return { error: error.message };
        }
    }

    /**
     * เพิ่ม MCP Server ใหม่
     */
    async addMCPServer(serverConfig) {
        try {
            await this.mcpServerManager.addServer(serverConfig);
            console.log(`📡 เพิ่ม MCP Server: ${serverConfig.name}`);
            return true;
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเพิ่ม MCP Server:', error);
            return false;
        }
    }

    /**
     * รับรายการ MCP Servers ที่เชื่อมต่ออยู่
     */
    getMCPServers() {
        return this.mcpServerManager.getConnectedServers();
    }

    /**
     * รับรายการ MCP Tools ที่ใช้ได้
     */
    getAvailableMCPTools() {
        return this.mcpServerManager.getAvailableTools();
    }

    startMonitoring() {
        // เริ่มระบบติดตาม
        this.monitoringInterval = setInterval(() => {
            this.updateStats();
        }, 5000);
    }
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }
    
    updateStats() {
        // อัปเดตสถิติ
        this.stats.memoryUsage = this.memory.getUsage();
    }
    
    async saveState() {
        // บันทึกสถานะปัจจุบัน
        console.log('💾 กำลังบันทึกสถานะ...');
    }
}

/**
 * ระบบสมองของ AI
 */
class AIBrain {
    constructor(config) {
        this.config = config;
        this.capabilities = new Map();
        this.processors = new Map();
    }
    
    async initialize() {
        console.log('🧠 เริ่มต้นระบบสมอง AI...');
        
        // เพิ่มความสามารถพื้นฐาน
        this.addBasicCapabilities();
    }
    
    addBasicCapabilities() {
        // ความสามารถพื้นฐาน
        this.addCapability('text_processing', {
            execute: async (input) => {
                return `ประมวลผลข้อความ: ${input}`;
            }
        });
        
        this.addCapability('question_answering', {
            execute: async (question) => {
                return `คำตอบสำหรับ: ${question}`;
            }
        });
    }
    
    addCapability(name, capability) {
        this.capabilities.set(name, capability);
    }
    
    async analyzeMessage(message, context) {
        // วิเคราะห์ข้อความ
        return {
            intent: 'general',
            entities: [],
            sentiment: 'neutral',
            confidence: 0.8
        };
    }
    
    async generateResponse(data) {
        // สร้างคำตอบ
        const { message, analysis, memoryData, personalityContext } = data;
        
        // ตัวอย่างการสร้างคำตอบ
        return `สวัสดีครับ! ผมได้รับข้อความ "${message}" แล้ว และพร้อมที่จะช่วยเหลือคุณ`;
    }
}

/**
 * ระบบความจำของ AI
 */
class AIMemorySystem {
    constructor(config) {
        this.config = config;
        this.shortTermMemory = new Map();
        this.longTermMemory = new Map();
        this.workingMemory = new Map();
    }
    
    async initialize() {
        console.log('🧠 เริ่มต้นระบบความจำ...');
    }
    
    async store(data) {
        const id = Date.now().toString();
        this.shortTermMemory.set(id, data);
        return id;
    }
    
    async search(query) {
        // ค้นหาในความจำ
        return [];
    }
    
    getUsage() {
        return {
            shortTerm: this.shortTermMemory.size,
            longTerm: this.longTermMemory.size,
            working: this.workingMemory.size
        };
    }
}

/**
 * ระบบการเรียนรู้ของ AI
 */
class AILearningEngine {
    constructor(config) {
        this.config = config;
        this.learningData = [];
        this.models = new Map();
    }
    
    async initialize() {
        console.log('📚 เริ่มต้นระบบการเรียนรู้...');
    }
    
    start() {
        console.log('🎓 เริ่มระบบการเรียนรู้...');
    }
    
    stop() {
        console.log('⏹️ หยุดระบบการเรียนรู้...');
    }
    
    learn(data) {
        this.learningData.push({
            ...data,
            timestamp: Date.now()
        });
    }
    
    async processFeedback(interactionId, feedback) {
        // ประมวลผล feedback
        console.log(`📝 ประมวลผล feedback สำหรับ ${interactionId}:`, feedback);
    }
}

/**
 * ระบบบุคลิกภาพของ AI
 */
class AIPersonalityEngine {
    constructor(config) {
        this.config = config;
        this.traits = new Map();
    }
    
    async initialize() {
        console.log('🎭 เริ่มต้นระบบบุคลิกภาพ...');
        this.loadPersonalityTraits();
    }
    
    loadPersonalityTraits() {
        // โหลดลักษณะบุคลิกภาพ
        this.traits.set('friendliness', 0.8);
        this.traits.set('helpfulness', 0.9);
        this.traits.set('creativity', 0.7);
    }
    
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    
    getContext() {
        return {
            style: this.config.style,
            language: this.config.language,
            traits: Object.fromEntries(this.traits)
        };
    }
}

/**
 * ระบบปลั๊กอิน
 */
class AIPlugin {
    constructor(name, code) {
        this.name = name;
        this.code = code;
        this.isActive = false;
    }
    
    async initialize() {
        console.log(`🔌 เริ่มต้นปลั๊กอิน: ${this.name}`);
        this.isActive = true;
    }
    
    async execute(input) {
        if (!this.isActive) {
            throw new Error('ปลั๊กอินไม่ได้เปิดใช้งาน');
        }
        
        // ประมวลผลตาม code ที่กำหนด
        return `ผลลัพธ์จากปลั๊กอิน ${this.name}: ${input}`;
    }
}

// ส่งออกคลาสหลัก
module.exports = {
    AIBuilderSystem,
    AIBrain,
    AIMemorySystem,
    AILearningEngine,
    AIPersonalityEngine,
    AIPlugin
};

// ตัวอย่างการใช้งาน
if (require.main === module) {
    async function demo() {
        console.log('🚀 เริ่มต้น AI Builder System Demo...');
        
        // สร้าง AI ใหม่
        const myAI = new AIBuilderSystem({
            name: 'My Custom AI',
            description: 'AI ที่ฉันสร้างเอง',
            personality: {
                style: 'friendly',
                language: 'th',
                expertise: ['programming', 'design']
            }
        });
        
        // เริ่มต้นและรัน
        await myAI.start();
        
        // ทดสอบการทำงาน
        const response = await myAI.processMessage('สวัสดี AI!');
        console.log('🤖 AI ตอบ:', response);
        
        // เพิ่มความสามารถใหม่
        await myAI.addCapability('calculator', {
            execute: async (expression) => {
                try {
                    return eval(expression).toString();
                } catch (error) {
                    return 'ไม่สามารถคำนวณได้';
                }
            }
        });
        
        // ดูสถิติ
        console.log('📊 สถิติ AI:', myAI.getStats());
        
        // หยุดการทำงาน
        setTimeout(async () => {
            await myAI.stop();
            console.log('✅ Demo เสร็จสิ้น');
        }, 5000);
    }
    
    demo().catch(console.error);
}