/**
 * MCP Protocol Service
 * Handles Model Context Protocol communication and coordination
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');
const GitOperationsService = require('./GitOperationsService');
const MemoryOperationsService = require('./MemoryOperationsService');
const SemanticMemoryService = require('./SemanticMemoryService');

class MCPProtocolService extends EventEmitter {
  constructor() {
    super();
    this.gitOperationsService = new GitOperationsService();
    this.memoryOperationsService = new MemoryOperationsService();
    this.semanticMemoryService = new SemanticMemoryService();
    
    this.stats = {
      requests_processed: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
      last_request: null,
      uptime_start: new Date().toISOString(),
      protocol_version: '1.0.0'
    };
    
    this.requestTimes = [];
    this.maxRequestTimeHistory = 1000;
    
    // Initialize protocol handlers
    this.initializeProtocolHandlers();
  }

  /**
   * Initialize MCP Protocol request handlers
   */
  initializeProtocolHandlers() {
    this.handlers = {
      // Git Operations
      'git/status': this.handleGitStatus.bind(this),
      'git/log': this.handleGitLog.bind(this),
      'git/diff': this.handleGitDiff.bind(this),
      'git/clone': this.handleGitClone.bind(this),
      'git/commit': this.handleGitCommit.bind(this),
      'git/branch': this.handleGitBranch.bind(this),
      
      // Memory Operations
      'memory/store': this.handleMemoryStore.bind(this),
      'memory/retrieve': this.handleMemoryRetrieve.bind(this),
      'memory/list': this.handleMemoryList.bind(this),
      'memory/delete': this.handleMemoryDelete.bind(this),
      'memory/bulk': this.handleMemoryBulk.bind(this),
      'memory/cleanup': this.handleMemoryCleanup.bind(this),
      
      // Semantic Search Operations
      'semantic/search': this.handleSemanticSearch.bind(this),
      'semantic/index': this.handleSemanticIndex.bind(this),
      'semantic/rebuild': this.handleSemanticRebuild.bind(this),
      
      // Health and Status
      'health': this.handleHealth.bind(this),
      'stats': this.handleStats.bind(this),
      'ping': this.handlePing.bind(this)
    };
    
    logger.info('MCP Protocol handlers initialized', {
      handler_count: Object.keys(this.handlers).length
    });
  }

  /**
   * Process an MCP Protocol request
   * @param {Object} request - MCP request object
   * @returns {Promise<Object>} MCP response object
   */
  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      this.stats.requests_processed++;
      this.stats.last_request = new Date().toISOString();
      
      // Validate request structure
      const validationResult = this.validateRequest(request);
      if (!validationResult.valid) {
        throw new Error(`Invalid request: ${validationResult.error}`);
      }
      
      const { method, params = {}, id } = request;
      
      // Check if handler exists
      const handler = this.handlers[method];
      if (!handler) {
        throw new Error(`Unsupported method: ${method}`);
      }
      
      logger.debug('Processing MCP request', {
        method,
        id,
        params_keys: Object.keys(params)
      });
      
      // Execute handler
      const result = await handler(params, { requestId: id, method });
      
      // Track successful request
      this.stats.successful_requests++;
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);
      
      // Emit success event
      this.emit('request_success', {
        method,
        id,
        response_time: responseTime,
        result
      });
      
      // Return MCP response
      return this.createMCPResponse(id, result, responseTime);
      
    } catch (error) {
      this.stats.failed_requests++;
      const responseTime = Date.now() - startTime;
      
      logger.error('MCP request failed', {
        method: request.method,
        id: request.id,
        error: error.message,
        response_time: responseTime,
        stack: error.stack
      });
      
      // Emit error event
      this.emit('request_error', {
        method: request.method,
        id: request.id,
        error: error.message,
        response_time: responseTime
      });
      
      // Return MCP error response
      return this.createMCPErrorResponse(request.id, error, responseTime);
    }
  }

  /**
   * Validate MCP request structure
   * @param {Object} request - Request to validate
   * @returns {Object} Validation result
   */
  validateRequest(request) {
    if (!request || typeof request !== 'object') {
      return { valid: false, error: 'Request must be an object' };
    }
    
    if (!request.method || typeof request.method !== 'string') {
      return { valid: false, error: 'Method is required and must be a string' };
    }
    
    if (request.params && typeof request.params !== 'object') {
      return { valid: false, error: 'Params must be an object if provided' };
    }
    
    return { valid: true };
  }

  /**
   * Create MCP success response
   * @param {string} id - Request ID
   * @param {*} result - Result data
   * @param {number} responseTime - Response time in ms
   * @returns {Object} MCP response
   */
  createMCPResponse(id, result, responseTime) {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        success: true,
        data: result,
        metadata: {
          response_time_ms: responseTime,
          timestamp: new Date().toISOString(),
          protocol_version: this.stats.protocol_version
        }
      }
    };
  }

  /**
   * Create MCP error response
   * @param {string} id - Request ID
   * @param {Error} error - Error object
   * @param {number} responseTime - Response time in ms
   * @returns {Object} MCP error response
   */
  createMCPErrorResponse(id, error, responseTime) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: this.getErrorCode(error),
        message: error.message,
        data: {
          response_time_ms: responseTime,
          timestamp: new Date().toISOString(),
          protocol_version: this.stats.protocol_version
        }
      }
    };
  }

  /**
   * Get error code based on error type
   * @param {Error} error - Error object
   * @returns {number} Error code
   */
  getErrorCode(error) {
    if (error.message.includes('Invalid request')) return -32600;
    if (error.message.includes('Unsupported method')) return -32601;
    if (error.message.includes('Invalid params')) return -32602;
    return -32603; // Internal error
  }

  /**
   * Update response time statistics
   * @param {number} responseTime - Response time in ms
   */
  updateResponseTimeStats(responseTime) {
    this.requestTimes.push(responseTime);
    
    // Keep only recent request times
    if (this.requestTimes.length > this.maxRequestTimeHistory) {
      this.requestTimes = this.requestTimes.slice(-this.maxRequestTimeHistory);
    }
    
    // Calculate average response time
    const sum = this.requestTimes.reduce((a, b) => a + b, 0);
    this.stats.average_response_time = Math.round(sum / this.requestTimes.length);
  }

  // Git Operation Handlers
  async handleGitStatus(params, context) {
    const { repository_path } = params;
    return await this.gitOperationsService.getStatus(repository_path);
  }

  async handleGitLog(params, context) {
    const { repository_path, limit, since, author } = params;
    return await this.gitOperationsService.getLog(repository_path, {
      limit,
      since,
      author
    });
  }

  async handleGitDiff(params, context) {
    const { repository_path, commit1, commit2, file_path } = params;
    return await this.gitOperationsService.getDiff(repository_path, {
      commit1,
      commit2,
      filePath: file_path
    });
  }

  async handleGitClone(params, context) {
    const { repository_url, destination_path, branch, depth } = params;
    return await this.gitOperationsService.cloneRepository(repository_url, {
      destinationPath: destination_path,
      branch,
      depth
    });
  }

  async handleGitCommit(params, context) {
    const { repository_path, message, files, author } = params;
    return await this.gitOperationsService.createCommit(repository_path, {
      message,
      files,
      author
    });
  }

  async handleGitBranch(params, context) {
    const { repository_path, action, branch_name, source_branch } = params;
    return await this.gitOperationsService.manageBranch(repository_path, {
      action,
      branchName: branch_name,
      sourceBranch: source_branch
    });
  }

  // Memory Operation Handlers
  async handleMemoryStore(params, context) {
    const { key, data, metadata, tags, ttl, enable_semantic_index } = params;
    return await this.memoryOperationsService.store(key, data, {
      metadata,
      tags,
      ttl,
      enableSemanticIndex: enable_semantic_index
    });
  }

  async handleMemoryRetrieve(params, context) {
    const { key, include_metadata, check_ttl, version } = params;
    return await this.memoryOperationsService.retrieve(key, {
      includeMetadata: include_metadata,
      checkTTL: check_ttl,
      version
    });
  }

  async handleMemoryList(params, context) {
    const {
      limit,
      offset,
      tags,
      pattern,
      sort_by,
      sort_order,
      include_metadata,
      check_ttl
    } = params;
    
    return await this.memoryOperationsService.list({
      limit,
      offset,
      tags,
      pattern,
      sortBy: sort_by,
      sortOrder: sort_order,
      includeMetadata: include_metadata,
      checkTTL: check_ttl
    });
  }

  async handleMemoryDelete(params, context) {
    const { key, reason } = params;
    return await this.memoryOperationsService.delete(key, { reason });
  }

  async handleMemoryBulk(params, context) {
    const { operation, items, batch_size, continue_on_error } = params;
    return await this.memoryOperationsService.bulk(operation, items, {
      batchSize: batch_size,
      continueOnError: continue_on_error
    });
  }

  async handleMemoryCleanup(params, context) {
    const { dry_run, batch_size } = params;
    return await this.memoryOperationsService.cleanup({
      dryRun: dry_run,
      batchSize: batch_size
    });
  }

  // Semantic Search Operation Handlers
  async handleSemanticSearch(params, context) {
    const { query, limit, threshold, include_metadata, tags } = params;
    return await this.semanticMemoryService.search(query, {
      limit,
      threshold,
      includeMetadata: include_metadata,
      tags
    });
  }

  async handleSemanticIndex(params, context) {
    const { key, document } = params;
    return await this.semanticMemoryService.addToIndex(key, document);
  }

  async handleSemanticRebuild(params, context) {
    const { force_rebuild, batch_size } = params;
    return await this.semanticMemoryService.rebuildIndex({
      forceRebuild: force_rebuild,
      batchSize: batch_size
    });
  }

  // Health and Status Handlers
  async handleHealth(params, context) {
    const gitStats = this.gitOperationsService.getStats();
    const memoryStats = this.memoryOperationsService.getStats();
    const semanticStats = this.semanticMemoryService.getStats();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - new Date(this.stats.uptime_start)) / 1000),
      services: {
        git_operations: {
          status: 'healthy',
          operations_count: gitStats.operations_count,
          errors: gitStats.errors
        },
        memory_operations: {
          status: 'healthy',
          operations_count: memoryStats.operations_count,
          errors: memoryStats.errors
        },
        semantic_memory: {
          status: 'healthy',
          indexed_documents: semanticStats.indexed_documents,
          vocabulary_size: semanticStats.vocabulary_size
        }
      },
      protocol: {
        version: this.stats.protocol_version,
        supported_methods: Object.keys(this.handlers)
      }
    };
  }

  async handleStats(params, context) {
    const gitStats = this.gitOperationsService.getStats();
    const memoryStats = this.memoryOperationsService.getStats();
    const semanticStats = this.semanticMemoryService.getStats();
    
    return {
      protocol_stats: this.stats,
      service_stats: {
        git_operations: gitStats,
        memory_operations: memoryStats,
        semantic_memory: semanticStats
      },
      system_info: {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
      },
      generated_at: new Date().toISOString()
    };
  }

  async handlePing(params, context) {
    return {
      pong: true,
      timestamp: new Date().toISOString(),
      server_time: Date.now()
    };
  }

  /**
   * Get list of supported MCP methods
   * @returns {Array<string>} Supported methods
   */
  getSupportedMethods() {
    return Object.keys(this.handlers);
  }

  /**
   * Get MCP Protocol service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      ...this.stats,
      supported_methods: this.getSupportedMethods(),
      recent_response_times: this.requestTimes.slice(-10),
      success_rate: this.stats.requests_processed > 0 ? 
        (this.stats.successful_requests / this.stats.requests_processed * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requests_processed: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
      last_request: null,
      uptime_start: new Date().toISOString(),
      protocol_version: '1.0.0'
    };
    this.requestTimes = [];
    
    logger.info('MCP Protocol statistics reset');
  }
}

module.exports = MCPProtocolService;