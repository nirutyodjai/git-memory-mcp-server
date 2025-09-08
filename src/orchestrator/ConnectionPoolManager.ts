import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { AgentMetadata } from './AgentRegistry';

/**
 * Connection types supported by the pool
 */
export type ConnectionType = 'mcp' | 'http' | 'websocket' | 'grpc';

/**
 * Connection configuration
 */
export interface ConnectionConfig {
  type: ConnectionType;
  endpoint: string;
  timeout: number;
  retryAttempts: number;
  keepAlive: boolean;
  maxIdleTime: number;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: string;
  };
}

/**
 * Connection instance
 */
export interface Connection {
  id: string;
  agentId: string;
  type: ConnectionType;
  config: ConnectionConfig;
  instance: any; // The actual connection object
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  usageCount: number;
  health: {
    isHealthy: boolean;
    lastHealthCheck: Date;
    consecutiveFailures: number;
  };
}

/**
 * Pool configuration
 */
export interface PoolConfig {
  maxConnectionsPerAgent: number;
  maxTotalConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  healthCheckInterval: number;
  retryAttempts: number;
  warmupConnections: number;
  enableMetrics: boolean;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  unhealthyConnections: number;
  connectionsByType: Record<ConnectionType, number>;
  connectionsByAgent: Record<string, number>;
  poolUtilization: number;
  averageConnectionAge: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

/**
 * Connection Pool Manager for efficient agent connection management
 */
export class ConnectionPoolManager extends EventEmitter {
  private connections: Map<string, Connection> = new Map();
  private agentConnections: Map<string, Set<string>> = new Map();
  private connectionQueue: Map<string, Promise<Connection>> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private stats: PoolStats;

  constructor(private config: PoolConfig) {
    super();
    this.logger = new Logger('ConnectionPoolManager');
    this.stats = this.initializeStats();
    this.startHealthChecks();
    this.startCleanupProcess();
  }

  /**
   * Initialize pool statistics
   */
  private initializeStats(): PoolStats {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      unhealthyConnections: 0,
      connectionsByType: {
        mcp: 0,
        http: 0,
        websocket: 0,
        grpc: 0
      },
      connectionsByAgent: {},
      poolUtilization: 0,
      averageConnectionAge: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
  }

  /**
   * Get or create connection for agent
   */
  async getConnection(agent: AgentMetadata): Promise<Connection> {
    const agentId = agent.id;
    
    // Check if we already have a pending connection request
    const pendingConnection = this.connectionQueue.get(agentId);
    if (pendingConnection) {
      return pendingConnection;
    }

    // Try to get existing idle connection
    const existingConnection = this.getIdleConnection(agentId);
    if (existingConnection) {
      this.markConnectionActive(existingConnection);
      return existingConnection;
    }

    // Check pool limits
    if (!this.canCreateConnection(agentId)) {
      throw new Error(`Connection pool limit reached for agent ${agentId}`);
    }

    // Create new connection
    const connectionPromise = this.createConnection(agent);
    this.connectionQueue.set(agentId, connectionPromise);

    try {
      const connection = await connectionPromise;
      this.connectionQueue.delete(agentId);
      return connection;
    } catch (error) {
      this.connectionQueue.delete(agentId);
      throw error;
    }
  }

  /**
   * Get idle connection for agent
   */
  private getIdleConnection(agentId: string): Connection | null {
    const agentConnectionIds = this.agentConnections.get(agentId);
    if (!agentConnectionIds) {
      return null;
    }

    for (const connectionId of agentConnectionIds) {
      const connection = this.connections.get(connectionId);
      if (connection && !connection.isActive && connection.health.isHealthy) {
        return connection;
      }
    }

    return null;
  }

  /**
   * Check if we can create a new connection
   */
  private canCreateConnection(agentId: string): boolean {
    // Check total pool limit
    if (this.connections.size >= this.config.maxTotalConnections) {
      return false;
    }

    // Check per-agent limit
    const agentConnectionIds = this.agentConnections.get(agentId);
    const agentConnectionCount = agentConnectionIds ? agentConnectionIds.size : 0;
    
    return agentConnectionCount < this.config.maxConnectionsPerAgent;
  }

  /**
   * Create new connection for agent
   */
  private async createConnection(agent: AgentMetadata): Promise<Connection> {
    const connectionId = `${agent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info(`Creating connection ${connectionId} for agent ${agent.id}`);

    try {
      // Create connection based on agent configuration
      const connectionConfig = this.buildConnectionConfig(agent);
      const instance = await this.createConnectionInstance(connectionConfig);

      const connection: Connection = {
        id: connectionId,
        agentId: agent.id,
        type: connectionConfig.type,
        config: connectionConfig,
        instance,
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
        usageCount: 0,
        health: {
          isHealthy: true,
          lastHealthCheck: new Date(),
          consecutiveFailures: 0
        }
      };

      // Store connection
      this.connections.set(connectionId, connection);
      
      // Update agent connections mapping
      if (!this.agentConnections.has(agent.id)) {
        this.agentConnections.set(agent.id, new Set());
      }
      this.agentConnections.get(agent.id)!.add(connectionId);

      // Update statistics
      this.updateStats();

      this.logger.info(`Connection ${connectionId} created successfully`);
      this.emit('connection.created', connection);

      return connection;

    } catch (error) {
      this.logger.error(`Failed to create connection for agent ${agent.id}:`, error);
      throw error;
    }
  }

  /**
   * Build connection configuration from agent metadata
   */
  private buildConnectionConfig(agent: AgentMetadata): ConnectionConfig {
    // This would be based on agent configuration
    // For now, we'll use MCP as default
    return {
      type: 'mcp',
      endpoint: agent.connection.endpoint || 'http://localhost:3000',
      timeout: this.config.connectionTimeout,
      retryAttempts: this.config.retryAttempts,
      keepAlive: true,
      maxIdleTime: this.config.idleTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Orchestrator/1.0'
      }
    };
  }

  /**
   * Create actual connection instance
   */
  private async createConnectionInstance(config: ConnectionConfig): Promise<any> {
    switch (config.type) {
      case 'mcp':
        return this.createMCPConnection(config);
      case 'http':
        return this.createHTTPConnection(config);
      case 'websocket':
        return this.createWebSocketConnection(config);
      case 'grpc':
        return this.createGRPCConnection(config);
      default:
        throw new Error(`Unsupported connection type: ${config.type}`);
    }
  }

  private async createMCPConnection(config: ConnectionConfig): Promise<any> {
    // MCP connection implementation
    // This would integrate with existing MCP client code
    return {
      type: 'mcp',
      endpoint: config.endpoint,
      send: async (message: any) => {
        // MCP message sending implementation
        return { status: 'success', data: 'MCP response' };
      },
      close: () => {
        // MCP connection cleanup
      }
    };
  }

  private async createHTTPConnection(config: ConnectionConfig): Promise<any> {
    // HTTP connection implementation
    const axios = require('axios');
    return axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout,
      headers: config.headers
    });
  }

  private async createWebSocketConnection(config: ConnectionConfig): Promise<any> {
    // WebSocket connection implementation
    const WebSocket = require('ws');
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.endpoint);
      
      ws.on('open', () => {
        resolve(ws);
      });
      
      ws.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  private async createGRPCConnection(config: ConnectionConfig): Promise<any> {
    // gRPC connection implementation
    throw new Error('gRPC connections not yet implemented');
  }

  /**
   * Mark connection as active
   */
  private markConnectionActive(connection: Connection): void {
    connection.isActive = true;
    connection.lastUsed = new Date();
    connection.usageCount++;
    this.updateStats();
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.logger.warn(`Attempted to release unknown connection: ${connectionId}`);
      return;
    }

    connection.isActive = false;
    connection.lastUsed = new Date();
    this.updateStats();
    
    this.emit('connection.released', connection);
  }

  /**
   * Remove connection from pool
   */
  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    this.logger.info(`Removing connection ${connectionId}`);

    try {
      // Close the actual connection
      if (connection.instance && typeof connection.instance.close === 'function') {
        await connection.instance.close();
      }
    } catch (error) {
      this.logger.error(`Error closing connection ${connectionId}:`, error);
    }

    // Remove from maps
    this.connections.delete(connectionId);
    
    const agentConnections = this.agentConnections.get(connection.agentId);
    if (agentConnections) {
      agentConnections.delete(connectionId);
      if (agentConnections.size === 0) {
        this.agentConnections.delete(connection.agentId);
      }
    }

    this.updateStats();
    this.emit('connection.removed', connection);
  }

  /**
   * Start health check process
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all connections
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises: Promise<void>[] = [];

    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        healthCheckPromises.push(this.checkConnectionHealth(connection));
      }
    }

    await Promise.allSettled(healthCheckPromises);
    this.updateStats();
  }

  /**
   * Check health of individual connection
   */
  private async checkConnectionHealth(connection: Connection): Promise<void> {
    try {
      // Perform health check based on connection type
      const isHealthy = await this.performHealthCheck(connection);
      
      connection.health.isHealthy = isHealthy;
      connection.health.lastHealthCheck = new Date();
      
      if (isHealthy) {
        connection.health.consecutiveFailures = 0;
      } else {
        connection.health.consecutiveFailures++;
        
        // Remove connection if it fails too many times
        if (connection.health.consecutiveFailures >= 3) {
          await this.removeConnection(connection.id);
        }
      }
      
    } catch (error) {
      this.logger.error(`Health check failed for connection ${connection.id}:`, error);
      connection.health.isHealthy = false;
      connection.health.consecutiveFailures++;
    }
  }

  /**
   * Perform actual health check
   */
  private async performHealthCheck(connection: Connection): Promise<boolean> {
    switch (connection.type) {
      case 'mcp':
        return this.checkMCPHealth(connection);
      case 'http':
        return this.checkHTTPHealth(connection);
      case 'websocket':
        return this.checkWebSocketHealth(connection);
      case 'grpc':
        return this.checkGRPCHealth(connection);
      default:
        return false;
    }
  }

  private async checkMCPHealth(connection: Connection): Promise<boolean> {
    try {
      // MCP health check implementation
      // This would send a ping or capabilities request
      return true;
    } catch {
      return false;
    }
  }

  private async checkHTTPHealth(connection: Connection): Promise<boolean> {
    try {
      const response = await connection.instance.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async checkWebSocketHealth(connection: Connection): Promise<boolean> {
    try {
      return connection.instance.readyState === 1; // WebSocket.OPEN
    } catch {
      return false;
    }
  }

  private async checkGRPCHealth(connection: Connection): Promise<boolean> {
    // gRPC health check implementation
    return false;
  }

  /**
   * Start cleanup process for idle connections
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupIdleConnections();
    }, this.config.idleTimeout / 2); // Run cleanup at half the idle timeout
  }

  /**
   * Clean up idle connections
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        const idleTime = now - connection.lastUsed.getTime();
        if (idleTime > this.config.idleTimeout) {
          connectionsToRemove.push(connection.id);
        }
      }
    }

    // Remove idle connections
    for (const connectionId of connectionsToRemove) {
      await this.removeConnection(connectionId);
    }

    if (connectionsToRemove.length > 0) {
      this.logger.info(`Cleaned up ${connectionsToRemove.length} idle connections`);
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    if (!this.config.enableMetrics) {
      return;
    }

    const connections = Array.from(this.connections.values());
    
    this.stats.totalConnections = connections.length;
    this.stats.activeConnections = connections.filter(c => c.isActive).length;
    this.stats.idleConnections = connections.filter(c => !c.isActive).length;
    this.stats.unhealthyConnections = connections.filter(c => !c.health.isHealthy).length;
    
    // Reset type counters
    Object.keys(this.stats.connectionsByType).forEach(type => {
      this.stats.connectionsByType[type as ConnectionType] = 0;
    });
    
    // Count by type
    connections.forEach(connection => {
      this.stats.connectionsByType[connection.type]++;
    });
    
    // Count by agent
    this.stats.connectionsByAgent = {};
    connections.forEach(connection => {
      this.stats.connectionsByAgent[connection.agentId] = 
        (this.stats.connectionsByAgent[connection.agentId] || 0) + 1;
    });
    
    // Calculate utilization
    this.stats.poolUtilization = this.stats.totalConnections / this.config.maxTotalConnections;
    
    // Calculate average connection age
    if (connections.length > 0) {
      const totalAge = connections.reduce((sum, conn) => 
        sum + (Date.now() - conn.createdAt.getTime()), 0
      );
      this.stats.averageConnectionAge = totalAge / connections.length;
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get connections for specific agent
   */
  getAgentConnections(agentId: string): Connection[] {
    const connectionIds = this.agentConnections.get(agentId);
    if (!connectionIds) {
      return [];
    }

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter((conn): conn is Connection => conn !== undefined);
  }

  /**
   * Warm up connections for agents
   */
  async warmupConnections(agents: AgentMetadata[]): Promise<void> {
    const warmupPromises: Promise<void>[] = [];

    for (const agent of agents) {
      for (let i = 0; i < this.config.warmupConnections; i++) {
        warmupPromises.push(
          this.getConnection(agent)
            .then(connection => this.releaseConnection(connection.id))
            .catch(error => {
              this.logger.error(`Failed to warm up connection for agent ${agent.id}:`, error);
            })
        );
      }
    }

    await Promise.allSettled(warmupPromises);
    this.logger.info(`Warmed up connections for ${agents.length} agents`);
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up connection pool...');

    // Stop intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all connections
    const connectionIds = Array.from(this.connections.keys());
    await Promise.allSettled(
      connectionIds.map(id => this.removeConnection(id))
    );

    // Clear all maps
    this.connections.clear();
    this.agentConnections.clear();
    this.connectionQueue.clear();

    this.logger.info('Connection pool cleanup completed');
  }
}

export default ConnectionPoolManager;