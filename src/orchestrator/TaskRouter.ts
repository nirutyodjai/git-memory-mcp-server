import { EventEmitter } from 'events';
import { AgentRegistry, AgentMetadata, Task, TaskPriority } from './AgentRegistry';
import { Logger } from '../utils/logger';

/**
 * Task execution result
 */
export interface TaskResult {
  taskId: string;
  agentId: string;
  success: boolean;
  result?: any;
  error?: Error;
  executionTime: number;
  metadata: {
    startTime: Date;
    endTime: Date;
    retryCount: number;
  };
}

/**
 * Routing strategy for task assignment
 */
export type RoutingStrategy = 
  | 'round-robin'
  | 'least-loaded'
  | 'best-score'
  | 'latency-aware'
  | 'capability-match';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequestsPerSecond: number;
  burstSize: number;
  windowSize: number;
}

/**
 * Configuration for the TaskRouter
 */
export interface TaskRouterConfig {
  defaultStrategy: RoutingStrategy;
  enableAdaptiveRouting: boolean;
  learningRate: number;
  maxConcurrentTasks: number;
  taskTimeout: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreaker: CircuitBreakerConfig;
  rateLimit: RateLimitConfig;
  priorityQueues: boolean;
}

/**
 * Task Router for intelligent task distribution across agents
 */
export class TaskRouter extends EventEmitter {
  private pendingTasks: Map<string, Task> = new Map();
  private executingTasks: Map<string, { task: Task; agentId: string; startTime: Date }> = new Map();
  private taskQueue: Task[] = [];
  private agentLoadMap: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: Date }> = new Map();
  private logger: Logger;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private agentRegistry: AgentRegistry,
    private config: TaskRouterConfig,
    private defaultStrategy: RoutingStrategy = 'best-score'
  ) {
    super();
    this.logger = new Logger('TaskRouter');
    this.startTaskProcessing();
    this.defaultStrategy = this.config.defaultStrategy;
  }

  /**
   * Submit task for execution
   */
  async submitTask(task: Task, strategy?: RoutingStrategy): Promise<string> {
    // Validate task
    if (!task.id || !task.type || !task.requiredCapabilities.length) {
      throw new Error('Invalid task: missing required fields');
    }

    // Add to pending tasks
    this.pendingTasks.set(task.id, task);
    
    // Add to appropriate queue based on priority
    if (this.config.priorityQueues) {
      this.insertTaskByPriority(task);
    } else {
      this.taskQueue.push(task);
    }

    this.logger.info(`Task submitted: ${task.id} with capabilities: ${task.requiredCapabilities.join(', ')}`);
    this.emit('task.submitted', task);

    return task.id;
  }

  /**
   * Insert task into queue based on priority
   */
  private insertTaskByPriority(task: Task): void {
    const priorityOrder: { [key in TaskPriority]: number } = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const taskPriority = priorityOrder[task.priority];
    
    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      const queueTaskPriority = priorityOrder[this.taskQueue[i].priority];
      if (taskPriority < queueTaskPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.taskQueue.splice(insertIndex, 0, task);
  }

  /**
   * Start task processing loop
   */
  private startTaskProcessing(): void {
    this.processingInterval = setInterval(async () => {
      await this.processTaskQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Process tasks in queue
   */
  private async processTaskQueue(): Promise<void> {
    // Check if we're at max concurrency
    if (this.executingTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    // Get next task from queue
    const task = this.taskQueue.shift();
    if (!task) {
      return;
    }

    try {
      await this.executeTask(task);
    } catch (error) {
      this.logger.error(`Failed to execute task ${task.id}:`, error);
      this.emit('task.failed', { task, error });
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task, strategy?: RoutingStrategy): Promise<void> {
    const routingStrategy = strategy || this.defaultStrategy;
    
    // Find suitable agents
    const candidateAgents = this.agentRegistry.findAgentsByCapabilities(task.requiredCapabilities);
    
    if (candidateAgents.length === 0) {
      throw new Error(`No agents found with required capabilities: ${task.requiredCapabilities.join(', ')}`);
    }

    // Filter agents based on circuit breaker and rate limiting
    const availableAgents = candidateAgents.filter(agent => 
      this.isAgentAvailable(agent.id)
    );

    if (availableAgents.length === 0) {
      // Re-queue task for later
      this.taskQueue.unshift(task);
      return;
    }

    // Select best agent based on strategy
    const selectedAgent = this.selectAgent(availableAgents, routingStrategy, task);
    
    if (!selectedAgent) {
      throw new Error('No suitable agent available');
    }

    // Execute task on selected agent
    await this.executeTaskOnAgent(task, selectedAgent);
  }

  /**
   * Check if agent is available (not circuit broken, not rate limited)
   */
  private isAgentAvailable(agentId: string): boolean {
    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(agentId);
    if (circuitBreaker.isOpen) {
      if (Date.now() - circuitBreaker.lastFailure.getTime() > this.config.circuitBreaker.resetTimeout) {
        this.resetCircuitBreaker(agentId);
      } else {
        this.logger.warn(`Circuit breaker is open for agent ${agentId}`);
        return false;
      }
    }

    // Check rate limiting
    const rateLimiter = this.rateLimiters.get(agentId);
    if (rateLimiter) {
      if (Date.now() >= rateLimiter.resetTime.getTime()) {
        // Reset window
        this.rateLimiters.delete(agentId);
      } else if (rateLimiter.requests >= this.config.rateLimit.maxRequestsPerSecond) {
        this.logger.warn(`Rate limit exceeded for agent ${agentId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Select best agent based on routing strategy
   */
  private selectAgent(
    agents: AgentMetadata[], 
    strategy: RoutingStrategy, 
    task: Task
  ): AgentMetadata | null {
    if (agents.length === 0) return null;

    switch (strategy) {
      case 'round-robin':
        return this.selectRoundRobin(agents);
      
      case 'least-loaded':
        return this.selectLeastLoaded(agents);
      
      case 'best-score':
        return agents[0]; // Already sorted by score in AgentRegistry
      
      case 'latency-aware':
        return this.selectLatencyAware(agents);
      
      case 'capability-match':
        return this.selectBestCapabilityMatch(agents, task);
      
      default:
        return agents[0];
    }
  }

  private selectRoundRobin(agents: AgentMetadata[]): AgentMetadata {
    // Simple round-robin implementation
    const timestamp = Date.now();
    const index = timestamp % agents.length;
    return agents[index];
  }

  private selectLeastLoaded(agents: AgentMetadata[]): AgentMetadata {
    return agents.reduce((least, current) => {
      const leastLoad = this.agentLoadMap.get(least.id) || 0;
      const currentLoad = this.agentLoadMap.get(current.id) || 0;
      return currentLoad < leastLoad ? current : least;
    });
  }

  private selectLatencyAware(agents: AgentMetadata[]): AgentMetadata {
    return agents.reduce((fastest, current) => 
      current.health.latency < fastest.health.latency ? current : fastest
    );
  }

  private selectBestCapabilityMatch(agents: AgentMetadata[], task: Task): AgentMetadata {
    return agents.reduce((best, current) => {
      const bestMatch = this.calculateCapabilityMatch(best, task);
      const currentMatch = this.calculateCapabilityMatch(current, task);
      return currentMatch > bestMatch ? current : best;
    });
  }

  private calculateCapabilityMatch(agent: AgentMetadata, task: Task): number {
    const requiredCaps = new Set(task.requiredCapabilities);
    const agentCaps = new Set(agent.capabilities.map(c => c.name));
    
    // Calculate intersection
    const intersection = new Set([...requiredCaps].filter(x => agentCaps.has(x)));
    
    // Match score = (intersection size / required size) + bonus for extra capabilities
    const matchRatio = intersection.size / requiredCaps.size;
    const extraCapabilities = agentCaps.size - intersection.size;
    const bonusScore = Math.min(extraCapabilities * 0.1, 0.5); // Max 0.5 bonus
    
    return matchRatio + bonusScore;
  }

  /**
   * Execute task on specific agent
   */
  private async executeTaskOnAgent(task: Task, agent: AgentMetadata): Promise<void> {
    const startTime = new Date();
    
    // Update load tracking
    const currentLoad = this.agentLoadMap.get(agent.id) || 0;
    this.agentLoadMap.set(agent.id, currentLoad + 1);
    
    // Update rate limiter
    const rateLimiter = this.rateLimiters.get(agent.id) || {
      requests: 0,
      resetTime: new Date(Date.now() + 60000)
    };
    rateLimiter.requests++;
    this.rateLimiters.set(agent.id, rateLimiter);

    // Add to executing tasks
    this.executingTasks.set(task.id, { task, agentId: agent.id, startTime });
    
    this.logger.info(`Executing task ${task.id} on agent ${agent.id}`);
    this.emit('task.started', { task, agentId: agent.id });

    try {
      // Get agent connection
      const connection = await this.agentRegistry.getAgentConnection(agent.id);
      
      // Execute task with timeout
      const result = await Promise.race([
        this.performTaskExecution(connection, task),
        this.createTimeoutPromise(task.id)
      ]);

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Update agent statistics
      this.agentRegistry.updateAgentStats(agent.id, true, executionTime);

      // Create task result
      const taskResult: TaskResult = {
        taskId: task.id,
        agentId: agent.id,
        success: true,
        result,
        executionTime,
        metadata: {
          startTime,
          endTime,
          retryCount: 0
        }
      };

      this.completeTask(task.id, taskResult);
      
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Update agent statistics
      this.agentRegistry.updateAgentStats(agent.id, false, executionTime);
      
      // Update circuit breaker
      this.updateCircuitBreaker(agent.id, false);

      // Create error result
      const taskResult: TaskResult = {
        taskId: task.id,
        agentId: agent.id,
        success: false,
        error: error as Error,
        executionTime,
        metadata: {
          startTime,
          endTime,
          retryCount: 0
        }
      };

      this.completeTask(task.id, taskResult);
      
    } finally {
      // Update load tracking
      const newLoad = Math.max(0, (this.agentLoadMap.get(agent.id) || 1) - 1);
      this.agentLoadMap.set(agent.id, newLoad);
    }
  }

  /**
   * Perform actual task execution on agent
   */
  private async performTaskExecution(connection: any, task: Task): Promise<any> {
    // This is where the actual task execution happens
    // Implementation depends on the connection type and task type
    
    switch (connection.type) {
      case 'mcp':
        return this.executeMCPTask(connection, task);
      case 'http':
        return this.executeHTTPTask(connection, task);
      case 'websocket':
        return this.executeWebSocketTask(connection, task);
      default:
        throw new Error(`Unsupported connection type: ${connection.type}`);
    }
  }

  private async executeMCPTask(connection: any, task: Task): Promise<any> {
    // MCP task execution implementation
    // This will integrate with existing MCP protocol handling
    return { status: 'completed', data: 'MCP task result' };
  }

  private async executeHTTPTask(connection: any, task: Task): Promise<any> {
    // HTTP task execution implementation
    return { status: 'completed', data: 'HTTP task result' };
  }

  private async executeWebSocketTask(connection: any, task: Task): Promise<any> {
    // WebSocket task execution implementation
    return { status: 'completed', data: 'WebSocket task result' };
  }

  /**
   * Create timeout promise for task execution
   */
  private createTimeoutPromise(taskId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${this.config.taskTimeout}ms`));
      }, this.config.taskTimeout);
    });
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(agentId: string, success: boolean): void {
    const circuitBreaker = this.getCircuitBreaker(agentId);

    if (success) {
      if (circuitBreaker.failures > 0) {
        this.resetCircuitBreaker(agentId);
      }
    } else {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = new Date();
      
      if (circuitBreaker.failures >= this.config.circuitBreaker.failureThreshold) {
        circuitBreaker.isOpen = true;
        this.logger.warn(`Circuit breaker opened for agent ${agentId}`);
        this.emit('circuit-breaker.opened', { agentId });
      }
    }
  }

  /**
   * Get or create a circuit breaker for an agent
   */
  private getCircuitBreaker(agentId: string) {
    if (!this.circuitBreakers.has(agentId)) {
      this.circuitBreakers.set(agentId, {
        failures: 0,
        lastFailure: new Date(0),
        isOpen: false,
      });
    }
    return this.circuitBreakers.get(agentId)!;
  }

  /**
   * Reset the circuit breaker for an agent
   */
  private resetCircuitBreaker(agentId: string): void {
    const breaker = this.getCircuitBreaker(agentId);
    breaker.isOpen = false;
    breaker.failures = 0;
    this.logger.info(`Circuit breaker for agent ${agentId} has been reset.`);
    this.emit('circuit-breaker.reset', { agentId });
  }

  /**
   * Complete task execution
   */
  private completeTask(taskId: string, result: TaskResult): void {
    // Remove from executing and pending tasks
    this.executingTasks.delete(taskId);
    this.pendingTasks.delete(taskId);
    
    this.logger.info(`Task completed: ${taskId} (success: ${result.success})`);
    this.emit('task.completed', result);
  }

  /**
   * Get router statistics
   */
  getStats(): {
    pendingTasks: number;
    executingTasks: number;
    completedTasks: number;
    agentLoads: Record<string, number>;
    circuitBreakerStatus: Record<string, boolean>;
  } {
    const agentLoads: Record<string, number> = {};
    this.agentLoadMap.forEach((load, agentId) => {
      agentLoads[agentId] = load;
    });

    const circuitBreakerStatus: Record<string, boolean> = {};
    this.circuitBreakers.forEach((breaker, agentId) => {
      circuitBreakerStatus[agentId] = breaker.isOpen;
    });

    return {
      pendingTasks: this.pendingTasks.size,
      executingTasks: this.executingTasks.size,
      completedTasks: 0, // This would need to be tracked separately
      agentLoads,
      circuitBreakerStatus
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Cancel all executing tasks
    for (const [taskId, execution] of this.executingTasks) {
      this.logger.warn(`Cancelling executing task: ${taskId}`);
      // Implementation would depend on how to cancel tasks
    }
    
    this.pendingTasks.clear();
    this.executingTasks.clear();
    this.taskQueue.length = 0;
    this.agentLoadMap.clear();
    this.circuitBreakers.clear();
    this.rateLimiters.clear();
  }
}