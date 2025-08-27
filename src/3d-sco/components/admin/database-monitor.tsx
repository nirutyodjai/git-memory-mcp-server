'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Activity, 
  Zap, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  slowestQuery: {
    duration: number;
    query: string;
    timestamp: Date;
  };
  queryFrequency: Record<string, number>;
}

interface TableStats {
  schemaname: string;
  tablename: string;
  inserts: number;
  updates: number;
  deletes: number;
  live_tuples: number;
  dead_tuples: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  last_autoanalyze: string | null;
}

interface IndexUsage {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_tup_read: number;
  idx_tup_fetch: number;
  idx_scan: number;
  usage_status: string;
}

interface CacheStats {
  memoryCache: {
    size: number;
    max: number;
    calculatedSize: number;
  };
  redis: {
    connected: boolean;
    ready: boolean;
  };
}

interface DatabaseOverview {
  queryMetrics: QueryMetrics;
  tableStats: TableStats[];
  indexUsage: IndexUsage[];
  cacheStats: CacheStats;
  timestamp: string;
}

interface Recommendation {
  type: string;
  table?: string;
  index?: string;
  issue: string;
  recommendation: string;
}

export default function DatabaseMonitor() {
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/admin/database');
      if (!response.ok) throw new Error('Failed to fetch database overview');
      
      const data = await response.json();
      setOverview(data.overview);
    } catch (error) {
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
      
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      setRecommendations(data.analysis.recommendations || []);
    } catch (error) {
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
      
      if (!response.ok) throw new Error('Maintenance failed');
      
      toast({
        title: 'Success',
        description: 'Database maintenance completed successfully',
      });
      
      await fetchOverview();
    } catch (error) {
      console.error('Error running maintenance:', error);
      toast({
        title: 'Error',
        description: 'Failed to run database maintenance',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const clearCache = async (patterns?: string[]) => {
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'clear_cache',
          data: patterns ? { patterns } : undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Cache clear failed');
      
      toast({
        title: 'Success',
        description: 'Cache cleared successfully',
      });
      
      await fetchOverview();
    } catch (error) {
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

  useEffect(() => {
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
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading database overview...</span>
      </div>
    );
  }

  if (!overview) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load database overview. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const { queryMetrics, tableStats, indexUsage, cacheStats } = overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Database Monitor</h2>
          <p className="text-muted-foreground">
            Monitor database performance, cache usage, and system health
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runMaintenance}
            disabled={refreshing}
          >
            <Settings className="h-4 w-4 mr-2" />
            Maintenance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearCache()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queryMetrics.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queryMetrics.slowQueries}</div>
            <p className="text-xs text-muted-foreground">
              {queryMetrics.totalQueries > 0 
                ? `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(1)}% of total`
                : 'No queries'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queryMetrics.averageDuration}ms</div>
            <p className="text-xs text-muted-foreground">
              Per query
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {cacheStats.redis.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">
                {cacheStats.redis.connected ? 'Redis Connected' : 'Memory Only'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cacheStats.memoryCache.size}/{cacheStats.memoryCache.max} items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Database Optimization Recommendations:</div>
            <ul className="list-disc list-inside space-y-1">
              {recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm">
                  <strong>{rec.table || rec.index}:</strong> {rec.recommendation}
                </li>
              ))}
            </ul>
            {recommendations.length > 3 && (
              <p className="text-sm mt-2">And {recommendations.length - 3} more recommendations...</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Recent query execution metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Slow Query Rate</span>
                      <span>{queryMetrics.totalQueries > 0 
                        ? `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(1)}%`
                        : '0%'
                      }</span>
                    </div>
                    <Progress 
                      value={queryMetrics.totalQueries > 0 
                        ? (queryMetrics.slowQueries / queryMetrics.totalQueries) * 100
                        : 0
                      } 
                      className="mt-2" 
                    />
                  </div>
                  
                  {queryMetrics.slowestQuery.duration > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Slowest Query</h4>
                      <div className="bg-muted p-3 rounded text-xs">
                        <div className="font-mono mb-1">
                          {queryMetrics.slowestQuery.query.substring(0, 100)}...
                        </div>
                        <div className="text-muted-foreground">
                          Duration: {queryMetrics.slowestQuery.duration}ms
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Memory and Redis cache status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Cache Usage</span>
                      <span>{cacheStats.memoryCache.size}/{cacheStats.memoryCache.max}</span>
                    </div>
                    <Progress 
                      value={(cacheStats.memoryCache.size / cacheStats.memoryCache.max) * 100} 
                      className="mt-2" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redis Status</span>
                    <Badge variant={cacheStats.redis.connected ? 'default' : 'secondary'}>
                      {cacheStats.redis.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Statistics</CardTitle>
              <CardDescription>Database table performance and maintenance status</CardDescription>
            </CardHeader>
            <CardContent>
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
                    {tableStats.map((table, index) => (
                      <tr key={index} className="border-b">
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
                            : 'Never'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Index Usage</CardTitle>
              <CardDescription>Database index performance and usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
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
                    {indexUsage.map((index, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-medium">{index.indexname}</td>
                        <td className="p-2">{index.tablename}</td>
                        <td className="text-right p-2">{index.idx_scan.toLocaleString()}</td>
                        <td className="text-right p-2">{index.idx_tup_read.toLocaleString()}</td>
                        <td className="p-2">
                          <Badge 
                            variant={
                              index.usage_status === 'Frequently used' ? 'default' :
                              index.usage_status === 'Rarely used' ? 'secondary' : 'destructive'
                            }
                          >
                            {index.usage_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Memory Cache</CardTitle>
                <CardDescription>In-memory LRU cache statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Items</span>
                      <span>{cacheStats.memoryCache.size}/{cacheStats.memoryCache.max}</span>
                    </div>
                    <Progress 
                      value={(cacheStats.memoryCache.size / cacheStats.memoryCache.max) * 100} 
                      className="mt-2" 
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Calculated Size</span>
                    <span>{(cacheStats.memoryCache.calculatedSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => clearCache(['memory'])}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Memory Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Redis Cache</CardTitle>
                <CardDescription>Redis cache connection and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Status</span>
                    <Badge variant={cacheStats.redis.connected ? 'default' : 'destructive'}>
                      {cacheStats.redis.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ready State</span>
                    <Badge variant={cacheStats.redis.ready ? 'default' : 'secondary'}>
                      {cacheStats.redis.ready ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => clearCache(['redis'])}
                    className="w-full"
                    disabled={!cacheStats.redis.connected}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Redis Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}