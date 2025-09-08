import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { AgentRegistry, AgentMetadata, Task, TaskPriority } from './AgentRegistry';
import { TaskRouter, TaskResult, RoutingStrategy, TaskRouterConfig } from './TaskRouter';
import { ConnectionPoolManager, PoolConfig } from './ConnectionPoolManager';

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  registry: {
    maxAgents: number;
    healthCheckInterval: number;
    discoveryEnabled: boolean;
    discoveryInterval: number;
  };
  routing: TaskRouterConfig;
  connectionPool: PoolConfig;
  telemetry: {
    enabled: boolean;
    metricsInterval: number;
    retentionPeriod: number;
  };
}

/**
 * Orchestrator metrics
 */
export interface OrchestratorMetrics {
  uptime: number;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  tasksPerSecond: number;
  agentUtilization: Record<string, number>;
  routingEfficiency: number;
  poolUtilization: number;
  errorRate: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

/**
 * Task execution context
 */
export interface TaskContext {
  userId?: string;
  sessionId?: string;
  workspace?: string;
  metadata?: Record<string, any>;
  timeout?: number;
  priority?: TaskPriority;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
}

/**
 * Main MCP Orchestrator class that coordinates all components
 */
export class MCPOrchestrator extends EventEmitter {
  private agentRegistry: AgentRegistry;
  private taskRouter: TaskRouter;
  private connectionPool: ConnectionPoolManager;
  private logger: Logger;
  private startTime: Date;
  private metricsInterval: NodeJS.Timeout | null = null;
  private taskHistory: TaskResult[] = [];
  private latencyHistory: number[] = [];
  private isInitialized = false;

  constructor(private config: OrchestratorConfig) {
    super();
    this.logger = new Logger('MCPOrchestrator');
    this.startTime = new Date();
    
    // Initialize components
    this.agentRegistry = new AgentRegistry({
      maxAgents: config.registry.maxAgents,
      healthCheckInterval: config.registry.healthCheckInterval,
      discoveryEnabled: config.registry.discoveryEnabled,
      discoveryInterval: config.registry.discoveryInterval
    });
    
    this.connectionPool = new ConnectionPoolManager(config.connectionPool);
    
    this.taskRouter = new TaskRouter(
      this.agentRegistry,
      config.routing,
      config.routing.defaultStrategy
    );
    
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers between components
   */
  private setupEventHandlers(): void {
    // Agent Registry events
    this.agentRegistry.on('agent.registered', (agent: AgentMetadata) => {
      this.logger.info(`Agent registered: ${agent.id} with capabilities: ${agent.capabilities.join(', ')}`);
      this.emit('agent.registered', agent);
    });

    this.agentRegistry.on('agent.unregistered', (agentId: string) => {
      this.logger.info(`Agent unregistered: ${agentId}`);
      this.emit('agent.unregistered', agentId);
    });

    this.agentRegistry.on('agent.health.changed', (agentId: string, health: any) => {
      this.emit('agent.health.changed', { agentId, health });
    });

    // Task Router events
    this.taskRouter.on('task.submitted', (task: Task) => {
      this.emit('task.submitted', task);
    });

    this.taskRouter.on('task.started', (data: { task: Task; agentId: string }) => {
      this.emit('task.started', data);
    });

    this.taskRouter.on('task.completed', (result: TaskResult) => {
      this.handleTaskCompleted(result);
      this.emit('task.completed', result);
    });

    this.taskRouter.on('task.failed', (data: { task: Task; error: Error }) => {
      this.emit('task.failed', data);
    });

    this.taskRouter.on('circuit-breaker.opened', (data: { agentId: string }) => {
      this.logger.warn(`Circuit breaker opened for agent: ${data.agentId}`);
      this.emit('circuit-breaker.opened', data);
    });

    // Connection Pool events
    this.connectionPool.on('connection.created', (connection: any) => {
      this.emit('connection.created', connection);
    });

    this.connectionPool.on('connection.removed', (connection: any) => {
      this.emit('connection.removed', connection);
    });
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing MCP Orchestrator...');

    try {
      // Initialize agent registry
      await this.agentRegistry.initialize();
      
      // Start telemetry if enabled
      if (this.config.telemetry.enabled) {
        this.startTelemetry();
      }

      this.isInitialized = true;
      this.logger.info('MCP Orchestrator initialized successfully');
      this.emit('orchestrator.initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize orchestrator:', error);
      throw error;
    }
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: AgentMetadata): Promise<void> {
    await this.agentRegistry.registerAgent(agent);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    await this.agentRegistry.unregisterAgent(agentId);
  }

  /**
   * Execute a task
   */
  async executeTask(
    taskType: string,
    payload: any,
    requiredCapabilities: string[],
    context?: TaskContext
  ): Promise<TaskResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    const taskId = this.generateTaskId();
    const task: Task = {
      id: taskId,
      type: taskType,
      payload,
      requiredCapabilities,
      priority: context?.priority || 'medium',
      createdAt: new Date(),
      timeout: context?.timeout || this.config.routing.taskTimeout,
      context: context?.metadata || {},
      retryPolicy: context?.retryPolicy
    };

    this.logger.info(`Executing task ${taskId} of type ${taskType}`);

    try {
      // Submit task to router
      await this.taskRouter.submitTask(task);
      
      // Wait for task completion
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Task ${taskId} timed out after ${task.timeout}ms`));
        }, task.timeout);

        const onCompleted = (result: TaskResult) => {
          if (result.taskId === taskId) {
            clearTimeout(timeout);
            this.taskRouter.removeListener('task.completed', onCompleted);
            this.taskRouter.removeListener('task.failed', onFailed);
            resolve(result);
          }
        };

        const onFailed = (data: { task: Task; error: Error }) => {
          if (data.task.id === taskId) {
            clearTimeout(timeout);
            this.taskRouter.removeListener('task.completed', onCompleted);
            this.taskRouter.removeListener('task.failed', onFailed);
            reject(data.error);
          }
        };

        this.taskRouter.on('task.completed', onCompleted);
        this.taskRouter.on('task.failed', onFailed);
      });
      
    } catch (error) {
      this.logger.error(`Failed to execute task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeTasks(
    tasks: Array<{
      type: string;
      payload: any;
      requiredCapabilities: string[];
      context?: TaskContext;
    }>
  ): Promise<TaskResult[]> {
    const taskPromises = tasks.map(task => 
      this.executeTask(
        task.type,
        task.payload,
        task.requiredCapabilities,
        task.context
      )
    );

    return Promise.allSettled(taskPromises).then(results => 
      results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Create failed task result
          return {
            taskId: `failed-${index}`,
            agentId: 'unknown',
            success: false,
            error: result.reason,
            executionTime: 0,
            metadata: {
              startTime: new Date(),
              endTime: new Date(),
              retryCount: 0
            }
          };
        }
      })
    );
  }

  /**
   * Get available agents with optional capability filtering
   */
  getAvailableAgents(capabilities?: string[]): AgentMetadata[] {
    if (capabilities && capabilities.length > 0) {
      return this.agentRegistry.findAgentsByCapabilities(capabilities);
    }
    return this.agentRegistry.getAllAgents();
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentMetadata {
    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return agent;
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics(): OrchestratorMetrics {
    const uptime = Date.now() - this.startTime.getTime();
    const routerStats = this.taskRouter.getStats();
    const poolStats = this.connectionPool.getStats();
    const registryStats = this.agentRegistry.getStats();

    // Calculate task metrics
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter(t => t.success).length;
    const failedTasks = totalTasks - successfulTasks;
    
    const averageTaskDuration = totalTasks > 0 
      ? this.taskHistory.reduce((sum, t) => sum + t.executionTime, 0) / totalTasks
      : 0;
    
    const tasksPerSecond = totalTasks > 0 ? totalTasks / (uptime / 1000) : 0;
    const errorRate = totalTasks > 0 ? failedTasks / totalTasks : 0;

    // Calculate latency percentiles
    const sortedLatencies = [...this.latencyHistory].sort((a, b) => a - b);
    const p50Latency = this.calculatePercentile(sortedLatencies, 50);
    const p95Latency = this.calculatePercentile(sortedLatencies, 95);
    const p99Latency = this.calculatePercentile(sortedLatencies, 99);

    // Calculate agent utilization
    const agentUtilization: Record<string, number> = {};
    const agents = this.agentRegistry.getAllAgents();
    agents.forEach(agent => {
      const agentTasks = this.taskHistory.filter(t => t.agentId === agent.id);
      agentUtilization[agent.id] = agentTasks.length / Math.max(totalTasks, 1);
    });

    return {
      uptime,
      totalTasks,
      successfulTasks,
      failedTasks,
      averageTaskDuration,
      tasksPerSecond,
      agentUtilization,
      routingEfficiency: successfulTasks / Math.max(totalTasks, 1),
      poolUtilization: poolStats.poolUtilization,
      errorRate,
      p50Latency,
      p95Latency,
      p99Latency
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Handle task completion for metrics
   */
  private handleTaskCompleted(result: TaskResult): void {
    // Add to task history
    this.taskHistory.push(result);
    
    // Add to latency history
    this.latencyHistory.push(result.executionTime);
    
    // Limit history size to prevent memory leaks
    const maxHistorySize = 10000;
    if (this.taskHistory.length > maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(-maxHistorySize / 2);
    }
    if (this.latencyHistory.length > maxHistorySize) {
      this.latencyHistory = this.latencyHistory.slice(-maxHistorySize / 2);
    }

    // Update agent performance if adaptive routing is enabled
    if (this.config.routing.enableAdaptiveRouting) {
      this.updateAgentPerformance(result);
    }
  }

  /**
   * Update agent performance for adaptive routing
   */
  private updateAgentPerformance(result: TaskResult): void {
    const agent = this.agentRegistry.getAgent(result.agentId);
    if (!agent) return;

    const learningRate = this.config.routing.learningRate;
    const currentScore = agent.performance.successScore;
    
    // Update success score using exponential moving average
    const taskSuccess = result.success ? 1 : 0;
    const newScore = currentScore * (1 - learningRate) + taskSuccess * learningRate;
    
    // Update agent performance
    this.agentRegistry.updateAgentStats(
      result.agentId,
      result.success,
      result.executionTime
    );
  }

  /**
   * Start telemetry collection
   */
  private startTelemetry(): void {
    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics();
      this.emit('metrics.collected', metrics);
      
      // Log key metrics
      this.logger.info('Orchestrator Metrics:', {
        totalTasks: metrics.totalTasks,
        successRate: `${((metrics.successfulTasks / Math.max(metrics.totalTasks, 1)) * 100).toFixed(2)}%`,
        avgDuration: `${metrics.averageTaskDuration.toFixed(2)}ms`,
        tasksPerSecond: metrics.tasksPerSecond.toFixed(2),
        p95Latency: `${metrics.p95Latency.toFixed(2)}ms`
      });
      
    }, this.config.telemetry.metricsInterval);
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Warm up connections for registered agents
   */
  async warmupConnections(): Promise<void> {
    const agents = this.agentRegistry.getAllAgents();
    await this.connectionPool.warmupConnections(agents);
  }

  /**
   * Health check for the entire orchestrator
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    metrics: OrchestratorMetrics;
  }> {
    const components = {
      agentRegistry: this.agentRegistry.getAllAgents().length > 0,
      taskRouter: this.taskRouter.getStats().pendingTasks < 1000, // Arbitrary threshold
      connectionPool: this.connectionPool.getStats().poolUtilization < 0.9
    };

    const healthyComponents = Object.values(components).filter(Boolean).length;
    const totalComponents = Object.keys(components).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyComponents === totalComponents) {
      status = 'healthy';
    } else if (healthyComponents > totalComponents / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      components,
      metrics: this.getMetrics()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Orchestrator...');

    try {
      // Stop telemetry
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      // Cleanup components
      await Promise.allSettled([
        this.taskRouter.cleanup(),
        this.connectionPool.cleanup(),
        this.agentRegistry.cleanup()
      ]);

      this.isInitialized = false;
      this.logger.info('MCP Orchestrator shutdown completed');
      this.emit('orchestrator.shutdown');
      
    } catch (error) {
      this.logger.error('Error during orchestrator shutdown:', error);
      throw error;
    }
  }
}

// Remove the default export
// export default MCPOrchestrator;