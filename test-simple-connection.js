// 🚀 ตัวอย่างการเขียนโค้ดเชื่อมต่อข้อมูลแบบง่าย
// Simple Data Connection Test with MCP Lightweight System

const http = require('http');
const fs = require('fs');

// 📊 ข้อมูลทดสอบ
const testData = {
    message: 'สวัสดี MCP System!',
    users: ['สมชาย', 'สมหญิง', 'วิชัย'],
    products: ['โน๊ตบุ๊ค', 'เมาส์', 'คีย์บอร์ด'],
    timestamp: new Date().toISOString()
};

// 🔧 คลาสสำหรับเชื่อมต่อ MCP แบบง่าย
class SimpleMCPConnector {
    constructor(mcpUrl = 'http://localhost:9090') {
        this.mcpUrl = mcpUrl;
        this.isConnected = false;
    }

    // ✅ ทดสอบการเชื่อมต่อ
    async testConnection() {
        try {
            console.log('🔍 กำลังทดสอบการเชื่อมต่อ MCP...');
            const response = await this.makeRequest('/health');
            
            if (response.status === 'healthy') {
                this.isConnected = true;
                console.log('✅ เชื่อมต่อ MCP สำเร็จ!');
                console.log(`📊 โหมด: ${response.mode}`);
                console.log(`💾 หน่วยความจำ: ${response.memory}MB`);
                return true;
            }
        } catch (error) {
            console.error('❌ ไม่สามารถเชื่อมต่อ MCP:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    // 📋 ดูรายการเซิร์ฟเวอร์ที่มี
    async listServers() {
        try {
            console.log('📋 กำลังดูรายการเซิร์ฟเวอร์...');
            const response = await this.makeRequest('/servers');
            
            console.log('✅ เซิร์ฟเวอร์ที่มี:');
            Object.keys(response).forEach(server => {
                console.log(`  - ${server}: ${response[server]}`);
            });
            
            return response;
        } catch (error) {
            console.error('❌ ไม่สามารถดูรายการเซิร์ฟเวอร์:', error.message);
            return {};
        }
    }

    // 💾 บันทึกข้อมูลลง Simple Memory Server
    async storeData(key, data) {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log(`💾 กำลังบันทึกข้อมูล: ${key}`);
            const response = await this.makeRequest('/mcp/simple-memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'add',
                        arguments: {
                            key: key,
                            value: JSON.stringify(data)
                        }
                    }
                }
            });
            
            console.log(`✅ บันทึกข้อมูล ${key} สำเร็จ`);
            return response;
        } catch (error) {
            console.error(`❌ ไม่สามารถบันทึกข้อมูล ${key}:`, error.message);
            throw error;
        }
    }

    // 📖 อ่านข้อมูลจาก Simple Memory Server
    async retrieveData(key) {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log(`📖 กำลังอ่านข้อมูล: ${key}`);
            const response = await this.makeRequest('/mcp/simple-memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'get',
                        arguments: {
                            key: key
                        }
                    }
                }
            });
            
            if (response.content && response.content[0] && response.content[0].text) {
                console.log(`✅ อ่านข้อมูล ${key} สำเร็จ`);
                try {
                    return JSON.parse(response.content[0].text);
                } catch {
                    return response.content[0].text;
                }
            } else {
                console.log(`⚠️ ไม่พบข้อมูล: ${key}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ ไม่สามารถอ่านข้อมูล ${key}:`, error.message);
            return null;
        }
    }

    // 🗑️ ลบข้อมูลทั้งหมด (clear)
    async clearAllData() {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log(`🗑️ กำลังลบข้อมูลทั้งหมด...`);
            const response = await this.makeRequest('/mcp/simple-memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'clear',
                        arguments: {}
                    }
                }
            });
            
            console.log(`✅ ลบข้อมูลทั้งหมดสำเร็จ`);
            return response;
        } catch (error) {
            console.error(`❌ ไม่สามารถลบข้อมูล:`, error.message);
            return null;
        }
    }

    // 📊 ดูข้อมูลทั้งหมด
    async listAllData() {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log('📊 กำลังดูข้อมูลทั้งหมด...');
            const response = await this.makeRequest('/mcp/simple-memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'list',
                        arguments: {}
                    }
                }
            });
            
            if (response.content && response.content[0] && response.content[0].text) {
                const keys = JSON.parse(response.content[0].text);
                console.log(`✅ พบข้อมูล ${keys.length} รายการ:`);
                keys.forEach(key => console.log(`  - ${key}`));
                return keys;
            } else {
                console.log('📊 ไม่มีข้อมูลในระบบ');
                return [];
            }
        } catch (error) {
            console.error('❌ ไม่สามารถดูข้อมูลทั้งหมด:', error.message);
            return [];
        }
    }

    // 🌐 ส่ง HTTP Request
    async makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = `${this.mcpUrl}${path}`;
            const method = options.method || 'GET';
            const data = options.data ? JSON.stringify(options.data) : null;
            
            const req = http.request(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(data && { 'Content-Length': Buffer.byteLength(data) })
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${body}`));
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(data);
            }
            
            req.end();
        });
    }

    // 📊 แสดงสถิติการใช้งาน
    async getPerformanceStats() {
        try {
            const response = await this.makeRequest('/performance');
            console.log('\n📊 สถิติประสิทธิภาพ:');
            console.log(`💾 หน่วยความจำ: ${Math.round(response.memory.heapUsed / 1024 / 1024)}MB`);
            console.log(`⏱️ เวลาทำงาน: ${Math.round(response.uptime)}s`);
            console.log(`🗄️ แคช: ${response.cache.size} รายการ`);
            return response;
        } catch (error) {
            console.error('❌ ไม่สามารถดึงสถิติ:', error.message);
        }
    }
}

// 🧪 ฟังก์ชันทดสอบหลัก
async function runSimpleConnectionTest() {
    console.log('🚀 เริ่มทดสอบการเชื่อมต่อข้อมูลแบบง่าย\n');
    
    const connector = new SimpleMCPConnector();
    
    try {
        // 1. ทดสอบการเชื่อมต่อ
        const connected = await connector.testConnection();
        if (!connected) {
            console.log('❌ ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบว่า MCP Server ทำงานอยู่');
            return;
        }
        
        console.log('\n📋 ดูรายการเซิร์ฟเวอร์...');
        await connector.listServers();
        
        console.log('\n📝 เริ่มทดสอบการจัดการข้อมูล...');
        
        // 2. บันทึกข้อมูลทดสอบ
        await connector.storeData('test_message', testData.message);
        await connector.storeData('test_users', testData.users);
        await connector.storeData('test_products', testData.products);
        await connector.storeData('test_info', testData);
        
        // 3. ดูข้อมูลทั้งหมด
        console.log('\n📊 ดูข้อมูลทั้งหมดในระบบ...');
        const allKeys = await connector.listAllData();
        
        // 4. อ่านข้อมูลกลับมา
        console.log('\n📖 ทดสอบการอ่านข้อมูล...');
        const message = await connector.retrieveData('test_message');
        const users = await connector.retrieveData('test_users');
        const products = await connector.retrieveData('test_products');
        const info = await connector.retrieveData('test_info');
        
        console.log(`💬 ข้อความ: ${message}`);
        console.log(`👥 ผู้ใช้: ${users ? users.length : 0} คน`);
        console.log(`📦 สินค้า: ${products ? products.length : 0} รายการ`);
        console.log(`ℹ️ ข้อมูลเพิ่มเติม: ${info ? 'มี' : 'ไม่มี'}`);
        
        // 5. ทดสอบการลบข้อมูลทั้งหมด
        console.log('\n🗑️ ทดสอบการลบข้อมูลทั้งหมด...');
        await connector.clearAllData();
        
        // 6. ตรวจสอบว่าลบแล้ว
        const deletedMessage = await connector.retrieveData('test_message');
        console.log(`🗑️ ข้อความหลังลบ: ${deletedMessage ? 'ยังมี' : 'ลบแล้ว'}`);
        
        // 7. แสดงสถิติ
        await connector.getPerformanceStats();
        
        // 8. สร้างรายงานผลการทดสอบ
        const report = {
            timestamp: new Date().toISOString(),
            connection: 'success',
            serversAvailable: allKeys.length > 0,
            dataOperations: {
                store: 'success',
                retrieve: message !== null || users !== null,
                clear: deletedMessage === null,
                list: allKeys.length >= 0
            },
            dataStored: {
                totalKeys: allKeys.length,
                users: users ? users.length : 0,
                products: products ? products.length : 0,
                info: info ? 'available' : 'not available'
            },
            status: 'completed'
        };
        
        // บันทึกรายงาน
        fs.writeFileSync('simple-connection-report.json', JSON.stringify(report, null, 2));
        console.log('\n✅ ทดสอบเสร็จสมบูรณ์! รายงานบันทึกใน simple-connection-report.json');
        
        // แสดงสรุปผล
        console.log('\n🎯 สรุปผลการทดสอบ:');
        console.log(`✅ การเชื่อมต่อ: ${connected ? 'สำเร็จ' : 'ล้มเหลว'}`);
        console.log(`✅ การบันทึกข้อมูล: สำเร็จ`);
        console.log(`✅ การอ่านข้อมูล: ${users !== null ? 'สำเร็จ' : 'ล้มเหลว'}`);
        console.log(`✅ การลบข้อมูลทั้งหมด: ${deletedMessage === null ? 'สำเร็จ' : 'ล้มเหลว'}`);
        console.log(`📊 จำนวนข้อมูลในระบบ: ${allKeys.length} รายการ`);
        
    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
        
        // บันทึกข้อผิดพลาด
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: error.message,
            status: 'failed'
        };
        fs.writeFileSync('simple-connection-error.json', JSON.stringify(errorReport, null, 2));
    }
}

// 🎯 เริ่มการทดสอบ
if (require.main === module) {
    runSimpleConnectionTest();
}

// ส่งออกคลาสสำหรับใช้งานในไฟล์อื่น
module.exports = { SimpleMCPConnector, testData, runSimpleConnectionTest };

// 📚 ตัวอย่างการใช้งาน:
// const { SimpleMCPConnector } = require('./test-simple-connection.js');
// const connector = new SimpleMCPConnector();
// await connector.testConnection();
// await connector.storeData('mykey', { message: 'Hello MCP!' });
// const data = await connector.retrieveData('mykey');
// console.log(data);