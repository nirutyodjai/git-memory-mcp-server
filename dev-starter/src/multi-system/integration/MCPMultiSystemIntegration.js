/**
 * MCP Multi-System Integration
 * จัดการการรวมระบบ MCP หลายระบบเข้าด้วยกัน
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const EventEmitter = require('events');
const logger = require('../../utils/logger');
const MCPMultiSystemManager = require('../services/MCPMultiSystemManager');
const MCPServerIntegration = require('./MCPServerIntegration');

class MCPMultiSystemIntegration extends EventEmitter {
  constructor(configPath = null) {
    super();
    
    this.configPath = configPath || path.join(__dirname, '../../config/mcp-systems-config.yaml');
    this.config = null;
    this.multiSystemManager = null;
    this.serverIntegration = null;
    
    // System registry
    this.registeredSystems = new Map();
    this.systemConfigs = new Map();
    
    // Integration state
    this.isInitialized = false;
    this.isRunning = false;
    
    // Performance monitoring
    this.integrationMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      systemSwitches: 0,
      startTime: Date.now()
    };
    
    // Event handlers
    this.setupEventHandlers();
    
    logger.info('MCP Multi-System Integration initialized');
  }

  /**
   * Initialize the multi-system integration
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('Multi-system integration already initialized');
        return;
      }
      
      logger.info('Initializing MCP Multi-System Integration');
      
      // Load configuration
      await this.loadConfiguration();
      
      // Initialize multi-system manager
      await this.initializeMultiSystemManager();
      
      // Initialize server integration
      await this.initializeServerIntegration();
      
      // Register configured systems
      await this.registerConfiguredSystems();
      
      // Start monitoring
      await this.startMonitoring();
      
      this.isInitialized = true;
      this.isRunning = true;
      
      logger.info('MCP Multi-System Integration initialized successfully', {
        registeredSystems: this.registeredSystems.size,
        configuredSystems: Object.keys(this.config.systems || {}).length
      });
      
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize multi-system integration', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Load configuration from YAML file
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    try {
      logger.info('Loading multi-system configuration', {
        configPath: this.configPath
      });
      
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      
      // Apply environment-specific overrides
      const environment = process.env.NODE_ENV || 'development';
      if (this.config.environments && this.config.environments[environment]) {
        this.config = this.mergeConfigs(this.config, this.config.environments[environment]);
      }
      
      // Validate configuration
      this.validateConfiguration();
      
      logger.info('Configuration loaded successfully', {
        environment,
        systemsCount: Object.keys(this.config.systems || {}).length,
        globalSettings: Object.keys(this.config.global || {}).length
      });
      
    } catch (error) {
      logger.error('Failed to load configuration', {
        configPath: this.configPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize multi-system manager
   * @returns {Promise<void>}
   */
  async initializeMultiSystemManager() {
    try {
      const managerConfig = {
        ...this.config.global,
        loadBalancing: this.config.loadBalancing,
        monitoring: this.config.monitoring,
        security: this.config.security,
        caching: this.config.caching
      };
      
      this.multiSystemManager = new MCPMultiSystemManager(managerConfig);
      
      // Set up event forwarding
      this.multiSystemManager.on('systemRegistered', (data) => {
        this.emit('systemRegistered', data);
      });
      
      this.multiSystemManager.on('systemUnregistered', (data) => {
        this.emit('systemUnregistered', data);
      });
      
      this.multiSystemManager.on('systemHealthChanged', (data) => {
        this.emit('systemHealthChanged', data);
      });
      
      // Start health monitoring
      this.multiSystemManager.startHealthMonitoring();
      
      logger.info('Multi-system manager initialized');
      
    } catch (error) {
      logger.error('Failed to initialize multi-system manager', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize server integration
   * @returns {Promise<void>}
   */
  async initializeServerIntegration() {
    try {
      this.serverIntegration = new MCPServerIntegration();
      await this.serverIntegration.initialize();
      
      // Override request processing to use multi-system routing
      const originalProcessRequest = this.serverIntegration.processRequest.bind(this.serverIntegration);
      
      this.serverIntegration.processRequest = async (request) => {
        return await this.processMultiSystemRequest(request, originalProcessRequest);
      };
      
      logger.info('Server integration initialized with multi-system support');
      
    } catch (error) {
      logger.error('Failed to initialize server integration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Register all configured systems
   * @returns {Promise<void>}
   */
  async registerConfiguredSystems() {
    try {
      const systems = this.config.systems || {};
      const registrationPromises = [];
      
      for (const [systemId, systemConfig] of Object.entries(systems)) {
        if (systemConfig.enabled !== false) {
          registrationPromises.push(
            this.registerSystem(systemId, systemConfig)
              .catch(error => {
                logger.error('Failed to register system', {
                  systemId,
                  error: error.message
                });
              })
          );
        }
      }
      
      await Promise.allSettled(registrationPromises);
      
      logger.info('System registration completed', {
        totalSystems: Object.keys(systems).length,
        registeredSystems: this.registeredSystems.size
      });
      
    } catch (error) {
      logger.error('Failed to register configured systems', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Register a single system
   * @param {string} systemId - System identifier
   * @param {Object} systemConfig - System configuration
   * @returns {Promise<void>}
   */
  async registerSystem(systemId, systemConfig) {
    try {
      // Store system configuration
      this.systemConfigs.set(systemId, systemConfig);
      
      // Register with multi-system manager
      await this.multiSystemManager.registerSystem(systemId, systemConfig);
      
      // Track registration
      this.registeredSystems.set(systemId, {
        config: systemConfig,
        registeredAt: Date.now(),
        status: 'registered'
      });
      
      logger.info('System registered successfully', {
        systemId,
        type: systemConfig.type,
        priority: systemConfig.priority
      });
      
    } catch (error) {
      logger.error('Failed to register system', {
        systemId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process request with multi-system routing
   * @param {Object} request - MCP request
   * @param {Function} fallbackProcessor - Fallback request processor
   * @returns {Promise<Object>} Response
   */
  async processMultiSystemRequest(request, fallbackProcessor) {
    const startTime = Date.now();
    
    try {
      this.integrationMetrics.totalRequests++;
      
      // Determine routing strategy
      const routingOptions = this.determineRoutingOptions(request);
      
      let result;
      
      if (routingOptions.useMultiSystem) {
        // Route through multi-system manager
        result = await this.multiSystemManager.routeRequest(request, routingOptions);
        
        if (routingOptions.systemSwitch) {
          this.integrationMetrics.systemSwitches++;
        }
      } else {
        // Use fallback processor
        result = await fallbackProcessor(request);
      }
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      this.integrationMetrics.successfulRequests++;
      
      return result;
      
    } catch (error) {
      // Update error metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      this.integrationMetrics.failedRequests++;
      
      logger.error('Multi-system request processing failed', {
        method: request.method,
        error: error.message,
        responseTime
      });
      
      throw error;
    }
  }

  /**
   * Determine routing options for request
   * @param {Object} request - MCP request
   * @returns {Object} Routing options
   */
  determineRoutingOptions(request) {
    const method = request.method || '';
    const routingRules = this.config.routing?.rules || [];
    
    // Check routing rules
    for (const rule of routingRules) {
      const pattern = new RegExp(rule.pattern, 'i');
      if (pattern.test(method)) {
        return {
          useMultiSystem: true,
          targetSystems: rule.targetSystems,
          strategy: rule.strategy,
          systemSwitch: true
        };
      }
    }
    
    // Use default routing
    const defaultRouting = this.config.routing?.default;
    if (defaultRouting) {
      return {
        useMultiSystem: true,
        targetSystems: defaultRouting.targetSystems,
        strategy: defaultRouting.strategy,
        systemSwitch: false
      };
    }
    
    // No multi-system routing
    return {
      useMultiSystem: false
    };
  }

  /**
   * Get integration status
   * @returns {Object} Status information
   */
  getIntegrationStatus() {
    const systemStatus = this.multiSystemManager ? 
      this.multiSystemManager.getSystemStatus() : 
      { totalSystems: 0, healthySystems: 0, systems: {} };
    
    return {
      integration: {
        initialized: this.isInitialized,
        running: this.isRunning,
        configPath: this.configPath,
        registeredSystems: this.registeredSystems.size
      },
      systems: systemStatus,
      metrics: {
        ...this.integrationMetrics,
        uptime: Date.now() - this.integrationMetrics.startTime,
        successRate: this.integrationMetrics.totalRequests > 0 ? 
          this.integrationMetrics.successfulRequests / this.integrationMetrics.totalRequests : 0
      },
      configuration: {
        environment: process.env.NODE_ENV || 'development',
        systemsConfigured: Object.keys(this.config?.systems || {}).length,
        routingRules: this.config?.routing?.rules?.length || 0
      }
    };
  }

  /**
   * Start monitoring
   * @returns {Promise<void>}
   */
  async startMonitoring() {
    if (!this.config.monitoring?.enabled) {
      return;
    }
    
    const interval = this.config.monitoring.metricsCollection?.interval || 10000;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);
    
    logger.info('Monitoring started', { interval });
  }

  /**
   * Collect metrics
   */
  collectMetrics() {
    try {
      const status = this.getIntegrationStatus();
      
      // Log metrics
      logger.debug('Integration metrics collected', {
        totalRequests: status.metrics.totalRequests,
        successRate: status.metrics.successRate,
        averageResponseTime: status.metrics.averageResponseTime,
        healthySystems: status.systems.healthySystems
      });
      
      // Emit metrics event
      this.emit('metricsCollected', status);
      
    } catch (error) {
      logger.error('Failed to collect metrics', {
        error: error.message
      });
    }
  }

  /**
   * Update performance metrics
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} isError - Whether the request resulted in an error
   */
  updateMetrics(responseTime, isError) {
    const currentAvg = this.integrationMetrics.averageResponseTime;
    const count = this.integrationMetrics.totalRequests;
    
    this.integrationMetrics.averageResponseTime = 
      (currentAvg * (count - 1) + responseTime) / count;
  }

  /**
   * Validate configuration
   */
  validateConfiguration() {
    if (!this.config) {
      throw new Error('Configuration is required');
    }
    
    if (!this.config.global) {
      throw new Error('Global configuration is required');
    }
    
    if (!this.config.systems || Object.keys(this.config.systems).length === 0) {
      throw new Error('At least one system must be configured');
    }
    
    // Validate each system configuration
    for (const [systemId, systemConfig] of Object.entries(this.config.systems)) {
      if (!systemConfig.type) {
        throw new Error(`System ${systemId} must have a type`);
      }
    }
  }

  /**
   * Merge configurations
   * @param {Object} base - Base configuration
   * @param {Object} override - Override configuration
   * @returns {Object} Merged configuration
   */
  mergeConfigs(base, override) {
    const result = { ...base };
    
    for (const [key, value] of Object.entries(override)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.mergeConfigs(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('systemRegistered', (data) => {
      logger.info('System registered in integration', data);
    });
    
    this.on('systemUnregistered', (data) => {
      logger.info('System unregistered from integration', data);
    });
    
    this.on('systemHealthChanged', (data) => {
      logger.info('System health changed in integration', data);
    });
  }

  /**
   * Reload configuration
   * @returns {Promise<void>}
   */
  async reloadConfiguration() {
    try {
      logger.info('Reloading configuration');
      
      await this.loadConfiguration();
      
      // Re-register systems if needed
      await this.registerConfiguredSystems();
      
      logger.info('Configuration reloaded successfully');
      
      this.emit('configurationReloaded');
      
    } catch (error) {
      logger.error('Failed to reload configuration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Shutdown integration
   * @returns {Promise<void>}
   */
  async shutdown() {
    try {
      logger.info('Shutting down MCP Multi-System Integration');
      
      this.isRunning = false;
      
      // Stop monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      
      // Shutdown multi-system manager
      if (this.multiSystemManager) {
        await this.multiSystemManager.shutdown();
      }
      
      // Shutdown server integration
      if (this.serverIntegration) {
        await this.serverIntegration.shutdown();
      }
      
      // Clear data
      this.registeredSystems.clear();
      this.systemConfigs.clear();
      
      this.isInitialized = false;
      
      logger.info('MCP Multi-System Integration shutdown complete');
      
      this.emit('shutdown');
      
    } catch (error) {
      logger.error('Error during integration shutdown', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = MCPMultiSystemIntegration;