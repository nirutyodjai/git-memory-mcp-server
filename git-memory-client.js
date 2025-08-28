#!/usr/bin/env node

/**
 * Git Memory Client - ตัวเชื่อมต่อสำหรับการใช้งาน Git Memory Coordinator
 * รองรับการแชร์ข้อมูลระหว่าง MCP Servers ผ่าน HTTP API
 */

const http = require('http');
const https = require('https');

class GitMemoryClient {
    constructor(coordinatorHost = 'localhost', coordinatorPort = 9000) {
        this.coordinatorHost = coordinatorHost;
        this.coordinatorPort = coordinatorPort;
        this.baseUrl = `http://${coordinatorHost}:${coordinatorPort}`;
    }
    
    /**
     * ตั้งค่าข้อมูลในหน่วยความจำ
     * @param {string} key - คีย์สำหรับเก็บข้อมูล
     * @param {any} value - ค่าที่ต้องการเก็บ
     * @param {boolean} persist - บันทึกลง Git หรือไม่ (default: false)
     * @param {boolean} isPrivate - เข้ารหัสข้อมูลหรือไม่ (default: false)
     * @param {string} password - รหัสผ่านสำหรับเข้ารหัส (ถ้า isPrivate = true)
     */
    async setMemory(key, value, persist = false, isPrivate = false, password = null) {
        const requestBody = { key, value, persist };
        
        if (isPrivate) {
            requestBody.private = true;
            requestBody.password = password;
        }
        
        const data = JSON.stringify(requestBody);
        
        return new Promise((resolve, reject) => {
            const req = http.request(`${this.baseUrl}/memory/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode === 200) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }
    
    /**
     * ดึงข้อมูลจากหน่วยความจำ
     * @param {string} key - คีย์ของข้อมูลที่ต้องการ
     * @param {string} password - รหัสผ่านสำหรับข้อมูลส่วนตัว (optional)
     */
    async getMemory(key, password = null) {
        return new Promise((resolve, reject) => {
            let url = `${this.baseUrl}/memory/get?key=${encodeURIComponent(key)}`;
            if (password) {
                url += `&password=${encodeURIComponent(password)}`;
            }
            
            const req = http.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode === 200) {
                            resolve(result);
                        } else if (res.statusCode === 404) {
                            resolve(null); // Key not found
                        } else {
                            reject(new Error(result.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
        });
    }
    
    /**
     * ซิงค์ข้อมูลจาก Git
     */
    async syncMemory() {
        return new Promise((resolve, reject) => {
            const req = http.request(`${this.baseUrl}/memory/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode === 200) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.end();
        });
    }
    
    /**
     * ดึงสถานะของ Coordinator
     */
    async getStatus() {
        return new Promise((resolve, reject) => {
            const req = http.get(`${this.baseUrl}/status`, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode === 200) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
        });
    }
    
    /**
     * ดึงรายการ servers
     */
    async getServers() {
        return new Promise((resolve, reject) => {
            const req = http.get(`${this.baseUrl}/servers`, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode === 200) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
        });
    }
    
    /**
     * ตรวจสอบการเชื่อมต่อ
     */
    async ping() {
        try {
            const status = await this.getStatus();
            return status.coordinator.status === 'running';
        } catch (error) {
            return false;
        }
    }
}

// ฟังก์ชันสำหรับการใช้งานผ่าน Command Line
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
        console.log('🔧 Git Memory Client - การใช้งาน:');
        console.log('  node git-memory-client.js status          - ดูสถานะ coordinator');
        console.log('  node git-memory-client.js servers         - ดูรายการ servers');
        console.log('  node git-memory-client.js set <key> <value> [persist] [private] [password] - ตั้งค่าข้อมูล');
        console.log('  node git-memory-client.js get <key> [password] - ดึงข้อมูล');
        console.log('  node git-memory-client.js sync            - ซิงค์ข้อมูลจาก Git');
        console.log('  node git-memory-client.js broadcast <key> <value> [password] - ส่งข้อมูลแบบ broadcast');
        console.log('  node git-memory-client.js notify <message> [server1] [server2] - ส่งการแจ้งเตือน');
        console.log('  node git-memory-client.js subscribe <key> [webhook_url] - สมัครรับการอัปเดต');
        console.log('  node git-memory-client.js watch <key> [password] - เฝ้าดูการเปลี่ยนแปลงแบบ real-time');
        console.log('  node git-memory-client.js ping            - ตรวจสอบการเชื่อมต่อ');
        console.log('');
        console.log('ตัวอย่างพื้นฐาน:');
        console.log('  node git-memory-client.js set "user_config" "{\"theme\":\"dark\"}" true');
        console.log('  node git-memory-client.js set "secret" "mydata" true private mypassword');
        console.log('  node git-memory-client.js get "user_config"');
        console.log('  node git-memory-client.js get "secret" mypassword');
        console.log('');
        console.log('📢 ตัวอย่างการส่งข้อมูล:');
        console.log('  node git-memory-client.js broadcast "team_update" "New feature deployed"');
        console.log('  node git-memory-client.js notify "System maintenance" gen-001 gen-002');
        console.log('  node git-memory-client.js subscribe "team_updates" "http://localhost:3000/webhook"');
        console.log('  node git-memory-client.js watch "shared_config" mypassword');
        console.log('');
        console.log('🔒 ข้อมูลส่วนตัว:');
        console.log('  - ใช้ "private" และระบุรหัสผ่านเพื่อเข้ารหัสข้อมูล');
        console.log('  - Servers ที่ใช้รหัสผ่านเดียวกันสามารถแชร์ข้อมูลได้');
        console.log('  - ข้อมูลจะถูกเข้ารหัสก่อนบันทึกลง Git');
        console.log('');
        console.log('🚀 ฟีเจอร์ใหม่:');
        console.log('  - Broadcast: ส่งข้อมูลไปยัง servers ทั้งหมด');
        console.log('  - Notification: ส่งการแจ้งเตือนไปยัง servers ที่ระบุ');
        console.log('  - Subscription: สมัครรับการอัปเดตและ webhook');
        console.log('  - Watch: เฝ้าดูการเปลี่ยนแปลงแบบ real-time');
        return;
    }
    
    const client = new GitMemoryClient();
    
    try {
        switch (command) {
            case 'status':
                const status = await client.getStatus();
                console.log('📊 สถานะ Git Memory Coordinator:');
                console.log('=' .repeat(50));
                console.log(`🚀 Coordinator: ${status.coordinator.status}`);
                console.log(`🔌 Port: ${status.coordinator.port}`);
                console.log(`⏱️  Uptime: ${Math.floor(status.coordinator.uptime)} วินาที`);
                console.log(`💾 Memory Usage: ${Math.round(status.coordinator.memory.rss / 1024 / 1024)} MB`);
                console.log('');
                console.log(`📡 Servers: ${status.servers.active}/${status.servers.total} กำลังทำงาน`);
                console.log(`🗄️  Memory Store: ${status.memory.storeSize} รายการ`);
                console.log(`📁 Git Path: ${status.memory.gitPath}`);
                break;
                
            case 'servers':
                const servers = await client.getServers();
                console.log('📡 รายการ MCP Servers:');
                console.log('=' .repeat(50));
                console.log(`📊 สรุป: ${servers.summary.active}/${servers.summary.total} servers กำลังทำงาน`);
                console.log('');
                
                const activeServers = servers.servers.filter(s => s.status === 'active');
                const inactiveServers = servers.servers.filter(s => s.status === 'inactive');
                
                if (activeServers.length > 0) {
                    console.log('✅ Servers ที่กำลังทำงาน:');
                    activeServers.slice(0, 10).forEach(server => {
                        console.log(`  ${server.name} - Health: ${server.healthPort}, MCP: ${server.mcpPort}`);
                    });
                    if (activeServers.length > 10) {
                        console.log(`  ... และอีก ${activeServers.length - 10} servers`);
                    }
                }
                
                if (inactiveServers.length > 0) {
                    console.log('');
                    console.log(`❌ Servers ที่ไม่ทำงาน: ${inactiveServers.length} servers`);
                }
                break;
                
            case 'set':
                const key = args[1];
                const value = args[2];
                const persist = args[3] === 'true';
                const isPrivate = args[4] === 'private';
                const password = args[5];
                
                if (!key || !value) {
                    console.error('❌ ต้องระบุ key และ value');
                    process.exit(1);
                }
                
                if (isPrivate && !password) {
                    console.error('❌ ต้องระบุรหัสผ่านสำหรับข้อมูลส่วนตัว');
                    process.exit(1);
                }
                
                let parsedValue;
                try {
                    parsedValue = JSON.parse(value);
                } catch {
                    parsedValue = value; // ใช้เป็น string ถ้า parse ไม่ได้
                }
                
                const setResult = await client.setMemory(key, parsedValue, persist, isPrivate, password);
                console.log(`✅ บันทึกข้อมูล: ${key}`);
                console.log(`📝 Persistent: ${setResult.persisted ? 'ใช่' : 'ไม่'}`);
                console.log(`🔒 Private: ${isPrivate ? 'ใช่' : 'ไม่'}`);
                if (isPrivate) {
                    console.log(`💡 หมายเหตุ: Servers ที่ใช้รหัสผ่านเดียวกันสามารถแชร์ข้อมูลนี้ได้`);
                }
                break;
                
            case 'get':
                const getKey = args[1];
                const getPassword = args[2];
                
                if (!getKey) {
                    console.error('❌ ต้องระบุ key');
                    process.exit(1);
                }
                
                const getResult = await client.getMemory(getKey, getPassword);
                if (getResult) {
                    console.log(`📄 ข้อมูล: ${getKey}`);
                    console.log('=' .repeat(30));
                    console.log('Value:', JSON.stringify(getResult.value, null, 2));
                    console.log(`Timestamp: ${getResult.timestamp}`);
                    console.log(`Persistent: ${getResult.persist ? 'ใช่' : 'ไม่'}`);
                    console.log(`Private: ${getResult.private ? 'ใช่' : 'ไม่'}`);
                    if (getResult.private) {
                        console.log(`💡 หมายเหตุ: นี่คือข้อมูลส่วนตัวที่ถอดรหัสแล้ว`);
                    }
                } else {
                    console.log(`❌ ไม่พบข้อมูล: ${getKey}`);
                }
                break;
                
            case 'sync':
                const syncResult = await client.syncMemory();
                console.log(`🔄 ${syncResult.message}`);
                console.log(`📊 Memory Store: ${syncResult.storeSize} รายการ`);
                break;
                
            case 'broadcast':
                const broadcastKey = args[1];
                const broadcastValue = args[2];
                const broadcastPassword = args[3];
                
                if (!broadcastKey || !broadcastValue) {
                    console.log('❌ Usage: broadcast <key> <value> [password]');
                    console.log('   Example: broadcast "team_update" "New feature deployed" team2024');
                    process.exit(1);
                }
                
                await broadcastUpdate(client, broadcastKey, broadcastValue, broadcastPassword);
                break;
                
            case 'notify':
                const notifyMessage = args[1];
                const notifyServers = args.slice(2);
                
                if (!notifyMessage) {
                    console.log('❌ Usage: notify <message> [server1] [server2] ...');
                    console.log('   Example: notify "System maintenance in 5 minutes" gen-001 gen-002');
                    process.exit(1);
                }
                
                await sendNotification(client, notifyMessage, notifyServers);
                break;
                
            case 'subscribe':
                const subscribeKey = args[1];
                const webhookUrl = args[2];
                
                if (!subscribeKey) {
                    console.log('❌ Usage: subscribe <key> [webhook_url]');
                    console.log('   Example: subscribe "team_updates" "http://localhost:3000/webhook"');
                    process.exit(1);
                }
                
                await subscribeToUpdates(client, subscribeKey, webhookUrl);
                break;
                
            case 'watch':
                const watchKey = args[1];
                const watchPassword = args[2];
                
                if (!watchKey) {
                    console.log('❌ Usage: watch <key> [password]');
                    console.log('   Example: watch "shared_config" mypassword');
                    process.exit(1);
                }
                
                await watchForChanges(client, watchKey, watchPassword);
                break;
                
            case 'ping':
                const isOnline = await client.ping();
                console.log(`🔌 Coordinator: ${isOnline ? '✅ เชื่อมต่อได้' : '❌ เชื่อมต่อไม่ได้'}`);
                break;
                
            case 'help':
            case '--help':
            case '-h':
                showHelp();
                break;
                
            default:
                console.error(`❌ คำสั่งไม่รู้จัก: ${command}`);
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        process.exit(1);
    }
}

// ฟังก์ชันส่งข้อมูลแบบ broadcast ไปยัง servers ทั้งหมด
async function broadcastUpdate(client, key, value, password = null) {
    try {
        const broadcastData = {
            type: 'broadcast',
            originalKey: key,
            message: value,
            timestamp: new Date().toISOString(),
            sender: process.env.SERVER_ID || 'unknown'
        };
        
        const result = await client.setMemory(
            `broadcast_${Date.now()}`,
            broadcastData,
            true, // persist
            !!password, // isPrivate
            password
        );
        
        console.log(`📢 ส่ง Broadcast สำเร็จ: ${key}`);
        console.log(`📝 ข้อความ: ${value}`);
        console.log(`🔒 Private: ${password ? 'ใช่' : 'ไม่'}`);
        console.log(`⏰ เวลา: ${new Date().toLocaleString('th-TH')}`);
    } catch (error) {
        console.log(`❌ ไม่สามารถส่ง Broadcast: ${error.message}`);
    }
}

// ฟังก์ชันส่งการแจ้งเตือนไปยัง servers ที่ระบุ
async function sendNotification(client, message, targetServers = []) {
    try {
        const notificationData = {
            type: 'notification',
            message,
            targets: targetServers.length > 0 ? targetServers : ['all'],
            timestamp: new Date().toISOString(),
            sender: process.env.SERVER_ID || 'unknown',
            priority: 'normal'
        };
        
        const result = await client.setMemory(
            `notification_${Date.now()}`,
            notificationData,
            true // persist
        );
        
        console.log(`🔔 ส่งการแจ้งเตือนสำเร็จ`);
        console.log(`📝 ข้อความ: ${message}`);
        console.log(`🎯 เป้าหมาย: ${targetServers.length > 0 ? targetServers.join(', ') : 'ทุก servers'}`);
        console.log(`⏰ เวลา: ${new Date().toLocaleString('th-TH')}`);
    } catch (error) {
        console.log(`❌ ไม่สามารถส่งการแจ้งเตือน: ${error.message}`);
    }
}

// ฟังก์ชันสมัครรับการอัปเดต
async function subscribeToUpdates(client, key, webhookUrl = null) {
    try {
        const subscriptionData = {
            type: 'subscription',
            subscribedKey: key,
            subscriber: process.env.SERVER_ID || 'unknown',
            webhookUrl,
            timestamp: new Date().toISOString(),
            active: true
        };
        
        const result = await client.setMemory(
            `subscription_${process.env.SERVER_ID || 'unknown'}_${key}`,
            subscriptionData,
            true // persist
        );
        
        console.log(`📬 สมัครรับการอัปเดตสำเร็จ`);
        console.log(`🔑 Key: ${key}`);
        console.log(`🌐 Webhook: ${webhookUrl || 'ไม่ระบุ'}`);
        console.log(`⏰ เวลา: ${new Date().toLocaleString('th-TH')}`);
    } catch (error) {
        console.log(`❌ ไม่สามารถสมัครรับการอัปเดต: ${error.message}`);
    }
}

// ฟังก์ชันเฝ้าดูการเปลี่ยนแปลงแบบ real-time
async function watchForChanges(client, key, password = null) {
    console.log(`👀 เริ่มเฝ้าดูการเปลี่ยนแปลง: ${key}`);
    console.log(`🔄 กด Ctrl+C เพื่อหยุด`);
    
    let lastValue = null;
    let lastTimestamp = null;
    
    const checkForChanges = async () => {
        try {
            const result = await client.getMemory(key, password);
            
            if (result && lastTimestamp !== result.timestamp) {
                if (lastValue !== null) {
                    console.log(`\n🔄 ตรวจพบการเปลี่ยนแปลง!`);
                    console.log(`⏰ เวลา: ${new Date(result.timestamp).toLocaleString('th-TH')}`);
                    console.log(`📝 ค่าใหม่: ${JSON.stringify(result.value, null, 2)}`);
                }
                
                lastValue = result.value;
                lastTimestamp = result.timestamp;
            }
        } catch (error) {
            console.log(`⚠️ Error checking for changes: ${error.message}`);
        }
    };
    
    // เช็คทุก 2 วินาที
    const interval = setInterval(checkForChanges, 2000);
    
    // เช็คครั้งแรก
    await checkForChanges();
    
    // จัดการ Ctrl+C
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(`\n👋 หยุดเฝ้าดูการเปลี่ยนแปลง: ${key}`);
        process.exit(0);
    });
}

// ฟังก์ชันแสดงคำแนะนำการใช้งาน
function showHelp() {
    console.log(`
🚀 Git Memory MCP Server - CLI Help
`);
    console.log(`📖 การใช้งานพื้นฐาน:`);
    console.log(`  git-memory set <key> <value> [persistent] [private] [password]`);
    console.log(`  git-memory get <key> [password]`);
    console.log(`  git-memory list`);
    console.log(`  git-memory status`);
    console.log(`  git-memory sync\n`);
    
    console.log(`📡 การสื่อสารขั้นสูง:`);
    console.log(`  git-memory broadcast <key> <value> [priority]`);
    console.log(`  git-memory notify <serverId> <message> [priority]`);
    console.log(`  git-memory subscribe <webhookUrl>`);
    console.log(`  git-memory watch <pattern>\n`);
    
    console.log(`💡 ตัวอย่างการใช้งาน:`);
    console.log(`  # บันทึกข้อมูลถาวร`);
    console.log(`  git-memory set "user_config" '{"theme":"dark"}' true\n`);
    
    console.log(`  # บันทึกข้อมูลส่วนตัวที่เข้ารหัส`);
    console.log(`  git-memory set "api_key" "secret123" true private "mypassword"\n`);
    
    console.log(`  # ดึงข้อมูลส่วนตัว`);
    console.log(`  git-memory get "api_key" "mypassword"\n`);
    
    console.log(`  # ส่งการแจ้งเตือนแบบ broadcast`);
    console.log(`  git-memory broadcast "system_update" "v2.0.0" "high"\n`);
    
    console.log(`  # สมัครรับการแจ้งเตือนผ่าน webhook`);
    console.log(`  git-memory subscribe "http://localhost:3000/webhook"\n`);
    
    console.log(`🔧 ตัวเลือกเพิ่มเติม:`);
    console.log(`  --help, -h     แสดงคำแนะนำนี้`);
    console.log(`  --version, -v  แสดงเวอร์ชัน\n`);
    
    console.log(`🌐 Git Memory Coordinator จะทำงานที่ http://localhost:9000`);
    console.log(`📚 เอกสารเพิ่มเติม: https://github.com/git-memory/git-memory-mcp-server\n`);
}

// รันเมื่อเรียกใช้โดยตรง
if (require.main === module) {
    main();
}

module.exports = GitMemoryClient;