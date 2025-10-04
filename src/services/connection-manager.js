import { EventEmitter } from 'events';
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info'
});

export class ConnectionManager extends EventEmitter {
  constructor(maxConnections = 3000) {
    super();
    this.maxConnections = maxConnections;
    this.connections = new Map();
    this.connectionsByIP = new Map();
    this.connectionStats = {
      total: 0,
      active: 0,
      peak: 0,
      rejected: 0,
      closed: 0
    };
    
    // Connection pools by type
    this.pools = {
      websocket: new Map(),
      http: new Map(),
      mcp: new Map()
    };
    
    // Rate limiting per IP
    this.ipLimits = new Map();
    this.maxConnectionsPerIP = 50;
    
    this.setupCleanupInterval();
  }

  addConnection(socket, request, type = 'websocket') {
    // Check global connection limit
    if (this.connections.size >= this.maxConnections) {
      this.connectionStats.rejected++;
      logger.warn(`Connection rejected: max connections (${this.maxConnections}) reached`);
      return null;
    }

    const clientIP = this.getClientIP(request);
    
    // Check per-IP connection limit
    const ipConnections = this.connectionsByIP.get(clientIP) || new Set();
    if (ipConnections.size >= this.maxConnectionsPerIP) {
      this.connectionStats.rejected++;
      logger.warn(`Connection rejected: max connections per IP (${this.maxConnectionsPerIP}) reached for ${clientIP}`);
      return null;
    }

    // Generate unique connection ID
    const connectionId = this.generateConnectionId();
    
    // Create connection object
    const connection = {
      id: connectionId,
      socket,
      type,
      clientIP,
      userAgent: request.headers['user-agent'] || 'Unknown',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      requestCount: 0,
      bytesReceived: 0,
      bytesSent: 0,
      isActive: true
    };

    // Add to main connections map
    this.connections.set(connectionId, connection);
    
    // Add to IP tracking
    ipConnections.add(connectionId);
    this.connectionsByIP.set(clientIP, ipConnections);
    
    // Add to type-specific pool
    if (!this.pools[type]) {
      this.pools[type] = new Map();
    }
    this.pools[type].set(connectionId, connection);

    // Update statistics
    this.connectionStats.total++;
    this.connectionStats.active = this.connections.size;
    if (this.connectionStats.active > this.connectionStats.peak) {
      this.connectionStats.peak = this.connectionStats.active;
    }

    // Setup connection event handlers
    this.setupConnectionHandlers(connection);

    logger.info(`New ${type} connection: ${connectionId} from ${clientIP}`);
    this.emit('connection:added', connection);

    return connectionId;
  }

  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    // Remove from main connections map
    this.connections.delete(connectionId);
    
    // Remove from IP tracking
    const ipConnections = this.connectionsByIP.get(connection.clientIP);
    if (ipConnections) {
      ipConnections.delete(connectionId);
      if (ipConnections.size === 0) {
        this.connectionsByIP.delete(connection.clientIP);
      }
    }
    
    // Remove from type-specific pool
    if (this.pools[connection.type]) {
      this.pools[connection.type].delete(connectionId);
    }

    // Update statistics
    this.connectionStats.active = this.connections.size;
    this.connectionStats.closed++;

    logger.info(`Connection removed: ${connectionId}`);
    this.emit('connection:removed', connection);

    return true;
  }

  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  updateConnectionActivity(connectionId, bytesReceived = 0, bytesSent = 0) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = Date.now();
      connection.requestCount++;
      connection.bytesReceived += bytesReceived;
      connection.bytesSent += bytesSent;
    }
  }

  getConnectionsByType(type) {
    return Array.from(this.pools[type]?.values() || []);
  }

  getConnectionsByIP(clientIP) {
    const connectionIds = this.connectionsByIP.get(clientIP) || new Set();
    return Array.from(connectionIds).map(id => this.connections.get(id)).filter(Boolean);
  }

  // Load balancing - get least loaded connection
  getLeastLoadedConnection(type = 'websocket') {
    const connections = this.getConnectionsByType(type);
    if (connections.length === 0) return null;

    return connections.reduce((least, current) => {
      if (!least) return current;
      return current.requestCount < least.requestCount ? current : least;
    });
  }

  // Get connection with least recent activity
  getLeastActiveConnection(type = 'websocket') {
    const connections = this.getConnectionsByType(type);
    if (connections.length === 0) return null;

    return connections.reduce((oldest, current) => {
      if (!oldest) return current;
      return current.lastActivity < oldest.lastActivity ? current : oldest;
    });
  }

  // Round-robin connection selection
  getRoundRobinConnection(type = 'websocket') {
    const connections = this.getConnectionsByType(type);
    if (connections.length === 0) return null;

    if (!this.roundRobinCounters) {
      this.roundRobinCounters = {};
    }
    
    if (!this.roundRobinCounters[type]) {
      this.roundRobinCounters[type] = 0;
    }

    const index = this.roundRobinCounters[type] % connections.length;
    this.roundRobinCounters[type]++;
    
    return connections[index];
  }

  // Health check for connections
  healthCheck() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const staleConnections = [];

    this.connections.forEach((connection, id) => {
      if (now - connection.lastActivity > staleThreshold) {
        staleConnections.push(id);
      }
    });

    // Close stale connections
    staleConnections.forEach(id => {
      const connection = this.connections.get(id);
      if (connection && connection.socket) {
        logger.info(`Closing stale connection: ${id}`);
        if (connection.socket.close) {
          connection.socket.close(1001, 'Connection timeout');
        } else if (connection.socket.end) {
          connection.socket.end();
        }
      }
      this.removeConnection(id);
    });

    return {
      checked: this.connections.size,
      stale: staleConnections.length,
      removed: staleConnections.length
    };
  }

  // Get comprehensive statistics
  getStats() {
    const now = Date.now();
    const connections = Array.from(this.connections.values());
    
    // Calculate connection age statistics
    const ages = connections.map(conn => now - conn.createdAt);
    const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
    
    // Calculate request statistics
    const requests = connections.map(conn => conn.requestCount);
    const totalRequests = requests.reduce((sum, count) => sum + count, 0);
    const avgRequests = requests.length > 0 ? totalRequests / requests.length : 0;
    
    // Calculate bandwidth statistics
    const totalBytesReceived = connections.reduce((sum, conn) => sum + conn.bytesReceived, 0);
    const totalBytesSent = connections.reduce((sum, conn) => sum + conn.bytesSent, 0);
    
    // Connection distribution by type
    const byType = {};
    Object.keys(this.pools).forEach(type => {
      byType[type] = this.pools[type].size;
    });
    
    // Connection distribution by IP
    const byIP = {};
    this.connectionsByIP.forEach((connections, ip) => {
      byIP[ip] = connections.size;
    });

    return {
      ...this.connectionStats,
      current: this.connections.size,
      maxConnections: this.maxConnections,
      utilizationPercent: Math.round((this.connections.size / this.maxConnections) * 100),
      avgConnectionAge: Math.round(avgAge / 1000), // in seconds
      avgRequestsPerConnection: Math.round(avgRequests * 100) / 100,
      totalRequests,
      totalBytesReceived,
      totalBytesSent,
      connectionsByType: byType,
      uniqueIPs: this.connectionsByIP.size,
      topIPs: this.getTopIPs(5)
    };
  }

  getTopIPs(limit = 10) {
    const ipCounts = Array.from(this.connectionsByIP.entries())
      .map(([ip, connections]) => ({ ip, count: connections.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return ipCounts;
  }

  // Graceful shutdown
  async gracefulShutdown(timeout = 30000) {
    logger.info(`Starting graceful shutdown of ${this.connections.size} connections`);
    
    const shutdownPromises = Array.from(this.connections.values()).map(connection => {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          // Force close if not closed gracefully
          if (connection.socket && connection.socket.terminate) {
            connection.socket.terminate();
          }
          resolve();
        }, timeout);

        if (connection.socket) {
          if (connection.socket.close) {
            connection.socket.close(1001, 'Server shutting down');
          } else if (connection.socket.end) {
            connection.socket.end();
          }
          
          const closeHandler = () => {
            clearTimeout(timer);
            resolve();
          };
          
          connection.socket.once('close', closeHandler);
          connection.socket.once('end', closeHandler);
        } else {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    await Promise.all(shutdownPromises);
    this.connections.clear();
    this.connectionsByIP.clear();
    Object.values(this.pools).forEach(pool => pool.clear());
    
    logger.info('All connections closed gracefully');
  }

  // Private methods
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getClientIP(request) {
    return request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           request.headers['x-real-ip'] ||
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           'unknown';
  }

  setupConnectionHandlers(connection) {
    if (!connection.socket) return;

    // Handle connection close
    const closeHandler = () => {
      this.removeConnection(connection.id);
    };

    // Handle connection error
    const errorHandler = (error) => {
      logger.error(`Connection error for ${connection.id}:`, error);
      this.removeConnection(connection.id);
    };

    if (connection.socket.on) {
      connection.socket.on('close', closeHandler);
      connection.socket.on('end', closeHandler);
      connection.socket.on('error', errorHandler);
    }
  }

  setupCleanupInterval() {
    // Run health check every 5 minutes
    setInterval(() => {
      this.healthCheck();
    }, 5 * 60 * 1000);

    // Log statistics every minute
    setInterval(() => {
      const stats = this.getStats();
      logger.info('Connection Stats:', {
        active: stats.current,
        peak: stats.peak,
        utilization: `${stats.utilizationPercent}%`,
        uniqueIPs: stats.uniqueIPs
      });
    }, 60 * 1000);
  }
}