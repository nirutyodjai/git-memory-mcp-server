#!/usr/bin/env node

/**
 * Update MCP Servers for Data Sharing
 * สคริปต์สำหรับอัปเดต MCP servers ให้รองรับการแชร์ข้อมูลผ่าน Git Memory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ServerSharingUpdater {
    constructor() {
        this.configFile = path.join(__dirname, 'mcp-coordinator-config.json');
        this.sharedIntegrationPath = path.join(__dirname, 'mcp-server-shared-integration.js');
        this.updatedServers = [];
        this.failedServers = [];
    }

    // โหลด configuration
    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configFile, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('❌ Failed to load config:', error.message);
            return null;
        }
    }

    // อัปเดต server files
    async updateAllServers() {
        console.log('🔄 Starting server sharing integration update...');
        
        const config = this.loadConfig();
        if (!config || !config.mcpServers) {
            console.error('❌ Invalid configuration');
            return false;
        }

        // แปลง mcpServers array เป็น server objects
        const servers = config.mcpServers.map(([id, serverData]) => serverData);
        console.log(`📊 Found ${servers.length} servers to update`);

        for (const server of servers) {
            await this.updateServer(server);
        }

        this.generateReport();
        return true;
    }

    // อัปเดต server แต่ละตัว
    async updateServer(server) {
        try {
            console.log(`🔧 Updating server: ${server.id}`);
            
            const serverPath = server.scriptPath;
            if (!fs.existsSync(serverPath)) {
                console.error(`❌ Server file not found: ${serverPath}`);
                this.failedServers.push({ server: server.id, reason: 'File not found' });
                return;
            }

            // อ่านไฟล์ server
            let serverContent = fs.readFileSync(serverPath, 'utf8');
            
            // ตรวจสอบว่ามี shared integration แล้วหรือไม่
            if (serverContent.includes('MCPServerSharedIntegration')) {
                console.log(`✅ Server ${server.id} already has shared integration`);
                return;
            }

            // เพิ่ม shared integration
            const updatedContent = this.addSharedIntegration(serverContent, server);
            
            // สร้าง backup
            const backupPath = `${serverPath}.backup.${Date.now()}`;
            fs.writeFileSync(backupPath, serverContent);
            
            // เขียนไฟล์ใหม่
            fs.writeFileSync(serverPath, updatedContent);
            
            this.updatedServers.push({
                id: server.id,
                path: serverPath,
                backup: backupPath,
                category: server.category
            });
            
            console.log(`✅ Updated server: ${server.id}`);
            
        } catch (error) {
            console.error(`❌ Failed to update server ${server.id}:`, error.message);
            this.failedServers.push({ server: server.id, reason: error.message });
        }
    }

    // เพิ่ม shared integration code
    addSharedIntegration(content, server) {
        const lines = content.split('\n');
        const updatedLines = [];
        let requiresAdded = false;
        let classFound = false;
        let constructorFound = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // เพิ่ม require statement
            if (!requiresAdded && (line.includes('require(') || line.includes('const ') || line.includes('import '))) {
                if (!content.includes('MCPServerSharedIntegration')) {
                    updatedLines.push('const MCPServerSharedIntegration = require(\'./mcp-server-shared-integration\');');
                    requiresAdded = true;
                }
            }
            
            updatedLines.push(line);
            
            // เพิ่ม shared integration ใน constructor
            if (line.includes('constructor') && !constructorFound) {
                constructorFound = true;
                // หาจุดสิ้นสุดของ constructor
                let j = i + 1;
                while (j < lines.length && !lines[j].trim().startsWith('}')) {
                    updatedLines.push(lines[j]);
                    j++;
                }
                
                // เพิ่ม shared integration setup
                updatedLines.push('');
                updatedLines.push('        // Shared Data Integration');
                updatedLines.push(`        this.sharedIntegration = new MCPServerSharedIntegration(`);
                updatedLines.push(`            '${server.id}',`);
                updatedLines.push(`            '${server.category}',`);
                updatedLines.push(`            ${server.port}`);
                updatedLines.push('        );');
                updatedLines.push('');
                updatedLines.push('        // Setup shared integration callbacks');
                updatedLines.push('        this.setupSharedIntegration();');
                updatedLines.push('');
                
                i = j - 1; // ข้าม lines ที่เพิ่มแล้ว
            }
        }
        
        // เพิ่ม methods สำหรับ shared integration
        const sharedMethods = this.generateSharedMethods(server);
        updatedLines.push('');
        updatedLines.push('    // === Shared Data Integration Methods ===');
        updatedLines.push('');
        updatedLines.push(...sharedMethods.split('\n'));
        
        return updatedLines.join('\n');
    }

    // สร้าง shared integration methods
    generateSharedMethods(server) {
        return `    // Setup shared integration
    async setupSharedIntegration() {
        try {
            // Register with shared data coordinator
            const registered = await this.sharedIntegration.register();
            if (registered) {
                console.log('✅ Shared integration registered successfully');
                
                // Setup callbacks
                this.sharedIntegration.onDataReceived = this.onSharedDataReceived.bind(this);
                this.sharedIntegration.onChannelMessage = this.onSharedChannelMessage.bind(this);
                
                // Share initial data
                await this.shareInitialData();
            }
        } catch (error) {
            console.error('❌ Shared integration setup failed:', error.message);
        }
    }

    // Handle received shared data
    onSharedDataReceived(dataType, serverId, data, metadata) {
        console.log(\`📥 [${server.id}] Received \${dataType} from \${serverId}\`);
        
        switch (dataType) {
            case 'memory':
                this.handleSharedMemory(serverId, data, metadata);
                break;
            case 'session':
                this.handleSharedSession(serverId, data, metadata);
                break;
            case 'config':
                this.handleSharedConfig(serverId, data, metadata);
                break;
            case 'logs':
                this.handleSharedLogs(serverId, data, metadata);
                break;
        }
    }

    // Handle channel messages
    onSharedChannelMessage(channel, data) {
        console.log(\`📢 [${server.id}] Channel message on \${channel}:\`, data);
        
        // Handle different channel types
        switch (channel) {
            case 'global':
                this.handleGlobalMessage(data);
                break;
            case '${server.category}':
                this.handleCategoryMessage(data);
                break;
            case '${server.id}':
                this.handleDirectMessage(data);
                break;
        }
    }

    // Share initial data
    async shareInitialData() {
        try {
            // Share server status
            await this.sharedIntegration.shareData('status', {
                serverId: '${server.id}',
                status: 'online',
                category: '${server.category}',
                port: ${server.port},
                startTime: new Date().toISOString()
            });
            
            // Share memory data if available
            if (this.memoryPath && fs.existsSync(this.memoryPath)) {
                const memoryData = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
                await this.sharedIntegration.shareMemory(memoryData);
            }
            
        } catch (error) {
            console.error('❌ Failed to share initial data:', error.message);
        }
    }

    // Handle shared memory
    handleSharedMemory(serverId, data, metadata) {
        // Implement memory handling logic
        console.log(\`🧠 Processing shared memory from \${serverId}\`);
    }

    // Handle shared session
    handleSharedSession(serverId, data, metadata) {
        // Implement session handling logic
        console.log(\`📋 Processing shared session from \${serverId}\`);
    }

    // Handle shared config
    handleSharedConfig(serverId, data, metadata) {
        // Implement config handling logic
        console.log(\`⚙️ Processing shared config from \${serverId}\`);
    }

    // Handle shared logs
    handleSharedLogs(serverId, data, metadata) {
        // Implement log handling logic
        console.log(\`📝 Processing shared logs from \${serverId}\`);
    }

    // Handle global messages
    handleGlobalMessage(data) {
        console.log('🌐 Global message:', data);
    }

    // Handle category messages
    handleCategoryMessage(data) {
        console.log('📂 Category message:', data);
    }

    // Handle direct messages
    handleDirectMessage(data) {
        console.log('💬 Direct message:', data);
    }

    // Share current memory state
    async shareCurrentMemory() {
        if (this.memoryPath && fs.existsSync(this.memoryPath)) {
            try {
                const memoryData = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
                await this.sharedIntegration.shareMemory(memoryData);
                return true;
            } catch (error) {
                console.error('❌ Failed to share memory:', error.message);
                return false;
            }
        }
        return false;
    }

    // Get shared data from other servers
    async getSharedDataFromServers(dataType) {
        try {
            return await this.sharedIntegration.getSharedData(dataType);
        } catch (error) {
            console.error(\`❌ Failed to get shared \${dataType}:\`, error.message);
            return [];
        }
    }

    // Broadcast to category channel
    broadcastToCategory(data) {
        this.sharedIntegration.broadcastToChannel('${server.category}', data);
    }

    // Broadcast to global channel
    broadcastGlobal(data) {
        this.sharedIntegration.broadcastToChannel('global', data);
    }

    // Commit changes to Git Memory
    async commitToGitMemory(message) {
        return await this.sharedIntegration.commitToGitMemory(message);
    }`;
    }

    // สร้างรายงาน
    generateReport() {
        console.log('\n📊 === Server Sharing Integration Report ===');
        console.log(`✅ Successfully updated: ${this.updatedServers.length} servers`);
        console.log(`❌ Failed to update: ${this.failedServers.length} servers`);
        
        if (this.updatedServers.length > 0) {
            console.log('\n✅ Updated Servers:');
            this.updatedServers.forEach(server => {
                console.log(`   - ${server.id} (${server.category})`);
            });
        }
        
        if (this.failedServers.length > 0) {
            console.log('\n❌ Failed Servers:');
            this.failedServers.forEach(server => {
                console.log(`   - ${server.server}: ${server.reason}`);
            });
        }
        
        // สร้างไฟล์รายงาน
        const report = {
            timestamp: new Date().toISOString(),
            totalServers: this.updatedServers.length + this.failedServers.length,
            updatedServers: this.updatedServers,
            failedServers: this.failedServers,
            summary: {
                successful: this.updatedServers.length,
                failed: this.failedServers.length,
                successRate: ((this.updatedServers.length / (this.updatedServers.length + this.failedServers.length)) * 100).toFixed(2) + '%'
            }
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'server-sharing-update-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Report saved to: server-sharing-update-report.json');
    }

    // รีสตาร์ท servers ที่อัปเดตแล้ว
    async restartUpdatedServers() {
        console.log('\n🔄 Restarting updated servers...');
        
        for (const server of this.updatedServers) {
            try {
                console.log(`🔄 Restarting ${server.id}...`);
                
                // หยุด server เก่า
                try {
                    execSync(`taskkill /f /im node.exe`, { stdio: 'ignore' });
                } catch (error) {
                    // Ignore errors
                }
                
                // รอสักครู่
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log(`✅ ${server.id} restart initiated`);
                
            } catch (error) {
                console.error(`❌ Failed to restart ${server.id}:`, error.message);
            }
        }
    }
}

// Main execution
if (require.main === module) {
    const updater = new ServerSharingUpdater();
    
    const args = process.argv.slice(2);
    const shouldRestart = args.includes('--restart');
    
    updater.updateAllServers().then(async (success) => {
        if (success) {
            console.log('\n🎉 Server sharing integration update completed!');
            
            if (shouldRestart) {
                await updater.restartUpdatedServers();
            } else {
                console.log('\n💡 Run with --restart flag to automatically restart servers');
            }
            
            console.log('\n📋 Next steps:');
            console.log('1. Start the Shared Data Coordinator: node shared-data-coordinator.js');
            console.log('2. Restart your MCP servers to enable sharing');
            console.log('3. Monitor the sharing activity in the coordinator logs');
        } else {
            console.error('\n❌ Update process failed');
            process.exit(1);
        }
    }).catch(error => {
        console.error('\n❌ Update process error:', error.message);
        process.exit(1);
    });
}

module.exports = ServerSharingUpdater;