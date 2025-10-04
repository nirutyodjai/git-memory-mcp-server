#!/usr/bin/env node

import cluster from 'cluster';
import os from 'os';
import { createLogger, format, transports } from 'winston';
import { ConfigManager } from './config/config.js';
import pidusage from 'pidusage';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/cluster.log' })
  ]
});

class ClusterManager {
  constructor() {
    this.config = new ConfigManager();
    this.workers = new Map();
    this.workerStats = new Map();
    this.isShuttingDown = false;
    
    // Calculate optimal number of workers
    this.numWorkers = this.calculateWorkerCount();
    
    this.setupMasterProcess();
    this.setupGracefulShutdown();
    this.startMonitoring();
  }

  calculateWorkerCount() {
    const cpuCount = os.cpus().length;
    const configWorkers = this.config.workers;
    
    if (configWorkers === 'auto') {
      // Use CPU count but leave one core for the master process
      return Math.max(1, cpuCount - 1);
    } else if (typeof configWorkers === 'number') {
      return Math.min(configWorkers, cpuCount);
    } else {
      return Math.max(1, Math.floor(cpuCount * 0.75));
    }
  }

  setupMasterProcess() {
    if (cluster.isPrimary) {
      logger.info(`Master process ${process.pid} is running`);
      logger.info(`Starting ${this.numWorkers} workers`);
      
      // Fork workers
      for (let i = 0; i < this.numWorkers; i++) {
        this.forkWorker(i);
      }

      // Handle worker events
      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        this.workers.delete(worker.id);
        this.workerStats.delete(worker.process.pid);
        
        if (!this.isShuttingDown) {
          logger.info('Starting a new worker');
          this.forkWorker();
        }
      });

      cluster.on('online', (worker) => {
        logger.info(`Worker ${worker.process.pid} is online`);
        this.workers.set(worker.id, {
          worker,
          startTime: Date.now(),
          connections: 0,
          requests: 0
        });
      });

      cluster.on('disconnect', (worker) => {
        logger.info(`Worker ${worker.process.pid} disconnected`);
      });

      // Setup IPC communication
      this.setupIPC();
      
    } else {
      // Worker process
      this.startWorker();
    }
  }

  forkWorker(workerId = null) {
    const worker = cluster.fork({
      WORKER_ID: workerId || Date.now(),
      MAX_CONNECTIONS_PER_WORKER: Math.ceil(this.config.maxConnections / this.numWorkers)
    });

    // Setup worker-specific configuration
    worker.on('message', (message) => {
      this.handleWorkerMessage(worker, message);
    });

    return worker;
  }

  setupIPC() {
    // Handle messages from workers
    Object.values(cluster.workers).forEach(worker => {
      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });
    });
  }

  handleWorkerMessage(worker, message) {
    const { type, data } = message;
    
    switch (type) {
      case 'stats':
        this.updateWorkerStats(worker.process.pid, data);
        break;
      case 'health':
        this.handleHealthCheck(worker, data);
        break;
      case 'error':
        logger.error(`Worker ${worker.process.pid} error:`, data);
        break;
      case 'connection_count':
        if (this.workers.has(worker.id)) {
          this.workers.get(worker.id).connections = data.count;
        }
        break;
      default:
        logger.warn(`Unknown message type from worker ${worker.process.pid}:`, type);
    }
  }

  updateWorkerStats(pid, stats) {
    this.workerStats.set(pid, {
      ...stats,
      timestamp: Date.now()
    });
  }

  handleHealthCheck(worker, healthData) {
    if (healthData.status === 'unhealthy') {
      logger.warn(`Worker ${worker.process.pid} is unhealthy:`, healthData);
      
      // Consider restarting unhealthy worker
      if (healthData.severity === 'critical') {
        logger.info(`Restarting critical worker ${worker.process.pid}`);
        worker.kill('SIGTERM');
      }
    }
  }

  async startWorker() {
    try {
      const { HighPerformanceMCPServer } = await import('./server.js');
      const server = new HighPerformanceMCPServer();
      
      // Send periodic stats to master
      setInterval(() => {
        this.sendStatsToMaster();
      }, 10000); // Every 10 seconds
      
      await server.start();
    } catch (error) {
      logger.error('Failed to start worker:', error);
      process.exit(1);
    }
  }

  sendStatsToMaster() {
    pidusage(process.pid, (err, stats) => {
      if (err) {
        logger.error('Failed to get process stats:', err);
        return;
      }

      process.send({
        type: 'stats',
        data: {
          pid: process.pid,
          cpu: stats.cpu,
          memory: stats.memory,
          uptime: process.uptime(),
          connections: process.env.CURRENT_CONNECTIONS || 0
        }
      });
    });
  }

  startMonitoring() {
    if (!cluster.isPrimary) return;

    // Monitor workers every 30 seconds
    setInterval(() => {
      this.monitorWorkers();
    }, 30000);

    // Log cluster stats every minute
    setInterval(() => {
      this.logClusterStats();
    }, 60000);
  }

  monitorWorkers() {
    const now = Date.now();
    
    this.workers.forEach((workerInfo, workerId) => {
      const { worker, startTime } = workerInfo;
      const uptime = now - startTime;
      const stats = this.workerStats.get(worker.process.pid);
      
      if (stats) {
        const timeSinceLastStats = now - stats.timestamp;
        
        // Check if worker is responsive
        if (timeSinceLastStats > 60000) { // 1 minute
          logger.warn(`Worker ${worker.process.pid} hasn't reported stats for ${timeSinceLastStats}ms`);
        }
        
        // Check memory usage
        if (stats.memory > 1024 * 1024 * 1024) { // 1GB
          logger.warn(`Worker ${worker.process.pid} using high memory: ${Math.round(stats.memory / 1024 / 1024)}MB`);
        }
        
        // Check CPU usage
        if (stats.cpu > 90) {
          logger.warn(`Worker ${worker.process.pid} using high CPU: ${stats.cpu}%`);
        }
      }
    });
  }

  logClusterStats() {
    const totalWorkers = this.workers.size;
    const totalConnections = Array.from(this.workers.values())
      .reduce((sum, worker) => sum + worker.connections, 0);
    
    let totalMemory = 0;
    let totalCPU = 0;
    let activeWorkers = 0;
    
    this.workerStats.forEach(stats => {
      totalMemory += stats.memory;
      totalCPU += stats.cpu;
      activeWorkers++;
    });
    
    const avgMemory = activeWorkers > 0 ? totalMemory / activeWorkers : 0;
    const avgCPU = activeWorkers > 0 ? totalCPU / activeWorkers : 0;
    
    logger.info('Cluster Stats:', {
      totalWorkers,
      activeWorkers,
      totalConnections,
      avgMemoryMB: Math.round(avgMemory / 1024 / 1024),
      avgCPU: Math.round(avgCPU * 100) / 100,
      masterPID: process.pid
    });
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      logger.info(`Master received ${signal}, starting graceful shutdown...`);
      this.isShuttingDown = true;
      
      // Send shutdown signal to all workers
      const shutdownPromises = Array.from(this.workers.values()).map(({ worker }) => {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            logger.warn(`Force killing worker ${worker.process.pid}`);
            worker.kill('SIGKILL');
            resolve();
          }, 10000); // 10 second timeout
          
          worker.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          worker.kill('SIGTERM');
        });
      });
      
      // Wait for all workers to shut down
      await Promise.all(shutdownPromises);
      
      logger.info('All workers shut down, exiting master process');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  // Public API for getting cluster information
  getClusterInfo() {
    if (!cluster.isPrimary) return null;
    
    return {
      masterPID: process.pid,
      numWorkers: this.numWorkers,
      workers: Array.from(this.workers.entries()).map(([id, info]) => ({
        id,
        pid: info.worker.process.pid,
        uptime: Date.now() - info.startTime,
        connections: info.connections,
        stats: this.workerStats.get(info.worker.process.pid)
      }))
    };
  }
}

// Start cluster if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  new ClusterManager();
}

export { ClusterManager };