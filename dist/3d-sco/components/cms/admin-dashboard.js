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
exports.AdminDashboard = AdminDashboard;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const select_1 = require("@/components/ui/select");
const table_1 = require("@/components/ui/table");
const i18n_provider_1 = require("@/components/providers/i18n-provider");
const hooks_1 = require("@/lib/cms/hooks");
const lucide_react_1 = require("lucide-react");
const client_1 = require("@/lib/cms/client");
function AdminDashboard({ className }) {
    const { t } = (0, i18n_provider_1.useI18n)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('content');
    return (<div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('cms.dashboard.title', 'common')}</h1>
          <p className="text-muted-foreground">
            {t('cms.dashboard.description', 'common')}
          </p>
        </div>
      </div>

      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="content">{t('cms.content.title', 'common')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="categories">{t('cms.categories.title', 'common')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="media">{t('cms.media.title', 'common')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="analytics">{t('cms.analytics.title', 'common')}</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="content" className="space-y-4">
          <ContentManagement />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="media" className="space-y-4">
          <MediaManagement />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
// Content Management Component
function ContentManagement() {
    const { t } = (0, i18n_provider_1.useI18n)();
    const { filters, updateFilter, clearFilters } = (0, hooks_1.useContentFilters)();
    const { page, limit, nextPage, prevPage, goToPage, changeLimit } = (0, hooks_1.usePagination)();
    const { data: contentData, loading, error, refetch } = (0, hooks_1.useContent)({ ...filters, page, limit });
    const { deleteContent } = (0, hooks_1.useContentMutations)();
    const { selectedIds, toggleItem, selectAll, deselectAll, isSelected, selectedCount } = (0, hooks_1.useBulkOperations)();
    const handleDelete = async (id) => {
        if (confirm(t('cms.content.confirmDelete', 'common'))) {
            try {
                await deleteContent(id);
                await refetch();
            }
            catch (error) {
                console.error('Failed to delete content:', error);
            }
        }
    };
    const getStatusBadge = (status) => {
        const variants = {
            published: 'default',
            draft: 'secondary',
            archived: 'outline',
        };
        return (<badge_1.Badge variant={variants[status]}>
        {t(`cms.content.status.${status}`, 'common')}
      </badge_1.Badge>);
    };
    const getTypeBadge = (type) => {
        const colors = {
            page: 'bg-blue-100 text-blue-800',
            post: 'bg-green-100 text-green-800',
            project: 'bg-purple-100 text-purple-800',
            skill: 'bg-orange-100 text-orange-800',
        };
        return (<badge_1.Badge className={colors[type]}>
        {t(`cms.content.type.${type}`, 'common')}
      </badge_1.Badge>);
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    if (error) {
        return (<card_1.Card>
        <card_1.CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{t('cms.error.loadFailed', 'common')}: {error}</p>
            <button_1.Button onClick={refetch} className="mt-2">
              {t('common.retry', 'common')}
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input_1.Input placeholder={t('cms.content.searchPlaceholder', 'common')} value={filters.search || ''} onChange={(e) => updateFilter('search', e.target.value)} className="w-64"/>
          <select_1.Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
            <select_1.SelectTrigger className="w-32">
              <select_1.SelectValue placeholder={t('cms.content.allStatuses', 'common')}/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="">{t('cms.content.allStatuses', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="published">{t('cms.content.status.published', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="draft">{t('cms.content.status.draft', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="archived">{t('cms.content.status.archived', 'common')}</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          <select_1.Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value || undefined)}>
            <select_1.SelectTrigger className="w-32">
              <select_1.SelectValue placeholder={t('cms.content.allTypes', 'common')}/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="">{t('cms.content.allTypes', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="page">{t('cms.content.type.page', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="post">{t('cms.content.type.post', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="project">{t('cms.content.type.project', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="skill">{t('cms.content.type.skill', 'common')}</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          {Object.keys(filters).length > 0 && (<button_1.Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'common')}
            </button_1.Button>)}
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (<>
              <span className="text-sm text-muted-foreground">
                {t('cms.selected', 'common', { count: selectedCount })}
              </span>
              <button_1.Button variant="outline" size="sm" onClick={deselectAll}>
                {t('common.deselectAll', 'common')}
              </button_1.Button>
              <button_1.Button variant="destructive" size="sm">
                {t('common.deleteSelected', 'common')}
              </button_1.Button>
            </>)}
          <button_1.Button>
            <lucide_react_1.PlusIcon className="h-4 w-4 mr-2"/>
            {t('cms.content.create', 'common')}
          </button_1.Button>
        </div>
      </div>

      {/* Content table */}
      <card_1.Card>
        <card_1.CardContent className="p-0">
          <table_1.Table>
            <table_1.TableHeader>
              <table_1.TableRow>
                <table_1.TableHead className="w-12">
                  <input type="checkbox" checked={contentData?.content.length > 0 && selectedCount === contentData.content.length} onChange={(e) => {
            if (e.target.checked) {
                selectAll(contentData?.content || []);
            }
            else {
                deselectAll();
            }
        }}/>
                </table_1.TableHead>
                <table_1.TableHead>{t('cms.content.title', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.content.type', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.content.status', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.content.category', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.content.updatedAt', 'common')}</table_1.TableHead>
                <table_1.TableHead className="w-32">{t('common.actions', 'common')}</table_1.TableHead>
              </table_1.TableRow>
            </table_1.TableHeader>
            <table_1.TableBody>
              {contentData?.content.map((content) => (<table_1.TableRow key={content.id}>
                  <table_1.TableCell>
                    <input type="checkbox" checked={isSelected(content.id)} onChange={() => toggleItem(content.id)}/>
                  </table_1.TableCell>
                  <table_1.TableCell>
                    <div>
                      <div className="font-medium">{content.title}</div>
                      <div className="text-sm text-muted-foreground">/{content.slug}</div>
                    </div>
                  </table_1.TableCell>
                  <table_1.TableCell>{getTypeBadge(content.type)}</table_1.TableCell>
                  <table_1.TableCell>{getStatusBadge(content.status)}</table_1.TableCell>
                  <table_1.TableCell>
                    {content.category && (<badge_1.Badge variant="outline">{content.category}</badge_1.Badge>)}
                  </table_1.TableCell>
                  <table_1.TableCell>
                    {new Date(content.updatedAt).toLocaleDateString()}
                  </table_1.TableCell>
                  <table_1.TableCell>
                    <div className="flex items-center space-x-1">
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.EyeIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.PencilIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm" onClick={() => handleDelete(content.id)}>
                        <lucide_react_1.TrashIcon className="h-4 w-4"/>
                      </button_1.Button>
                    </div>
                  </table_1.TableCell>
                </table_1.TableRow>))}
            </table_1.TableBody>
          </table_1.Table>
        </card_1.CardContent>
      </card_1.Card>

      {/* Pagination */}
      {contentData?.pagination && (<div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('cms.pagination.showing', 'common', {
                start: (contentData.pagination.page - 1) * contentData.pagination.limit + 1,
                end: Math.min(contentData.pagination.page * contentData.pagination.limit, contentData.pagination.total),
                total: contentData.pagination.total,
            })}
          </div>
          <div className="flex items-center space-x-2">
            <button_1.Button variant="outline" size="sm" onClick={prevPage} disabled={!contentData.pagination.hasPrev}>
              {t('common.previous', 'common')}
            </button_1.Button>
            <span className="text-sm">
              {t('cms.pagination.page', 'common', {
                current: contentData.pagination.page,
                total: contentData.pagination.totalPages,
            })}
            </span>
            <button_1.Button variant="outline" size="sm" onClick={nextPage} disabled={!contentData.pagination.hasNext}>
              {t('common.next', 'common')}
            </button_1.Button>
          </div>
        </div>)}
    </div>);
}
// Category Management Component
function CategoryManagement() {
    const { t } = (0, i18n_provider_1.useI18n)();
    const { data: categoryData, loading, error, refetch } = (0, hooks_1.useCategories)({ includeChildren: true });
    const { deleteCategory } = (0, hooks_1.useCategoryMutations)();
    const handleDelete = async (id) => {
        if (confirm(t('cms.categories.confirmDelete', 'common'))) {
            try {
                await deleteCategory(id);
                await refetch();
            }
            catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    return (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('cms.categories.title', 'common')}</h2>
        <button_1.Button>
          <lucide_react_1.PlusIcon className="h-4 w-4 mr-2"/>
          {t('cms.categories.create', 'common')}
        </button_1.Button>
      </div>

      <card_1.Card>
        <card_1.CardContent className="p-0">
          <table_1.Table>
            <table_1.TableHeader>
              <table_1.TableRow>
                <table_1.TableHead>{t('cms.categories.name', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.categories.slug', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.categories.status', 'common')}</table_1.TableHead>
                <table_1.TableHead>{t('cms.categories.sortOrder', 'common')}</table_1.TableHead>
                <table_1.TableHead className="w-32">{t('common.actions', 'common')}</table_1.TableHead>
              </table_1.TableRow>
            </table_1.TableHeader>
            <table_1.TableBody>
              {categoryData?.categories.map((category) => (<table_1.TableRow key={category.id}>
                  <table_1.TableCell>
                    <div className="flex items-center space-x-2">
                      {category.color && (<div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}/>)}
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </table_1.TableCell>
                  <table_1.TableCell className="font-mono text-sm">{category.slug}</table_1.TableCell>
                  <table_1.TableCell>
                    <badge_1.Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? t('common.active', 'common') : t('common.inactive', 'common')}
                    </badge_1.Badge>
                  </table_1.TableCell>
                  <table_1.TableCell>{category.sortOrder}</table_1.TableCell>
                  <table_1.TableCell>
                    <div className="flex items-center space-x-1">
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.PencilIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                        <lucide_react_1.TrashIcon className="h-4 w-4"/>
                      </button_1.Button>
                    </div>
                  </table_1.TableCell>
                </table_1.TableRow>))}
            </table_1.TableBody>
          </table_1.Table>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
// Media Management Component
function MediaManagement() {
    const { t } = (0, i18n_provider_1.useI18n)();
    const { filters, updateFilter, clearFilters } = (0, hooks_1.useMediaFilters)();
    const { page, limit, nextPage, prevPage } = (0, hooks_1.usePagination)();
    const { data: mediaData, loading, error, refetch } = (0, hooks_1.useMedia)({ ...filters, page, limit });
    const { deleteMedia, uploadMedia } = (0, hooks_1.useMediaMutations)();
    const { selectedIds, toggleItem, selectAll, deselectAll, isSelected, selectedCount } = (0, hooks_1.useBulkOperations)();
    const handleDelete = async (id) => {
        if (confirm(t('cms.media.confirmDelete', 'common'))) {
            try {
                await deleteMedia(id);
                await refetch();
            }
            catch (error) {
                console.error('Failed to delete media:', error);
            }
        }
    };
    const getTypeIcon = (type) => {
        const icons = {
            image: lucide_react_1.ImageIcon,
            video: lucide_react_1.VideoIcon,
            audio: lucide_react_1.MusicIcon,
            document: lucide_react_1.FileTextIcon,
            other: lucide_react_1.FileIcon,
        };
        const Icon = icons[type];
        return <Icon className="h-4 w-4"/>;
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    return (<div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input_1.Input placeholder={t('cms.media.searchPlaceholder', 'common')} value={filters.search || ''} onChange={(e) => updateFilter('search', e.target.value)} className="w-64"/>
          <select_1.Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value || undefined)}>
            <select_1.SelectTrigger className="w-32">
              <select_1.SelectValue placeholder={t('cms.media.allTypes', 'common')}/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              <select_1.SelectItem value="">{t('cms.media.allTypes', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="image">{t('cms.media.type.image', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="video">{t('cms.media.type.video', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="audio">{t('cms.media.type.audio', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="document">{t('cms.media.type.document', 'common')}</select_1.SelectItem>
              <select_1.SelectItem value="other">{t('cms.media.type.other', 'common')}</select_1.SelectItem>
            </select_1.SelectContent>
          </select_1.Select>
          {Object.keys(filters).length > 0 && (<button_1.Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'common')}
            </button_1.Button>)}
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (<>
              <span className="text-sm text-muted-foreground">
                {t('cms.selected', 'common', { count: selectedCount })}
              </span>
              <button_1.Button variant="outline" size="sm" onClick={deselectAll}>
                {t('common.deselectAll', 'common')}
              </button_1.Button>
              <button_1.Button variant="destructive" size="sm">
                {t('common.deleteSelected', 'common')}
              </button_1.Button>
            </>)}
          <button_1.Button>
            <lucide_react_1.UploadIcon className="h-4 w-4 mr-2"/>
            {t('cms.media.upload', 'common')}
          </button_1.Button>
        </div>
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaData?.media.map((media) => (<card_1.Card key={media.id} className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              {media.type === 'image' ? (<img src={media.thumbnailUrl || media.url} alt={media.alt || media.name} className="w-full h-full object-cover"/>) : (<div className="flex flex-col items-center space-y-2">
                  {getTypeIcon(media.type)}
                  <span className="text-xs text-muted-foreground">{media.type.toUpperCase()}</span>
                </div>)}
              <div className="absolute top-2 left-2">
                <input type="checkbox" checked={isSelected(media.id)} onChange={() => toggleItem(media.id)} className="rounded"/>
              </div>
            </div>
            <card_1.CardContent className="p-3">
              <div className="space-y-1">
                <h4 className="font-medium text-sm truncate" title={media.originalName}>
                  {media.originalName}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{(0, client_1.formatFileSize)(media.size)}</span>
                  <span>{media.type}</span>
                </div>
                {media.alt && (<p className="text-xs text-muted-foreground truncate" title={media.alt}>
                    {media.alt}
                  </p>)}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-1">
                  <button_1.Button variant="ghost" size="sm">
                    <lucide_react_1.EyeIcon className="h-3 w-3"/>
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="sm">
                    <lucide_react_1.PencilIcon className="h-3 w-3"/>
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="sm">
                    <lucide_react_1.DownloadIcon className="h-3 w-3"/>
                  </button_1.Button>
                </div>
                <button_1.Button variant="ghost" size="sm" onClick={() => handleDelete(media.id)}>
                  <lucide_react_1.TrashIcon className="h-3 w-3"/>
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>))}
      </div>

      {/* Pagination */}
      {mediaData?.pagination && (<div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('cms.pagination.showing', 'common', {
                start: (mediaData.pagination.page - 1) * mediaData.pagination.limit + 1,
                end: Math.min(mediaData.pagination.page * mediaData.pagination.limit, mediaData.pagination.total),
                total: mediaData.pagination.total,
            })}
          </div>
          <div className="flex items-center space-x-2">
            <button_1.Button variant="outline" size="sm" onClick={prevPage} disabled={!mediaData.pagination.hasPrev}>
              {t('common.previous', 'common')}
            </button_1.Button>
            <span className="text-sm">
              {t('cms.pagination.page', 'common', {
                current: mediaData.pagination.page,
                total: mediaData.pagination.totalPages,
            })}
            </span>
            <button_1.Button variant="outline" size="sm" onClick={nextPage} disabled={!mediaData.pagination.hasNext}>
              {t('common.next', 'common')}
            </button_1.Button>
          </div>
        </div>)}
    </div>);
}
// Analytics Dashboard Component
function AnalyticsDashboard() {
    const { t } = (0, i18n_provider_1.useI18n)();
    const { data: contentData } = (0, hooks_1.useContent)();
    const { data: categoryData } = (0, hooks_1.useCategories)();
    const { data: mediaData } = (0, hooks_1.useMedia)();
    const stats = {
        totalContent: contentData?.pagination.total || 0,
        publishedContent: contentData?.content.filter(c => c.status === 'published').length || 0,
        draftContent: contentData?.content.filter(c => c.status === 'draft').length || 0,
        totalCategories: categoryData?.total || 0,
        totalMedia: mediaData?.stats.totalFiles || 0,
        totalMediaSize: mediaData?.stats.totalSize || 0,
    };
    return (<div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('cms.analytics.title', 'common')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">
              {t('cms.analytics.totalContent', 'common')}
            </card_1.CardTitle>
            <lucide_react_1.FileTextIcon className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedContent} {t('cms.content.status.published', 'common').toLowerCase()}, {stats.draftContent} {t('cms.content.status.draft', 'common').toLowerCase()}
            </p>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">
              {t('cms.analytics.totalCategories', 'common')}
            </card_1.CardTitle>
            <lucide_react_1.FilterIcon className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">
              {t('cms.analytics.totalMedia', 'common')}
            </card_1.CardTitle>
            <lucide_react_1.ImageIcon className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.totalMedia}</div>
            <p className="text-xs text-muted-foreground">
              {(0, client_1.formatFileSize)(stats.totalMediaSize)}
            </p>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Content type distribution */}
      {contentData && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>{t('cms.analytics.contentByType', 'common')}</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-2">
              {['page', 'post', 'project', 'skill'].map((type) => {
                const count = contentData.content.filter(c => c.type === type).length;
                const percentage = contentData.content.length > 0 ? (count / contentData.content.length) * 100 : 0;
                return (<div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{t(`cms.content.type.${type}`, 'common')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}/>
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>);
            })}
            </div>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
exports.default = AdminDashboard;
//# sourceMappingURL=admin-dashboard.js.map