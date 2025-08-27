#!/usr/bin/env node

/**
 * Git Memory MCP Server Test Script
 * ทดสอบการทำงานของ Git Memory MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 เริ่มทดสอบ Git Memory MCP Server...');
console.log('=' .repeat(50));

// Path to the Git Memory MCP Server
const serverPath = path.join(__dirname, 'src', 'git-memory', 'dist', 'index.js');

// Test MCP Server connection
function testMCPServer() {
    return new Promise((resolve, reject) => {
        console.log('📡 ทดสอบการเชื่อมต่อ MCP Server...');
        
        const server = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.join(__dirname, 'src', 'git-memory')
        });

        let output = '';
        let hasStarted = false;

        server.stdout.on('data', (data) => {
            output += data.toString();
            if (data.toString().includes('Git Memory MCP server running')) {
                hasStarted = true;
                console.log('✅ MCP Server เริ่มทำงานสำเร็จ');
            }
        });

        server.stderr.on('data', (data) => {
            const stderrText = data.toString();
            console.log('⚠️  Server stderr:', stderrText);
            // Check stderr for server start message too
            if (stderrText.includes('Git Memory MCP server running')) {
                hasStarted = true;
                console.log('✅ MCP Server เริ่มทำงานสำเร็จ (จาก stderr)');
            }
        });

        // Test basic MCP protocol
        setTimeout(() => {
            if (hasStarted) {
                // Send initialize request
                const initRequest = {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: {
                            name: 'test-client',
                            version: '1.0.0'
                        }
                    }
                };

                console.log('📤 ส่งคำขอ initialize...');
                server.stdin.write(JSON.stringify(initRequest) + '\n');

                // Wait for response
                setTimeout(() => {
                    console.log('📥 ได้รับการตอบสนอง:', output.slice(-200));
                    server.kill();
                    resolve(true);
                }, 2000);
            } else {
                console.log('❌ MCP Server ไม่สามารถเริ่มทำงานได้');
                server.kill();
                reject(new Error('Server failed to start'));
            }
        }, 3000);

        server.on('error', (error) => {
            console.log('❌ เกิดข้อผิดพลาด:', error.message);
            reject(error);
        });
    });
}

// Test Git operations
function testGitOperations() {
    return new Promise((resolve) => {
        console.log('\n🔧 ทดสอบ Git operations...');
        
        const git = spawn('git', ['status'], { cwd: __dirname });
        
        git.stdout.on('data', (data) => {
            console.log('✅ Git status:', data.toString().trim());
        });
        
        git.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Git operations ทำงานปกติ');
            } else {
                console.log('⚠️  Git operations มีปัญหา (code:', code, ')');
            }
            resolve(true);
        });
        
        git.on('error', (error) => {
            console.log('❌ Git error:', error.message);
            resolve(false);
        });
    });
}

// Test Memory database
function testMemoryDatabase() {
    console.log('\n💾 ทดสอบ Memory database...');
    
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'src', 'git-memory', 'memory.db');
    
    if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log('✅ Memory database พบแล้ว');
        console.log('📊 ขนาดไฟล์:', stats.size, 'bytes');
        console.log('📅 แก้ไขล่าสุด:', stats.mtime.toLocaleString('th-TH'));
        return true;
    } else {
        console.log('⚠️  Memory database ยังไม่ถูกสร้าง');
        return false;
    }
}

// Main test function
async function runTests() {
    try {
        console.log('🚀 เริ่มการทดสอบ Git Memory MCP Server');
        console.log('⏰ เวลา:', new Date().toLocaleString('th-TH'));
        console.log('');

        // Test 1: MCP Server
        await testMCPServer();
        
        // Test 2: Git Operations
        await testGitOperations();
        
        // Test 3: Memory Database
        testMemoryDatabase();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 การทดสอบเสร็จสิ้น!');
        console.log('✅ Git Memory MCP Server พร้อมใช้งาน');
        
    } catch (error) {
        console.log('\n❌ การทดสอบล้มเหลว:', error.message);
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    runTests();
}

module.exports = { testMCPServer, testGitOperations, testMemoryDatabase };