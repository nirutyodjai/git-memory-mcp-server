#!/usr/bin/env node

/**
 * Git Memory Sharing Service
 * ระบบแชร์ไฟล์และข้อมูลใน git-memory system
 * รองรับการแชร์แบบ real-time และ collaborative
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class GitMemorySharing extends EventEmitter {
    constructor(options = {}) {
        super();
        this.gitMemoryPath = options.gitMemoryPath || path.join(process.cwd(), 'git-memory');
        this.memoryPath = options.memoryPath || path.join(process.cwd(), 'memory');
        this.dataPath = options.dataPath || path.join(process.cwd(), 'data');
        this.sharesPath = path.join(this.dataPath, 'shares');
        
        // ระบบแชร์
        this.activeShares = new Map();
        this.shareSubscribers = new Map();
        this.sharePermissions = new Map();
        
        // การตั้งค่า
        this.config = {
            maxShareSize: 50 * 1024 * 1024, // 50MB
            maxShareDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
            allowedFileTypes: ['.js', '.ts', '.json', '.md', '.txt', '.yml', '.yaml', '.xml'],
            compressionEnabled: true,
            encryptionEnabled: true
        };
        
        this.init();
    }
    
    async init() {
        try {
            // สร้างโฟลเดอร์ที่จำเป็น
            await this.ensureDirectories();
            
            // โหลดการแชร์ที่มีอยู่
            await this.loadExistingShares();
            
            // เริ่มระบบ monitoring
            this.startMonitoring();
            
            console.log('🤝 Git Memory Sharing Service initialized');
            console.log(`📁 Shares Path: ${this.sharesPath}`);
            console.log(`🔧 Active Shares: ${this.activeShares.size}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Git Memory Sharing:', error.message);
            throw error;
        }
    }
    
    async ensureDirectories() {
        const dirs = [this.gitMemoryPath, this.memoryPath, this.dataPath, this.sharesPath];
        
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    }
    
    // === การแชร์ไฟล์ ===
    
    async shareFile(filePath, recipients, options = {}) {
        try {
            const shareId = this.generateShareId();
            const absolutePath = path.resolve(filePath);
            
            // ตรวจสอบไฟล์
            const fileStats = await fs.stat(absolutePath);
            if (fileStats.size > this.config.maxShareSize) {
                throw new Error(`File too large: ${fileStats.size} bytes`);
            }
            
            // ตรวจสอบประเภทไฟล์
            const fileExt = path.extname(absolutePath).toLowerCase();
            if (!Array.isArray(this.config.allowedFileTypes) || !this.config.allowedFileTypes.includes(fileExt)) {
                throw new Error(`File type not allowed: ${fileExt}`);
            }
            
            // อ่านไฟล์
            const fileContent = await fs.readFile(absolutePath, 'utf8');
            
            // สร้างข้อมูลการแชร์
            const shareData = {
                id: shareId,
                type: 'file',
                originalPath: absolutePath,
                fileName: path.basename(absolutePath),
                fileSize: fileStats.size,
                content: fileContent,
                recipients: Array.isArray(recipients) ? recipients : [recipients],
                permissions: {
                    read: options.read !== false,
                    write: options.write === true,
                    download: options.download !== false,
                    share: options.share === true
                },
                metadata: {
                    createdAt: new Date().toISOString(),
                    createdBy: options.createdBy || 'system',
                    expiresAt: options.expiresAt || new Date(Date.now() + this.config.maxShareDuration).toISOString(),
                    description: options.description || '',
                    tags: options.tags || []
                },
                stats: {
                    views: 0,
                    downloads: 0,
                    lastAccessed: null
                }
            };
            
            // บันทึกการแชร์
            await this.saveShare(shareData);
            
            // เพิ่มใน active shares
            this.activeShares.set(shareId, shareData);
            
            // ส่งการแจ้งเตือน
            this.emit('fileShared', {
                shareId,
                fileName: shareData.fileName,
                recipients: shareData.recipients,
                createdBy: shareData.metadata.createdBy
            });
            
            console.log(`📤 File shared: ${shareData.fileName} (${shareId})`);
            return shareId;
            
        } catch (error) {
            console.error('❌ Failed to share file:', error.message);
            throw error;
        }
    }
    
    async shareDirectory(dirPath, recipients, options = {}) {
        try {
            const shareId = this.generateShareId();
            const absolutePath = path.resolve(dirPath);
            
            // อ่านไฟล์ในโฟลเดอร์
            const files = await this.readDirectoryRecursive(absolutePath);
            
            // ตรวจสอบขนาดรวม
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            if (totalSize > this.config.maxShareSize) {
                throw new Error(`Directory too large: ${totalSize} bytes`);
            }
            
            // สร้างข้อมูลการแชร์
            const shareData = {
                id: shareId,
                type: 'directory',
                originalPath: absolutePath,
                directoryName: path.basename(absolutePath),
                files: files,
                totalSize: totalSize,
                recipients: Array.isArray(recipients) ? recipients : [recipients],
                permissions: {
                    read: options.read !== false,
                    write: options.write === true,
                    download: options.download !== false,
                    share: options.share === true
                },
                metadata: {
                    createdAt: new Date().toISOString(),
                    createdBy: options.createdBy || 'system',
                    expiresAt: options.expiresAt || new Date(Date.now() + this.config.maxShareDuration).toISOString(),
                    description: options.description || '',
                    tags: options.tags || []
                },
                stats: {
                    views: 0,
                    downloads: 0,
                    lastAccessed: null
                }
            };
            
            // บันทึกการแชร์
            await this.saveShare(shareData);
            
            // เพิ่มใน active shares
            this.activeShares.set(shareId, shareData);
            
            // ส่งการแจ้งเตือน
            this.emit('directoryShared', {
                shareId,
                directoryName: shareData.directoryName,
                fileCount: files.length,
                recipients: shareData.recipients,
                createdBy: shareData.metadata.createdBy
            });
            
            console.log(`📁 Directory shared: ${shareData.directoryName} (${files.length} files, ${shareId})`);
            return shareId;
            
        } catch (error) {
            console.error('❌ Failed to share directory:', error.message);
            throw error;
        }
    }
    
    // === การเข้าถึงข้อมูลที่แชร์ ===
    
    async getSharedContent(shareId, userId, options = {}) {
        try {
            const shareData = this.activeShares.get(shareId);
            if (!shareData) {
                throw new Error(`Share not found: ${shareId}`);
            }
            
            // ตรวจสอบสิทธิ์
            if (!this.checkPermission(shareData, userId, 'read')) {
                throw new Error(`Access denied for user: ${userId}`);
            }
            
            // ตรวจสอบการหมดอายุ
            if (new Date() > new Date(shareData.metadata.expiresAt)) {
                throw new Error(`Share expired: ${shareId}`);
            }
            
            // อัปเดตสถิติ
            shareData.stats.views++;
            shareData.stats.lastAccessed = new Date().toISOString();
            await this.updateShare(shareData);
            
            // ส่งการแจ้งเตือน
            this.emit('shareAccessed', {
                shareId,
                userId,
                type: shareData.type,
                fileName: shareData.fileName || shareData.directoryName
            });
            
            // ส่งคืนข้อมูล
            const result = {
                id: shareData.id,
                type: shareData.type,
                metadata: shareData.metadata,
                permissions: shareData.permissions
            };
            
            if (shareData.type === 'file') {
                result.fileName = shareData.fileName;
                result.content = shareData.content;
                result.fileSize = shareData.fileSize;
            } else if (shareData.type === 'directory') {
                result.directoryName = shareData.directoryName;
                result.files = shareData.files;
                result.totalSize = shareData.totalSize;
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Failed to get shared content:', error.message);
            throw error;
        }
    }
    
    async downloadSharedContent(shareId, userId, downloadPath) {
        try {
            const shareData = this.activeShares.get(shareId);
            if (!shareData) {
                throw new Error(`Share not found: ${shareId}`);
            }
            
            // ตรวจสอบสิทธิ์
            if (!this.checkPermission(shareData, userId, 'download')) {
                throw new Error(`Download not allowed for user: ${userId}`);
            }
            
            // ตรวจสอบการหมดอายุ
            if (new Date() > new Date(shareData.metadata.expiresAt)) {
                throw new Error(`Share expired: ${shareId}`);
            }
            
            // สร้างโฟลเดอร์ downloads หากไม่มี
            await fs.mkdir(downloadPath, { recursive: true });
            
            let downloadedPath;
            
            if (shareData.type === 'file') {
                // ดาวน์โหลดไฟล์
                downloadedPath = path.join(downloadPath, shareData.fileName);
                await fs.writeFile(downloadedPath, shareData.content, 'utf8');
                
            } else if (shareData.type === 'directory') {
                // ดาวน์โหลดโฟลเดอร์
                const dirPath = path.join(downloadPath, shareData.directoryName);
                await fs.mkdir(dirPath, { recursive: true });
                
                for (const file of shareData.files) {
                    const filePath = path.join(dirPath, file.relativePath);
                    const fileDir = path.dirname(filePath);
                    await fs.mkdir(fileDir, { recursive: true });
                    await fs.writeFile(filePath, file.content, 'utf8');
                }
                
                downloadedPath = dirPath;
            }
            
            // อัปเดตสถิติ
            shareData.stats.downloads++;
            shareData.stats.lastAccessed = new Date().toISOString();
            await this.updateShare(shareData);
            
            // ส่งการแจ้งเตือน
            this.emit('shareDownloaded', {
                shareId,
                userId,
                downloadPath: downloadedPath,
                type: shareData.type
            });
            
            console.log(`📥 Downloaded: ${shareId} to ${downloadedPath}`);
            return downloadedPath;
            
        } catch (error) {
            console.error('❌ Failed to download shared content:', error.message);
            throw error;
        }
    }
    
    // === การจัดการสิทธิ์ ===
    
    checkPermission(shareData, userId, action) {
        // ตรวจสอบว่าเป็น recipient
        if ((!Array.isArray(shareData.recipients) || !shareData.recipients.includes(userId)) && (!Array.isArray(shareData.recipients) || !shareData.recipients.includes('*'))) {
            return false;
        }
        
        // ตรวจสอบสิทธิ์เฉพาะ
        return shareData.permissions[action] === true;
    }
    
    async updateSharePermissions(shareId, userId, newPermissions) {
        try {
            const shareData = this.activeShares.get(shareId);
            if (!shareData) {
                throw new Error(`Share not found: ${shareId}`);
            }
            
            // ตรวจสอบสิทธิ์ในการแก้ไข (เฉพาะผู้สร้าง)
            if (shareData.metadata.createdBy !== userId) {
                throw new Error(`Permission denied: Only creator can modify permissions`);
            }
            
            // อัปเดตสิทธิ์
            shareData.permissions = { ...shareData.permissions, ...newPermissions };
            await this.updateShare(shareData);
            
            console.log(`🔐 Updated permissions for share: ${shareId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update share permissions:', error.message);
            throw error;
        }
    }
    
    // === ระบบ Subscription ===
    
    subscribeToShare(shareId, userId, callback) {
        const key = `${shareId}:${userId}`;
        
        if (!this.shareSubscribers.has(shareId)) {
            this.shareSubscribers.set(shareId, new Map());
        }
        
        this.shareSubscribers.get(shareId).set(userId, callback);
        
        console.log(`🔔 User ${userId} subscribed to share: ${shareId}`);
        
        // ส่งคืน unsubscribe function
        return () => {
            const subscribers = this.shareSubscribers.get(shareId);
            if (subscribers) {
                subscribers.delete(userId);
                if (subscribers.size === 0) {
                    this.shareSubscribers.delete(shareId);
                }
            }
            console.log(`🔕 User ${userId} unsubscribed from share: ${shareId}`);
        };
    }
    
    notifySubscribers(shareId, event, data) {
        const subscribers = this.shareSubscribers.get(shareId);
        if (subscribers) {
            subscribers.forEach((callback, userId) => {
                try {
                    callback(event, data);
                } catch (error) {
                    console.error(`❌ Failed to notify subscriber ${userId}:`, error.message);
                }
            });
        }
    }
    
    // === Helper Methods ===
    
    generateShareId() {
        return crypto.randomBytes(16).toString('hex');
    }
    
    async readDirectoryRecursive(dirPath) {
        const files = [];
        
        async function readDir(currentPath, relativePath = '') {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relPath = path.join(relativePath, entry.name);
                
                if (entry.isDirectory()) {
                    await readDir(fullPath, relPath);
                } else if (entry.isFile()) {
                    const stats = await fs.stat(fullPath);
                    const content = await fs.readFile(fullPath, 'utf8');
                    
                    files.push({
                        name: entry.name,
                        relativePath: relPath,
                        size: stats.size,
                        content: content,
                        lastModified: stats.mtime.toISOString()
                    });
                }
            }
        }
        
        await readDir(dirPath);
        return files;
    }
    
    async saveShare(shareData) {
        const filePath = path.join(this.sharesPath, `${shareData.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(shareData, null, 2), 'utf8');
    }
    
    async updateShare(shareData) {
        await this.saveShare(shareData);
        this.activeShares.set(shareData.id, shareData);
    }
    
    async loadExistingShares() {
        try {
            const files = await fs.readdir(this.sharesPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.sharesPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const shareData = JSON.parse(content);
                    
                    // ตรวจสอบการหมดอายุ
                    if (new Date() > new Date(shareData.metadata.expiresAt)) {
                        await fs.unlink(filePath);
                        console.log(`🗑️ Removed expired share: ${shareData.id}`);
                        continue;
                    }
                    
                    this.activeShares.set(shareData.id, shareData);
                }
            }
            
            console.log(`📚 Loaded ${this.activeShares.size} existing shares`);
            
        } catch (error) {
            console.error('❌ Failed to load existing shares:', error.message);
        }
    }
    
    startMonitoring() {
        // ทำความสะอาดการแชร์ที่หมดอายุทุก 1 ชั่วโมง
        setInterval(async () => {
            await this.cleanupExpiredShares();
        }, 60 * 60 * 1000);
        
        console.log('🔄 Share monitoring started');
    }
    
    async cleanupExpiredShares() {
        const now = new Date();
        const expiredShares = [];
        
        for (const [shareId, shareData] of this.activeShares) {
            if (now > new Date(shareData.metadata.expiresAt)) {
                expiredShares.push(shareId);
            }
        }
        
        for (const shareId of expiredShares) {
            await this.removeShare(shareId);
        }
        
        if (expiredShares.length > 0) {
            console.log(`🗑️ Cleaned up ${expiredShares.length} expired shares`);
        }
    }
    
    async removeShare(shareId) {
        try {
            // ลบจาก active shares
            this.activeShares.delete(shareId);
            
            // ลบไฟล์
            const filePath = path.join(this.sharesPath, `${shareId}.json`);
            await fs.unlink(filePath);
            
            // แจ้งเตือน subscribers
            this.notifySubscribers(shareId, 'shareRemoved', { shareId });
            
            // ลบ subscribers
            this.shareSubscribers.delete(shareId);
            
            console.log(`🗑️ Removed share: ${shareId}`);
            
        } catch (error) {
            console.error(`❌ Failed to remove share ${shareId}:`, error.message);
        }
    }
    
    // === API Methods ===
    
    async getSharesList(userId) {
        const shares = [];
        
        for (const [shareId, shareData] of this.activeShares) {
            if ((Array.isArray(shareData.recipients) && shareData.recipients.includes(userId)) || (Array.isArray(shareData.recipients) && shareData.recipients.includes('*')) || shareData.metadata.createdBy === userId) {
                shares.push({
                    id: shareData.id,
                    type: shareData.type,
                    name: shareData.fileName || shareData.directoryName,
                    size: shareData.fileSize || shareData.totalSize,
                    createdAt: shareData.metadata.createdAt,
                    createdBy: shareData.metadata.createdBy,
                    expiresAt: shareData.metadata.expiresAt,
                    stats: shareData.stats,
                    permissions: shareData.permissions
                });
            }
        }
        
        return shares.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    async getStats() {
        return {
            totalShares: this.activeShares.size,
            totalSubscribers: Array.from(this.shareSubscribers.values()).reduce((sum, subs) => sum + subs.size, 0),
            sharesByType: {
                file: Array.from(this.activeShares.values()).filter(s => s.type === 'file').length,
                directory: Array.from(this.activeShares.values()).filter(s => s.type === 'directory').length
            },
            totalViews: Array.from(this.activeShares.values()).reduce((sum, s) => sum + s.stats.views, 0),
            totalDownloads: Array.from(this.activeShares.values()).reduce((sum, s) => sum + s.stats.downloads, 0),
            timestamp: new Date().toISOString()
        };
    }
}

// === Demo Usage ===

async function demo() {
    try {
        console.log('🚀 Starting Git Memory Sharing Demo...');
        
        const sharing = new GitMemorySharing();
        
        // รอให้ระบบเริ่มต้น
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // ทดสอบการแชร์ไฟล์
        console.log('\n📤 Testing file sharing...');
        const shareId1 = await sharing.shareFile('package.json', ['user123', 'admin'], {
            description: 'Project package.json',
            tags: ['config', 'npm'],
            createdBy: 'system'
        });
        
        // ทดสอบการเข้าถึงไฟล์ที่แชร์
        console.log('\n📥 Testing shared file access...');
        const sharedFile = await sharing.getSharedContent(shareId1, 'user123');
        console.log(`📄 Accessed shared file: ${sharedFile.fileName} (${sharedFile.fileSize} bytes)`);
        
        // ทดสอบการแชร์โฟลเดอร์
        console.log('\n📁 Testing directory sharing...');
        const shareId2 = await sharing.shareDirectory('src/ai', ['team'], {
            description: 'AI modules directory',
            tags: ['ai', 'modules'],
            createdBy: 'system'
        });
        
        // ทดสอบ subscription
        console.log('\n🔔 Testing subscription...');
        const unsubscribe = sharing.subscribeToShare(shareId1, 'user123', (event, data) => {
            console.log(`📢 Notification: ${event}`, data);
        });
        
        // ทดสอบการดาวน์โหลด
        console.log('\n📥 Testing download...');
        const downloadPath = await sharing.downloadSharedContent(shareId1, 'user123', './downloads');
        console.log(`📥 Downloaded to: ${downloadPath}`);
        
        // แสดงรายการการแชร์
        console.log('\n📋 Getting shares list...');
        const sharesList = await sharing.getSharesList('user123');
        console.log(`📋 Found ${sharesList.length} shares for user123`);
        
        // แสดงสถิติ
        console.log('\n📊 Git Memory Sharing Stats:');
        const stats = await sharing.getStats();
        console.log(JSON.stringify(stats, null, 2));
        
        // ทำความสะอาด
        unsubscribe();
        
        console.log('\n✅ Git Memory Sharing demo completed successfully!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    }
}

// เริ่มต้น demo ถ้าไฟล์นี้ถูกเรียกใช้โดยตรง
if (require.main === module) {
    demo();
}

module.exports = { GitMemorySharing };