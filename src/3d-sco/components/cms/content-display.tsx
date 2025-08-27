'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/client'
import { CMSClient } from '@/lib/cms/client'
import type { Content } from '@/lib/cms/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, User, Tag, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { th, en, zhCN, ja } from 'date-fns/locale'

interface ContentDisplayProps {
  type?: 'page' | 'post' | 'project' | 'skill'
  categorySlug?: string
  featured?: boolean
  limit?: number
  showSearch?: boolean
  showFilters?: boolean
  showPagination?: boolean
  layout?: 'grid' | 'list' | 'card'
}

const cmsClient = new CMSClient()

const getDateLocale = (locale: string) => {
  switch (locale) {
    case 'th': return th
    case 'zh': return zhCN
    case 'ja': return ja
    default: return en
  }
}

export function ContentDisplay({
  type,
  categorySlug,
  featured = false,
  limit = 10,
  showSearch = true,
  showFilters = true,
  showPagination = true,
  layout = 'card'
}: ContentDisplayProps) {
  const { t, locale } = useI18n()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>(type || 'all')
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<any[]>([])

  const dateLocale = getDateLocale(locale)

  useEffect(() => {
    fetchContent()
    if (showFilters) {
      fetchCategories()
    }
  }, [searchQuery, selectedType, selectedCategory, currentPage, type, categorySlug, featured])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit,
        status: 'published',
        locale
      }

      if (searchQuery) params.search = searchQuery
      if (selectedType !== 'all') params.type = selectedType
      if (selectedCategory !== 'all') params.categorySlug = selectedCategory
      if (featured) params.featured = true

      const response = await cmsClient.getContent(params)
      setContent(response.data)
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit))
    } catch (err) {
      setError(t('cms.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await cmsClient.getCategories()
      setCategories(response.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType)
    setCurrentPage(1)
  }

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory)
    setCurrentPage(1)
  }

  const renderContentCard = (item: Content) => {
    const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt)
    
    return (
      <Card key={item.id} className="h-full hover:shadow-lg transition-shadow">
        {item.featuredImage && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img
              src={item.featuredImage}
              alt={item.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              {t(`cms.content.type.${item.type}`)}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              {format(publishedDate, 'PPP', { locale: dateLocale })}
            </div>
          </div>
          <CardTitle className="line-clamp-2">{item.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {item.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {item.excerpt}
            </p>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-4 h-4 mr-1" />
              {item.author || 'Admin'}
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              {t('common.readMore')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderContentList = (item: Content) => {
    const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt)
    
    return (
      <Card key={item.id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {item.featuredImage && (
              <div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={item.featuredImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {t(`cms.content.type.${item.type}`)}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(publishedDate, 'PPP', { locale: dateLocale })}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              {item.excerpt && (
                <p className="text-muted-foreground mb-3 line-clamp-2">
                  {item.excerpt}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="w-4 h-4 mr-1" />
                    {item.author || 'Admin'}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1">
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  {t('common.readMore')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {showSearch && (
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            {showFilters && (
              <>
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-40" />
              </>
            )}
          </div>
        )}
        <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video" />
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchContent}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('cms.content.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cms.content.allTypes')}</SelectItem>
                  <SelectItem value="page">{t('cms.content.type.page')}</SelectItem>
                  <SelectItem value="post">{t('cms.content.type.post')}</SelectItem>
                  <SelectItem value="project">{t('cms.content.type.project')}</SelectItem>
                  <SelectItem value="skill">{t('cms.content.type.skill')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cms.categories.title')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Content Grid/List */}
      {content.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('cms.content.noContent')}</p>
        </div>
      ) : (
        <div className={layout === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {content.map((item) => 
            layout === 'list' ? renderContentList(item) : renderContentCard(item)
          )}
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            {t('common.previous')}
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ContentDisplay