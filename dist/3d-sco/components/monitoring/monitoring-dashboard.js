"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringDashboard = MonitoringDashboard;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const react_i18next_1 = require("react-i18next");
const performance_1 = require("@/lib/monitoring/performance");
const error_tracking_1 = require("@/lib/monitoring/error-tracking");
const logging_1 = require("@/lib/monitoring/logging");
const recharts_1 = require("recharts");
const lucide_react_1 = require("lucide-react");
// Log level colors
const LOG_LEVEL_COLORS = {
    debug: '#6b7280',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    fatal: '#dc2626',
};
// Error severity colors
const ERROR_SEVERITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
};
// Performance score colors
const getPerformanceScoreColor = (score) => {
    if (score >= 90)
        return '#10b981'; // Green
    if (score >= 70)
        return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
};
// Format duration
const formatDuration = (ms) => {
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};
// Format bytes
const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};
function MonitoringDashboard() {
    const { t } = (0, react_i18next_1.useTranslation)();
    const { metrics, webVitals, customMetrics, startMonitoring, stopMonitoring } = (0, performance_1.usePerformanceMonitor)();
    const { errors, stats: errorStats, resolveError, clearErrors } = (0, error_tracking_1.useErrorTracking)();
    const { logs, stats: logStats, clearLogs, exportLogs } = (0, logging_1.useLogger)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const [isMonitoring, setIsMonitoring] = (0, react_1.useState)(false);
    const [errorFilter, setErrorFilter] = (0, react_1.useState)({});
    const [logFilter, setLogFilter] = (0, react_1.useState)({});
    // Start/stop monitoring
    const toggleMonitoring = () => {
        if (isMonitoring) {
            stopMonitoring();
        }
        else {
            startMonitoring();
        }
        setIsMonitoring(!isMonitoring);
    };
    // Filter errors
    const filteredErrors = errors.filter(error => {
        if (errorFilter.severity && error.severity !== errorFilter.severity)
            return false;
        if (errorFilter.category && error.category !== errorFilter.category)
            return false;
        if (errorFilter.resolved !== undefined && error.resolved !== errorFilter.resolved)
            return false;
        return true;
    });
    // Filter logs
    const filteredLogs = logs.filter(log => {
        if (logFilter.level && log.level !== logFilter.level)
            return false;
        if (logFilter.search && !log.message.toLowerCase().includes(logFilter.search.toLowerCase()))
            return false;
        return true;
    });
    // Generate performance chart data
    const performanceChartData = customMetrics.map((metric, index) => ({
        timestamp: Date.now() - (customMetrics.length - index) * 1000,
        value: metric.pageLoadTime || 0,
        label: new Date(Date.now() - (customMetrics.length - index) * 1000).toLocaleTimeString(),
    }));
    // Generate error trend data
    const errorTrendData = [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    last7Days.forEach(date => {
        const dayStart = new Date(date).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const dayErrors = errors.filter(error => error.timestamp >= dayStart && error.timestamp < dayEnd);
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
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('monitoring.title')}</h1>
          <p className="text-muted-foreground">{t('monitoring.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button_1.Button variant={isMonitoring ? 'destructive' : 'default'} onClick={toggleMonitoring} className="flex items-center gap-2">
            {isMonitoring ? <lucide_react_1.XCircle className="h-4 w-4"/> : <lucide_react_1.Activity className="h-4 w-4"/>}
            {isMonitoring ? t('monitoring.stop') : t('monitoring.start')}
          </button_1.Button>
          <button_1.Button variant="outline" onClick={() => window.location.reload()}>
            <lucide_react_1.RefreshCw className="h-4 w-4"/>
          </button_1.Button>
        </div>
      </div>
      
      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
        <tabs_1.TabsList className="grid w-full grid-cols-4">
          <tabs_1.TabsTrigger value="overview">{t('monitoring.overview')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="performance">{t('monitoring.performance')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="errors">{t('monitoring.errors')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="logs">{t('monitoring.logs')}</tabs_1.TabsTrigger>
        </tabs_1.TabsList>
        
        {/* Overview Tab */}
        <tabs_1.TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">{t('monitoring.webVitalsScore')}</card_1.CardTitle>
                <lucide_react_1.TrendingUp className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold" style={{ color: getPerformanceScoreColor(webVitalsScore) }}>
                  {webVitalsScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  {webVitalsScore >= 90 ? t('monitoring.excellent') :
            webVitalsScore >= 70 ? t('monitoring.good') : t('monitoring.needsImprovement')}
                </p>
              </card_1.CardContent>
            </card_1.Card>
            
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">{t('monitoring.totalErrors')}</card_1.CardTitle>
                <lucide_react_1.Bug className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</div>
                <p className="text-xs text-muted-foreground">
                  {errorStats.unresolvedErrors} {t('monitoring.unresolved')}
                </p>
              </card_1.CardContent>
            </card_1.Card>
            
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">{t('monitoring.avgLoadTime')}</card_1.CardTitle>
                <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">
                  {customMetrics.length > 0 ?
            formatDuration(customMetrics.reduce((sum, m) => sum + (m.pageLoadTime || 0), 0) / customMetrics.length) :
            '0ms'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('monitoring.last24Hours')}
                </p>
              </card_1.CardContent>
            </card_1.Card>
            
            <card_1.Card>
              <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <card_1.CardTitle className="text-sm font-medium">{t('monitoring.memoryUsage')}</card_1.CardTitle>
                <lucide_react_1.Zap className="h-4 w-4 text-muted-foreground"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-2xl font-bold">
                  {customMetrics.length > 0 && customMetrics[customMetrics.length - 1].memoryUsage ?
            formatBytes(customMetrics[customMetrics.length - 1].memoryUsage) :
            'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('monitoring.current')}
                </p>
              </card_1.CardContent>
            </card_1.Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>{t('monitoring.performanceTrend')}</card_1.CardTitle>
                <card_1.CardDescription>{t('monitoring.pageLoadTimes')}</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <recharts_1.ResponsiveContainer width="100%" height={300}>
                  <recharts_1.LineChart data={performanceChartData}>
                    <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                    <recharts_1.XAxis dataKey="label"/>
                    <recharts_1.YAxis />
                    <recharts_1.Tooltip formatter={(value) => [formatDuration(value), t('monitoring.loadTime')]}/>
                    <recharts_1.Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2}/>
                  </recharts_1.LineChart>
                </recharts_1.ResponsiveContainer>
              </card_1.CardContent>
            </card_1.Card>
            
            {/* Error Trend */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>{t('monitoring.errorTrend')}</card_1.CardTitle>
                <card_1.CardDescription>{t('monitoring.last7Days')}</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <recharts_1.ResponsiveContainer width="100%" height={300}>
                  <recharts_1.AreaChart data={errorTrendData}>
                    <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                    <recharts_1.XAxis dataKey="date"/>
                    <recharts_1.YAxis />
                    <recharts_1.Tooltip />
                    <recharts_1.Area type="monotone" dataKey="errors" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6}/>
                    <recharts_1.Area type="monotone" dataKey="resolved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6}/>
                  </recharts_1.AreaChart>
                </recharts_1.ResponsiveContainer>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>
        
        {/* Performance Tab */}
        <tabs_1.TabsContent value="performance" className="space-y-6">
          {/* Web Vitals */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('monitoring.webVitals')}</card_1.CardTitle>
              <card_1.CardDescription>{t('monitoring.coreWebVitals')}</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {webVitals.map((vital, index) => (<div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{vital.name}</span>
                      <badge_1.Badge variant={vital.rating === 'good' ? 'default' : vital.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                        {vital.rating}
                      </badge_1.Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {vital.name === 'CLS' ? vital.value?.toFixed(3) : formatDuration(vital.value || 0)}
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
          
          {/* Performance Metrics */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('monitoring.performanceMetrics')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {customMetrics.slice(-5).map((metric, index) => (<div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
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
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
        
        {/* Errors Tab */}
        <tabs_1.TabsContent value="errors" className="space-y-6">
          {/* Error Filters */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('monitoring.errorFilters')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="flex flex-wrap gap-4">
                <select_1.Select value={errorFilter.severity || ''} onValueChange={(value) => setErrorFilter(prev => ({ ...prev, severity: value || undefined }))}>
                  <select_1.SelectTrigger className="w-40">
                    <select_1.SelectValue placeholder={t('monitoring.severity')}/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">{t('monitoring.all')}</select_1.SelectItem>
                    <select_1.SelectItem value="low">{t('monitoring.low')}</select_1.SelectItem>
                    <select_1.SelectItem value="medium">{t('monitoring.medium')}</select_1.SelectItem>
                    <select_1.SelectItem value="high">{t('monitoring.high')}</select_1.SelectItem>
                    <select_1.SelectItem value="critical">{t('monitoring.critical')}</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
                
                <select_1.Select value={errorFilter.category || ''} onValueChange={(value) => setErrorFilter(prev => ({ ...prev, category: value || undefined }))}>
                  <select_1.SelectTrigger className="w-40">
                    <select_1.SelectValue placeholder={t('monitoring.category')}/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">{t('monitoring.all')}</select_1.SelectItem>
                    <select_1.SelectItem value="javascript">JavaScript</select_1.SelectItem>
                    <select_1.SelectItem value="network">Network</select_1.SelectItem>
                    <select_1.SelectItem value="resource">Resource</select_1.SelectItem>
                    <select_1.SelectItem value="api">API</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
                
                <select_1.Select value={errorFilter.resolved?.toString() || ''} onValueChange={(value) => setErrorFilter(prev => ({ ...prev, resolved: value === '' ? undefined : value === 'true' }))}>
                  <select_1.SelectTrigger className="w-40">
                    <select_1.SelectValue placeholder={t('monitoring.status')}/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">{t('monitoring.all')}</select_1.SelectItem>
                    <select_1.SelectItem value="false">{t('monitoring.unresolved')}</select_1.SelectItem>
                    <select_1.SelectItem value="true">{t('monitoring.resolved')}</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
                
                <button_1.Button variant="outline" onClick={() => setErrorFilter({})}>
                  {t('monitoring.clearFilters')}
                </button_1.Button>
                
                <button_1.Button variant="outline" onClick={clearErrors}>
                  {t('monitoring.clearErrors')}
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
          
          {/* Error List */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('monitoring.errorList')} ({filteredErrors.length})</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {filteredErrors.map((error) => (<div key={error.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <badge_1.Badge variant="outline" style={{ borderColor: ERROR_SEVERITY_COLORS[error.severity], color: ERROR_SEVERITY_COLORS[error.severity] }}>
                          {error.severity}
                        </badge_1.Badge>
                        <badge_1.Badge variant="secondary">{error.category}</badge_1.Badge>
                        {error.resolved && <badge_1.Badge variant="default">Resolved</badge_1.Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!error.resolved && (<button_1.Button size="sm" variant="outline" onClick={() => resolveError(error.id)}>
                            <lucide_react_1.CheckCircle className="h-4 w-4"/>
                          </button_1.Button>)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="font-medium mb-2">{error.message}</div>
                    {error.filename && (<div className="text-sm text-muted-foreground mb-2">
                        {error.filename}:{error.lineno}:{error.colno}
                      </div>)}
                    {error.count && error.count > 1 && (<div className="text-sm text-muted-foreground">
                        Occurred {error.count} times
                      </div>)}
                  </div>))}
                
                {filteredErrors.length === 0 && (<div className="text-center py-8 text-muted-foreground">
                    {t('monitoring.noErrors')}
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
        
        {/* Logs Tab */}
        <tabs_1.TabsContent value="logs" className="space-y-6">
          {/* Log Filters */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('monitoring.logFilters')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Search className="h-4 w-4"/>
                  <input_1.Input placeholder={t('monitoring.searchLogs')} value={logFilter.search || ''} onChange={(e) => setLogFilter(prev => ({ ...prev, search: e.target.value || undefined }))} className="w-64"/>
                </div>
                
                <select_1.Select value={logFilter.level || ''} onValueChange={(value) => setLogFilter(prev => ({ ...prev, level: value || undefined }))}>
                  <select_1.SelectTrigger className="w-32">
                    <select_1.SelectValue placeholder={t('monitoring.level')}/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">{t('monitoring.all')}</select_1.SelectItem>
                    <select_1.SelectItem value="debug">Debug</select_1.SelectItem>
                    <select_1.SelectItem value="info">Info</select_1.SelectItem>
                    <select_1.SelectItem value="warn">Warn</select_1.SelectItem>
                    <select_1.SelectItem value="error">Error</select_1.SelectItem>
                    <select_1.SelectItem value="fatal">Fatal</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
                
                <button_1.Button variant="outline" onClick={() => setLogFilter({})}>
                  {t('monitoring.clearFilters')}
                </button_1.Button>
                
                <button_1.Button variant="outline" onClick={clearLogs}>
                  {t('monitoring.clearLogs')}
                </button_1.Button>
                
                <button_1.Button variant="outline" onClick={() => {
            const data = exportLogs('json');
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }}>
                  <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                  {t('monitoring.exportLogs')}
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
          
          {/* Log List */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('monitoring.logList')} ({filteredLogs.length})</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.slice(-50).reverse().map((log) => (<div key={log.id} className="flex items-start gap-3 p-2 text-sm border-b">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LOG_LEVEL_COLORS[log.level] }}/>
                      <span className="text-xs text-muted-foreground min-w-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <badge_1.Badge variant="outline" className="text-xs">
                        {log.level}
                      </badge_1.Badge>
                      {log.category && (<badge_1.Badge variant="secondary" className="text-xs">
                          {log.category}
                        </badge_1.Badge>)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{log.message}</div>
                      {log.data && Object.keys(log.data).length > 0 && (<details className="mt-1">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            {t('monitoring.showData')}
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>)}
                    </div>
                  </div>))}
                
                {filteredLogs.length === 0 && (<div className="text-center py-8 text-muted-foreground">
                    {t('monitoring.noLogs')}
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=monitoring-dashboard.js.map