#!/usr/bin/env node

/**
 * Git Memory MCP Server - Quick Test Script
 * ทดสอบการทำงานของ Git Memory MCP Server แบบรวดเร็ว
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class QuickTester {
    constructor() {
        this.serverProcess = null;
        this.testResults = {
            serverStart: false,
            basicConnection: false,
            toolsList: false,
            gitOperations: false,
            memoryOperations: false,
            aiFeatures: false
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('th-TH');
        const icons = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            test: '🧪'
        };
        console.log(`${icons[type]} [${timestamp}] ${message}`);
    }

    async startServer() {
        this.log('เริ่มต้น Git Memory MCP Server...', 'test');
        
        // ตรวจสอบไฟล์ที่จำเป็น
        const serverPath = path.join(__dirname, 'src', 'git-memory', 'dist', 'index.js');
        if (!fs.existsSync(serverPath)) {
            this.log('ไม่พบไฟล์ server! กรุณา build โปรเจกต์ก่อน: npm run build', 'error');
            return false;
        }

        return new Promise((resolve) => {
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.join(__dirname, 'src', 'git-memory')
            });

            let serverReady = false;

            this.serverProcess.stderr.on('data', (data) => {
                const message = data.toString();
                if (message.includes('Git Memory MCP server running') && !serverReady) {
                    serverReady = true;
                    this.testResults.serverStart = true;
                    this.log('Server เริ่มทำงานสำเร็จ!', 'success');
                    resolve(true);
                }
            });

            this.serverProcess.on('error', (error) => {
                this.log(`Server error: ${error.message}`, 'error');
                resolve(false);
            });

            // Timeout หาก server ไม่เริ่มใน 5 วินาที
            setTimeout(() => {
                if (!serverReady) {
                    this.log('Server ใช้เวลาเริ่มต้นนานเกินไป', 'warning');
                    resolve(false);
                }
            }, 5000);
        });
    }

    async testBasicConnection() {
        this.log('ทดสอบการเชื่อมต่อพื้นฐาน...', 'test');
        
        return new Promise((resolve) => {
            let responseReceived = false;
            
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: { roots: { listChanged: true }, sampling: {} },
                    clientInfo: { name: 'quick-test', version: '1.0.0' }
                }
            };

            this.serverProcess.stdout.on('data', (data) => {
                if (!responseReceived) {
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.id === 1 && response.result) {
                            responseReceived = true;
                            this.testResults.basicConnection = true;
                            this.log('การเชื่อมต่อสำเร็จ!', 'success');
                            resolve(true);
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });

            this.serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

            setTimeout(() => {
                if (!responseReceived) {
                    this.log('ไม่ได้รับการตอบกลับจาก server', 'error');
                    resolve(false);
                }
            }, 3000);
        });
    }

    async testToolsList() {
        this.log('ทดสอบการแสดงรายการ tools...', 'test');
        
        return new Promise((resolve) => {
            let responseReceived = false;
            
            const toolsRequest = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/list'
            };

            this.serverProcess.stdout.on('data', (data) => {
                if (!responseReceived) {
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.id === 2 && response.result && response.result.tools) {
                            responseReceived = true;
                            this.testResults.toolsList = true;
                            const toolCount = response.result.tools.length;
                            this.log(`พบ ${toolCount} tools ใน server`, 'success');
                            
                            // แสดงรายชื่อ tools
                            response.result.tools.forEach((tool, index) => {
                                console.log(`   ${index + 1}. ${tool.name}`);
                            });
                            
                            resolve(true);
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });

            this.serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');

            setTimeout(() => {
                if (!responseReceived) {
                    this.log('ไม่สามารถดึงรายการ tools ได้', 'error');
                    resolve(false);
                }
            }, 3000);
        });
    }

    async testGitStatus() {
        this.log('ทดสอบ Git operations...', 'test');
        
        return new Promise((resolve) => {
            let responseReceived = false;
            
            const gitStatusRequest = {
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/call',
                params: {
                    name: 'git_status',
                    arguments: {}
                }
            };

            this.serverProcess.stdout.on('data', (data) => {
                if (!responseReceived) {
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.id === 3) {
                            responseReceived = true;
                            if (response.result) {
                                this.testResults.gitOperations = true;
                                this.log('Git operations ทำงานได้!', 'success');
                                resolve(true);
                            } else {
                                this.log('Git operations มีปัญหา', 'warning');
                                resolve(false);
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });

            this.serverProcess.stdin.write(JSON.stringify(gitStatusRequest) + '\n');

            setTimeout(() => {
                if (!responseReceived) {
                    this.log('Git status ไม่ตอบสนอง', 'error');
                    resolve(false);
                }
            }, 3000);
        });
    }

    async testMemoryStore() {
        this.log('ทดสอบ Memory operations...', 'test');
        
        return new Promise((resolve) => {
            let responseReceived = false;
            const testKey = `quick_test_${Date.now()}`;
            
            const memoryStoreRequest = {
                jsonrpc: '2.0',
                id: 4,
                method: 'tools/call',
                params: {
                    name: 'memory_store',
                    arguments: {
                        key: testKey,
                        content: 'ทดสอบการจัดเก็บข้อมูลแบบรวดเร็ว',
                        metadata: { test: true }
                    }
                }
            };

            this.serverProcess.stdout.on('data', (data) => {
                if (!responseReceived) {
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.id === 4) {
                            responseReceived = true;
                            if (response.result) {
                                this.testResults.memoryOperations = true;
                                this.log('Memory operations ทำงานได้!', 'success');
                                resolve(true);
                            } else {
                                this.log('Memory operations มีปัญหา', 'warning');
                                resolve(false);
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });

            this.serverProcess.stdin.write(JSON.stringify(memoryStoreRequest) + '\n');

            setTimeout(() => {
                if (!responseReceived) {
                    this.log('Memory store ไม่ตอบสนอง', 'error');
                    resolve(false);
                }
            }, 3000);
        });
    }

    async cleanup() {
        if (this.serverProcess) {
            this.log('ปิด server...', 'info');
            this.serverProcess.kill();
            this.serverProcess = null;
        }
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 สรุปผลการทดสอบ Git Memory MCP Server');
        console.log('='.repeat(60));
        
        const tests = [
            { name: 'Server เริ่มต้น', key: 'serverStart' },
            { name: 'การเชื่อมต่อพื้นฐาน', key: 'basicConnection' },
            { name: 'รายการ Tools', key: 'toolsList' },
            { name: 'Git Operations', key: 'gitOperations' },
            { name: 'Memory Operations', key: 'memoryOperations' }
        ];

        let passedTests = 0;
        tests.forEach(test => {
            const status = this.testResults[test.key] ? '✅ ผ่าน' : '❌ ล้มเหลว';
            console.log(`${status} ${test.name}`);
            if (this.testResults[test.key]) passedTests++;
        });

        console.log('\n' + '-'.repeat(60));
        console.log(`📊 ผลรวม: ${passedTests}/${tests.length} การทดสอบผ่าน`);
        
        if (passedTests === tests.length) {
            console.log('🎉 Git Memory MCP Server พร้อมใช้งาน!');
        } else if (passedTests >= 3) {
            console.log('⚠️  Server ทำงานได้บางส่วน - ตรวจสอบการตั้งค่า');
        } else {
            console.log('❌ Server มีปัญหา - ตรวจสอบการติดตั้ง');
        }
        
        console.log('\n📚 ดูคู่มือการใช้งาน: USAGE_GUIDE.md');
        console.log('🔍 ดูผลการทดสอบละเอียด: TEST_RESULTS.md');
    }

    async run() {
        console.log('🚀 Git Memory MCP Server - Quick Test');
        console.log('=====================================\n');
        
        try {
            // เริ่ม server
            const serverStarted = await this.startServer();
            if (!serverStarted) {
                this.log('ไม่สามารถเริ่ม server ได้', 'error');
                return;
            }

            // รอให้ server พร้อม
            await new Promise(resolve => setTimeout(resolve, 1000));

            // ทดสอบการเชื่อมต่อ
            await this.testBasicConnection();
            await new Promise(resolve => setTimeout(resolve, 500));

            // ทดสอบ tools list
            await this.testToolsList();
            await new Promise(resolve => setTimeout(resolve, 500));

            // ทดสอบ Git operations
            await this.testGitStatus();
            await new Promise(resolve => setTimeout(resolve, 500));

            // ทดสอบ Memory operations
            await this.testMemoryStore();
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            this.log(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
        } finally {
            await this.cleanup();
            this.displayResults();
        }
    }
}

// รันการทดสอบ
if (require.main === module) {
    const tester = new QuickTester();
    tester.run().catch(console.error);
}

module.exports = QuickTester;