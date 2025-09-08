/**
 * NEXUS IDE - Universal Data Client
 * Client สำหรับเชื่อมต่อกับ Universal Data Hub
 * ใช้สำหรับแชร์ข้อมูลระหว่าง MCP Servers ทั้ง 3000 ตัว
 */

const WebSocket = require('ws');
const readline = require('readline');

class UniversalDataClient {
    constructor(serverUrl = 'ws://localhost:9001') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.isConnected = false;
        this.connectionId = null;
        this.messageHandlers = new Map();
        
        this.setupMessageHandlers();
    }

    setupMessageHandlers() {
        this.messageHandlers.set('welcome', (data) => {
            this.connectionId = data.connectionId;
            console.log(`🎉 เชื่อมต่อสำเร็จ! Connection ID: ${this.connectionId}`);
            console.log(`📊 MCP Servers ทั้งหมด: ${data.totalServers} ตัว`);
            console.log(`💾 ข้อมูลทั้งหมด: ${data.dataEntries} รายการ`);
        });
        
        this.messageHandlers.set('data_response', (data) => {
            console.log(`\n📋 ข้อมูลสำหรับ key: ${data.key}`);
            if (data.result) {
                console.log(`📄 Value: ${JSON.stringify(data.result.value, null, 2)}`);
                console.log(`🖥️  Server ID: ${data.result.serverId || 'N/A'}`);
                console.log(`⏰ Timestamp: ${data.result.timestamp}`);
                console.log(`🔄 Synced Servers: ${data.result.syncedServers.length} ตัว`);
            } else {
                console.log('❌ ไม่พบข้อมูล');
            }
        });
        
        this.messageHandlers.set('data_updated', (data) => {
            console.log(`\n🔔 ข้อมูลอัปเดต: ${data.key}`);
            console.log(`📄 Value: ${JSON.stringify(data.value).substring(0, 100)}...`);
            console.log(`🖥️  Server: ${data.serverId || 'Central'}`);
        });
        
        this.messageHandlers.set('sync_completed', (data) => {
            console.log(`\n✅ การ Sync เสร็จสิ้น!`);
            console.log(`⏱️  ใช้เวลา: ${data.duration.toFixed(2)}ms`);
            console.log(`🖥️  Servers: ${data.totalServers} ตัว`);
            console.log(`💾 ข้อมูล: ${data.dataEntries} รายการ`);
        });
        
        this.messageHandlers.set('stats_response', (data) => {
            console.log('\n📊 สถิติ Universal Data Hub:');
            console.log(`🖥️  Total Servers: ${data.totalServers}`);
            console.log(`🔗 Active Connections: ${data.activeConnections}`);
            console.log(`💾 Data Entries: ${data.dataEntries}`);
            console.log(`🔄 Sync Operations: ${data.syncOperations}`);
            console.log(`⏰ Last Sync: ${data.lastSync || 'ยังไม่เคย'}`);
            console.log(`📈 Uptime: ${Math.floor(data.uptime)} วินาที`);
            console.log('\n📋 Servers by Type:');
            console.log(`   🤖 AI/ML: ${data.serversByType['AI/ML']} ตัว`);
            console.log(`   🏢 Enterprise: ${data.serversByType['Enterprise']} ตัว`);
            console.log(`   ⚡ Specialized: ${data.serversByType['Specialized']} ตัว`);
            console.log(`\n⏳ Queue Size: ${data.queueSize}`);
            console.log(`🔄 Processing: ${data.isProcessing ? 'ใช่' : 'ไม่'}`);
        });
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`🔗 กำลังเชื่อมต่อไปยัง ${this.serverUrl}...`);
            
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.on('open', () => {
                this.isConnected = true;
                console.log('✅ เชื่อมต่อสำเร็จ!');
                resolve();
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ ข้อผิดพลาดในการประมวลผลข้อความ:', error);
                }
            });
            
            this.ws.on('close', () => {
                this.isConnected = false;
                console.log('🔌 การเชื่อมต่อปิด');
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ ข้อผิดพลาดในการเชื่อมต่อ:', error);
                reject(error);
            });
        });
    }

    handleMessage(message) {
        const { type, data } = message;
        const handler = this.messageHandlers.get(type);
        
        if (handler) {
            handler(data);
        } else {
            console.log(`📨 ข้อความที่ไม่รู้จัก: ${type}`, data);
        }
    }

    sendMessage(type, data) {
        if (!this.isConnected) {
            console.error('❌ ไม่ได้เชื่อมต่อกับเซิร์ฟเวอร์');
            return;
        }
        
        const message = { type, data };
        this.ws.send(JSON.stringify(message));
    }

    // API Methods
    setData(key, value, serverId = null) {
        console.log(`📝 กำลังบันทึกข้อมูล: ${key}`);
        this.sendMessage('set_data', { key, value, serverId });
    }

    getData(key) {
        console.log(`📖 กำลังดึงข้อมูล: ${key}`);
        this.sendMessage('get_data', { key });
    }

    syncAll() {
        console.log('🔄 กำลังขอ sync ข้อมูลทั้งหมด...');
        this.sendMessage('sync_request', {});
    }

    getStats() {
        console.log('📊 กำลังดึงสถิติ...');
        this.sendMessage('get_stats', {});
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// CLI Interface
class UniversalDataCLI {
    constructor() {
        this.client = new UniversalDataClient();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🌐 NEXUS IDE - Universal Data Client');
        console.log('🔗 เชื่อมต่อกับ Universal Data Hub\n');
        
        try {
            await this.client.connect();
            this.showHelp();
            this.startCLI();
        } catch (error) {
            console.error('❌ ไม่สามารถเชื่อมต่อได้:', error.message);
            process.exit(1);
        }
    }

    showHelp() {
        console.log('\n📋 คำสั่งที่ใช้ได้:');
        console.log('  set <key> <value> [serverId]  - บันทึกข้อมูล');
        console.log('  get <key>                     - ดึงข้อมูล');
        console.log('  sync                          - sync ข้อมูลทั้งหมด');
        console.log('  stats                         - แสดงสถิติ');
        console.log('  help                          - แสดงความช่วยเหลือ');
        console.log('  exit                          - ออกจากโปรแกรม');
        console.log('');
    }

    startCLI() {
        this.rl.prompt();
        
        this.rl.on('line', (input) => {
            const args = input.trim().split(' ');
            const command = args[0].toLowerCase();
            
            switch (command) {
                case 'set':
                    if (args.length >= 3) {
                        const key = args[1];
                        const value = args.slice(2, args.length - (args.length > 3 && args[args.length - 1].startsWith('ai-') || args[args.length - 1].startsWith('enterprise-') || args[args.length - 1].startsWith('specialized-') ? 1 : 0)).join(' ');
                        const serverId = args.length > 3 && (args[args.length - 1].startsWith('ai-') || args[args.length - 1].startsWith('enterprise-') || args[args.length - 1].startsWith('specialized-')) ? args[args.length - 1] : null;
                        
                        try {
                            const parsedValue = JSON.parse(value);
                            this.client.setData(key, parsedValue, serverId);
                        } catch {
                            this.client.setData(key, value, serverId);
                        }
                    } else {
                        console.log('❌ รูปแบบ: set <key> <value> [serverId]');
                    }
                    break;
                    
                case 'get':
                    if (args.length >= 2) {
                        this.client.getData(args[1]);
                    } else {
                        console.log('❌ รูปแบบ: get <key>');
                    }
                    break;
                    
                case 'sync':
                    this.client.syncAll();
                    break;
                    
                case 'stats':
                    this.client.getStats();
                    break;
                    
                case 'help':
                    this.showHelp();
                    break;
                    
                case 'exit':
                    console.log('👋 ลาก่อน!');
                    this.client.disconnect();
                    process.exit(0);
                    break;
                    
                default:
                    if (command) {
                        console.log(`❌ ไม่รู้จักคำสั่ง: ${command}`);
                        console.log('💡 พิมพ์ "help" เพื่อดูคำสั่งที่ใช้ได้');
                    }
            }
            
            this.rl.prompt();
        });
        
        this.rl.on('close', () => {
            console.log('\n👋 ลาก่อน!');
            this.client.disconnect();
            process.exit(0);
        });
    }
}

// Export สำหรับใช้งานจากไฟล์อื่น
module.exports = { UniversalDataClient, UniversalDataCLI };

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
    const cli = new UniversalDataCLI();
    cli.start();
}