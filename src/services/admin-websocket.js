/**
 * WebSocket Handler for Admin Dashboard Real-time Updates
 *
 * Provides real-time communication for:
 * - Live metrics streaming
 * - Real-time log streaming
 * - Server status updates
 * - Alert notifications
 * - Configuration change notifications
 */

import { WebSocketServer } from 'ws';
import { AdvancedCachingService } from '../services/advanced-caching.js';
import { AdvancedRateLimitService } from '../services/advanced-rate-limiting.js';
import { AuditLoggingService } from '../services/audit-logging.js';

export class AdminWebSocketHandler {
  private wss: WebSocketServer;
  private adminClients: Map<string, any> = new Map();
  private services: {
    cache?: AdvancedCachingService;
    rateLimit?: AdvancedRateLimitService;
    audit?: AuditLoggingService;
  };

  constructor(wss: WebSocketServer, services: {
    cache?: AdvancedCachingService;
    rateLimit?: AdvancedRateLimitService;
    audit?: AuditLoggingService;
  }) {
    this.wss = wss;
    this.services = services;

    this.setupWebSocketHandlers();
    this.startPeriodicUpdates();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ws,
        connectedAt: new Date(),
        subscriptions: new Set(['metrics', 'logs', 'status']),
        lastPing: Date.now()
      };

      this.adminClients.set(clientId, clientInfo);

      console.log(`Admin client connected: ${clientId}`);

      // Send initial data
      this.sendToClient(ws, {
        type: 'welcome',
        data: {
          clientId,
          timestamp: new Date().toISOString(),
          subscriptions: Array.from(clientInfo.subscriptions)
        }
      });

      // Setup client-specific handlers
      ws.on('message', (data) => {
        this.handleClientMessage(clientId, data);
      });

      ws.on('pong', () => {
        clientInfo.lastPing = Date.now();
      });

      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`Admin WebSocket error for client ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });
    });
  }

  /**
   * Handle messages from admin clients
   */
  private handleClientMessage(clientId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      const client = this.adminClients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(clientId, message.data);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.data);
          break;
        case 'ping':
          this.sendToClient(client.ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        case 'get_metrics':
          this.sendMetricsToClient(clientId);
          break;
        case 'get_logs':
          this.sendLogsToClient(clientId, message.data);
          break;
        case 'clear_cache':
          this.clearCache(message.data);
          break;
        default:
          console.warn(`Unknown admin message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling admin message from ${clientId}:`, error);
    }
  }

  /**
   * Handle subscription requests
   */
  private handleSubscription(clientId: string, data: { type: string }): void {
    const client = this.adminClients.get(clientId);
    if (!client) return;

    client.subscriptions.add(data.type);

    this.sendToClient(client.ws, {
      type: 'subscription_updated',
      data: {
        subscribed: Array.from(client.subscriptions),
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Handle unsubscription requests
   */
  private handleUnsubscription(clientId: string, data: { type: string }): void {
    const client = this.adminClients.get(clientId);
    if (!client) {
      client.subscriptions.delete(data.type);
    }

    this.sendToClient(client.ws, {
      type: 'subscription_updated',
      data: {
        subscribed: Array.from(client.subscriptions),
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(clientId: string): void {
    this.adminClients.delete(clientId);
    console.log(`Admin client disconnected: ${clientId}`);
  }

  /**
   * Send metrics to specific client
   */
  private async sendMetricsToClient(clientId: string): Promise<void> {
    const client = this.adminClients.get(clientId);
    if (!client) return;

    try {
      const metrics = await this.getAllMetrics();

      this.sendToClient(client.ws, {
        type: 'metrics',
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error sending metrics to client ${clientId}:`, error);
    }
  }

  /**
   * Send logs to specific client
   */
  private async sendLogsToClient(clientId: string, options: { limit?: number; filter?: any } = {}): Promise<void> {
    const client = this.adminClients.get(clientId);
    if (!client) return;

    try {
      const limit = options.limit || 100;
      const logsResult = await this.services.audit!.query(options.filter || {}, { limit });

      this.sendToClient(client.ws, {
        type: 'logs',
        logs: logsResult.entries,
        total: logsResult.total,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error sending logs to client ${clientId}:`, error);
    }
  }

  /**
   * Clear cache
   */
  private async clearCache(options: { level?: string } = {}): Promise<void> {
    try {
      const level = options.level || 'memory';

      if (this.services.cache) {
        await this.services.cache.clear(level);

        // Notify all clients
        this.broadcast({
          type: 'cache_cleared',
          data: { level },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Start periodic updates for all clients
   */
  private startPeriodicUpdates(): void {
    // Send metrics every 10 seconds
    setInterval(async () => {
      await this.broadcastMetrics();
    }, 10000);

    // Send server status every 30 seconds
    setInterval(async () => {
      await this.broadcastStatus();
    }, 30000);

    // Check for client health every minute
    setInterval(() => {
      this.checkClientHealth();
    }, 60000);
  }

  /**
   * Broadcast metrics to all subscribed clients
   */
  private async broadcastMetrics(): Promise<void> {
    try {
      const metrics = await this.getAllMetrics();

      this.broadcast({
        type: 'metrics',
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting metrics:', error);
    }
  }

  /**
   * Broadcast server status to all clients
   */
  private async broadcastStatus(): Promise<void> {
    try {
      const status = await this.getServerStatus();

      this.broadcast({
        type: 'status',
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting status:', error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(data: any): void {
    const message = JSON.stringify(data);

    for (const [clientId, client] of this.adminClients.entries()) {
      if (client.subscriptions.has(data.type) || data.type === 'alert' || data.type === 'status') {
        try {
          if (client.ws.readyState === 1) { // OPEN
            client.ws.send(message);
          }
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          this.adminClients.delete(clientId);
        }
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: any, data: any): void {
    try {
      if (ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error sending to client:', error);
    }
  }

  /**
   * Check client health and remove inactive clients
   */
  private checkClientHealth(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [clientId, client] of this.adminClients.entries()) {
      if (now - client.lastPing > timeout) {
        console.log(`Removing inactive admin client: ${clientId}`);
        this.adminClients.delete(clientId);
        client.ws.terminate();
      }
    }
  }

  /**
   * Get all metrics from services
   */
  private async getAllMetrics(): Promise<any> {
    const metrics: any = {
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user / 1000000,
        loadAverage: require('os').loadavg()
      },
      timestamp: new Date().toISOString()
    };

    if (this.services.cache) {
      metrics.cache = this.services.cache.getMetrics();
    }

    if (this.services.rateLimit) {
      metrics.rateLimiting = await this.services.rateLimit.getStatistics();
    }

    if (this.services.audit) {
      metrics.audit = this.services.audit.getPerformanceMetrics();
    }

    return metrics;
  }

  /**
   * Get server status
   */
  private async getServerStatus(): Promise<any> {
    const status: any = {
      version: process.env.npm_package_version || '2.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    // Check service health
    if (this.services.cache) {
      status.cache = await this.services.cache.healthCheck();
    }

    if (this.services.rateLimit) {
      status.rateLimit = await this.services.rateLimit.healthCheck();
    }

    if (this.services.audit) {
      status.audit = await this.services.audit.healthCheck();
    }

    return status;
  }

  /**
   * Send alert to all clients
   */
  sendAlert(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.broadcast({
      type: 'alert',
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send log entry to subscribed clients
   */
  sendLogEntry(log: any): void {
    this.broadcast({
      type: 'log',
      log,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected client count
   */
  getConnectedClientCount(): number {
    return this.adminClients.size;
  }

  /**
   * Get client information
   */
  getClientInfo(clientId: string): any {
    return this.adminClients.get(clientId);
  }

  /**
   * Disconnect all clients
   */
  disconnectAllClients(): void {
    for (const [clientId, client] of this.adminClients.entries()) {
      client.ws.close(1000, 'Server shutting down');
    }
    this.adminClients.clear();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnectAllClients();

    if (this.wss) {
      this.wss.close();
    }
  }
}
