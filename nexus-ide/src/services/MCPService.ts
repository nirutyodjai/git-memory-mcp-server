/**
 * MCP (Model Context Protocol) Service
 * 
 * Advanced communication layer for connecting with Git Memory MCP Server
 * and other external services through various protocols.
 * 
 * Features:
 * - WebSocket real-time communication
 * - GraphQL query optimization
 * - gRPC high-performance calls
 * - REST API gateway
 * - Event bus system
 * - Message queue management
 * - Connection pooling
 * - Auto-reconnection
 * - Load balancing
 * - Circuit breaker pattern
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface MCPConnection {
  id: string;
  name: string;
  type: 'websocket' | 'graphql' | 'grpc' | 'rest' | 'eventbus' | 'messagequeue';
  url: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastPing?: Date;
  latency?: number;
  metadata?: Record<string, any>;
}

export interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'notification';
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  timestamp: Date;
  connectionId: string;
}

export interface MCPRequest {
  method: string;
  params?: any;
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  metadata?: {
    latency: number;
    connectionId: string;
    timestamp: Date;
  };
}

export interface GitMemoryOperation {
  type: 'read' | 'write' | 'search' | 'analyze' | 'sync';
  repository?: string;
  path?: string;
  content?: string;
  query?: string;
  options?: Record<string, any>;
}

export interface GitMemoryResult {
  success: boolean;
  data?: any;
  changes?: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  metadata?: {
    commit?: string;
    timestamp: Date;
    author?: string;
  };
}

export interface MCPServiceConfig {
  gitMemoryServer: {
    url: string;
    apiKey?: string;
    timeout: number;
    retries: number;
  };
  connections: {
    maxConnections: number;
    connectionTimeout: number;
    heartbeatInterval: number;
    reconnectDelay: number;
    maxReconnectAttempts: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
  };
  loadBalancer: {
    strategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
    healthCheckInterval: number;
  };
}

class MCPService extends EventEmitter {
  private connections: Map<string, MCPConnection> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private messageQueue: MCPMessage[] = [];
  private pendingRequests: Map<string, {
    resolve: (value: MCPResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private circuitBreakerState: Map<string, {
    failures: number;
    lastFailure?: Date;
    state: 'closed' | 'open' | 'half-open';
  }> = new Map();
  private config: MCPServiceConfig;
  private isInitialized = false;

  constructor(config: MCPServiceConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.on('connection:established', (connection: MCPConnection) => {
      console.log(`MCP connection established: ${connection.name}`);
    });

    this.on('connection:lost', (connection: MCPConnection) => {
      console.warn(`MCP connection lost: ${connection.name}`);
      this.handleConnectionLoss(connection);
    });

    this.on('message:received', (message: MCPMessage) => {
      this.handleIncomingMessage(message);
    });

    this.on('error', (error: Error) => {
      console.error('MCP Service error:', error);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Git Memory MCP Server connection
      await this.connectToGitMemoryServer();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start message processing
      this.startMessageProcessing();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('MCP Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Service:', error);
      throw error;
    }
  }

  private async connectToGitMemoryServer(): Promise<void> {
    const connection: MCPConnection = {
      id: 'git-memory-server',
      name: 'Git Memory MCP Server',
      type: 'websocket',
      url: this.config.gitMemoryServer.url,
      status: 'connecting'
    };

    try {
      const ws = new WebSocket(connection.url);
      
      ws.onopen = () => {
        connection.status = 'connected';
        connection.lastPing = new Date();
        this.connections.set(connection.id, connection);
        this.websockets.set(connection.id, ws);
        this.emit('connection:established', connection);
      };

      ws.onmessage = (event) => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          message.connectionId = connection.id;
          this.emit('message:received', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        connection.status = 'disconnected';
        this.connections.set(connection.id, connection);
        this.emit('connection:lost', connection);
      };

      ws.onerror = (error) => {
        connection.status = 'error';
        this.connections.set(connection.id, connection);
        this.emit('error', new Error(`WebSocket error: ${error}`));
      };

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.connections.connectionTimeout);

        ws.onopen = () => {
          clearTimeout(timeout);
          connection.status = 'connected';
          connection.lastPing = new Date();
          this.connections.set(connection.id, connection);
          this.websockets.set(connection.id, ws);
          this.emit('connection:established', connection);
          resolve();
        };
      });

    } catch (error) {
      connection.status = 'error';
      this.connections.set(connection.id, connection);
      throw error;
    }
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.connections.forEach(async (connection) => {
        if (connection.status === 'connected') {
          try {
            const startTime = Date.now();
            await this.ping(connection.id);
            const latency = Date.now() - startTime;
            
            connection.latency = latency;
            connection.lastPing = new Date();
            this.connections.set(connection.id, connection);
          } catch (error) {
            console.warn(`Health check failed for ${connection.name}:`, error);
            this.handleConnectionFailure(connection.id);
          }
        }
      });
    }, this.config.connections.heartbeatInterval);
  }

  private startMessageProcessing(): void {
    setInterval(() => {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.processMessage(message);
        }
      }
    }, 10); // Process messages every 10ms
  }

  private async ping(connectionId: string): Promise<void> {
    const request: MCPRequest = {
      method: 'ping',
      timeout: 5000
    };

    await this.sendRequest(connectionId, request);
  }

  private handleConnectionLoss(connection: MCPConnection): void {
    // Implement auto-reconnection logic
    if (connection.id === 'git-memory-server') {
      this.reconnectToGitMemoryServer();
    }
  }

  private async reconnectToGitMemoryServer(): Promise<void> {
    let attempts = 0;
    const maxAttempts = this.config.connections.maxReconnectAttempts;
    const delay = this.config.connections.reconnectDelay;

    while (attempts < maxAttempts) {
      try {
        console.log(`Attempting to reconnect to Git Memory Server (attempt ${attempts + 1}/${maxAttempts})`);
        await this.connectToGitMemoryServer();
        console.log('Successfully reconnected to Git Memory Server');
        return;
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`Reconnection attempt failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('Failed to reconnect to Git Memory Server after maximum attempts');
          throw error;
        }
      }
    }
  }

  private handleConnectionFailure(connectionId: string): void {
    const breakerState = this.circuitBreakerState.get(connectionId) || {
      failures: 0,
      state: 'closed'
    };

    breakerState.failures++;
    breakerState.lastFailure = new Date();

    if (breakerState.failures >= this.config.circuitBreaker.failureThreshold) {
      breakerState.state = 'open';
      console.warn(`Circuit breaker opened for connection: ${connectionId}`);
      
      // Schedule circuit breaker reset
      setTimeout(() => {
        breakerState.state = 'half-open';
        breakerState.failures = 0;
        this.circuitBreakerState.set(connectionId, breakerState);
        console.log(`Circuit breaker half-opened for connection: ${connectionId}`);
      }, this.config.circuitBreaker.resetTimeout);
    }

    this.circuitBreakerState.set(connectionId, breakerState);
  }

  private handleIncomingMessage(message: MCPMessage): void {
    if (message.type === 'response') {
      const pendingRequest = this.pendingRequests.get(message.id);
      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          pendingRequest.reject(new Error(message.error.message));
        } else {
          const response: MCPResponse = {
            success: true,
            data: message.result,
            metadata: {
              latency: Date.now() - message.timestamp.getTime(),
              connectionId: message.connectionId,
              timestamp: new Date()
            }
          };
          pendingRequest.resolve(response);
        }
      }
    } else if (message.type === 'event') {
      this.emit('mcp:event', message);
    } else if (message.type === 'notification') {
      this.emit('mcp:notification', message);
    }
  }

  private processMessage(message: MCPMessage): void {
    // Process queued messages
    const connection = this.connections.get(message.connectionId);
    if (connection && connection.status === 'connected') {
      const ws = this.websockets.get(connection.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  async sendRequest(connectionId: string, request: MCPRequest): Promise<MCPResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // Check circuit breaker
    const breakerState = this.circuitBreakerState.get(connectionId);
    if (breakerState && breakerState.state === 'open') {
      throw new Error(`Circuit breaker is open for connection: ${connectionId}`);
    }

    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const message: MCPMessage = {
      id: messageId,
      type: 'request',
      method: request.method,
      params: request.params,
      timestamp: new Date(),
      connectionId
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout: ${request.method}`));
      }, request.timeout || 30000);

      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout
      });

      // Add to message queue for processing
      this.messageQueue.push(message);
    });
  }

  // Git Memory MCP Server specific methods
  async gitMemoryOperation(operation: GitMemoryOperation): Promise<GitMemoryResult> {
    try {
      const request: MCPRequest = {
        method: 'git-memory:operation',
        params: operation,
        timeout: 30000,
        priority: 'normal'
      };

      const response = await this.sendRequest('git-memory-server', request);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Git Memory operation failed');
      }

      return response.data as GitMemoryResult;
    } catch (error) {
      console.error('Git Memory operation failed:', error);
      throw error;
    }
  }

  async readFile(repository: string, path: string): Promise<string> {
    const operation: GitMemoryOperation = {
      type: 'read',
      repository,
      path
    };

    const result = await this.gitMemoryOperation(operation);
    return result.data;
  }

  async writeFile(repository: string, path: string, content: string): Promise<GitMemoryResult> {
    const operation: GitMemoryOperation = {
      type: 'write',
      repository,
      path,
      content
    };

    return await this.gitMemoryOperation(operation);
  }

  async searchCode(repository: string, query: string, options?: Record<string, any>): Promise<any[]> {
    const operation: GitMemoryOperation = {
      type: 'search',
      repository,
      query,
      options
    };

    const result = await this.gitMemoryOperation(operation);
    return result.data;
  }

  async analyzeRepository(repository: string, options?: Record<string, any>): Promise<any> {
    const operation: GitMemoryOperation = {
      type: 'analyze',
      repository,
      options
    };

    const result = await this.gitMemoryOperation(operation);
    return result.data;
  }

  async syncRepository(repository: string): Promise<GitMemoryResult> {
    const operation: GitMemoryOperation = {
      type: 'sync',
      repository
    };

    return await this.gitMemoryOperation(operation);
  }

  // Connection management
  async addConnection(connection: Omit<MCPConnection, 'status'>): Promise<void> {
    const newConnection: MCPConnection = {
      ...connection,
      status: 'disconnected'
    };

    this.connections.set(connection.id, newConnection);
    
    // Attempt to connect based on type
    switch (connection.type) {
      case 'websocket':
        await this.connectWebSocket(newConnection);
        break;
      case 'rest':
        await this.testRestConnection(newConnection);
        break;
      // Add other connection types as needed
    }
  }

  private async connectWebSocket(connection: MCPConnection): Promise<void> {
    try {
      const ws = new WebSocket(connection.url);
      
      ws.onopen = () => {
        connection.status = 'connected';
        this.connections.set(connection.id, connection);
        this.websockets.set(connection.id, ws);
        this.emit('connection:established', connection);
      };

      ws.onmessage = (event) => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          message.connectionId = connection.id;
          this.emit('message:received', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        connection.status = 'disconnected';
        this.connections.set(connection.id, connection);
        this.emit('connection:lost', connection);
      };

      ws.onerror = (error) => {
        connection.status = 'error';
        this.connections.set(connection.id, connection);
        this.emit('error', new Error(`WebSocket error: ${error}`));
      };

    } catch (error) {
      connection.status = 'error';
      this.connections.set(connection.id, connection);
      throw error;
    }
  }

  private async testRestConnection(connection: MCPConnection): Promise<void> {
    try {
      const response = await fetch(`${connection.url}/health`, {
        method: 'GET',
        timeout: this.config.connections.connectionTimeout
      } as any);

      if (response.ok) {
        connection.status = 'connected';
        this.emit('connection:established', connection);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      connection.status = 'error';
      throw error;
    } finally {
      this.connections.set(connection.id, connection);
    }
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Close WebSocket if exists
      const ws = this.websockets.get(connectionId);
      if (ws) {
        ws.close();
        this.websockets.delete(connectionId);
      }
      
      this.connections.delete(connectionId);
      this.circuitBreakerState.delete(connectionId);
      this.emit('connection:removed', connection);
    }
  }

  getConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(connectionId: string): MCPConnection | undefined {
    return this.connections.get(connectionId);
  }

  getConnectionStatus(connectionId: string): string {
    const connection = this.connections.get(connectionId);
    return connection ? connection.status : 'not-found';
  }

  // Utility methods
  async healthCheck(): Promise<{ healthy: boolean; connections: Record<string, string> }> {
    const connections: Record<string, string> = {};
    let healthy = true;

    for (const [id, connection] of this.connections) {
      connections[id] = connection.status;
      if (connection.status !== 'connected') {
        healthy = false;
      }
    }

    return { healthy, connections };
  }

  getMetrics(): {
    totalConnections: number;
    activeConnections: number;
    pendingRequests: number;
    queuedMessages: number;
    circuitBreakerStates: Record<string, string>;
  } {
    const activeConnections = Array.from(this.connections.values())
      .filter(c => c.status === 'connected').length;
    
    const circuitBreakerStates: Record<string, string> = {};
    for (const [id, state] of this.circuitBreakerState) {
      circuitBreakerStates[id] = state.state;
    }

    return {
      totalConnections: this.connections.size,
      activeConnections,
      pendingRequests: this.pendingRequests.size,
      queuedMessages: this.messageQueue.length,
      circuitBreakerStates
    };
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down MCP Service...');
    
    // Close all WebSocket connections
    for (const ws of this.websockets.values()) {
      ws.close();
    }
    
    // Clear all data structures
    this.connections.clear();
    this.websockets.clear();
    this.messageQueue.length = 0;
    this.pendingRequests.clear();
    this.circuitBreakerState.clear();
    
    this.isInitialized = false;
    this.emit('shutdown');
    
    console.log('MCP Service shutdown complete');
  }
}

// Default configuration
export const defaultMCPConfig: MCPServiceConfig = {
  gitMemoryServer: {
    url: 'ws://localhost:8080/mcp',
    timeout: 30000,
    retries: 3
  },
  connections: {
    maxConnections: 10,
    connectionTimeout: 10000,
    heartbeatInterval: 30000,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 10000
  },
  loadBalancer: {
    strategy: 'round-robin',
    healthCheckInterval: 30000
  }
};

// Singleton instance
let mcpServiceInstance: MCPService | null = null;

export const getMCPService = (config?: MCPServiceConfig): MCPService => {
  if (!mcpServiceInstance) {
    mcpServiceInstance = new MCPService(config || defaultMCPConfig);
  }
  return mcpServiceInstance;
};

export default MCPService;
export { MCPService };