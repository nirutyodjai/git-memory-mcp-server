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
exports.AnalyticsDashboard = AnalyticsDashboard;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const select_1 = require("@/components/ui/select");
const calendar_1 = require("@/components/ui/calendar");
const popover_1 = require("@/components/ui/popover");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const utils_1 = require("@/lib/utils");
function AnalyticsDashboard() {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [dateRange, setDateRange] = (0, react_1.useState)({
        from: (0, date_fns_1.subDays)(new Date(), 30),
        to: new Date()
    });
    const [selectedMetric, setSelectedMetric] = (0, react_1.useState)('pageViews');
    const [refreshInterval, setRefreshInterval] = (0, react_1.useState)(null);
    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    metrics: ['pageViews', 'uniqueVisitors', 'bounceRate', 'avgSessionDuration']
                })
            });
            if (response.ok) {
                const analyticsData = await response.json();
                setData(analyticsData);
            }
        }
        catch (error) {
            console.error('Failed to fetch analytics data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Auto-refresh setup
    (0, react_1.useEffect)(() => {
        fetchAnalyticsData();
        if (refreshInterval) {
            const interval = setInterval(fetchAnalyticsData, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [dateRange, refreshInterval]);
    // Format numbers
    const formatNumber = (num) => {
        if (num >= 1000000)
            return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000)
            return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };
    // Format percentage
    const formatPercentage = (num) => `${num.toFixed(1)}%`;
    // Format duration
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    if (loading) {
        return (<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (<card_1.Card key={i} className="animate-pulse">
              <card_1.CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>
      </div>);
    }
    if (!data) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data available</p>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your website performance and user behavior</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Date Range Picker */}
          <popover_1.Popover>
            <popover_1.PopoverTrigger asChild>
              <button_1.Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <lucide_react_1.CalendarIcon className="mr-2 h-4 w-4"/>
                {dateRange.from ? (dateRange.to ? (<>
                      {(0, date_fns_1.format)(dateRange.from, "LLL dd, y")} -{" "}
                      {(0, date_fns_1.format)(dateRange.to, "LLL dd, y")}
                    </>) : ((0, date_fns_1.format)(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
              </button_1.Button>
            </popover_1.PopoverTrigger>
            <popover_1.PopoverContent className="w-auto p-0" align="start">
              <calendar_1.Calendar initialFocus mode="range" defaultMonth={dateRange.from} selected={dateRange} onSelect={(range) => range && setDateRange(range)} numberOfMonths={2}/>
            </popover_1.PopoverContent>
          </popover_1.Popover>
          
          {/* Auto Refresh */}
          <select_1.Select value={refreshInterval?.toString() || 'off'} onValueChange={(value) => setRefreshInterval(value === 'off' ? null : parseInt(value))}>
            <select_1.SelectTrigger className="w-[140px]">
              <select_1.SelectValue placeholder="Auto refresh"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="off">Off</select_1.SelectItem>
              <select_1.SelectItem value="30">30 seconds</select_1.SelectItem>
              <select_1.SelectItem value="60">1 minute</select_1.SelectItem>
              <select_1.SelectItem value="300">5 minutes</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          
          <button_1.Button onClick={fetchAnalyticsData} variant="outline">
            Refresh
          </button_1.Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Page Views</card_1.CardTitle>
            <lucide_react_1.Eye className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.pageViews)}</div>
            <p className="text-xs text-muted-foreground">
              <lucide_react_1.TrendingUp className="inline h-3 w-3 mr-1"/>
              +12.5% from last period
            </p>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Unique Visitors</card_1.CardTitle>
            <lucide_react_1.Users className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.uniqueVisitors)}</div>
            <p className="text-xs text-muted-foreground">
              <lucide_react_1.TrendingUp className="inline h-3 w-3 mr-1"/>
              +8.2% from last period
            </p>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Bounce Rate</card_1.CardTitle>
            <lucide_react_1.TrendingDown className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.bounceRate)}</div>
            <p className="text-xs text-muted-foreground">
              <lucide_react_1.TrendingDown className="inline h-3 w-3 mr-1"/>
              -2.1% from last period
            </p>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">Avg. Session Duration</card_1.CardTitle>
            <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">
              <lucide_react_1.TrendingUp className="inline h-3 w-3 mr-1"/>
              +5.3% from last period
            </p>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Real-time Stats */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time Activity
          </card_1.CardTitle>
          <card_1.CardDescription>
            Current visitors and activity on your website
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{data.realTimeVisitors}</div>
              <p className="text-sm text-muted-foreground">Active visitors right now</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{formatPercentage(data.conversionRate)}</div>
              <p className="text-sm text-muted-foreground">Conversion rate</p>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Detailed Analytics Tabs */}
      <tabs_1.Tabs defaultValue="pages" className="space-y-4">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="pages">Top Pages</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="countries">Countries</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="devices">Devices</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="sources">Traffic Sources</tabs_1.TabsTrigger>
        </tabs_1.TabsList>
        
        <tabs_1.TabsContent value="pages" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Top Pages</card_1.CardTitle>
              <card_1.CardDescription>Most visited pages on your website</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {data.topPages.map((page, index) => (<div key={page.path} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <badge_1.Badge variant="outline">{index + 1}</badge_1.Badge>
                      <div>
                        <p className="font-medium">{page.path}</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(page.views)} views</p>
                      </div>
                    </div>
                    <div className={(0, utils_1.cn)("flex items-center gap-1 text-sm", page.change >= 0 ? "text-green-600" : "text-red-600")}>
                      {page.change >= 0 ? <lucide_react_1.TrendingUp className="h-3 w-3"/> : <lucide_react_1.TrendingDown className="h-3 w-3"/>}
                      {Math.abs(page.change)}%
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
        
        <tabs_1.TabsContent value="countries" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Top Countries</card_1.CardTitle>
              <card_1.CardDescription>Visitors by country</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {data.topCountries.map((country, index) => (<div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <badge_1.Badge variant="outline">{index + 1}</badge_1.Badge>
                      <div>
                        <p className="font-medium">{country.country}</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(country.visitors)} visitors</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(country.percentage)}
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
        
        <tabs_1.TabsContent value="devices" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Device Types</card_1.CardTitle>
              <card_1.CardDescription>Visitors by device type</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {data.deviceTypes.map((device) => (<div key={device.type} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{device.type}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(device.count)} visitors</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(device.percentage)}
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
        
        <tabs_1.TabsContent value="sources" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Traffic Sources</card_1.CardTitle>
              <card_1.CardDescription>Where your visitors come from</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {data.trafficSources.map((source) => (<div key={source.source} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{source.source}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(source.visitors)} visitors</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(source.percentage)}
                    </div>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
exports.default = AnalyticsDashboard;
//# sourceMappingURL=analytics-dashboard.js.map