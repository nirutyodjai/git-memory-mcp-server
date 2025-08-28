#!/usr/bin/env node

/**
 * Install Useful GitHub MCP Servers
 * ติดตั้ง MCP servers ที่มีประโยชน์จาก GitHub repositories
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class GitHubMCPInstaller {
    constructor() {
        this.installedServers = [];
        this.failedServers = [];
        this.coordinatorUrl = 'http://localhost:3000';
        
        // รายการ MCP servers ที่มีประโยชน์จาก GitHub
        this.usefulServers = [
            {
                name: 'filesystem-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/filesystem',
                description: 'Secure file operations with configurable access controls',
                port: 4001,
                type: 'filesystem'
            },
            {
                name: 'git-server',
                repo: 'modelcontextprotocol/servers', 
                path: 'src/git',
                description: 'Tools to read, search, and manipulate Git repositories',
                port: 4002,
                type: 'git'
            },
            {
                name: 'memory-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/memory',
                description: 'Knowledge graph-based persistent memory system',
                port: 4003,
                type: 'memory'
            },
            {
                name: 'fetch-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/fetch',
                description: 'Web content fetching and conversion for efficient LLM usage',
                port: 4004,
                type: 'web'
            },
            {
                name: 'time-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/time',
                description: 'Time and timezone conversion capabilities',
                port: 4005,
                type: 'utility'
            },
            {
                name: 'puppeteer-server',
                repo: 'browserbase/mcp-server-browserbase',
                path: '.',
                description: 'Browser automation for web scraping and interaction',
                port: 4006,
                type: 'browser'
            },
            {
                name: 'sqlite-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/sqlite',
                description: 'SQLite database operations and queries',
                port: 4007,
                type: 'database'
            },
            {
                name: 'postgres-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/postgres',
                description: 'PostgreSQL database integration',
                port: 4008,
                type: 'database'
            },
            {
                name: 'github-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/github',
                description: 'GitHub API integration for repository management',
                port: 4009,
                type: 'git'
            },
            {
                name: 'slack-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/slack',
                description: 'Slack integration for team communication',
                port: 4010,
                type: 'communication'
            },
            {
                name: 'google-drive-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/gdrive',
                description: 'Google Drive integration for file management',
                port: 4011,
                type: 'cloud'
            },
            {
                name: 'docker-server',
                repo: 'appcypher/mcp-docker-server',
                path: '.',
                description: 'Docker operations and container management',
                port: 4012,
                type: 'devops'
            },
            {
                name: 'kubernetes-server',
                repo: 'strowk/mcp-k8s-go',
                path: '.',
                description: 'Kubernetes cluster management and operations',
                port: 4013,
                type: 'devops'
            },
            {
                name: 'aws-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/aws-kb',
                description: 'AWS services integration and management',
                port: 4014,
                type: 'cloud'
            },
            {
                name: 'notion-server',
                repo: 'modelcontextprotocol/servers',
                path: 'src/notion',
                description: 'Notion workspace integration',
                port: 4015,
                type: 'productivity'
            }
        ];
    }

    async downloadAndInstallServer(server) {
        try {
            console.log(`📦 Installing ${server.name}...`);
            
            const serverDir = path.join(__dirname, 'github-servers', server.name);
            
            // สร้าง directory
            if (!fs.existsSync(path.dirname(serverDir))) {
                fs.mkdirSync(path.dirname(serverDir), { recursive: true });
            }
            
            // Clone repository
            const repoUrl = `https://github.com/${server.repo}.git`;
            console.log(`  Cloning ${repoUrl}...`);
            
            try {
                execSync(`git clone ${repoUrl} ${serverDir}`, { stdio: 'pipe' });
            } catch (error) {
                // ถ้า clone ไม่ได้ ลองใช้ wget หรือ curl
                console.log(`  Git clone failed, trying alternative download...`);
                const zipUrl = `https://github.com/${server.repo}/archive/main.zip`;
                // ใช้ PowerShell สำหรับ Windows
                execSync(`powershell -Command "Invoke-WebRequest -Uri '${zipUrl}' -OutFile 'temp.zip'; Expand-Archive -Path 'temp.zip' -DestinationPath '${path.dirname(serverDir)}'; Remove-Item 'temp.zip'"`, { stdio: 'pipe' });
                
                // Rename extracted folder
                const extractedName = `${server.repo.split('/')[1]}-main`;
                const extractedPath = path.join(path.dirname(serverDir), extractedName);
                if (fs.existsSync(extractedPath)) {
                    fs.renameSync(extractedPath, serverDir);
                }
            }
            
            // Navigate to server path if specified
            const actualServerPath = server.path !== '.' ? path.join(serverDir, server.path) : serverDir;
            
            if (!fs.existsSync(actualServerPath)) {
                throw new Error(`Server path ${actualServerPath} not found`);
            }
            
            // Install dependencies
            console.log(`  Installing dependencies for ${server.name}...`);
            process.chdir(actualServerPath);
            
            if (fs.existsSync('package.json')) {
                execSync('npm install', { stdio: 'pipe' });
            } else if (fs.existsSync('requirements.txt')) {
                execSync('pip install -r requirements.txt', { stdio: 'pipe' });
            } else if (fs.existsSync('go.mod')) {
                execSync('go mod tidy', { stdio: 'pipe' });
            }
            
            // สร้าง wrapper script
            await this.createServerWrapper(server, actualServerPath);
            
            // Register with coordinator
            await this.registerWithCoordinator(server);
            
            this.installedServers.push(server);
            console.log(`✅ Successfully installed ${server.name}`);
            
        } catch (error) {
            console.error(`❌ Failed to install ${server.name}:`, error.message);
            this.failedServers.push({ server, error: error.message });
        } finally {
            // Return to original directory
            process.chdir(__dirname);
        }
    }
    
    async createServerWrapper(server, serverPath) {
        const wrapperPath = path.join(__dirname, `github-${server.name}.js`);
        
        let startCommand;
        if (fs.existsSync(path.join(serverPath, 'package.json'))) {
            startCommand = `node ${path.join(serverPath, 'dist/index.js')} || node ${path.join(serverPath, 'index.js')}`;
        } else if (fs.existsSync(path.join(serverPath, 'main.py'))) {
            startCommand = `python ${path.join(serverPath, 'main.py')}`;
        } else if (fs.existsSync(path.join(serverPath, 'go.mod'))) {
            startCommand = `go run ${path.join(serverPath, 'main.go')}`;
        } else {
            startCommand = `node ${path.join(serverPath, 'index.js')}`;
        }
        
        const wrapperContent = `#!/usr/bin/env node

/**
 * GitHub MCP Server: ${server.name}
 * ${server.description}
 * Port: ${server.port}
 */

const { spawn } = require('child_process');
const path = require('path');

class ${server.name.replace(/-/g, '')}Server {
    constructor() {
        this.port = ${server.port};
        this.name = '${server.name}';
        this.type = '${server.type}';
        this.description = '${server.description}';
        this.serverPath = '${serverPath}';
    }
    
    async start() {
        try {
            console.log(\`🚀 Starting \${this.name} on port \${this.port}...\`);
            
            const serverProcess = spawn('${startCommand.split(' ')[0]}', [
                ${startCommand.split(' ').slice(1).map(arg => `'${arg}'`).join(',\n                ')}
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
                console.log(\`[\${this.name}] \${data.toString().trim()}\`);
            });
            
            serverProcess.stderr.on('data', (data) => {
                console.error(\`[\${this.name}] ERROR: \${data.toString().trim()}\`);
            });
            
            serverProcess.on('close', (code) => {
                console.log(\`[\${this.name}] Process exited with code \${code}\`);
            });
            
            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log(\`✅ \${this.name} started successfully\`);
            return serverProcess;
            
        } catch (error) {
            console.error(\`❌ Failed to start \${this.name}:\`, error.message);
            throw error;
        }
    }
}

if (require.main === module) {
    const server = new ${server.name.replace(/-/g, '')}Server();
    server.start().catch(console.error);
}

module.exports = ${server.name.replace(/-/g, '')}Server;
`;
        
        fs.writeFileSync(wrapperPath, wrapperContent);
        console.log(`  Created wrapper: ${wrapperPath}`);
    }
    
    async registerWithCoordinator(server) {
        try {
            const response = await axios.post(`${this.coordinatorUrl}/register`, {
                name: server.name,
                type: server.type,
                port: server.port,
                description: server.description,
                source: 'github',
                repo: server.repo,
                status: 'active'
            });
            
            console.log(`  Registered ${server.name} with coordinator`);
        } catch (error) {
            console.warn(`  Warning: Could not register ${server.name} with coordinator:`, error.message);
        }
    }
    
    async installAllServers() {
        console.log('🔧 Installing useful GitHub MCP servers...');
        console.log(`📊 Total servers to install: ${this.usefulServers.length}`);
        
        for (let i = 0; i < this.usefulServers.length; i++) {
            const server = this.usefulServers[i];
            console.log(`\n[${i + 1}/${this.usefulServers.length}] Processing ${server.name}...`);
            await this.installAndStartServer(server);
            
            // Wait between installations
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        this.printSummary();
    }
    
    async installAndStartServer(server) {
        try {
            await this.downloadAndInstallServer(server);
            
            // Start the server
            console.log(`🚀 Starting ${server.name}...`);
            const wrapperPath = path.join(__dirname, `github-${server.name}.js`);
            
            if (fs.existsSync(wrapperPath)) {
                const serverProcess = spawn('node', [wrapperPath], {
                    detached: true,
                    stdio: 'ignore'
                });
                
                serverProcess.unref();
                console.log(`✅ ${server.name} started in background`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to install/start ${server.name}:`, error.message);
        }
    }
    
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 GITHUB MCP SERVERS INSTALLATION SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Successfully installed: ${this.installedServers.length}`);
        this.installedServers.forEach(server => {
            console.log(`   • ${server.name} (${server.type}) - Port ${server.port}`);
        });
        
        if (this.failedServers.length > 0) {
            console.log(`\n❌ Failed installations: ${this.failedServers.length}`);
            this.failedServers.forEach(({ server, error }) => {
                console.log(`   • ${server.name}: ${error}`);
            });
        }
        
        console.log(`\n📈 Success rate: ${Math.round((this.installedServers.length / this.usefulServers.length) * 100)}%`);
        console.log('\n🌐 Access MCP Coordinator: http://localhost:3000');
        console.log('📊 View server status: http://localhost:3000/servers');
    }
    
    async getSystemStatus() {
        try {
            const response = await axios.get(`${this.coordinatorUrl}/servers`);
            return response.data;
        } catch (error) {
            console.error('Could not get system status:', error.message);
            return null;
        }
    }
}

if (require.main === module) {
    const installer = new GitHubMCPInstaller();
    installer.installAllServers().catch(console.error);
}

module.exports = GitHubMCPInstaller;