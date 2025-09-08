#!/usr/bin/env node
/**
 * PRD Change Watcher
 * ติดตามการเปลี่ยนแปลงใน PRD และซิงค์กับ NEXUS IDE แบบ real-time
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
const NexusSyncManager = require('./sync-with-nexus');

class PRDChangeWatcher {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.prdPath = path.join(this.projectRoot, 'NEXUS-IDE-PRD-Updated.md');
    this.packagePath = path.join(this.projectRoot, 'package.json');
    this.readmePath = path.join(this.projectRoot, 'README.md');
    this.configPath = path.join(this.projectRoot, 'nexus-sync.config.json');
    this.changeLogPath = path.join(this.projectRoot, '.prd-changes.json');
    
    this.syncManager = new NexusSyncManager();
    this.isWatching = false;
    this.changeQueue = [];
    this.processTimeout = null;
    
    this.initializeWatcher();
  }

  initializeWatcher() {
    console.log('🔍 Initializing PRD Change Watcher...');
    
    // สร้างไฟล์ config ถ้ายังไม่มี
    this.ensureConfigExists();
    
    // สร้าง change log ถ้ายังไม่มี
    this.ensureChangeLogExists();
    
    console.log('✅ PRD Change Watcher initialized');
  }

  ensureConfigExists() {
    if (!fs.existsSync(this.configPath)) {
      const defaultConfig = {
        watch: {
          enabled: true,
          debounceMs: 2000,
          autoSync: true,
          autoCommit: false,
          notifications: true
        },
        files: {
          prd: 'NEXUS-IDE-PRD-Updated.md',
          package: 'package.json',
          readme: 'README.md',
          source: ['src/**/*.js', 'dist/**/*.js', 'scripts/**/*.js']
        },
        sync: {
          immediate: true,
          batchChanges: true,
          conflictResolution: 'prompt'
        }
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    }
  }

  ensureChangeLogExists() {
    if (!fs.existsSync(this.changeLogPath)) {
      const initialLog = {
        version: '1.0.0',
        changes: [],
        lastUpdate: new Date().toISOString(),
        totalChanges: 0
      };
      
      fs.writeFileSync(this.changeLogPath, JSON.stringify(initialLog, null, 2));
    }
  }

  async startWatching() {
    if (this.isWatching) {
      console.log('⚠️  Watcher is already running');
      return;
    }

    console.log('👀 Starting PRD Change Watcher...');
    this.isWatching = true;

    const config = this.loadConfig();
    
    // ติดตามไฟล์สำคัญ
    const watchPaths = [
      this.prdPath,
      this.packagePath,
      this.readmePath,
      path.join(this.projectRoot, 'src/**/*.js'),
      path.join(this.projectRoot, 'dist/**/*.js'),
      path.join(this.projectRoot, 'scripts/**/*.js')
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    // Event handlers
    this.watcher
      .on('change', (filePath) => this.handleFileChange(filePath, 'modified'))
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'))
      .on('error', (error) => this.handleWatchError(error));

    console.log(`🎯 Watching ${watchPaths.length} paths for changes...`);
    console.log('📁 Watched files:');
    watchPaths.forEach(p => console.log(`   - ${path.relative(this.projectRoot, p)}`));
    
    // เริ่ม sync loop
    if (config.watch.autoSync) {
      this.startSyncLoop();
    }

    console.log('✅ PRD Change Watcher is now active!');
  }

  async stopWatching() {
    if (!this.isWatching) {
      console.log('⚠️  Watcher is not running');
      return;
    }

    console.log('🛑 Stopping PRD Change Watcher...');
    
    if (this.watcher) {
      await this.watcher.close();
    }
    
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
    }
    
    this.isWatching = false;
    console.log('✅ PRD Change Watcher stopped');
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading config:', error.message);
      return { watch: { enabled: true, debounceMs: 2000, autoSync: true } };
    }
  }

  async handleFileChange(filePath, changeType) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const timestamp = new Date().toISOString();
    
    console.log(`📝 File ${changeType}: ${relativePath}`);
    
    const change = {
      file: relativePath,
      fullPath: filePath,
      type: changeType,
      timestamp,
      size: this.getFileSize(filePath),
      hash: this.getFileHash(filePath)
    };

    // เพิ่มข้อมูลเพิ่มเติมตามประเภทไฟล์
    if (filePath === this.prdPath) {
      change.isPRD = true;
      change.sections = await this.analyzePRDChanges(filePath);
    } else if (filePath === this.packagePath) {
      change.isPackage = true;
      change.version = this.extractPackageVersion(filePath);
    } else if (filePath === this.readmePath) {
      change.isReadme = true;
    } else {
      change.isSource = true;
      change.language = this.detectLanguage(filePath);
    }

    // เพิ่มเข้า queue
    this.changeQueue.push(change);
    
    // บันทึก change log
    await this.logChange(change);
    
    // ประมวลผลการเปลี่ยนแปลง (debounced)
    this.scheduleProcessing();
  }

  getFileSize(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath).size;
      }
    } catch {
      // ignore
    }
    return 0;
  }

  getFileHash(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const crypto = require('crypto');
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
      }
    } catch {
      // ignore
    }
    return null;
  }

  async analyzePRDChanges(filePath) {
    try {
      if (!fs.existsSync(filePath)) return [];
      
      const content = fs.readFileSync(filePath, 'utf8');
      const sections = [];
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.startsWith('#')) {
          sections.push({
            title: line.replace(/^#+\s*/, ''),
            level: line.match(/^#+/)[0].length,
            lineNumber: index + 1
          });
        }
      });
      
      return sections;
    } catch {
      return [];
    }
  }

  extractPackageVersion(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      
      const packageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return packageData.version;
    } catch {
      return null;
    }
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
    
    return langMap[ext] || 'unknown';
  }

  scheduleProcessing() {
    const config = this.loadConfig();
    const debounceMs = config.watch.debounceMs || 2000;
    
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
    }
    
    this.processTimeout = setTimeout(() => {
      this.processChanges();
    }, debounceMs);
  }

  async processChanges() {
    if (this.changeQueue.length === 0) return;
    
    console.log(`🔄 Processing ${this.changeQueue.length} changes...`);
    
    const config = this.loadConfig();
    const changes = [...this.changeQueue];
    this.changeQueue = [];
    
    try {
      // วิเคราะห์การเปลี่ยนแปลง
      const analysis = this.analyzeChanges(changes);
      console.log('📊 Change Analysis:', analysis.summary);
      
      // อัปเดต PRD ถ้าจำเป็น
      if (analysis.requiresPRDUpdate) {
        await this.updatePRDFromChanges(changes, analysis);
      }
      
      // ซิงค์กับ NEXUS IDE
      if (config.watch.autoSync) {
        await this.syncChangesToNexus(changes, analysis);
      }
      
      // Auto-commit ถ้าเปิดใช้งาน
      if (config.watch.autoCommit && analysis.hasSignificantChanges) {
        await this.autoCommitChanges(changes, analysis);
      }
      
      // ส่งการแจ้งเตือน
      if (config.watch.notifications) {
        await this.sendChangeNotifications(changes, analysis);
      }
      
      console.log('✅ Changes processed successfully');
      
    } catch (error) {
      console.error('❌ Error processing changes:', error.message);
      await this.handleProcessingError(error, changes);
    }
  }

  analyzeChanges(changes) {
    const analysis = {
      totalChanges: changes.length,
      fileTypes: {},
      hasSignificantChanges: false,
      requiresPRDUpdate: false,
      summary: ''
    };
    
    changes.forEach(change => {
      const type = change.isPRD ? 'PRD' : 
                  change.isPackage ? 'Package' :
                  change.isReadme ? 'README' :
                  change.isSource ? 'Source' : 'Other';
      
      analysis.fileTypes[type] = (analysis.fileTypes[type] || 0) + 1;
      
      if (change.isPRD || change.isPackage) {
        analysis.hasSignificantChanges = true;
      }
      
      if (change.isSource || change.isPackage) {
        analysis.requiresPRDUpdate = true;
      }
    });
    
    // สร้าง summary
    const types = Object.keys(analysis.fileTypes);
    analysis.summary = types.map(type => 
      `${analysis.fileTypes[type]} ${type} file(s)`
    ).join(', ');
    
    return analysis;
  }

  async updatePRDFromChanges(changes, analysis) {
    console.log('📋 Updating PRD based on changes...');
    
    try {
      // อ่าน PRD ปัจจุบัน
      let prdContent = fs.readFileSync(this.prdPath, 'utf8');
      
      // สร้าง changelog entry
      const changelogEntry = this.generateChangelogEntry(changes, analysis);
      
      // อัปเดต PRD
      prdContent = this.insertChangelogIntoPRD(prdContent, changelogEntry);
      
      // บันทึก PRD ที่อัปเดตแล้ว
      fs.writeFileSync(this.prdPath, prdContent);
      
      console.log('  ✅ PRD updated with changelog');
      
    } catch (error) {
      console.error('  ❌ Error updating PRD:', error.message);
    }
  }

  generateChangelogEntry(changes, analysis) {
    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString('th-TH');
    
    let entry = `\n### 📝 Change Log - ${date}\n\n`;
    entry += `**Summary**: ${analysis.summary}\n\n`;
    
    // รายละเอียดการเปลี่ยนแปลง
    const groupedChanges = {};
    changes.forEach(change => {
      const category = change.isPRD ? '📋 Documentation' :
                      change.isPackage ? '📦 Configuration' :
                      change.isReadme ? '📖 Documentation' :
                      change.isSource ? '💻 Source Code' : '📁 Other';
      
      if (!groupedChanges[category]) {
        groupedChanges[category] = [];
      }
      
      groupedChanges[category].push(change);
    });
    
    Object.keys(groupedChanges).forEach(category => {
      entry += `**${category}**:\n`;
      groupedChanges[category].forEach(change => {
        entry += `- ${change.type}: \`${change.file}\`\n`;
      });
      entry += '\n';
    });
    
    entry += `*Updated: ${timestamp}*\n\n---\n`;
    
    return entry;
  }

  insertChangelogIntoPRD(prdContent, changelogEntry) {
    // หา section สำหรับ changelog
    const changelogMarker = '## 📝 Change History';
    
    if (prdContent.includes(changelogMarker)) {
      // แทรกหลัง marker
      const parts = prdContent.split(changelogMarker);
      return parts[0] + changelogMarker + '\n' + changelogEntry + parts[1];
    } else {
      // เพิ่ม section ใหม่ที่ท้ายไฟล์
      return prdContent + '\n\n' + changelogMarker + '\n' + changelogEntry;
    }
  }

  async syncChangesToNexus(changes, analysis) {
    console.log('🔄 Syncing changes to NEXUS IDE...');
    
    try {
      await this.syncManager.syncWithNexus();
      console.log('  ✅ Changes synced to NEXUS IDE');
    } catch (error) {
      console.error('  ❌ Error syncing to NEXUS IDE:', error.message);
    }
  }

  async autoCommitChanges(changes, analysis) {
    console.log('📤 Auto-committing changes...');
    
    try {
      const commitMessage = `Auto-update: ${analysis.summary}`;
      
      execSync('git add .', { cwd: this.projectRoot });
      execSync(`git commit -m "${commitMessage}"`, { cwd: this.projectRoot });
      
      console.log(`  ✅ Changes committed: ${commitMessage}`);
    } catch (error) {
      console.error('  ❌ Error committing changes:', error.message);
    }
  }

  async sendChangeNotifications(changes, analysis) {
    // TODO: Implement notifications (webhook, email, Slack, etc.)
    console.log('🔔 Change notifications sent');
  }

  async logChange(change) {
    try {
      let changeLog = { version: '1.0.0', changes: [], lastUpdate: new Date().toISOString(), totalChanges: 0 };
      
      if (fs.existsSync(this.changeLogPath)) {
        changeLog = JSON.parse(fs.readFileSync(this.changeLogPath, 'utf8'));
      }
      
      changeLog.changes.unshift(change);
      changeLog.lastUpdate = new Date().toISOString();
      changeLog.totalChanges = changeLog.changes.length;
      
      // เก็บเฉพาะ 1000 changes ล่าสุด
      if (changeLog.changes.length > 1000) {
        changeLog.changes = changeLog.changes.slice(0, 1000);
      }
      
      fs.writeFileSync(this.changeLogPath, JSON.stringify(changeLog, null, 2));
    } catch (error) {
      console.error('❌ Error logging change:', error.message);
    }
  }

  startSyncLoop() {
    const config = this.loadConfig();
    const interval = config.nexusIDE?.syncInterval || 30000;
    
    setInterval(async () => {
      if (this.changeQueue.length > 0) {
        console.log('🔄 Periodic sync triggered...');
        await this.processChanges();
      }
    }, interval);
  }

  async handleWatchError(error) {
    console.error('❌ Watcher error:', error.message);
    
    // พยายาม restart watcher
    setTimeout(async () => {
      console.log('🔄 Attempting to restart watcher...');
      await this.stopWatching();
      await this.startWatching();
    }, 5000);
  }

  async handleProcessingError(error, changes) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      changes: changes.map(c => ({ file: c.file, type: c.type })),
      type: 'processing-error'
    };

    const errorPath = path.join(this.projectRoot, '.watch-errors.json');
    let errors = [];
    
    if (fs.existsSync(errorPath)) {
      try {
        errors = JSON.parse(fs.readFileSync(errorPath, 'utf8'));
      } catch {
        // ใช้ array ว่าง
      }
    }
    
    errors.push(errorLog);
    
    // เก็บเฉพาะ 50 errors ล่าสุด
    if (errors.length > 50) {
      errors = errors.slice(-50);
    }
    
    fs.writeFileSync(errorPath, JSON.stringify(errors, null, 2));
  }

  // Utility methods
  getStatus() {
    return {
      isWatching: this.isWatching,
      queueLength: this.changeQueue.length,
      lastProcessed: this.lastProcessed || null,
      watchedPaths: this.watcher ? this.watcher.getWatched() : {}
    };
  }

  async getChangeHistory(limit = 50) {
    try {
      if (!fs.existsSync(this.changeLogPath)) {
        return { changes: [], total: 0 };
      }
      
      const changeLog = JSON.parse(fs.readFileSync(this.changeLogPath, 'utf8'));
      return {
        changes: changeLog.changes.slice(0, limit),
        total: changeLog.totalChanges,
        lastUpdate: changeLog.lastUpdate
      };
    } catch {
      return { changes: [], total: 0 };
    }
  }
}

// CLI interface
if (require.main === module) {
  const watcher = new PRDChangeWatcher();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
    case 'watch':
      watcher.startWatching();
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await watcher.stopWatching();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await watcher.stopWatching();
        process.exit(0);
      });
      break;
      
    case 'status':
      console.log('📊 Watcher Status:', watcher.getStatus());
      break;
      
    case 'history':
      watcher.getChangeHistory(20).then(history => {
        console.log('📝 Recent Changes:');
        history.changes.forEach(change => {
          console.log(`  ${change.timestamp} - ${change.type}: ${change.file}`);
        });
        console.log(`\nTotal changes: ${history.total}`);
      });
      break;
      
    default:
      console.log('Usage: node watch-prd-changes.js [start|status|history]');
      console.log('Commands:');
      console.log('  start   - Start watching for changes');
      console.log('  status  - Show watcher status');
      console.log('  history - Show recent changes');
      break;
  }
}

module.exports = PRDChangeWatcher;