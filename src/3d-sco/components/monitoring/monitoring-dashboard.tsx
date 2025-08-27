'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { usePerformanceMonitor } from '@/lib/monitoring/performance';
import { useErrorTracking, ErrorSeverity, ErrorCategory } from '@/lib/monitoring/error-tracking';
import { useLogger, LogLevel } from '@/lib/monitoring/logging';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Bug,
  Clock,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

// Performance metrics chart data
interface ChartData {
  timestamp: number;
  value: number;
  label: string;
}

// Error trend data
interface ErrorTrendData {
  date: string;
  errors: number;
  resolved: number;
}

// Log level colors
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#6b7280',
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444',
  fatal: '#dc2626',
};

// Error severity colors
const ERROR_SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

// Performance score colors
const getPerformanceScoreColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 70) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};

// Format duration
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Format bytes
const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export function MonitoringDashboard() {
  const { t } = useTranslation();
  const { metrics, webVitals, customMetrics, startMonitoring, stopMonitoring } = usePerformanceMonitor();
  const { errors, stats: errorStats, resolveError, clearErrors } = useErrorTracking();
  const { logs, stats: logStats, clearLogs, exportLogs } = useLogger();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [errorFilter, setErrorFilter] = useState<{
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    resolved?: boolean;
  }>({});
  const [logFilter, setLogFilter] = useState<{
    level?: LogLevel;
    search?: string;
  }>({});
  
  // Start/stop monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };
  
  // Filter errors
  const filteredErrors = errors.filter(error => {
    if (errorFilter.severity && error.severity !== errorFilter.severity) return false;
    if (errorFilter.category && error.category !== errorFilter.category) return false;
    if (errorFilter.resolved !== undefined && error.resolved !== errorFilter.resolved) return false;
    return true;
  });
  
  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (logFilter.level && log.level !== logFilter.level) return false;
    if (logFilter.search && !log.message.toLowerCase().includes(logFilter.search.toLowerCase())) return false;
    return true;
  });
  
  // Generate performance chart data
  const performanceChartData: ChartData[] = customMetrics.map((metric, index) => ({
    timestamp: Date.now() - (customMetrics.length - index) * 1000,
    value: metric.pageLoadTime || 0,
    label: new Date(Date.now() - (customMetrics.length - index) * 1000).toLocaleTimeString(),
  }));
  
  // Generate error trend data
  const errorTrendData: ErrorTrendData[] = [];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  last7Days.forEach(date => {
    const dayStart = new Date(date).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const dayErrors = errors.filter(error => 
      error.timestamp >= dayStart && error.timestamp < dayEnd
    );
    
    const resolvedErrors = dayErrors.filter(error => error.resolved);
    
    errorTrendData.push({
      date,
      errors: dayErrors.length,
      resolved: resolvedErrors.length,
    });
  });
  
  // Web Vitals score
  const webVitalsScore = webVitals.length > 0 ? 
    Math.round(webVitals.reduce((sum, vital) => sum + (vital.value || 0), 0) / webVitals.length) : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('monitoring.title')}</h1>
          <p className="text-muted-foreground">{t('monitoring.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isMonitoring ? 'destructive' : 'default'}
            onClick={toggleMonitoring}
            className="flex items-center gap-2"
          >
            {isMonitoring ? <XCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            {isMonitoring ? t('monitoring.stop') : t('monitoring.start')}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('monitoring.overview')}</TabsTrigger>
          <TabsTrigger value="performance">{t('monitoring.performance')}</TabsTrigger>
          <TabsTrigger value="errors">{t('monitoring.errors')}</TabsTrigger>
          <TabsTrigger value="logs">{t('monitoring.logs')}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('monitoring.webVitalsScore')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: getPerformanceScoreColor(webVitalsScore) }}>
                  {webVitalsScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  {webVitalsScore >= 90 ? t('monitoring.excellent') : 
                   webVitalsScore >= 70 ? t('monitoring.good') : t('monitoring.needsImprovement')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('monitoring.totalErrors')}</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</div>
                <p className="text-xs text-muted-foreground">
                  {errorStats.unresolvedErrors} {t('monitoring.unresolved')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('monitoring.avgLoadTime')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customMetrics.length > 0 ? 
                    formatDuration(customMetrics.reduce((sum, m) => sum + (m.pageLoadTime || 0), 0) / customMetrics.length) :
                    '0ms'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('monitoring.last24Hours')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('monitoring.memoryUsage')}</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customMetrics.length > 0 && customMetrics[customMetrics.length - 1].memoryUsage ?
                    formatBytes(customMetrics[customMetrics.length - 1].memoryUsage!) :
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('monitoring.current')}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.performanceTrend')}</CardTitle>
                <CardDescription>{t('monitoring.pageLoadTimes')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatDuration(value as number), t('monitoring.loadTime')]} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Error Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.errorTrend')}</CardTitle>
                <CardDescription>{t('monitoring.last7Days')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={errorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="errors" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="resolved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monitoring.webVitals')}</CardTitle>
              <CardDescription>{t('monitoring.coreWebVitals')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {webVitals.map((vital, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{vital.name}</span>
                      <Badge variant={vital.rating === 'good' ? 'default' : vital.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                        {vital.rating}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {vital.name === 'CLS' ? vital.value?.toFixed(3) : formatDuration(vital.value || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monitoring.performanceMetrics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customMetrics.slice(-5).map((metric, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <span className="text-sm text-muted-foreground">{t('monitoring.pageLoad')}</span>
                      <div className="font-medium">{formatDuration(metric.pageLoadTime || 0)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('monitoring.domContentLoaded')}</span>
                      <div className="font-medium">{formatDuration(metric.domContentLoadedTime || 0)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('monitoring.resourceLoad')}</span>
                      <div className="font-medium">{formatDuration(metric.resourceLoadTime || 0)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('monitoring.memory')}</span>
                      <div className="font-medium">{metric.memoryUsage ? formatBytes(metric.memoryUsage) : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          {/* Error Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monitoring.errorFilters')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Select value={errorFilter.severity || ''} onValueChange={(value) => 
                  setErrorFilter(prev => ({ ...prev, severity: value as ErrorSeverity || undefined }))
                }>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('monitoring.severity')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('monitoring.all')}</SelectItem>
                    <SelectItem value="low">{t('monitoring.low')}</SelectItem>
                    <SelectItem value="medium">{t('monitoring.medium')}</SelectItem>
                    <SelectItem value="high">{t('monitoring.high')}</SelectItem>
                    <SelectItem value="critical">{t('monitoring.critical')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={errorFilter.category || ''} onValueChange={(value) => 
                  setErrorFilter(prev => ({ ...prev, category: value as ErrorCategory || undefined }))
                }>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('monitoring.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('monitoring.all')}</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={errorFilter.resolved?.toString() || ''} onValueChange={(value) => 
                  setErrorFilter(prev => ({ ...prev, resolved: value === '' ? undefined : value === 'true' }))
                }>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('monitoring.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('monitoring.all')}</SelectItem>
                    <SelectItem value="false">{t('monitoring.unresolved')}</SelectItem>
                    <SelectItem value="true">{t('monitoring.resolved')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setErrorFilter({})}>
                  {t('monitoring.clearFilters')}
                </Button>
                
                <Button variant="outline" onClick={clearErrors}>
                  {t('monitoring.clearErrors')}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Error List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monitoring.errorList')} ({filteredErrors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredErrors.map((error) => (
                  <div key={error.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: ERROR_SEVERITY_COLORS[error.severity], color: ERROR_SEVERITY_COLORS[error.severity] }}
                        >
                          {error.severity}
                        </Badge>
                        <Badge variant="secondary">{error.category}</Badge>
                        {error.resolved && <Badge variant="default">Resolved</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!error.resolved && (
                          <Button size="sm" variant="outline" onClick={() => resolveError(error.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="font-medium mb-2">{error.message}</div>
                    {error.filename && (
                      <div className="text-sm text-muted-foreground mb-2">
                        {error.filename}:{error.lineno}:{error.colno}
                      </div>
                    )}
                    {error.count && error.count > 1 && (
                      <div className="text-sm text-muted-foreground">
                        Occurred {error.count} times
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredErrors.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('monitoring.noErrors')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Log Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monitoring.logFilters')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder={t('monitoring.searchLogs')}
                    value={logFilter.search || ''}
                    onChange={(e) => setLogFilter(prev => ({ ...prev, search: e.target.value || undefined }))}
                    className="w-64"
                  />
                </div>
                
                <Select value={logFilter.level || ''} onValueChange={(value) => 
                  setLogFilter(prev => ({ ...prev, level: value as LogLevel || undefined }))
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('monitoring.level')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('monitoring.all')}</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setLogFilter({})}>
                  {t('monitoring.clearFilters')}
                </Button>
                
                <Button variant="outline" onClick={clearLogs}>
                  {t('monitoring.clearLogs')}
                </Button>
                
                <Button variant="outline" onClick={() => {
                  const data = exportLogs('json');
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('monitoring.exportLogs')}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Log List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monitoring.logList')} ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.slice(-50).reverse().map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 text-sm border-b">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: LOG_LEVEL_COLORS[log.level] }}
                      />
                      <span className="text-xs text-muted-foreground min-w-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.level}
                      </Badge>
                      {log.category && (
                        <Badge variant="secondary" className="text-xs">
                          {log.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{log.message}</div>
                      {log.data && Object.keys(log.data).length > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            {t('monitoring.showData')}
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('monitoring.noLogs')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}