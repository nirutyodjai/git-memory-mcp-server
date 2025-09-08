/**
 * MCP Orchestrator - Main entry point
 * 
 * This module provides a comprehensive orchestration system for managing
 * multiple MCP (Model Context Protocol) agents with intelligent routing,
 * connection pooling, and quality of service controls.
 */

export { MCPOrchestrator } from './MCPOrchestrator';
export type {
  OrchestratorConfig,
  OrchestratorMetrics,
  TaskContext
} from './MCPOrchestrator';

export { AgentRegistry } from './AgentRegistry';
export type {
  AgentMetadata,
  AgentCapability,
  AgentHealth,
  AgentPerformance,
  Task,
  TaskPriority,
  AgentRegistryConfig,
  AgentStats
} from './AgentRegistry';

export { TaskRouter } from './TaskRouter';
export type {
  TaskResult,
  RoutingStrategy,
  CircuitBreakerConfig,
  RateLimitConfig,
  TaskRouterConfig
} from './TaskRouter';

export { ConnectionPoolManager } from './ConnectionPoolManager';
export type {
  ConnectionType,
  ConnectionConfig,
  Connection as ConnectionInstance,
  PoolConfig,
  PoolStats
} from './ConnectionPoolManager';

import { MCPOrchestrator } from './MCPOrchestrator';
import type { OrchestratorConfig } from './MCPOrchestrator';
import type { AgentMetadata, AgentCapability } from './AgentRegistry';

/**
 * Default configuration for the orchestrator
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  registry: {
    maxAgents: 1500,
    healthCheckInterval: 30000, // 30 seconds
    discoveryEnabled: true,
    discoveryInterval: 60000 // 1 minute
  },
  routing: {
    defaultStrategy: 'capability-match',
    enableAdaptiveRouting: true,
    learningRate: 0.1,
    maxConcurrentTasks: 100,
    taskTimeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000,
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000 // 5 minutes
    },
    rateLimit: {
      maxRequestsPerSecond: 10,
      burstSize: 20,
      windowSize: 1000
    },
    priorityQueues: true
  },
  connectionPool: {
    maxTotalConnections: 200,
    maxConnectionsPerAgent: 10,
    connectionTimeout: 10000,
    idleTimeout: 30000,
    healthCheckInterval: 60000,
    retryAttempts: 3,
    warmupConnections: 5,
    enableMetrics: true
  },
  telemetry: {
    enabled: true,
    metricsInterval: 10000, // 10 seconds
    retentionPeriod: 3600000 // 1 hour
  }
};

/**
 * Create a new orchestrator instance with default configuration
 */
export function createOrchestrator(config?: Partial<OrchestratorConfig>): MCPOrchestrator {
  const finalConfig: OrchestratorConfig = {
    ...DEFAULT_ORCHESTRATOR_CONFIG,
    ...config,
    registry: {
      ...DEFAULT_ORCHESTRATOR_CONFIG.registry,
      ...config?.registry
    },
    routing: {
      ...DEFAULT_ORCHESTRATOR_CONFIG.routing,
      ...config?.routing,
      circuitBreaker: {
        ...DEFAULT_ORCHESTRATOR_CONFIG.routing.circuitBreaker,
        ...config?.routing?.circuitBreaker
      },
      rateLimit: {
        ...DEFAULT_ORCHESTRATOR_CONFIG.routing.rateLimit,
        ...config?.routing?.rateLimit
      }
    },
    connectionPool: {
      ...DEFAULT_ORCHESTRATOR_CONFIG.connectionPool,
      ...config?.connectionPool
    },
    telemetry: {
      ...DEFAULT_ORCHESTRATOR_CONFIG.telemetry,
      ...config?.telemetry
    }
  };

  return new MCPOrchestrator(finalConfig);
}

/**
 * Utility functions for agent management
 */
export const OrchestratorUtils = {
  /**
   * Validate agent metadata
   */
  validateAgentMetadata(agent: Partial<AgentMetadata>): boolean {
    return !!(agent.id && agent.name && agent.capabilities && agent.capabilities.length > 0);
  },

  /**
   * Generate agent ID from name and endpoint
   */
  generateAgentId(name: string, endpoint: string): string {
    const hash = Buffer.from(`${name}:${endpoint}`).toString('base64').slice(0, 8);
    return `agent-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${hash}`;
  },

  /**
   * Parse capability string into structured format
   */
  parseCapabilities(capabilities: string[]): AgentCapability[] {
    return capabilities.map((cap: string) => {
      const [name, ...versionParts] = cap.split('@');
      const version = versionParts.join('@') || '1.0.0';
      return { name, version };
    });
  },

  /**
   * Check if agent has required capabilities
   */
  hasRequiredCapabilities(agent: AgentMetadata, required: string[]): boolean {
    const agentCaps = agent.capabilities.map((cap: AgentCapability) => cap.name);
    return required.every(req => agentCaps.includes(req));
  },

  /**
   * Calculate agent compatibility score
   */
  calculateCompatibilityScore(agent: AgentMetadata, requiredCapabilities: string[]): number {
    if (!this.hasRequiredCapabilities(agent, requiredCapabilities)) {
      return 0;
    }

    const agentCaps = agent.capabilities.map((cap: AgentCapability) => cap.name);
    
    // Base score for having all required capabilities
    let score = 0.5;
    
    // Bonus for exact match (no extra capabilities)
    if (agentCaps.length === requiredCapabilities.length) {
      score += 0.2;
    }
    
    // Bonus for performance
    score += agent.performance.successScore * 0.2;
    
    // Bonus for low latency (assuming latency is in ms)
    const latencyScore = Math.max(0, 1 - (agent.performance.averageLatency / 5000));
    score += latencyScore * 0.1;
    
    return Math.min(1, score);
  }
};

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

/**
 * Feature flags
 */
export const FEATURES = {
  ADAPTIVE_ROUTING: true,
  CONNECTION_POOLING: true,
  CIRCUIT_BREAKER: true,
  RATE_LIMITING: true,
  TELEMETRY: true,
  HEALTH_CHECKS: true,
  LAZY_LOADING: true
} as const;