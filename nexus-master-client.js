/**
 * NEXUS IDE - Master Control Client
 * Client สำหรับเชื่อมต่อและควบคุม NEXUS Master Control System
 * ใช้สำหรับจัดการข้อมูลทั้ง 3000 MCP Servers
 */

const WebSocket = require('ws');
const readline = require('readline');
const { performance } = require('perf_hooks');

class NexusMasterClient {
    constructor(options = {}) {
        this.host = options.host || 'localhost';
        this.port = options.port || 9003;
        this.ws = null;
        this.connected = false;
        this.connectionId = null;
        
        // สถิติการเชื่อมต่อ
        this.stats = {
            messagesReceived: 0,
            messagesSent: 0,
            connectionTime: null,
            lastActivity: null,
            errors: 0
        };
        
        // คิวข้อความ
        this.messageQueue = [];
        this.pendingRequests = new Map();
        
        // การตั้งค่า
        this.config = {
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            requestTimeout: 30000
        };
        
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        
        // สร้าง readline interface สำหรับ CLI
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`🔗 กำลังเชื่อมต่อ NEXUS Master Control ที่ ${this.host}:${this.port}...`);
            
            this.ws = new WebSocket(`ws://${this.host}:${this.port}`);
            
            this.ws.on('open', () => {
                this.connected = true;
                this.stats.connectionTime = new Date();
                this.reconnectAttempts = 0;
                
                console.log('✅ เชื่อมต่อ NEXUS Master Control สำเร็จ!');
                
                // ส่งข้อความที่รออยู่ในคิว
                this.processMessageQueue();
                
                resolve();
            });
            
            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });
            
            this.ws.on('close', () => {
                this.connected = false;
                console.log('🔌 การเชื่อมต่อ NEXUS Master Control ปิด');
                
                if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            });
            
            this.ws.on('error', (error) => {
                this.stats.errors++;
                console.error('❌ ข้อผิดพลาดการเชื่อมต่อ:', error.message);
                
                if (!this.connected) {
                    reject(error);
                }
            });
        });
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            this.stats.messagesReceived++;
            this.stats.lastActivity = new Date();
            
            switch (message.type) {
                case 'master_welcome':
                    this.connectionId = message.data.connectionId;
                    console.log(`🎉 ยินดีต้อนรับ! Connection ID: ${this.connectionId}`);
                    this.displaySystemStats(message.data.systemStats);
                    break;
                    
                case 'get_system_status_response':
                    this.displaySystemStatus(message.data);
                    break;
                    
                case 'perform_health_check_response':
                    this.displayHealthCheck(message.data.health);
                    break;
                    
                case 'get_unified_data_response':
                    this.displayUnifiedData(message.data.overview);
                    break;
                    
                case 'create_backup_response':
                    this.displayBackupResult(message.data);
                    break;
                    
                case 'restart_subsystem_response':
                    this.displayRestartResult(message.data);
                    break;
                    
                case 'health_check_completed':
                    console.log(`\n🏥 Health Check อัปเดต: ${message.data.overall}`);
                    if (message.data.issues.length > 0) {
                        console.log('⚠️  ปัญหาที่พบ:');
                        message.data.issues.forEach(issue => {
                            console.log(`   - ${issue}`);
                        });
                    }
                    break;
                    
                case 'error':
                    console.error('❌ ข้อผิดพลาดจากเซิร์ฟเวอร์:', message.data.message);
                    break;
                    
                default:
                    console.log('📨 ข้อความที่ไม่รู้จัก:', message);
            }
            
            // จัดการ pending requests
            const requestId = message.requestId;
            if (requestId && this.pendingRequests.has(requestId)) {
                const { resolve } = this.pendingRequests.get(requestId);
                this.pendingRequests.delete(requestId);
                resolve(message.data);
            }
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการประมวลผลข้อความ:', error);
            this.stats.errors++;
        }
    }

    async sendMessage(type, payload = {}) {
        const message = {
            type,
            payload,
            timestamp: new Date(),
            requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        if (!this.connected) {
            this.messageQueue.push(message);
            console.log('📤 ข้อความถูกเพิ่มในคิว (ไม่ได้เชื่อมต่อ)');
            return;
        }
        
        return new Promise((resolve, reject) => {
            // เพิ่มใน pending requests
            this.pendingRequests.set(message.requestId, { resolve, reject });
            
            // ตั้ง timeout
            setTimeout(() => {
                if (this.pendingRequests.has(message.requestId)) {
                    this.pendingRequests.delete(message.requestId);
                    reject(new Error('Request timeout'));
                }
            }, this.config.requestTimeout);
            
            // ส่งข้อความ
            this.ws.send(JSON.stringify(message));
            this.stats.messagesSent++;
        });
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
            this.stats.messagesSent++;
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        console.log(`🔄 พยายามเชื่อมต่อใหม่ครั้งที่ ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} ใน ${this.config.reconnectInterval/1000} วินาที...`);
        
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(error => {
                console.error('❌ การเชื่อมต่อใหม่ล้มเหลว:', error.message);
            });
        }, this.config.reconnectInterval);
    }

    // API Methods
    async getSystemStatus() {
        console.log('📊 กำลังดึงสถานะระบบ...');
        return await this.sendMessage('get_system_status');
    }

    async performHealthCheck() {
        console.log('🏥 กำลังตรวจสอบสุขภาพระบบ...');
        return await this.sendMessage('perform_health_check');
    }

    async getUnifiedData() {
        console.log('🌐 กำลังดึงข้อมูลรวม...');
        return await this.sendMessage('get_unified_data');
    }

    async createBackup() {
        console.log('💾 กำลังสร้าง backup...');
        return await this.sendMessage('create_backup');
    }

    async restartSubsystem(subsystem) {
        console.log(`🔄 กำลัง restart ${subsystem}...`);
        return await this.sendMessage('restart_subsystem', { subsystem });
    }

    async getPerformanceMetrics() {
        console.log('📈 กำลังดึงข้อมูล performance...');
        return await this.sendMessage('get_performance_metrics');
    }

    // Display Methods
    displaySystemStats(stats) {
        console.log('\n📊 สถิติระบบ:');
        console.log(`   🖥️  เซิร์ฟเวอร์ทั้งหมด: ${stats.totalServers}`);
        console.log(`   🟢 เซิร์ฟเวอร์ที่ทำงาน: ${stats.activeServers}`);
        console.log(`   🔗 การเชื่อมต่อ: ${stats.totalConnections}`);
        console.log(`   📊 โหนดข้อมูล: ${stats.dataNodes}`);
        console.log(`   📈 การถ่ายโอนข้อมูล: ${stats.dataTransfers}`);
        console.log(`   ❌ ข้อผิดพลาด: ${stats.errors}`);
    }

    displaySystemStatus(status) {
        console.log('\n🖥️  สถานะระบบ NEXUS Master Control:');
        console.log('=' .repeat(50));
        console.log(`📊 ระบบหลัก: ${status.system.status}`);
        console.log(`⏱️  Uptime: ${status.system.uptimeFormatted}`);
        console.log(`🔗 การเชื่อมต่อ: ${status.connections}`);
        console.log(`🔧 กระบวนการ: ${status.processes.join(', ')}`);
        
        console.log('\n🔧 ระบบย่อย:');
        Object.entries(status.subsystems).forEach(([name, status]) => {
            const icon = status === 'running' ? '🟢' : '🔴';
            console.log(`   ${icon} ${name}: ${status}`);
        });
        
        console.log('=' .repeat(50));
    }

    displayHealthCheck(health) {
        console.log('\n🏥 ผลการตรวจสอบสุขภาพระบบ:');
        console.log('=' .repeat(50));
        console.log(`📅 เวลา: ${health.timestamp}`);
        console.log(`🎯 สถานะโดยรวม: ${this.getHealthIcon(health.overall)} ${health.overall}`);
        
        console.log('\n🔧 ระบบย่อย:');
        Object.entries(health.subsystems).forEach(([name, status]) => {
            const icon = this.getHealthIcon(status);
            console.log(`   ${icon} ${name}: ${status}`);
        });
        
        if (health.issues.length > 0) {
            console.log('\n⚠️  ปัญหาที่พบ:');
            health.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        } else {
            console.log('\n✅ ไม่พบปัญหา');
        }
        
        console.log('=' .repeat(50));
    }

    displayUnifiedData(overview) {
        console.log('\n🌐 ภาพรวมข้อมูลรวม:');
        console.log('=' .repeat(50));
        console.log(`🖥️  เซิร์ฟเวอร์ทั้งหมด: ${overview.totalServers}`);
        console.log(`🔗 การเชื่อมต่อที่ทำงาน: ${overview.activeConnections}`);
        console.log(`🕐 Sync ล่าสุด: ${overview.lastSync || 'ไม่มีข้อมูล'}`);
        
        if (overview.dataIntegration) {
            console.log('\n📊 Data Integration:');
            console.log(`   - สถานะ: ${overview.dataIntegration.success ? '✅' : '❌'}`);
        }
        
        if (overview.universalHub) {
            console.log('\n🌐 Universal Hub:');
            console.log(`   - สถานะ: ${overview.universalHub.success ? '✅' : '❌'}`);
        }
        
        console.log('=' .repeat(50));
    }

    displayBackupResult(result) {
        console.log('\n💾 ผลการสร้าง Backup:');
        console.log('=' .repeat(50));
        
        if (result.success) {
            console.log(`✅ สร้าง backup สำเร็จ`);
            console.log(`📁 Backup ID: ${result.backupId}`);
            console.log(`📂 ที่อยู่: ${result.path}`);
            console.log(`📏 ขนาด: ${(result.size / 1024).toFixed(2)} KB`);
        } else {
            console.log(`❌ สร้าง backup ล้มเหลว: ${result.error}`);
        }
        
        console.log('=' .repeat(50));
    }

    displayRestartResult(result) {
        console.log('\n🔄 ผลการ Restart:');
        console.log('=' .repeat(50));
        
        if (result.success) {
            console.log(`✅ ${result.message}`);
            console.log(`🕐 เวลา: ${result.timestamp}`);
        } else {
            console.log(`❌ Restart ล้มเหลว: ${result.error}`);
        }
        
        console.log('=' .repeat(50));
    }

    getHealthIcon(status) {
        switch (status) {
            case 'healthy': return '🟢';
            case 'warning': return '🟡';
            case 'critical': return '🔴';
            case 'unhealthy': return '🔴';
            default: return '⚪';
        }
    }

    // CLI Interface
    async startCLI() {
        console.log('\n🎮 NEXUS Master Control CLI');
        console.log('=' .repeat(50));
        console.log('คำสั่งที่ใช้ได้:');
        console.log('  status     - แสดงสถานะระบบ');
        console.log('  health     - ตรวจสอบสุขภาพระบบ');
        console.log('  data       - แสดงข้อมูลรวม');
        console.log('  backup     - สร้าง backup');
        console.log('  restart    - restart ระบบย่อย');
        console.log('  stats      - แสดงสถิติการเชื่อมต่อ');
        console.log('  help       - แสดงความช่วยเหลือ');
        console.log('  exit       - ออกจากโปรแกรม');
        console.log('=' .repeat(50));
        
        this.promptCommand();
    }

    promptCommand() {
        this.rl.question('\nNEXUS> ', async (input) => {
            const command = input.trim().toLowerCase();
            
            try {
                switch (command) {
                    case 'status':
                        await this.getSystemStatus();
                        break;
                        
                    case 'health':
                        await this.performHealthCheck();
                        break;
                        
                    case 'data':
                        await this.getUnifiedData();
                        break;
                        
                    case 'backup':
                        await this.createBackup();
                        break;
                        
                    case 'restart':
                        await this.handleRestartCommand();
                        break;
                        
                    case 'stats':
                        this.displayConnectionStats();
                        break;
                        
                    case 'help':
                        this.displayHelp();
                        break;
                        
                    case 'exit':
                        await this.disconnect();
                        process.exit(0);
                        break;
                        
                    case '':
                        // ไม่ทำอะไร
                        break;
                        
                    default:
                        console.log(`❌ ไม่รู้จักคำสั่ง: ${command}`);
                        console.log('พิมพ์ "help" เพื่อดูคำสั่งที่ใช้ได้');
                }
            } catch (error) {
                console.error('❌ ข้อผิดพลาดในการประมวลผลคำสั่ง:', error.message);
            }
            
            this.promptCommand();
        });
    }

    async handleRestartCommand() {
        console.log('\nระบบย่อยที่สามารถ restart ได้:');
        console.log('1. universal-hub');
        console.log('2. git-memory');
        console.log('3. data-integration');
        
        this.rl.question('เลือกระบบย่อยที่ต้องการ restart (1-3): ', async (choice) => {
            const subsystems = {
                '1': 'universal-hub',
                '2': 'git-memory',
                '3': 'data-integration'
            };
            
            const subsystem = subsystems[choice];
            if (subsystem) {
                await this.restartSubsystem(subsystem);
            } else {
                console.log('❌ ตัวเลือกไม่ถูกต้อง');
            }
        });
    }

    displayConnectionStats() {
        console.log('\n📊 สถิติการเชื่อมต่อ:');
        console.log('=' .repeat(50));
        console.log(`🔗 Connection ID: ${this.connectionId || 'ไม่มี'}`);
        console.log(`📅 เชื่อมต่อเมื่อ: ${this.stats.connectionTime || 'ไม่มีข้อมูล'}`);
        console.log(`📨 ข้อความที่ส่ง: ${this.stats.messagesSent}`);
        console.log(`📬 ข้อความที่รับ: ${this.stats.messagesReceived}`);
        console.log(`🕐 กิจกรรมล่าสุด: ${this.stats.lastActivity || 'ไม่มีข้อมูล'}`);
        console.log(`❌ ข้อผิดพลาด: ${this.stats.errors}`);
        console.log(`🔄 ความพยายามเชื่อมต่อใหม่: ${this.reconnectAttempts}`);
        console.log('=' .repeat(50));
    }

    displayHelp() {
        console.log('\n📖 คำสั่งที่ใช้ได้:');
        console.log('=' .repeat(50));
        console.log('status     - แสดงสถานะระบบทั้งหมด');
        console.log('health     - ตรวจสอบสุขภาพระบบและระบบย่อย');
        console.log('data       - แสดงภาพรวมข้อมูลรวมจาก MCP Servers');
        console.log('backup     - สร้าง backup ข้อมูลระบบ');
        console.log('restart    - restart ระบบย่อยที่เลือก');
        console.log('stats      - แสดงสถิติการเชื่อมต่อ');
        console.log('help       - แสดงความช่วยเหลือนี้');
        console.log('exit       - ออกจากโปรแกรม');
        console.log('=' .repeat(50));
    }

    async disconnect() {
        console.log('🔌 กำลังปิดการเชื่อมต่อ...');
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.rl.close();
        
        console.log('✅ ปิดการเชื่อมต่อเรียบร้อย');
    }
}

// Export สำหรับใช้งานจากไฟล์อื่น
module.exports = NexusMasterClient;

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
    const client = new NexusMasterClient();
    
    // จัดการ command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    async function main() {
        try {
            await client.connect();
            
            if (command) {
                // รันคำสั่งเดียวแล้วออก
                switch (command) {
                    case 'status':
                        await client.getSystemStatus();
                        break;
                    case 'health':
                        await client.performHealthCheck();
                        break;
                    case 'data':
                        await client.getUnifiedData();
                        break;
                    case 'backup':
                        await client.createBackup();
                        break;
                    default:
                        console.log(`❌ ไม่รู้จักคำสั่ง: ${command}`);
                }
                
                setTimeout(() => {
                    client.disconnect();
                    process.exit(0);
                }, 2000);
                
            } else {
                // เริ่ม CLI mode
                await client.startCLI();
            }
            
        } catch (error) {
            console.error('❌ ไม่สามารถเชื่อมต่อ NEXUS Master Control:', error.message);
            process.exit(1);
        }
    }
    
    // จัดการ graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 กำลังปิดโปรแกรม...');
        await client.disconnect();
        process.exit(0);
    });
    
    main();
}