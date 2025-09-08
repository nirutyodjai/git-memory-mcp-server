#!/usr/bin/env node

/**
 * Auto-Sync System for NEXUS IDE Integration
 * 
 * This system automatically synchronizes changes between:
 * - PRD (Product Requirements Document)
 * - Codebase
 * - Documentation
 * - NEXUS IDE configuration
 * - Git Memory MCP Server
 * 
 * When any component changes, this system ensures all related
 * components are updated accordingly.
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
const { logger } = require('../src/utils/logger');

class AutoSyncSystem {
  constructor() {
    this.config = {
      watchPaths: [
        'src/**/*.js',
        'package.json',
        'README.md',
        'docs/**/*.md',
        '*.config.js',
        '*.config.json',
        'scripts/**/*.js',
        'tests/**/*.js'
      ],
      excludePaths: [
        'node_modules/**',
        '.git/**',
        'logs/**',
        'tmp/**',
        'dist/**',
        'build/**'
      ],
      syncTargets: {
        prd: 'NEXUS-IDE-PRD-Updated.md',
        config: 'nexus-integration.config.json',
        package: 'package.json',
        readme: 'README.md',
        docs: 'docs/',
        api: 'docs/API-REFERENCE.md',
        integration: 'docs/NEXUS-IDE-INTEGRATION.md',
        development: 'docs/DEVELOPMENT.md'
      },
      debounceTime: 2000, // 2 seconds
      maxRetries: 3
    };
    
    this.syncQueue = new Map();
    this.isRunning = false;
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSync: null,
      startTime: new Date()
    };
  }

  /**
   * Start the auto-sync system
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Auto-sync system is already running');
      return;
    }

    logger.info('Starting Auto-Sync System for NEXUS IDE Integration');
    this.isRunning = true;

    try {
      // Initialize watchers
      await this.initializeWatchers();
      
      // Perform initial sync
      await this.performInitialSync();
      
      // Setup periodic health checks
      this.setupHealthChecks();
      
      logger.info('Auto-sync system started successfully');
      
    } catch (error) {
      logger.error('Failed to start auto-sync system', { error: error.message });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the auto-sync system
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Auto-sync system is not running');
      return;
    }

    logger.info('Stopping Auto-Sync System');
    this.isRunning = false;

    // Close watchers
    if (this.watcher) {
      await this.watcher.close();
    }

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    logger.info('Auto-sync system stopped');
  }

  /**
   * Initialize file watchers
   */
  async initializeWatchers() {
    this.watcher = chokidar.watch(this.config.watchPaths, {
      ignored: this.config.excludePaths,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    // Handle file changes
    this.watcher.on('change', (filePath) => {
      this.handleFileChange(filePath, 'modified');
    });

    this.watcher.on('add', (filePath) => {
      this.handleFileChange(filePath, 'added');
    });

    this.watcher.on('unlink', (filePath) => {
      this.handleFileChange(filePath, 'deleted');
    });

    this.watcher.on('error', (error) => {
      logger.error('File watcher error', { error: error.message });
    });

    logger.info('File watchers initialized', {
      watchPaths: this.config.watchPaths,
      excludePaths: this.config.excludePaths
    });
  }

  /**
   * Handle file changes
   */
  async handleFileChange(filePath, changeType) {
    logger.debug('File change detected', { filePath, changeType });

    // Determine sync targets based on changed file
    const syncTargets = this.determineSyncTargets(filePath, changeType);
    
    if (syncTargets.length === 0) {
      logger.debug('No sync targets for file change', { filePath });
      return;
    }

    // Add to sync queue with debouncing
    const queueKey = `${filePath}-${changeType}`;
    
    if (this.syncQueue.has(queueKey)) {
      clearTimeout(this.syncQueue.get(queueKey).timeout);
    }

    const timeout = setTimeout(async () => {
      try {
        await this.executeSyncTargets(syncTargets, filePath, changeType);
        this.syncQueue.delete(queueKey);
      } catch (error) {
        logger.error('Sync execution failed', {
          filePath,
          changeType,
          error: error.message
        });
      }
    }, this.config.debounceTime);

    this.syncQueue.set(queueKey, {
      filePath,
      changeType,
      syncTargets,
      timeout,
      timestamp: new Date()
    });
  }

  /**
   * Determine which components need to be synced based on file change
   */
  determineSyncTargets(filePath, changeType) {
    const targets = [];
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);

    // Package.json changes
    if (fileName === 'package.json') {
      targets.push('prd', 'config', 'docs', 'api');
    }

    // README changes
    if (fileName === 'README.md') {
      targets.push('prd', 'docs', 'integration');
    }

    // Source code changes
    if (filePath.startsWith('src/')) {
      targets.push('prd', 'api', 'development');
      
      // Specific source file types
      if (filePath.includes('mcp/')) {
        targets.push('integration');
      }
      if (filePath.includes('nexus/')) {
        targets.push('config', 'integration');
      }
    }

    // Documentation changes
    if (filePath.startsWith('docs/')) {
      targets.push('prd');
      
      if (fileName === 'API-REFERENCE.md') {
        targets.push('integration');
      }
    }

    // Configuration changes
    if (fileName.includes('.config.')) {
      targets.push('prd', 'integration', 'development');
    }

    // Script changes
    if (filePath.startsWith('scripts/')) {
      targets.push('prd', 'development');
    }

    // Test changes
    if (filePath.startsWith('tests/')) {
      targets.push('development');
    }

    return [...new Set(targets)];
  }

  /**
   * Execute sync targets
   */
  async executeSyncTargets(targets, filePath, changeType) {
    logger.info('Executing sync targets', { targets, filePath, changeType });
    
    this.stats.totalSyncs++;
    
    try {
      const results = await Promise.allSettled(
        targets.map(target => this.syncTarget(target, filePath, changeType))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.stats.successfulSyncs += successful;
      this.stats.failedSyncs += failed;
      this.stats.lastSync = new Date();

      if (failed > 0) {
        const errors = results
          .filter(r => r.status === 'rejected')
          .map(r => r.reason.message);
        
        logger.warn('Some sync targets failed', {
          successful,
          failed,
          errors
        });
      } else {
        logger.info('All sync targets completed successfully', {
          targets,
          filePath
        });
      }

      // Notify NEXUS IDE of changes
      await this.notifyNexusIDE(targets, filePath, changeType);
      
    } catch (error) {
      this.stats.failedSyncs++;
      logger.error('Sync execution failed', {
        targets,
        filePath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sync specific target
   */
  async syncTarget(target, filePath, changeType) {
    logger.debug('Syncing target', { target, filePath, changeType });

    switch (target) {
      case 'prd':
        return await this.syncPRD(filePath, changeType);
      
      case 'config':
        return await this.syncConfig(filePath, changeType);
      
      case 'docs':
        return await this.syncDocumentation(filePath, changeType);
      
      case 'api':
        return await this.syncAPIReference(filePath, changeType);
      
      case 'integration':
        return await this.syncIntegrationDocs(filePath, changeType);
      
      case 'development':
        return await this.syncDevelopmentDocs(filePath, changeType);
      
      default:
        throw new Error(`Unknown sync target: ${target}`);
    }
  }

  /**
   * Sync PRD document
   */
  async syncPRD(filePath, changeType) {
    logger.debug('Syncing PRD document');
    
    try {
      // Run PRD update script
      execSync('npm run prd:update', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      // Update PRD with latest changes
      const prdPath = path.join(process.cwd(), this.config.syncTargets.prd);
      const prdContent = await fs.readFile(prdPath, 'utf8');
      
      // Add sync metadata
      const syncMetadata = {
        lastSync: new Date().toISOString(),
        triggeredBy: filePath,
        changeType,
        syncVersion: this.getSyncVersion()
      };
      
      const updatedContent = this.addSyncMetadata(prdContent, syncMetadata);
      await fs.writeFile(prdPath, updatedContent, 'utf8');
      
      logger.info('PRD document synced successfully');
      
    } catch (error) {
      logger.error('Failed to sync PRD document', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync configuration files
   */
  async syncConfig(filePath, changeType) {
    logger.debug('Syncing configuration files');
    
    try {
      // Update NEXUS integration config
      const configPath = path.join(process.cwd(), this.config.syncTargets.config);
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
      
      // Update metadata
      config.metadata.lastUpdated = new Date().toISOString();
      config.metadata.triggeredBy = filePath;
      config.metadata.changeType = changeType;
      config.metadata.syncVersion = this.getSyncVersion();
      
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
      
      logger.info('Configuration files synced successfully');
      
    } catch (error) {
      logger.error('Failed to sync configuration files', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync documentation
   */
  async syncDocumentation(filePath, changeType) {
    logger.debug('Syncing documentation');
    
    try {
      // Run documentation generation
      execSync('npm run docs:generate', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      logger.info('Documentation synced successfully');
      
    } catch (error) {
      logger.error('Failed to sync documentation', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync API reference
   */
  async syncAPIReference(filePath, changeType) {
    logger.debug('Syncing API reference');
    
    try {
      const apiRefPath = path.join(process.cwd(), this.config.syncTargets.api);
      const content = await fs.readFile(apiRefPath, 'utf8');
      
      // Add sync metadata
      const syncInfo = `\n\n---\n\n*Last updated: ${new Date().toISOString()} (triggered by ${filePath})*`;
      const updatedContent = content.replace(/\n\n---\n\n\*Last updated:.*?\*$/s, '') + syncInfo;
      
      await fs.writeFile(apiRefPath, updatedContent, 'utf8');
      
      logger.info('API reference synced successfully');
      
    } catch (error) {
      logger.error('Failed to sync API reference', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync integration documentation
   */
  async syncIntegrationDocs(filePath, changeType) {
    logger.debug('Syncing integration documentation');
    
    try {
      // Run NEXUS sync script
      execSync('npm run nexus:sync', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      logger.info('Integration documentation synced successfully');
      
    } catch (error) {
      logger.error('Failed to sync integration documentation', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync development documentation
   */
  async syncDevelopmentDocs(filePath, changeType) {
    logger.debug('Syncing development documentation');
    
    try {
      const devDocsPath = path.join(process.cwd(), this.config.syncTargets.development);
      const content = await fs.readFile(devDocsPath, 'utf8');
      
      // Update auto-update section
      const autoUpdateSection = `### 🔄 Auto-Update System\n\nThis development guide is part of an automated system that ensures consistency between:\n- Product Requirements Document (PRD)\n- Codebase changes\n- Documentation updates\n- NEXUS IDE integration\n\nWhen any component is modified, the system automatically updates related documentation and configurations.\n\n**Last sync**: ${new Date().toISOString()}\n**Triggered by**: ${filePath}\n**Change type**: ${changeType}`;
      
      const updatedContent = content.replace(
        /### 🔄 Auto-Update System[\s\S]*?(?=\n##|$)/,
        autoUpdateSection + '\n\n'
      );
      
      await fs.writeFile(devDocsPath, updatedContent, 'utf8');
      
      logger.info('Development documentation synced successfully');
      
    } catch (error) {
      logger.error('Failed to sync development documentation', { error: error.message });
      throw error;
    }
  }

  /**
   * Notify NEXUS IDE of changes
   */
  async notifyNexusIDE(targets, filePath, changeType) {
    try {
      // Send notification to NEXUS IDE via WebSocket or HTTP
      const notification = {
        type: 'sync_completed',
        timestamp: new Date().toISOString(),
        targets,
        filePath,
        changeType,
        syncVersion: this.getSyncVersion()
      };
      
      // This would be implemented based on NEXUS IDE's API
      logger.debug('Notification sent to NEXUS IDE', notification);
      
    } catch (error) {
      logger.warn('Failed to notify NEXUS IDE', { error: error.message });
    }
  }

  /**
   * Perform initial sync
   */
  async performInitialSync() {
    logger.info('Performing initial sync');
    
    try {
      // Sync all targets
      await this.executeSyncTargets(
        ['prd', 'config', 'docs', 'api', 'integration', 'development'],
        'system',
        'initial'
      );
      
      logger.info('Initial sync completed successfully');
      
    } catch (error) {
      logger.error('Initial sync failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup health checks
   */
  setupHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
      }
    }, 60000); // Every minute
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const health = {
      isRunning: this.isRunning,
      queueSize: this.syncQueue.size,
      stats: this.stats,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
    
    logger.debug('Health check', health);
    
    // Check if queue is getting too large
    if (this.syncQueue.size > 100) {
      logger.warn('Sync queue is getting large', { queueSize: this.syncQueue.size });
    }
    
    return health;
  }

  /**
   * Get sync version
   */
  getSyncVersion() {
    try {
      const packageJson = require('../package.json');
      return `${packageJson.version}-${Date.now()}`;
    } catch {
      return `unknown-${Date.now()}`;
    }
  }

  /**
   * Add sync metadata to content
   */
  addSyncMetadata(content, metadata) {
    const metadataComment = `\n\n<!-- Auto-Sync Metadata\n${JSON.stringify(metadata, null, 2)}\n-->`;
    
    // Remove existing metadata
    const cleanContent = content.replace(/\n\n<!-- Auto-Sync Metadata[\s\S]*?-->/g, '');
    
    return cleanContent + metadataComment;
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      queueSize: this.syncQueue.size,
      stats: this.stats,
      uptime: this.isRunning ? Date.now() - this.stats.startTime.getTime() : 0,
      config: this.config
    };
  }
}

// CLI Interface
if (require.main === module) {
  const autoSync = new AutoSyncSystem();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      autoSync.start().catch(error => {
        console.error('Failed to start auto-sync system:', error.message);
        process.exit(1);
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down auto-sync system...');
        await autoSync.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\nShutting down auto-sync system...');
        await autoSync.stop();
        process.exit(0);
      });
      break;
      
    case 'status':
      const status = autoSync.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'stop':
      autoSync.stop().then(() => {
        console.log('Auto-sync system stopped');
      }).catch(error => {
        console.error('Failed to stop auto-sync system:', error.message);
        process.exit(1);
      });
      break;
      
    default:
      console.log(`
NEXUS IDE Auto-Sync System

Usage:
  node auto-sync-system.js <command>

Commands:
  start    Start the auto-sync system
  status   Show system status
  stop     Stop the auto-sync system

Examples:
  node auto-sync-system.js start
  node auto-sync-system.js status
  node auto-sync-system.js stop
`);
      break;
  }
}

module.exports = { AutoSyncSystem };