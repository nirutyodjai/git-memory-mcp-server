#!/usr/bin/env node
/**
 * NEXUS IDE - Backup System
 * ระบบสำรองข้อมูลอัตโนมัติสำหรับ NEXUS IDE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const crypto = require('crypto');
const os = require('os');

// Backup Configuration
const BACKUP_CONFIG = {
    name: 'NEXUS IDE Backup System',
    version: '1.0.0',
    
    // Backup locations
    backupDir: path.join(process.cwd(), 'backups'),
    tempDir: path.join(os.tmpdir(), 'nexus-backup'),
    
    // What to backup
    sources: {
        // Critical system files
        system: {
            name: 'System Files',
            paths: [
                'package.json',
                'package-lock.json',
                '.env',
                'nexus-web-server.js',
                'git-memory-coordinator.js',
                'nexus-system-dashboard.js',
                'install-nexus-ide.js',
                'health-check.js',
                'run-all-tests.js'
            ],
            priority: 'critical'
        },
        
        // Configuration files
        config: {
            name: 'Configuration',
            paths: [
                'config/',
                'test-suite/test-config.json',
                '.gitignore',
                'README.md'
            ],
            priority: 'high'
        },
        
        // Data directories
        data: {
            name: 'Data Files',
            paths: [
                'data/',
                'logs/',
                'uploads/',
                'cache/'
            ],
            priority: 'high',
            excludePatterns: ['*.tmp', '*.log', 'node_modules']
        },
        
        // Test suites
        tests: {
            name: 'Test Suites',
            paths: [
                'test-suite/'
            ],
            priority: 'medium'
        },
        
        // Documentation
        docs: {
            name: 'Documentation',
            paths: [
                'docs/',
                '*.md',
                'LICENSE'
            ],
            priority: 'low'
        }
    },
    
    // Backup retention policy
    retention: {
        daily: 7,    // Keep 7 daily backups
        weekly: 4,   // Keep 4 weekly backups
        monthly: 12, // Keep 12 monthly backups
        yearly: 5    // Keep 5 yearly backups
    },
    
    // Compression settings
    compression: {
        level: 9,
        format: 'zip'
    },
    
    // Encryption settings
    encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm',
        keyFile: '.backup-key'
    }
};

class BackupSystem {
    constructor() {
        this.startTime = Date.now();
        this.backupId = this.generateBackupId();
        this.results = {
            id: this.backupId,
            timestamp: new Date().toISOString(),
            status: 'running',
            sources: {},
            summary: {
                totalFiles: 0,
                totalSize: 0,
                compressedSize: 0,
                duration: 0,
                errors: []
            }
        };
        
        this.ensureDirectories();
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        
        const timestamp = new Date().toISOString();
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    generateBackupId() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
        const random = Math.random().toString(36).substring(2, 8);
        return `nexus-backup-${dateStr}-${timeStr}-${random}`;
    }

    ensureDirectories() {
        [BACKUP_CONFIG.backupDir, BACKUP_CONFIG.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async createBackup(options = {}) {
        try {
            this.log('🚀 Starting NEXUS IDE backup process...', 'info');
            this.log(`📦 Backup ID: ${this.backupId}`, 'info');
            
            // Create temporary backup directory
            const tempBackupDir = path.join(BACKUP_CONFIG.tempDir, this.backupId);
            fs.mkdirSync(tempBackupDir, { recursive: true });
            
            // Backup each source
            for (const [sourceKey, sourceConfig] of Object.entries(BACKUP_CONFIG.sources)) {
                if (options.sources && !options.sources.includes(sourceKey)) {
                    continue;
                }
                
                await this.backupSource(sourceKey, sourceConfig, tempBackupDir);
            }
            
            // Create compressed archive
            const archivePath = await this.createArchive(tempBackupDir);
            
            // Encrypt if enabled
            let finalPath = archivePath;
            if (BACKUP_CONFIG.encryption.enabled) {
                finalPath = await this.encryptBackup(archivePath);
            }
            
            // Generate metadata
            await this.generateMetadata(finalPath);
            
            // Cleanup temporary files
            await this.cleanup(tempBackupDir);
            
            // Update retention policy
            await this.applyRetentionPolicy();
            
            this.results.status = 'completed';
            this.results.summary.duration = Date.now() - this.startTime;
            this.results.finalPath = finalPath;
            
            this.log('✅ Backup completed successfully!', 'success');
            this.log(`📁 Backup saved to: ${finalPath}`, 'info');
            
            return this.results;
            
        } catch (error) {
            this.results.status = 'failed';
            this.results.summary.errors.push(error.message);
            this.log(`❌ Backup failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async backupSource(sourceKey, sourceConfig, tempBackupDir) {
        this.log(`📂 Backing up ${sourceConfig.name}...`, 'info');
        
        const sourceBackupDir = path.join(tempBackupDir, sourceKey);
        fs.mkdirSync(sourceBackupDir, { recursive: true });
        
        let totalFiles = 0;
        let totalSize = 0;
        const errors = [];
        
        for (const sourcePath of sourceConfig.paths) {
            try {
                const fullPath = path.resolve(sourcePath);
                
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        const result = await this.copyDirectory(fullPath, path.join(sourceBackupDir, path.basename(fullPath)), sourceConfig.excludePatterns);
                        totalFiles += result.files;
                        totalSize += result.size;
                    } else {
                        const result = await this.copyFile(fullPath, path.join(sourceBackupDir, path.basename(fullPath)));
                        totalFiles += 1;
                        totalSize += result.size;
                    }
                } else {
                    this.log(`⚠️  Source not found: ${sourcePath}`, 'warning');
                }
            } catch (error) {
                errors.push(`${sourcePath}: ${error.message}`);
                this.log(`❌ Error backing up ${sourcePath}: ${error.message}`, 'error');
            }
        }
        
        this.results.sources[sourceKey] = {
            name: sourceConfig.name,
            priority: sourceConfig.priority,
            files: totalFiles,
            size: totalSize,
            errors: errors,
            status: errors.length === 0 ? 'success' : 'partial'
        };
        
        this.results.summary.totalFiles += totalFiles;
        this.results.summary.totalSize += totalSize;
        this.results.summary.errors.push(...errors);
        
        this.log(`✅ ${sourceConfig.name}: ${totalFiles} files, ${this.formatSize(totalSize)}`, 'success');
    }

    async copyDirectory(srcDir, destDir, excludePatterns = []) {
        let totalFiles = 0;
        let totalSize = 0;
        
        const copyRecursive = (src, dest) => {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            
            const items = fs.readdirSync(src);
            
            for (const item of items) {
                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);
                
                // Check exclude patterns
                if (this.shouldExclude(item, excludePatterns)) {
                    continue;
                }
                
                const stats = fs.statSync(srcPath);
                
                if (stats.isDirectory()) {
                    copyRecursive(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                    totalFiles++;
                    totalSize += stats.size;
                }
            }
        };
        
        copyRecursive(srcDir, destDir);
        
        return { files: totalFiles, size: totalSize };
    }

    async copyFile(srcFile, destFile) {
        const destDir = path.dirname(destFile);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(srcFile, destFile);
        const stats = fs.statSync(srcFile);
        
        return { size: stats.size };
    }

    shouldExclude(filename, excludePatterns = []) {
        return excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(filename);
            }
            return filename === pattern;
        });
    }

    async createArchive(sourceDir) {
        return new Promise((resolve, reject) => {
            const archivePath = path.join(BACKUP_CONFIG.backupDir, `${this.backupId}.zip`);
            const output = fs.createWriteStream(archivePath);
            const archive = archiver('zip', {
                zlib: { level: BACKUP_CONFIG.compression.level }
            });
            
            output.on('close', () => {
                this.results.summary.compressedSize = archive.pointer();
                this.log(`📦 Archive created: ${this.formatSize(archive.pointer())}`, 'success');
                resolve(archivePath);
            });
            
            archive.on('error', reject);
            archive.pipe(output);
            
            // Add all files from temp directory
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async encryptBackup(archivePath) {
        this.log('🔐 Encrypting backup...', 'info');
        
        const key = await this.getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(BACKUP_CONFIG.encryption.algorithm, key);
        
        const encryptedPath = archivePath + '.enc';
        const input = fs.createReadStream(archivePath);
        const output = fs.createWriteStream(encryptedPath);
        
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                // Remove unencrypted file
                fs.unlinkSync(archivePath);
                this.log('🔒 Backup encrypted successfully', 'success');
                resolve(encryptedPath);
            });
            
            input.on('error', reject);
            output.on('error', reject);
            cipher.on('error', reject);
            
            input.pipe(cipher).pipe(output);
        });
    }

    async getEncryptionKey() {
        const keyPath = path.join(process.cwd(), BACKUP_CONFIG.encryption.keyFile);
        
        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8').trim();
        } else {
            // Generate new key
            const key = crypto.randomBytes(32).toString('hex');
            fs.writeFileSync(keyPath, key, { mode: 0o600 });
            this.log('🔑 New encryption key generated', 'info');
            return key;
        }
    }

    async generateMetadata(backupPath) {
        const metadata = {
            ...this.results,
            backupPath,
            checksum: await this.calculateChecksum(backupPath),
            system: {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                cwd: process.cwd()
            }
        };
        
        const metadataPath = backupPath + '.meta.json';
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        this.log(`📋 Metadata saved to: ${metadataPath}`, 'info');
    }

    async calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    async cleanup(tempDir) {
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                this.log('🧹 Temporary files cleaned up', 'info');
            }
        } catch (error) {
            this.log(`⚠️  Cleanup warning: ${error.message}`, 'warning');
        }
    }

    async applyRetentionPolicy() {
        this.log('🗂️  Applying retention policy...', 'info');
        
        try {
            const backupFiles = fs.readdirSync(BACKUP_CONFIG.backupDir)
                .filter(file => file.startsWith('nexus-backup-') && (file.endsWith('.zip') || file.endsWith('.enc')))
                .map(file => {
                    const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        mtime: stats.mtime,
                        size: stats.size
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);
            
            const now = new Date();
            const toDelete = [];
            
            // Apply retention rules
            const daily = backupFiles.filter(f => {
                const age = (now - f.mtime) / (1000 * 60 * 60 * 24);
                return age <= 1;
            });
            
            const weekly = backupFiles.filter(f => {
                const age = (now - f.mtime) / (1000 * 60 * 60 * 24);
                return age > 1 && age <= 7;
            });
            
            const monthly = backupFiles.filter(f => {
                const age = (now - f.mtime) / (1000 * 60 * 60 * 24);
                return age > 7 && age <= 30;
            });
            
            const yearly = backupFiles.filter(f => {
                const age = (now - f.mtime) / (1000 * 60 * 60 * 24);
                return age > 30;
            });
            
            // Mark files for deletion based on retention policy
            if (daily.length > BACKUP_CONFIG.retention.daily) {
                toDelete.push(...daily.slice(BACKUP_CONFIG.retention.daily));
            }
            
            if (weekly.length > BACKUP_CONFIG.retention.weekly) {
                toDelete.push(...weekly.slice(BACKUP_CONFIG.retention.weekly));
            }
            
            if (monthly.length > BACKUP_CONFIG.retention.monthly) {
                toDelete.push(...monthly.slice(BACKUP_CONFIG.retention.monthly));
            }
            
            if (yearly.length > BACKUP_CONFIG.retention.yearly) {
                toDelete.push(...yearly.slice(BACKUP_CONFIG.retention.yearly));
            }
            
            // Delete old backups
            for (const file of toDelete) {
                try {
                    fs.unlinkSync(file.path);
                    // Also delete metadata file if exists
                    const metaPath = file.path + '.meta.json';
                    if (fs.existsSync(metaPath)) {
                        fs.unlinkSync(metaPath);
                    }
                    this.log(`🗑️  Deleted old backup: ${file.name}`, 'info');
                } catch (error) {
                    this.log(`⚠️  Failed to delete ${file.name}: ${error.message}`, 'warning');
                }
            }
            
            this.log(`📊 Retention policy applied: ${toDelete.length} old backups removed`, 'success');
            
        } catch (error) {
            this.log(`⚠️  Retention policy error: ${error.message}`, 'warning');
        }
    }

    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    async listBackups() {
        const backupFiles = fs.readdirSync(BACKUP_CONFIG.backupDir)
            .filter(file => file.startsWith('nexus-backup-'))
            .map(file => {
                const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                const stats = fs.statSync(filePath);
                
                let metadata = null;
                const metaPath = filePath + '.meta.json';
                if (fs.existsSync(metaPath)) {
                    try {
                        metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    } catch (error) {
                        // Ignore metadata read errors
                    }
                }
                
                return {
                    name: file,
                    path: filePath,
                    size: this.formatSize(stats.size),
                    created: stats.mtime.toISOString(),
                    metadata
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
        
        return backupFiles;
    }

    async restoreBackup(backupPath, restoreDir) {
        this.log(`🔄 Restoring backup from: ${backupPath}`, 'info');
        
        try {
            // Check if backup is encrypted
            if (backupPath.endsWith('.enc')) {
                backupPath = await this.decryptBackup(backupPath);
            }
            
            // Extract archive
            await this.extractArchive(backupPath, restoreDir);
            
            this.log('✅ Backup restored successfully!', 'success');
            
        } catch (error) {
            this.log(`❌ Restore failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async decryptBackup(encryptedPath) {
        this.log('🔓 Decrypting backup...', 'info');
        
        const key = await this.getEncryptionKey();
        const decipher = crypto.createDecipher(BACKUP_CONFIG.encryption.algorithm, key);
        
        const decryptedPath = encryptedPath.replace('.enc', '');
        const input = fs.createReadStream(encryptedPath);
        const output = fs.createWriteStream(decryptedPath);
        
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                this.log('🔓 Backup decrypted successfully', 'success');
                resolve(decryptedPath);
            });
            
            input.on('error', reject);
            output.on('error', reject);
            decipher.on('error', reject);
            
            input.pipe(decipher).pipe(output);
        });
    }

    async extractArchive(archivePath, extractDir) {
        // This would require additional libraries like yauzl for zip extraction
        // For now, we'll use system commands
        try {
            if (!fs.existsSync(extractDir)) {
                fs.mkdirSync(extractDir, { recursive: true });
            }
            
            if (os.platform() === 'win32') {
                execSync(`powershell Expand-Archive -Path "${archivePath}" -DestinationPath "${extractDir}" -Force`);
            } else {
                execSync(`unzip -o "${archivePath}" -d "${extractDir}"`);
            }
            
            this.log(`📦 Archive extracted to: ${extractDir}`, 'success');
            
        } catch (error) {
            throw new Error(`Failed to extract archive: ${error.message}`);
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const backupSystem = new BackupSystem();
    
    switch (command) {
        case 'create':
        case 'backup':
            const sources = args.includes('--sources') ? args[args.indexOf('--sources') + 1].split(',') : null;
            backupSystem.createBackup({ sources })
                .then(result => {
                    console.log('\n📊 Backup Summary:');
                    console.log(`   ID: ${result.id}`);
                    console.log(`   Status: ${result.status}`);
                    console.log(`   Files: ${result.summary.totalFiles}`);
                    console.log(`   Original Size: ${backupSystem.formatSize(result.summary.totalSize)}`);
                    console.log(`   Compressed Size: ${backupSystem.formatSize(result.summary.compressedSize)}`);
                    console.log(`   Duration: ${result.summary.duration}ms`);
                    if (result.summary.errors.length > 0) {
                        console.log(`   Errors: ${result.summary.errors.length}`);
                    }
                })
                .catch(error => {
                    console.error('Backup failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'list':
            backupSystem.listBackups()
                .then(backups => {
                    console.log('\n📋 Available Backups:');
                    console.log('='.repeat(80));
                    
                    if (backups.length === 0) {
                        console.log('No backups found.');
                    } else {
                        backups.forEach((backup, index) => {
                            console.log(`${index + 1}. ${backup.name}`);
                            console.log(`   Size: ${backup.size}`);
                            console.log(`   Created: ${backup.created}`);
                            if (backup.metadata) {
                                console.log(`   Files: ${backup.metadata.summary.totalFiles}`);
                                console.log(`   Status: ${backup.metadata.status}`);
                            }
                            console.log('');
                        });
                    }
                });
            break;
            
        case 'restore':
            const backupPath = args[1];
            const restoreDir = args[2] || './restored';
            
            if (!backupPath) {
                console.error('Usage: node backup-system.js restore <backup-path> [restore-dir]');
                process.exit(1);
            }
            
            backupSystem.restoreBackup(backupPath, restoreDir)
                .then(() => {
                    console.log(`✅ Backup restored to: ${restoreDir}`);
                })
                .catch(error => {
                    console.error('Restore failed:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('NEXUS IDE Backup System');
            console.log('Usage:');
            console.log('  node backup-system.js create [--sources source1,source2]');
            console.log('  node backup-system.js list');
            console.log('  node backup-system.js restore <backup-path> [restore-dir]');
            console.log('');
            console.log('Examples:');
            console.log('  node backup-system.js create');
            console.log('  node backup-system.js create --sources system,config,data');
            console.log('  node backup-system.js list');
            console.log('  node backup-system.js restore ./backups/nexus-backup-20240101-120000-abc123.zip');
    }
}

module.exports = BackupSystem;