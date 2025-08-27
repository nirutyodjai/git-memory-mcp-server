'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/providers/i18n-provider';
import {
  useContent,
  useCategories,
  useMedia,
  useContentMutations,
  useCategoryMutations,
  useMediaMutations,
  usePagination,
  useContentFilters,
  useMediaFilters,
  useBulkOperations,
} from '@/lib/cms/hooks';
import { Content, Category, Media } from '@/lib/cms/client';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  UploadIcon,
  ImageIcon,
  FileTextIcon,
  VideoIcon,
  MusicIcon,
  FileIcon,
} from 'lucide-react';
import { formatFileSize, getMediaTypeIcon } from '@/lib/cms/client';

interface AdminDashboardProps {
  className?: string;
}

export function AdminDashboard({ className }: AdminDashboardProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('content');

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('cms.dashboard.title', 'common')}</h1>
          <p className="text-muted-foreground">
            {t('cms.dashboard.description', 'common')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">{t('cms.content.title', 'common')}</TabsTrigger>
          <TabsTrigger value="categories">{t('cms.categories.title', 'common')}</TabsTrigger>
          <TabsTrigger value="media">{t('cms.media.title', 'common')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('cms.analytics.title', 'common')}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <ContentManagement />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <MediaManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Content Management Component
function ContentManagement() {
  const { t } = useI18n();
  const { filters, updateFilter, clearFilters } = useContentFilters();
  const { page, limit, nextPage, prevPage, goToPage, changeLimit } = usePagination();
  const { data: contentData, loading, error, refetch } = useContent({ ...filters, page, limit });
  const { deleteContent } = useContentMutations();
  const { selectedIds, toggleItem, selectAll, deselectAll, isSelected, selectedCount } = useBulkOperations<Content>();

  const handleDelete = async (id: string) => {
    if (confirm(t('cms.content.confirmDelete', 'common'))) {
      try {
        await deleteContent(id);
        await refetch();
      } catch (error) {
        console.error('Failed to delete content:', error);
      }
    }
  };

  const getStatusBadge = (status: Content['status']) => {
    const variants = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {t(`cms.content.status.${status}`, 'common')}
      </Badge>
    );
  };

  const getTypeBadge = (type: Content['type']) => {
    const colors = {
      page: 'bg-blue-100 text-blue-800',
      post: 'bg-green-100 text-green-800',
      project: 'bg-purple-100 text-purple-800',
      skill: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={colors[type]}>
        {t(`cms.content.type.${type}`, 'common')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{t('cms.error.loadFailed', 'common')}: {error}</p>
            <Button onClick={refetch} className="mt-2">
              {t('common.retry', 'common')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={t('cms.content.searchPlaceholder', 'common')}
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-64"
          />
          <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('cms.content.allStatuses', 'common')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('cms.content.allStatuses', 'common')}</SelectItem>
              <SelectItem value="published">{t('cms.content.status.published', 'common')}</SelectItem>
              <SelectItem value="draft">{t('cms.content.status.draft', 'common')}</SelectItem>
              <SelectItem value="archived">{t('cms.content.status.archived', 'common')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value || undefined)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('cms.content.allTypes', 'common')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('cms.content.allTypes', 'common')}</SelectItem>
              <SelectItem value="page">{t('cms.content.type.page', 'common')}</SelectItem>
              <SelectItem value="post">{t('cms.content.type.post', 'common')}</SelectItem>
              <SelectItem value="project">{t('cms.content.type.project', 'common')}</SelectItem>
              <SelectItem value="skill">{t('cms.content.type.skill', 'common')}</SelectItem>
            </SelectContent>
          </Select>
          {Object.keys(filters).length > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'common')}
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {t('cms.selected', 'common', { count: selectedCount })}
              </span>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                {t('common.deselectAll', 'common')}
              </Button>
              <Button variant="destructive" size="sm">
                {t('common.deleteSelected', 'common')}
              </Button>
            </>
          )}
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('cms.content.create', 'common')}
          </Button>
        </div>
      </div>

      {/* Content table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={contentData?.content.length > 0 && selectedCount === contentData.content.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAll(contentData?.content || []);
                      } else {
                        deselectAll();
                      }
                    }}
                  />
                </TableHead>
                <TableHead>{t('cms.content.title', 'common')}</TableHead>
                <TableHead>{t('cms.content.type', 'common')}</TableHead>
                <TableHead>{t('cms.content.status', 'common')}</TableHead>
                <TableHead>{t('cms.content.category', 'common')}</TableHead>
                <TableHead>{t('cms.content.updatedAt', 'common')}</TableHead>
                <TableHead className="w-32">{t('common.actions', 'common')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentData?.content.map((content) => (
                <TableRow key={content.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected(content.id)}
                      onChange={() => toggleItem(content.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{content.title}</div>
                      <div className="text-sm text-muted-foreground">/{content.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(content.type)}</TableCell>
                  <TableCell>{getStatusBadge(content.status)}</TableCell>
                  <TableCell>
                    {content.category && (
                      <Badge variant="outline">{content.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(content.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(content.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {contentData?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('cms.pagination.showing', 'common', {
              start: (contentData.pagination.page - 1) * contentData.pagination.limit + 1,
              end: Math.min(contentData.pagination.page * contentData.pagination.limit, contentData.pagination.total),
              total: contentData.pagination.total,
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={!contentData.pagination.hasPrev}
            >
              {t('common.previous', 'common')}
            </Button>
            <span className="text-sm">
              {t('cms.pagination.page', 'common', {
                current: contentData.pagination.page,
                total: contentData.pagination.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!contentData.pagination.hasNext}
            >
              {t('common.next', 'common')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Category Management Component
function CategoryManagement() {
  const { t } = useI18n();
  const { data: categoryData, loading, error, refetch } = useCategories({ includeChildren: true });
  const { deleteCategory } = useCategoryMutations();

  const handleDelete = async (id: string) => {
    if (confirm(t('cms.categories.confirmDelete', 'common'))) {
      try {
        await deleteCategory(id);
        await refetch();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('cms.categories.title', 'common')}</h2>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('cms.categories.create', 'common')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cms.categories.name', 'common')}</TableHead>
                <TableHead>{t('cms.categories.slug', 'common')}</TableHead>
                <TableHead>{t('cms.categories.status', 'common')}</TableHead>
                <TableHead>{t('cms.categories.sortOrder', 'common')}</TableHead>
                <TableHead className="w-32">{t('common.actions', 'common')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData?.categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? t('common.active', 'common') : t('common.inactive', 'common')}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Media Management Component
function MediaManagement() {
  const { t } = useI18n();
  const { filters, updateFilter, clearFilters } = useMediaFilters();
  const { page, limit, nextPage, prevPage } = usePagination();
  const { data: mediaData, loading, error, refetch } = useMedia({ ...filters, page, limit });
  const { deleteMedia, uploadMedia } = useMediaMutations();
  const { selectedIds, toggleItem, selectAll, deselectAll, isSelected, selectedCount } = useBulkOperations<Media>();

  const handleDelete = async (id: string) => {
    if (confirm(t('cms.media.confirmDelete', 'common'))) {
      try {
        await deleteMedia(id);
        await refetch();
      } catch (error) {
        console.error('Failed to delete media:', error);
      }
    }
  };

  const getTypeIcon = (type: Media['type']) => {
    const icons = {
      image: ImageIcon,
      video: VideoIcon,
      audio: MusicIcon,
      document: FileTextIcon,
      other: FileIcon,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={t('cms.media.searchPlaceholder', 'common')}
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-64"
          />
          <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value || undefined)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('cms.media.allTypes', 'common')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('cms.media.allTypes', 'common')}</SelectItem>
              <SelectItem value="image">{t('cms.media.type.image', 'common')}</SelectItem>
              <SelectItem value="video">{t('cms.media.type.video', 'common')}</SelectItem>
              <SelectItem value="audio">{t('cms.media.type.audio', 'common')}</SelectItem>
              <SelectItem value="document">{t('cms.media.type.document', 'common')}</SelectItem>
              <SelectItem value="other">{t('cms.media.type.other', 'common')}</SelectItem>
            </SelectContent>
          </Select>
          {Object.keys(filters).length > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'common')}
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {t('cms.selected', 'common', { count: selectedCount })}
              </span>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                {t('common.deselectAll', 'common')}
              </Button>
              <Button variant="destructive" size="sm">
                {t('common.deleteSelected', 'common')}
              </Button>
            </>
          )}
          <Button>
            <UploadIcon className="h-4 w-4 mr-2" />
            {t('cms.media.upload', 'common')}
          </Button>
        </div>
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaData?.media.map((media) => (
          <Card key={media.id} className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              {media.type === 'image' ? (
                <img
                  src={media.thumbnailUrl || media.url}
                  alt={media.alt || media.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  {getTypeIcon(media.type)}
                  <span className="text-xs text-muted-foreground">{media.type.toUpperCase()}</span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={isSelected(media.id)}
                  onChange={() => toggleItem(media.id)}
                  className="rounded"
                />
              </div>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                <h4 className="font-medium text-sm truncate" title={media.originalName}>
                  {media.originalName}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(media.size)}</span>
                  <span>{media.type}</span>
                </div>
                {media.alt && (
                  <p className="text-xs text-muted-foreground truncate" title={media.alt}>
                    {media.alt}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <EyeIcon className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <PencilIcon className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <DownloadIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(media.id)}
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {mediaData?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('cms.pagination.showing', 'common', {
              start: (mediaData.pagination.page - 1) * mediaData.pagination.limit + 1,
              end: Math.min(mediaData.pagination.page * mediaData.pagination.limit, mediaData.pagination.total),
              total: mediaData.pagination.total,
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={!mediaData.pagination.hasPrev}
            >
              {t('common.previous', 'common')}
            </Button>
            <span className="text-sm">
              {t('cms.pagination.page', 'common', {
                current: mediaData.pagination.page,
                total: mediaData.pagination.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!mediaData.pagination.hasNext}
            >
              {t('common.next', 'common')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  const { t } = useI18n();
  const { data: contentData } = useContent();
  const { data: categoryData } = useCategories();
  const { data: mediaData } = useMedia();

  const stats = {
    totalContent: contentData?.pagination.total || 0,
    publishedContent: contentData?.content.filter(c => c.status === 'published').length || 0,
    draftContent: contentData?.content.filter(c => c.status === 'draft').length || 0,
    totalCategories: categoryData?.total || 0,
    totalMedia: mediaData?.stats.totalFiles || 0,
    totalMediaSize: mediaData?.stats.totalSize || 0,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('cms.analytics.title', 'common')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('cms.analytics.totalContent', 'common')}
            </CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedContent} {t('cms.content.status.published', 'common').toLowerCase()}, {stats.draftContent} {t('cms.content.status.draft', 'common').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('cms.analytics.totalCategories', 'common')}
            </CardTitle>
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('cms.analytics.totalMedia', 'common')}
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedia}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats.totalMediaSize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content type distribution */}
      {contentData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('cms.analytics.contentByType', 'common')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['page', 'post', 'project', 'skill'].map((type) => {
                const count = contentData.content.filter(c => c.type === type).length;
                const percentage = contentData.content.length > 0 ? (count / contentData.content.length) * 100 : 0;
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{t(`cms.content.type.${type}`, 'common')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboard;