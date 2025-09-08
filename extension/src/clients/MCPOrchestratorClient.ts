/**
 * MCP Orchestrator Client
 * 
 * Handles communication with the MCP Orchestrator service
 * for agent management, task routing, and telemetry.
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

/**
 * Agent information
 */
export interface AgentInfo {
  id: string;
  name: string;
  capabilities: string[];
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency: number;
  successRate: number;
  activeConnections: number;
  maxConnections: number;
  lastSeen: Date;
  metadata: Record<string, any>;
}

/**
 * Task information
 */
export interface TaskInfo {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentId?: string;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

/**
 * Orchestrator statistics
 */
export interface OrchestratorStats {
  totalAgents: number;
  healthyAgents: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageLatency: number;
  throughput: number;
  uptime: number;
}

/**
 * Client configuration
 */
export interface MCPOrchestratorConfig {
  serverPath: string;
  host?: string;
  port?: number;
  maxAgents?: number;
  maxConcurrentTasks?: number;
  connectionTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * MCP Orchestrator Client
 */
export class MCPOrchestratorClient extends EventEmitter {
  private config: Required<MCPOrchestratorConfig>;
  private serverProcess?: ChildProcess;
  private wsConnection?: WebSocket;
  private isConnected = false;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private agents = new Map<string, AgentInfo>();
  private tasks = new Map<string, TaskInfo>();
  private stats: OrchestratorStats = {
    totalAgents: 0,
    healthyAgents: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageLatency: 0,
    throughput: 0,
    uptime: 0
  };

  constructor(config: MCPOrchestratorConfig) {
    super();
    
    this.config = {
      serverPath: config.serverPath,
      host: config.host || 'localhost',
      port: config.port || 8080,
      maxAgents: config.maxAgents || 1500,
      maxConcurrentTasks: config.maxConcurrentTasks || 300,
      connectionTimeout: config.connectionTimeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000
    };
  }

  /**
   * Initialize the orchestrator client
   */
  async initialize(): Promise<void> {
    try {
      // Start the orchestrator server if not running
      await this.startServer();
      
      // Connect to the server
      await this.connect();
      
      // Setup heartbeat
      this.setupHeartbeat();
      
      console.log('MCP Orchestrator Client initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize MCP Orchestrator Client:', error);
      throw error;
    }
  }

  /**
   * Start the orchestrator server
   */
  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverScript = path.join(this.config.serverPath, 'orchestrator', 'server.js');
      
      // Check if server is already running
      this.checkServerHealth()
        .then(() => {
          console.log('Orchestrator server is already running');
          resolve();
        })
        .catch(() => {
          // Server not running, start it
          console.log('Starting MCP Orchestrator server...');
          
          this.serverProcess = spawn('node', [serverScript], {
            cwd: this.config.serverPath,
            env: {
              ...process.env,
              PORT: this.config.port.toString(),
              MAX_AGENTS: this.config.maxAgents.toString(),
              MAX_CONCURRENT_TASKS: this.config.maxConcurrentTasks.toString()
            },
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          this.serverProcess.stdout?.on('data', (data) => {
            console.log(`Orchestrator stdout: ${data}`);
          });
          
          this.serverProcess.stderr?.on('data', (data) => {
            console.error(`Orchestrator stderr: ${data}`);
          });
          
          this.serverProcess.on('error', (error) => {
            console.error('Orchestrator process error:', error);
            reject(error);
          });
          
          this.serverProcess.on('exit', (code, signal) => {
            console.log(`Orchestrator process exited with code ${code}, signal ${signal}`);
            this.serverProcess = undefined;
            this.isConnected = false;
            this.emit('disconnected');
          });
          
          // Wait for server to be ready
          setTimeout(async () => {
            try {
              await this.checkServerHealth();
              resolve();
            } catch (error) {
              reject(new Error('Server failed to start within timeout'));
            }
          }, 5000);
        });
    });
  }

  /**
   * Check server health
   */
  private async checkServerHealth(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://${this.config.host}:${this.config.port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
    });
  }

  /**
   * Connect to the orchestrator server
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.config.host}:${this.config.port}/ws`;
      
      this.wsConnection = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        this.wsConnection?.terminate();
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);
      
      this.wsConnection.on('open', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        console.log('Connected to MCP Orchestrator');
        this.emit('connected');
        resolve();
      });
      
      this.wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });
      
      this.wsConnection.on('close', () => {
        clearTimeout(timeout);
        this.isConnected = false;
        console.log('Disconnected from MCP Orchestrator');
        this.emit('disconnected');
        
        // Attempt to reconnect
        this.scheduleReconnect();
      });
      
      this.wsConnection.on('error', (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'agent_update':
        this.updateAgent(message.data);
        break;
        
      case 'task_update':
        this.updateTask(message.data);
        break;
        
      case 'stats_update':
        this.updateStats(message.data);
        break;
        
      case 'agents_list':
        this.updateAgentsList(message.data);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Update agent information
   */
  private updateAgent(agentData: AgentInfo): void {
    this.agents.set(agentData.id, agentData);
    this.emit('agent_updated', agentData);
    this.emit('agents_updated', Array.from(this.agents.values()));
  }

  /**
   * Update task information
   */
  private updateTask(taskData: TaskInfo): void {
    this.tasks.set(taskData.id, taskData);
    this.emit('task_updated', taskData);
    this.emit('tasks_updated', Array.from(this.tasks.values()));
  }

  /**
   * Update statistics
   */
  private updateStats(statsData: Partial<OrchestratorStats>): void {
    this.stats = { ...this.stats, ...statsData };
    this.emit('stats_updated', this.stats);
  }

  /**
   * Update agents list
   */
  private updateAgentsList(agentsList: AgentInfo[]): void {
    this.agents.clear();
    agentsList.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
    this.emit('agents_updated', agentsList);
  }

  /**
   * Setup heartbeat mechanism
   */
  private setupHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.wsConnection) {
        this.wsConnection.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        console.log('Attempting to reconnect to MCP Orchestrator...');
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, this.config.retryDelay);
  }

  /**
   * Send message to orchestrator
   */
  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.wsConnection) {
        reject(new Error('Not connected to orchestrator'));
        return;
      }
      
      const messageId = Date.now().toString();
      const messageWithId = { ...message, id: messageId };
      
      // Setup response handler
      const responseHandler = (response: any) => {
        if (response.id === messageId) {
          this.removeListener('message', responseHandler);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        }
      };
      
      this.on('message', responseHandler);
      
      // Send message
      this.wsConnection.send(JSON.stringify(messageWithId));
      
      // Timeout
      setTimeout(() => {
        this.removeListener('message', responseHandler);
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }

  /**
   * Get all agents
   */
  async getAgents(): Promise<AgentInfo[]> {
    if (this.agents.size === 0) {
      // Request fresh data
      await this.sendMessage({ type: 'get_agents' });
    }
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AgentInfo | undefined> {
    return this.agents.get(agentId);
  }

  /**
   * Refresh agents list
   */
  async refreshAgents(): Promise<void> {
    await this.sendMessage({ type: 'refresh_agents' });
  }

  /**
   * Submit a task
   */
  async submitTask(task: {
    type: string;
    payload: any;
    priority?: number;
    requiredCapabilities?: string[];
  }): Promise<string> {
    const response = await this.sendMessage({
      type: 'submit_task',
      data: task
    });
    return response.taskId;
  }

  /**
   * Get task status
   */
  async getTask(taskId: string): Promise<TaskInfo | undefined> {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  async getTasks(): Promise<TaskInfo[]> {
    return Array.from(this.tasks.values());
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<void> {
    await this.sendMessage({
      type: 'cancel_task',
      data: { taskId }
    });
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): OrchestratorStats {
    return { ...this.stats };
  }

  /**
   * Enable/disable an agent
   */
  async setAgentEnabled(agentId: string, enabled: boolean): Promise<void> {
    await this.sendMessage({
      type: 'set_agent_enabled',
      data: { agentId, enabled }
    });
  }

  /**
   * Update agent configuration
   */
  async updateAgentConfig(agentId: string, config: Record<string, any>): Promise<void> {
    await this.sendMessage({
      type: 'update_agent_config',
      data: { agentId, config }
    });
  }

  /**
   * Get connection status
   */
  isConnectedToOrchestrator(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from orchestrator
   */
  async disconnect(): Promise<void> {
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    
    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
    
    // Stop server process
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        if (!this.serverProcess) {
          resolve();
          return;
        }
        
        const timeout = setTimeout(() => {
          this.serverProcess?.kill('SIGKILL');
          resolve();
        }, 5000);
        
        this.serverProcess.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      this.serverProcess = undefined;
    }
    
    this.isConnected = false;
    console.log('Disconnected from MCP Orchestrator');
  }
}