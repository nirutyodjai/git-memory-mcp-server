const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const os = require('os');

class MemoryManager1000 extends EventEmitter {
  constructor() {
    super();
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.memoryPath = path.join(process.cwd(), '.git-memory');
    this.servers = new Map(); // serverId -> memory info
    this.memoryPools = new Map(); // category -> memory pool
    this.memoryStats = new Map(); // serverId -> usage stats
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    this.maxMemoryPerServer = 100 * 1024 * 1024; // 100MB per server
    this.maxTotalMemory = 10 * 1024 * 1024 * 1024; // 10GB total
    this.compressionEnabled = true;
    this.archiveOldMemories = true;
    this.memoryRetentionDays = 30;
    
    this.startMemoryMonitoring();
    this.startCleanupProcess();
  }

  async initialize() {
    try {
      // Ensure memory directory exists
      await fs.mkdir(this.memoryPath, { recursive: true });
      
      // Load server configuration
      await this.loadServerConfiguration();
      
      // Initialize memory pools for each category
      await this.initializeMemoryPools();
      
      // Perform initial memory analysis
      await this.analyzeMemoryUsage();
      
      console.log(`🧠 Memory Manager initialized for ${this.servers.size} servers`);
      console.log(`💾 Max memory per server: ${this.formatBytes(this.maxMemoryPerServer)}`);
      console.log(`🗄️  Max total memory: ${this.formatBytes(this.maxTotalMemory)}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Memory Manager:', error.message);
      throw error;
    }
  }

  async loadServerConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      this.servers.clear();
      this.memoryPools.clear();
      
      if (config.mcpServers) {
        for (const server of config.mcpServers) {
          if (server.status === 'deployed') {
            await this.registerServer(server);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load server configuration:', error.message);
      throw error;
    }
  }

  async registerServer(server) {
    const serverId = server.id;
    const category = server.category;
    const memoryDir = path.join(this.memoryPath, category, serverId);
    
    // Create server memory directory
    await fs.mkdir(memoryDir, { recursive: true });
    
    // Register server
    this.servers.set(serverId, {
      id: serverId,
      category: category,
      memoryDir: memoryDir,
      port: server.port,
      createdAt: server.createdAt || new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      memorySize: 0,
      fileCount: 0,
      compressionRatio: 1.0
    });
    
    // Initialize memory stats
    this.memoryStats.set(serverId, {
      reads: 0,
      writes: 0,
      deletes: 0,
      compressions: 0,
      lastActivity: Date.now(),
      averageResponseTime: 0,
      errorCount: 0
    });
    
    // Add to memory pool
    if (!this.memoryPools.has(category)) {
      this.memoryPools.set(category, {
        servers: [],
        totalMemory: 0,
        maxMemory: this.maxMemoryPerServer * 100, // 100 servers per category
        compressionEnabled: this.compressionEnabled
      });
    }
    
    const pool = this.memoryPools.get(category);
    pool.servers.push(serverId);
    
    // Calculate initial memory usage
    await this.calculateServerMemoryUsage(serverId);
  }

  async initializeMemoryPools() {
    for (const [category, pool] of this.memoryPools) {
      console.log(`🗂️  Initializing memory pool for ${category}: ${pool.servers.length} servers`);
      
      // Create category-specific memory management policies
      pool.policy = this.createMemoryPolicy(category);
      
      // Initialize shared memory structures for the category
      const sharedMemoryDir = path.join(this.memoryPath, category, '_shared');
      await fs.mkdir(sharedMemoryDir, { recursive: true });
      
      pool.sharedMemoryDir = sharedMemoryDir;
    }
  }

  createMemoryPolicy(category) {
    const policies = {
      'database': {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        compressionThreshold: 10 * 1024 * 1024, // 10MB
        retentionDays: 60,
        autoArchive: true
      },
      'filesystem': {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        compressionThreshold: 5 * 1024 * 1024, // 5MB
        retentionDays: 30,
        autoArchive: true
      },
      'api': {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        compressionThreshold: 2 * 1024 * 1024, // 2MB
        retentionDays: 14,
        autoArchive: false
      },
      'ai-ml': {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        compressionThreshold: 20 * 1024 * 1024, // 20MB
        retentionDays: 90,
        autoArchive: true
      }
    };
    
    return policies[category] || {
      maxFileSize: 25 * 1024 * 1024, // 25MB default
      compressionThreshold: 5 * 1024 * 1024, // 5MB default
      retentionDays: 30,
      autoArchive: true
    };
  }

  async calculateServerMemoryUsage(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return;

    try {
      const files = await this.getDirectoryFiles(server.memoryDir);
      let totalSize = 0;
      let fileCount = 0;
      
      for (const file of files) {
        const filePath = path.join(server.memoryDir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        }
      }
      
      server.memorySize = totalSize;
      server.fileCount = fileCount;
      server.lastAccessed = new Date().toISOString();
      
      // Update pool total
      const pool = this.memoryPools.get(server.category);
      if (pool) {
        pool.totalMemory = pool.servers.reduce((total, sId) => {
          const s = this.servers.get(sId);
          return total + (s ? s.memorySize : 0);
        }, 0);
      }
      
    } catch (error) {
      console.error(`❌ Failed to calculate memory usage for ${serverId}:`, error.message);
    }
  }

  async getDirectoryFiles(dirPath) {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async analyzeMemoryUsage() {
    console.log('\n📊 Memory Usage Analysis:');
    
    let totalMemory = 0;
    let totalFiles = 0;
    
    for (const [category, pool] of this.memoryPools) {
      let categoryMemory = 0;
      let categoryFiles = 0;
      
      for (const serverId of pool.servers) {
        const server = this.servers.get(serverId);
        if (server) {
          categoryMemory += server.memorySize;
          categoryFiles += server.fileCount;
        }
      }
      
      totalMemory += categoryMemory;
      totalFiles += categoryFiles;
      
      console.log(`  ${category}: ${this.formatBytes(categoryMemory)} (${categoryFiles} files, ${pool.servers.length} servers)`);
    }
    
    console.log(`\n💾 Total Memory Usage: ${this.formatBytes(totalMemory)}`);
    console.log(`📁 Total Files: ${totalFiles}`);
    console.log(`🎯 Memory Utilization: ${((totalMemory / this.maxTotalMemory) * 100).toFixed(2)}%`);
    
    // Check for memory pressure
    if (totalMemory > this.maxTotalMemory * 0.8) {
      console.warn('⚠️  High memory usage detected! Consider cleanup or compression.');
      await this.performEmergencyCleanup();
    }
  }

  async performEmergencyCleanup() {
    console.log('🧹 Performing emergency memory cleanup...');
    
    const cleanupTasks = [];
    
    for (const [serverId, server] of this.servers) {
      if (server.memorySize > this.maxMemoryPerServer * 0.8) {
        cleanupTasks.push(this.compressServerMemory(serverId));
      }
    }
    
    await Promise.allSettled(cleanupTasks);
    
    // Re-analyze after cleanup
    await this.analyzeMemoryUsage();
  }

  async compressServerMemory(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return;

    try {
      const files = await this.getDirectoryFiles(server.memoryDir);
      const compressionTasks = [];
      
      for (const file of files) {
        const filePath = path.join(server.memoryDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.size > 1024 * 1024) { // Files > 1MB
          compressionTasks.push(this.compressFile(filePath));
        }
      }
      
      const results = await Promise.allSettled(compressionTasks);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      if (successful > 0) {
        await this.calculateServerMemoryUsage(serverId);
        const stats = this.memoryStats.get(serverId);
        if (stats) {
          stats.compressions += successful;
        }
        
        console.log(`🗜️  Compressed ${successful} files for server ${serverId}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to compress memory for ${serverId}:`, error.message);
    }
  }

  async compressFile(filePath) {
    const zlib = require('zlib');
    const originalData = await fs.readFile(filePath);
    const compressedData = zlib.gzipSync(originalData);
    
    if (compressedData.length < originalData.length * 0.8) { // Only if 20%+ reduction
      await fs.writeFile(filePath + '.gz', compressedData);
      await fs.unlink(filePath);
      return { originalSize: originalData.length, compressedSize: compressedData.length };
    }
    
    throw new Error('Compression not beneficial');
  }

  async archiveOldMemories() {
    if (!this.archiveOldMemories) return;
    
    console.log('📦 Archiving old memories...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.memoryRetentionDays);
    
    const archiveTasks = [];
    
    for (const [serverId, server] of this.servers) {
      const serverDate = new Date(server.createdAt);
      if (serverDate < cutoffDate) {
        archiveTasks.push(this.archiveServerMemory(serverId));
      }
    }
    
    if (archiveTasks.length > 0) {
      await Promise.allSettled(archiveTasks);
      console.log(`📦 Archived memories for ${archiveTasks.length} servers`);
    }
  }

  async archiveServerMemory(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return;

    try {
      const archiveDir = path.join(this.memoryPath, '_archive', server.category);
      await fs.mkdir(archiveDir, { recursive: true });
      
      const archivePath = path.join(archiveDir, `${serverId}-${Date.now()}.tar.gz`);
      
      // Create archive (simplified - in production use proper tar library)
      const files = await this.getDirectoryFiles(server.memoryDir);
      const archiveData = { serverId, files: {} };
      
      for (const file of files) {
        const filePath = path.join(server.memoryDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        archiveData.files[file] = content;
      }
      
      await fs.writeFile(archivePath, JSON.stringify(archiveData));
      
      // Remove original directory
      await fs.rmdir(server.memoryDir, { recursive: true });
      
      console.log(`📦 Archived server ${serverId} to ${archivePath}`);
      
    } catch (error) {
      console.error(`❌ Failed to archive server ${serverId}:`, error.message);
    }
  }

  startMemoryMonitoring() {
    setInterval(async () => {
      try {
        // Update memory usage for all servers
        const updateTasks = Array.from(this.servers.keys()).map(serverId => 
          this.calculateServerMemoryUsage(serverId)
        );
        
        await Promise.allSettled(updateTasks);
        
        // Log memory status every 10 minutes
        if (Date.now() % (10 * 60 * 1000) < 60000) {
          await this.logMemoryStatus();
        }
        
      } catch (error) {
        console.error('❌ Memory monitoring error:', error.message);
      }
    }, 60000); // Every minute
  }

  startCleanupProcess() {
    setInterval(async () => {
      try {
        await this.performRoutineCleanup();
      } catch (error) {
        console.error('❌ Cleanup process error:', error.message);
      }
    }, this.cleanupInterval);
  }

  async performRoutineCleanup() {
    console.log('🧹 Performing routine memory cleanup...');
    
    // Compress large files
    const compressionTasks = [];
    for (const [serverId, server] of this.servers) {
      if (server.memorySize > this.maxMemoryPerServer * 0.5) {
        compressionTasks.push(this.compressServerMemory(serverId));
      }
    }
    
    if (compressionTasks.length > 0) {
      await Promise.allSettled(compressionTasks);
    }
    
    // Archive old memories
    await this.archiveOldMemories();
    
    // Update memory analysis
    await this.analyzeMemoryUsage();
  }

  async logMemoryStatus() {
    const systemMemory = this.getSystemMemoryInfo();
    const totalManagedMemory = Array.from(this.servers.values())
      .reduce((total, server) => total + server.memorySize, 0);
    
    console.log('\n🧠 Memory Manager Status:');
    console.log(`  📊 Managed Memory: ${this.formatBytes(totalManagedMemory)}`);
    console.log(`  🖥️  System Memory: ${this.formatBytes(systemMemory.used)}/${this.formatBytes(systemMemory.total)}`);
    console.log(`  📈 Memory Efficiency: ${((totalManagedMemory / this.maxTotalMemory) * 100).toFixed(2)}%`);
    
    // Log top memory consumers
    const topConsumers = Array.from(this.servers.entries())
      .sort(([,a], [,b]) => b.memorySize - a.memorySize)
      .slice(0, 5);
    
    if (topConsumers.length > 0) {
      console.log('  🔝 Top Memory Consumers:');
      topConsumers.forEach(([serverId, server]) => {
        console.log(`    ${serverId}: ${this.formatBytes(server.memorySize)} (${server.fileCount} files)`);
      });
    }
  }

  getSystemMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    return {
      total: totalMemory,
      free: freeMemory,
      used: totalMemory - freeMemory,
      percentage: ((totalMemory - freeMemory) / totalMemory) * 100
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // API methods for external access
  getMemoryStats() {
    return {
      totalServers: this.servers.size,
      totalMemory: Array.from(this.servers.values())
        .reduce((total, server) => total + server.memorySize, 0),
      categories: Object.fromEntries(
        Array.from(this.memoryPools.entries()).map(([category, pool]) => [
          category,
          {
            servers: pool.servers.length,
            totalMemory: pool.totalMemory,
            maxMemory: pool.maxMemory
          }
        ])
      ),
      systemMemory: this.getSystemMemoryInfo()
    };
  }

  async optimizeMemory() {
    console.log('🚀 Starting memory optimization...');
    
    const optimizationTasks = [];
    
    for (const [serverId] of this.servers) {
      optimizationTasks.push(this.compressServerMemory(serverId));
    }
    
    await Promise.allSettled(optimizationTasks);
    await this.analyzeMemoryUsage();
    
    console.log('✅ Memory optimization completed');
  }
}

// Start the memory manager if this file is run directly
if (require.main === module) {
  const memoryManager = new MemoryManager1000();
  memoryManager.initialize().catch(error => {
    console.error('❌ Failed to start memory manager:', error);
    process.exit(1);
  });
}

module.exports = MemoryManager1000;