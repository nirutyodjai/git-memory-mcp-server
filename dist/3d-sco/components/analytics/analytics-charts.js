"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficOverviewChart = TrafficOverviewChart;
exports.HourlyTrafficChart = HourlyTrafficChart;
exports.DeviceTypesChart = DeviceTypesChart;
exports.TopPagesChart = TopPagesChart;
exports.GeographicChart = GeographicChart;
exports.BrowserChart = BrowserChart;
exports.ChatActivityChart = ChatActivityChart;
exports.PerformanceChart = PerformanceChart;
exports.AnalyticsCharts = AnalyticsCharts;
const react_1 = __importDefault(require("react"));
const card_1 = require("@/components/ui/card");
const recharts_1 = require("recharts");
// Color palette for charts
const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    warning: '#f97316',
    info: '#06b6d4',
    success: '#22c55e',
    muted: '#6b7280'
};
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
// Traffic Overview Chart
function TrafficOverviewChart({ data, className }) {
    if (!data?.traffic?.daily)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Traffic Overview</card_1.CardTitle>
        <card_1.CardDescription>Daily visitors and page views for the last 7 days</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.AreaChart data={data.traffic.daily}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
            <recharts_1.XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })} className="text-xs"/>
            <recharts_1.YAxis className="text-xs"/>
            <recharts_1.Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} formatter={(value, name) => [
            value.toLocaleString(),
            name === 'visitors' ? 'ผู้เยี่ยมชม' : name === 'pageViews' ? 'การดูหน้า' : 'เซสชัน'
        ]}/>
            <recharts_1.Legend formatter={(value) => value === 'visitors' ? 'ผู้เยี่ยมชม' :
            value === 'pageViews' ? 'การดูหน้า' : 'เซสชัน'}/>
            <recharts_1.Area type="monotone" dataKey="pageViews" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6}/>
            <recharts_1.Area type="monotone" dataKey="visitors" stackId="2" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.6}/>
          </recharts_1.AreaChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Hourly Traffic Chart
function HourlyTrafficChart({ data, className }) {
    if (!data?.traffic?.hourly)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Hourly Traffic</card_1.CardTitle>
        <card_1.CardDescription>Visitor distribution throughout the day</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.LineChart data={data.traffic.hourly}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
            <recharts_1.XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} className="text-xs"/>
            <recharts_1.YAxis className="text-xs"/>
            <recharts_1.Tooltip labelFormatter={(value) => `เวลา ${value}:00`} formatter={(value, name) => [
            value.toLocaleString(),
            name === 'visitors' ? 'ผู้เยี่ยมชม' : 'การดูหน้า'
        ]}/>
            <recharts_1.Legend formatter={(value) => value === 'visitors' ? 'ผู้เยี่ยมชม' : 'การดูหน้า'}/>
            <recharts_1.Line type="monotone" dataKey="visitors" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}/>
            <recharts_1.Line type="monotone" dataKey="pageViews" stroke={COLORS.secondary} strokeWidth={2} dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: COLORS.secondary, strokeWidth: 2 }}/>
          </recharts_1.LineChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Device Types Chart
function DeviceTypesChart({ data, className }) {
    if (!data?.devices?.deviceTypes)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Device Types</card_1.CardTitle>
        <card_1.CardDescription>Visitor distribution by device type</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.PieChart>
            <recharts_1.Pie data={data.devices.deviceTypes} cx="50%" cy="50%" labelLine={false} label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`} outerRadius={80} fill="#8884d8" dataKey="count">
              {data.devices.deviceTypes.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]}/>))}
            </recharts_1.Pie>
            <recharts_1.Tooltip formatter={(value) => [value.toLocaleString(), 'ผู้เยี่ยมชม']}/>
            <recharts_1.Legend />
          </recharts_1.PieChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Top Pages Chart
function TopPagesChart({ data, className }) {
    if (!data?.pages?.topPages)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Top Pages</card_1.CardTitle>
        <card_1.CardDescription>Most visited pages on your website</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.BarChart data={data.pages.topPages} layout="horizontal">
            <recharts_1.CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
            <recharts_1.XAxis type="number" className="text-xs"/>
            <recharts_1.YAxis type="category" dataKey="title" width={100} className="text-xs"/>
            <recharts_1.Tooltip formatter={(value) => [value.toLocaleString(), 'การดูหน้า']} labelFormatter={(label) => `หน้า: ${label}`}/>
            <recharts_1.Bar dataKey="views" fill={COLORS.primary} radius={[0, 4, 4, 0]}/>
          </recharts_1.BarChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Geographic Distribution Chart
function GeographicChart({ data, className }) {
    if (!data?.geography?.countries)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Geographic Distribution</card_1.CardTitle>
        <card_1.CardDescription>Visitors by country</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.BarChart data={data.geography.countries.slice(0, 7)}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
            <recharts_1.XAxis dataKey="country" angle={-45} textAnchor="end" height={80} className="text-xs"/>
            <recharts_1.YAxis className="text-xs"/>
            <recharts_1.Tooltip formatter={(value) => [value.toLocaleString(), 'ผู้เยี่ยมชม']} labelFormatter={(label) => `ประเทศ: ${label}`}/>
            <recharts_1.Bar dataKey="visitors" fill={COLORS.secondary} radius={[4, 4, 0, 0]}/>
          </recharts_1.BarChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Browser Distribution Chart
function BrowserChart({ data, className }) {
    if (!data?.devices?.browsers)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Browser Distribution</card_1.CardTitle>
        <card_1.CardDescription>Visitors by browser type</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.PieChart>
            <recharts_1.Pie data={data.devices.browsers} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="count">
              {data.devices.browsers.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]}/>))}
            </recharts_1.Pie>
            <recharts_1.Tooltip formatter={(value) => [value.toLocaleString(), 'ผู้เยี่ยมชม']}/>
            <recharts_1.Legend />
          </recharts_1.PieChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Chat Activity Chart
function ChatActivityChart({ data, className }) {
    if (!data?.chat?.messagesByHour)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Chat Activity</card_1.CardTitle>
        <card_1.CardDescription>Messages sent throughout the day</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.AreaChart data={data.chat.messagesByHour}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
            <recharts_1.XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} className="text-xs"/>
            <recharts_1.YAxis className="text-xs"/>
            <recharts_1.Tooltip labelFormatter={(value) => `เวลา ${value}:00`} formatter={(value) => [value.toLocaleString(), 'ข้อความ']}/>
            <recharts_1.Area type="monotone" dataKey="messages" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.6}/>
          </recharts_1.AreaChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Performance Metrics Chart
function PerformanceChart({ data, className }) {
    if (!data?.performance?.errorsByType)
        return null;
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <card_1.CardTitle>Error Distribution</card_1.CardTitle>
        <card_1.CardDescription>Types of errors encountered</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.BarChart data={data.performance.errorsByType}>
            <recharts_1.CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
            <recharts_1.XAxis dataKey="type" angle={-45} textAnchor="end" height={80} className="text-xs"/>
            <recharts_1.YAxis className="text-xs"/>
            <recharts_1.Tooltip formatter={(value) => [value.toLocaleString(), 'จำนวนข้อผิดพลาด']}/>
            <recharts_1.Bar dataKey="count" fill={COLORS.danger} radius={[4, 4, 0, 0]}/>
          </recharts_1.BarChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
// Combined Analytics Charts Component
function AnalyticsCharts({ data }) {
    if (!data)
        return null;
    return (<div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficOverviewChart data={data}/>
        <HourlyTrafficChart data={data}/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceTypesChart data={data}/>
        <BrowserChart data={data}/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPagesChart data={data}/>
        <GeographicChart data={data}/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatActivityChart data={data}/>
        <PerformanceChart data={data}/>
      </div>
    </div>);
}
exports.default = AnalyticsCharts;
//# sourceMappingURL=analytics-charts.js.map