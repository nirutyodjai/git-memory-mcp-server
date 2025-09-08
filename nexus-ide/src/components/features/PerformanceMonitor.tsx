/**
 * Performance Monitor Component
 * 
 * Features:
 * - Real-time system monitoring
 * - Code performance analysis
 * - Memory usage tracking
 * - CPU utilization monitoring
 * - Network activity tracking
 * - Bundle size analysis
 * - Performance recommendations
 * - Historical performance data
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Monitor, 
  Gauge, 
  Timer, 
  FileText, 
  Package, 
  Layers, 
  Settings, 
  RefreshCw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Calendar,
  Archive
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { toast } from 'sonner';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  history: { timestamp: Date; value: number }[];
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
  };
  disk: {
    used: number;
    total: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  };
}

export interface CodeMetrics {
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  memoryLeaks: number;
  unusedCode: number;
  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
  };
}

export interface PerformanceIssue {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'performance' | 'memory' | 'security' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  file?: string;
  line?: number;
  timestamp: Date;
}

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  duration: number;
  metrics: {
    system: SystemMetrics;
    code: CodeMetrics;
  };
  issues: PerformanceIssue[];
  score: number;
  recommendations: string[];
}

export interface PerformanceMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onIssueDetected?: (issue: PerformanceIssue) => void;
  onReportGenerated?: (report: PerformanceReport) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 5000,
  onIssueDetected,
  onReportGenerated
}) => {
  const { state: aiState, actions: aiActions } = useAI();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [codeMetrics, setCodeMetrics] = useState<CodeMetrics | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetric[]>([]);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'system' | 'code' | 'issues' | 'reports'>('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Start/stop monitoring
  useEffect(() => {
    if (isMonitoring && autoRefresh) {
      intervalRef.current = setInterval(() => {
        collectMetrics();
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, autoRefresh, refreshInterval]);

  // Initial metrics collection
  useEffect(() => {
    collectMetrics();
  }, []);

  const collectMetrics = useCallback(async () => {
    try {
      // Collect system metrics
      const systemMetrics = await collectSystemMetrics();
      setCurrentMetrics(systemMetrics);
      
      // Collect code metrics
      const codeMetrics = await collectCodeMetrics();
      setCodeMetrics(codeMetrics);
      
      // Update performance history
      updatePerformanceHistory(systemMetrics, codeMetrics);
      
      // Analyze for issues
      const detectedIssues = await analyzePerformanceIssues(systemMetrics, codeMetrics);
      setIssues(prev => [...prev, ...detectedIssues]);
      
      // Notify about new issues
      detectedIssues.forEach(issue => {
        onIssueDetected?.(issue);
        if (issue.impact === 'critical') {
          toast.error(`Critical performance issue: ${issue.title}`);
        } else if (issue.impact === 'high') {
          toast.warning(`Performance warning: ${issue.title}`);
        }
      });
      
    } catch (error) {
      console.error('Metrics collection error:', error);
      toast.error('Failed to collect performance metrics');
    }
  }, [onIssueDetected]);

  const collectSystemMetrics = useCallback(async (): Promise<SystemMetrics> => {
    // Simulate system metrics collection
    // In a real implementation, this would use system APIs or performance observers
    
    const cpuUsage = Math.random() * 100;
    const memoryUsed = Math.random() * 8 * 1024 * 1024 * 1024; // 8GB max
    const memoryTotal = 8 * 1024 * 1024 * 1024;
    
    return {
      cpu: {
        usage: cpuUsage,
        cores: navigator.hardwareConcurrency || 4,
        frequency: 2400 + Math.random() * 1000
      },
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        available: memoryTotal - memoryUsed
      },
      disk: {
        used: Math.random() * 500 * 1024 * 1024 * 1024,
        total: 500 * 1024 * 1024 * 1024,
        readSpeed: 100 + Math.random() * 400,
        writeSpeed: 80 + Math.random() * 300
      },
      network: {
        downloadSpeed: Math.random() * 100,
        uploadSpeed: Math.random() * 50,
        latency: 10 + Math.random() * 90
      }
    };
  }, []);

  const collectCodeMetrics = useCallback(async (): Promise<CodeMetrics> => {
    // Simulate code metrics collection
    // In a real implementation, this would analyze the actual codebase
    
    return {
      bundleSize: 1024 * 1024 + Math.random() * 5 * 1024 * 1024, // 1-6MB
      loadTime: 500 + Math.random() * 2000, // 0.5-2.5s
      renderTime: 16 + Math.random() * 50, // 16-66ms
      memoryLeaks: Math.floor(Math.random() * 5),
      unusedCode: Math.random() * 30, // 0-30%
      dependencies: {
        total: 150 + Math.floor(Math.random() * 100),
        outdated: Math.floor(Math.random() * 20),
        vulnerable: Math.floor(Math.random() * 5)
      }
    };
  }, []);

  const updatePerformanceHistory = useCallback((systemMetrics: SystemMetrics, codeMetrics: CodeMetrics) => {
    const timestamp = new Date();
    
    const newMetrics: PerformanceMetric[] = [
      {
        id: 'cpu-usage',
        name: 'CPU Usage',
        value: systemMetrics.cpu.usage,
        unit: '%',
        threshold: { warning: 70, critical: 90 },
        trend: 'stable',
        history: [{ timestamp, value: systemMetrics.cpu.usage }]
      },
      {
        id: 'memory-usage',
        name: 'Memory Usage',
        value: (systemMetrics.memory.used / systemMetrics.memory.total) * 100,
        unit: '%',
        threshold: { warning: 80, critical: 95 },
        trend: 'stable',
        history: [{ timestamp, value: (systemMetrics.memory.used / systemMetrics.memory.total) * 100 }]
      },
      {
        id: 'bundle-size',
        name: 'Bundle Size',
        value: codeMetrics.bundleSize / (1024 * 1024),
        unit: 'MB',
        threshold: { warning: 5, critical: 10 },
        trend: 'stable',
        history: [{ timestamp, value: codeMetrics.bundleSize / (1024 * 1024) }]
      },
      {
        id: 'load-time',
        name: 'Load Time',
        value: codeMetrics.loadTime,
        unit: 'ms',
        threshold: { warning: 2000, critical: 5000 },
        trend: 'stable',
        history: [{ timestamp, value: codeMetrics.loadTime }]
      }
    ];
    
    setPerformanceHistory(prev => {
      const updated = [...prev];
      
      newMetrics.forEach(newMetric => {
        const existingIndex = updated.findIndex(m => m.id === newMetric.id);
        if (existingIndex >= 0) {
          const existing = updated[existingIndex];
          const updatedHistory = [...existing.history, ...newMetric.history].slice(-100); // Keep last 100 points
          
          // Calculate trend
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (updatedHistory.length >= 2) {
            const recent = updatedHistory.slice(-5).map(h => h.value);
            const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const prevAvg = updatedHistory.slice(-10, -5).map(h => h.value).reduce((a, b) => a + b, 0) / 5;
            
            if (avg > prevAvg * 1.1) trend = 'up';
            else if (avg < prevAvg * 0.9) trend = 'down';
          }
          
          updated[existingIndex] = {
            ...existing,
            value: newMetric.value,
            trend,
            history: updatedHistory
          };
        } else {
          updated.push(newMetric);
        }
      });
      
      return updated;
    });
  }, []);

  const analyzePerformanceIssues = useCallback(async (systemMetrics: SystemMetrics, codeMetrics: CodeMetrics): Promise<PerformanceIssue[]> => {
    const issues: PerformanceIssue[] = [];
    const timestamp = new Date();
    
    // CPU usage issues
    if (systemMetrics.cpu.usage > 90) {
      issues.push({
        id: `cpu-critical-${timestamp.getTime()}`,
        type: 'error',
        category: 'performance',
        title: 'Critical CPU Usage',
        description: `CPU usage is at ${systemMetrics.cpu.usage.toFixed(1)}%, which may cause system slowdown.`,
        impact: 'critical',
        recommendation: 'Close unnecessary applications or optimize CPU-intensive code.',
        timestamp
      });
    } else if (systemMetrics.cpu.usage > 70) {
      issues.push({
        id: `cpu-warning-${timestamp.getTime()}`,
        type: 'warning',
        category: 'performance',
        title: 'High CPU Usage',
        description: `CPU usage is at ${systemMetrics.cpu.usage.toFixed(1)}%.`,
        impact: 'medium',
        recommendation: 'Monitor CPU usage and consider optimizing performance-critical code.',
        timestamp
      });
    }
    
    // Memory usage issues
    const memoryUsagePercent = (systemMetrics.memory.used / systemMetrics.memory.total) * 100;
    if (memoryUsagePercent > 95) {
      issues.push({
        id: `memory-critical-${timestamp.getTime()}`,
        type: 'error',
        category: 'memory',
        title: 'Critical Memory Usage',
        description: `Memory usage is at ${memoryUsagePercent.toFixed(1)}%.`,
        impact: 'critical',
        recommendation: 'Close applications or increase system memory.',
        timestamp
      });
    }
    
    // Bundle size issues
    const bundleSizeMB = codeMetrics.bundleSize / (1024 * 1024);
    if (bundleSizeMB > 10) {
      issues.push({
        id: `bundle-large-${timestamp.getTime()}`,
        type: 'warning',
        category: 'optimization',
        title: 'Large Bundle Size',
        description: `Bundle size is ${bundleSizeMB.toFixed(1)}MB, which may affect load times.`,
        impact: 'medium',
        recommendation: 'Consider code splitting, tree shaking, or removing unused dependencies.',
        timestamp
      });
    }
    
    // Load time issues
    if (codeMetrics.loadTime > 5000) {
      issues.push({
        id: `load-slow-${timestamp.getTime()}`,
        type: 'error',
        category: 'performance',
        title: 'Slow Load Time',
        description: `Application load time is ${codeMetrics.loadTime}ms.`,
        impact: 'high',
        recommendation: 'Optimize bundle size, use lazy loading, or implement caching strategies.',
        timestamp
      });
    }
    
    // Memory leaks
    if (codeMetrics.memoryLeaks > 0) {
      issues.push({
        id: `memory-leaks-${timestamp.getTime()}`,
        type: 'warning',
        category: 'memory',
        title: 'Memory Leaks Detected',
        description: `${codeMetrics.memoryLeaks} potential memory leaks found.`,
        impact: 'medium',
        recommendation: 'Review event listeners, timers, and component cleanup.',
        timestamp
      });
    }
    
    // Vulnerable dependencies
    if (codeMetrics.dependencies.vulnerable > 0) {
      issues.push({
        id: `deps-vulnerable-${timestamp.getTime()}`,
        type: 'error',
        category: 'security',
        title: 'Vulnerable Dependencies',
        description: `${codeMetrics.dependencies.vulnerable} dependencies have known vulnerabilities.`,
        impact: 'high',
        recommendation: 'Update vulnerable dependencies to their latest secure versions.',
        timestamp
      });
    }
    
    return issues;
  }, []);

  const generatePerformanceReport = useCallback(async () => {
    if (!currentMetrics || !codeMetrics) {
      toast.error('No metrics available for report generation');
      return;
    }
    
    try {
      // Calculate performance score
      let score = 100;
      
      // Deduct points for issues
      const criticalIssues = issues.filter(i => i.impact === 'critical').length;
      const highIssues = issues.filter(i => i.impact === 'high').length;
      const mediumIssues = issues.filter(i => i.impact === 'medium').length;
      
      score -= criticalIssues * 25;
      score -= highIssues * 15;
      score -= mediumIssues * 10;
      score = Math.max(0, score);
      
      // Generate AI recommendations
      const aiRecommendations = await aiActions.generateSuggestion({
        prompt: `Analyze these performance metrics and provide optimization recommendations: ${JSON.stringify({
          system: currentMetrics,
          code: codeMetrics,
          issues: issues.slice(-10)
        })}`,
        context: {
          type: 'performance-analysis',
          metrics: { system: currentMetrics, code: codeMetrics },
          issues: issues
        }
      });
      
      const report: PerformanceReport = {
        id: Date.now().toString(),
        timestamp: new Date(),
        duration: 0, // Would be calculated in real implementation
        metrics: {
          system: currentMetrics,
          code: codeMetrics
        },
        issues: issues.slice(-20), // Last 20 issues
        score,
        recommendations: aiRecommendations.content.split('\n').filter(r => r.trim())
      };
      
      setReports(prev => [report, ...prev.slice(0, 9)]); // Keep last 10 reports
      onReportGenerated?.(report);
      
      toast.success('Performance report generated successfully');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate performance report');
    }
  }, [currentMetrics, codeMetrics, issues, aiActions, onReportGenerated]);

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getMetricStatus = useCallback((metric: PerformanceMetric) => {
    if (metric.value >= metric.threshold.critical) return 'critical';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'good';
  }, []);

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = filterCategory === 'all' || issue.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {performanceHistory.slice(0, 4).map(metric => {
          const status = getMetricStatus(metric);
          return (
            <div key={metric.id} className="p-3 border border-border rounded-lg bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                {metric.trend === 'stable' && <Activity className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-lg font-bold ${
                  status === 'critical' ? 'text-red-500' :
                  status === 'warning' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {metric.value.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">{metric.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Recent Issues */}
      <div className="border border-border rounded-lg bg-background">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold">Recent Issues</h3>
        </div>
        <div className="p-3">
          {issues.slice(0, 5).length > 0 ? (
            <div className="space-y-2">
              {issues.slice(0, 5).map(issue => (
                <div key={issue.id} className="flex items-start gap-3 p-2 hover:bg-accent rounded-md">
                  {issue.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />}
                  {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                  {issue.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{issue.title}</div>
                    <div className="text-xs text-muted-foreground">{issue.description}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    issue.impact === 'critical' ? 'bg-red-500/10 text-red-500' :
                    issue.impact === 'high' ? 'bg-orange-500/10 text-orange-500' :
                    issue.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {issue.impact}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              No performance issues detected
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSystemMetrics = () => (
    <div className="space-y-4">
      {currentMetrics && (
        <>
          {/* CPU */}
          <div className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5" />
              <h3 className="font-semibold">CPU</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Usage</div>
                <div className="text-lg font-bold">{currentMetrics.cpu.usage.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cores</div>
                <div className="text-lg font-bold">{currentMetrics.cpu.cores}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Frequency</div>
                <div className="text-lg font-bold">{currentMetrics.cpu.frequency.toFixed(0)} MHz</div>
              </div>
            </div>
          </div>
          
          {/* Memory */}
          <div className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-5 h-5" />
              <h3 className="font-semibold">Memory</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Used</div>
                <div className="text-lg font-bold">{formatBytes(currentMetrics.memory.used)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-lg font-bold">{formatBytes(currentMetrics.memory.total)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="text-lg font-bold">{formatBytes(currentMetrics.memory.available)}</div>
              </div>
            </div>
          </div>
          
          {/* Network */}
          <div className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="w-5 h-5" />
              <h3 className="font-semibold">Network</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Download</div>
                <div className="text-lg font-bold">{currentMetrics.network.downloadSpeed.toFixed(1)} Mbps</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Upload</div>
                <div className="text-lg font-bold">{currentMetrics.network.uploadSpeed.toFixed(1)} Mbps</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Latency</div>
                <div className="text-lg font-bold">{currentMetrics.network.latency.toFixed(0)} ms</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderCodeMetrics = () => (
    <div className="space-y-4">
      {codeMetrics && (
        <>
          {/* Bundle Analysis */}
          <div className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5" />
              <h3 className="font-semibold">Bundle Analysis</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Bundle Size</div>
                <div className="text-lg font-bold">{formatBytes(codeMetrics.bundleSize)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unused Code</div>
                <div className="text-lg font-bold">{codeMetrics.unusedCode.toFixed(1)}%</div>
              </div>
            </div>
          </div>
          
          {/* Performance */}
          <div className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold">Performance</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Load Time</div>
                <div className="text-lg font-bold">{codeMetrics.loadTime.toFixed(0)} ms</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Render Time</div>
                <div className="text-lg font-bold">{codeMetrics.renderTime.toFixed(1)} ms</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Memory Leaks</div>
                <div className="text-lg font-bold">{codeMetrics.memoryLeaks}</div>
              </div>
            </div>
          </div>
          
          {/* Dependencies */}
          <div className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5" />
              <h3 className="font-semibold">Dependencies</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-lg font-bold">{codeMetrics.dependencies.total}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Outdated</div>
                <div className="text-lg font-bold text-yellow-500">{codeMetrics.dependencies.outdated}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Vulnerable</div>
                <div className="text-lg font-bold text-red-500">{codeMetrics.dependencies.vulnerable}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderIssues = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border border-border rounded bg-background text-sm"
          >
            <option value="all">All Categories</option>
            <option value="performance">Performance</option>
            <option value="memory">Memory</option>
            <option value="security">Security</option>
            <option value="optimization">Optimization</option>
          </select>
        </div>
        
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded bg-background text-sm"
          />
        </div>
      </div>
      
      {/* Issues List */}
      <div className="space-y-2">
        {filteredIssues.length > 0 ? (
          filteredIssues.map(issue => (
            <div key={issue.id} className="border border-border rounded-lg bg-background p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  {issue.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />}
                  {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                  {issue.type === 'info' && <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />}
                  <div>
                    <h4 className="font-semibold">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    issue.impact === 'critical' ? 'bg-red-500/10 text-red-500' :
                    issue.impact === 'high' ? 'bg-orange-500/10 text-orange-500' :
                    issue.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {issue.impact}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                    {issue.category}
                  </span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-md p-3 mt-3">
                <div className="text-sm font-medium mb-1">Recommendation:</div>
                <div className="text-sm text-muted-foreground">{issue.recommendation}</div>
              </div>
              
              {issue.file && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  {issue.file}{issue.line && `:${issue.line}`}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <div className="font-medium">No issues found</div>
            <div className="text-sm">Your application is performing well!</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      {reports.length > 0 ? (
        reports.map(report => (
          <div key={report.id} className="border border-border rounded-lg bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">Performance Report</h4>
                <div className="text-sm text-muted-foreground">
                  {report.timestamp.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${
                  report.score >= 80 ? 'text-green-500' :
                  report.score >= 60 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {report.score}
                </div>
                <div className="text-sm text-muted-foreground">/ 100</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Issues Found</div>
                <div className="font-medium">{report.issues.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bundle Size</div>
                <div className="font-medium">{formatBytes(report.metrics.code.bundleSize)}</div>
              </div>
            </div>
            
            {report.recommendations.length > 0 && (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-sm font-medium mb-2">AI Recommendations:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {report.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index}>* {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4" />
          <div className="font-medium">No reports generated yet</div>
          <div className="text-sm">Generate your first performance report</div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-background border border-border rounded-lg ${isExpanded ? 'fixed inset-4 z-50' : 'h-full'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          <h2 className="font-semibold">Performance Monitor</h2>
          {isMonitoring && (
            <div className="flex items-center gap-1 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs">Live</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-2 rounded-md transition-colors ${
              isMonitoring ? 'bg-green-500/10 text-green-500' : 'hover:bg-accent'
            }`}
            title={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
          >
            {isMonitoring ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={collectMetrics}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={generatePerformanceReport}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Generate report"
          >
            <FileText className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex border-b border-border">
        {[
          { id: 'overview', label: 'Overview', icon: <Gauge className="w-4 h-4" /> },
          { id: 'system', label: 'System', icon: <Cpu className="w-4 h-4" /> },
          { id: 'code', label: 'Code', icon: <Package className="w-4 h-4" /> },
          { id: 'issues', label: 'Issues', icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              selectedView === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'issues' && issues.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center">
                {issues.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'system' && renderSystemMetrics()}
        {selectedView === 'code' && renderCodeMetrics()}
        {selectedView === 'issues' && renderIssues()}
        {selectedView === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default PerformanceMonitor;