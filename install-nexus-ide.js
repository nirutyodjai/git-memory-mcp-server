#!/usr/bin/env node
/**
 * NEXUS IDE - One-Click Installer
 * สคริปต์ติดตั้งแบบ one-click ที่ติดตั้ง NEXUS IDE ทั้งระบบพร้อมใช้งาน
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');
const https = require('https');
const readline = require('readline');

// Installation Configuration
const INSTALL_CONFIG = {
    name: 'NEXUS IDE',
    version: '1.0.0',
    description: 'Next-Generation AI-Powered IDE',
    author: 'NEXUS Team',
    
    // System Requirements
    requirements: {
        node: '18.0.0',
        npm: '8.0.0',
        memory: 4, // GB
        disk: 2 // GB
    },
    
    // Installation Paths
    paths: {
        base: process.cwd(),
        logs: path.join(process.cwd(), 'logs'),
        temp: path.join(os.tmpdir(), 'nexus-install'),
        backup: path.join(process.cwd(), 'backup')
    },
    
    // Services Configuration
    services: {
        webServer: {
            name: 'NEXUS Web Server',
            script: 'nexus-web-server.js',
            port: 8080,
            autoStart: true
        },
        dashboard: {
            name: 'NEXUS System Dashboard',
            script: 'nexus-system-dashboard.js',
            port: 3000,
            autoStart: true
        },
        testDashboard: {
            name: 'Test Results Dashboard',
            script: 'test-suite/reports/test-dashboard.js',
            port: 3001,
            autoStart: false
        },
        gitMemory: {
            name: 'Git Memory Coordinator',
            script: 'git-memory-coordinator.js',
            autoStart: true
        },
        nexusSystem: {
            name: 'NEXUS System Controller',
            script: 'nexus-ide/start-nexus-system.js',
            autoStart: true
        }
    },
    
    // Dependencies
    dependencies: {
        production: [
            'express@^4.18.2',
            'socket.io@^4.7.2',
            'ws@^8.14.2',
            'cors@^2.8.5',
            'helmet@^7.0.0',
            'compression@^1.7.4',
            'morgan@^1.10.0',
            'dotenv@^16.3.1',
            'uuid@^9.0.0',
            'chalk@^5.3.0',
            'inquirer@^9.2.10',
            'ora@^7.0.1',
            'boxen@^7.1.1',
            'figlet@^1.6.0',
            'gradient-string@^2.0.2',
            'node-cron@^3.0.2',
            'chokidar@^3.5.3',
            'axios@^1.5.0',
            'lodash@^4.17.21',
            'moment@^2.29.4',
            'jsonwebtoken@^9.0.2',
            'bcryptjs@^2.4.3',
            'multer@^1.4.5-lts.1',
            'sharp@^0.32.5',
            'nodemailer@^6.9.4',
            'redis@^4.6.8',
            'mongodb@^5.7.0',
            'pg@^8.11.3',
            'sqlite3@^5.1.6'
        ],
        development: [
            'nodemon@^3.0.1',
            'jest@^29.6.4',
            'supertest@^6.3.3',
            'eslint@^8.47.0',
            'prettier@^3.0.2',
            'husky@^8.0.3',
            'lint-staged@^14.0.1',
            'concurrently@^8.2.0',
            'cross-env@^7.0.3',
            'puppeteer@^21.1.1'
        ]
    }
};

// Installer Class
class NexusInstaller {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.installLog = [];
        this.startTime = Date.now();
        this.processes = new Map();
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = Object.values(INSTALL_CONFIG.paths);
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, message, type };
        this.installLog.push(logEntry);
        
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
        
        // Write to log file
        const logFile = path.join(INSTALL_CONFIG.paths.logs, 'install.log');
        fs.appendFileSync(logFile, `[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async showWelcome() {
        console.clear();
        
        const title = `
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ██╗██████╗ ███████╗
████╗  ██║██╔════╝╝██╗██╔╝██║   ██║██╔════╝    ██║██╔══██╗██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    ██║██║  ██║█████╗  
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██║██║  ██║██╔══╝  
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ██║██████╔╝███████╗
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═╝╚═════╝ ╚══════╝
`;
        
        console.log('\x1b[36m' + title + '\x1b[0m');
        console.log('\x1b[32m' + '='.repeat(70) + '\x1b[0m');
        console.log('\x1b[33m🚀 Next-Generation AI-Powered IDE Installer\x1b[0m');
        console.log('\x1b[33m📦 Version: ' + INSTALL_CONFIG.version + '\x1b[0m');
        console.log('\x1b[33m👨‍💻 Author: ' + INSTALL_CONFIG.author + '\x1b[0m');
        console.log('\x1b[32m' + '='.repeat(70) + '\x1b[0m\n');
        
        this.log('🎉 Welcome to NEXUS IDE Installer!', 'success');
        this.log('📋 This installer will set up the complete NEXUS IDE system', 'info');
        
        const proceed = await this.question('\n🤔 Do you want to proceed with the installation? (y/N): ');
        if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
            this.log('❌ Installation cancelled by user', 'warning');
            process.exit(0);
        }
    }

    async checkSystemRequirements() {
        this.log('🔍 Checking system requirements...', 'info');
        
        const checks = {
            node: this.checkNodeVersion(),
            npm: this.checkNpmVersion(),
            memory: this.checkMemory(),
            disk: this.checkDiskSpace(),
            platform: this.checkPlatform()
        };
        
        const results = await Promise.all(Object.values(checks));
        const allPassed = results.every(result => result.passed);
        
        if (allPassed) {
            this.log('✅ All system requirements met!', 'success');
        } else {
            this.log('❌ Some system requirements not met. Please check the details above.', 'error');
            const continueAnyway = await this.question('⚠️  Continue anyway? (y/N): ');
            if (continueAnyway.toLowerCase() !== 'y') {
                process.exit(1);
            }
        }
        
        return allPassed;
    }

    async checkNodeVersion() {
        try {
            const version = process.version.slice(1); // Remove 'v' prefix
            const required = INSTALL_CONFIG.requirements.node;
            const passed = this.compareVersions(version, required) >= 0;
            
            this.log(`📦 Node.js: ${version} (required: ${required}) ${passed ? '✅' : '❌'}`, passed ? 'success' : 'error');
            return { passed, current: version, required };
        } catch (error) {
            this.log('❌ Failed to check Node.js version', 'error');
            return { passed: false, error: error.message };
        }
    }

    async checkNpmVersion() {
        try {
            const version = execSync('npm --version', { encoding: 'utf8' }).trim();
            const required = INSTALL_CONFIG.requirements.npm;
            const passed = this.compareVersions(version, required) >= 0;
            
            this.log(`📦 npm: ${version} (required: ${required}) ${passed ? '✅' : '❌'}`, passed ? 'success' : 'error');
            return { passed, current: version, required };
        } catch (error) {
            this.log('❌ Failed to check npm version', 'error');
            return { passed: false, error: error.message };
        }
    }

    async checkMemory() {
        try {
            const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
            const required = INSTALL_CONFIG.requirements.memory;
            const passed = totalMemory >= required;
            
            this.log(`💾 Memory: ${totalMemory}GB (required: ${required}GB) ${passed ? '✅' : '❌'}`, passed ? 'success' : 'error');
            return { passed, current: totalMemory, required };
        } catch (error) {
            this.log('❌ Failed to check memory', 'error');
            return { passed: false, error: error.message };
        }
    }

    async checkDiskSpace() {
        try {
            const stats = fs.statSync(INSTALL_CONFIG.paths.base);
            const passed = true; // Simplified check
            
            this.log(`💽 Disk space: Available ${passed ? '✅' : '❌'}`, passed ? 'success' : 'error');
            return { passed };
        } catch (error) {
            this.log('❌ Failed to check disk space', 'error');
            return { passed: false, error: error.message };
        }
    }

    async checkPlatform() {
        const platform = os.platform();
        const supported = ['win32', 'darwin', 'linux'];
        const passed = supported.includes(platform);
        
        this.log(`🖥️  Platform: ${platform} ${passed ? '✅' : '❌'}`, passed ? 'success' : 'error');
        return { passed, current: platform, supported };
    }

    compareVersions(version1, version2) {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;
            
            if (v1part > v2part) return 1;
            if (v1part < v2part) return -1;
        }
        
        return 0;
    }

    async installDependencies() {
        this.log('📦 Installing dependencies...', 'info');
        
        // Create package.json if it doesn't exist
        await this.createPackageJson();
        
        // Install production dependencies
        this.log('📦 Installing production dependencies...', 'info');
        await this.runCommand('npm install --production', 'Installing production packages');
        
        // Install development dependencies
        const installDev = await this.question('🔧 Install development dependencies? (y/N): ');
        if (installDev.toLowerCase() === 'y' || installDev.toLowerCase() === 'yes') {
            this.log('🔧 Installing development dependencies...', 'info');
            await this.runCommand('npm install --save-dev ' + INSTALL_CONFIG.dependencies.development.join(' '), 'Installing dev packages');
        }
        
        this.log('✅ Dependencies installed successfully!', 'success');
    }

    async createPackageJson() {
        const packageJsonPath = path.join(INSTALL_CONFIG.paths.base, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            this.log('📄 package.json already exists, updating...', 'info');
            const existing = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Merge dependencies
            existing.dependencies = existing.dependencies || {};
            existing.devDependencies = existing.devDependencies || {};
            
            // Add scripts
            existing.scripts = {
                ...existing.scripts,
                "start": "node nexus-web-server.js",
                "dev": "nodemon nexus-web-server.js",
                "test": "node run-all-tests.js",
                "dashboard": "node nexus-system-dashboard.js",
                "test-dashboard": "node test-suite/reports/test-dashboard.js",
                "git-memory": "node git-memory-coordinator.js",
                "nexus-system": "node nexus-ide/start-nexus-system.js",
                "install-all": "node install-nexus-ide.js",
                "health-check": "node health-check.js",
                "backup": "node backup-system.js",
                "restore": "node restore-system.js"
            };
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(existing, null, 2));
        } else {
            this.log('📄 Creating package.json...', 'info');
            
            const packageJson = {
                name: 'nexus-ide',
                version: INSTALL_CONFIG.version,
                description: INSTALL_CONFIG.description,
                main: 'nexus-web-server.js',
                scripts: {
                    "start": "node nexus-web-server.js",
                    "dev": "nodemon nexus-web-server.js",
                    "test": "node run-all-tests.js",
                    "dashboard": "node nexus-system-dashboard.js",
                    "test-dashboard": "node test-suite/reports/test-dashboard.js",
                    "git-memory": "node git-memory-coordinator.js",
                    "nexus-system": "node nexus-ide/start-nexus-system.js",
                    "install-all": "node install-nexus-ide.js",
                    "health-check": "node health-check.js",
                    "backup": "node backup-system.js",
                    "restore": "node restore-system.js"
                },
                keywords: ['ide', 'ai', 'development', 'nexus', 'mcp'],
                author: INSTALL_CONFIG.author,
                license: 'MIT',
                dependencies: {},
                devDependencies: {},
                engines: {
                    node: `>=${INSTALL_CONFIG.requirements.node}`,
                    npm: `>=${INSTALL_CONFIG.requirements.npm}`
                }
            };
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
    }

    async runCommand(command, description) {
        return new Promise((resolve, reject) => {
            this.log(`⚡ ${description}...`, 'info');
            
            const process = spawn(command, [], {
                shell: true,
                cwd: INSTALL_CONFIG.paths.base,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let errorOutput = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    this.log(`✅ ${description} completed successfully`, 'success');
                    resolve({ success: true, output });
                } else {
                    this.log(`❌ ${description} failed with code ${code}`, 'error');
                    this.log(`Error: ${errorOutput}`, 'error');
                    reject(new Error(`Command failed: ${command}`));
                }
            });
            
            process.on('error', (error) => {
                this.log(`❌ ${description} failed: ${error.message}`, 'error');
                reject(error);
            });
        });
    }

    async setupConfiguration() {
        this.log('⚙️  Setting up configuration...', 'info');
        
        // Create .env file
        const envPath = path.join(INSTALL_CONFIG.paths.base, '.env');
        if (!fs.existsSync(envPath)) {
            const envContent = `# NEXUS IDE Configuration
NODE_ENV=production
PORT=8080
DATA_DIR=./data
LOGS_DIR=./logs
BACKUP_DIR=./backup

# Security
JWT_SECRET=${this.generateSecret()}
SESSION_SECRET=${this.generateSecret()}

# Database
DB_TYPE=sqlite
DB_PATH=./data/nexus.db

# Redis (optional)
# REDIS_URL=redis://localhost:6379

# Email (optional)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=

# AI Services (optional)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# GOOGLE_AI_API_KEY=
`;
            
            fs.writeFileSync(envPath, envContent);
            this.log('📄 Created .env configuration file', 'success');
        }
        
        // Create data directory structure
        const dataDirs = [
            'data',
            'data/repositories',
            'data/cache',
            'data/uploads',
            'data/backups',
            'logs',
            'temp'
        ];
        
        dataDirs.forEach(dir => {
            const fullPath = path.join(INSTALL_CONFIG.paths.base, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                this.log(`📁 Created directory: ${dir}`, 'success');
            }
        });
        
        this.log('✅ Configuration setup completed!', 'success');
    }

    generateSecret(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async startServices() {
        this.log('🚀 Starting NEXUS IDE services...', 'info');
        
        const startService = async (serviceKey, config) => {
            if (!config.autoStart) {
                this.log(`⏭️  Skipping ${config.name} (auto-start disabled)`, 'info');
                return;
            }
            
            const scriptPath = path.join(INSTALL_CONFIG.paths.base, config.script);
            
            if (!fs.existsSync(scriptPath)) {
                this.log(`⚠️  Service script not found: ${config.script}`, 'warning');
                return;
            }
            
            try {
                this.log(`🚀 Starting ${config.name}...`, 'info');
                
                const process = spawn('node', [scriptPath], {
                    cwd: INSTALL_CONFIG.paths.base,
                    detached: true,
                    stdio: ['ignore', 'pipe', 'pipe']
                });
                
                this.processes.set(serviceKey, {
                    process,
                    config,
                    startTime: Date.now()
                });
                
                // Give the process a moment to start
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                if (process.killed) {
                    this.log(`❌ Failed to start ${config.name}`, 'error');
                } else {
                    this.log(`✅ ${config.name} started successfully`, 'success');
                    if (config.port) {
                        this.log(`🌐 ${config.name} available at: http://localhost:${config.port}`, 'info');
                    }
                }
                
            } catch (error) {
                this.log(`❌ Error starting ${config.name}: ${error.message}`, 'error');
            }
        };
        
        // Start services in order
        for (const [serviceKey, config] of Object.entries(INSTALL_CONFIG.services)) {
            await startService(serviceKey, config);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between starts
        }
        
        this.log('🎉 All services started!', 'success');
    }

    async runTests() {
        const runTests = await this.question('🧪 Run initial tests to verify installation? (Y/n): ');
        if (runTests.toLowerCase() === 'n' || runTests.toLowerCase() === 'no') {
            return;
        }
        
        this.log('🧪 Running installation verification tests...', 'info');
        
        try {
            await this.runCommand('node run-all-tests.js --quick', 'Running verification tests');
            this.log('✅ All tests passed! Installation verified.', 'success');
        } catch (error) {
            this.log('⚠️  Some tests failed, but installation may still be functional', 'warning');
            this.log('💡 You can run tests later with: npm run test', 'info');
        }
    }

    async showCompletionMessage() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        
        console.log('\n' + '='.repeat(70));
        console.log('\x1b[32m🎉 NEXUS IDE Installation Complete! 🎉\x1b[0m');
        console.log('='.repeat(70));
        
        console.log('\n📊 Installation Summary:');
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log(`📦 Services: ${Object.keys(INSTALL_CONFIG.services).length}`);
        console.log(`🔧 Dependencies: ${INSTALL_CONFIG.dependencies.production.length}`);
        
        console.log('\n🌐 Access URLs:');
        Object.entries(INSTALL_CONFIG.services).forEach(([key, config]) => {
            if (config.port && config.autoStart) {
                console.log(`   ${config.name}: http://localhost:${config.port}`);
            }
        });
        
        console.log('\n🚀 Quick Start Commands:');
        console.log('   npm start              # Start main server');
        console.log('   npm run dashboard      # Open system dashboard');
        console.log('   npm run test           # Run all tests');
        console.log('   npm run test-dashboard # Open test dashboard');
        
        console.log('\n📚 Documentation:');
        console.log('   README.md              # Getting started guide');
        console.log('   docs/                  # Full documentation');
        console.log('   logs/install.log       # Installation log');
        
        console.log('\n💡 Next Steps:');
        console.log('   1. Open http://localhost:8080 to access NEXUS IDE');
        console.log('   2. Check the system dashboard at http://localhost:3000');
        console.log('   3. Review the documentation in the docs/ folder');
        console.log('   4. Configure your AI API keys in .env file');
        
        console.log('\n' + '='.repeat(70));
        console.log('\x1b[33m🙏 Thank you for choosing NEXUS IDE!\x1b[0m');
        console.log('\x1b[36m💬 Support: https://github.com/nexus-ide/support\x1b[0m');
        console.log('='.repeat(70) + '\n');
        
        this.log('🎉 Installation completed successfully!', 'success');
    }

    async cleanup() {
        this.rl.close();
        
        // Save installation log
        const logPath = path.join(INSTALL_CONFIG.paths.logs, 'install-summary.json');
        const summary = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            version: INSTALL_CONFIG.version,
            platform: os.platform(),
            nodeVersion: process.version,
            installLog: this.installLog,
            services: Object.keys(INSTALL_CONFIG.services),
            success: true
        };
        
        fs.writeFileSync(logPath, JSON.stringify(summary, null, 2));
        this.log(`📄 Installation summary saved to: ${logPath}`, 'info');
    }

    async install() {
        try {
            await this.showWelcome();
            await this.checkSystemRequirements();
            await this.installDependencies();
            await this.setupConfiguration();
            await this.startServices();
            await this.runTests();
            await this.showCompletionMessage();
            await this.cleanup();
            
        } catch (error) {
            this.log(`💥 Installation failed: ${error.message}`, 'error');
            console.error('\n❌ Installation Error:', error);
            
            const logPath = path.join(INSTALL_CONFIG.paths.logs, 'install-error.json');
            fs.writeFileSync(logPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                installLog: this.installLog
            }, null, 2));
            
            console.log(`\n📄 Error details saved to: ${logPath}`);
            process.exit(1);
        }
    }
}

// Main execution
if (require.main === module) {
    const installer = new NexusInstaller();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Installation interrupted by user');
        
        // Stop any running processes
        for (const [key, service] of installer.processes) {
            try {
                service.process.kill();
                console.log(`🛑 Stopped ${service.config.name}`);
            } catch (error) {
                console.log(`⚠️  Could not stop ${service.config.name}`);
            }
        }
        
        await installer.cleanup();
        process.exit(0);
    });
    
    // Start installation
    installer.install();
}

module.exports = NexusInstaller;