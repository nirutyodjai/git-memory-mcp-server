/**
 * Memory Operations Service for MCP Protocol
 * Handles memory storage, retrieval, and management operations
 */

const logger = require('../utils/logger');
const GitMemoryService = require('./GitMemoryService');
const SemanticMemoryService = require('./SemanticMemoryService');

class MemoryOperationsService {
  constructor() {
    this.gitMemoryService = new GitMemoryService();
    this.semanticMemoryService = new SemanticMemoryService();
    this.stats = {
      operations_count: 0,
      store_operations: 0,
      retrieve_operations: 0,
      list_operations: 0,
      delete_operations: 0,
      errors: 0,
      last_operation: null
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the Memory Operations Service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize underlying services if they have initialize methods
      if (this.gitMemoryService.initialize) {
        await this.gitMemoryService.initialize();
      }
      if (this.semanticMemoryService.initialize) {
        await this.semanticMemoryService.initialize();
      }
      this.isInitialized = true;
      logger.info('Memory Operations Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Memory Operations Service', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Store data in memory with optional metadata and semantic indexing
   * @param {string} key - Unique key for the data
   * @param {*} data - Data to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} Storage result
   */
  async store(key, data, options = {}) {
    try {
      this.stats.operations_count++;
      this.stats.store_operations++;
      this.stats.last_operation = new Date().toISOString();

      const {
        metadata = {},
        tags = [],
        enableSemanticIndex = true,
        ttl = null,
        compression = false
      } = options;

      // Validate input
      if (!key || typeof key !== 'string') {
        throw new Error('Key must be a non-empty string');
      }

      if (key.length > 255) {
        throw new Error('Key must be less than 256 characters');
      }

      // Prepare document for storage
      const document = {
        data,
        metadata: {
          ...metadata,
          tags: Array.isArray(tags) ? tags : [],
          stored_at: new Date().toISOString(),
          ttl: ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null,
          compression_enabled: compression,
          semantic_indexed: enableSemanticIndex
        }
      };

      // Store in git memory
      const gitResult = await this.gitMemoryService.store(key, document, {
        compression,
        commit_message: `Store memory: ${key}`,
        author: {
          name: 'MCP Memory Service',
          email: 'mcp@gitmemory.service'
        }
      });

      // Add to semantic index if enabled
      if (enableSemanticIndex) {
        try {
          await this.semanticMemoryService.addToIndex(key, document);
          logger.debug('Document added to semantic index', { key });
        } catch (semanticError) {
          logger.warn('Failed to add to semantic index', {
            key,
            error: semanticError.message
          });
          // Don't fail the entire operation if semantic indexing fails
        }
      }

      const result = {
        success: true,
        key,
        stored_at: document.metadata.stored_at,
        git_commit: gitResult.commit,
        semantic_indexed: enableSemanticIndex,
        size_bytes: JSON.stringify(document).length,
        metadata: document.metadata
      };

      logger.info('Memory stored successfully', {
        key,
        size_bytes: result.size_bytes,
        semantic_indexed: enableSemanticIndex,
        tags: tags.length
      });

      return result;
    } catch (error) {
      this.stats.errors++;
      logger.error('Memory store operation failed', {
        key,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Retrieve data from memory
   * @param {string} key - Key to retrieve
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Retrieved data
   */
  async retrieve(key, options = {}) {
    try {
      this.stats.operations_count++;
      this.stats.retrieve_operations++;
      this.stats.last_operation = new Date().toISOString();

      const {
        includeMetadata = true,
        checkTTL = true,
        version = null
      } = options;

      // Validate input
      if (!key || typeof key !== 'string') {
        throw new Error('Key must be a non-empty string');
      }

      // Retrieve from git memory
      const document = await this.gitMemoryService.retrieve(key, {
        version,
        includeHistory: false
      });

      if (!document) {
        return null;
      }

      // Check TTL if enabled
      if (checkTTL && document.metadata?.ttl) {
        const ttlDate = new Date(document.metadata.ttl);
        if (ttlDate < new Date()) {
          logger.info('Document expired, removing from memory', {
            key,
            ttl: document.metadata.ttl
          });
          
          // Remove expired document
          await this.delete(key, { reason: 'TTL expired' });
          return null;
        }
      }

      const result = {
        key,
        data: document.data,
        retrieved_at: new Date().toISOString()
      };

      if (includeMetadata) {
        result.metadata = document.metadata;
      }

      logger.debug('Memory retrieved successfully', { key });

      return result;
    } catch (error) {
      this.stats.errors++;
      logger.error('Memory retrieve operation failed', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List stored memories with filtering and pagination
   * @param {Object} options - List options
   * @returns {Promise<Object>} List result
   */
  async list(options = {}) {
    try {
      this.stats.operations_count++;
      this.stats.list_operations++;
      this.stats.last_operation = new Date().toISOString();

      const {
        limit = 50,
        offset = 0,
        tags = null,
        pattern = null,
        sortBy = 'stored_at',
        sortOrder = 'desc',
        includeMetadata = true,
        checkTTL = true
      } = options;

      // Get all documents from git memory
      const allDocuments = await this.gitMemoryService.list({
        limit: limit + offset + 100, // Get extra to account for filtering
        includeMetadata: true
      });

      let filteredDocuments = allDocuments;

      // Filter by TTL
      if (checkTTL) {
        const now = new Date();
        filteredDocuments = filteredDocuments.filter(doc => {
          if (doc.metadata?.ttl) {
            const ttlDate = new Date(doc.metadata.ttl);
            if (ttlDate < now) {
              // Schedule for deletion (async)
              this.delete(doc.key, { reason: 'TTL expired' }).catch(err => {
                logger.error('Failed to delete expired document', {
                  key: doc.key,
                  error: err.message
                });
              });
              return false;
            }
          }
          return true;
        });
      }

      // Filter by tags
      if (tags && tags.length > 0) {
        filteredDocuments = filteredDocuments.filter(doc => {
          const docTags = doc.metadata?.tags || [];
          return tags.some(tag => Array.isArray(docTags) && docTags.includes(tag));
        });
      }

      // Filter by pattern
      if (pattern) {
        const regex = new RegExp(pattern, 'i');
        filteredDocuments = filteredDocuments.filter(doc => {
          return regex.test(doc.key) || 
                 regex.test(JSON.stringify(doc.data)) ||
                 (doc.metadata?.title && regex.test(doc.metadata.title));
        });
      }

      // Sort documents
      filteredDocuments.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'key':
            aValue = a.key;
            bValue = b.key;
            break;
          case 'size':
            aValue = JSON.stringify(a.data).length;
            bValue = JSON.stringify(b.data).length;
            break;
          case 'stored_at':
          default:
            aValue = new Date(a.metadata?.stored_at || 0);
            bValue = new Date(b.metadata?.stored_at || 0);
            break;
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // Apply pagination
      const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

      // Format results
      const results = paginatedDocuments.map(doc => {
        const result = {
          key: doc.key,
          size_bytes: JSON.stringify(doc.data).length,
          stored_at: doc.metadata?.stored_at
        };

        if (includeMetadata) {
          result.metadata = doc.metadata;
          result.data_preview = this.generateDataPreview(doc.data);
        }

        return result;
      });

      const listResult = {
        results,
        pagination: {
          total: filteredDocuments.length,
          limit,
          offset,
          has_more: offset + limit < filteredDocuments.length
        },
        filters: {
          tags,
          pattern,
          sort_by: sortBy,
          sort_order: sortOrder
        },
        retrieved_at: new Date().toISOString()
      };

      logger.info('Memory list operation completed', {
        total_results: filteredDocuments.length,
        returned_results: results.length,
        filters_applied: !!(tags || pattern)
      });

      return listResult;
    } catch (error) {
      this.stats.errors++;
      logger.error('Memory list operation failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Delete data from memory
   * @param {string} key - Key to delete
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async delete(key, options = {}) {
    try {
      this.stats.operations_count++;
      this.stats.delete_operations++;
      this.stats.last_operation = new Date().toISOString();

      const {
        reason = 'Manual deletion',
        removeFromSemanticIndex = true
      } = options;

      // Validate input
      if (!key || typeof key !== 'string') {
        throw new Error('Key must be a non-empty string');
      }

      // Check if document exists
      const existingDocument = await this.gitMemoryService.retrieve(key);
      if (!existingDocument) {
        return {
          success: false,
          key,
          error: 'Document not found',
          deleted_at: new Date().toISOString()
        };
      }

      // Delete from git memory
      const gitResult = await this.gitMemoryService.delete(key, {
        commit_message: `Delete memory: ${key} (${reason})`,
        author: {
          name: 'MCP Memory Service',
          email: 'mcp@gitmemory.service'
        }
      });

      // Remove from semantic index
      if (removeFromSemanticIndex) {
        try {
          await this.semanticMemoryService.removeFromIndex(key);
          logger.debug('Document removed from semantic index', { key });
        } catch (semanticError) {
          logger.warn('Failed to remove from semantic index', {
            key,
            error: semanticError.message
          });
          // Don't fail the entire operation
        }
      }

      const result = {
        success: true,
        key,
        reason,
        deleted_at: new Date().toISOString(),
        git_commit: gitResult.commit,
        removed_from_semantic_index: removeFromSemanticIndex
      };

      logger.info('Memory deleted successfully', {
        key,
        reason
      });

      return result;
    } catch (error) {
      this.stats.errors++;
      logger.error('Memory delete operation failed', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk operations for multiple keys
   * @param {string} operation - Operation type ('store', 'retrieve', 'delete')
   * @param {Array} items - Array of items to process
   * @param {Object} options - Bulk operation options
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulk(operation, items, options = {}) {
    try {
      const {
        batchSize = 10,
        continueOnError = true,
        timeout = 30000
      } = options;

      const results = [];
      const errors = [];
      let processed = 0;

      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
          try {
            let result;
            switch (operation) {
              case 'store':
                result = await this.store(item.key, item.data, item.options || {});
                break;
              case 'retrieve':
                result = await this.retrieve(item.key, item.options || {});
                break;
              case 'delete':
                result = await this.delete(item.key, item.options || {});
                break;
              default:
                throw new Error(`Unsupported bulk operation: ${operation}`);
            }
            return { success: true, item, result };
          } catch (error) {
            const errorResult = { success: false, item, error: error.message };
            if (!continueOnError) {
              throw error;
            }
            return errorResult;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(promiseResult => {
          if (promiseResult.status === 'fulfilled') {
            const { success, item, result, error } = promiseResult.value;
            if (success) {
              results.push({ item, result });
            } else {
              errors.push({ item, error });
            }
          } else {
            errors.push({ 
              item: batch[batchResults.indexOf(promiseResult)], 
              error: promiseResult.reason.message 
            });
          }
        });

        processed += batch.length;
        
        logger.info('Bulk operation progress', {
          operation,
          processed,
          total: items.length,
          success_count: results.length,
          error_count: errors.length
        });
      }

      const bulkResult = {
        operation,
        total_items: items.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors,
        completed_at: new Date().toISOString()
      };

      logger.info('Bulk operation completed', {
        operation,
        total: items.length,
        successful: results.length,
        failed: errors.length
      });

      return bulkResult;
    } catch (error) {
      this.stats.errors++;
      logger.error('Bulk operation failed', {
        operation,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate a preview of data for listing
   * @param {*} data - Data to preview
   * @returns {string} Data preview
   */
  generateDataPreview(data) {
    try {
      if (typeof data === 'string') {
        return data.length > 100 ? data.substring(0, 100) + '...' : data;
      } else if (typeof data === 'object') {
        const jsonStr = JSON.stringify(data);
        return jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
      } else {
        return String(data);
      }
    } catch (error) {
      return '[Preview unavailable]';
    }
  }

  /**
   * Clean up expired documents
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanup(options = {}) {
    try {
      const {
        dryRun = false,
        batchSize = 50
      } = options;

      logger.info('Starting memory cleanup', { dry_run: dryRun });

      // Get all documents
      const allDocuments = await this.gitMemoryService.list({ limit: 10000 });
      const now = new Date();
      const expiredDocuments = [];

      // Find expired documents
      allDocuments.forEach(doc => {
        if (doc.metadata?.ttl) {
          const ttlDate = new Date(doc.metadata.ttl);
          if (ttlDate < now) {
            expiredDocuments.push(doc);
          }
        }
      });

      if (expiredDocuments.length === 0) {
        return {
          expired_count: 0,
          deleted_count: 0,
          dry_run: dryRun,
          completed_at: new Date().toISOString()
        };
      }

      let deletedCount = 0;

      if (!dryRun) {
        // Delete expired documents in batches
        const deleteItems = expiredDocuments.map(doc => ({
          key: doc.key,
          options: { reason: 'TTL cleanup' }
        }));

        const bulkResult = await this.bulk('delete', deleteItems, {
          batchSize,
          continueOnError: true
        });

        deletedCount = bulkResult.successful;
      }

      const cleanupResult = {
        expired_count: expiredDocuments.length,
        deleted_count: deletedCount,
        dry_run: dryRun,
        completed_at: new Date().toISOString()
      };

      logger.info('Memory cleanup completed', cleanupResult);

      return cleanupResult;
    } catch (error) {
      logger.error('Memory cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if the service is healthy
   * @returns {Promise<boolean>} Health status
   */
  async isHealthy() {
    try {
      // Test basic memory operations
      const testKey = `health_check_${Date.now()}`;
      const testData = { test: true, timestamp: new Date().toISOString() };
      
      // Test store and retrieve
      await this.store(testKey, testData, { ttl: 60 });
      const retrieved = await this.retrieve(testKey);
      
      // Clean up test data
      await this.delete(testKey);
      
      return retrieved && retrieved.test === true;
    } catch (error) {
      logger.error('MemoryOperationsService health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get memory operations service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      ...this.stats,
      git_memory_stats: this.gitMemoryService.getStats(),
      semantic_memory_stats: this.semanticMemoryService.getStats()
    };
  }
}

module.exports = MemoryOperationsService;