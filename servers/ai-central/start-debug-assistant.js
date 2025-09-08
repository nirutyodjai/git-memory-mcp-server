#!/usr/bin/env node

/**
 * NEXUS IDE - AI Debugging Assistant Startup Script
 * เริ่มต้น AI Debugging Assistant พร้อมการตั้งค่าที่สมบูรณ์
 * Created: 2025-01-06
 */

const fs = require('fs').promises;
const path = require('path');
const DebugAPI = require('./debug-api');

class DebugAssistantLauncher {
    constructor() {
        this.config = null;
        this.debugAPI = null;
        this.startTime = Date.now();
    }

    async init() {
        try {
            console.log('🚀 เริ่มต้น NEXUS IDE AI Debugging Assistant...');
            
            // โหลด configuration
            await this.loadConfig();
            
            // ตรวจสอบ dependencies
            await this.checkDependencies();
            
            // สร้างโฟลเดอร์ที่จำเป็น
            await this.createDirectories();
            
            // เริ่ม AI Debugging Assistant
            await this.startDebugAssistant();
            
            // ตั้งค่า monitoring
            this.setupMonitoring();
            
            // ตั้งค่า graceful shutdown
            this.setupGracefulShutdown();
            
            console.log('✅ AI Debugging Assistant พร้อมใช้งาน!');
            this.printStartupInfo();
            
        } catch (error) {
            console.error('❌ ไม่สามารถเริ่ม AI Debugging Assistant:', error);
            process.exit(1);
        }
    }

    async loadConfig() {
        try {
            const configPath = path.join(__dirname, 'debug-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
            
            // แทนที่ environment variables
            this.config = this.replaceEnvVariables(this.config);
            
            console.log('📋 โหลด configuration สำเร็จ');
        } catch (error) {
            throw new Error(`ไม่สามารถโหลด configuration: ${error.message}`);
        }
    }

    replaceEnvVariables(obj) {
        if (typeof obj === 'string') {
            return obj.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
                return process.env[envVar] || match;
            });
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceEnvVariables(item));
        } else if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.replaceEnvVariables(value);
            }
            return result;
        }
        return obj;
    }

    async checkDependencies() {
        console.log('🔍 ตรวจสอบ dependencies...');
        
        const requiredModules = [
            'express',
            'cors',
            'ws',
            'child_process'
        ];

        for (const module of requiredModules) {
            try {
                require.resolve(module);
            } catch (error) {
                throw new Error(`Missing required module: ${module}`);
            }
        }

        // ตรวจสอบ debuggers
        await this.checkDebuggers();
        
        console.log('✅ Dependencies ครบถ้วน');
    }

    async checkDebuggers() {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        const debuggers = {
            'node': 'Node.js debugger',
            'python': 'Python debugger',
            'gdb': 'GDB debugger',
            'jdb': 'Java debugger'
        };

        for (const [command, name] of Object.entries(debuggers)) {
            try {
                await execAsync(`${command} --version`);
                console.log(`  ✅ ${name} พร้อมใช้งาน`);
            } catch (error) {
                console.log(`  ⚠️  ${name} ไม่พร้อมใช้งาน (${command})`);
            }
        }
    }

    async createDirectories() {
        const directories = [
            './logs',
            './data',
            './data/snapshots',
            './data/debug-logs',
            './temp'
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // โฟลเดอร์อาจมีอยู่แล้ว
            }
        }
        
        console.log('📁 สร้างโฟลเดอร์ที่จำเป็นแล้ว');
    }

    async startDebugAssistant() {
        const port = this.config.service.port || 3010;
        
        this.debugAPI = new DebugAPI(port);
        await this.debugAPI.start();
        
        console.log(`🐛 AI Debugging Assistant API เริ่มทำงานที่ port ${port}`);
    }

    setupMonitoring() {
        if (!this.config.performance.monitoring.enabled) {
            return;
        }

        const interval = this.config.performance.monitoring.intervalSeconds * 1000;
        
        setInterval(() => {
            this.collectMetrics();
        }, interval);
        
        console.log('📊 เริ่ม performance monitoring');
    }

    collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            uptime: Date.now() - this.startTime,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            pid: process.pid
        };

        // Log metrics (สามารถส่งไป monitoring system ได้)
        if (this.config.logging.level === 'debug') {
            console.log('📊 Metrics:', JSON.stringify(metrics, null, 2));
        }

        // ตรวจสอบ thresholds
        this.checkThresholds(metrics);
    }

    checkThresholds(metrics) {
        const memoryThreshold = this.config.performance.optimization.memoryThresholdMB * 1024 * 1024;
        const cpuThreshold = this.config.performance.optimization.cpuThresholdPercent;

        if (metrics.memory.heapUsed > memoryThreshold) {
            console.warn('⚠️  Memory usage สูง:', Math.round(metrics.memory.heapUsed / 1024 / 1024), 'MB');
            
            if (this.config.performance.optimization.garbageCollection) {
                global.gc && global.gc();
                console.log('🗑️  ทำ garbage collection');
            }
        }
    }

    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 ได้รับสัญญาณ ${signal}, กำลังปิดระบบ...`);
            
            try {
                if (this.debugAPI) {
                    await this.debugAPI.stop();
                }
                
                console.log('✅ ปิดระบบเรียบร้อยแล้ว');
                process.exit(0);
            } catch (error) {
                console.error('❌ เกิดข้อผิดพลาดในการปิดระบบ:', error);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            shutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });
    }

    printStartupInfo() {
        const config = this.config.service;
        const uptime = Date.now() - this.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('🚀 NEXUS IDE - AI Debugging Assistant');
        console.log('='.repeat(60));
        console.log(`📋 Service: ${config.name} v${config.version}`);
        console.log(`🌐 URL: http://${config.host}:${config.port}`);
        console.log(`🔧 Environment: ${config.environment}`);
        console.log(`⏱️  Startup Time: ${uptime}ms`);
        console.log(`🧠 AI Models: ${Object.keys(this.config.ai.models).length}`);
        console.log(`🐛 Supported Languages: ${this.config.debugging.supportedLanguages.length}`);
        console.log(`🔌 WebSocket: ${this.config.websocket.enabled ? 'Enabled' : 'Disabled'}`);
        console.log('='.repeat(60));
        console.log('\n📚 API Endpoints:');
        console.log(`  GET    /health                           - Health check`);
        console.log(`  POST   /debug/sessions                   - Start debug session`);
        console.log(`  GET    /debug/sessions                   - List all sessions`);
        console.log(`  GET    /debug/sessions/:id               - Get session info`);
        console.log(`  DELETE /debug/sessions/:id               - Stop session`);
        console.log(`  POST   /debug/sessions/:id/breakpoints   - Set breakpoint`);
        console.log(`  GET    /debug/sessions/:id/visual        - Visual debugging`);
        console.log(`  POST   /debug/sessions/:id/snapshots     - Create snapshot`);
        console.log(`  POST   /debug/sessions/:id/collaborate    - Start collaboration`);
        console.log(`  POST   /debug/sessions/:id/generate-tests - Generate tests`);
        console.log(`  GET    /debug/stats                      - Get statistics`);
        console.log(`  POST   /debug/analyze                    - Analyze code`);
        console.log('\n🔌 WebSocket Events:');
        console.log(`  sessionStarted, sessionClosed, breakpointSet`);
        console.log(`  aiInsight, snapshotRestored, collaborativeSessionCreated`);
        console.log('\n✨ Ready for debugging!');
        console.log('='.repeat(60) + '\n');
    }

    // === Utility Methods ===
    
    getConfig() {
        return this.config;
    }
    
    getDebugAPI() {
        return this.debugAPI;
    }
    
    getUptime() {
        return Date.now() - this.startTime;
    }
}

// เริ่มต้นระบบ
if (require.main === module) {
    const launcher = new DebugAssistantLauncher();
    launcher.init().catch((error) => {
        console.error('💥 Fatal Error:', error);
        process.exit(1);
    });
}

module.exports = DebugAssistantLauncher;