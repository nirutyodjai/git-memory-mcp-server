/**
 * External MCP Service
 * รองรับการเชื่อมต่อกับ MCP servers ภายนอก
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const axios = require('axios');
const WebSocket = require('ws');
const logger = require('../utils/logger');

class ExternalMCPService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.type = 'external-mcp';
    this.id = config.id || `external-mcp-${crypto.randomUUID()}`;
    
    // Connection settings
    this.endpoint = config.endpoint || 'http://localhost:3000';
    this.protocol = config.protocol || 'http'; // http, websocket
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Authentication
    this.apiKey = config.apiKey || null;
    this.authHeader = config.authHeader || 'Authorization';
    this.authType = config.authType || 'Bearer'; // Bearer, Basic, ApiKey
    
    // Connection state
    this.isConnected = false;
    this.lastError = null;
    this.connectionCount = 0;
    this.websocket = null;
    
    // Request tracking
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.maxQueueSize = config.maxQueueSize || 1000;
    
    // Performance metrics
    this.requestCount = 0;
    this.errorCount = 0;
    this.averageResponseTime = 0;
    this.lastActivity = Date.now();
    
    // Available capabilities from external MCP server
    this.capabilities = new Set();
    this.tools = new Map();
    this.resources = new Map();
    
    logger.info(`ExternalMCPService initialized with endpoint: ${this.endpoint}`);
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      logger.info(`Initializing ExternalMCPService ${this.id}...`);
      
      // Test connection
      await this.connect();
      
      // Discover capabilities
      await this.discoverCapabilities();
      
      this.emit('initialized', { serviceId: this.id });
      
      logger.info(`ExternalMCPService ${this.id} initialized successfully`);
      return true;
      
    } catch (error) {
      this.lastError = error;
      logger.error(`Failed to initialize ExternalMCPService ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Connect to external MCP server
   */
  async connect() {
    const startTime = Date.now();
    
    try {
      if (this.protocol === 'websocket') {
        await this.connectWebSocket();
      } else {
        await this.testHttpConnection();
      }
      
      this.isConnected = true;
      this.connectionCount++;
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      logger.info(`Connected to external MCP server: ${this.endpoint}`);
      return true;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`Failed to connect to external MCP server:`, error);
      throw error;
    }
  }

  /**
   * Connect via WebSocket
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = this.endpoint.replace(/^http/, 'ws');
      
      this.websocket = new WebSocket(wsUrl, {
        headers: this.getAuthHeaders(),
        timeout: this.timeout
      });
      
      this.websocket.on('open', () => {
        logger.debug(`WebSocket connected to ${wsUrl}`);
        resolve();
      });
      
      this.websocket.on('message', (data) => {
        this.handleWebSocketMessage(data);
      });
      
      this.websocket.on('error', (error) => {
        logger.error(`WebSocket error:`, error);
        this.isConnected = false;
        reject(error);
      });
      
      this.websocket.on('close', () => {
        logger.info(`WebSocket connection closed`);
        this.isConnected = false;
        this.emit('disconnected');
      });
    });
  }

  /**
   * Test HTTP connection
   */
  async testHttpConnection() {
    const response = await axios.get(`${this.endpoint}/health`, {
      headers: this.getAuthHeaders(),
      timeout: this.timeout
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP connection test failed: ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': `ExternalMCPService/${this.id}`
    };
    
    if (this.apiKey) {
      switch (this.authType) {
        case 'Bearer':
          headers[this.authHeader] = `Bearer ${this.apiKey}`;
          break;
        case 'Basic':
          headers[this.authHeader] = `Basic ${Buffer.from(this.apiKey).toString('base64')}`;
          break;
        case 'ApiKey':
          headers[this.authHeader] = this.apiKey;
          break;
      }
    }
    
    return headers;
  }

  /**
   * Discover capabilities from external MCP server
   */
  async discoverCapabilities() {
    try {
      // Try to get server info
      const info = await this.makeRequest({
        method: 'server/info',
        params: {}
      });
      
      if (info && info.capabilities) {
        for (const capability of info.capabilities) {
          this.capabilities.add(capability);
        }
      }
      
      // Try to get available tools
      try {
        const toolsResponse = await this.makeRequest({
          method: 'tools/list',
          params: {}
        });
        
        if (toolsResponse && toolsResponse.tools) {
          for (const tool of toolsResponse.tools) {
            this.tools.set(tool.name, tool);
          }
        }
      } catch (error) {
        logger.debug(`Could not discover tools: ${error.message}`);
      }
      
      // Try to get available resources
      try {
        const resourcesResponse = await this.makeRequest({
          method: 'resources/list',
          params: {}
        });
        
        if (resourcesResponse && resourcesResponse.resources) {
          for (const resource of resourcesResponse.resources) {
            this.resources.set(resource.uri, resource);
          }
        }
      } catch (error) {
        logger.debug(`Could not discover resources: ${error.message}`);
      }
      
      logger.info(`Discovered ${this.capabilities.size} capabilities, ${this.tools.size} tools, ${this.resources.size} resources`);
      
    } catch (error) {
      logger.warn(`Could not discover capabilities from external MCP server:`, error);
    }
  }

  /**
   * Make request to external MCP server
   */
  async makeRequest(request, retryCount = 0) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    try {
      let response;
      
      if (this.protocol === 'websocket' && this.websocket && this.isConnected) {
        response = await this.makeWebSocketRequest(request, requestId);
      } else {
        response = await this.makeHttpRequest(request);
      }
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      this.lastActivity = Date.now();
      
      return response;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      // Retry logic
      if (retryCount < this.retryAttempts) {
        logger.warn(`Request failed, retrying (${retryCount + 1}/${this.retryAttempts}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.makeRequest(request, retryCount + 1);
      }
      
      logger.error(`Request failed after ${retryCount + 1} attempts:`, error);
      throw error;
    }
  }

  /**
   * Make HTTP request
   */
  async makeHttpRequest(request) {
    const response = await axios.post(this.endpoint, request, {
      headers: this.getAuthHeaders(),
      timeout: this.timeout
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.data;
  }

  /**
   * Make WebSocket request
   */
  async makeWebSocketRequest(request, requestId) {
    return new Promise((resolve, reject) => {
      // Store pending request
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, this.timeout);
      
      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      
      // Send request
      const message = {
        id: requestId,
        ...request
      };
      
      this.websocket.send(JSON.stringify(message));
    });
  }

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      const { id, error, result } = message;
      
      if (id && this.pendingRequests.has(id)) {
        const { resolve, reject, timeout } = this.pendingRequests.get(id);
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        
        if (error) {
          reject(new Error(error.message || 'Request failed'));
        } else {
          resolve(result);
        }
      } else {
        // Handle notifications or events
        this.emit('message', message);
      }
      
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle MCP request and forward to external server
   */
  async handleRequest(request) {
    const startTime = Date.now();
    
    try {
      // Validate request
      if (!request.method) {
        throw new Error('Request method is required');
      }
      
      // Forward to external MCP server
      const response = await this.makeRequest(request);
      
      logger.debug(`Forwarded request ${request.method} to external MCP server`);
      return response;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`Failed to handle request ${request.method}:`, error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      id: this.id,
      type: this.type,
      endpoint: this.endpoint,
      protocol: this.protocol,
      isConnected: this.isConnected,
      lastError: this.lastError?.message,
      connectionCount: this.connectionCount,
      capabilities: {
        total: this.capabilities.size,
        list: Array.from(this.capabilities)
      },
      tools: {
        total: this.tools.size,
        list: Array.from(this.tools.keys())
      },
      resources: {
        total: this.resources.size,
        list: Array.from(this.resources.keys())
      },
      queue: {
        size: this.requestQueue.length,
        maxSize: this.maxQueueSize,
        pendingRequests: this.pendingRequests.size
      },
      performance: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: Math.round(this.averageResponseTime) + 'ms',
        lastActivity: new Date(this.lastActivity).toISOString()
      },
      config: {
        timeout: this.timeout,
        retryAttempts: this.retryAttempts,
        retryDelay: this.retryDelay,
        authType: this.authType,
        hasApiKey: !!this.apiKey
      }
    };
  }

  /**
   * Check service health
   */
  async checkHealth() {
    try {
      if (!this.isConnected) {
        return {
          healthy: false,
          status: 'disconnected',
          lastCheck: new Date().toISOString()
        };
      }
      
      // Test connection with a simple request
      await this.makeRequest({
        method: 'ping',
        params: {}
      });
      
      return {
        healthy: true,
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Health check failed for ExternalMCPService ${this.id}:`, error);
      return {
        healthy: false,
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(responseTime, isError) {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }
    
    // Update average response time
    this.averageResponseTime = 
      (this.averageResponseTime * (this.requestCount - 1) + responseTime) / this.requestCount;
  }

  /**
   * Disconnect from external MCP server
   */
  async disconnect() {
    try {
      logger.info(`Disconnecting from external MCP server: ${this.endpoint}`);
      
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      
      // Clear pending requests
      for (const { reject, timeout } of this.pendingRequests.values()) {
        clearTimeout(timeout);
        reject(new Error('Connection closed'));
      }
      this.pendingRequests.clear();
      
      this.isConnected = false;
      this.emit('disconnected', { serviceId: this.id });
      
      logger.info(`Disconnected from external MCP server`);
      
    } catch (error) {
      logger.error(`Error during disconnect:`, error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info(`Cleaning up ExternalMCPService ${this.id}...`);
      
      await this.disconnect();
      
      // Clear capabilities and resources
      this.capabilities.clear();
      this.tools.clear();
      this.resources.clear();
      this.requestQueue.length = 0;
      
      this.emit('cleanup', { serviceId: this.id });
      
      logger.info(`ExternalMCPService ${this.id} cleanup completed`);
      
    } catch (error) {
      logger.error(`Error during ExternalMCPService cleanup:`, error);
      throw error;
    }
  }
}

module.exports = ExternalMCPService;