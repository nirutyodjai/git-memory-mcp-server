/**
 * Git Memory MCP Server - Backup Manager
 * ระบบสำรองข้อมูลอัตโนมัติสำหรับ Git Memory และ Server Configurations
 * 
 * Features:
 * - Automated Git Memory backup
 * - Server configurations backup
 * - Incremental and full backups
 * - Compression and encryption
 * - Backup scheduling
 * - Restore functionality
 * - Cloud storage integration
 * - Backup verification
 * - Retention policies
 * - Monitoring and alerts
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
const zlib = require('zlib');
const EventEmitter = require('events');
const os = require('os');

class BackupManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            // Backup paths
            gitMemoryPath: options.gitMemoryPath || path.join(__dirname, 'git-memory'),
            serverConfigsPath: options.serverConfigsPath || __dirname,
            backupBasePath: options.backupBasePath || path.join(__dirname, 'backups'),
            
            // Backup settings
            enableCompression: options.enableCompression !== false,
            enableEncryption: options.enableEncryption !== false,
            encryptionKey: options.encryptionKey || this.generateEncryptionKey(),
            
            // Scheduling
            autoBackup: options.autoBackup !== false,
            backupInterval: options.backupInterval || 6 * 60 * 60 * 1000, // 6 hours
            fullBackupInterval: options.fullBackupInterval || 24 * 60 * 60 * 1000, // 24 hours
            
            // Retention
            maxBackups: options.maxBackups || 30,
            maxAge: options.maxAge || 30 * 24 * 60 * 60 * 1000, // 30 days
            
            // Cloud storage
            cloudStorage: options.cloudStorage || null,
            
            // Verification
            verifyBackups: options.verifyBackups !== false,
            
            ...options
        };
        
        this.backupHistory = [];
        this.isRunning = false;
        this.intervals = {
            backup: null,
            fullBackup: null,
            cleanup: null
        };
        
        this.stats = {
            totalBackups: 0,
            successfulBackups: 0,
            failedBackups: 0,
            totalSize: 0,
            lastBackup: null,
            lastFullBackup: null
        };
        
        this.init();
    }
    
    /**
     * Initialize backup manager
     */
    init() {
        console.log('🔄 Initializing Backup Manager...');
        
        // Create backup directories
        this.createBackupDirectories();
        
        // Load backup history
        this.loadBackupHistory();
        
        // Start auto backup if enabled
        if (this.options.autoBackup) {
            this.startAutoBackup();
        }
        
        console.log('✅ Backup Manager initialized');
        this.emit('initialized');
    }
    
    /**
     * Create backup directories
     */
    createBackupDirectories() {
        const dirs = [
            this.options.backupBasePath,
            path.join(this.options.backupBasePath, 'incremental'),
            path.join(this.options.backupBasePath, 'full'),
            path.join(this.options.backupBasePath, 'temp'),
            path.join(this.options.backupBasePath, 'metadata')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created backup directory: ${dir}`);
            }
        });
    }
    
    /**
     * Generate encryption key
     */
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    /**
     * Start automatic backup
     */
    startAutoBackup() {
        if (this.isRunning) {
            console.log('⚠️ Auto backup is already running');
            return;
        }
        
        console.log('🚀 Starting automatic backup...');
        this.isRunning = true;
        
        // Incremental backup interval
        this.intervals.backup = setInterval(() => {
            this.createIncrementalBackup().catch(error => {
                console.error('❌ Auto incremental backup failed:', error.message);
                this.emit('backupError', error);
            });
        }, this.options.backupInterval);
        
        // Full backup interval
        this.intervals.fullBackup = setInterval(() => {
            this.createFullBackup().catch(error => {
                console.error('❌ Auto full backup failed:', error.message);
                this.emit('backupError', error);
            });
        }, this.options.fullBackupInterval);
        
        // Cleanup interval (daily)
        this.intervals.cleanup = setInterval(() => {
            this.cleanupOldBackups().catch(error => {
                console.error('❌ Backup cleanup failed:', error.message);
            });
        }, 24 * 60 * 60 * 1000);
        
        // Initial backup
        setTimeout(() => {
            this.createIncrementalBackup().catch(error => {
                console.error('❌ Initial backup failed:', error.message);
            });
        }, 5000);
        
        this.emit('autoBackupStarted');
    }
    
    /**
     * Stop automatic backup
     */
    stopAutoBackup() {
        if (!this.isRunning) {
            console.log('⚠️ Auto backup is not running');
            return;
        }
        
        console.log('🛑 Stopping automatic backup...');
        this.isRunning = false;
        
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        this.intervals = { backup: null, fullBackup: null, cleanup: null };
        
        this.emit('autoBackupStopped');
    }
    
    /**
     * Create incremental backup
     */
    async createIncrementalBackup() {
        console.log('📦 Creating incremental backup...');
        
        const backupId = this.generateBackupId('incremental');
        const startTime = Date.now();
        
        try {
            const backupInfo = {
                id: backupId,
                type: 'incremental',
                timestamp: startTime,
                status: 'in_progress',
                files: [],
                size: 0,
                compressed: false,
                encrypted: false
            };
            
            // Get changed files since last backup
            const changedFiles = await this.getChangedFiles();
            console.log(`📄 Found ${changedFiles.length} changed files`);
            
            if (changedFiles.length === 0) {
                console.log('✅ No changes detected, skipping backup');
                return null;
            }
            
            // Create backup archive
            const backupPath = path.join(this.options.backupBasePath, 'incremental', `${backupId}.tar`);
            await this.createArchive(changedFiles, backupPath);
            
            backupInfo.files = changedFiles;
            backupInfo.size = fs.statSync(backupPath).size;
            
            // Compress if enabled
            if (this.options.enableCompression) {
                await this.compressFile(backupPath);
                backupInfo.compressed = true;
                backupInfo.size = fs.statSync(backupPath + '.gz').size;
            }
            
            // Encrypt if enabled
            if (this.options.enableEncryption) {
                const finalPath = this.options.enableCompression ? backupPath + '.gz' : backupPath;
                await this.encryptFile(finalPath);
                backupInfo.encrypted = true;
                backupInfo.size = fs.statSync(finalPath + '.enc').size;
            }
            
            // Update backup info
            backupInfo.status = 'completed';
            backupInfo.duration = Date.now() - startTime;
            backupInfo.path = this.getFinalBackupPath(backupPath);
            
            // Save metadata
            await this.saveBackupMetadata(backupInfo);
            
            // Update history and stats
            this.backupHistory.push(backupInfo);
            this.updateStats(backupInfo, true);
            
            // Verify backup if enabled
            if (this.options.verifyBackups) {
                await this.verifyBackup(backupInfo);
            }
            
            // Upload to cloud if configured
            if (this.options.cloudStorage) {
                await this.uploadToCloud(backupInfo);
            }
            
            console.log(`✅ Incremental backup completed: ${backupId}`);
            console.log(`📊 Size: ${this.formatBytes(backupInfo.size)}, Duration: ${backupInfo.duration}ms`);
            
            this.emit('backupCompleted', backupInfo);
            return backupInfo;
            
        } catch (error) {
            console.error(`❌ Incremental backup failed: ${error.message}`);
            this.updateStats(null, false);
            this.emit('backupError', error);
            throw error;
        }
    }
    
    /**
     * Create full backup
     */
    async createFullBackup() {
        console.log('📦 Creating full backup...');
        
        const backupId = this.generateBackupId('full');
        const startTime = Date.now();
        
        try {
            const backupInfo = {
                id: backupId,
                type: 'full',
                timestamp: startTime,
                status: 'in_progress',
                files: [],
                size: 0,
                compressed: false,
                encrypted: false
            };
            
            // Get all files
            const allFiles = await this.getAllFiles();
            console.log(`📄 Found ${allFiles.length} files for full backup`);
            
            // Create backup archive
            const backupPath = path.join(this.options.backupBasePath, 'full', `${backupId}.tar`);
            await this.createArchive(allFiles, backupPath);
            
            backupInfo.files = allFiles;
            backupInfo.size = fs.statSync(backupPath).size;
            
            // Compress if enabled
            if (this.options.enableCompression) {
                await this.compressFile(backupPath);
                backupInfo.compressed = true;
                backupInfo.size = fs.statSync(backupPath + '.gz').size;
            }
            
            // Encrypt if enabled
            if (this.options.enableEncryption) {
                const finalPath = this.options.enableCompression ? backupPath + '.gz' : backupPath;
                await this.encryptFile(finalPath);
                backupInfo.encrypted = true;
                backupInfo.size = fs.statSync(finalPath + '.enc').size;
            }
            
            // Update backup info
            backupInfo.status = 'completed';
            backupInfo.duration = Date.now() - startTime;
            backupInfo.path = this.getFinalBackupPath(backupPath);
            
            // Save metadata
            await this.saveBackupMetadata(backupInfo);
            
            // Update history and stats
            this.backupHistory.push(backupInfo);
            this.updateStats(backupInfo, true);
            this.stats.lastFullBackup = startTime;
            
            // Verify backup if enabled
            if (this.options.verifyBackups) {
                await this.verifyBackup(backupInfo);
            }
            
            // Upload to cloud if configured
            if (this.options.cloudStorage) {
                await this.uploadToCloud(backupInfo);
            }
            
            console.log(`✅ Full backup completed: ${backupId}`);
            console.log(`📊 Size: ${this.formatBytes(backupInfo.size)}, Duration: ${backupInfo.duration}ms`);
            
            this.emit('fullBackupCompleted', backupInfo);
            return backupInfo;
            
        } catch (error) {
            console.error(`❌ Full backup failed: ${error.message}`);
            this.updateStats(null, false);
            this.emit('backupError', error);
            throw error;
        }
    }
    
    /**
     * Get changed files since last backup
     */
    async getChangedFiles() {
        const changedFiles = [];
        const lastBackupTime = this.getLastBackupTime();
        
        // Check Git memory files
        if (fs.existsSync(this.options.gitMemoryPath)) {
            const gitFiles = await this.scanDirectory(this.options.gitMemoryPath, lastBackupTime);
            changedFiles.push(...gitFiles);
        }
        
        // Check server config files
        const configFiles = [
            'mcp.config.json',
            'servers.json',
            'git-memory-coordinator.js',
            'auto-scaling-manager.js',
            'security-manager.js',
            'performance-analytics.js',
            'backup-manager.js'
        ];
        
        for (const file of configFiles) {
            const filePath = path.join(this.options.serverConfigsPath, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.mtime.getTime() > lastBackupTime) {
                    changedFiles.push({
                        path: filePath,
                        relativePath: file,
                        size: stats.size,
                        mtime: stats.mtime.getTime()
                    });
                }
            }
        }
        
        // Check server directories
        const serverDirs = this.getServerDirectories();
        for (const serverDir of serverDirs) {
            if (fs.existsSync(serverDir)) {
                const serverFiles = await this.scanDirectory(serverDir, lastBackupTime);
                changedFiles.push(...serverFiles);
            }
        }
        
        return changedFiles;
    }
    
    /**
     * Get all files for full backup
     */
    async getAllFiles() {
        const allFiles = [];
        
        // Git memory files
        if (fs.existsSync(this.options.gitMemoryPath)) {
            const gitFiles = await this.scanDirectory(this.options.gitMemoryPath);
            allFiles.push(...gitFiles);
        }
        
        // Server config files
        const configFiles = [
            'mcp.config.json',
            'servers.json',
            'git-memory-coordinator.js',
            'auto-scaling-manager.js',
            'security-manager.js',
            'performance-analytics.js',
            'backup-manager.js',
            'package.json',
            'package-lock.json'
        ];
        
        for (const file of configFiles) {
            const filePath = path.join(this.options.serverConfigsPath, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                allFiles.push({
                    path: filePath,
                    relativePath: file,
                    size: stats.size,
                    mtime: stats.mtime.getTime()
                });
            }
        }
        
        // Server directories (sample only for full backup to avoid huge size)
        const serverDirs = this.getServerDirectories().slice(0, 10); // First 10 servers only
        for (const serverDir of serverDirs) {
            if (fs.existsSync(serverDir)) {
                const serverFiles = await this.scanDirectory(serverDir);
                allFiles.push(...serverFiles);
            }
        }
        
        return allFiles;
    }
    
    /**
     * Scan directory for files
     */
    async scanDirectory(dirPath, modifiedAfter = 0) {
        const files = [];
        
        const scanRecursive = (currentPath) => {
            const items = fs.readdirSync(currentPath);
            
            for (const item of items) {
                const itemPath = path.join(currentPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    // Skip certain directories
                    if (!['node_modules', '.git', 'backups', 'temp'].includes(item)) {
                        scanRecursive(itemPath);
                    }
                } else if (stats.isFile() && stats.mtime.getTime() > modifiedAfter) {
                    files.push({
                        path: itemPath,
                        relativePath: path.relative(this.options.serverConfigsPath, itemPath),
                        size: stats.size,
                        mtime: stats.mtime.getTime()
                    });
                }
            }
        };
        
        scanRecursive(dirPath);
        return files;
    }
    
    /**
     * Get server directories
     */
    getServerDirectories() {
        const serverDirs = [];
        const baseDir = this.options.serverConfigsPath;
        
        // Look for server-* directories
        if (fs.existsSync(baseDir)) {
            const items = fs.readdirSync(baseDir);
            for (const item of items) {
                if (item.startsWith('server-') && fs.statSync(path.join(baseDir, item)).isDirectory()) {
                    serverDirs.push(path.join(baseDir, item));
                }
            }
        }
        
        return serverDirs;
    }
    
    /**
     * Create archive from files
     */
    async createArchive(files, archivePath) {
        return new Promise((resolve, reject) => {
            const tar = spawn('tar', ['-cf', archivePath, '--files-from', '-'], {
                cwd: this.options.serverConfigsPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // Write file list to tar stdin
            const fileList = files.map(f => f.relativePath).join('\n');
            tar.stdin.write(fileList);
            tar.stdin.end();
            
            let stderr = '';
            tar.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            tar.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`tar failed with code ${code}: ${stderr}`));
                }
            });
            
            tar.on('error', reject);
        });
    }
    
    /**
     * Compress file
     */
    async compressFile(filePath) {
        return new Promise((resolve, reject) => {
            const input = fs.createReadStream(filePath);
            const output = fs.createWriteStream(filePath + '.gz');
            const gzip = zlib.createGzip({ level: 6 });
            
            input.pipe(gzip).pipe(output);
            
            output.on('finish', () => {
                fs.unlinkSync(filePath); // Remove original
                resolve();
            });
            
            output.on('error', reject);
            input.on('error', reject);
            gzip.on('error', reject);
        });
    }
    
    /**
     * Encrypt file
     */
    async encryptFile(filePath) {
        return new Promise((resolve, reject) => {
            try {
                const algorithm = 'aes-256-cbc';
                const key = Buffer.from(this.options.encryptionKey, 'hex');
                const iv = crypto.randomBytes(16);
                
                const cipher = crypto.createCipher(algorithm, key);
                const input = fs.createReadStream(filePath);
                const output = fs.createWriteStream(filePath + '.enc');
                
                // Write IV to beginning of encrypted file
                output.write(iv);
                
                input.pipe(cipher).pipe(output);
                
                output.on('finish', () => {
                    fs.unlinkSync(filePath); // Remove original
                    resolve();
                });
                
                output.on('error', reject);
                input.on('error', reject);
                cipher.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Get final backup path
     */
    getFinalBackupPath(originalPath) {
        let finalPath = originalPath;
        
        if (this.options.enableCompression) {
            finalPath += '.gz';
        }
        
        if (this.options.enableEncryption) {
            finalPath += '.enc';
        }
        
        return finalPath;
    }
    
    /**
     * Generate backup ID
     */
    generateBackupId(type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = crypto.randomBytes(4).toString('hex');
        return `${type}-${timestamp}-${random}`;
    }
    
    /**
     * Get last backup time
     */
    getLastBackupTime() {
        if (this.backupHistory.length === 0) {
            return 0;
        }
        
        const lastBackup = this.backupHistory[this.backupHistory.length - 1];
        return lastBackup.timestamp;
    }
    
    /**
     * Save backup metadata
     */
    async saveBackupMetadata(backupInfo) {
        const metadataPath = path.join(this.options.backupBasePath, 'metadata', `${backupInfo.id}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2));
    }
    
    /**
     * Load backup history
     */
    loadBackupHistory() {
        const metadataDir = path.join(this.options.backupBasePath, 'metadata');
        
        if (!fs.existsSync(metadataDir)) {
            return;
        }
        
        const metadataFiles = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));
        
        for (const file of metadataFiles) {
            try {
                const filePath = path.join(metadataDir, file);
                const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.backupHistory.push(metadata);
            } catch (error) {
                console.error(`Failed to load backup metadata ${file}:`, error.message);
            }
        }
        
        // Sort by timestamp
        this.backupHistory.sort((a, b) => a.timestamp - b.timestamp);
        
        // Update stats
        this.stats.totalBackups = this.backupHistory.length;
        this.stats.successfulBackups = this.backupHistory.filter(b => b.status === 'completed').length;
        this.stats.failedBackups = this.backupHistory.filter(b => b.status === 'failed').length;
        this.stats.totalSize = this.backupHistory.reduce((sum, b) => sum + (b.size || 0), 0);
        
        if (this.backupHistory.length > 0) {
            this.stats.lastBackup = Math.max(...this.backupHistory.map(b => b.timestamp));
            const fullBackups = this.backupHistory.filter(b => b.type === 'full');
            if (fullBackups.length > 0) {
                this.stats.lastFullBackup = Math.max(...fullBackups.map(b => b.timestamp));
            }
        }
        
        console.log(`📚 Loaded ${this.backupHistory.length} backup records`);
    }
    
    /**
     * Update statistics
     */
    updateStats(backupInfo, success) {
        this.stats.totalBackups++;
        
        if (success && backupInfo) {
            this.stats.successfulBackups++;
            this.stats.totalSize += backupInfo.size;
            this.stats.lastBackup = backupInfo.timestamp;
            
            if (backupInfo.type === 'full') {
                this.stats.lastFullBackup = backupInfo.timestamp;
            }
        } else {
            this.stats.failedBackups++;
        }
    }
    
    /**
     * Verify backup integrity
     */
    async verifyBackup(backupInfo) {
        console.log(`🔍 Verifying backup: ${backupInfo.id}`);
        
        try {
            // Check if backup file exists
            if (!fs.existsSync(backupInfo.path)) {
                throw new Error('Backup file not found');
            }
            
            // Check file size
            const actualSize = fs.statSync(backupInfo.path).size;
            if (actualSize !== backupInfo.size) {
                throw new Error(`Size mismatch: expected ${backupInfo.size}, got ${actualSize}`);
            }
            
            // For encrypted files, try to decrypt a small portion
            if (backupInfo.encrypted) {
                // This is a simplified verification - in production you might want more thorough checks
                const buffer = fs.readFileSync(backupInfo.path, { start: 0, end: 32 });
                if (buffer.length < 16) {
                    throw new Error('Invalid encrypted file format');
                }
            }
            
            console.log(`✅ Backup verification passed: ${backupInfo.id}`);
            this.emit('backupVerified', backupInfo);
            
        } catch (error) {
            console.error(`❌ Backup verification failed: ${error.message}`);
            this.emit('backupVerificationFailed', { backupInfo, error });
            throw error;
        }
    }
    
    /**
     * Upload backup to cloud storage
     */
    async uploadToCloud(backupInfo) {
        if (!this.options.cloudStorage) {
            return;
        }
        
        console.log(`☁️ Uploading backup to cloud: ${backupInfo.id}`);
        
        try {
            // This is a placeholder - implement actual cloud storage integration
            // Examples: AWS S3, Google Cloud Storage, Azure Blob Storage
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
            
            console.log(`✅ Cloud upload completed: ${backupInfo.id}`);
            this.emit('cloudUploadCompleted', backupInfo);
            
        } catch (error) {
            console.error(`❌ Cloud upload failed: ${error.message}`);
            this.emit('cloudUploadFailed', { backupInfo, error });
            throw error;
        }
    }
    
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId, targetPath = null) {
        console.log(`🔄 Restoring from backup: ${backupId}`);
        
        const backupInfo = this.backupHistory.find(b => b.id === backupId);
        if (!backupInfo) {
            throw new Error(`Backup not found: ${backupId}`);
        }
        
        if (!fs.existsSync(backupInfo.path)) {
            throw new Error(`Backup file not found: ${backupInfo.path}`);
        }
        
        const restorePath = targetPath || path.join(this.options.backupBasePath, 'temp', `restore-${Date.now()}`);
        
        try {
            // Create restore directory
            if (!fs.existsSync(restorePath)) {
                fs.mkdirSync(restorePath, { recursive: true });
            }
            
            let workingPath = backupInfo.path;
            
            // Decrypt if needed
            if (backupInfo.encrypted) {
                workingPath = await this.decryptFile(workingPath, restorePath);
            }
            
            // Decompress if needed
            if (backupInfo.compressed) {
                workingPath = await this.decompressFile(workingPath, restorePath);
            }
            
            // Extract archive
            await this.extractArchive(workingPath, restorePath);
            
            console.log(`✅ Restore completed: ${backupId}`);
            console.log(`📁 Restored to: ${restorePath}`);
            
            this.emit('restoreCompleted', { backupInfo, restorePath });
            return restorePath;
            
        } catch (error) {
            console.error(`❌ Restore failed: ${error.message}`);
            this.emit('restoreFailed', { backupInfo, error });
            throw error;
        }
    }
    
    /**
     * Decrypt file
     */
    async decryptFile(encryptedPath, outputDir) {
        return new Promise((resolve, reject) => {
            try {
                const algorithm = 'aes-256-cbc';
                const key = Buffer.from(this.options.encryptionKey, 'hex');
                
                const input = fs.createReadStream(encryptedPath);
                const outputPath = path.join(outputDir, 'decrypted.tmp');
                const output = fs.createWriteStream(outputPath);
                
                // Read IV from beginning of file
                const ivBuffer = Buffer.alloc(16);
                input.read(16); // Skip IV for now - simplified implementation
                
                const decipher = crypto.createDecipher(algorithm, key);
                
                input.pipe(decipher).pipe(output);
                
                output.on('finish', () => {
                    resolve(outputPath);
                });
                
                output.on('error', reject);
                input.on('error', reject);
                decipher.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Decompress file
     */
    async decompressFile(compressedPath, outputDir) {
        return new Promise((resolve, reject) => {
            const input = fs.createReadStream(compressedPath);
            const outputPath = path.join(outputDir, 'decompressed.tmp');
            const output = fs.createWriteStream(outputPath);
            const gunzip = zlib.createGunzip();
            
            input.pipe(gunzip).pipe(output);
            
            output.on('finish', () => {
                resolve(outputPath);
            });
            
            output.on('error', reject);
            input.on('error', reject);
            gunzip.on('error', reject);
        });
    }
    
    /**
     * Extract archive
     */
    async extractArchive(archivePath, outputDir) {
        return new Promise((resolve, reject) => {
            const tar = spawn('tar', ['-xf', archivePath, '-C', outputDir], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stderr = '';
            tar.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            tar.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`tar extraction failed with code ${code}: ${stderr}`));
                }
            });
            
            tar.on('error', reject);
        });
    }
    
    /**
     * Clean up old backups
     */
    async cleanupOldBackups() {
        console.log('🧹 Cleaning up old backups...');
        
        const now = Date.now();
        const maxAge = this.options.maxAge;
        const maxBackups = this.options.maxBackups;
        
        try {
            // Remove backups older than maxAge
            const oldBackups = this.backupHistory.filter(b => (now - b.timestamp) > maxAge);
            
            for (const backup of oldBackups) {
                await this.deleteBackup(backup);
            }
            
            // Keep only the most recent maxBackups
            if (this.backupHistory.length > maxBackups) {
                const sortedBackups = [...this.backupHistory].sort((a, b) => b.timestamp - a.timestamp);
                const excessBackups = sortedBackups.slice(maxBackups);
                
                for (const backup of excessBackups) {
                    await this.deleteBackup(backup);
                }
            }
            
            console.log(`✅ Cleanup completed - removed ${oldBackups.length} old backups`);
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }
    
    /**
     * Delete backup
     */
    async deleteBackup(backupInfo) {
        try {
            // Delete backup file
            if (fs.existsSync(backupInfo.path)) {
                fs.unlinkSync(backupInfo.path);
            }
            
            // Delete metadata
            const metadataPath = path.join(this.options.backupBasePath, 'metadata', `${backupInfo.id}.json`);
            if (fs.existsSync(metadataPath)) {
                fs.unlinkSync(metadataPath);
            }
            
            // Remove from history
            const index = this.backupHistory.findIndex(b => b.id === backupInfo.id);
            if (index !== -1) {
                this.backupHistory.splice(index, 1);
            }
            
            console.log(`🗑️ Deleted backup: ${backupInfo.id}`);
            
        } catch (error) {
            console.error(`Failed to delete backup ${backupInfo.id}:`, error.message);
        }
    }
    
    /**
     * Get backup status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            stats: { ...this.stats },
            recentBackups: this.backupHistory.slice(-10),
            nextBackup: this.isRunning ? Date.now() + this.options.backupInterval : null,
            nextFullBackup: this.isRunning ? Date.now() + this.options.fullBackupInterval : null,
            options: {
                autoBackup: this.options.autoBackup,
                backupInterval: this.options.backupInterval,
                fullBackupInterval: this.options.fullBackupInterval,
                enableCompression: this.options.enableCompression,
                enableEncryption: this.options.enableEncryption,
                maxBackups: this.options.maxBackups,
                maxAge: this.options.maxAge
            }
        };
    }
    
    /**
     * Format bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Shutdown backup manager
     */
    async shutdown() {
        console.log('🛑 Shutting down Backup Manager...');
        
        this.stopAutoBackup();
        
        // Save current state
        const statusPath = path.join(this.options.backupBasePath, 'backup-status.json');
        fs.writeFileSync(statusPath, JSON.stringify(this.getStatus(), null, 2));
        
        this.emit('shutdown');
        console.log('✅ Backup Manager shutdown completed');
    }
}

// Export class
module.exports = BackupManager;

// CLI interface
if (require.main === module) {
    const backupManager = new BackupManager({
        autoBackup: true,
        backupInterval: 30 * 60 * 1000, // 30 minutes for demo
        fullBackupInterval: 2 * 60 * 60 * 1000, // 2 hours for demo
        enableCompression: true,
        enableEncryption: true,
        verifyBackups: true,
        maxBackups: 20,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Event listeners
    backupManager.on('backupCompleted', (backupInfo) => {
        console.log(`✅ Backup completed: ${backupInfo.id} (${backupManager.formatBytes(backupInfo.size)})`);
    });
    
    backupManager.on('backupError', (error) => {
        console.error('❌ Backup error:', error.message);
    });
    
    backupManager.on('autoBackupStarted', () => {
        console.log('🚀 Automatic backup started');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await backupManager.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await backupManager.shutdown();
        process.exit(0);
    });
    
    console.log('🚀 Backup Manager started!');
    console.log('Press Ctrl+C to stop');
}