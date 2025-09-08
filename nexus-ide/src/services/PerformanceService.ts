/**
 * Performance Service
 * 
 * Advanced performance monitoring and optimization system for NEXUS IDE.
 * Tracks system metrics, identifies bottlenecks, and provides optimization suggestions.
 * 
 * Features:
 * - Real-time performance monitoring
 * - Memory usage tracking
 * - CPU utilization monitoring
 * - Network performance analysis
 * - Bundle size optimization
 * - Code splitting recommendations
 * - Lazy loading management
 * - Performance profiling
 * - Bottleneck detection
 * - Auto-optimization
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface PerformanceConfig {
  monitoring: {
    interval: number;
    retentionPeriod: number;
    alertThresholds: {
      memory: number;
      cpu: number;
      networkLatency: number;
      bundleSize: number;
    };
  };
  optimization: {
    autoOptimize: boolean;
    lazyLoadThreshold: number;
    codeSplittingEnabled: boolean;
    compressionEnabled: boolean;
  };
  profiling: {
    enabled: boolean;
    sampleRate: number;
    maxSamples: number;
  };
}

export interface PerformanceMetrics {
  timestamp: Date;
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  network: {
    latency: number;
    bandwidth: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  rendering: {
    fps: number;
    frameTime: number;
    paintTime: number;
    layoutTime: number;
  };
  bundle: {
    totalSize: number;
    gzippedSize: number;
    chunkCount: number;
    duplicateModules: string[];
  };
  userInteraction: {
    inputLatency: number;
    scrollPerformance: number;
    clickResponseTime: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'cpu' | 'network' | 'rendering' | 'bundle' | 'interaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  suggestions: string[];
}

export interface OptimizationSuggestion {
  id: string;
  type: 'code_splitting' | 'lazy_loading' | 'bundle_optimization' | 'memory_cleanup' | 'caching';
  priority: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: number;
  effort: 'low' | 'medium' | 'high';
}

export interface PerformanceProfile {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  samples: PerformanceSample[];
  summary: {
    averageMemory: number;
    peakMemory: number;
    averageCPU: number;
    peakCPU: number;
    totalAllocations: number;
    gcCount: number;
  };
}

export interface PerformanceSample {
  timestamp: Date;
  stackTrace: string[];
  memory: number;
  cpu: number;
  duration: number;
}

export interface BundleAnalysis {
  modules: ModuleInfo[];
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  duplicates: DuplicateInfo[];
  recommendations: OptimizationSuggestion[];
}

export interface ModuleInfo {
  id: string;
  name: string;
  size: number;
  gzippedSize: number;
  chunks: string[];
  dependencies: string[];
  isEntry: boolean;
  isAsync: boolean;
}

export interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
  isAsync: boolean;
  parents: string[];
  children: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usageCount: number;
  isDevDependency: boolean;
  alternatives: string[];
}

export interface DuplicateInfo {
  module: string;
  instances: {
    chunk: string;
    size: number;
    version?: string;
  }[];
  totalWaste: number;
}

class PerformanceService extends EventEmitter {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private suggestions: OptimizationSuggestion[] = [];
  private profiles: PerformanceProfile[] = [];
  private currentProfile?: PerformanceProfile;
  private monitoringInterval?: NodeJS.Timeout;
  private observer?: PerformanceObserver;
  private isInitialized = false;

  constructor(config?: Partial<PerformanceConfig>) {
    super();
    this.config = {
      monitoring: {
        interval: 5000, // 5 seconds
        retentionPeriod: 3600000, // 1 hour
        alertThresholds: {
          memory: 80, // 80%
          cpu: 70, // 70%
          networkLatency: 1000, // 1 second
          bundleSize: 5242880 // 5MB
        },
        ...config?.monitoring
      },
      optimization: {
        autoOptimize: true,
        lazyLoadThreshold: 1048576, // 1MB
        codeSplittingEnabled: true,
        compressionEnabled: true,
        ...config?.optimization
      },
      profiling: {
        enabled: true,
        sampleRate: 100, // 100ms
        maxSamples: 10000,
        ...config?.profiling
      }
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('metrics_collected', this.analyzeMetrics.bind(this));
    this.on('alert_triggered', this.handleAlert.bind(this));
    this.on('optimization_suggested', this.handleOptimizationSuggestion.bind(this));
  }

  async initialize(): Promise<void> {
    try {
      await this.setupPerformanceObserver();
      await this.startMonitoring();
      await this.analyzeBundleSize();
      
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async setupPerformanceObserver(): Promise<void> {
    if (typeof PerformanceObserver !== 'undefined') {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.processPerformanceEntry(entry);
        });
      });

      this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'measure':
        this.processMeasureEntry(entry as PerformanceMeasure);
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstByte: entry.responseStart - entry.requestStart,
      domInteractive: entry.domInteractive - entry.navigationStart
    };

    this.emit('navigation_metrics', metrics);
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceMetrics = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    this.emit('resource_metrics', resourceMetrics);
  }

  private processPaintEntry(entry: PerformancePaintTiming): void {
    const paintMetrics = {
      name: entry.name,
      startTime: entry.startTime
    };

    this.emit('paint_metrics', paintMetrics);
  }

  private processMeasureEntry(entry: PerformanceMeasure): void {
    const measureMetrics = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    };

    this.emit('measure_metrics', measureMetrics);
  }

  private async startMonitoring(): Promise<void> {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        this.emit('metrics_collected', metrics);
        
        // Cleanup old metrics
        this.cleanupOldMetrics();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.config.monitoring.interval);
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    const memory = await this.getMemoryMetrics();
    const cpu = await this.getCPUMetrics();
    const network = await this.getNetworkMetrics();
    const rendering = await this.getRenderingMetrics();
    const bundle = await this.getBundleMetrics();
    const userInteraction = await this.getUserInteractionMetrics();

    return {
      timestamp: new Date(),
      memory,
      cpu,
      network,
      rendering,
      bundle,
      userInteraction
    };
  }

  private async getMemoryMetrics(): Promise<PerformanceMetrics['memory']> {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.totalJSHeapSize - memory.usedJSHeapSize
      };
    }

    // Fallback for environments without memory API
    return {
      used: 0,
      total: 0,
      percentage: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    };
  }

  private async getCPUMetrics(): Promise<PerformanceMetrics['cpu']> {
    // CPU metrics would typically come from a native module or system API
    // For browser environment, we can estimate based on performance timing
    const startTime = performance.now();
    
    // Perform a small computation to estimate CPU load
    let iterations = 0;
    const endTime = startTime + 10; // 10ms sample
    
    while (performance.now() < endTime) {
      iterations++;
    }
    
    const actualTime = performance.now() - startTime;
    const cpuUsage = Math.min(100, (actualTime / 10) * 100);

    return {
      usage: cpuUsage,
      cores: navigator.hardwareConcurrency || 4,
      loadAverage: [cpuUsage, cpuUsage, cpuUsage] // Simplified
    };
  }

  private async getNetworkMetrics(): Promise<PerformanceMetrics['network']> {
    const connection = (navigator as any).connection;
    const networkInfo = {
      latency: 0,
      bandwidth: connection?.downlink || 0,
      requestsPerSecond: 0,
      errorRate: 0
    };

    // Measure latency with a small request
    try {
      const startTime = performance.now();
      await fetch('/api/ping', { method: 'HEAD' });
      networkInfo.latency = performance.now() - startTime;
    } catch (error) {
      networkInfo.latency = 9999; // High latency for failed requests
    }

    return networkInfo;
  }

  private async getRenderingMetrics(): Promise<PerformanceMetrics['rendering']> {
    let fps = 60; // Default assumption
    let frameTime = 16.67; // 1000ms / 60fps
    
    // Measure actual FPS if possible
    if (typeof requestAnimationFrame !== 'undefined') {
      const frames: number[] = [];
      const measureFPS = () => {
        frames.push(performance.now());
        if (frames.length > 60) {
          frames.shift();
        }
        
        if (frames.length >= 2) {
          const timeDiff = frames[frames.length - 1] - frames[0];
          fps = Math.round((frames.length - 1) * 1000 / timeDiff);
          frameTime = 1000 / fps;
        }
      };
      
      requestAnimationFrame(measureFPS);
    }

    return {
      fps,
      frameTime,
      paintTime: 0, // Would be measured from paint entries
      layoutTime: 0  // Would be measured from layout entries
    };
  }

  private async getBundleMetrics(): Promise<PerformanceMetrics['bundle']> {
    // This would typically analyze the webpack bundle
    // For now, we'll return estimated values
    return {
      totalSize: 2048000, // 2MB estimated
      gzippedSize: 512000, // 512KB estimated
      chunkCount: 5,
      duplicateModules: []
    };
  }

  private async getUserInteractionMetrics(): Promise<PerformanceMetrics['userInteraction']> {
    return {
      inputLatency: 0, // Would be measured from input events
      scrollPerformance: 60, // FPS during scrolling
      clickResponseTime: 0 // Time from click to response
    };
  }

  private analyzeMetrics(metrics: PerformanceMetrics): void {
    // Check for alerts
    this.checkMemoryAlert(metrics.memory);
    this.checkCPUAlert(metrics.cpu);
    this.checkNetworkAlert(metrics.network);
    this.checkRenderingAlert(metrics.rendering);
    
    // Generate optimization suggestions
    this.generateOptimizationSuggestions(metrics);
  }

  private checkMemoryAlert(memory: PerformanceMetrics['memory']): void {
    if (memory.percentage > this.config.monitoring.alertThresholds.memory) {
      this.createAlert({
        type: 'memory',
        severity: memory.percentage > 90 ? 'critical' : 'high',
        message: `High memory usage: ${memory.percentage.toFixed(1)}%`,
        value: memory.percentage,
        threshold: this.config.monitoring.alertThresholds.memory,
        suggestions: [
          'Close unused tabs or applications',
          'Clear browser cache',
          'Restart the application',
          'Check for memory leaks in code'
        ]
      });
    }
  }

  private checkCPUAlert(cpu: PerformanceMetrics['cpu']): void {
    if (cpu.usage > this.config.monitoring.alertThresholds.cpu) {
      this.createAlert({
        type: 'cpu',
        severity: cpu.usage > 85 ? 'critical' : 'high',
        message: `High CPU usage: ${cpu.usage.toFixed(1)}%`,
        value: cpu.usage,
        threshold: this.config.monitoring.alertThresholds.cpu,
        suggestions: [
          'Close resource-intensive applications',
          'Optimize code performance',
          'Use web workers for heavy computations',
          'Enable code splitting and lazy loading'
        ]
      });
    }
  }

  private checkNetworkAlert(network: PerformanceMetrics['network']): void {
    if (network.latency > this.config.monitoring.alertThresholds.networkLatency) {
      this.createAlert({
        type: 'network',
        severity: network.latency > 2000 ? 'critical' : 'medium',
        message: `High network latency: ${network.latency.toFixed(0)}ms`,
        value: network.latency,
        threshold: this.config.monitoring.alertThresholds.networkLatency,
        suggestions: [
          'Check internet connection',
          'Use CDN for static assets',
          'Enable compression',
          'Implement caching strategies'
        ]
      });
    }
  }

  private checkRenderingAlert(rendering: PerformanceMetrics['rendering']): void {
    if (rendering.fps < 30) {
      this.createAlert({
        type: 'rendering',
        severity: rendering.fps < 15 ? 'critical' : 'high',
        message: `Low frame rate: ${rendering.fps} FPS`,
        value: rendering.fps,
        threshold: 30,
        suggestions: [
          'Optimize CSS animations',
          'Reduce DOM complexity',
          'Use hardware acceleration',
          'Implement virtual scrolling'
        ]
      });
    }
  }

  private generateOptimizationSuggestions(metrics: PerformanceMetrics): void {
    // Bundle size optimization
    if (metrics.bundle.totalSize > this.config.monitoring.alertThresholds.bundleSize) {
      this.createOptimizationSuggestion({
        type: 'bundle_optimization',
        priority: 'high',
        description: 'Bundle size is larger than recommended',
        impact: 'Reduce initial load time and improve user experience',
        implementation: 'Enable code splitting, tree shaking, and compression',
        estimatedImprovement: 30,
        effort: 'medium'
      });
    }

    // Memory optimization
    if (metrics.memory.percentage > 70) {
      this.createOptimizationSuggestion({
        type: 'memory_cleanup',
        priority: 'medium',
        description: 'High memory usage detected',
        impact: 'Prevent memory leaks and improve stability',
        implementation: 'Implement proper cleanup in components and services',
        estimatedImprovement: 20,
        effort: 'low'
      });
    }

    // Lazy loading suggestion
    if (metrics.bundle.chunkCount < 3 && metrics.bundle.totalSize > 1048576) {
      this.createOptimizationSuggestion({
        type: 'lazy_loading',
        priority: 'medium',
        description: 'Large bundle could benefit from lazy loading',
        impact: 'Faster initial page load',
        implementation: 'Implement route-based code splitting and lazy loading',
        estimatedImprovement: 25,
        effort: 'medium'
      });
    }
  }

  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: PerformanceAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      resolved: false,
      ...alert
    };

    this.alerts.push(newAlert);
    this.emit('alert_triggered', newAlert);
  }

  private createOptimizationSuggestion(suggestion: Omit<OptimizationSuggestion, 'id'>): void {
    const newSuggestion: OptimizationSuggestion = {
      id: crypto.randomUUID(),
      ...suggestion
    };

    // Check if similar suggestion already exists
    const existingSuggestion = this.suggestions.find(s => 
      s.type === newSuggestion.type && s.description === newSuggestion.description
    );

    if (!existingSuggestion) {
      this.suggestions.push(newSuggestion);
      this.emit('optimization_suggested', newSuggestion);
    }
  }

  private handleAlert(alert: PerformanceAlert): void {
    // Handle alert based on severity and type
    if (this.config.optimization.autoOptimize && alert.severity === 'critical') {
      this.autoOptimize(alert);
    }
  }

  private handleOptimizationSuggestion(suggestion: OptimizationSuggestion): void {
    // Handle optimization suggestion
    if (this.config.optimization.autoOptimize && suggestion.priority === 'high') {
      this.implementOptimization(suggestion);
    }
  }

  private autoOptimize(alert: PerformanceAlert): void {
    switch (alert.type) {
      case 'memory':
        this.optimizeMemory();
        break;
      case 'bundle':
        this.optimizeBundle();
        break;
      case 'rendering':
        this.optimizeRendering();
        break;
    }
  }

  private implementOptimization(suggestion: OptimizationSuggestion): void {
    switch (suggestion.type) {
      case 'lazy_loading':
        this.enableLazyLoading();
        break;
      case 'code_splitting':
        this.enableCodeSplitting();
        break;
      case 'bundle_optimization':
        this.optimizeBundle();
        break;
    }
  }

  private optimizeMemory(): void {
    // Trigger garbage collection if available
    if (typeof gc !== 'undefined') {
      gc();
    }
    
    // Clear caches
    this.emit('clear_caches');
  }

  private optimizeBundle(): void {
    // Enable compression
    this.config.optimization.compressionEnabled = true;
    
    // Enable code splitting
    this.config.optimization.codeSplittingEnabled = true;
    
    this.emit('bundle_optimized');
  }

  private optimizeRendering(): void {
    // Enable hardware acceleration
    document.body.style.transform = 'translateZ(0)';
    
    this.emit('rendering_optimized');
  }

  private enableLazyLoading(): void {
    this.emit('enable_lazy_loading');
  }

  private enableCodeSplitting(): void {
    this.config.optimization.codeSplittingEnabled = true;
    this.emit('enable_code_splitting');
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.monitoring.retentionPeriod;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > cutoff);
  }

  // Profiling Methods
  startProfiling(name: string): string {
    const profile: PerformanceProfile = {
      id: crypto.randomUUID(),
      name,
      startTime: new Date(),
      samples: [],
      summary: {
        averageMemory: 0,
        peakMemory: 0,
        averageCPU: 0,
        peakCPU: 0,
        totalAllocations: 0,
        gcCount: 0
      }
    };

    this.currentProfile = profile;
    this.profiles.push(profile);

    // Start sampling
    if (this.config.profiling.enabled) {
      this.startSampling();
    }

    return profile.id;
  }

  stopProfiling(): PerformanceProfile | null {
    if (!this.currentProfile) return null;

    this.currentProfile.endTime = new Date();
    this.currentProfile.duration = this.currentProfile.endTime.getTime() - this.currentProfile.startTime.getTime();
    
    // Calculate summary
    this.calculateProfileSummary(this.currentProfile);
    
    const profile = this.currentProfile;
    this.currentProfile = undefined;
    
    return profile;
  }

  private startSampling(): void {
    if (!this.currentProfile) return;

    const sampleInterval = setInterval(async () => {
      if (!this.currentProfile || this.currentProfile.samples.length >= this.config.profiling.maxSamples) {
        clearInterval(sampleInterval);
        return;
      }

      const sample = await this.collectSample();
      this.currentProfile.samples.push(sample);
    }, this.config.profiling.sampleRate);
  }

  private async collectSample(): Promise<PerformanceSample> {
    const memory = await this.getMemoryMetrics();
    const cpu = await this.getCPUMetrics();
    
    return {
      timestamp: new Date(),
      stackTrace: this.getStackTrace(),
      memory: memory.used,
      cpu: cpu.usage,
      duration: 0 // Would be calculated based on execution time
    };
  }

  private getStackTrace(): string[] {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(2) : [];
  }

  private calculateProfileSummary(profile: PerformanceProfile): void {
    if (profile.samples.length === 0) return;

    const memoryValues = profile.samples.map(s => s.memory);
    const cpuValues = profile.samples.map(s => s.cpu);

    profile.summary = {
      averageMemory: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
      peakMemory: Math.max(...memoryValues),
      averageCPU: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
      peakCPU: Math.max(...cpuValues),
      totalAllocations: 0, // Would be calculated from memory allocations
      gcCount: 0 // Would be calculated from GC events
    };
  }

  // Bundle Analysis
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    // This would typically integrate with webpack-bundle-analyzer
    // For now, we'll return mock data
    const analysis: BundleAnalysis = {
      modules: [],
      chunks: [],
      dependencies: [],
      duplicates: [],
      recommendations: []
    };

    // Generate recommendations based on analysis
    analysis.recommendations = this.generateBundleRecommendations(analysis);

    return analysis;
  }

  private generateBundleRecommendations(analysis: BundleAnalysis): OptimizationSuggestion[] {
    const recommendations: OptimizationSuggestion[] = [];

    // Add recommendations based on bundle analysis
    if (analysis.duplicates.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'bundle_optimization',
        priority: 'high',
        description: 'Duplicate modules detected in bundle',
        impact: 'Reduce bundle size and improve load times',
        implementation: 'Configure webpack to eliminate duplicate modules',
        estimatedImprovement: 15,
        effort: 'medium'
      });
    }

    return recommendations;
  }

  // Public API Methods
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(limit = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  getAllAlerts(limit = 100): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  getOptimizationSuggestions(): OptimizationSuggestion[] {
    return this.suggestions;
  }

  getProfiles(): PerformanceProfile[] {
    return this.profiles;
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alert_resolved', alert);
    }
  }

  dismissSuggestion(suggestionId: string): void {
    const index = this.suggestions.findIndex(s => s.id === suggestionId);
    if (index !== -1) {
      const suggestion = this.suggestions.splice(index, 1)[0];
      this.emit('suggestion_dismissed', suggestion);
    }
  }

  getPerformanceSummary(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    metrics: {
      memory: number;
      cpu: number;
      network: number;
      rendering: number;
    };
    alerts: number;
    suggestions: number;
  } {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        overall: 'poor',
        score: 0,
        metrics: { memory: 0, cpu: 0, network: 0, rendering: 0 },
        alerts: 0,
        suggestions: 0
      };
    }

    const memoryScore = Math.max(0, 100 - current.memory.percentage);
    const cpuScore = Math.max(0, 100 - current.cpu.usage);
    const networkScore = Math.max(0, 100 - (current.network.latency / 10));
    const renderingScore = Math.min(100, (current.rendering.fps / 60) * 100);

    const overallScore = (memoryScore + cpuScore + networkScore + renderingScore) / 4;
    
    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallScore >= 90) overall = 'excellent';
    else if (overallScore >= 70) overall = 'good';
    else if (overallScore >= 50) overall = 'fair';
    else overall = 'poor';

    return {
      overall,
      score: overallScore,
      metrics: {
        memory: memoryScore,
        cpu: cpuScore,
        network: networkScore,
        rendering: renderingScore
      },
      alerts: this.getActiveAlerts().length,
      suggestions: this.suggestions.length
    };
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default PerformanceService;