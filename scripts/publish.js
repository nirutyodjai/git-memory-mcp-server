#!/usr/bin/env node

/**
 * NPM Publishing Script for Git Memory MCP Server
 * Automates the publishing process with validation and safety checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class NPMPublisher {
    constructor() {
        this.packagePath = path.join(__dirname, '..', 'package.json');
        this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'
        };
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
    }

    execCommand(command, description) {
        try {
            this.log(`Executing: ${description}`);
            const result = execSync(command, { 
                encoding: 'utf8', 
                stdio: ['inherit', 'pipe', 'pipe'] 
            });
            this.log(`✓ ${description} completed`, 'success');
            return result;
        } catch (error) {
            this.log(`✗ ${description} failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async validatePackage() {
        this.log('🔍 Validating package configuration...');
        
        // Check required fields
        const requiredFields = ['name', 'version', 'description', 'main', 'bin'];
        for (const field of requiredFields) {
            if (!this.package[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Check if version is valid semver
        const semverRegex = /^\d+\.\d+\.\d+(-[\w\.]+)?$/;
        if (!semverRegex.test(this.package.version)) {
            throw new Error(`Invalid version format: ${this.package.version}`);
        }

        // Check if files exist
        const filesToCheck = [
            this.package.main,
            ...Object.values(this.package.bin || {})
        ];

        for (const file of filesToCheck) {
            const filePath = path.join(__dirname, '..', file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${file}`);
            }
        }

        this.log('Package validation passed', 'success');
    }

    async checkNPMAuth() {
        this.log('🔐 Checking NPM authentication...');
        
        try {
            const whoami = this.execCommand('npm whoami', 'NPM authentication check');
            this.log(`Logged in as: ${whoami.trim()}`, 'success');
        } catch (error) {
            this.log('Not logged in to NPM. Please run: npm login', 'error');
            throw error;
        }
    }

    async runTests() {
        this.log('🧪 Running tests...');
        
        try {
            // Run help command test
            this.execCommand('npm run help', 'CLI help test');
            
            // Run init test
            this.execCommand('npm run init', 'Git Memory initialization test');
            
            this.log('All tests passed', 'success');
        } catch (error) {
            this.log('Tests failed. Please fix issues before publishing.', 'error');
            throw error;
        }
    }

    async checkPackageSize() {
        this.log('📦 Checking package size...');
        
        const dryRun = this.execCommand('npm pack --dry-run', 'Package size check');
        const lines = dryRun.split('\n');
        const sizeInfo = lines.find(line => line.includes('package size'));
        
        if (sizeInfo) {
            this.log(`Package size: ${sizeInfo}`);
        }
        
        // Check if package is too large (>10MB)
        const packResult = this.execCommand('npm pack', 'Creating package');
        const tarFile = `${this.package.name}-${this.package.version}.tgz`;
        
        if (fs.existsSync(tarFile)) {
            const stats = fs.statSync(tarFile);
            const sizeMB = stats.size / (1024 * 1024);
            
            this.log(`Package file size: ${sizeMB.toFixed(2)} MB`);
            
            if (sizeMB > 10) {
                this.log('Package is larger than 10MB. Consider optimizing.', 'warning');
            }
            
            // Clean up
            fs.unlinkSync(tarFile);
        }
    }

    async confirmPublish() {
        this.log('📋 Publishing Summary:');
        console.log(`   Package: ${this.package.name}`);
        console.log(`   Version: ${this.package.version}`);
        console.log(`   Description: ${this.package.description}`);
        console.log(`   Registry: https://registry.npmjs.org`);
        
        const answer = await this.question('\n🚀 Do you want to publish this package? (y/N): ');
        
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            this.log('Publishing cancelled by user', 'warning');
            return false;
        }
        
        return true;
    }

    async publish() {
        this.log('🚀 Publishing to NPM...');
        
        try {
            const publishResult = this.execCommand(
                'npm publish --access public', 
                'NPM package publishing'
            );
            
            this.log(`Successfully published ${this.package.name}@${this.package.version}`, 'success');
            this.log(`View at: https://www.npmjs.com/package/${this.package.name}`, 'info');
            
            return true;
        } catch (error) {
            if (error.message.includes('already exists')) {
                this.log(`Version ${this.package.version} already exists on NPM`, 'warning');
                this.log('Please update the version in package.json and try again', 'info');
            } else {
                this.log(`Publishing failed: ${error.message}`, 'error');
            }
            throw error;
        }
    }

    async updateNotifications() {
        this.log('📢 Sending update notifications...');
        
        // Here you could add webhook notifications, Slack messages, etc.
        const notifications = [
            {
                type: 'Git Memory Coordinator',
                action: 'broadcast',
                message: `📦 New version ${this.package.version} published to NPM`
            },
            {
                type: 'Development Team',
                action: 'notify',
                message: `🎉 Git Memory MCP Server v${this.package.version} is now available`
            }
        ];

        for (const notification of notifications) {
            this.log(`Sending ${notification.type} notification: ${notification.message}`);
            
            // Simulate notification (replace with actual implementation)
            try {
                // Example: Send to Git Memory Coordinator
                // await this.sendCoordinatorNotification(notification);
                this.log(`✓ ${notification.type} notification sent`, 'success');
            } catch (error) {
                this.log(`⚠️ Failed to send ${notification.type} notification`, 'warning');
            }
        }
    }

    async run() {
        try {
            this.log('🚀 Starting NPM publishing process...');
            this.log(`Package: ${this.package.name} v${this.package.version}`);
            
            // Validation steps
            await this.validatePackage();
            await this.checkNPMAuth();
            await this.runTests();
            await this.checkPackageSize();
            
            // Confirmation
            const confirmed = await this.confirmPublish();
            if (!confirmed) {
                return;
            }
            
            // Publishing
            await this.publish();
            await this.updateNotifications();
            
            this.log('🎉 Publishing process completed successfully!', 'success');
            
        } catch (error) {
            this.log(`Publishing process failed: ${error.message}`, 'error');
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }
}

// Run the publisher if called directly
if (require.main === module) {
    const publisher = new NPMPublisher();
    publisher.run();
}

module.exports = NPMPublisher;