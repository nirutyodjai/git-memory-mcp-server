#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * แสดงรายชื่อ MCP Servers ทั้งหมดที่เชื่อมต่ออยู่
 * Shows all connected MCP Server names
 */
class ConnectedServersDisplay {
    constructor() {
        this.communityStatusFile = path.join(__dirname, 'real-community-deployment-status.json');
        this.securityStatusFile = path.join(__dirname, 'security-deployment-status.json');
    }

    /**
     * โหลดข้อมูล Community Servers
     */
    loadCommunityServers() {
        try {
            const data = JSON.parse(fs.readFileSync(this.communityStatusFile, 'utf8'));
            return {
                total: data.total,
                running: data.running,
                servers: data.runningServers || [],
                portRange: data.portRange
            };
        } catch (error) {
            console.error('❌ ไม่สามารถโหลดข้อมูล Community Servers:', error.message);
            return { total: 0, running: 0, servers: [], portRange: null };
        }
    }

    /**
     * โหลดข้อมูล Security Servers
     */
    loadSecurityServers() {
        try {
            const data = JSON.parse(fs.readFileSync(this.securityStatusFile, 'utf8'));
            return {
                total: data.total,
                running: data.running,
                servers: data.runningServers || [],
                details: data.serverDetails || [],
                portRange: { start: 9346, end: 9499 }
            };
        } catch (error) {
            console.error('❌ ไม่สามารถโหลดข้อมูล Security Servers:', error.message);
            return { total: 0, running: 0, servers: [], details: [], portRange: null };
        }
    }

    /**
     * แสดงรายชื่อ servers แบบแบ่งหมวดหมู่
     */
    displayServersByCategory(servers, title, portRange) {
        console.log(`\n🔷 ${title}`);
        console.log('='.repeat(60));
        
        if (portRange) {
            console.log(`📡 Port Range: ${portRange.start} - ${portRange.end}`);
        }
        console.log(`📊 Total Servers: ${servers.length}`);
        console.log('');

        // แบ่งเป็นคอลัมน์เพื่อแสดงผลให้สวยงาม
        const columns = 3;
        const itemsPerColumn = Math.ceil(servers.length / columns);
        
        for (let i = 0; i < itemsPerColumn; i++) {
            let row = '';
            for (let col = 0; col < columns; col++) {
                const index = col * itemsPerColumn + i;
                if (index < servers.length) {
                    const serverName = servers[index].replace('mcp-server-', '');
                    row += `${(index + 1).toString().padStart(3)}.${serverName.padEnd(25)}`;
                }
            }
            if (row.trim()) {
                console.log(row);
            }
        }
    }

    /**
     * โหลดข้อมูล AI/ML Servers
     */
    loadAIMLServers() {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'aiml-deployment-status.json'), 'utf8'));
            return {
                total: data.total,
                running: data.running,
                servers: data.runningServers || [],
                portRange: { start: 9500, end: 10499 }
            };
        } catch (error) {
            console.error('❌ ไม่สามารถโหลดข้อมูล AI/ML Servers:', error.message);
            return { total: 0, running: 0, servers: [], portRange: null };
        }
    }

    /**
     * โหลดข้อมูล Enterprise Servers
     */
    loadEnterpriseServers() {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'enterprise-deployment-status.json'), 'utf8'));
            return {
                total: data.total,
                running: data.running,
                servers: data.runningServers || [],
                portRange: { start: 10500, end: 11999 }
            };
        } catch (error) {
            console.error('❌ ไม่สามารถโหลดข้อมูล Enterprise Servers:', error.message);
            return { total: 0, running: 0, servers: [], portRange: null };
        }
    }

    /**
     * แสดงสถิติโดยรวม
     */
    displayOverallStats(communityData, securityData, aimlData, enterpriseData) {
        const totalServers = communityData.total + securityData.total + aimlData.total + enterpriseData.total;
        const totalRunning = communityData.running + securityData.running + aimlData.running + enterpriseData.running;
        const healthPercentage = ((totalRunning / totalServers) * 100).toFixed(1);

        console.log('\n🌟 NEXUS IDE - 3000 MCP SERVERS สรุปสถานะ');
        console.log('='.repeat(60));
        console.log(`📈 Total MCP Servers: ${totalServers}`);
        console.log(`✅ Running Servers: ${totalRunning}`);
        console.log(`💚 Health Status: ${healthPercentage}%`);
        console.log('');
        console.log(`🏢 Community Servers: ${communityData.running}/${communityData.total} - Ports 9000-9345`);
        console.log(`🔒 Security Servers: ${securityData.running}/${securityData.total} - Ports 9346-9499`);
        console.log(`🤖 AI/ML Servers: ${aimlData.running}/${aimlData.total} - Ports 9500-10499`);
        console.log(`🏢 Enterprise Servers: ${enterpriseData.running}/${enterpriseData.total} - Ports 10500-11999`);
        
        if (healthPercentage === '100.0') {
            console.log('\n🎉 ALL 3000 MCP SERVERS ARE CONNECTED AND OPERATIONAL!');
        } else {
            console.log(`\n⚠️  ${totalServers - totalRunning} servers are not running`);
        }
    }

    /**
     * แสดงข้อมูล Security Servers พร้อม tools
     */
    displaySecurityServersWithTools(securityData) {
        if (securityData.details && securityData.details.length > 0) {
            console.log('\n🔧 Security Servers พร้อม Tools');
            console.log('='.repeat(60));
            
            securityData.details.slice(0, 10).forEach((server, index) => {
                const serverName = server.name.replace('mcp-server-', '');
                const tools = server.tools ? server.tools.join(', ') : 'N/A';
                console.log(`${(index + 1).toString().padStart(2)}. ${serverName} (Port: ${server.port})`);
                console.log(`    Tools: ${tools}`);
                console.log('');
            });
            
            if (securityData.details.length > 10) {
                console.log(`... และอีก ${securityData.details.length - 10} servers`);
            }
        }
    }

    /**
     * แสดงรายชื่อ servers ทั้งหมด
     */
    async displayAllConnectedServers() {
        console.log('🚀 NEXUS IDE - 3000 MCP SERVERS CONNECTION STATUS');
        console.log('='.repeat(60));
        console.log('📅 Generated:', new Date().toLocaleString('th-TH'));
        
        // โหลดข้อมูล
        const communityData = this.loadCommunityServers();
        const securityData = this.loadSecurityServers();
        const aimlData = this.loadAIMLServers();
        const enterpriseData = this.loadEnterpriseServers();
        
        // แสดงสถิติโดยรวม
        this.displayOverallStats(communityData, securityData, aimlData, enterpriseData);
        
        // แสดง Community Servers
        this.displayServersByCategory(
            communityData.servers,
            'Community Servers (General Purpose)',
            communityData.portRange
        );
        
        // แสดง Security Servers
        this.displayServersByCategory(
            securityData.servers,
            'Security Servers (Security & Compliance)',
            securityData.portRange
        );
        
        // แสดง AI/ML Servers
        this.displayServersByCategory(
            aimlData.servers,
            'AI/ML Servers (Machine Learning & AI)',
            aimlData.portRange
        );
        
        // แสดง Enterprise Servers
        this.displayServersByCategory(
            enterpriseData.servers,
            'Enterprise Servers (Business & Integration)',
            enterpriseData.portRange
        );
        
        // แสดง Security Servers พร้อม tools (ตัวอย่าง)
        this.displaySecurityServersWithTools(securityData);
        
        console.log('\n' + '='.repeat(60));
        console.log('✨ การแสดงรายชื่อ 3000 MCP Servers เสร็จสิ้น');
        console.log('💡 Tip: ใช้ quick-community-validation.js หรือ full-system-validation.js เพื่อทดสอบสถานะ');
    }
}

// รันสคริปต์
if (require.main === module) {
    const display = new ConnectedServersDisplay();
    display.displayAllConnectedServers().catch(console.error);
}

module.exports = ConnectedServersDisplay;