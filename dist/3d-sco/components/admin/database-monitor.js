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
exports.default = DatabaseMonitor;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const alert_1 = require("@/components/ui/alert");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function DatabaseMonitor() {
    const [overview, setOverview] = (0, react_1.useState)(null);
    const [recommendations, setRecommendations] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const { toast } = (0, use_toast_1.useToast)();
    const fetchOverview = async () => {
        try {
            const response = await fetch('/api/admin/database');
            if (!response.ok)
                throw new Error('Failed to fetch database overview');
            const data = await response.json();
            setOverview(data.overview);
        }
        catch (error) {
            console.error('Error fetching database overview:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch database overview',
                variant: 'destructive',
            });
        }
    };
    const fetchRecommendations = async () => {
        try {
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'optimize_queries' }),
            });
            if (!response.ok)
                throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            setRecommendations(data.analysis.recommendations || []);
        }
        catch (error) {
            console.error('Error fetching recommendations:', error);
        }
    };
    const runMaintenance = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'maintenance' }),
            });
            if (!response.ok)
                throw new Error('Maintenance failed');
            toast({
                title: 'Success',
                description: 'Database maintenance completed successfully',
            });
            await fetchOverview();
        }
        catch (error) {
            console.error('Error running maintenance:', error);
            toast({
                title: 'Error',
                description: 'Failed to run database maintenance',
                variant: 'destructive',
            });
        }
        finally {
            setRefreshing(false);
        }
    };
    const clearCache = async (patterns) => {
        try {
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'clear_cache',
                    data: patterns ? { patterns } : undefined,
                }),
            });
            if (!response.ok)
                throw new Error('Cache clear failed');
            toast({
                title: 'Success',
                description: 'Cache cleared successfully',
            });
            await fetchOverview();
        }
        catch (error) {
            console.error('Error clearing cache:', error);
            toast({
                title: 'Error',
                description: 'Failed to clear cache',
                variant: 'destructive',
            });
        }
    };
    const refresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchOverview(), fetchRecommendations()]);
        setRefreshing(false);
    };
    (0, react_1.useEffect)(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchOverview(), fetchRecommendations()]);
            setLoading(false);
        };
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchOverview, 30000);
        return () => clearInterval(interval);
    }, []);
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <lucide_react_1.RefreshCw className="h-8 w-8 animate-spin"/>
        <span className="ml-2">Loading database overview...</span>
      </div>);
    }
    if (!overview) {
        return (<alert_1.Alert>
        <lucide_react_1.AlertTriangle className="h-4 w-4"/>
        <alert_1.AlertDescription>
          Failed to load database overview. Please try refreshing the page.
        </alert_1.AlertDescription>
      </alert_1.Alert>);
    }
    const { queryMetrics, tableStats, indexUsage, cacheStats } = overview;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Database Monitor</h2>
          <p className="text-muted-foreground">
            Monitor database performance, cache usage, and system health
          </p>
        </div>
        <div className="flex gap-2">
          <button_1.Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <lucide_react_1.RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}/>
            Refresh
          </button_1.Button>
          <button_1.Button variant="outline" size="sm" onClick={runMaintenance} disabled={refreshing}>
            <lucide_react_1.Settings className="h-4 w-4 mr-2"/>
            Maintenance
          </button_1.Button>
          <button_1.Button variant="outline" size="sm" onClick={() => clearCache()}>
            <lucide_react_1.Trash2 className="h-4 w-4 mr-2"/>
            Clear Cache
          </button_1.Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Total Queries</card_1.CardTitle>
            <lucide_react_1.Activity className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{queryMetrics.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last hour
            </p>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Slow Queries</card_1.CardTitle>
            <lucide_react_1.AlertTriangle className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{queryMetrics.slowQueries}</div>
            <p className="text-xs text-muted-foreground">
              {queryMetrics.totalQueries > 0
            ? `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(1)}% of total`
            : 'No queries'}
            </p>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Avg Duration</card_1.CardTitle>
            <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{queryMetrics.averageDuration}ms</div>
            <p className="text-xs text-muted-foreground">
              Per query
            </p>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Cache Status</card_1.CardTitle>
            <lucide_react_1.Database className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="flex items-center space-x-2">
              {cacheStats.redis.connected ? (<lucide_react_1.CheckCircle className="h-4 w-4 text-green-500"/>) : (<lucide_react_1.AlertTriangle className="h-4 w-4 text-yellow-500"/>)}
              <span className="text-sm">
                {cacheStats.redis.connected ? 'Redis Connected' : 'Memory Only'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cacheStats.memoryCache.size}/{cacheStats.memoryCache.max} items
            </p>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (<alert_1.Alert>
          <lucide_react_1.AlertTriangle className="h-4 w-4"/>
          <alert_1.AlertDescription>
            <div className="font-medium mb-2">Database Optimization Recommendations:</div>
            <ul className="list-disc list-inside space-y-1">
              {recommendations.slice(0, 3).map((rec, index) => (<li key={index} className="text-sm">
                  <strong>{rec.table || rec.index}:</strong> {rec.recommendation}
                </li>))}
            </ul>
            {recommendations.length > 3 && (<p className="text-sm mt-2">And {recommendations.length - 3} more recommendations...</p>)}
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Detailed Tabs */}
      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="tables">Tables</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="indexes">Indexes</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="cache">Cache</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Query Performance</card_1.CardTitle>
                <card_1.CardDescription>Recent query execution metrics</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Slow Query Rate</span>
                      <span>{queryMetrics.totalQueries > 0
            ? `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(1)}%`
            : '0%'}</span>
                    </div>
                    <progress_1.Progress value={queryMetrics.totalQueries > 0
            ? (queryMetrics.slowQueries / queryMetrics.totalQueries) * 100
            : 0} className="mt-2"/>
                  </div>
                  
                  {queryMetrics.slowestQuery.duration > 0 && (<div>
                      <h4 className="text-sm font-medium mb-2">Slowest Query</h4>
                      <div className="bg-muted p-3 rounded text-xs">
                        <div className="font-mono mb-1">
                          {queryMetrics.slowestQuery.query.substring(0, 100)}...
                        </div>
                        <div className="text-muted-foreground">
                          Duration: {queryMetrics.slowestQuery.duration}ms
                        </div>
                      </div>
                    </div>)}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Cache Performance</card_1.CardTitle>
                <card_1.CardDescription>Memory and Redis cache status</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Cache Usage</span>
                      <span>{cacheStats.memoryCache.size}/{cacheStats.memoryCache.max}</span>
                    </div>
                    <progress_1.Progress value={(cacheStats.memoryCache.size / cacheStats.memoryCache.max) * 100} className="mt-2"/>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redis Status</span>
                    <badge_1.Badge variant={cacheStats.redis.connected ? 'default' : 'secondary'}>
                      {cacheStats.redis.connected ? 'Connected' : 'Disconnected'}
                    </badge_1.Badge>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="tables" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Table Statistics</card_1.CardTitle>
              <card_1.CardDescription>Database table performance and maintenance status</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Table</th>
                      <th className="text-right p-2">Live Tuples</th>
                      <th className="text-right p-2">Dead Tuples</th>
                      <th className="text-right p-2">Inserts</th>
                      <th className="text-right p-2">Updates</th>
                      <th className="text-right p-2">Last Analyze</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableStats.map((table, index) => (<tr key={index} className="border-b">
                        <td className="p-2 font-medium">{table.tablename}</td>
                        <td className="text-right p-2">{table.live_tuples.toLocaleString()}</td>
                        <td className="text-right p-2">
                          <span className={table.dead_tuples > table.live_tuples * 0.1 ? 'text-red-500' : ''}>
                            {table.dead_tuples.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right p-2">{table.inserts.toLocaleString()}</td>
                        <td className="text-right p-2">{table.updates.toLocaleString()}</td>
                        <td className="text-right p-2">
                          {table.last_analyze
                ? new Date(table.last_analyze).toLocaleDateString()
                : 'Never'}
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="indexes" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Index Usage</card_1.CardTitle>
              <card_1.CardDescription>Database index performance and usage statistics</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Index</th>
                      <th className="text-left p-2">Table</th>
                      <th className="text-right p-2">Scans</th>
                      <th className="text-right p-2">Tuples Read</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexUsage.map((index, i) => (<tr key={i} className="border-b">
                        <td className="p-2 font-medium">{index.indexname}</td>
                        <td className="p-2">{index.tablename}</td>
                        <td className="text-right p-2">{index.idx_scan.toLocaleString()}</td>
                        <td className="text-right p-2">{index.idx_tup_read.toLocaleString()}</td>
                        <td className="p-2">
                          <badge_1.Badge variant={index.usage_status === 'Frequently used' ? 'default' :
                index.usage_status === 'Rarely used' ? 'secondary' : 'destructive'}>
                            {index.usage_status}
                          </badge_1.Badge>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="cache" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Memory Cache</card_1.CardTitle>
                <card_1.CardDescription>In-memory LRU cache statistics</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Items</span>
                      <span>{cacheStats.memoryCache.size}/{cacheStats.memoryCache.max}</span>
                    </div>
                    <progress_1.Progress value={(cacheStats.memoryCache.size / cacheStats.memoryCache.max) * 100} className="mt-2"/>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Calculated Size</span>
                    <span>{(cacheStats.memoryCache.calculatedSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  
                  <button_1.Button variant="outline" size="sm" onClick={() => clearCache(['memory'])} className="w-full">
                    <lucide_react_1.Trash2 className="h-4 w-4 mr-2"/>
                    Clear Memory Cache
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Redis Cache</card_1.CardTitle>
                <card_1.CardDescription>Redis cache connection and status</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Status</span>
                    <badge_1.Badge variant={cacheStats.redis.connected ? 'default' : 'destructive'}>
                      {cacheStats.redis.connected ? 'Connected' : 'Disconnected'}
                    </badge_1.Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ready State</span>
                    <badge_1.Badge variant={cacheStats.redis.ready ? 'default' : 'secondary'}>
                      {cacheStats.redis.ready ? 'Ready' : 'Not Ready'}
                    </badge_1.Badge>
                  </div>
                  
                  <button_1.Button variant="outline" size="sm" onClick={() => clearCache(['redis'])} className="w-full" disabled={!cacheStats.redis.connected}>
                    <lucide_react_1.Trash2 className="h-4 w-4 mr-2"/>
                    Clear Redis Cache
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=database-monitor.js.map