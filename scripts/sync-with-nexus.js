#!/usr/bin/env node
/**
 * NEXUS IDE Sync Script
 * ซิงค์ข้อมูลและการตั้งค่าระหว่าง Git Memory MCP Server และ NEXUS IDE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

class NexusSyncManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'nexus-sync.config.json');
    this.serverInfoPath = path.join(__dirname, '..', '.server-info.json');
    this.prdPath = path.join(__dirname, '..', 'NEXUS-IDE-PRD-Updated.md');
    this.packagePath = path.join(__dirname, '..', 'package.json');
    this.initializeConfig();
  }

  initializeConfig() {
    const defaultConfig = {
      nexusIDE: {
        endpoint: 'http://localhost:3000',
        apiKey: process.env.NEXUS_API_KEY || '',
        syncInterval: 30000, // 30 seconds
        features: {
          autoSync: true,
          realTimeUpdates: true,
          healthMonitoring: true,
          performanceMetrics: true
        }
      },
      gitMemoryServer: {
        endpoint: 'http://localhost:65261',
        healthEndpoint: '/health',
        metricsEndpoint: '/metrics',
        statusEndpoint: '/status'
      },
      sync: {
        bidirectional: true,
        conflictResolution: 'server-wins', // 'server-wins', 'client-wins', 'manual'
        retryAttempts: 3,
        retryDelay: 5000
      },
      notifications: {
        webhook: null,
        email: null,
        slack: null
      }
    };

    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    }
  }

  async syncWithNexus() {
    console.log('🔄 Starting NEXUS IDE synchronization...');
    
    try {
      const config = this.loadConfig();
      
      // ตรวจสอบสถานะ server
      const serverStatus = await this.checkServerStatus();
      const nexusStatus = await this.checkNexusStatus(config);
      
      console.log(`📊 Server Status: ${serverStatus.status}`);
      console.log(`🎯 NEXUS Status: ${nexusStatus.status}`);
      
      if (serverStatus.status !== 'running') {
        throw new Error('Git Memory MCP Server is not running');
      }
      
      // ซิงค์ข้อมูล
      await this.syncServerInfo(config, serverStatus);
      await this.syncPRDData(config);
      await this.syncConfiguration(config);
      await this.syncMetrics(config, serverStatus);
      
      // อัปเดตสถานะการซิงค์
      await this.updateSyncStatus(config);
      
      console.log('✅ NEXUS IDE synchronization completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during NEXUS synchronization:', error.message);
      await this.handleSyncError(error);
      process.exit(1);
    }
  }

  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  async checkServerStatus() {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 65261,
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              status: 'running',
              health: response,
              port: 65261,
              timestamp: Date.now()
            });
          } catch (error) {
            resolve({ status: 'error', error: error.message });
          }
        });
      });

      req.on('error', () => resolve({ status: 'stopped' }));
      req.on('timeout', () => resolve({ status: 'timeout' }));
      req.setTimeout(5000);
      req.end();
    });
  }

  async checkNexusStatus(config) {
    return new Promise((resolve) => {
      if (!config.nexusIDE.endpoint) {
        resolve({ status: 'not-configured' });
        return;
      }

      const url = new URL(config.nexusIDE.endpoint);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/api/health',
        method: 'GET',
        timeout: 5000,
        headers: {
          'Authorization': config.nexusIDE.apiKey ? `Bearer ${config.nexusIDE.apiKey}` : undefined,
          'Content-Type': 'application/json'
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode === 200 ? 'running' : 'error',
            statusCode: res.statusCode,
            response: data
          });
        });
      });

      req.on('error', () => resolve({ status: 'unreachable' }));
      req.on('timeout', () => resolve({ status: 'timeout' }));
      req.setTimeout(5000);
      req.end();
    });
  }

  async syncServerInfo(config, serverStatus) {
    console.log('📡 Syncing server information...');
    
    const packageInfo = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    
    const serverInfo = {
      name: packageInfo.name,
      version: packageInfo.version,
      description: packageInfo.description,
      status: serverStatus,
      capabilities: {
        mcp: true,
        websocket: true,
        restApi: true,
        healthCheck: true,
        metrics: true,
        gitIntegration: true,
        memoryPersistence: true
      },
      endpoints: {
        health: `${config.gitMemoryServer.endpoint}/health`,
        metrics: `${config.gitMemoryServer.endpoint}/metrics`,
        status: `${config.gitMemoryServer.endpoint}/status`,
        mcp: config.gitMemoryServer.endpoint
      },
      lastSync: new Date().toISOString(),
      syncedBy: 'nexus-sync-script'
    };

    // บันทึกข้อมูล server info
    fs.writeFileSync(this.serverInfoPath, JSON.stringify(serverInfo, null, 2));
    
    // ส่งข้อมูลไปยัง NEXUS IDE (ถ้าพร้อมใช้งาน)
    if (config.nexusIDE.endpoint && config.nexusIDE.apiKey) {
      await this.sendToNexus(config, '/api/mcp-servers/register', serverInfo);
    }
    
    console.log('  ✅ Server information synced');
  }

  async syncPRDData(config) {
    console.log('📋 Syncing PRD data...');
    
    if (!fs.existsSync(this.prdPath)) {
      console.log('  ⚠️  PRD file not found, skipping PRD sync');
      return;
    }

    const prdContent = fs.readFileSync(this.prdPath, 'utf8');
    const prdData = {
      content: prdContent,
      lastModified: fs.statSync(this.prdPath).mtime.toISOString(),
      wordCount: prdContent.split(/\s+/).length,
      sections: this.extractPRDSections(prdContent),
      metadata: {
        title: 'NEXUS IDE - Product Requirements Document',
        type: 'PRD',
        version: this.extractVersionFromPRD(prdContent),
        syncedAt: new Date().toISOString()
      }
    };

    // ส่งข้อมูล PRD ไปยัง NEXUS IDE
    if (config.nexusIDE.endpoint && config.nexusIDE.apiKey) {
      await this.sendToNexus(config, '/api/documentation/prd', prdData);
    }
    
    console.log('  ✅ PRD data synced');
  }

  extractPRDSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    
    lines.forEach(line => {
      if (line.startsWith('#')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, ''),
          level: line.match(/^#+/)[0].length,
          content: ''
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  extractVersionFromPRD(content) {
    const versionMatch = content.match(/version["']?\s*:?\s*["']?([\d\.]+)/i);
    return versionMatch ? versionMatch[1] : '1.0.0';
  }

  async syncConfiguration(config) {
    console.log('⚙️ Syncing configuration...');
    
    const configData = {
      gitMemoryServer: {
        ...config.gitMemoryServer,
        features: {
          dynamicPort: true,
          healthMonitoring: true,
          memoryPersistence: true,
          gitIntegration: true,
          mcpProtocol: true
        }
      },
      sync: config.sync,
      lastConfigSync: new Date().toISOString()
    };

    // ส่งการตั้งค่าไปยัง NEXUS IDE
    if (config.nexusIDE.endpoint && config.nexusIDE.apiKey) {
      await this.sendToNexus(config, '/api/mcp-servers/config', configData);
    }
    
    console.log('  ✅ Configuration synced');
  }

  async syncMetrics(config, serverStatus) {
    console.log('📊 Syncing metrics...');
    
    const metrics = {
      server: {
        status: serverStatus.status,
        uptime: this.getServerUptime(),
        memory: this.getMemoryUsage(),
        performance: {
          responseTime: serverStatus.responseTime || 0,
          requestCount: 0,
          errorCount: 0
        }
      },
      git: this.getGitMetrics(),
      mcp: {
        protocolVersion: '1.0',
        clientConnections: 0,
        messageCount: 0
      },
      timestamp: new Date().toISOString()
    };

    // ส่ง metrics ไปยัง NEXUS IDE
    if (config.nexusIDE.endpoint && config.nexusIDE.apiKey) {
      await this.sendToNexus(config, '/api/mcp-servers/metrics', metrics);
    }
    
    console.log('  ✅ Metrics synced');
  }

  getServerUptime() {
    try {
      const uptime = execSync('node -e "console.log(process.uptime())"', { encoding: 'utf8' });
      return parseFloat(uptime.trim());
    } catch {
      return 0;
    }
  }

  getMemoryUsage() {
    try {
      const memInfo = process.memoryUsage();
      return {
        rss: memInfo.rss,
        heapTotal: memInfo.heapTotal,
        heapUsed: memInfo.heapUsed,
        external: memInfo.external
      };
    } catch {
      return {};
    }
  }

  getGitMetrics() {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      
      return {
        branch,
        commit,
        commitCount: parseInt(commitCount),
        hasUncommittedChanges: status.length > 0,
        lastCommitDate: execSync('git log -1 --format="%ci"', { encoding: 'utf8' }).trim()
      };
    } catch {
      return {};
    }
  }

  async sendToNexus(config, endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(config.nexusIDE.endpoint + endpoint);
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.nexusIDE.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: responseData });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.setTimeout(10000);
      req.write(postData);
      req.end();
    });
  }

  async updateSyncStatus(config) {
    const syncStatus = {
      lastSync: new Date().toISOString(),
      status: 'success',
      nextSync: new Date(Date.now() + config.nexusIDE.syncInterval).toISOString(),
      syncCount: this.incrementSyncCount()
    };

    const statusPath = path.join(__dirname, '..', '.sync-status.json');
    fs.writeFileSync(statusPath, JSON.stringify(syncStatus, null, 2));
  }

  incrementSyncCount() {
    const statusPath = path.join(__dirname, '..', '.sync-status.json');
    let count = 1;
    
    if (fs.existsSync(statusPath)) {
      try {
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        count = (status.syncCount || 0) + 1;
      } catch {
        // ใช้ค่าเริ่มต้น
      }
    }
    
    return count;
  }

  async handleSyncError(error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      type: 'sync-error'
    };

    const errorPath = path.join(__dirname, '..', '.sync-errors.json');
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
}

// Run the sync manager
if (require.main === module) {
  const syncManager = new NexusSyncManager();
  syncManager.syncWithNexus().catch(console.error);
}

module.exports = NexusSyncManager;