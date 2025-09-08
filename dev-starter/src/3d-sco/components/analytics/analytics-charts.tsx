'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface ChartProps {
  data: any
  className?: string
}

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
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

// Traffic Overview Chart
export function TrafficOverviewChart({ data, className }: ChartProps) {
  if (!data?.traffic?.daily) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Traffic Overview</CardTitle>
        <CardDescription>Daily visitors and page views for the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.traffic.daily}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'visitors' ? 'ผู้เยี่ยมชม' : name === 'pageViews' ? 'การดูหน้า' : 'เซสชัน'
              ]}
            />
            <Legend 
              formatter={(value) => 
                value === 'visitors' ? 'ผู้เยี่ยมชม' : 
                value === 'pageViews' ? 'การดูหน้า' : 'เซสชัน'
              }
            />
            <Area 
              type="monotone" 
              dataKey="pageViews" 
              stackId="1" 
              stroke={COLORS.primary} 
              fill={COLORS.primary} 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="visitors" 
              stackId="2" 
              stroke={COLORS.secondary} 
              fill={COLORS.secondary} 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Hourly Traffic Chart
export function HourlyTrafficChart({ data, className }: ChartProps) {
  if (!data?.traffic?.hourly) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Hourly Traffic</CardTitle>
        <CardDescription>Visitor distribution throughout the day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.traffic.hourly}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={(value) => `${value}:00`}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip 
              labelFormatter={(value) => `เวลา ${value}:00`}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'visitors' ? 'ผู้เยี่ยมชม' : 'การดูหน้า'
              ]}
            />
            <Legend 
              formatter={(value) => 
                value === 'visitors' ? 'ผู้เยี่ยมชม' : 'การดูหน้า'
              }
            />
            <Line 
              type="monotone" 
              dataKey="visitors" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="pageViews" 
              stroke={COLORS.secondary} 
              strokeWidth={2}
              dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.secondary, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Device Types Chart
export function DeviceTypesChart({ data, className }: ChartProps) {
  if (!data?.devices?.deviceTypes) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Device Types</CardTitle>
        <CardDescription>Visitor distribution by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.devices.deviceTypes}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.devices.deviceTypes.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value.toLocaleString(), 'ผู้เยี่ยมชม']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Top Pages Chart
export function TopPagesChart({ data, className }: ChartProps) {
  if (!data?.pages?.topPages) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
        <CardDescription>Most visited pages on your website</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.pages.topPages} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" className="text-xs" />
            <YAxis 
              type="category" 
              dataKey="title" 
              width={100}
              className="text-xs"
            />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'การดูหน้า']}
              labelFormatter={(label) => `หน้า: ${label}`}
            />
            <Bar 
              dataKey="views" 
              fill={COLORS.primary}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Geographic Distribution Chart
export function GeographicChart({ data, className }: ChartProps) {
  if (!data?.geography?.countries) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Geographic Distribution</CardTitle>
        <CardDescription>Visitors by country</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.geography.countries.slice(0, 7)}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="country" 
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'ผู้เยี่ยมชม']}
              labelFormatter={(label) => `ประเทศ: ${label}`}
            />
            <Bar 
              dataKey="visitors" 
              fill={COLORS.secondary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Browser Distribution Chart
export function BrowserChart({ data, className }: ChartProps) {
  if (!data?.devices?.browsers) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Browser Distribution</CardTitle>
        <CardDescription>Visitors by browser type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.devices.browsers}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
            >
              {data.devices.browsers.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'ผู้เยี่ยมชม']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Chat Activity Chart
export function ChatActivityChart({ data, className }: ChartProps) {
  if (!data?.chat?.messagesByHour) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Chat Activity</CardTitle>
        <CardDescription>Messages sent throughout the day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.chat.messagesByHour}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={(value) => `${value}:00`}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip 
              labelFormatter={(value) => `เวลา ${value}:00`}
              formatter={(value: number) => [value.toLocaleString(), 'ข้อความ']}
            />
            <Area 
              type="monotone" 
              dataKey="messages" 
              stroke={COLORS.accent} 
              fill={COLORS.accent} 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Performance Metrics Chart
export function PerformanceChart({ data, className }: ChartProps) {
  if (!data?.performance?.errorsByType) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Error Distribution</CardTitle>
        <CardDescription>Types of errors encountered</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.performance.errorsByType}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="type" 
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'จำนวนข้อผิดพลาด']}
            />
            <Bar 
              dataKey="count" 
              fill={COLORS.danger}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Combined Analytics Charts Component
export function AnalyticsCharts({ data }: { data: any }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficOverviewChart data={data} />
        <HourlyTrafficChart data={data} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceTypesChart data={data} />
        <BrowserChart data={data} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPagesChart data={data} />
        <GeographicChart data={data} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatActivityChart data={data} />
        <PerformanceChart data={data} />
      </div>
    </div>
  )
}

export default AnalyticsCharts