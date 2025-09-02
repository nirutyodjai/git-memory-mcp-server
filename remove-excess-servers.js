#!/usr/bin/env node
/**
 * Remove Excess Servers Script
 * สคริปต์สำหรับลบ MCP Servers ที่เกินความจำเป็นเมื่อระบบต้องการ scale down
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class ExcessServerRemover {
    constructor() {
        this.removedServers = [];
        this.failedRemovals = [];
    }
    
    /**
     * ลบ servers ที่เกิน
     */
    async removeServers(count) {
        console.log(`🗑️  กำลังลบ ${count} MCP Servers ที่เกิน...`);
        
        try {
            // ดึงรายการ servers ที่มีอยู่
            const existingServers = await this.getExistingServers();
            
            if (existingServers.length === 0) {
                console.log('⚠️  ไม่พบ servers ที่จะลบ');
                return {
                    success: true,
                    removed: 0,
                    message: 'No servers to remove'
                };
            }
            
            // เลือก servers ที่จะลบ (เลือกจากท้ายสุดก่อน - LIFO)
            const serversToRemove = this.selectServersToRemove(existingServers, count);
            
            console.log(`📋 เลือก ${serversToRemove.length} servers สำหรับลบ`);
            
            // ลบ servers ทีละตัว
            for (let i = 0; i < serversToRemove.length; i++) {
                const server = serversToRemove[i];
                console.log(`🔄 กำลังลบ server ${i + 1}/${serversToRemove.length}: ${server.id}`);
                
                try {
                    await this.removeSingleServer(server);
                    this.removedServers.push(server);
                    console.log(`✅ ลบ ${server.id} สำเร็จ`);
                } catch (error) {
                    console.error(`❌ ลบ ${server.id} ล้มเหลว:`, error.message);
                    this.failedRemovals.push({ server, error: error.message });
                }
                
                // รอ 500ms ระหว่างการลบแต่ละตัว
                if (i < serversToRemove.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // อัปเดตไฟล์ servers.json
            await this.updateServersList();
            
            const successCount = this.removedServers.length;
            const failCount = this.failedRemovals.length;
            
            console.log(`\n📊 สรุปผลการลบ:`);
            console.log(`   ✅ สำเร็จ: ${successCount}`);
            console.log(`   ❌ ล้มเหลว: ${failCount}`);
            
            if (this.failedRemovals.length > 0) {
                console.log(`\n⚠️  Servers ที่ลบไม่สำเร็จ:`);
                this.failedRemovals.forEach(({ server, error }) => {
                    console.log(`   - ${server.id}: ${error}`);
                });
            }
            
            return {
                success: failCount === 0,
                removed: successCount,
                failed: failCount,
                removedServers: this.removedServers,
                failedRemovals: this.failedRemovals
            };
            
        } catch (error) {
            console.error('❌ Error removing servers:', error.message);
            return {
                success: false,
                error: error.message,
                removed: this.removedServers.length
            };
        }
    }
    
    /**
     * เลือก servers ที่จะลบ
     */
    selectServersToRemove(servers, count) {
        // เรียงตาม startTime (ใหม่สุดก่อน) และเลือกตามจำนวนที่ต้องการ
        const sortedServers = servers
            .filter(server => server.status !== 'removing') // ไม่เลือก servers ที่กำลังถูกลบ
            .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0))
            .slice(0, Math.min(count, servers.length));
        
        return sortedServers;
    }
    
    /**
     * ลบ server เดียว
     */
    async removeSingleServer(server) {
        const { id, port, pid } = server;
        
        try {
            // 1. ส่งสัญญาณ graceful shutdown ไปยัง server
            if (port) {
                await this.sendShutdownSignal(port);
                await new Promise(resolve => setTimeout(resolve, 2000)); // รอ 2 วินาที
            }
            
            // 2. ฆ่า process ถ้ายังทำงานอยู่
            if (pid) {
                await this.killProcess(pid);
            }
            
            // 3. ลบไฟล์และโฟลเดอร์ที่เกี่ยวข้อง
            await this.cleanupServerFiles(id);
            
            console.log(`🧹 ทำความสะอาด ${id} เสร็จสิ้น`);
            
        } catch (error) {
            throw new Error(`Failed to remove server ${id}: ${error.message}`);
        }
    }
    
    /**
     * ส่งสัญญาณ shutdown ไปยัง server
     */
    async sendShutdownSignal(port) {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}/shutdown`, (res) => {
                console.log(`📡 ส่งสัญญาณ shutdown ไปยัง port ${port}`);
                resolve();
            });
            
            req.on('error', () => {
                // ไม่สำคัญถ้า request ล้มเหลว เพราะ server อาจปิดไปแล้ว
                resolve();
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                resolve();
            });
        });
    }
    
    /**
     * ฆ่า process
     */
    async killProcess(pid) {
        return new Promise((resolve, reject) => {
            // ตรวจสอบว่า process ยังทำงานอยู่หรือไม่
            exec(`tasklist /FI "PID eq ${pid}"`, (error, stdout) => {
                if (error || !stdout.includes(pid.toString())) {
                    console.log(`🔍 Process ${pid} ไม่ทำงานอยู่แล้ว`);
                    resolve();
                    return;
                }
                
                // ฆ่า process
                exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
                    if (killError) {
                        console.warn(`⚠️  ไม่สามารถฆ่า process ${pid}: ${killError.message}`);
                        // ไม่ reject เพราะอาจเป็นเพราะ process ปิดไปแล้ว
                    } else {
                        console.log(`💀 ฆ่า process ${pid} สำเร็จ`);
                    }
                    resolve();
                });
            });
        });
    }
    
    /**
     * ทำความสะอาดไฟล์ของ server
     */
    async cleanupServerFiles(serverId) {
        try {
            // ลบโฟลเดอร์ server (ถ้ามี)
            const serverDir = path.join(__dirname, 'servers', serverId);
            try {
                await fs.rmdir(serverDir, { recursive: true });
                console.log(`🗂️  ลบโฟลเดอร์ ${serverDir}`);
            } catch (error) {
                // ไม่สำคัญถ้าไม่มีโฟลเดอร์
            }
            
            // ลบไฟล์ log (ถ้ามี)
            const logFile = path.join(__dirname, 'logs', `${serverId}.log`);
            try {
                await fs.unlink(logFile);
                console.log(`📄 ลบไฟล์ log ${logFile}`);
            } catch (error) {
                // ไม่สำคัญถ้าไม่มีไฟล์ log
            }
            
            // ลบไฟล์ config (ถ้ามี)
            const configFile = path.join(__dirname, 'configs', `${serverId}.json`);
            try {
                await fs.unlink(configFile);
                console.log(`⚙️  ลบไฟล์ config ${configFile}`);
            } catch (error) {
                // ไม่สำคัญถ้าไม่มีไฟล์ config
            }
            
        } catch (error) {
            console.warn(`⚠️  ทำความสะอาดไฟล์ ${serverId} ไม่สมบูรณ์: ${error.message}`);
        }
    }
    
    /**
     * ดึงข้อมูล servers ที่มีอยู่
     */
    async getExistingServers() {
        try {
            const serversFile = path.join(__dirname, 'servers.json');
            const data = await fs.readFile(serversFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn('⚠️  ไม่พบไฟล์ servers.json');
            return [];
        }
    }
    
    /**
     * อัปเดตรายการ servers
     */
    async updateServersList() {
        try {
            const existingServers = await this.getExistingServers();
            const removedIds = this.removedServers.map(s => s.id);
            
            // กรอง servers ที่ถูกลบออก
            const updatedServers = existingServers.filter(server => 
                !removedIds.includes(server.id)
            );
            
            const serversFile = path.join(__dirname, 'servers.json');
            await fs.writeFile(serversFile, JSON.stringify(updatedServers, null, 2));
            
            console.log(`💾 อัปเดตไฟล์ servers.json (เหลือ ${updatedServers.length} servers)`);
        } catch (error) {
            console.error('❌ Error updating servers list:', error.message);
        }
    }
    
    /**
     * ตรวจสอบสถานะ server
     */
    async checkServerStatus(port) {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const status = JSON.parse(data);
                        resolve({ running: true, status });
                    } catch (error) {
                        resolve({ running: false, error: 'Invalid response' });
                    }
                });
            });
            
            req.on('error', () => {
                resolve({ running: false, error: 'Connection failed' });
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ running: false, error: 'Timeout' });
            });
        });
    }
    
    /**
     * ดึงรายการ processes ที่ทำงานอยู่
     */
    async getRunningProcesses() {
        return new Promise((resolve, reject) => {
            exec('tasklist /FO CSV', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                try {
                    const lines = stdout.split('\n').slice(1); // ข้าม header
                    const processes = lines
                        .filter(line => line.trim())
                        .map(line => {
                            const parts = line.split(',').map(part => part.replace(/"/g, ''));
                            return {
                                name: parts[0],
                                pid: parseInt(parts[1]),
                                sessionName: parts[2],
                                sessionNumber: parts[3],
                                memUsage: parts[4]
                            };
                        })
                        .filter(proc => proc.name && proc.name.toLowerCase().includes('node'));
                    
                    resolve(processes);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }
    
    /**
     * สรุปผลการลบ
     */
    getSummary() {
        return {
            totalAttempted: this.removedServers.length + this.failedRemovals.length,
            successful: this.removedServers.length,
            failed: this.failedRemovals.length,
            successRate: this.removedServers.length + this.failedRemovals.length > 0 ? 
                (this.removedServers.length / (this.removedServers.length + this.failedRemovals.length)) * 100 : 0,
            removedServers: this.removedServers.map(s => ({
                id: s.id,
                port: s.port,
                pid: s.pid
            })),
            failedRemovals: this.failedRemovals.map(f => ({
                id: f.server.id,
                error: f.error
            }))
        };
    }
}

// เรียกใช้งานจาก command line
if (require.main === module) {
    const count = parseInt(process.argv[2]) || 10;
    
    console.log('🗑️  Excess Server Remover');
    console.log('=' .repeat(50));
    console.log(`📊 จำนวน servers ที่จะลบ: ${count}`);
    
    const remover = new ExcessServerRemover();
    
    remover.removeServers(count)
        .then(result => {
            const summary = remover.getSummary();
            
            console.log('\n📋 สรุปผลการลบ:');
            console.log(`   🎯 พยายามลบ: ${summary.totalAttempted}`);
            console.log(`   ✅ สำเร็จ: ${summary.successful}`);
            console.log(`   ❌ ล้มเหลว: ${summary.failed}`);
            console.log(`   📊 อัตราสำเร็จ: ${summary.successRate.toFixed(1)}%`);
            
            if (summary.successful > 0) {
                console.log('\n✅ Servers ที่ลบสำเร็จ:');
                summary.removedServers.forEach(server => {
                    console.log(`   - ${server.id} (port: ${server.port}, pid: ${server.pid})`);
                });
            }
            
            if (summary.failed > 0) {
                console.log('\n❌ Servers ที่ลบไม่สำเร็จ:');
                summary.failedRemovals.forEach(failure => {
                    console.log(`   - ${failure.id}: ${failure.error}`);
                });
            }
            
            if (result.success) {
                console.log('\n🎉 การลบ servers เสร็จสมบูรณ์');
                process.exit(0);
            } else {
                console.log('\n⚠️  การลบ servers เสร็จสิ้นแต่มีข้อผิดพลาดบางส่วน');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error.message);
            process.exit(1);
        });
}

module.exports = ExcessServerRemover;