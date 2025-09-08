'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TrendingUp, TrendingDown, Users, Eye, Clock, Globe } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  topPages: Array<{ path: string; views: number; change: number }>
  topCountries: Array<{ country: string; visitors: number; percentage: number }>
  deviceTypes: Array<{ type: string; count: number; percentage: number }>
  trafficSources: Array<{ source: string; visitors: number; percentage: number }>
  realTimeVisitors: number
  conversionRate: number
  goalCompletions: number
}

interface DateRange {
  from: Date
  to: Date
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [selectedMetric, setSelectedMetric] = useState('pageViews')
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          metrics: ['pageViews', 'uniqueVisitors', 'bounceRate', 'avgSessionDuration']
        })
      })
      
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh setup
  useEffect(() => {
    fetchAnalyticsData()
    
    if (refreshInterval) {
      const interval = setInterval(fetchAnalyticsData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [dateRange, refreshInterval])

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Format percentage
  const formatPercentage = (num: number): string => `${num.toFixed(1)}%`

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your website performance and user behavior</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => range && setDateRange(range as DateRange)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          {/* Auto Refresh */}
          <Select value={refreshInterval?.toString() || 'off'} onValueChange={(value) => 
            setRefreshInterval(value === 'off' ? null : parseInt(value))
          }>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Auto refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalyticsData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.pageViews)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.uniqueVisitors)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8.2% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.bounceRate)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -2.1% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5.3% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time Activity
          </CardTitle>
          <CardDescription>
            Current visitors and activity on your website
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages on your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPages.map((page, index) => (
                  <div key={page.path} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{page.path}</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(page.views)} views</p>
                      </div>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      page.change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {page.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(page.change)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Visitors by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{country.country}</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(country.visitors)} visitors</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(country.percentage)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
              <CardDescription>Visitors by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.deviceTypes.map((device) => (
                  <div key={device.type} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{device.type}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(device.count)} visitors</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(device.percentage)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.trafficSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{source.source}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(source.visitors)} visitors</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(source.percentage)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboard