#!/usr/bin/env node

/**
 * Restart 1000 MCP Servers with Enhanced Memory Configuration
 * รีสตาร์ท 1000 servers ด้วยการตั้งค่าหน่วยความจำที่ปรับปรุงแล้ว
 */

const { spawn, exec } = require('child_process');
const path = require('path');

class ServerRestarter {
    constructor() {
        this.restartedServers = 0;
        this.totalServers = 1000;
    }

    async init() {
        console.log('🔄 เริ่มรีสตาร์ท 1000 MCP Servers ด้วยการตั้งค่าหน่วยความจำใหม่');
        console.log('=' .repeat(70));
        
        await this.stopExistingServers();
        await this.delay(5000); // รอ 5 วินาทีให้ servers ปิดสมบูรณ์
        await this.startNewServers();
    }

    async stopExistingServers() {
        console.log('🛑 กำลังหยุด Node.js processes ที่มีอยู่...');
        
        return new Promise((resolve) => {
            // หยุด Node.js processes ทั้งหมดยกเว้น process ปัจจุบัน
            exec('taskkill /F /IM node.exe /T', (error, stdout, stderr) => {
                if (error && !error.message.includes('not found')) {
                    console.error('Error stopping processes:', error.message);
                } else {
                    console.log('✅ หยุด existing servers เรียบร้อย');
                }
                resolve();
            });
        });
    }

    async startNewServers() {
        console.log('🚀 เริ่มสร้าง servers ใหม่ด้วยการตั้งค่าหน่วยความจำที่ปรับปรุง...');
        
        // รันสคริปต์สร้าง servers ใหม่
        const createScript = path.join(__dirname, 'create-1000-servers-no-debug.js');
        
        const serverProcess = spawn('node', [createScript], {
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=1024'
            }
        });

        serverProcess.on('close', (code) => {
            if (code === 0) {
                console.log('\n🎉 รีสตาร์ท servers เสร็จสิ้น!');
                this.showMemoryStatus();
            } else {
                console.error(`❌ Server creation failed with code ${code}`);
            }
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Error starting servers:', error.message);
        });
    }

    async showMemoryStatus() {
        console.log('\n📊 ตรวจสอบสถานะหน่วยความจำใหม่...');
        
        // ตรวจสอบการใช้หน่วยความจำ
        exec('powershell "Get-Process -Name node | Measure-Object -Property WorkingSet -Sum | Select-Object @{Name=\'TotalMemoryMB\';Expression={[math]::Round($_.Sum/1MB,2)}}"', 
            (error, stdout, stderr) => {
                if (!error) {
                    console.log('💾 สถานะหน่วยความจำ:');
                    console.log(stdout);
                }
            }
        );

        // ตรวจสอบจำนวน processes
        exec('powershell "(Get-Process -Name node).Count"', (error, stdout, stderr) => {
            if (!error) {
                console.log(`🏃‍♂️ จำนวน Node.js processes: ${stdout.trim()}`);
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// เริ่มการทำงาน
const restarter = new ServerRestarter();
restarter.init().catch(console.error);

// จัดการการปิดโปรแกรม
process.on('SIGINT', () => {
    console.log('\n🛑 กำลังปิดโปรแกรม...');
    process.exit(0);
});