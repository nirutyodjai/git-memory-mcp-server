import { EventEmitter } from 'events';
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info'
});

export class LoadBalancer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.workers = new Map();
    this.connections = new Map();
    this.strategies = {
      ROUND_ROBIN: 'round_robin',
      LEAST_CONNECTIONS: 'least_connections',
      WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
      RESOURCE_BASED: 'resource_based'
    };
    
    this.config = {
      strategy: options.strategy || this.strategies.LEAST_CONNECTIONS,
      maxConnectionsPerWorker: options.maxConnectionsPerWorker || 500,
      healthCheckInterval: options.healthCheckInterval || 30000,
      connectionTimeout: options.connectionTimeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };
    
    this.currentWorkerIndex = 0;
    this.stats = {
      totalConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      startTime: Date.now()
    };
    
    this.setupHealthCheck();
  }

  // Register a worker
  registerWorker(workerId, workerInfo) {
    const worker = {
      id: workerId,
      pid: workerInfo.pid,
      connections: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      weight: workerInfo.weight || 1,
      healthy: true,
      lastHealthCheck: Date.now(),
      cpuUsage: 0,
      memoryUsage: 0,
      ...workerInfo
    };
    
    this.workers.set(workerId, worker);
    logger.info(`Worker registered: ${workerId} (PID: ${worker.pid})`);
    
    this.emit('workerRegistered', worker);
    return worker;
  }

  // Unregister a worker
  unregisterWorker(workerId) {
    const worker = this.workers.get(workerId);
    if (worker) {
      // Redistribute connections from this worker
      this.redistributeConnections(workerId);
      this.workers.delete(workerId);
      
      logger.info(`Worker unregistered: ${workerId}`);
      this.emit('workerUnregistered', worker);
    }
  }

  // Get the best worker based on strategy
  selectWorker(connectionId = null) {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => 
        worker.healthy && 
        worker.connections < this.config.maxConnectionsPerWorker
      );
    
    if (availableWorkers.length === 0) {
      throw new Error('No available workers');
    }
    
    let selectedWorker;
    
    switch (this.config.strategy) {
      case this.strategies.ROUND_ROBIN:
        selectedWorker = this.selectRoundRobin(availableWorkers);
        break;
        
      case this.strategies.LEAST_CONNECTIONS:
        selectedWorker = this.selectLeastConnections(availableWorkers);
        break;
        
      case this.strategies.WEIGHTED_ROUND_ROBIN:
        selectedWorker = this.selectWeightedRoundRobin(availableWorkers);
        break;
        
      case this.strategies.RESOURCE_BASED:
        selectedWorker = this.selectResourceBased(availableWorkers);
        break;
        
      default:
        selectedWorker = this.selectLeastConnections(availableWorkers);
    }
    
    return selectedWorker;
  }

  // Round Robin selection
  selectRoundRobin(workers) {
    const worker = workers[this.currentWorkerIndex % workers.length];
    this.currentWorkerIndex++;
    return worker;
  }

  // Least Connections selection
  selectLeastConnections(workers) {
    return workers.reduce((best, current) => 
      current.connections < best.connections ? current : best
    );
  }

  // Weighted Round Robin selection
  selectWeightedRoundRobin(workers) {
    const totalWeight = workers.reduce((sum, worker) => sum + worker.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const worker of workers) {
      randomWeight -= worker.weight;
      if (randomWeight <= 0) {
        return worker;
      }
    }
    
    return workers[0]; // Fallback
  }

  // Resource-based selection (CPU + Memory + Connections)
  selectResourceBased(workers) {
    return workers.reduce((best, current) => {
      const currentScore = this.calculateResourceScore(current);
      const bestScore = this.calculateResourceScore(best);
      return currentScore < bestScore ? current : best;
    });
  }

  // Calculate resource utilization score (lower is better)
  calculateResourceScore(worker) {
    const connectionRatio = worker.connections / this.config.maxConnectionsPerWorker;
    const cpuRatio = worker.cpuUsage / 100;
    const memoryRatio = worker.memoryUsage / 100;
    
    // Weighted score: connections (40%), CPU (30%), memory (30%)
    return (connectionRatio * 0.4) + (cpuRatio * 0.3) + (memoryRatio * 0.3);
  }

  // Assign connection to a worker
  assignConnection(connectionId, clientInfo = {}) {
    try {
      const worker = this.selectWorker(connectionId);
      
      const connection = {
        id: connectionId,
        workerId: worker.id,
        clientInfo,
        startTime: Date.now(),
        lastActivity: Date.now(),
        requestCount: 0
      };
      
      this.connections.set(connectionId, connection);
      worker.connections++;
      this.stats.totalConnections++;
      
      logger.debug(`Connection ${connectionId} assigned to worker ${worker.id}`);
      this.emit('connectionAssigned', { connection, worker });
      
      return worker;
    } catch (error) {
      logger.error(`Failed to assign connection ${connectionId}:`, error);
      throw error;
    }
  }

  // Remove connection
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const worker = this.workers.get(connection.workerId);
      if (worker) {
        worker.connections--;
      }
      
      this.connections.delete(connectionId);
      this.stats.totalConnections--;
      
      logger.debug(`Connection ${connectionId} removed from worker ${connection.workerId}`);
      this.emit('connectionRemoved', { connection, worker });
    }
  }

  // Update connection activity
  updateConnectionActivity(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = Date.now();
      connection.requestCount++;
      
      const worker = this.workers.get(connection.workerId);
      if (worker) {
        worker.totalRequests++;
        this.stats.totalRequests++;
      }
    }
  }

  // Update worker health and metrics
  updateWorkerHealth(workerId, healthData) {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.healthy = healthData.healthy;
      worker.cpuUsage = healthData.cpuUsage || 0;
      worker.memoryUsage = healthData.memoryUsage || 0;
      worker.averageResponseTime = healthData.averageResponseTime || 0;
      worker.lastHealthCheck = Date.now();
      
      if (!healthData.healthy) {
        logger.warn(`Worker ${workerId} marked as unhealthy`);
        this.redistributeConnections(workerId);
      }
    }
  }

  // Redistribute connections from an unhealthy worker
  redistributeConnections(workerId) {
    const connectionsToRedistribute = Array.from(this.connections.values())
      .filter(conn => conn.workerId === workerId);
    
    for (const connection of connectionsToRedistribute) {
      try {
        // Remove from current worker
        this.removeConnection(connection.id);
        
        // Reassign to a healthy worker
        this.assignConnection(connection.id, connection.clientInfo);
        
        logger.info(`Connection ${connection.id} redistributed from worker ${workerId}`);
      } catch (error) {
        logger.error(`Failed to redistribute connection ${connection.id}:`, error);
      }
    }
  }

  // Setup health check interval
  setupHealthCheck() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  // Perform health check on all workers
  performHealthCheck() {
    const now = Date.now();
    
    for (const [workerId, worker] of this.workers) {
      const timeSinceLastCheck = now - worker.lastHealthCheck;
      
      // Mark worker as unhealthy if no recent health updates
      if (timeSinceLastCheck > this.config.healthCheckInterval * 2) {
        if (worker.healthy) {
          logger.warn(`Worker ${workerId} health check timeout`);
          worker.healthy = false;
          this.redistributeConnections(workerId);
        }
      }
    }
    
    this.emit('healthCheckCompleted', {
      totalWorkers: this.workers.size,
      healthyWorkers: Array.from(this.workers.values()).filter(w => w.healthy).length
    });
  }

  // Get worker by connection ID
  getWorkerByConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      return this.workers.get(connection.workerId);
    }
    return null;
  }

  // Get all workers
  getWorkers() {
    return Array.from(this.workers.values());
  }

  // Get healthy workers
  getHealthyWorkers() {
    return Array.from(this.workers.values()).filter(worker => worker.healthy);
  }

  // Get load balancer statistics
  getStats() {
    const workers = Array.from(this.workers.values());
    const healthyWorkers = workers.filter(w => w.healthy);
    
    return {
      ...this.stats,
      workers: {
        total: workers.length,
        healthy: healthyWorkers.length,
        unhealthy: workers.length - healthyWorkers.length
      },
      connections: {
        active: this.connections.size,
        perWorker: this.getConnectionsPerWorker()
      },
      uptime: Date.now() - this.stats.startTime,
      strategy: this.config.strategy
    };
  }

  // Get connections per worker
  getConnectionsPerWorker() {
    const result = {};
    for (const [workerId, worker] of this.workers) {
      result[workerId] = worker.connections;
    }
    return result;
  }

  // Get detailed worker information
  getWorkerDetails(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return null;
    }
    
    const workerConnections = Array.from(this.connections.values())
      .filter(conn => conn.workerId === workerId);
    
    return {
      ...worker,
      connections: workerConnections.map(conn => ({
        id: conn.id,
        startTime: conn.startTime,
        lastActivity: conn.lastActivity,
        requestCount: conn.requestCount,
        duration: Date.now() - conn.startTime
      }))
    };
  }

  // Set load balancing strategy
  setStrategy(strategy) {
    if (Object.values(this.strategies).includes(strategy)) {
      this.config.strategy = strategy;
      logger.info(`Load balancing strategy changed to: ${strategy}`);
      this.emit('strategyChanged', strategy);
    } else {
      throw new Error(`Invalid strategy: ${strategy}`);
    }
  }

  // Clean up expired connections
  cleanupExpiredConnections() {
    const now = Date.now();
    const expiredConnections = [];
    
    for (const [connectionId, connection] of this.connections) {
      const inactiveTime = now - connection.lastActivity;
      if (inactiveTime > this.config.connectionTimeout) {
        expiredConnections.push(connectionId);
      }
    }
    
    for (const connectionId of expiredConnections) {
      this.removeConnection(connectionId);
      logger.info(`Expired connection removed: ${connectionId}`);
    }
    
    return expiredConnections.length;
  }

  // Shutdown load balancer
  shutdown() {
    logger.info('Load balancer shutting down...');
    
    // Clear all connections
    this.connections.clear();
    
    // Clear all workers
    this.workers.clear();
    
    // Reset stats
    this.stats = {
      totalConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      startTime: Date.now()
    };
    
    this.emit('shutdown');
    logger.info('Load balancer shutdown complete');
  }
}