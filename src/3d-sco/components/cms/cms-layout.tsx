'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Image,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Tag,
  User,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CMSLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  showSidebar?: boolean
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
}

interface CMSSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

interface CMSHeaderProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

interface CMSStatsProps {
  stats: Array<{
    label: string
    value: string | number
    icon: React.ReactNode
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
}

interface CMSContentGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

interface CMSToolbarProps {
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

export function CMSLayout({
  children,
  sidebar,
  header,
  showSidebar = true,
  sidebarCollapsed = false,
  onSidebarToggle
}: CMSLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {showSidebar && (
        <div className={cn(
          "border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          {sidebar}
        </div>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {header && (
          <div className="border-b bg-card">
            {header}
          </div>
        )}
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function CMSSidebar({
  collapsed = false,
  onToggle,
  activeTab = 'dashboard',
  onTabChange
}: CMSSidebarProps) {
  const { t } = useI18n()
  
  const menuItems = [
    {
      id: 'dashboard',
      label: t('cms.dashboard.title'),
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin/cms'
    },
    {
      id: 'content',
      label: t('cms.content.title'),
      icon: <FileText className="w-5 h-5" />,
      href: '/admin/cms/content',
      badge: '12'
    },
    {
      id: 'categories',
      label: t('cms.categories.title'),
      icon: <FolderTree className="w-5 h-5" />,
      href: '/admin/cms/categories'
    },
    {
      id: 'media',
      label: t('cms.media.title'),
      icon: <Image className="w-5 h-5" />,
      href: '/admin/cms/media',
      badge: '48'
    },
    {
      id: 'analytics',
      label: t('cms.analytics.title'),
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/admin/cms/analytics'
    },
    {
      id: 'settings',
      label: t('common.settings'),
      icon: <Settings className="w-5 h-5" />,
      href: '/admin/cms/settings'
    }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold">
              {t('cms.dashboard.title')}
            </h2>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="ml-auto"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start mb-1",
                collapsed ? "px-2" : "px-3"
              )}
              onClick={() => onTabChange?.(item.id)}
            >
              {item.icon}
              {!collapsed && (
                <>
                  <span className="ml-3">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}

export function CMSHeader({
  title,
  description,
  actions,
  breadcrumbs
}: CMSHeaderProps) {
  return (
    <div className="p-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              <span className={index === breadcrumbs.length - 1 ? 'text-foreground' : ''}>
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export function CMSStats({ stats }: CMSStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.trend && (
                  <p className={cn(
                    "text-xs",
                    stat.trend.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                  </p>
                )}
              </div>
              <div className="text-muted-foreground">
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function CMSContentGrid({
  children,
  columns = 3,
  gap = 'md'
}: CMSContentGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }
  
  const gapSize = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={cn('grid', gridCols[columns], gapSize[gap])}>
      {children}
    </div>
  )
}

export function CMSToolbar({
  searchPlaceholder = 'Search...',
  onSearch,
  filters,
  actions,
  viewMode = 'grid',
  onViewModeChange
}: CMSToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        {filters && (
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {onViewModeChange && (
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none border-l"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {actions}
      </div>
    </div>
  )
}

export function CMSContentCard({
  title,
  description,
  image,
  status,
  type,
  author,
  publishedAt,
  tags,
  onEdit,
  onDelete,
  onView
}: {
  title: string
  description?: string
  image?: string
  status: 'draft' | 'published' | 'archived'
  type: string
  author?: string
  publishedAt?: Date
  tags?: string[]
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
}) {
  const { t } = useI18n()
  
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      {image && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge className={statusColors[status]}>
            {t(`cms.content.status.${status}`)}
          </Badge>
          <Badge variant="outline">
            {t(`cms.content.type.${type}`)}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {description && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {description}
          </p>
        )}
        
        <div className="space-y-3">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {author && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {author}
                </div>
              )}
              {publishedAt && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {publishedAt.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {onView && (
                <Button variant="ghost" size="sm" onClick={onView}>
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CMSLayout