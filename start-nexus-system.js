/**
 * NEXUS IDE - System Startup Script
 * สคริปต์สำหรับเริ่มต้นระบบ NEXUS ทั้งหมดพร้อมกัน
 * รวมการจัดการ 3000 MCP Servers และระบบแชร์ข้อมูลแบบรวม
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class NexusSystemStarter {
    constructor() {
        this.processes = new Map();
        this.startupOrder = [
            {
                name: 'Git Memory Coordinator',
                script: 'git-memory-coordinator.js',
                port: 9001,
                priority: 1,
                waitTime: 3000
            },
            {
                name: 'Universal Data Hub',
                script: 'universal-data-hub.js',
                port: 9002,
                priority: 2,
                waitTime: 5000
            },
            {
                name: 'NEXUS Data Integration',
                script: 'nexus-data-integration.js',
                port: 9004,
                priority: 3,
                waitTime: 3000
            },
            {
                name: 'NEXUS Master Control',
                script: 'nexus-master-control.js',
                port: 9003,
                priority: 4,
                waitTime: 5000
            },
            {
                name: 'NEXUS System Dashboard',
                script: 'nexus-system-dashboard.js',
                port: 8080,
                priority: 5,
                waitTime: 2000
            }
        ];
        
        this.config = {
            maxStartupTime: 120000, // 2 นาที
            healthCheckInterval: 10000, // 10 วินาที
            restartAttempts: 3,
            logLevel: 'info'
        };
        
        this.stats = {
            startTime: null,
            totalProcesses: 0,
            runningProcesses: 0,
            failedProcesses: 0,
            restartCount: 0
        };
        
        this.isShuttingDown = false;
    }

    async start() {
        console.log('🚀 เริ่มต้นระบบ NEXUS IDE...');
        console.log('=' .repeat(60));
        
        this.stats.startTime = new Date();
        
        try {
            // ตรวจสอบความพร้อมของระบบ
            await this.checkSystemRequirements();
            
            // สร้างไดเรกทอรีที่จำเป็น
            await this.createDirectories();
            
            // เริ่มต้นระบบตามลำดับความสำคัญ
            await this.startSystemsInOrder();
            
            // เริ่มการตรวจสอบสุขภาพ
            this.startHealthMonitoring();
            
            // แสดงสถานะเริ่มต้น
            await this.displaySystemStatus();
            
            console.log('\n✅ ระบบ NEXUS IDE เริ่มต้นสำเร็จ!');
            console.log('🌐 เข้าถึง Dashboard ได้ที่: http://localhost:8080');
            console.log('🎮 ใช้ Master Control Client: node nexus-master-client.js');
            
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้นระบบ:', error.message);
            await this.shutdown();
            process.exit(1);
        }
    }

    async checkSystemRequirements() {
        console.log('🔍 ตรวจสอบความพร้อมของระบบ...');
        
        // ตรวจสอบ Node.js version
        const nodeVersion = process.version;
        console.log(`   📦 Node.js: ${nodeVersion}`);
        
        // ตรวจสอบ RAM
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(1);
        console.log(`   🧠 Memory: ${(freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB free / ${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB total (${memoryUsage}% used)`);
        
        // ตรวจสอบ CPU
        const cpus = os.cpus();
        console.log(`   🖥️  CPU: ${cpus.length} cores - ${cpus[0].model}`);
        
        // ตรวจสอบพอร์ตที่จำเป็น
        console.log('   🔌 ตรวจสอบพอร์ต...');
        for (const system of this.startupOrder) {
            const isPortFree = await this.checkPort(system.port);
            if (!isPortFree) {
                throw new Error(`พอร์ต ${system.port} สำหรับ ${system.name} ถูกใช้งานอยู่`);
            }
            console.log(`      ✅ พอร์ต ${system.port} (${system.name}): ว่าง`);
        }
        
        console.log('✅ ระบบพร้อมใช้งาน\n');
    }

    async checkPort(port) {
        return new Promise((resolve) => {
            const { createServer } = require('net');
            const server = createServer();
            
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            
            server.on('error', () => resolve(false));
        });
    }

    async createDirectories() {
        console.log('📁 สร้างไดเรกทอรีที่จำเป็น...');
        
        const directories = [
            'logs',
            'data',
            'backups',
            'temp',
            'cache'
        ];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`   ✅ สร้าง ${dir}/`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
                console.log(`   📁 ${dir}/ มีอยู่แล้ว`);
            }
        }
        
        console.log('✅ ไดเรกทอรีพร้อมใช้งาน\n');
    }

    async startSystemsInOrder() {
        console.log('🔄 เริ่มต้นระบบตามลำดับความสำคัญ...');
        
        // เรียงตามความสำคัญ
        const sortedSystems = [...this.startupOrder].sort((a, b) => a.priority - b.priority);
        
        for (const system of sortedSystems) {
            console.log(`\n🚀 เริ่มต้น ${system.name}...`);
            
            try {
                await this.startProcess(system);
                console.log(`   ✅ ${system.name} เริ่มต้นสำเร็จ (พอร์ต ${system.port})`);
                
                // รอให้ระบบเริ่มต้นเสร็จสมบูรณ์
                console.log(`   ⏳ รอ ${system.waitTime/1000} วินาที...`);
                await this.sleep(system.waitTime);
                
                // ตรวจสอบสถานะ
                const isHealthy = await this.checkProcessHealth(system);
                if (!isHealthy) {
                    throw new Error(`${system.name} ไม่ตอบสนอง`);
                }
                
                this.stats.runningProcesses++;
                
            } catch (error) {
                console.error(`   ❌ ${system.name} เริ่มต้นล้มเหลว: ${error.message}`);
                this.stats.failedProcesses++;
                
                // ลองเริ่มใหม่
                if (this.config.restartAttempts > 0) {
                    console.log(`   🔄 ลองเริ่มใหม่ ${system.name}...`);
                    await this.retryStartProcess(system);
                }
            }
        }
        
        this.stats.totalProcesses = this.startupOrder.length;
        console.log('\n✅ เริ่มต้นระบบทั้งหมดเสร็จสิ้น');
    }

    async startProcess(system) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, system.script);
            
            // ตรวจสอบว่าไฟล์มีอยู่
            if (!require('fs').existsSync(scriptPath)) {
                reject(new Error(`ไม่พบไฟล์ ${system.script}`));
                return;
            }
            
            const process = spawn('node', [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    NEXUS_SYSTEM: 'true'
                }
            });
            
            // เก็บข้อมูล process
            this.processes.set(system.name, {
                process,
                system,
                startTime: new Date(),
                restartCount: 0
            });
            
            // จัดการ output
            process.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    console.log(`   [${system.name}] ${message}`);
                }
            });
            
            process.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    console.error(`   [${system.name}] ERROR: ${message}`);
                }
            });
            
            // จัดการเมื่อ process จบ
            process.on('close', (code) => {
                console.log(`   [${system.name}] Process จบด้วยรหัส ${code}`);
                
                if (!this.isShuttingDown && code !== 0) {
                    // Process ตายโดยไม่คาดคิด - ลองเริ่มใหม่
                    setTimeout(() => {
                        this.restartProcess(system.name);
                    }, 5000);
                }
            });
            
            process.on('error', (error) => {
                console.error(`   [${system.name}] Process error: ${error.message}`);
                reject(error);
            });
            
            // รอให้ process เริ่มต้น
            setTimeout(() => {
                if (process.killed) {
                    reject(new Error('Process ถูกหยุดก่อนเวลา'));
                } else {
                    resolve();
                }
            }, 2000);
        });
    }

    async retryStartProcess(system) {
        for (let attempt = 1; attempt <= this.config.restartAttempts; attempt++) {
            console.log(`   🔄 ความพยายามที่ ${attempt}/${this.config.restartAttempts}`);
            
            try {
                await this.sleep(2000 * attempt); // รอนานขึ้นในแต่ละครั้ง
                await this.startProcess(system);
                
                const isHealthy = await this.checkProcessHealth(system);
                if (isHealthy) {
                    console.log(`   ✅ ${system.name} เริ่มต้นสำเร็จในความพยายามที่ ${attempt}`);
                    this.stats.runningProcesses++;
                    this.stats.restartCount++;
                    return;
                }
            } catch (error) {
                console.error(`   ❌ ความพยายามที่ ${attempt} ล้มเหลว: ${error.message}`);
            }
        }
        
        console.error(`   💀 ${system.name} ไม่สามารถเริ่มต้นได้หลังจากพยายาม ${this.config.restartAttempts} ครั้ง`);
        this.stats.failedProcesses++;
    }

    async checkProcessHealth(system) {
        // ตรวจสอบว่า process ยังทำงานอยู่
        const processInfo = this.processes.get(system.name);
        if (!processInfo || processInfo.process.killed) {
            return false;
        }
        
        // ตรวจสอบพอร์ต (ถ้ามี)
        if (system.port) {
            try {
                const isPortOpen = await this.checkPortOpen(system.port);
                return isPortOpen;
            } catch (error) {
                return false;
            }
        }
        
        return true;
    }

    async checkPortOpen(port) {
        return new Promise((resolve) => {
            const { createConnection } = require('net');
            const socket = createConnection(port, 'localhost');
            
            socket.on('connect', () => {
                socket.end();
                resolve(true);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            setTimeout(() => {
                socket.destroy();
                resolve(false);
            }, 3000);
        });
    }

    startHealthMonitoring() {
        console.log('\n🏥 เริ่มการตรวจสอบสุขภาพระบบ...');
        
        setInterval(async () => {
            if (this.isShuttingDown) return;
            
            let healthyCount = 0;
            let unhealthyCount = 0;
            
            for (const [name, processInfo] of this.processes) {
                const isHealthy = await this.checkProcessHealth(processInfo.system);
                
                if (isHealthy) {
                    healthyCount++;
                } else {
                    unhealthyCount++;
                    console.warn(`⚠️  ${name} ไม่ตอบสนอง - กำลังลองเริ่มใหม่...`);
                    await this.restartProcess(name);
                }
            }
            
            // อัปเดตสถิติ
            this.stats.runningProcesses = healthyCount;
            this.stats.failedProcesses = unhealthyCount;
            
        }, this.config.healthCheckInterval);
    }

    async restartProcess(processName) {
        const processInfo = this.processes.get(processName);
        if (!processInfo) return;
        
        console.log(`🔄 กำลัง restart ${processName}...`);
        
        // หยุด process เก่า
        if (processInfo.process && !processInfo.process.killed) {
            processInfo.process.kill('SIGTERM');
            await this.sleep(2000);
            
            if (!processInfo.process.killed) {
                processInfo.process.kill('SIGKILL');
            }
        }
        
        // เริ่ม process ใหม่
        try {
            await this.startProcess(processInfo.system);
            processInfo.restartCount++;
            this.stats.restartCount++;
            console.log(`✅ ${processName} restart สำเร็จ`);
        } catch (error) {
            console.error(`❌ ${processName} restart ล้มเหลว: ${error.message}`);
        }
    }

    async displaySystemStatus() {
        console.log('\n📊 สถานะระบบ NEXUS IDE:');
        console.log('=' .repeat(60));
        
        const uptime = Date.now() - this.stats.startTime.getTime();
        const uptimeFormatted = this.formatUptime(uptime);
        
        console.log(`🕐 เวลาเริ่มต้น: ${this.stats.startTime.toLocaleString('th-TH')}`);
        console.log(`⏱️  Uptime: ${uptimeFormatted}`);
        console.log(`🖥️  ระบบทั้งหมด: ${this.stats.totalProcesses}`);
        console.log(`🟢 ระบบที่ทำงาน: ${this.stats.runningProcesses}`);
        console.log(`🔴 ระบบที่ล้มเหลว: ${this.stats.failedProcesses}`);
        console.log(`🔄 จำนวน restart: ${this.stats.restartCount}`);
        
        console.log('\n🔧 รายละเอียดระบบ:');
        for (const [name, processInfo] of this.processes) {
            const isHealthy = await this.checkProcessHealth(processInfo.system);
            const status = isHealthy ? '🟢 ทำงาน' : '🔴 หยุด';
            const processUptime = Date.now() - processInfo.startTime.getTime();
            const processUptimeFormatted = this.formatUptime(processUptime);
            
            console.log(`   ${status} ${name} (พอร์ต ${processInfo.system.port}) - Uptime: ${processUptimeFormatted}`);
            if (processInfo.restartCount > 0) {
                console.log(`      🔄 Restart: ${processInfo.restartCount} ครั้ง`);
            }
        }
        
        console.log('=' .repeat(60));
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    async shutdown() {
        console.log('\n🛑 กำลังปิดระบบ NEXUS IDE...');
        this.isShuttingDown = true;
        
        // หยุด process ทั้งหมด
        for (const [name, processInfo] of this.processes) {
            console.log(`   🔌 หยุด ${name}...`);
            
            if (processInfo.process && !processInfo.process.killed) {
                processInfo.process.kill('SIGTERM');
                
                // รอ 5 วินาที แล้วใช้ SIGKILL ถ้ายังไม่หยุด
                setTimeout(() => {
                    if (!processInfo.process.killed) {
                        processInfo.process.kill('SIGKILL');
                    }
                }, 5000);
            }
        }
        
        // รอให้ process ทั้งหมดหยุด
        await this.sleep(3000);
        
        console.log('✅ ปิดระบบเรียบร้อย');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export สำหรับใช้งานจากไฟล์อื่น
module.exports = NexusSystemStarter;

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
    const starter = new NexusSystemStarter();
    
    // จัดการ command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    async function main() {
        switch (command) {
            case 'start':
            case undefined:
                await starter.start();
                break;
                
            case 'status':
                await starter.displaySystemStatus();
                break;
                
            case 'stop':
                await starter.shutdown();
                process.exit(0);
                break;
                
            case 'help':
                console.log('🚀 NEXUS IDE System Starter');
                console.log('=' .repeat(40));
                console.log('คำสั่งที่ใช้ได้:');
                console.log('  start   - เริ่มต้นระบบทั้งหมด (default)');
                console.log('  status  - แสดงสถานะระบบ');
                console.log('  stop    - หยุดระบบทั้งหมด');
                console.log('  help    - แสดงความช่วยเหลือ');
                console.log('\nตัวอย่าง:');
                console.log('  node start-nexus-system.js');
                console.log('  node start-nexus-system.js start');
                console.log('  node start-nexus-system.js status');
                break;
                
            default:
                console.error(`❌ ไม่รู้จักคำสั่ง: ${command}`);
                console.log('ใช้ "help" เพื่อดูคำสั่งที่ใช้ได้');
                process.exit(1);
        }
    }
    
    // จัดการ graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 ได้รับสัญญาณหยุด...');
        await starter.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 ได้รับสัญญาณ terminate...');
        await starter.shutdown();
        process.exit(0);
    });
    
    main().catch(error => {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    });
}