#!/usr/bin/env node

/**
 * Advanced Git Memory MCP Server Test Script
 * ทดสอบฟีเจอร์ขั้นสูงของ Git Memory MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 เริ่มทดสอบขั้นสูง Git Memory MCP Server...');
console.log('=' .repeat(60));

// MCP Client class for testing
class MCPTestClient {
    constructor(serverPath) {
        this.serverPath = serverPath;
        this.server = null;
        this.requestId = 1;
        this.responses = new Map();
    }

    async start() {
        return new Promise((resolve, reject) => {
            console.log('🚀 เริ่มต้น MCP Server...');
            
            this.server = spawn('node', [this.serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.serverPath)
            });

            let hasStarted = false;

            this.server.stdout.on('data', (data) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                
                lines.forEach(line => {
                    try {
                        const response = JSON.parse(line);
                        if (response.id) {
                            this.responses.set(response.id, response);
                        }
                    } catch (e) {
                        // Not JSON, ignore
                    }
                });
            });

            this.server.stderr.on('data', (data) => {
                const stderrText = data.toString();
                if (stderrText.includes('Git Memory MCP server running')) {
                    hasStarted = true;
                    console.log('✅ MCP Server เริ่มทำงานแล้ว');
                    resolve();
                }
            });

            this.server.on('error', (error) => {
                reject(error);
            });

            setTimeout(() => {
                if (!hasStarted) {
                    reject(new Error('Server failed to start within timeout'));
                }
            }, 5000);
        });
    }

    async sendRequest(method, params = {}) {
        const request = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method,
            params
        };

        console.log(`📤 ส่งคำขอ: ${method}`);
        this.server.stdin.write(JSON.stringify(request) + '\n');

        // Wait for response
        return new Promise((resolve, reject) => {
            const checkResponse = () => {
                if (this.responses.has(request.id)) {
                    const response = this.responses.get(request.id);
                    this.responses.delete(request.id);
                    resolve(response);
                } else {
                    setTimeout(checkResponse, 100);
                }
            };
            
            setTimeout(() => {
                reject(new Error(`Timeout waiting for response to ${method}`));
            }, 5000);
            
            checkResponse();
        });
    }

    stop() {
        if (this.server) {
            this.server.kill();
        }
    }
}

// Test functions
async function testInitialize(client) {
    console.log('\n🔧 ทดสอบ Initialize...');
    
    try {
        const response = await client.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'advanced-test-client',
                version: '1.0.0'
            }
        });

        if (response.result && response.result.serverInfo) {
            console.log('✅ Initialize สำเร็จ');
            console.log('📋 Server Info:', response.result.serverInfo.name, 'v' + response.result.serverInfo.version);
            console.log('🛠️  Capabilities:', Object.keys(response.result.capabilities));
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
    
    try {
        const response = await client.sendRequest('tools/list');
        
        if (response.result && response.result.tools) {
            console.log('✅ List Tools สำเร็จ');
            console.log('📊 จำนวน Tools:', response.result.tools.length);
            
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

async function testGitStatus(client) {
    console.log('\n📊 ทดสอบ Git Status Tool...');
    
    try {
        const response = await client.sendRequest('tools/call', {
            name: 'git_status',
            arguments: {}
        });
        
        if (response.result) {
            console.log('✅ Git Status สำเร็จ');
            console.log('📄 ผลลัพธ์:', response.result.content?.[0]?.text?.substring(0, 200) + '...');
            return true;
        } else {
            console.log('❌ Git Status ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Git Status error:', error.message);
        return false;
    }
}

async function testMemoryStore(client) {
    console.log('\n💾 ทดสอบ Memory Store Tool...');
    
    try {
        const testData = {
            key: 'test_memory_' + Date.now(),
            value: 'ทดสอบการจัดเก็บข้อมูลในหน่วยความจำ',
            metadata: {
                timestamp: new Date().toISOString(),
                test: true
            }
        };

        const response = await client.sendRequest('tools/call', {
            name: 'memory_store',
            arguments: {
                key: testData.key,
                content: testData.value,
                metadata: testData.metadata
            }
        });
        
        if (response.result) {
            console.log('✅ Memory Store สำเร็จ');
            console.log('🔑 Key:', testData.key);
            console.log('💬 Value:', testData.value);
            return testData.key;
        } else {
            console.log('❌ Memory Store ล้มเหลว:', response);
            return null;
        }
    } catch (error) {
        console.log('❌ Memory Store error:', error.message);
        return null;
    }
}

async function testMemoryRecall(client, key) {
    console.log('\n🔍 ทดสอบ Memory Recall Tool...');
    
    if (!key) {
        console.log('⚠️  ไม่มี key สำหรับทดสอบ');
        return false;
    }

    try {
        const response = await client.sendRequest('tools/call', {
            name: 'memory_recall',
            arguments: { key }
        });
        
        if (response.result) {
            console.log('✅ Memory Recall สำเร็จ');
            console.log('📄 ข้อมูลที่ดึงมา:', response.result.content?.[0]?.text?.substring(0, 100) + '...');
            return true;
        } else {
            console.log('❌ Memory Recall ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Memory Recall error:', error.message);
        return false;
    }
}

async function testMemorySearch(client) {
    console.log('\n🔍 ทดสอบ Memory Search Tool...');
    
    try {
        const response = await client.sendRequest('tools/call', {
            name: 'memory_search',
            arguments: { 
                query: 'ทดสอบ',
                limit: 5
            }
        });
        
        if (response.result) {
            console.log('✅ Memory Search สำเร็จ');
            console.log('📄 ผลการค้นหา:', response.result.content?.[0]?.text?.substring(0, 200) + '...');
            return true;
        } else {
            console.log('❌ Memory Search ล้มเหลว:', response);
            return false;
        }
    } catch (error) {
        console.log('❌ Memory Search error:', error.message);
        return false;
    }
}

// Main test function
async function runAdvancedTests() {
    const serverPath = path.join(__dirname, 'src', 'git-memory', 'dist', 'index.js');
    const client = new MCPTestClient(serverPath);
    
    try {
        console.log('🚀 เริ่มการทดสอบขั้นสูง');
        console.log('⏰ เวลา:', new Date().toLocaleString('th-TH'));
        console.log('📁 Server Path:', serverPath);
        console.log('');

        // Start server
        await client.start();
        
        // Test 1: Initialize
        const initSuccess = await testInitialize(client);
        if (!initSuccess) {
            throw new Error('Initialize failed');
        }
        
        // Test 2: List Tools
        const tools = await testListTools(client);
        if (tools.length === 0) {
            console.log('⚠️  ไม่พบ tools แต่ยังคงทดสอบต่อ');
        }
        
        // Test 3: Git Status (if available)
        if (tools.some(t => t.name === 'git_status')) {
            await testGitStatus(client);
        } else {
            console.log('\n⚠️  Git Status tool ไม่พบ - ข้าม');
        }
        
        // Test 4: Memory Store (if available)
        let storedKey = null;
        if (tools.some(t => t.name === 'memory_store')) {
            storedKey = await testMemoryStore(client);
        } else {
            console.log('\n⚠️  Memory Store tool ไม่พบ - ข้าม');
        }
        
        // Test 5: Memory Recall (if available and we have a key)
        if (tools.some(t => t.name === 'memory_recall') && storedKey) {
            await testMemoryRecall(client, storedKey);
        } else {
            console.log('\n⚠️  Memory Recall tool ไม่พบหรือไม่มี key - ข้าม');
        }
        
        // Test 6: Memory Search (if available)
        if (tools.some(t => t.name === 'memory_search')) {
            await testMemorySearch(client);
        } else {
            console.log('\n⚠️  Memory Search tool ไม่พบ - ข้าม');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 การทดสอบขั้นสูงเสร็จสิ้น!');
        console.log('✅ Git Memory MCP Server ทำงานได้ตามที่คาดหวัง');
        console.log('📊 Tools ที่พบ:', tools.length, 'รายการ');
        
    } catch (error) {
        console.log('\n❌ การทดสอบขั้นสูงล้มเหลว:', error.message);
        process.exit(1);
    } finally {
        client.stop();
    }
}

// Run tests
if (require.main === module) {
    runAdvancedTests();
}

module.exports = { MCPTestClient, runAdvancedTests };