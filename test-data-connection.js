// 🚀 ตัวอย่างการเขียนโค้ดเชื่อมต่อข้อมูลกับ MCP System
// Test Data Connection with MCP Lightweight System

const http = require('http');
const fs = require('fs');

// 📊 ข้อมูลทดสอบ
const testData = {
    users: [
        { id: 1, name: 'สมชาย', email: 'somchai@test.com', role: 'admin' },
        { id: 2, name: 'สมหญิง', email: 'somying@test.com', role: 'user' },
        { id: 3, name: 'วิชัย', email: 'wichai@test.com', role: 'moderator' }
    ],
    products: [
        { id: 1, name: 'โน๊ตบุ๊ค', price: 25000, category: 'electronics' },
        { id: 2, name: 'เมาส์', price: 500, category: 'accessories' },
        { id: 3, name: 'คีย์บอร์ด', price: 1500, category: 'accessories' }
    ],
    orders: [
        { id: 1, userId: 1, productId: 1, quantity: 1, total: 25000 },
        { id: 2, userId: 2, productId: 2, quantity: 2, total: 1000 },
        { id: 3, userId: 3, productId: 3, quantity: 1, total: 1500 }
    ]
};

// 🔧 คลาสสำหรับเชื่อมต่อ MCP
class MCPDataConnector {
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
                console.log(`🖥️ เซิร์ฟเวอร์: ${response.servers} ตัว`);
                return true;
            }
        } catch (error) {
            console.error('❌ ไม่สามารถเชื่อมต่อ MCP:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    // 💾 บันทึกข้อมูลลง Memory Server
    async storeData(key, data) {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log(`💾 กำลังบันทึกข้อมูล: ${key}`);
            const response = await this.makeRequest('/mcp/memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'store_memory',
                        arguments: {
                            key: key,
                            value: JSON.stringify(data),
                            metadata: {
                                timestamp: new Date().toISOString(),
                                type: 'test_data',
                                source: 'data_connection_test'
                            }
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

    // 📖 อ่านข้อมูลจาก Memory Server
    async retrieveData(key) {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log(`📖 กำลังอ่านข้อมูล: ${key}`);
            const response = await this.makeRequest('/mcp/memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'read_memory',
                        arguments: {
                            key: key
                        }
                    }
                }
            });
            
            if (response.content && response.content[0] && response.content[0].text) {
                console.log(`✅ อ่านข้อมูล ${key} สำเร็จ`);
                return JSON.parse(response.content[0].text);
            } else {
                console.log(`⚠️ ไม่พบข้อมูล: ${key}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ ไม่สามารถอ่านข้อมูล ${key}:`, error.message);
            return null;
        }
    }

    // 🔍 ค้นหาข้อมูล
    async searchData(query) {
        if (!this.isConnected) {
            throw new Error('ไม่ได้เชื่อมต่อกับ MCP');
        }

        try {
            console.log(`🔍 กำลังค้นหา: ${query}`);
            const response = await this.makeRequest('/mcp/memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'search_memory',
                        arguments: {
                            query: query,
                            limit: 10
                        }
                    }
                }
            });
            
            const results = response.content || [];
            console.log(`✅ ค้นหาเสร็จสิ้น พบ ${results.length} รายการ`);
            return results;
        } catch (error) {
            console.error(`❌ ไม่สามารถค้นหา:`, error.message);
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
async function runDataConnectionTest() {
    console.log('🚀 เริ่มทดสอบการเชื่อมต่อข้อมูล MCP\n');
    
    const connector = new MCPDataConnector();
    
    try {
        // 1. ทดสอบการเชื่อมต่อ
        const connected = await connector.testConnection();
        if (!connected) {
            console.log('❌ ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบว่า MCP Server ทำงานอยู่');
            return;
        }
        
        console.log('\n📝 เริ่มทดสอบการจัดการข้อมูล...');
        
        // 2. บันทึกข้อมูลทดสอบ
        await connector.storeData('test_users', testData.users);
        await connector.storeData('test_products', testData.products);
        await connector.storeData('test_orders', testData.orders);
        
        // 3. อ่านข้อมูลกลับมา
        console.log('\n📖 ทดสอบการอ่านข้อมูล...');
        const users = await connector.retrieveData('test_users');
        const products = await connector.retrieveData('test_products');
        const orders = await connector.retrieveData('test_orders');
        
        console.log(`👥 ผู้ใช้: ${users?.length || 0} คน`);
        console.log(`📦 สินค้า: ${products?.length || 0} รายการ`);
        console.log(`🛒 คำสั่งซื้อ: ${orders?.length || 0} รายการ`);
        
        // 4. ทดสอบการค้นหา
        console.log('\n🔍 ทดสอบการค้นหา...');
        const searchResults = await connector.searchData('สมชาย');
        console.log(`🔍 ผลการค้นหา 'สมชาย': ${searchResults.length} รายการ`);
        
        // 5. แสดงสถิติ
        await connector.getPerformanceStats();
        
        // 6. สร้างรายงานผลการทดสอบ
        const report = {
            timestamp: new Date().toISOString(),
            connection: 'success',
            dataStored: {
                users: users?.length || 0,
                products: products?.length || 0,
                orders: orders?.length || 0
            },
            searchTest: {
                query: 'สมชาย',
                results: searchResults.length
            },
            status: 'completed'
        };
        
        // บันทึกรายงาน
        fs.writeFileSync('test-connection-report.json', JSON.stringify(report, null, 2));
        console.log('\n✅ ทดสอบเสร็จสมบูรณ์! รายงานบันทึกใน test-connection-report.json');
        
    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
        
        // บันทึกข้อผิดพลาด
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: error.message,
            status: 'failed'
        };
        fs.writeFileSync('test-connection-error.json', JSON.stringify(errorReport, null, 2));
    }
}

// 🎯 เริ่มการทดสอบ
if (require.main === module) {
    runDataConnectionTest();
}

// ส่งออกคลาสสำหรับใช้งานในไฟล์อื่น
module.exports = { MCPDataConnector, testData, runDataConnectionTest };

// 📚 ตัวอย่างการใช้งาน:
// const { MCPDataConnector } = require('./test-data-connection.js');
// const connector = new MCPDataConnector();
// await connector.testConnection();
// await connector.storeData('mykey', { message: 'Hello MCP!' });
// const data = await connector.retrieveData('mykey');
// console.log(data);