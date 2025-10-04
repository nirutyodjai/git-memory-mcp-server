/**
 * Performance Profiling Tools for Git Memory MCP Server
 *
 * Provides tools for profiling application performance, memory usage,
 * and identifying bottlenecks in Git operations.
 */

import os from 'os';
import v8 from 'v8';
import fs from 'fs/promises';
import path from 'path';

/**
 * Performance Profiler Service
 */
export class PerformanceProfiler {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './profiles';
    this.enabled = options.enabled || process.env.NODE_ENV === 'development';
    this.profiles = new Map();
    this.metrics = new Map();
  }

  /**
   * Initialize profiler
   */
  async initialize() {
    if (!this.enabled) {
      return;
    }

    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📊 Performance profiler initialized. Output dir: ${this.outputDir}`);
    } catch (error) {
      console.error('Failed to initialize performance profiler:', error);
    }
  }

  /**
   * Start profiling a code section
   */
  startProfile(name, metadata = {}) {
    if (!this.enabled) {
      return null;
    }

    const profileId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.profiles.set(profileId, {
      name,
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage(),
      startCpu: process.cpuUsage(),
      metadata,
      checkpoints: []
    });

    return profileId;
  }

  /**
   * Add checkpoint to profile
   */
  addCheckpoint(profileId, name, metadata = {}) {
    if (!this.enabled || !this.profiles.has(profileId)) {
      return;
    }

    const profile = this.profiles.get(profileId);
    const checkpoint = {
      name,
      timestamp: process.hrtime.bigint(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metadata
    };

    profile.checkpoints.push(checkpoint);
  }

  /**
   * End profiling and save results
   */
  async endProfile(profileId) {
    if (!this.enabled || !this.profiles.has(profileId)) {
      return null;
    }

    const profile = this.profiles.get(profileId);
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage();

    // Calculate duration
    const durationNs = endTime - profile.startTime;
    const durationMs = Number(durationNs) / 1000000;

    // Calculate memory delta
    const memoryDelta = {
      rss: endMemory.rss - profile.startMemory.rss,
      heapTotal: endMemory.heapTotal - profile.startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - profile.startMemory.heapUsed,
      external: endMemory.external - profile.startMemory.external
    };

    // Calculate CPU delta
    const cpuDelta = {
      user: endCpu.user - profile.startCpu.user,
      system: endCpu.system - profile.startCpu.system
    };

    const result = {
      id: profileId,
      name: profile.name,
      duration: durationMs,
      memoryDelta,
      cpuDelta,
      metadata: profile.metadata,
      checkpoints: profile.checkpoints.map((cp, index) => {
        const prevTime = index === 0 ? profile.startTime : profile.checkpoints[index - 1].timestamp;
        const checkpointDuration = Number(cp.timestamp - prevTime) / 1000000;

        return {
          name: cp.name,
          duration: checkpointDuration,
          memory: cp.memory,
          metadata: cp.metadata
        };
      })
    };

    this.profiles.delete(profileId);

    // Save profile to file
    await this.saveProfile(result);

    return result;
  }

  /**
   * Save profile to file
   */
  async saveProfile(profile) {
    try {
      const filename = `${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
      const filepath = path.join(this.outputDir, filename);

      await fs.writeFile(filepath, JSON.stringify(profile, null, 2));

      console.log(`📊 Profile saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  /**
   * Get system metrics snapshot
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      v8Heap: v8.getHeapStatistics(),
      timestamp: new Date().toISOString()
    };

    return systemInfo;
  }

  /**
   * Profile a function execution
   */
  async profileFunction(name, fn, metadata = {}) {
    const profileId = this.startProfile(name, metadata);

    try {
      const result = await fn();
      await this.endProfile(profileId);
      return result;
    } catch (error) {
      await this.endProfile(profileId);
      throw error;
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs = 5000) {
    if (!this.enabled) {
      return null;
    }

    const monitoringId = setInterval(async () => {
      const metrics = this.getSystemMetrics();

      // Save to metrics history
      if (!this.metrics.has('system')) {
        this.metrics.set('system', []);
      }

      const history = this.metrics.get('system');
      history.push(metrics);

      // Keep only last 1000 entries
      if (history.length > 1000) {
        history.shift();
      }

      // Log if memory usage is high
      const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
      if (memoryUsagePercent > 80) {
        console.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      }

    }, intervalMs);

    return monitoringId;
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(monitoringId) {
    if (monitoringId) {
      clearInterval(monitoringId);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    if (!this.enabled) {
      return null;
    }

    const report = {
      timestamp: new Date().toISOString(),
      systemInfo: this.getSystemMetrics(),
      profileCount: this.profiles.size,
      metricsCount: this.metrics.size,
      activeProfiles: Array.from(this.profiles.keys()),
      recentMetrics: this.metrics.get('system')?.slice(-10) || []
    };

    // Save report
    const filepath = path.join(this.outputDir, `performance_report_${Date.now()}.json`);
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));

    return report;
  }
}

/**
 * Git operation profiler
 */
export class GitOperationProfiler {
  constructor(profiler) {
    this.profiler = profiler;
  }

  /**
   * Profile Git status operation
   */
  async profileStatus(repoPath, options = {}) {
    return await this.profiler.profileFunction('git_status', async () => {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);
      return await simpleGit.status();
    }, { repoPath, ...options });
  }

  /**
   * Profile Git fetch operation
   */
  async profileFetch(repoPath, remote = 'origin', options = {}) {
    return await this.profiler.profileFunction('git_fetch', async () => {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);
      return await simpleGit.fetch(remote);
    }, { repoPath, remote, ...options });
  }

  /**
   * Profile Git clone operation
   */
  async profileClone(url, targetPath, options = {}) {
    return await this.profiler.profileFunction('git_clone', async () => {
      const git = await import('simple-git');
      const simpleGit = git.default();
      return await simpleGit.clone(url, targetPath, options);
    }, { url, targetPath, ...options });
  }

  /**
   * Profile Git push operation
   */
  async profilePush(repoPath, remote = 'origin', branch = 'main', options = {}) {
    return await this.profiler.profileFunction('git_push', async () => {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);
      return await simpleGit.push(remote, branch, options);
    }, { repoPath, remote, branch, ...options });
  }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  constructor(profiler) {
    this.profiler = profiler;
    this.baselines = new Map();
  }

  /**
   * Create memory baseline
   */
  createBaseline(name) {
    const baseline = {
      name,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      heapStats: v8.getHeapStatistics()
    };

    this.baselines.set(name, baseline);
    return baseline;
  }

  /**
   * Check for memory leaks
   */
  detectLeaks(baselineName, thresholdPercent = 50) {
    const baseline = this.baselines.get(baselineName);
    if (!baseline) {
      return { detected: false, reason: 'No baseline found' };
    }

    const currentMemory = process.memoryUsage();
    const currentHeap = v8.getHeapStatistics();

    const results = {
      detected: false,
      baseline,
      current: {
        timestamp: Date.now(),
        memoryUsage: currentMemory,
        heapStats: currentHeap
      },
      differences: {},
      recommendations: []
    };

    // Check RSS memory
    const rssDiff = currentMemory.rss - baseline.memoryUsage.rss;
    const rssPercent = (rssDiff / baseline.memoryUsage.rss) * 100;

    if (rssPercent > thresholdPercent) {
      results.detected = true;
      results.differences.rss = {
        baseline: baseline.memoryUsage.rss,
        current: currentMemory.rss,
        diff: rssDiff,
        percent: rssPercent
      };
      results.recommendations.push(`RSS memory increased by ${rssPercent.toFixed(2)}%`);
    }

    // Check heap usage
    const heapDiff = currentMemory.heapUsed - baseline.memoryUsage.heapUsed;
    const heapPercent = (heapDiff / baseline.memoryUsage.heapUsed) * 100;

    if (heapPercent > thresholdPercent) {
      results.detected = true;
      results.differences.heap = {
        baseline: baseline.memoryUsage.heapUsed,
        current: currentMemory.heapUsed,
        diff: heapDiff,
        percent: heapPercent
      };
      results.recommendations.push(`Heap usage increased by ${heapPercent.toFixed(2)}%`);
    }

    return results;
  }
}

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(profiler) {
  return async (req, res, next) => {
    if (!profiler || !profiler.enabled) {
      return next();
    }

    const profileId = profiler.startProfile(`http_${req.method}_${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      profiler.addCheckpoint(profileId, 'response_end', {
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length') || (chunk ? chunk.length : 0)
      });

      profiler.endProfile(profileId);
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

// Export profiler instance
export { PerformanceProfiler, GitOperationProfiler, MemoryLeakDetector };
