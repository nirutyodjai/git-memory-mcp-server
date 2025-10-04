/**
 * Type definitions for Git Memory MCP Server
 */

import { Request, Response } from 'express';
import WebSocket from 'ws';

// Express middleware types
export interface AuthenticatedRequest extends Request {
  user?: any;
  traceSpan?: any;
  traceContext?: any;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

export interface RepoEventMessage extends WebSocketMessage {
  type: 'repo_event';
  repoPath: string;
  eventType: string;
  data: any;
}

export interface ToolExecutionMessage extends WebSocketMessage {
  type: 'tool_execution_event';
  toolName: string;
  data: {
    executionId: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    result?: any;
    error?: string;
  };
}

export interface SubscriptionMessage extends WebSocketMessage {
  type: 'subscription_confirmed' | 'unsubscription_confirmed' | 'error';
  repoPath?: string;
  toolName?: string;
  message: string;
}

// Git operation types
export interface GitOperationOptions {
  repoPath: string;
  branch?: string;
  remote?: string;
  upstream?: string;
  force?: boolean;
  tags?: boolean;
  prune?: boolean;
  all?: boolean;
  rebase?: boolean;
  noEdit?: boolean;
  strategy?: string;
  noFastForward?: boolean;
  squash?: boolean;
  message?: string;
  json?: boolean;
}

export interface GitOperationResult {
  success: boolean;
  repoPath: string;
  result?: any;
  error?: string;
  duration?: number;
}

// Tool execution types
export interface ToolArguments {
  repoPath: string;
  [key: string]: any;
}

export interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

// Metrics types
export interface MetricsData {
  activeConnections: number;
  totalConnections: number;
  connectionErrors: number;
  toolCalls: { [toolName: string]: number };
  toolDurations: { [toolName: string]: number[] };
  toolErrors: { [toolName: string]: number };
  httpDurations: { [endpoint: string]: number[] };
  httpErrors: { [endpoint: string]: number };
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

// Configuration types
export interface ServerConfig {
  port: number;
  maxConnections: number;
  enableMetrics: boolean;
  metricsPort: number;
  enableTracing: boolean;
  jaegerEndpoint?: string;
  logLevel: string;
  redisUrl?: string;
  allowedRepos: string[];
  apiKey?: string;
}

// Service class types
export interface GitMemoryServiceInterface {
  getCurrentBranch(repoPath: string): Promise<string>;
  getRecentCommits(repoPath: string, limit?: number): Promise<any[]>;
  getRepoStatus(repoPath: string): Promise<any>;
  listBranches(repoPath: string): Promise<string[]>;
  searchCommits(repoPath: string, query: string, limit?: number): Promise<any[]>;
  getFileHistory(repoPath: string, filePath: string, limit?: number): Promise<any[]>;
}

export interface GitMemoryCLIServiceInterface {
  status(repoPath: string, options?: { json?: boolean }): Promise<any>;
  fetch(repoPath: string, options?: GitOperationOptions): Promise<any>;
  rebase(repoPath: string, options?: GitOperationOptions): Promise<any>;
  clone(url: string, targetPath: string, options?: GitOperationOptions): Promise<any>;
  push(repoPath: string, options?: GitOperationOptions): Promise<any>;
  pull(repoPath: string, options?: GitOperationOptions): Promise<any>;
  merge(repoPath: string, options?: GitOperationOptions): Promise<any>;
}

// WebSocket subscription types
export interface SubscriptionManager {
  subscribeToRepoEvents(connectionId: string, repoPath: string): SubscriptionMessage;
  unsubscribeFromRepoEvents(connectionId: string, repoPath: string): SubscriptionMessage;
  subscribeToToolExecutions(connectionId: string, toolName: string): SubscriptionMessage;
  unsubscribeFromToolExecutions(connectionId: string, toolName: string): SubscriptionMessage;
  getActiveSubscriptions(connectionId: string): { repositories: string[]; toolExecutions: string[] };
  broadcastRepoEvent(repoPath: string, eventType: string, eventData: any): void;
  broadcastToolExecutionEvent(toolName: string, executionData: any): void;
}

// Error types
export class GitMemoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'GitMemoryError';
  }
}

export class AuthenticationError extends GitMemoryError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_FAILED', 401);
  }
}

export class AuthorizationError extends GitMemoryError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
  }
}

export class ValidationError extends GitMemoryError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class RepositoryNotFoundError extends GitMemoryError {
  constructor(repoPath: string) {
    super(`Repository not found: ${repoPath}`, 'REPO_NOT_FOUND', 404);
  }
}

export class GitOperationError extends GitMemoryError {
  constructor(operation: string, details?: any) {
    super(`Git operation failed: ${operation}`, 'GIT_ERROR', 500, details);
  }
}

// Tracing types
export interface TracingOptions {
  serviceName?: string;
  serviceVersion?: string;
  jaegerEndpoint?: string;
  otlpEndpoint?: string;
  enableConsoleExporter?: boolean;
  samplingRatio?: number;
}

export interface TracingServiceInterface {
  initialize(): Promise<void>;
  startSpan(name: string, options?: any): any;
  startActiveSpan<T>(name: string, fn: (span: any) => T, options?: any): T;
  recordException(error: Error, span?: any): void;
  setAttributes(attributes: Record<string, any>, span?: any): void;
  addEvent(name: string, attributes?: Record<string, any>, span?: any): void;
  shutdown(): Promise<void>;
}

// Logger types
export interface LoggerInterface {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skip?: (req: Request) => boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitServiceInterface {
  middleware(): any;
  isRateLimited(key: string): boolean;
  getRemainingRequests(key: string): number;
  resetRateLimit(key: string): void;
}

// Health check types
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    redis?: 'connected' | 'disconnected' | 'error';
    database?: 'connected' | 'disconnected' | 'error';
    memory?: 'healthy' | 'high' | 'critical';
    cpu?: 'healthy' | 'high' | 'critical';
  };
  metrics: {
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// Connection manager types
export interface ConnectionManagerInterface {
  addConnection(ws: WebSocket, req: Request): string | null;
  removeConnection(connectionId: string): void;
  getConnection(connectionId: string): WebSocket | null;
  getStats(): {
    active: number;
    total: number;
    errors: number;
  };
  cleanup(): void;
}

// MCP tool types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPToolList {
  tools: MCPTool[];
}

// Environment variables type
export interface EnvironmentConfig {
  NODE_ENV?: string;
  PORT?: string;
  LOG_LEVEL?: string;
  GIT_MEMORY_API_KEY?: string;
  GIT_MEMORY_ALLOWED_REPOS?: string;
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  MAX_CONNECTIONS?: string;
  ENABLE_METRICS?: string;
  METRICS_PORT?: string;
  ENABLE_TRACING?: string;
  JAEGER_ENDPOINT?: string;
  OTLP_ENDPOINT?: string;
  POSTGRES_URL?: string;
  POSTGRES_HOST?: string;
  POSTGRES_PORT?: string;
  POSTGRES_DB?: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
}

// Export all types
export type {
  AuthenticatedRequest,
  WebSocketMessage,
  RepoEventMessage,
  ToolExecutionMessage,
  SubscriptionMessage,
  GitOperationOptions,
  GitOperationResult,
  ToolArguments,
  ToolResult,
  MetricsData,
  ServerConfig,
  TracingOptions,
  RateLimitConfig,
  HealthCheckResult,
  MCPTool,
  MCPToolList,
  EnvironmentConfig
};
