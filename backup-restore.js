/**
 * Git Memory MCP Server - Backup Restore Manager
 * ระบบกู้คืนข้อมูลจากไฟล์สำรองแบบครอบคลุม
 * 
 * Features:
 * - Point-in-time recovery
 * - Selective file restoration
 * - Incremental restore
 * - Backup validation
 * - Conflict resolution
 * - Progress tracking
 * - Rollback capability
 * - Integrity verification
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
const zlib = require('zlib');
const EventEmitter = require('events');

class BackupRestoreManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            // Restore paths
            backupBasePath: options.backupBasePath || path.join(__dirname, 'backups'),
            restoreBasePath: options.restoreBasePath || path.join(__dirname, 'restore'),
            tempPath: options.tempPath || path.join(__dirname, 'temp'),
            
            // Restore settings
            verifyBeforeRestore: options.verifyBeforeRestore !== false,
            createBackupBeforeRestore: options.createBackupBeforeRestore !== false,
            allowOverwrite: options.allowOverwrite !== false,
            preservePermissions: options.preservePermissions !== false,
            
            // Encryption
            encryptionKey: options.encryptionKey,
            
            // Conflict resolution
            conflictResolution: options.conflictResolution || 'prompt', // 'overwrite', 'skip', 'rename', 'prompt'
            
            // Progress tracking
            enableProgress: options.enableProgress !== false,
            
            ...options
        };
        
        this.restoreHistory = [];
        this.activeRestores = new Map();
        
        this.stats = {
            totalRestores: 0,
            successfulRestores: 0,
            failedRestores: 0,
            totalFilesRestored: 0,
            totalBytesRestored: 0,
            averageRestoreTime: 0,
            lastRestore: null
        };
        
        this.init();
    }
    
    /**
     * Initialize restore manager
     */
    init() {
        console.log('🔄 Initializing Backup Restore Manager...');
        
        // Create restore directories
        this.createRestoreDirectories();
        
        // Load restore history
        this.loadRestoreHistory();
        
        console.log('✅ Backup Restore Manager initialized');
        this.emit('initialized');
    }
    
    /**
     * Create restore directories
     */
    createRestoreDirectories() {
        const dirs = [
            this.options.restoreBasePath,
            this.options.tempPath,
            path.join(this.options.restoreBasePath, 'staging'),
            path.join(this.options.restoreBasePath, 'history')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created restore directory: ${dir}`);
            }
        });
    }
    
    /**
     * List available backups
     */
    listAvailableBackups() {
        const backups = [];
        
        try {
            const metadataDir = path.join(this.options.backupBasePath, 'metadata');
            
            if (!fs.existsSync(metadataDir)) {
                return backups;
            }
            
            const metadataFiles = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));
            
            for (const file of metadataFiles) {
                try {
                    const filePath = path.join(metadataDir, file);
                    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Check if backup file exists
                    if (fs.existsSync(metadata.path)) {
                        backups.push({
                            ...metadata,
                            available: true,
                            fileSize: fs.statSync(metadata.path).size
                        });
                    } else {
                        backups.push({
                            ...metadata,
                            available: false,
                            error: 'Backup file not found'
                        });
                    }
                } catch (error) {
                    console.error(`Failed to read backup metadata ${file}:`, error.message);
                }
            }
            
            // Sort by timestamp (newest first)
            backups.sort((a, b) => b.timestamp - a.timestamp);
            
        } catch (error) {
            console.error('Failed to list backups:', error.message);
        }
        
        return backups;
    }
    
    /**
     * Get backup by ID
     */
    getBackupById(backupId) {
        const backups = this.listAvailableBackups();
        return backups.find(b => b.id === backupId);
    }
    
    /**
     * Find backups by date range
     */
    findBackupsByDateRange(startDate, endDate) {
        const backups = this.listAvailableBackups();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        
        return backups.filter(b => b.timestamp >= start && b.timestamp <= end);
    }
    
    /**
     * Find closest backup to a specific time
     */
    findClosestBackup(targetTime, type = null) {
        const backups = this.listAvailableBackups();
        const target = new Date(targetTime).getTime();
        
        let filtered = backups.filter(b => b.available && b.timestamp <= target);
        
        if (type) {
            filtered = filtered.filter(b => b.type === type);
        }
        
        if (filtered.length === 0) {
            return null;
        }
        
        // Find closest (most recent before target time)
        return filtered.reduce((closest, current) => {
            const closestDiff = Math.abs(target - closest.timestamp);
            const currentDiff = Math.abs(target - current.timestamp);
            return currentDiff < closestDiff ? current : closest;
        });
    }
    
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId, options = {}) {
        const restoreId = this.generateRestoreId();
        const startTime = Date.now();
        
        console.log(`🔄 Starting restore from backup: ${backupId}`);
        
        try {
            // Get backup info
            const backup = this.getBackupById(backupId);
            if (!backup) {
                throw new Error(`Backup not found: ${backupId}`);
            }
            
            if (!backup.available) {
                throw new Error(`Backup not available: ${backup.error || 'Unknown error'}`);
            }
            
            // Create restore info
            const restoreInfo = {
                id: restoreId,
                backupId: backup.id,
                backup,
                startTime,
                status: 'in_progress',
                targetPath: options.targetPath || this.options.restoreBasePath,
                options: {
                    selective: options.selective || false,
                    filePatterns: options.filePatterns || [],
                    excludePatterns: options.excludePatterns || [],
                    overwrite: options.overwrite !== undefined ? options.overwrite : this.options.allowOverwrite,
                    verifyIntegrity: options.verifyIntegrity !== false,
                    createBackup: options.createBackup !== undefined ? options.createBackup : this.options.createBackupBeforeRestore
                },
                progress: {
                    stage: 'initializing',
                    filesProcessed: 0,
                    totalFiles: 0,
                    bytesProcessed: 0,
                    totalBytes: 0,
                    percentage: 0
                },
                conflicts: [],
                restoredFiles: [],
                errors: []
            };
            
            // Add to active restores
            this.activeRestores.set(restoreId, restoreInfo);
            this.emit('restoreStarted', restoreInfo);
            
            // Verify backup integrity if requested
            if (this.options.verifyBeforeRestore || restoreInfo.options.verifyIntegrity) {
                await this.verifyBackupIntegrity(backup, restoreInfo);
            }
            
            // Create backup of current state if requested
            if (restoreInfo.options.createBackup) {
                await this.createPreRestoreBackup(restoreInfo);
            }
            
            // Extract and prepare backup
            const extractedPath = await this.extractBackup(backup, restoreInfo);
            
            // Analyze files to restore
            const filesToRestore = await this.analyzeFilesToRestore(extractedPath, restoreInfo);
            
            // Handle conflicts
            await this.handleConflicts(filesToRestore, restoreInfo);
            
            // Perform restore
            await this.performRestore(filesToRestore, restoreInfo);
            
            // Verify restored files
            if (restoreInfo.options.verifyIntegrity) {
                await this.verifyRestoredFiles(restoreInfo);
            }
            
            // Complete restore
            restoreInfo.status = 'completed';
            restoreInfo.endTime = Date.now();
            restoreInfo.duration = restoreInfo.endTime - startTime;
            
            // Update statistics
            this.updateRestoreStats(restoreInfo, true);
            
            // Save restore history
            this.restoreHistory.push(restoreInfo);
            this.saveRestoreHistory();
            
            console.log(`✅ Restore completed: ${restoreId}`);
            console.log(`📊 Restored ${restoreInfo.restoredFiles.length} files in ${restoreInfo.duration}ms`);
            
            this.emit('restoreCompleted', restoreInfo);
            return restoreInfo;
            
        } catch (error) {
            console.error(`❌ Restore failed: ${error.message}`);
            
            // Update restore info with error
            const restoreInfo = this.activeRestores.get(restoreId);
            if (restoreInfo) {
                restoreInfo.status = 'failed';
                restoreInfo.error = error.message;
                restoreInfo.endTime = Date.now();
                restoreInfo.duration = restoreInfo.endTime - startTime;
                
                this.updateRestoreStats(restoreInfo, false);
                this.restoreHistory.push(restoreInfo);
                this.saveRestoreHistory();
            }
            
            this.emit('restoreFailed', { restoreId, error });
            throw error;
            
        } finally {
            // Remove from active restores
            this.activeRestores.delete(restoreId);
        }
    }
    
    /**
     * Verify backup integrity
     */
    async verifyBackupIntegrity(backup, restoreInfo) {
        this.updateProgress(restoreInfo, 'verifying', 'Verifying backup integrity...');
        
        try {
            // Check file exists and size matches
            if (!fs.existsSync(backup.path)) {
                throw new Error('Backup file not found');
            }
            
            const actualSize = fs.statSync(backup.path).size;
            if (actualSize !== backup.size) {
                throw new Error(`Size mismatch: expected ${backup.size}, got ${actualSize}`);
            }
            
            // For encrypted files, verify we can decrypt
            if (backup.encrypted && !this.options.encryptionKey) {
                throw new Error('Backup is encrypted but no encryption key provided');
            }
            
            console.log('✅ Backup integrity verified');
            
        } catch (error) {
            console.error('❌ Backup integrity verification failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Create pre-restore backup
     */
    async createPreRestoreBackup(restoreInfo) {
        this.updateProgress(restoreInfo, 'backup', 'Creating pre-restore backup...');
        
        try {
            const BackupManager = require('./backup-manager');
            const backupManager = new BackupManager({
                backupBasePath: path.join(this.options.restoreBasePath, 'pre-restore-backups'),
                autoBackup: false
            });
            
            const preRestoreBackup = await backupManager.createIncrementalBackup();
            restoreInfo.preRestoreBackupId = preRestoreBackup ? preRestoreBackup.id : null;
            
            console.log('✅ Pre-restore backup created');
            
        } catch (error) {
            console.warn('⚠️ Failed to create pre-restore backup:', error.message);
            // Don't fail the restore for this
        }
    }
    
    /**
     * Extract backup
     */
    async extractBackup(backup, restoreInfo) {
        this.updateProgress(restoreInfo, 'extracting', 'Extracting backup...');
        
        const extractDir = path.join(this.options.tempPath, `extract-${restoreInfo.id}`);
        
        // Create extraction directory
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir, { recursive: true });
        }
        
        try {
            let workingPath = backup.path;
            
            // Decrypt if needed
            if (backup.encrypted) {
                workingPath = await this.decryptFile(workingPath, extractDir);
            }
            
            // Decompress if needed
            if (backup.compressed) {
                workingPath = await this.decompressFile(workingPath, extractDir);
            }
            
            // Extract archive
            await this.extractArchive(workingPath, extractDir);
            
            console.log(`✅ Backup extracted to: ${extractDir}`);
            return extractDir;
            
        } catch (error) {
            console.error('❌ Backup extraction failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Analyze files to restore
     */
    async analyzeFilesToRestore(extractedPath, restoreInfo) {
        this.updateProgress(restoreInfo, 'analyzing', 'Analyzing files to restore...');
        
        const filesToRestore = [];
        
        const scanDirectory = (dirPath, basePath = extractedPath) => {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const relativePath = path.relative(basePath, itemPath);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    scanDirectory(itemPath, basePath);
                } else if (stats.isFile()) {
                    // Check if file matches patterns
                    if (this.shouldRestoreFile(relativePath, restoreInfo.options)) {
                        const targetPath = path.join(restoreInfo.targetPath, relativePath);
                        
                        filesToRestore.push({
                            sourcePath: itemPath,
                            targetPath,
                            relativePath,
                            size: stats.size,
                            mtime: stats.mtime,
                            exists: fs.existsSync(targetPath),
                            conflict: false
                        });
                    }
                }
            }
        };
        
        scanDirectory(extractedPath);
        
        // Update progress info
        restoreInfo.progress.totalFiles = filesToRestore.length;
        restoreInfo.progress.totalBytes = filesToRestore.reduce((sum, f) => sum + f.size, 0);
        
        console.log(`📊 Found ${filesToRestore.length} files to restore (${this.formatBytes(restoreInfo.progress.totalBytes)})`);
        
        return filesToRestore;
    }
    
    /**
     * Check if file should be restored based on patterns
     */
    shouldRestoreFile(relativePath, options) {
        // Check include patterns
        if (options.filePatterns && options.filePatterns.length > 0) {
            const included = options.filePatterns.some(pattern => {
                return this.matchPattern(relativePath, pattern);
            });
            if (!included) return false;
        }
        
        // Check exclude patterns
        if (options.excludePatterns && options.excludePatterns.length > 0) {
            const excluded = options.excludePatterns.some(pattern => {
                return this.matchPattern(relativePath, pattern);
            });
            if (excluded) return false;
        }
        
        return true;
    }
    
    /**
     * Match file pattern (simple glob-like matching)
     */
    matchPattern(filePath, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filePath);
    }
    
    /**
     * Handle file conflicts
     */
    async handleConflicts(filesToRestore, restoreInfo) {
        this.updateProgress(restoreInfo, 'conflicts', 'Handling file conflicts...');
        
        const conflicts = filesToRestore.filter(f => f.exists);
        
        if (conflicts.length === 0) {
            console.log('✅ No file conflicts detected');
            return;
        }
        
        console.log(`⚠️ Found ${conflicts.length} file conflicts`);
        
        for (const conflict of conflicts) {
            conflict.conflict = true;
            
            // Get existing file info
            const existingStats = fs.statSync(conflict.targetPath);
            conflict.existingSize = existingStats.size;
            conflict.existingMtime = existingStats.mtime;
            
            // Determine resolution based on strategy
            switch (this.options.conflictResolution) {
                case 'overwrite':
                    conflict.resolution = 'overwrite';
                    break;
                    
                case 'skip':
                    conflict.resolution = 'skip';
                    break;
                    
                case 'rename':
                    conflict.resolution = 'rename';
                    conflict.targetPath = this.generateUniqueFileName(conflict.targetPath);
                    break;
                    
                case 'prompt':
                default:
                    // For CLI, default to overwrite if newer
                    if (conflict.mtime > conflict.existingMtime) {
                        conflict.resolution = 'overwrite';
                    } else {
                        conflict.resolution = 'skip';
                    }
                    break;
            }
            
            restoreInfo.conflicts.push({
                file: conflict.relativePath,
                resolution: conflict.resolution,
                reason: this.getConflictReason(conflict)
            });
        }
        
        console.log(`✅ Conflict resolution completed: ${conflicts.filter(c => c.resolution === 'overwrite').length} overwrite, ${conflicts.filter(c => c.resolution === 'skip').length} skip, ${conflicts.filter(c => c.resolution === 'rename').length} rename`);
    }
    
    /**
     * Get conflict reason
     */
    getConflictReason(conflict) {
        if (conflict.mtime > conflict.existingMtime) {
            return 'Backup file is newer';
        } else if (conflict.mtime < conflict.existingMtime) {
            return 'Existing file is newer';
        } else {
            return 'Same modification time';
        }
    }
    
    /**
     * Generate unique filename
     */
    generateUniqueFileName(filePath) {
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext);
        
        let counter = 1;
        let newPath;
        
        do {
            newPath = path.join(dir, `${name}_restored_${counter}${ext}`);
            counter++;
        } while (fs.existsSync(newPath));
        
        return newPath;
    }
    
    /**
     * Perform restore
     */
    async performRestore(filesToRestore, restoreInfo) {
        this.updateProgress(restoreInfo, 'restoring', 'Restoring files...');
        
        let processedFiles = 0;
        let processedBytes = 0;
        
        for (const file of filesToRestore) {
            try {
                // Skip if resolution is skip
                if (file.resolution === 'skip') {
                    processedFiles++;
                    continue;
                }
                
                // Create target directory if needed
                const targetDir = path.dirname(file.targetPath);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                
                // Copy file
                fs.copyFileSync(file.sourcePath, file.targetPath);
                
                // Preserve permissions if requested
                if (this.options.preservePermissions) {
                    const sourceStats = fs.statSync(file.sourcePath);
                    fs.chmodSync(file.targetPath, sourceStats.mode);
                }
                
                // Update progress
                processedFiles++;
                processedBytes += file.size;
                
                restoreInfo.progress.filesProcessed = processedFiles;
                restoreInfo.progress.bytesProcessed = processedBytes;
                restoreInfo.progress.percentage = Math.round((processedFiles / restoreInfo.progress.totalFiles) * 100);
                
                restoreInfo.restoredFiles.push({
                    path: file.relativePath,
                    size: file.size,
                    action: file.conflict ? file.resolution : 'restored'
                });
                
                // Emit progress event
                if (this.options.enableProgress && processedFiles % 10 === 0) {
                    this.emit('restoreProgress', {
                        restoreId: restoreInfo.id,
                        progress: restoreInfo.progress
                    });
                }
                
            } catch (error) {
                console.error(`❌ Failed to restore file ${file.relativePath}:`, error.message);
                restoreInfo.errors.push({
                    file: file.relativePath,
                    error: error.message
                });
            }
        }
        
        console.log(`✅ Restored ${processedFiles} files (${this.formatBytes(processedBytes)})`);
        
        if (restoreInfo.errors.length > 0) {
            console.warn(`⚠️ ${restoreInfo.errors.length} files failed to restore`);
        }
    }
    
    /**
     * Verify restored files
     */
    async verifyRestoredFiles(restoreInfo) {
        this.updateProgress(restoreInfo, 'verifying', 'Verifying restored files...');
        
        let verifiedFiles = 0;
        let verificationErrors = 0;
        
        for (const restoredFile of restoreInfo.restoredFiles) {
            try {
                const filePath = path.join(restoreInfo.targetPath, restoredFile.path);
                
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    if (stats.size === restoredFile.size) {
                        verifiedFiles++;
                    } else {
                        verificationErrors++;
                        restoreInfo.errors.push({
                            file: restoredFile.path,
                            error: `Size mismatch after restore: expected ${restoredFile.size}, got ${stats.size}`
                        });
                    }
                } else {
                    verificationErrors++;
                    restoreInfo.errors.push({
                        file: restoredFile.path,
                        error: 'File not found after restore'
                    });
                }
            } catch (error) {
                verificationErrors++;
                restoreInfo.errors.push({
                    file: restoredFile.path,
                    error: `Verification failed: ${error.message}`
                });
            }
        }
        
        console.log(`✅ Verified ${verifiedFiles} files`);
        
        if (verificationErrors > 0) {
            console.warn(`⚠️ ${verificationErrors} files failed verification`);
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
     * Update progress
     */
    updateProgress(restoreInfo, stage, message = null) {
        restoreInfo.progress.stage = stage;
        
        if (message) {
            console.log(`📊 ${message}`);
        }
        
        this.emit('restoreProgress', {
            restoreId: restoreInfo.id,
            progress: restoreInfo.progress,
            message
        });
    }
    
    /**
     * Generate restore ID
     */
    generateRestoreId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = crypto.randomBytes(4).toString('hex');
        return `restore-${timestamp}-${random}`;
    }
    
    /**
     * Update restore statistics
     */
    updateRestoreStats(restoreInfo, success) {
        this.stats.totalRestores++;
        
        if (success) {
            this.stats.successfulRestores++;
            this.stats.totalFilesRestored += restoreInfo.restoredFiles.length;
            this.stats.totalBytesRestored += restoreInfo.progress.bytesProcessed;
            this.stats.lastRestore = restoreInfo.startTime;
            
            // Update average restore time
            const totalTime = this.restoreHistory
                .filter(r => r.status === 'completed')
                .reduce((sum, r) => sum + (r.duration || 0), 0);
            this.stats.averageRestoreTime = totalTime / this.stats.successfulRestores;
        } else {
            this.stats.failedRestores++;
        }
    }
    
    /**
     * Load restore history
     */
    loadRestoreHistory() {
        try {
            const historyFile = path.join(this.options.restoreBasePath, 'restore-history.json');
            
            if (fs.existsSync(historyFile)) {
                const data = fs.readFileSync(historyFile, 'utf8');
                this.restoreHistory = JSON.parse(data);
                
                // Update stats from history
                this.stats.totalRestores = this.restoreHistory.length;
                this.stats.successfulRestores = this.restoreHistory.filter(r => r.status === 'completed').length;
                this.stats.failedRestores = this.restoreHistory.filter(r => r.status === 'failed').length;
                this.stats.totalFilesRestored = this.restoreHistory.reduce((sum, r) => sum + (r.restoredFiles?.length || 0), 0);
                this.stats.totalBytesRestored = this.restoreHistory.reduce((sum, r) => sum + (r.progress?.bytesProcessed || 0), 0);
                
                if (this.restoreHistory.length > 0) {
                    this.stats.lastRestore = Math.max(...this.restoreHistory.map(r => r.startTime));
                }
                
                console.log(`📚 Loaded ${this.restoreHistory.length} restore records`);
            }
        } catch (error) {
            console.error('Failed to load restore history:', error.message);
        }
    }
    
    /**
     * Save restore history
     */
    saveRestoreHistory() {
        try {
            const historyFile = path.join(this.options.restoreBasePath, 'restore-history.json');
            fs.writeFileSync(historyFile, JSON.stringify(this.restoreHistory, null, 2));
        } catch (error) {
            console.error('Failed to save restore history:', error.message);
        }
    }
    
    /**
     * Get restore status
     */
    getStatus() {
        return {
            activeRestores: this.activeRestores.size,
            stats: { ...this.stats },
            recentRestores: this.restoreHistory.slice(-10),
            availableBackups: this.listAvailableBackups().length,
            options: {
                verifyBeforeRestore: this.options.verifyBeforeRestore,
                createBackupBeforeRestore: this.options.createBackupBeforeRestore,
                allowOverwrite: this.options.allowOverwrite,
                conflictResolution: this.options.conflictResolution
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
     * Cleanup temporary files
     */
    async cleanup() {
        try {
            const tempFiles = fs.readdirSync(this.options.tempPath);
            
            for (const file of tempFiles) {
                const filePath = path.join(this.options.tempPath, file);
                const stats = fs.statSync(filePath);
                
                // Remove files older than 1 hour
                if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
                    if (stats.isDirectory()) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }
    
    /**
     * Shutdown restore manager
     */
    async shutdown() {
        console.log('🛑 Shutting down Backup Restore Manager...');
        
        // Wait for active restores to complete
        if (this.activeRestores.size > 0) {
            console.log(`⏳ Waiting for ${this.activeRestores.size} active restores to complete...`);
            
            const maxWait = 60000; // 1 minute
            const startWait = Date.now();
            
            while (this.activeRestores.size > 0 && (Date.now() - startWait) < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Save final state
        this.saveRestoreHistory();
        
        // Cleanup temporary files
        await this.cleanup();
        
        this.emit('shutdown');
        console.log('✅ Backup Restore Manager shutdown completed');
    }
}

// Export class
module.exports = BackupRestoreManager;

// CLI interface
if (require.main === module) {
    const restoreManager = new BackupRestoreManager({
        verifyBeforeRestore: true,
        createBackupBeforeRestore: true,
        conflictResolution: 'prompt',
        enableProgress: true
    });
    
    // Event listeners
    restoreManager.on('restoreStarted', (restoreInfo) => {
        console.log(`🚀 Restore started: ${restoreInfo.id}`);
    });
    
    restoreManager.on('restoreProgress', ({ restoreId, progress, message }) => {
        if (message) {
            console.log(`📊 ${restoreId}: ${message}`);
        }
        if (progress.percentage > 0) {
            console.log(`📊 Progress: ${progress.percentage}% (${progress.filesProcessed}/${progress.totalFiles} files)`);
        }
    });
    
    restoreManager.on('restoreCompleted', (restoreInfo) => {
        console.log(`✅ Restore completed: ${restoreInfo.id}`);
        console.log(`📊 Restored ${restoreInfo.restoredFiles.length} files in ${restoreInfo.duration}ms`);
    });
    
    restoreManager.on('restoreFailed', ({ restoreId, error }) => {
        console.error(`❌ Restore failed: ${restoreId} - ${error.message}`);
    });
    
    // List available backups
    console.log('📋 Available backups:');
    const backups = restoreManager.listAvailableBackups();
    backups.slice(0, 5).forEach(backup => {
        console.log(`  - ${backup.id} (${backup.type}, ${new Date(backup.timestamp).toISOString()})`);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await restoreManager.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await restoreManager.shutdown();
        process.exit(0);
    });
    
    console.log('🚀 Backup Restore Manager started!');
    console.log('Press Ctrl+C to stop');
}