'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory, BlogSearchFilters } from '@/lib/blog/blog-service';
import { useBlog } from './blog-provider';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Eye, Heart, MessageCircle, User, Search, Filter, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

interface BlogListProps {
  showFilters?: boolean;
  showSearch?: boolean;
  limit?: number;
  categoryId?: string;
  authorId?: string;
  status?: BlogPost['status'];
  variant?: 'grid' | 'list';
}

export function BlogList({
  showFilters = true,
  showSearch = true,
  limit,
  categoryId,
  authorId,
  status = 'published',
  variant = 'grid',
}: BlogListProps) {
  const { t } = useTranslation();
  const { state, loadPosts, loadCategories } = useBlog();
  const [filters, setFilters] = useState<BlogSearchFilters>({
    status,
    category: categoryId,
    author: authorId,
    limit,
    page: 1,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(variant);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
    loadPosts(filters);
  }, [loadCategories, loadPosts, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFilterChange = (key: keyof BlogSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const renderPostCard = (post: BlogPost) => {
    const isGridView = viewMode === 'grid';
    
    return (
      <Card key={post.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${
        isGridView ? '' : 'flex flex-row'
      }`}>
        {post.featuredImage && (
          <div className={`relative ${
            isGridView ? 'h-48 w-full' : 'h-32 w-48 flex-shrink-0'
          }`}>
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className={`${isGridView ? '' : 'flex-1'}`}>
          <CardHeader className={`${isGridView ? 'pb-2' : 'pb-1'}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
              >
                {post.category.name}
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <CardTitle className={`${isGridView ? 'text-lg' : 'text-base'} line-clamp-2`}>
              <Link 
                href={`/blog/${post.slug}`}
                className="hover:text-primary transition-colors"
              >
                {post.title}
              </Link>
            </CardTitle>
          </CardHeader>
          
          <CardContent className={`${isGridView ? 'pt-0' : 'pt-0 pb-2'}`}>
            <p className={`text-muted-foreground mb-4 ${
              isGridView ? 'line-clamp-3' : 'line-clamp-2'
            }`}>
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.author.name}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {post.comments.length}
                </span>
              </div>
              
              {post.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {post.tags.slice(0, isGridView ? 3 : 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > (isGridView ? 3 : 2) && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - (isGridView ? 3 : 2)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  const renderPagination = () => {
    if (!state.searchResult || state.searchResult.totalPages <= 1) return null;

    const { page, totalPages } = state.searchResult;
    const pages = [];
    
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          {t('common.previous')}
        </Button>
        
        {pages.map(pageNum => (
          <Button
            key={pageNum}
            variant={pageNum === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          {t('common.next')}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('blog.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {state.searchResult ? 
              t('blog.postsFound', { count: state.searchResult.total }) : 
              t('blog.description')
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('blog.search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('blog.filters.category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('blog.filters.allCategories')}</SelectItem>
                      {state.categories.map(category => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name} ({category.postCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.sortBy || 'publishedAt'}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('blog.filters.sortBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publishedAt">{t('blog.sort.newest')}</SelectItem>
                      <SelectItem value="views">{t('blog.sort.popular')}</SelectItem>
                      <SelectItem value="likes">{t('blog.sort.liked')}</SelectItem>
                      <SelectItem value="title">{t('blog.sort.title')}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('blog.filters.order')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">{t('blog.sort.descending')}</SelectItem>
                      <SelectItem value="asc">{t('blog.sort.ascending')}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.limit?.toString() || '10'}
                    onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('blog.filters.perPage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 {t('blog.filters.posts')}</SelectItem>
                      <SelectItem value="10">10 {t('blog.filters.posts')}</SelectItem>
                      <SelectItem value="20">20 {t('blog.filters.posts')}</SelectItem>
                      <SelectItem value="50">50 {t('blog.filters.posts')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{state.error}</p>
              <Button onClick={() => loadPosts(filters)}>
                {t('common.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Grid/List */}
      {!state.loading && !state.error && state.searchResult && (
        <>
          {state.searchResult.posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">{t('blog.empty.title')}</h3>
                  <p className="text-muted-foreground mb-4">{t('blog.empty.description')}</p>
                  <Button onClick={() => {
                    setSearchQuery('');
                    setFilters({ status, page: 1, sortBy: 'publishedAt', sortOrder: 'desc' });
                  }}>
                    {t('blog.empty.clearFilters')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }`}>
              {state.searchResult.posts.map(renderPostCard)}
            </div>
          )}
          
          {renderPagination()}
        </>
      )}
    </div>
  );
}