#!/usr/bin/env node

/**
 * GitHub MCP Server: git-server
 * Tools to read, search, and manipulate Git repositories
 * Port: 4002
 */

const { spawn } = require('child_process');
const path = require('path');

class gitserverServer {
    constructor() {
        this.port = 4002;
        this.name = 'git-server';
        this.type = 'git';
        this.description = 'Tools to read, search, and manipulate Git repositories';
        this.serverPath = 'D:\Ai Server\git-memory-mcp-server\github-servers\git-server\src\git';
    }
    
    async start() {
        try {
            console.log(`🚀 Starting ${this.name} on port ${this.port}...`);
            
            const serverProcess = spawn('node', [
                'D:\Ai',
                'Server\git-memory-mcp-server\github-servers\git-server\src\git\index.js'
            ], {
                cwd: this.serverPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    PORT: this.port.toString(),
                    MCP_SERVER_NAME: this.name
                }
            });
            
            serverProcess.stdout.on('data', (data) => {
                console.log(`[${this.name}] ${data.toString().trim()}`);
            });
            
            serverProcess.stderr.on('data', (data) => {
                console.error(`[${this.name}] ERROR: ${data.toString().trim()}`);
            });
            
            serverProcess.on('close', (code) => {
                console.log(`[${this.name}] Process exited with code ${code}`);
            });
            
            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log(`✅ ${this.name} started successfully`);
            return serverProcess;
            
        } catch (error) {
            console.error(`❌ Failed to start ${this.name}:`, error.message);
            throw error;
        }
    }
}

if (require.main === module) {
    const server = new gitserverServer();
    server.start().catch(console.error);
}

module.exports = gitserverServer;
