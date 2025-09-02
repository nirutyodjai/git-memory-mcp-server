/**
 * Git Memory Service
 * Handles Git-based memory storage and retrieval operations
 * Enhanced with cache and compression capabilities
 */

const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const CacheCompressionService = require('./CacheCompressionService');

class GitMemoryService {
  constructor(options = {}) {
    this.repoPath = options.repoPath || path.join(process.cwd(), 'git-memory');
    this.git = null;
    this.initialized = false;
    
    // Initialize CacheCompressionService
    this.cacheService = new CacheCompressionService({
      id: `git-memory-${crypto.randomUUID()}`,
      cacheEnabled: options.cacheEnabled !== false,
      compressionEnabled: options.compressionEnabled !== false,
      compressionAlgorithm: options.compressionAlgorithm || 'gzip',
      compressionLevel: options.compressionLevel || 6,
      memoryCacheTtl: options.memoryCacheTtl || 3600, // 1 hour
      redisCacheTtl: options.redisCacheTtl || 86400,   // 24 hours
      redis: options.redis
    });
    
    // Initialize repository
    this.init();
  }

  /**
   * Initialize Git repository for memory storage and cache service
   */
  async init() {
    try {
      // Ensure directory exists
      await fs.mkdir(this.repoPath, { recursive: true });
      
      // Create git instance after directory exists
      this.git = simpleGit(this.repoPath);
      
      // Check if it's already a git repo
      const isRepo = await this.git.checkIsRepo();
      
      if (!isRepo) {
        await this.git.init();
        
        // Create initial commit
        const readmePath = path.join(this.repoPath, 'README.md');
        await fs.writeFile(readmePath, '# Git Memory Storage\n\nThis repository stores memory data for the MCP server.\n');
        
        await this.git.add('README.md');
        await this.git.commit('Initial commit: Git Memory Storage', {
          '--author': 'MCP Memory Service <mcp@gitmemory.service>'
        });
        
        logger.info('Git memory repository initialized', { path: this.repoPath });
      }
      
      // Initialize cache service
      await this.cacheService.initialize();
      
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize Git memory repository', {
        error: error.message,
        path: this.repoPath
      });
      throw error;
    }
  }

  /**
   * Store data in Git memory with caching
   * @param {string} key - Storage key
   * @param {Object} document - Document to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} Storage result
   */
  async store(key, document, options = {}) {
    try {
      if (!this.initialized || !this.git) {
        await this.init();
      }

      const {
        compression = false,
        commit_message = `Store: ${key}`,
        author = { name: 'MCP Memory Service', email: 'mcp@gitmemory.service' },
        cache = true,
        cacheTtl = this.cacheService.memoryCacheTtl
      } = options;

      // Create safe filename from key
      const filename = this.createSafeFilename(key);
      const filePath = path.join(this.repoPath, 'memories', filename + '.json');
      
      // Ensure memories directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Prepare document with metadata
      const documentWithMeta = {
        ...document,
        _meta: {
          key,
          stored_at: new Date().toISOString(),
          checksum: this.calculateChecksum(document)
        }
      };
      
      // Store in cache first (if enabled)
      let cacheResult = null;
      if (cache && this.cacheService.cacheEnabled) {
        try {
          cacheResult = await this.cacheService.store(key, documentWithMeta, {
            ttl: cacheTtl,
            forceCompression: compression
          });
          logger.debug('Document cached successfully', { key, cacheSize: cacheResult.size });
        } catch (cacheError) {
          logger.warn('Cache store failed, continuing with Git storage', { key, error: cacheError.message });
        }
      }
      
      // Write file to Git repository
      await fs.writeFile(filePath, JSON.stringify(documentWithMeta, null, 2));
      
      // Git operations
      await this.git.add(filePath);
      const commitResult = await this.git.commit(commit_message, {
        '--author': `${author.name} <${author.email}>`
      });
      
      logger.debug('Document stored in Git memory', {
        key,
        filename,
        commit: commitResult.commit
      });
      
      return {
        success: true,
        key,
        filename,
        commit: commitResult.commit,
        checksum: documentWithMeta._meta.checksum,
        cached: !!cacheResult,
        cacheInfo: cacheResult ? {
          size: cacheResult.size,
          compressed: cacheResult.compressed,
          compressionRatio: cacheResult.compressionRatio
        } : null
      };
      
    } catch (error) {
      logger.error('Failed to store document in Git memory', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retrieve data from Git memory with cache lookup
   * @param {string} key - Storage key
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Retrieved document
   */
  async retrieve(key, options = {}) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      const { useCache = true } = options;

      // Try cache first (if enabled)
      if (useCache && this.cacheService.cacheEnabled) {
        try {
          const cachedResult = await this.cacheService.retrieve(key);
          if (cachedResult) {
            logger.debug('Document retrieved from cache', { 
              key, 
              age: cachedResult.metadata.age,
              compressed: cachedResult.metadata.compressed 
            });
            return {
              ...cachedResult.data,
              _cache: {
                hit: true,
                age: cachedResult.metadata.age,
                compressed: cachedResult.metadata.compressed
              }
            };
          }
        } catch (cacheError) {
          logger.warn('Cache retrieval failed, falling back to Git', { key, error: cacheError.message });
        }
      }

      // Fallback to Git storage
      const filename = this.createSafeFilename(key);
      const filePath = path.join(this.repoPath, 'memories', filename + '.json');
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const document = JSON.parse(content);
        
        // Cache the retrieved document for future access
        if (useCache && this.cacheService.cacheEnabled) {
          try {
            await this.cacheService.store(key, document, {
              ttl: this.cacheService.memoryCacheTtl
            });
            logger.debug('Document cached after Git retrieval', { key });
          } catch (cacheError) {
            logger.warn('Failed to cache retrieved document', { key, error: cacheError.message });
          }
        }
        
        logger.debug('Document retrieved from Git memory', { key, filename });
        
        return {
          ...document,
          _cache: {
            hit: false,
            source: 'git'
          }
        };
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.debug('Document not found in Git memory', { key, filename });
          return null;
        }
        throw error;
      }
      
    } catch (error) {
      logger.error('Failed to retrieve document from Git memory', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete data from Git memory and cache
   * @param {string} key - Storage key
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async delete(key, options = {}) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      const {
        commit_message = `Delete: ${key}`,
        author = { name: 'MCP Memory Service', email: 'mcp@gitmemory.service' },
        clearCache = true
      } = options;

      const filename = this.createSafeFilename(key);
      const filePath = path.join(this.repoPath, 'memories', filename + '.json');
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.debug('Document not found for deletion', { key, filename });
          
          // Still try to clear from cache
          if (clearCache && this.cacheService.cacheEnabled) {
            try {
              await this.cacheService.delete(key);
            } catch (cacheError) {
              logger.warn('Cache delete failed', { key, error: cacheError.message });
            }
          }
          
          return {
            success: false,
            key,
            error: 'Document not found'
          };
        }
        throw error;
      }
      
      // Delete from cache first
      if (clearCache && this.cacheService.cacheEnabled) {
        try {
          await this.cacheService.delete(key);
          logger.debug('Document removed from cache', { key });
        } catch (cacheError) {
          logger.warn('Cache delete failed', { key, error: cacheError.message });
        }
      }
      
      // Delete file from Git repository
      await fs.unlink(filePath);
      
      // Git operations
      await this.git.add(filePath);
      const commitResult = await this.git.commit(commit_message, {
        '--author': `${author.name} <${author.email}>`
      });
      
      logger.debug('Document deleted from Git memory', {
        key,
        filename,
        commit: commitResult.commit
      });
      
      return {
        success: true,
        key,
        filename,
        commit: commitResult.commit
      };
      
    } catch (error) {
      logger.error('Failed to delete document from Git memory', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List all stored memories with cache information
   * @param {Object} options - List options
   * @returns {Promise<Array>} List of stored memories
   */
  async list(options = {}) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      const memoriesDir = path.join(this.repoPath, 'memories');
      
      try {
        const files = await fs.readdir(memoriesDir);
        const memories = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(memoriesDir, file);
            try {
              const content = await fs.readFile(filePath, 'utf8');
              const document = JSON.parse(content);
              
              // Check if document is cached
              let cached = false;
              if (this.cacheService.cacheEnabled && document._meta?.key) {
                try {
                  const cachedResult = await this.cacheService.retrieve(document._meta.key);
                  cached = !!cachedResult;
                } catch (cacheError) {
                  // Ignore cache check errors
                }
              }
              
              memories.push({
                key: document._meta?.key || file.replace('.json', ''),
                stored_at: document._meta?.stored_at,
                filename: file,
                size: content.length,
                cached
              });
            } catch (error) {
              logger.warn('Failed to read memory file', {
                file,
                error: error.message
              });
            }
          }
        }
        
        return memories;
      } catch {
        return []; // Directory doesn't exist or is empty
      }
    } catch (error) {
      logger.error('Failed to list Git memories', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get cache and compression statistics
   */
  async getStats() {
    const gitStats = await this.getGitStatus();
    const cacheStats = this.cacheService.cacheEnabled ? this.cacheService.getStats() : null;
    
    return {
      git: gitStats,
      cache: cacheStats,
      service: {
        initialized: this.initialized,
        repoPath: this.repoPath
      }
    };
  }

  /**
   * Get health status including cache service
   */
  async getHealth() {
    const gitHealth = await this.checkGitHealth();
    const cacheHealth = this.cacheService.cacheEnabled ? await this.cacheService.checkHealth() : null;
    
    return {
      git: gitHealth,
      cache: cacheHealth,
      overall: gitHealth.healthy && (cacheHealth ? cacheHealth.healthy : true)
    };
  }

  /**
   * Clean up resources including cache service
   */
  async cleanup() {
    try {
      if (this.cacheService) {
        await this.cacheService.cleanup();
      }
      logger.info('GitMemoryService cleanup completed');
    } catch (error) {
      logger.error('Error during GitMemoryService cleanup:', error);
      throw error;
    }
  }

  /**
   * Create safe filename from key
   * @param {string} key - Original key
   * @returns {string} Safe filename
   */
  createSafeFilename(key) {
    // Replace unsafe characters and limit length
    return key
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 200) + '_' + crypto.createHash('md5').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Calculate checksum for document
   * @param {Object} document - Document to checksum
   * @returns {string} Checksum
   */
  calculateChecksum(document) {
    return crypto.createHash('sha256').update(JSON.stringify(document)).digest('hex');
  }

  /**
   * Get repository status
   * @returns {Promise<Object>} Repository status
   */
  async getStatus() {
    try {
      if (!this.initialized) {
        await this.init();
      }

      const status = await this.git.status();
      const log = await this.git.log({ maxCount: 10 });
      
      return {
        initialized: this.initialized,
        path: this.repoPath,
        status: {
          current: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged.length,
          modified: status.modified.length,
          not_added: status.not_added.length,
          deleted: status.deleted.length
        },
        recent_commits: log.all.map(commit => ({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author: commit.author_name
        }))
      };
    } catch (error) {
      logger.error('Failed to get Git memory status', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = GitMemoryService;