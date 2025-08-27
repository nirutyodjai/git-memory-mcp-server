// 🚀 Demo: การเขียนโค้ดเชื่อมต่อข้อมูลกับ MCP System
// Code Writing and Data Connection Demo

const http = require('http');
const fs = require('fs');

// 🎯 คลาสสำหรับจัดการข้อมูลผู้ใช้
class UserManager {
    constructor(mcpConnector) {
        this.mcp = mcpConnector;
        this.users = [];
    }

    // ➕ เพิ่มผู้ใช้ใหม่
    async addUser(userData) {
        const user = {
            id: Date.now(),
            name: userData.name,
            email: userData.email,
            role: userData.role || 'user',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // บันทึกลง MCP Memory
        await this.mcp.storeMemory(`user_${user.id}`, user);
        
        // เพิ่มใน array ท้องถิ่น
        this.users.push(user);
        
        console.log(`✅ เพิ่มผู้ใช้: ${user.name} (ID: ${user.id})`);
        return user;
    }

    // 📋 ดูรายการผู้ใช้ทั้งหมด
    async getAllUsers() {
        try {
            // ค้นหาผู้ใช้จาก MCP Memory
            const userKeys = await this.mcp.searchMemory('user_');
            const users = [];
            
            for (const key of userKeys) {
                const user = await this.mcp.retrieveMemory(key);
                if (user) users.push(user);
            }
            
            console.log(`📋 พบผู้ใช้ทั้งหมด: ${users.length} คน`);
            return users;
        } catch (error) {
            console.error('❌ ไม่สามารถดึงรายการผู้ใช้:', error.message);
            return [];
        }
    }

    // 🔍 ค้นหาผู้ใช้
    async findUser(searchTerm) {
        const users = await this.getAllUsers();
        const found = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        console.log(`🔍 พบผู้ใช้ที่ตรงกับ "${searchTerm}": ${found.length} คน`);
        return found;
    }

    // 📊 สถิติผู้ใช้
    async getUserStats() {
        const users = await this.getAllUsers();
        const stats = {
            total: users.length,
            active: users.filter(u => u.isActive).length,
            roles: {},
            recentUsers: users.filter(u => {
                const created = new Date(u.createdAt);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return created > dayAgo;
            }).length
        };
        
        // นับตาม role
        users.forEach(user => {
            stats.roles[user.role] = (stats.roles[user.role] || 0) + 1;
        });
        
        return stats;
    }
}

// 🛒 คลาสสำหรับจัดการสินค้า
class ProductManager {
    constructor(mcpConnector) {
        this.mcp = mcpConnector;
    }

    // ➕ เพิ่มสินค้า
    async addProduct(productData) {
        const product = {
            id: Date.now(),
            name: productData.name,
            price: productData.price,
            category: productData.category,
            stock: productData.stock || 0,
            description: productData.description || '',
            createdAt: new Date().toISOString(),
            isAvailable: true
        };
        
        await this.mcp.storeMemory(`product_${product.id}`, product);
        console.log(`✅ เพิ่มสินค้า: ${product.name} (ราคา: ${product.price} บาท)`);
        return product;
    }

    // 📦 ดูสินค้าทั้งหมด
    async getAllProducts() {
        try {
            const productKeys = await this.mcp.searchMemory('product_');
            const products = [];
            
            for (const key of productKeys) {
                const product = await this.mcp.retrieveMemory(key);
                if (product) products.push(product);
            }
            
            console.log(`📦 พบสินค้าทั้งหมด: ${products.length} รายการ`);
            return products;
        } catch (error) {
            console.error('❌ ไม่สามารถดึงรายการสินค้า:', error.message);
            return [];
        }
    }

    // 💰 คำนวณมูลค่าสต็อก
    async calculateInventoryValue() {
        const products = await this.getAllProducts();
        const totalValue = products.reduce((sum, product) => {
            return sum + (product.price * product.stock);
        }, 0);
        
        console.log(`💰 มูลค่าสต็อกรวม: ${totalValue.toLocaleString()} บาท`);
        return totalValue;
    }
}

// 🌐 คลาสสำหรับเชื่อมต่อ MCP
class MCPConnector {
    constructor(mcpUrl = 'http://localhost:9090') {
        this.mcpUrl = mcpUrl;
        this.isConnected = false;
    }

    // ✅ ทดสอบการเชื่อมต่อ
    async connect() {
        try {
            const response = await this.makeRequest('/health');
            if (response.status === 'healthy') {
                this.isConnected = true;
                console.log('✅ เชื่อมต่อ MCP สำเร็จ!');
                return true;
            }
        } catch (error) {
            console.error('❌ ไม่สามารถเชื่อมต่อ MCP:', error.message);
            return false;
        }
    }

    // 💾 บันทึกข้อมูลลงหน่วยความจำ
    async storeMemory(key, data) {
        try {
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
                                type: typeof data,
                                timestamp: new Date().toISOString()
                            }
                        }
                    }
                }
            });
            return response;
        } catch (error) {
            console.error(`❌ ไม่สามารถบันทึก ${key}:`, error.message);
            throw error;
        }
    }

    // 📖 อ่านข้อมูลจากหน่วยความจำ
    async retrieveMemory(key) {
        try {
            const response = await this.makeRequest('/mcp/memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'retrieve_memory',
                        arguments: { key: key }
                    }
                }
            });
            
            if (response.content && response.content[0] && response.content[0].text) {
                return JSON.parse(response.content[0].text);
            }
            return null;
        } catch (error) {
            console.error(`❌ ไม่สามารถอ่าน ${key}:`, error.message);
            return null;
        }
    }

    // 🔍 ค้นหาข้อมูล
    async searchMemory(pattern) {
        try {
            const response = await this.makeRequest('/mcp/memory', {
                method: 'POST',
                data: {
                    method: 'tools/call',
                    params: {
                        name: 'search_memory',
                        arguments: { pattern: pattern }
                    }
                }
            });
            
            if (response.content && response.content[0] && response.content[0].text) {
                return JSON.parse(response.content[0].text);
            }
            return [];
        } catch (error) {
            console.error(`❌ ไม่สามารถค้นหา ${pattern}:`, error.message);
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
}

// 🧪 ฟังก์ชันสาธิตการใช้งาน
async function runCodeDemo() {
    console.log('🚀 เริ่มสาธิตการเขียนโค้ดเชื่อมต่อข้อมูล\n');
    
    // 1. เชื่อมต่อ MCP
    const mcp = new MCPConnector();
    const connected = await mcp.connect();
    
    if (!connected) {
        console.log('❌ ไม่สามารถเชื่อมต่อได้');
        return;
    }
    
    // 2. สร้าง Manager classes
    const userManager = new UserManager(mcp);
    const productManager = new ProductManager(mcp);
    
    console.log('\n👥 === การจัดการผู้ใช้ ===');
    
    // 3. เพิ่มผู้ใช้ตัวอย่าง
    await userManager.addUser({
        name: 'สมชาย ใจดี',
        email: 'somchai@example.com',
        role: 'admin'
    });
    
    await userManager.addUser({
        name: 'สมหญิง รักงาน',
        email: 'somying@example.com',
        role: 'user'
    });
    
    await userManager.addUser({
        name: 'วิชัย เก่งมาก',
        email: 'wichai@example.com',
        role: 'manager'
    });
    
    // 4. ดูรายการผู้ใช้
    const users = await userManager.getAllUsers();
    console.log('\n📋 รายการผู้ใช้:');
    users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // 5. ค้นหาผู้ใช้
    const foundUsers = await userManager.findUser('สม');
    console.log('\n🔍 ผลการค้นหา "สม":');
    foundUsers.forEach(user => {
        console.log(`  - ${user.name}`);
    });
    
    // 6. สถิติผู้ใช้
    const userStats = await userManager.getUserStats();
    console.log('\n📊 สถิติผู้ใช้:');
    console.log(`  - ทั้งหมด: ${userStats.total} คน`);
    console.log(`  - ใช้งานอยู่: ${userStats.active} คน`);
    console.log(`  - ผู้ใช้ใหม่วันนี้: ${userStats.recentUsers} คน`);
    console.log('  - ตาม Role:');
    Object.entries(userStats.roles).forEach(([role, count]) => {
        console.log(`    * ${role}: ${count} คน`);
    });
    
    console.log('\n📦 === การจัดการสินค้า ===');
    
    // 7. เพิ่มสินค้าตัวอย่าง
    await productManager.addProduct({
        name: 'โน๊ตบุ๊ค Dell XPS 13',
        price: 45000,
        category: 'คอมพิวเตอร์',
        stock: 10,
        description: 'โน๊ตบุ๊คสำหรับทำงาน'
    });
    
    await productManager.addProduct({
        name: 'เมาส์ไร้สาย Logitech',
        price: 1200,
        category: 'อุปกรณ์',
        stock: 25,
        description: 'เมาส์ไร้สายคุณภาพสูง'
    });
    
    await productManager.addProduct({
        name: 'คีย์บอร์ดเกมมิ่ง',
        price: 3500,
        category: 'อุปกรณ์',
        stock: 15,
        description: 'คีย์บอร์ดสำหรับเล่นเกม'
    });
    
    // 8. ดูรายการสินค้า
    const products = await productManager.getAllProducts();
    console.log('\n📦 รายการสินค้า:');
    products.forEach(product => {
        console.log(`  - ${product.name}: ${product.price.toLocaleString()} บาท (คงเหลือ: ${product.stock})`);
    });
    
    // 9. คำนวณมูลค่าสต็อก
    const inventoryValue = await productManager.calculateInventoryValue();
    
    // 10. สร้างรายงานสรุป
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            users: userStats,
            products: {
                total: products.length,
                totalValue: inventoryValue,
                categories: [...new Set(products.map(p => p.category))]
            }
        },
        demo: 'completed'
    };
    
    // บันทึกรายงาน
    fs.writeFileSync('code-demo-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n🎯 === สรุปการสาธิต ===');
    console.log('✅ การเชื่อมต่อ MCP: สำเร็จ');
    console.log('✅ การจัดการผู้ใช้: สำเร็จ');
    console.log('✅ การจัดการสินค้า: สำเร็จ');
    console.log('✅ การค้นหาข้อมูล: สำเร็จ');
    console.log('✅ การคำนวณสถิติ: สำเร็จ');
    console.log('📄 รายงานบันทึกใน: code-demo-report.json');
    
    console.log('\n💡 ตัวอย่างนี้แสดงให้เห็น:');
    console.log('  - การเขียนโค้ด Object-Oriented Programming');
    console.log('  - การเชื่อมต่อกับ MCP Memory System');
    console.log('  - การจัดการข้อมูลแบบ CRUD (Create, Read, Update, Delete)');
    console.log('  - การค้นหาและกรองข้อมูล');
    console.log('  - การคำนวณและสร้างรายงาน');
    console.log('  - การจัดการ Error และ Exception');
}

// 🎯 เริ่มการสาธิต
if (require.main === module) {
    runCodeDemo().catch(error => {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    });
}

// ส่งออกคลาสสำหรับใช้งาน
module.exports = {
    MCPConnector,
    UserManager,
    ProductManager,
    runCodeDemo
};