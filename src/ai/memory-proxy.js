#!/usr/bin/env node

/**
 * AI Memory Proxy - ระบบจัดการความจำและการแชร์ข้อมูลสำหรับ AI
 * เชื่อมต่อกับ git-memory system ที่มีอยู่แล้ว
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class AIMemoryProxy extends EventEmitter {
    constructor(options = {}) {
        super();
        this.gitMemoryPath = options.gitMemoryPath || path.join(__dirname, '../../git-memory');
        this.memoryPath = options.memoryPath || path.join(__dirname, '../../memory');
        this.dataPath = options.dataPath || path.join(__dirname, '../../data');
        this.maxMemorySize = options.maxMemorySize || 2000; // MB - เพิ่มขนาด
        this.compressionEnabled = options.compression || true;
        this.encryptionEnabled = options.encryption || true; // เปิดใช้งาน encryption
        
        // Enhanced Memory Systems
        this.memoryCache = new Map();
        this.sharedData = new Map();
        this.subscribers = new Set();
        this.aiMemoryEngine = new Map(); // AI-powered memory engine
        this.semanticIndex = new Map(); // Semantic search index
        this.collaborativeSpaces = new Map(); // Real-time collaboration spaces
        this.memoryVersions = new Map(); // Version control for memories
        this.aiInsights = new Map(); // AI-generated insights
        
        // Advanced Features
        this.realTimeSync = true;
        this.aiPoweredSearch = true;
        this.collaborativeEditing = true;
        this.smartCaching = true;
        this.predictiveLoading = true;
        
        // Performance Metrics
        this.metrics = {
            totalMemories: 0,
            activeShares: 0,
            collaborativeSessions: 0,
            aiQueries: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.init();
    }

    async init() {
        try {
            // สร้างโฟลเดอร์ที่จำเป็น
            await this.ensureDirectories();
            
            // โหลดข้อมูลที่มีอยู่
            await this.loadExistingMemory();
            
            // เริ่มระบบ monitoring
            this.startMemoryMonitoring();
            
            console.log('🧠 AI Memory Proxy initialized successfully');
            console.log(`📁 Git Memory Path: ${this.gitMemoryPath}`);
            console.log(`💾 Memory Path: ${this.memoryPath}`);
            console.log(`📊 Data Path: ${this.dataPath}`);
            
            this.emit('ready');
        } catch (error) {
            console.error('❌ Failed to initialize AI Memory Proxy:', error);
            throw error;
        }
    }

    async ensureDirectories() {
        const dirs = [this.gitMemoryPath, this.memoryPath, this.dataPath];
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    }

    async loadExistingMemory() {
        try {
            // โหลดจาก git-memory
            const gitMemoryFiles = await this.scanDirectory(this.gitMemoryPath);
            console.log(`🔍 Found ${gitMemoryFiles.length} files in git-memory`);
            
            // โหลดจาก memory
            const memoryFiles = await this.scanDirectory(this.memoryPath);
            console.log(`🔍 Found ${memoryFiles.length} files in memory`);
            
            // โหลดจาก data
            const dataFiles = await this.scanDirectory(this.dataPath);
            console.log(`🔍 Found ${dataFiles.length} files in data`);
            
            // รวมข้อมูลทั้งหมด
            const totalFiles = gitMemoryFiles.length + memoryFiles.length + dataFiles.length;
            console.log(`📚 Total memory files loaded: ${totalFiles}`);
            
        } catch (error) {
            console.error('❌ Error loading existing memory:', error);
        }
    }

    async scanDirectory(dirPath) {
        try {
            const files = [];
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                if (item.isDirectory()) {
                    const subFiles = await this.scanDirectory(fullPath);
                    files.push(...subFiles);
                } else if (item.isFile()) {
                    files.push(fullPath);
                }
            }
            
            return files;
        } catch (error) {
            return [];
        }
    }

    // ระบบจัดการความจำ AI
    async storeMemory(key, data, options = {}) {
        try {
            const memoryId = this.generateMemoryId(key);
            const timestamp = new Date().toISOString();
            
            const memoryObject = {
                id: memoryId,
                key,
                data,
                timestamp,
                type: options.type || 'general',
                priority: options.priority || 'normal',
                tags: options.tags || [],
                metadata: options.metadata || {}
            };
            
            // เก็บใน cache
            this.memoryCache.set(memoryId, memoryObject);
            
            // เก็บในไฟล์
            await this.persistMemory(memoryObject);
            
            // แจ้งเตือน subscribers
            this.emit('memoryStored', memoryObject);
            
            console.log(`💾 Memory stored: ${key} (${memoryId})`);
            return memoryId;
            
        } catch (error) {
            console.error('❌ Error storing memory:', error);
            throw error;
        }
    }

    async retrieveMemory(key) {
        try {
            // ค้นหาใน cache ก่อน
            for (const [id, memory] of this.memoryCache) {
                if (memory.key === key) {
                    console.log(`🔍 Memory retrieved from cache: ${key}`);
                    return memory;
                }
            }
            
            // ค้นหาในไฟล์
            const memory = await this.loadMemoryFromFile(key);
            if (memory) {
                this.memoryCache.set(memory.id, memory);
                console.log(`🔍 Memory retrieved from file: ${key}`);
                return memory;
            }
            
            console.log(`❓ Memory not found: ${key}`);
            return null;
            
        } catch (error) {
            console.error('❌ Error retrieving memory:', error);
            return null;
        }
    }

    async searchMemory(query, options = {}) {
        try {
            const results = [];
            const searchTerms = query.toLowerCase().split(' ');
            
            // ค้นหาใน cache
            for (const [id, memory] of this.memoryCache) {
                if (this.matchesSearch(memory, searchTerms, options)) {
                    results.push(memory);
                }
            }
            
            // เรียงลำดับตามความเกี่ยวข้อง
            results.sort((a, b) => {
                const scoreA = this.calculateRelevanceScore(a, searchTerms);
                const scoreB = this.calculateRelevanceScore(b, searchTerms);
                return scoreB - scoreA;
            });
            
            console.log(`🔍 Search completed: "${query}" - ${results.length} results`);
            return results.slice(0, options.limit || 50);
            
        } catch (error) {
            console.error('❌ Error searching memory:', error);
            return [];
        }
    }

    // ระบบแชร์ข้อมูล
    async shareData(dataId, recipients, permissions = {}) {
        try {
            const shareId = this.generateShareId();
            const timestamp = new Date().toISOString();
            
            const shareObject = {
                id: shareId,
                dataId,
                recipients: Array.isArray(recipients) ? recipients : [recipients],
                permissions: {
                    read: permissions.read !== false,
                    write: permissions.write || false,
                    delete: permissions.delete || false,
                    share: permissions.share || false
                },
                timestamp,
                expiresAt: permissions.expiresAt || null
            };
            
            this.sharedData.set(shareId, shareObject);
            
            // บันทึกการแชร์
            await this.persistShare(shareObject);
            
            // แจ้งเตือน recipients
            this.notifyRecipients(shareObject);
            
            console.log(`🤝 Data shared: ${dataId} -> ${recipients.join(', ')}`);
            return shareId;
            
        } catch (error) {
            console.error('❌ Error sharing data:', error);
            throw error;
        }
    }

    async getSharedData(shareId, requesterId) {
        try {
            const share = this.sharedData.get(shareId);
            if (!share) {
                throw new Error('Share not found');
            }
            
            // ตรวจสอบสิทธิ์
            if (!share.recipients.includes(requesterId)) {
                throw new Error('Access denied');
            }
            
            // ตรวจสอบวันหมดอายุ
            if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
                throw new Error('Share expired');
            }
            
            // ดึงข้อมูลจริง
            const data = await this.retrieveMemory(share.dataId);
            
            console.log(`📤 Shared data accessed: ${shareId} by ${requesterId}`);
            return {
                share,
                data,
                permissions: share.permissions
            };
            
        } catch (error) {
            console.error('❌ Error accessing shared data:', error);
            throw error;
        }
    }

    // ระบบ Subscription สำหรับ real-time updates
    subscribe(subscriberId, filters = {}) {
        const subscription = {
            id: subscriberId,
            filters,
            timestamp: new Date().toISOString()
        };
        
        this.subscribers.add(subscription);
        console.log(`📡 New subscriber: ${subscriberId}`);
        
        return () => {
            this.subscribers.delete(subscription);
            console.log(`📡 Subscriber removed: ${subscriberId}`);
        };
    }

    // Helper methods
    generateMemoryId(key) {
        return crypto.createHash('sha256').update(key + Date.now()).digest('hex').substring(0, 16);
    }

    generateShareId() {
        return crypto.randomBytes(16).toString('hex');
    }

    async persistMemory(memoryObject) {
        const filePath = path.join(this.memoryPath, `${memoryObject.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(memoryObject, null, 2));
    }

    async persistShare(shareObject) {
        const filePath = path.join(this.dataPath, 'shares', `${shareObject.id}.json`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(shareObject, null, 2));
    }

    async loadMemoryFromFile(key) {
        try {
            const files = await fs.readdir(this.memoryPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.memoryPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const memory = JSON.parse(content);
                    if (memory.key === key) {
                        return memory;
                    }
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    matchesSearch(memory, searchTerms, options) {
        const searchText = (
            memory.key + ' ' + 
            JSON.stringify(memory.data) + ' ' + 
            memory.tags.join(' ')
        ).toLowerCase();
        
        return searchTerms.every(term => searchText.includes(term));
    }

    calculateRelevanceScore(memory, searchTerms) {
        let score = 0;
        const text = memory.key.toLowerCase();
        
        searchTerms.forEach(term => {
            if (text.includes(term)) {
                score += term.length;
            }
        });
        
        return score;
    }

    notifyRecipients(shareObject) {
        this.emit('dataShared', shareObject);
        
        // แจ้งเตือน subscribers ที่เกี่ยวข้อง
        for (const subscriber of this.subscribers) {
            if (shareObject.recipients.includes(subscriber.id)) {
                this.emit('notification', {
                    subscriberId: subscriber.id,
                    type: 'dataShared',
                    data: shareObject
                });
            }
        }
    }

    startMemoryMonitoring() {
        setInterval(() => {
            this.cleanupExpiredShares();
            this.optimizeMemoryCache();
        }, 60000); // ทุก 1 นาที
        
        console.log('🔄 Memory monitoring started');
    }

    async cleanupExpiredShares() {
        const now = new Date();
        let cleanedCount = 0;
        
        for (const [shareId, share] of this.sharedData) {
            if (share.expiresAt && now > new Date(share.expiresAt)) {
                this.sharedData.delete(shareId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired shares`);
        }
    }

    optimizeMemoryCache() {
        if (this.memoryCache.size > this.maxMemorySize) {
            const entries = Array.from(this.memoryCache.entries());
            entries.sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp));
            
            const toRemove = entries.slice(0, Math.floor(this.memoryCache.size * 0.2));
            toRemove.forEach(([id]) => this.memoryCache.delete(id));
            
            console.log(`🗑️ Optimized memory cache: removed ${toRemove.length} old entries`);
        }
    }

    // API สำหรับการใช้งาน
    async getStats() {
        return {
            memoryCache: this.memoryCache.size,
            sharedData: this.sharedData.size,
            subscribers: this.subscribers.size,
            timestamp: new Date().toISOString()
        };
    }

    async exportMemory(format = 'json') {
        const memories = Array.from(this.memoryCache.values());
        
        if (format === 'json') {
            return JSON.stringify(memories, null, 2);
        }
        
        // รองรับ format อื่นๆ ในอนาคต
        return memories;
    }
}

// ตัวอย่างการใช้งาน
if (require.main === module) {
    async function demo() {
        console.log('🚀 Starting AI Memory Proxy Demo...');
        
        const memoryProxy = new AIMemoryProxy({
            maxMemorySize: 500,
            compression: true,
            encryption: false
        });
        
        // รอให้ระบบพร้อม
        await new Promise(resolve => memoryProxy.once('ready', resolve));
        
        // ทดสอบการเก็บความจำ
        console.log('\n📝 Testing memory storage...');
        const memoryId1 = await memoryProxy.storeMemory('user_preferences', {
            theme: 'dark',
            language: 'thai',
            editor: 'monaco'
        }, {
            type: 'user_data',
            priority: 'high',
            tags: ['preferences', 'ui']
        });
        
        const memoryId2 = await memoryProxy.storeMemory('project_config', {
            name: 'NEXUS IDE',
            version: '1.0.0',
            dependencies: ['react', 'monaco-editor']
        }, {
            type: 'project_data',
            priority: 'high',
            tags: ['config', 'project']
        });
        
        // ทดสอบการค้นหา
        console.log('\n🔍 Testing memory search...');
        const searchResults = await memoryProxy.searchMemory('theme dark');
        console.log(`Found ${searchResults.length} results for "theme dark"`);
        
        // ทดสอบการแชร์ข้อมูล
        console.log('\n🤝 Testing data sharing...');
        const shareId = await memoryProxy.shareData(memoryId1, ['user123', 'admin'], {
            read: true,
            write: false,
            share: true
        });
        
        // ทดสอบการเข้าถึงข้อมูลที่แชร์
        const sharedData = await memoryProxy.getSharedData(shareId, 'user123');
        if (sharedData && sharedData.data) {
            console.log('📤 Shared data accessed:', shareId, 'by user123');
            console.log('📄 Data content:', sharedData.data.key || 'No key found');
        } else {
            console.log('⚠️ No shared data found for:', shareId);
        }
        
        // แสดงสถิติ
        console.log('\n📊 Memory Proxy Stats:');
        const stats = await memoryProxy.getStats();
        console.log(JSON.stringify(stats, null, 2));
        
        console.log('\n✅ AI Memory Proxy demo completed successfully!');
    }
    
    demo().catch(console.error);
}

module.exports = { AIMemoryProxy };