#!/usr/bin/env node

/**
 * GitHub Data Connection MCP Servers Manager
 * Adds specialized MCP servers for enhanced GitHub data connectivity
 * Focus: Data integration, analytics, and advanced GitHub operations
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class GitHubDataServersManager {
    constructor() {
        this.baseDir = process.cwd();
        this.githubServersDir = path.join(this.baseDir, 'github-data-servers');
        this.configFile = path.join(this.baseDir, 'mcp-coordinator-config.json');
        this.startPort = 5000;
        this.serverProcesses = new Map();
        
        // Specialized GitHub data connection servers
        this.dataServers = [
            {
                name: 'github-analytics-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5001,
                category: 'analytics',
                description: 'GitHub repository analytics and insights',
                features: ['commit analysis', 'contributor stats', 'code metrics']
            },
            {
                name: 'github-issues-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git', 
                subPath: 'src/github',
                port: 5002,
                category: 'project-management',
                description: 'GitHub Issues and Project management',
                features: ['issue tracking', 'milestone management', 'project boards']
            },
            {
                name: 'github-actions-mcp',
                repo: 'https://github.com/punkpeye/github-actions-mcp.git',
                port: 5003,
                category: 'ci-cd',
                description: 'GitHub Actions workflow management',
                features: ['workflow automation', 'build monitoring', 'deployment tracking']
            },
            {
                name: 'github-security-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5004,
                category: 'security',
                description: 'GitHub security and vulnerability scanning',
                features: ['security alerts', 'dependency scanning', 'code scanning']
            },
            {
                name: 'github-releases-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5005,
                category: 'release-management',
                description: 'GitHub releases and version management',
                features: ['release automation', 'changelog generation', 'version tracking']
            },
            {
                name: 'github-webhooks-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5006,
                category: 'integration',
                description: 'GitHub webhooks and event handling',
                features: ['webhook management', 'event processing', 'real-time notifications']
            },
            {
                name: 'github-search-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5007,
                category: 'search',
                description: 'Advanced GitHub search and discovery',
                features: ['code search', 'repository discovery', 'user search']
            },
            {
                name: 'github-graphql-mcp',
                repo: 'https://github.com/octokit/graphql.js.git',
                port: 5008,
                category: 'api',
                description: 'GitHub GraphQL API integration',
                features: ['GraphQL queries', 'advanced data fetching', 'schema exploration']
            },
            {
                name: 'github-pages-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5009,
                category: 'hosting',
                description: 'GitHub Pages deployment and management',
                features: ['static site deployment', 'custom domains', 'build automation']
            },
            {
                name: 'github-packages-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5010,
                category: 'package-management',
                description: 'GitHub Packages registry management',
                features: ['package publishing', 'registry management', 'dependency tracking']
            },
            {
                name: 'github-codespaces-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5011,
                category: 'development',
                description: 'GitHub Codespaces management',
                features: ['codespace creation', 'environment management', 'remote development']
            },
            {
                name: 'github-discussions-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5012,
                category: 'community',
                description: 'GitHub Discussions and community management',
                features: ['discussion threads', 'community engagement', 'Q&A management']
            },
            {
                name: 'github-sponsors-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5013,
                category: 'monetization',
                description: 'GitHub Sponsors and funding management',
                features: ['sponsorship tracking', 'funding goals', 'supporter management']
            },
            {
                name: 'github-copilot-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5014,
                category: 'ai-assistance',
                description: 'GitHub Copilot integration and AI assistance',
                features: ['code suggestions', 'AI-powered development', 'productivity enhancement']
            },
            {
                name: 'github-enterprise-mcp',
                repo: 'https://github.com/modelcontextprotocol/servers.git',
                subPath: 'src/github',
                port: 5015,
                category: 'enterprise',
                description: 'GitHub Enterprise features and management',
                features: ['enterprise administration', 'organization management', 'compliance tracking']
            }
        ];
    }

    async init() {
        console.log('🚀 Initializing GitHub Data Servers Manager...');
        
        // Create directories
        if (!fs.existsSync(this.githubServersDir)) {
            fs.mkdirSync(this.githubServersDir, { recursive: true });
        }
        
        console.log(`📁 Created directory: ${this.githubServersDir}`);
    }

    async cloneServer(server) {
        const serverPath = path.join(this.githubServersDir, server.name);
        
        try {
            if (fs.existsSync(serverPath)) {
                console.log(`📦 ${server.name} already exists, updating...`);
                process.chdir(serverPath);
                execSync('git pull', { stdio: 'inherit' });
            } else {
                console.log(`📥 Cloning ${server.name}...`);
                execSync(`git clone ${server.repo} "${serverPath}"`, { stdio: 'inherit' });
            }
            
            // Navigate to specific subpath if specified
            const workingDir = server.subPath ? path.join(serverPath, server.subPath) : serverPath;
            
            if (fs.existsSync(workingDir)) {
                process.chdir(workingDir);
                
                // Install dependencies
                if (fs.existsSync('package.json')) {
                    console.log(`📦 Installing dependencies for ${server.name}...`);
                    execSync('npm install', { stdio: 'inherit' });
                }
                
                // Build if needed
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                if (packageJson.scripts && packageJson.scripts.build) {
                    console.log(`🔨 Building ${server.name}...`);
                    execSync('npm run build', { stdio: 'inherit' });
                }
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Error setting up ${server.name}:`, error.message);
            return false;
        } finally {
            process.chdir(this.baseDir);
        }
    }

    async startServer(server) {
        const serverPath = path.join(this.githubServersDir, server.name);
        const workingDir = server.subPath ? path.join(serverPath, server.subPath) : serverPath;
        
        if (!fs.existsSync(workingDir)) {
            console.log(`❌ Server directory not found: ${workingDir}`);
            return false;
        }
        
        try {
            console.log(`🚀 Starting ${server.name} on port ${server.port}...`);
            
            const env = {
                ...process.env,
                PORT: server.port.toString(),
                MCP_SERVER_NAME: server.name,
                MCP_SERVER_CATEGORY: server.category
            };
            
            const serverProcess = spawn('node', ['index.js'], {
                cwd: workingDir,
                env: env,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            serverProcess.stdout.on('data', (data) => {
                console.log(`[${server.name}] ${data.toString().trim()}`);
            });
            
            serverProcess.stderr.on('data', (data) => {
                console.error(`[${server.name}] ERROR: ${data.toString().trim()}`);
            });
            
            serverProcess.on('close', (code) => {
                console.log(`[${server.name}] Process exited with code ${code}`);
                this.serverProcesses.delete(server.name);
            });
            
            this.serverProcesses.set(server.name, serverProcess);
            
            // Wait a bit to check if server started successfully
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (serverProcess.killed) {
                console.log(`❌ ${server.name} failed to start`);
                return false;
            }
            
            console.log(`✅ ${server.name} started successfully on port ${server.port}`);
            return true;
        } catch (error) {
            console.error(`❌ Error starting ${server.name}:`, error.message);
            return false;
        }
    }

    async updateConfig() {
        try {
            let config = {};
            
            if (fs.existsSync(this.configFile)) {
                config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            }
            
            if (!config.servers) {
                config.servers = [];
            }
            
            // Add new GitHub data servers to config
            for (const server of this.dataServers) {
                const existingIndex = config.servers.findIndex(s => s.name === server.name);
                
                const serverConfig = {
                    name: server.name,
                    port: server.port,
                    category: server.category,
                    description: server.description,
                    features: server.features,
                    type: 'github-data',
                    status: 'active',
                    url: `http://localhost:${server.port}`,
                    healthCheck: `/health`,
                    lastUpdated: new Date().toISOString()
                };
                
                if (existingIndex >= 0) {
                    config.servers[existingIndex] = serverConfig;
                } else {
                    config.servers.push(serverConfig);
                }
            }
            
            // Update metadata
            config.metadata = {
                ...config.metadata,
                totalServers: config.servers.length,
                githubDataServers: this.dataServers.length,
                lastUpdated: new Date().toISOString(),
                version: '2.0.0'
            };
            
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            console.log(`✅ Updated configuration: ${this.configFile}`);
            
        } catch (error) {
            console.error('❌ Error updating config:', error.message);
        }
    }

    async installAll() {
        console.log('📦 Installing all GitHub data servers...');
        
        let successCount = 0;
        let failCount = 0;
        
        for (const server of this.dataServers) {
            console.log(`\n🔄 Processing ${server.name}...`);
            
            const success = await this.cloneServer(server);
            if (success) {
                successCount++;
                console.log(`✅ ${server.name} installed successfully`);
            } else {
                failCount++;
                console.log(`❌ ${server.name} installation failed`);
            }
        }
        
        console.log(`\n📊 Installation Summary:`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`📈 Success Rate: ${((successCount / this.dataServers.length) * 100).toFixed(1)}%`);
    }

    async startAll() {
        console.log('🚀 Starting all GitHub data servers...');
        
        let successCount = 0;
        let failCount = 0;
        
        for (const server of this.dataServers) {
            console.log(`\n🔄 Starting ${server.name}...`);
            
            const success = await this.startServer(server);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
            
            // Small delay between starts
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n📊 Startup Summary:`);
        console.log(`✅ Started: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`🏃 Running Servers: ${this.serverProcesses.size}`);
        console.log(`📈 Success Rate: ${((successCount / this.dataServers.length) * 100).toFixed(1)}%`);
    }

    async status() {
        console.log('📊 GitHub Data Servers Status:');
        console.log(`🏃 Running Processes: ${this.serverProcesses.size}`);
        
        for (const [name, process] of this.serverProcesses) {
            const server = this.dataServers.find(s => s.name === name);
            console.log(`  ✅ ${name} (Port: ${server?.port}) - PID: ${process.pid}`);
        }
        
        console.log(`\n📋 Available Servers:`);
        for (const server of this.dataServers) {
            const isRunning = this.serverProcesses.has(server.name);
            const status = isRunning ? '🟢 Running' : '🔴 Stopped';
            console.log(`  ${status} ${server.name} - ${server.description}`);
            console.log(`    📍 Port: ${server.port} | Category: ${server.category}`);
            console.log(`    🔧 Features: ${server.features.join(', ')}`);
        }
    }

    async stop() {
        console.log('🛑 Stopping all GitHub data servers...');
        
        for (const [name, process] of this.serverProcesses) {
            try {
                process.kill('SIGTERM');
                console.log(`🛑 Stopped ${name}`);
            } catch (error) {
                console.error(`❌ Error stopping ${name}:`, error.message);
            }
        }
        
        this.serverProcesses.clear();
        console.log('✅ All servers stopped');
    }
}

// CLI Interface
async function main() {
    const manager = new GitHubDataServersManager();
    await manager.init();
    
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'install':
            await manager.installAll();
            await manager.updateConfig();
            break;
            
        case 'start':
            await manager.startAll();
            await manager.updateConfig();
            break;
            
        case 'add':
            await manager.installAll();
            await manager.startAll();
            await manager.updateConfig();
            break;
            
        case 'status':
            await manager.status();
            break;
            
        case 'stop':
            await manager.stop();
            break;
            
        case 'help':
        default:
            console.log(`
🔧 GitHub Data Servers Manager
`);
            console.log('Available commands:');
            console.log('  install  - Install all GitHub data servers');
            console.log('  start    - Start all installed servers');
            console.log('  add      - Install and start all servers');
            console.log('  status   - Show server status');
            console.log('  stop     - Stop all running servers');
            console.log('  help     - Show this help message');
            console.log(`\nExample: node add-github-data-servers.js add`);
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = GitHubDataServersManager;