import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

/**
 * Agent capability definition
 */
export interface AgentCapability {
  name: string;
  version: string;
}

/**
 * Agent health status
 */
export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  latency: number; // ms
  successRate: number; // 0-1
}

/**
 * Agent statistics
 */
export interface AgentStats {
  totalRequests: number;
  successfulRequests: number;
  averageLatency: number;
  lastUsed: Date;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformance {
  successScore: number;
  averageLatency: number;
}

/**
 * Agent metadata for registry management
 */
export interface AgentMetadata {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  priority: number;
  health: AgentHealth;
  connection: {
    endpoint: string;
    protocol: 'mcp' | 'http' | 'websocket';
    poolSize: number;
    activeConnections: number;
  };
  stats: AgentStats;
  config: {
    maxConcurrency: number;
    timeout: number;
    retryAttempts: number;
    cacheTTL: number;
  };
  performance: AgentPerformance;
}

/**
 * Task priority levels
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Task definition for routing
 */
export interface Task {
  id: string;
  type: string;
  payload: any;
  timeout: number;
  context: Record<string, any>;
  requiredCapabilities: string[];
  priority: TaskPriority;
  deadline?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
}

/**
 * Configuration for the AgentRegistry
 */
export interface AgentRegistryConfig {
  maxAgents: number;
  healthCheckInterval: number;
  discoveryEnabled: boolean;
  discoveryInterval: number;
}

/**
 * Agent Registry for managing 1500+ MCP agents with lazy loading
 */
export class AgentRegistry extends EventEmitter {
  private agents: Map<string, AgentMetadata> = new Map();
  private activeConnections: Map<string, any> = new Map();
  private capabilityIndex: Map<string, Set<string>> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private logger: Logger;

  constructor(private config: AgentRegistryConfig) {
    super();
    this.logger = new Logger('AgentRegistry');
    this.startHealthChecking();
  }

  /**
   * Initialize the agent registry
   */
  async initialize(): Promise<void> {
    this.logger.info('Agent Registry initialized');
  }

  /**
   * Register agent with metadata-first approach (no immediate connection)
   */
  async registerAgent(metadata: Omit<AgentMetadata, 'stats' | 'performance'>): Promise<void> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Registry full. Max size: ${this.config.maxAgents}`);
    }

    const agentWithStats: AgentMetadata = {
      ...metadata,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        averageLatency: 0,
        lastUsed: new Date()
      },
      performance: {
        successScore: 0.5, // Initial score
        averageLatency: 0
      }
    };

    this.agents.set(metadata.id, agentWithStats);
    
    // Index capabilities for fast lookup
    metadata.capabilities.forEach(cap => {
      if (!this.capabilityIndex.has(cap.name)) {
        this.capabilityIndex.set(cap.name, new Set());
      }
      this.capabilityIndex.get(cap.name)!.add(metadata.id);
    });

    this.logger.info(`Agent registered: ${metadata.id} with capabilities: ${metadata.capabilities.map(c => c.name).join(', ')}`);
    this.emit('agent.registered', metadata);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.capabilities.forEach(cap => {
        const agentsWithCap = this.capabilityIndex.get(cap.name);
        if (agentsWithCap) {
          agentsWithCap.delete(agentId);
        }
      });
      this.agents.delete(agentId);
      this.activeConnections.delete(agentId);
      this.logger.info(`Agent unregistered: ${agentId}`);
      this.emit('agent.unregistered', agentId);
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by capabilities with scoring
   */
  findAgentsByCapabilities(requiredCapabilities: string[]): AgentMetadata[] {
    const candidateIds = new Set<string>();
    
    // Find agents that have at least one required capability
    requiredCapabilities.forEach(cap => {
      const agentsWithCap = this.capabilityIndex.get(cap);
      if (agentsWithCap) {
        agentsWithCap.forEach(id => candidateIds.add(id));
      }
    });

    // Score and filter agents
    const candidates = Array.from(candidateIds)
      .map(id => this.agents.get(id)!)
      .filter(agent => {
        // Check if agent has ALL required capabilities
        return requiredCapabilities.every(cap => 
          agent.capabilities.some(agentCap => agentCap.name === cap)
        );
      })
      .map(agent => ({
        ...agent,
        score: this.calculateAgentScore(agent, requiredCapabilities)
      }))
      .sort((a, b) => b.score - a.score);

    return candidates;
  }

  /**
   * Calculate agent score based on health, latency, and success rate
   */
  private calculateAgentScore(agent: AgentMetadata, requiredCapabilities: string[]): number {
    let score = 0;
    
    // Health score (0-40 points)
    switch (agent.health.status) {
      case 'healthy': score += 40; break;
      case 'degraded': score += 20; break;
      case 'unhealthy': score += 5; break;
      default: score += 0;
    }
    
    // Latency score (0-30 points) - lower latency = higher score
    const latencyScore = Math.max(0, 30 - (agent.health.latency / 100));
    score += latencyScore;
    
    // Success rate score (0-20 points)
    score += agent.health.successRate * 20;
    
    // Load balancing score (0-10 points) - prefer less loaded agents
    const loadRatio = agent.connection.activeConnections / agent.connection.poolSize;
    score += Math.max(0, 10 - (loadRatio * 10));
    
    return score;
  }

  /**
   * Get or create connection to agent (lazy loading)
   */
  async getAgentConnection(agentId: string): Promise<any> {
    if (this.activeConnections.has(agentId)) {
      return this.activeConnections.get(agentId);
    }

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.connection.activeConnections >= agent.connection.poolSize) {
      throw new Error(`Connection pool exhausted for agent: ${agentId}`);
    }

    // Create connection based on protocol
    const connection = await this.createConnection(agent);
    this.activeConnections.set(agentId, connection);
    
    // Update connection count
    agent.connection.activeConnections++;
    
    this.logger.info(`Connection created for agent: ${agentId}`);
    this.emit('connection.created', { agentId, connection });
    
    return connection;
  }

  /**
   * Create connection based on agent protocol
   */
  private async createConnection(agent: AgentMetadata): Promise<any> {
    switch (agent.connection.protocol) {
      case 'mcp':
        // MCP protocol connection
        return this.createMCPConnection(agent);
      case 'http':
        // HTTP client connection
        return this.createHTTPConnection(agent);
      case 'websocket':
        // WebSocket connection
        return this.createWebSocketConnection(agent);
      default:
        throw new Error(`Unsupported protocol: ${agent.connection.protocol}`);
    }
  }

  private async createMCPConnection(agent: AgentMetadata): Promise<any> {
    // Implementation for MCP connection
    // This will integrate with existing MCPProtocolService
    return {
      type: 'mcp',
      endpoint: agent.connection.endpoint,
      agent: agent
    };
  }

  private async createHTTPConnection(agent: AgentMetadata): Promise<any> {
    // Implementation for HTTP connection
    return {
      type: 'http',
      endpoint: agent.connection.endpoint,
      agent: agent
    };
  }

  private async createWebSocketConnection(agent: AgentMetadata): Promise<any> {
    // Implementation for WebSocket connection
    return {
      type: 'websocket',
      endpoint: agent.connection.endpoint,
      agent: agent
    };
  }

  /**
   * Update agent statistics after task completion
   */
  updateAgentStats(agentId: string, success: boolean, latency: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.stats.totalRequests++;
    if (success) {
      agent.stats.successfulRequests++;
    }
    
    // Update rolling average latency
    agent.stats.averageLatency = 
      (agent.stats.averageLatency * (agent.stats.totalRequests - 1) + latency) / 
      agent.stats.totalRequests;
    
    agent.stats.lastUsed = new Date();
    
    // Update health metrics
    agent.health.successRate = agent.stats.successfulRequests / agent.stats.totalRequests;
    agent.health.latency = agent.stats.averageLatency;
    agent.health.lastCheck = new Date();
    
    this.emit('agent.stats.updated', { agentId, stats: agent.stats });
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.agents.values())
      .filter(agent => {
        // Only check agents that haven't been checked recently
        const timeSinceLastCheck = Date.now() - agent.health.lastCheck.getTime();
        return timeSinceLastCheck > this.config.healthCheckInterval / 2;
      })
      .map(agent => this.checkAgentHealth(agent));

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check individual agent health
   */
  private async checkAgentHealth(agent: AgentMetadata): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Perform health check based on protocol
      // This is a simplified implementation
      const isHealthy = await this.pingAgent(agent);
      
      const latency = Date.now() - startTime;
      
      agent.health.status = isHealthy ? 'healthy' : 'unhealthy';
      agent.health.latency = latency;
      agent.health.lastCheck = new Date();
      
      this.emit('agent.health.checked', { agentId: agent.id, health: agent.health });
    } catch (error) {
      agent.health.status = 'unhealthy';
      agent.health.lastCheck = new Date();
      this.logger.error(`Health check failed for agent ${agent.id}:`, error);
    }
  }

  /**
   * Ping agent to check if it's responsive
   */
  private async pingAgent(agent: AgentMetadata): Promise<boolean> {
    // Implementation depends on protocol
    // For now, return true as placeholder
    return true;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    healthyAgents: number;
    activeConnections: number;
    capabilityCoverage: Record<string, number>;
  } {
    const agents = Array.from(this.agents.values());
    const healthyAgents = agents.filter(a => a.health.status === 'healthy').length;
    const activeConnections = agents.reduce((sum, a) => sum + a.connection.activeConnections, 0);
    
    const capabilityCoverage: Record<string, number> = {};
    this.capabilityIndex.forEach((agentIds, capability) => {
      capabilityCoverage[capability] = agentIds.size;
    });

    return {
      totalAgents: this.agents.size,
      healthyAgents,
      activeConnections,
      capabilityCoverage
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Close all active connections
    for (const [agentId, connection] of this.activeConnections) {
      try {
        // Close connection based on type
        if (connection.close) {
          await connection.close();
        }
      } catch (error) {
        this.logger.error(`Error closing connection for agent ${agentId}:`, error);
      }
    }
    
    this.activeConnections.clear();
    this.agents.clear();
    this.capabilityIndex.clear();
  }
}

export default AgentRegistry;