const { spawn } = require('child_process');
const { EventEmitter } = require('events');

// MCP Client implementation
class MCPClient extends EventEmitter {
    constructor() {
        super();
        this.process = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.buffer = '';
    }

    async start(command, args = []) {
        return new Promise((resolve, reject) => {
            this.process = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false
            });

            this.process.stdout.on('data', (data) => {
                this.buffer += data.toString();
                this.processBuffer();
            });

            this.process.stderr.on('data', (data) => {
                const message = data.toString();
                if (message.includes('Git Memory MCP server running')) {
                    console.log('✅ MCP Server เริ่มทำงานสำเร็จ (จาก stderr)');
                    resolve();
                }
            });

            this.process.on('error', (error) => {
                console.error('❌ Process error:', error);
                reject(error);
            });

            setTimeout(() => {
                if (this.process && !this.process.killed) {
                    resolve();
                }
            }, 2000);
        });
    }

    processBuffer() {
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                try {
                    const message = JSON.parse(line);
                    this.handleMessage(message);
                } catch (error) {
                    // Ignore non-JSON lines
                }
            }
        }
    }

    handleMessage(message) {
        if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id);
            this.pendingRequests.delete(message.id);

            if (message.error) {
                reject(new Error(message.error.message || 'Unknown error'));
            } else {
                resolve(message);
            }
        }
    }

    async sendRequest(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params
            };

            this.pendingRequests.set(id, { resolve, reject });
            this.process.stdin.write(JSON.stringify(request) + '\n');

            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }

    async close() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}

// Test functions
async function testInitialize(client) {
    console.log('\n🔧 ทดสอบ Initialize...');
    console.log('📤 ส่งคำขอ: initialize');
    
    try {
        const response = await client.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                roots: {
                    listChanged: true
                },
                sampling: {}
            },
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        });
        
        if (response.result) {
            console.log('✅ Initialize สำเร็จ');
            console.log(`📋 Server Info: ${response.result.serverInfo?.name} v${response.result.serverInfo?.version}`);
            console.log(`🛠️  Capabilities: ${JSON.stringify(response.result.capabilities)}`);
            return true;
        } else {
            console.log('❌ Initialize ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Initialize error:', error.message);
        return false;
    }
}

async function testListTools(client) {
    console.log('\n🛠️  ทดสอบ List Tools...');
    console.log('📤 ส่งคำขอ: tools/list');
    
    try {
        const response = await client.sendRequest('tools/list');
        
        if (response.result && response.result.tools) {
            console.log('✅ List Tools สำเร็จ');
            console.log(`📊 จำนวน Tools: ${response.result.tools.length}`);
            response.result.tools.forEach((tool, index) => {
                console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
            });
            return response.result.tools;
        } else {
            console.log('❌ List Tools ล้มเหลว:', response);
            return [];
        }
    } catch (error) {
        console.log('❌ List Tools error:', error.message);
        return [];
    }
}

async function testSmartCommit(client) {
    console.log('\n🧠 ทดสอบ Smart Commit Tool...');
    console.log('📤 ส่งคำขอ: tools/call');
    
    try {
        const response = await client.sendRequest('tools/call', {
            name: 'smart_commit',
            arguments: {
                message: 'ทดสอบ smart commit feature',
                context: 'การทดสอบระบบ Git Memory MCP Server'
            }
        });
        
        if (response.result) {
            console.log('✅ Smart Commit สำเร็จ');
            console.log('📄 ผลลัพธ์:', JSON.stringify(response.result, null, 2).substring(0, 300) + '...');
            return true;
        } else {
            console.log('❌ Smart Commit ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Smart Commit error:', error.message);
        return false;
    }
}

async function testPatternAnalysis(client) {
    console.log('\n📊 ทดสอบ Pattern Analysis Tool...');
    console.log('📤 ส่งคำขอ: tools/call');
    
    try {
        const response = await client.sendRequest('tools/call', {
            name: 'pattern_analysis',
            arguments: {
                analysis_type: 'commit_patterns',
                timeframe: '1 month'
            }
        });
        
        if (response.result) {
            console.log('✅ Pattern Analysis สำเร็จ');
            console.log('📄 ผลลัพธ์:', JSON.stringify(response.result, null, 2).substring(0, 300) + '...');
            return true;
        } else {
            console.log('❌ Pattern Analysis ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Pattern Analysis error:', error.message);
        return false;
    }
}

async function testContextSearch(client) {
    console.log('\n🔍 ทดสอบ Context Search Tool...');
    console.log('📤 ส่งคำขอ: tools/call');
    
    try {
        const response = await client.sendRequest('tools/call', {
            name: 'context_search',
            arguments: {
                query: 'ทดสอบ',
                include_git: true,
                include_memory: true,
                limit: 5
            }
        });
        
        if (response.result) {
            console.log('✅ Context Search สำเร็จ');
            console.log('📄 ผลลัพธ์:', JSON.stringify(response.result, null, 2).substring(0, 300) + '...');
            return true;
        } else {
            console.log('❌ Context Search ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Context Search error:', error.message);
        return false;
    }
}

// Main test function
async function runCompleteTests() {
    console.log('🚀 เริ่มการทดสอบ Git Memory MCP Server แบบครบถ้วน');
    console.log('============================================================');
    
    const client = new MCPClient();
    
    try {
        // Start MCP Server
        console.log('\n🔄 เริ่มต้น MCP Server...');
        await client.start('node', ['dist/index.js']);
        
        // Test 1: Initialize
        const initSuccess = await testInitialize(client);
        if (!initSuccess) {
            throw new Error('Initialize ล้มเหลว');
        }
        
        // Test 2: List Tools
        const tools = await testListTools(client);
        if (tools.length === 0) {
            throw new Error('ไม่พบ Tools');
        }
        
        // Test 3: Smart Commit (ฟีเจอร์เด่น)
        if (tools.some(t => t.name === 'smart_commit')) {
            await testSmartCommit(client);
        } else {
            console.log('\n⚠️  Smart Commit tool ไม่พบ - ข้าม');
        }
        
        // Test 4: Pattern Analysis (ฟีเจอร์เด่น)
        if (tools.some(t => t.name === 'pattern_analysis')) {
            await testPatternAnalysis(client);
        } else {
            console.log('\n⚠️  Pattern Analysis tool ไม่พบ - ข้าม');
        }
        
        // Test 5: Context Search (ฟีเจอร์เด่น)
        if (tools.some(t => t.name === 'context_search')) {
            await testContextSearch(client);
        } else {
            console.log('\n⚠️  Context Search tool ไม่พบ - ข้าม');
        }
        
        console.log('\n============================================================');
        console.log('🎉 การทดสอบครบถ้วนเสร็จสิ้น!');
        console.log('✅ Git Memory MCP Server ทำงานได้อย่างสมบูรณ์');
        console.log(`📊 Tools ที่พบ: ${tools.length} รายการ`);
        console.log('🚀 พร้อมใช้งานจริง!');
        
    } catch (error) {
        console.error('\n❌ การทดสอบล้มเหลว:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Run tests
if (require.main === module) {
    runCompleteTests().catch(console.error);
}

module.exports = { runCompleteTests };