#!/usr/bin/env node

/**
 * 📊 NEXUS IDE - Log Viewer
 * ระบบดู logs และ monitoring สำหรับ NEXUS IDE
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class LogViewer {
    constructor() {
        this.logSources = {
            'nexus-web-server': {
                description: 'NEXUS Web Server Logs',
                files: ['nexus-web-server.log', 'access.log'],
                realtime: true
            },
            'test-reports': {
                description: 'Test Execution Reports',
                directory: 'test-suite/reports',
                pattern: '*.json'
            },
            'git-memory': {
                description: 'Git Memory Coordinator Logs',
                files: ['git-memory.log', 'mcp-server.log'],
                realtime: true
            },
            'system': {
                description: 'System Health & Performance',
                files: ['health-check.log', 'performance.log'],
                realtime: true
            }
        };
    }

    async showMenu() {
        console.log('\n🔍 NEXUS IDE - Log Viewer');
        console.log('============================================================');
        console.log('เลือกประเภท logs ที่ต้องการดู:');
        console.log('');
        
        const options = [
            '1. 📊 Test Reports (ล่าสุด 10 รายการ)',
            '2. 🌐 Web Server Logs (Real-time)',
            '3. 🔧 Git Memory Logs (Real-time)',
            '4. 💻 System Health Logs',
            '5. 📈 Performance Metrics',
            '6. 🔄 All Recent Logs (สรุป)',
            '7. 📱 Live Dashboard (Real-time monitoring)',
            '8. 🧪 Test Results Summary',
            '9. 📋 System Status Report',
            '0. ❌ Exit'
        ];
        
        options.forEach(option => console.log(option));
        console.log('');
        
        return new Promise((resolve) => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', (key) => {
                const choice = key.toString().trim();
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve(choice);
            });
        });
    }

    async showTestReports() {
        console.log('\n📊 Test Reports - ล่าสุด 10 รายการ');
        console.log('============================================================');
        
        try {
            const reportsDir = path.join(__dirname, 'test-suite', 'reports');
            const files = await fs.readdir(reportsDir);
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 10);
            
            for (const file of jsonFiles) {
                const filePath = path.join(reportsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const report = JSON.parse(content);
                
                console.log(`\n📄 ${file}`);
                console.log(`⏰ ${report.timestamp || 'N/A'}`);
                
                if (report.results) {
                    const { total, passed, failed } = report.results;
                    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
                    console.log(`📊 Success Rate: ${successRate}% (${passed}/${total})`);
                    
                    if (failed > 0 && report.results.errors) {
                        console.log('❌ Failed Tests:');
                        report.results.errors.slice(0, 3).forEach(error => {
                            console.log(`   • ${error.test}: ${error.error}`);
                        });
                        if (report.results.errors.length > 3) {
                            console.log(`   ... และอีก ${report.results.errors.length - 3} รายการ`);
                        }
                    }
                }
                console.log('─'.repeat(60));
            }
        } catch (error) {
            console.log(`❌ Error reading test reports: ${error.message}`);
        }
    }

    async showSystemStatus() {
        console.log('\n💻 System Status Report');
        console.log('============================================================');
        
        // Memory usage
        const memUsage = process.memoryUsage();
        console.log('🧠 Memory Usage:');
        console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        
        // Uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        console.log(`\n⏱️  Process Uptime: ${hours}h ${minutes}m ${seconds}s`);
        
        // Node.js version
        console.log(`\n🟢 Node.js Version: ${process.version}`);
        console.log(`📁 Working Directory: ${process.cwd()}`);
        console.log(`🖥️  Platform: ${process.platform} ${process.arch}`);
        
        // Check if server is running
        try {
            const axios = require('axios');
            const response = await axios.get('http://localhost:8081/api/status', { timeout: 5000 });
            console.log('\n🌐 NEXUS Web Server: ✅ Running');
            console.log(`   Port: 8081`);
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Uptime: ${Math.floor(response.data.uptime)}s`);
        } catch (error) {
            console.log('\n🌐 NEXUS Web Server: ❌ Not Running');
        }
    }

    async showLiveDashboard() {
        console.log('\n📱 Live Dashboard - Real-time Monitoring');
        console.log('============================================================');
        console.log('กด Ctrl+C เพื่อหยุด');
        console.log('');
        
        const updateInterval = setInterval(async () => {
            // Clear screen
            process.stdout.write('\x1Bc');
            
            console.log('📱 NEXUS IDE - Live Dashboard');
            console.log('============================================================');
            console.log(`🕐 ${new Date().toLocaleString()}`);
            console.log('');
            
            // System metrics
            const memUsage = process.memoryUsage();
            console.log(`🧠 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`⏱️  Uptime: ${Math.floor(process.uptime())}s`);
            
            // Server status
            try {
                const axios = require('axios');
                const response = await axios.get('http://localhost:8081/api/status', { timeout: 2000 });
                console.log('🌐 Web Server: ✅ Online');
                console.log(`📊 Server Memory: ${(response.data.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            } catch (error) {
                console.log('🌐 Web Server: ❌ Offline');
            }
            
            console.log('');
            console.log('กด Ctrl+C เพื่อหยุด...');
        }, 2000);
        
        // Handle Ctrl+C
        process.on('SIGINT', () => {
            clearInterval(updateInterval);
            console.log('\n\n👋 Live Dashboard หยุดทำงานแล้ว');
            process.exit(0);
        });
    }

    async showTestSummary() {
        console.log('\n🧪 Test Results Summary');
        console.log('============================================================');
        
        try {
            const reportsDir = path.join(__dirname, 'test-suite', 'reports');
            const files = await fs.readdir(reportsDir);
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
            
            if (jsonFiles.length === 0) {
                console.log('❌ ไม่พบรายงานการทดสอบ');
                return;
            }
            
            // Latest report
            const latestFile = jsonFiles[0];
            const latestPath = path.join(reportsDir, latestFile);
            const latestReport = JSON.parse(await fs.readFile(latestPath, 'utf8'));
            
            console.log(`📄 รายงานล่าสุด: ${latestFile}`);
            console.log(`⏰ เวลา: ${latestReport.timestamp || 'N/A'}`);
            
            if (latestReport.results) {
                const { total, passed, failed } = latestReport.results;
                const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
                
                console.log('');
                console.log('📊 สถิติการทดสอบ:');
                console.log(`   ✅ ผ่าน: ${passed} tests`);
                console.log(`   ❌ ไม่ผ่าน: ${failed} tests`);
                console.log(`   📈 อัตราความสำเร็จ: ${successRate}%`);
                
                if (successRate === '100.0') {
                    console.log('\n🎉 ยินดีด้วย! การทดสอบผ่านทั้งหมด!');
                } else if (successRate >= '80.0') {
                    console.log('\n⚠️  การทดสอบผ่านส่วนใหญ่ แต่ยังมีปัญหาบางอย่าง');
                } else {
                    console.log('\n🚨 พบปัญหาในการทดสอบ ต้องแก้ไขด่วน!');
                }
            }
            
            // Trend analysis
            if (jsonFiles.length > 1) {
                console.log('\n📈 แนวโน้ม (5 รายการล่าสุด):');
                for (let i = 0; i < Math.min(5, jsonFiles.length); i++) {
                    const file = jsonFiles[i];
                    const filePath = path.join(reportsDir, file);
                    const report = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    
                    if (report.results && report.results.total > 0) {
                        const successRate = ((report.results.passed / report.results.total) * 100).toFixed(1);
                        const status = successRate === '100.0' ? '✅' : successRate >= '80.0' ? '⚠️' : '❌';
                        console.log(`   ${status} ${successRate}% - ${file.substring(0, 30)}...`);
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ Error reading test summary: ${error.message}`);
        }
    }

    async run() {
        while (true) {
            const choice = await this.showMenu();
            
            switch (choice) {
                case '1':
                    await this.showTestReports();
                    break;
                case '2':
                    console.log('\n🌐 Web Server Logs - Feature coming soon!');
                    break;
                case '3':
                    console.log('\n🔧 Git Memory Logs - Feature coming soon!');
                    break;
                case '4':
                    await this.showSystemStatus();
                    break;
                case '5':
                    console.log('\n📈 Performance Metrics - Feature coming soon!');
                    break;
                case '6':
                    await this.showTestReports();
                    await this.showSystemStatus();
                    break;
                case '7':
                    await this.showLiveDashboard();
                    break;
                case '8':
                    await this.showTestSummary();
                    break;
                case '9':
                    await this.showSystemStatus();
                    break;
                case '0':
                    console.log('\n👋 ขอบคุณที่ใช้ NEXUS IDE Log Viewer!');
                    process.exit(0);
                default:
                    console.log('\n❌ กรุณาเลือกตัวเลข 0-9');
            }
            
            console.log('\n\nกด Enter เพื่อกลับไปเมนูหลัก...');
            await new Promise(resolve => {
                process.stdin.once('data', resolve);
            });
        }
    }
}

// Run if called directly
if (require.main === module) {
    const viewer = new LogViewer();
    viewer.run().catch(error => {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = LogViewer;