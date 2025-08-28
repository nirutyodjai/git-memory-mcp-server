"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentDisplay = ContentDisplay;
const react_1 = require("react");
const client_1 = require("@/lib/i18n/client");
const client_2 = require("@/lib/cms/client");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const skeleton_1 = require("@/components/ui/skeleton");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const cmsClient = new client_2.CMSClient();
const getDateLocale = (locale) => {
    switch (locale) {
        case 'th': return locale_1.th;
        case 'zh': return locale_1.zhCN;
        case 'ja': return locale_1.ja;
        default: return locale_1.en;
    }
};
function ContentDisplay({ type, categorySlug, featured = false, limit = 10, showSearch = true, showFilters = true, showPagination = true, layout = 'card' }) {
    const { t, locale } = (0, client_1.useI18n)();
    const [content, setContent] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedType, setSelectedType] = (0, react_1.useState)(type || 'all');
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)(categorySlug || 'all');
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const dateLocale = getDateLocale(locale);
    (0, react_1.useEffect)(() => {
        fetchContent();
        if (showFilters) {
            fetchCategories();
        }
    }, [searchQuery, selectedType, selectedCategory, currentPage, type, categorySlug, featured]);
    const fetchContent = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit,
                status: 'published',
                locale
            };
            if (searchQuery)
                params.search = searchQuery;
            if (selectedType !== 'all')
                params.type = selectedType;
            if (selectedCategory !== 'all')
                params.categorySlug = selectedCategory;
            if (featured)
                params.featured = true;
            const response = await cmsClient.getContent(params);
            setContent(response.data);
            setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
        }
        catch (err) {
            setError(t('cms.error.loadFailed'));
        }
        finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            const response = await cmsClient.getCategories();
            setCategories(response.data);
        }
        catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };
    const handleTypeChange = (newType) => {
        setSelectedType(newType);
        setCurrentPage(1);
    };
    const handleCategoryChange = (newCategory) => {
        setSelectedCategory(newCategory);
        setCurrentPage(1);
    };
    const renderContentCard = (item) => {
        const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt);
        return (<card_1.Card key={item.id} className="h-full hover:shadow-lg transition-shadow">
        {item.featuredImage && (<div className="aspect-video overflow-hidden rounded-t-lg">
            <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
          </div>)}
        <card_1.CardHeader>
          <div className="flex items-center justify-between mb-2">
            <badge_1.Badge variant="secondary">
              {t(`cms.content.type.${item.type}`)}
            </badge_1.Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <lucide_react_1.Calendar className="w-4 h-4 mr-1"/>
              {(0, date_fns_1.format)(publishedDate, 'PPP', { locale: dateLocale })}
            </div>
          </div>
          <card_1.CardTitle className="line-clamp-2">{item.title}</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          {item.excerpt && (<p className="text-muted-foreground mb-4 line-clamp-3">
              {item.excerpt}
            </p>)}
          
          {item.tags && item.tags.length > 0 && (<div className="flex flex-wrap gap-1 mb-4">
              {item.tags.slice(0, 3).map((tag, index) => (<badge_1.Badge key={index} variant="outline" className="text-xs">
                  <lucide_react_1.Tag className="w-3 h-3 mr-1"/>
                  {tag}
                </badge_1.Badge>))}
              {item.tags.length > 3 && (<badge_1.Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </badge_1.Badge>)}
            </div>)}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <lucide_react_1.User className="w-4 h-4 mr-1"/>
              {item.author || 'Admin'}
            </div>
            <button_1.Button variant="outline" size="sm">
              <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
              {t('common.readMore')}
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    const renderContentList = (item) => {
        const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt);
        return (<card_1.Card key={item.id} className="mb-4">
        <card_1.CardContent className="p-6">
          <div className="flex gap-4">
            {item.featuredImage && (<div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover"/>
              </div>)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <badge_1.Badge variant="secondary">
                  {t(`cms.content.type.${item.type}`)}
                </badge_1.Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <lucide_react_1.Calendar className="w-4 h-4 mr-1"/>
                  {(0, date_fns_1.format)(publishedDate, 'PPP', { locale: dateLocale })}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              {item.excerpt && (<p className="text-muted-foreground mb-3 line-clamp-2">
                  {item.excerpt}
                </p>)}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <lucide_react_1.User className="w-4 h-4 mr-1"/>
                    {item.author || 'Admin'}
                  </div>
                  {item.tags && item.tags.length > 0 && (<div className="flex gap-1">
                      {item.tags.slice(0, 2).map((tag, index) => (<badge_1.Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </badge_1.Badge>))}
                    </div>)}
                </div>
                <button_1.Button variant="outline" size="sm">
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  {t('common.readMore')}
                </button_1.Button>
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    if (loading) {
        return (<div className="space-y-6">
        {showSearch && (<div className="flex gap-4">
            <skeleton_1.Skeleton className="h-10 flex-1"/>
            {showFilters && (<>
                <skeleton_1.Skeleton className="h-10 w-40"/>
                <skeleton_1.Skeleton className="h-10 w-40"/>
              </>)}
          </div>)}
        <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, i) => (<card_1.Card key={i}>
              <skeleton_1.Skeleton className="aspect-video"/>
              <card_1.CardHeader>
                <skeleton_1.Skeleton className="h-4 w-20"/>
                <skeleton_1.Skeleton className="h-6 w-full"/>
              </card_1.CardHeader>
              <card_1.CardContent>
                <skeleton_1.Skeleton className="h-4 w-full mb-2"/>
                <skeleton_1.Skeleton className="h-4 w-3/4"/>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>
      </div>);
    }
    if (error) {
        return (<div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <button_1.Button onClick={fetchContent}>
          {t('common.retry')}
        </button_1.Button>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (<div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (<div className="relative flex-1">
              <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
              <input_1.Input placeholder={t('cms.content.searchPlaceholder')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10"/>
            </div>)}
          
          {showFilters && (<div className="flex gap-2">
              <select_1.Select value={selectedType} onValueChange={handleTypeChange}>
                <select_1.SelectTrigger className="w-40">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">{t('cms.content.allTypes')}</select_1.SelectItem>
                  <select_1.SelectItem value="page">{t('cms.content.type.page')}</select_1.SelectItem>
                  <select_1.SelectItem value="post">{t('cms.content.type.post')}</select_1.SelectItem>
                  <select_1.SelectItem value="project">{t('cms.content.type.project')}</select_1.SelectItem>
                  <select_1.SelectItem value="skill">{t('cms.content.type.skill')}</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
              
              <select_1.Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <select_1.SelectTrigger className="w-40">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">{t('cms.categories.title')}</select_1.SelectItem>
                  {categories.map((category) => (<select_1.SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </select_1.SelectItem>))}
                </select_1.SelectContent>
              </select_1.Select>
            </div>)}
        </div>)}

      {/* Content Grid/List */}
      {content.length === 0 ? (<div className="text-center py-12">
          <p className="text-muted-foreground">{t('cms.content.noContent')}</p>
        </div>) : (<div className={layout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'}>
          {content.map((item) => layout === 'list' ? renderContentList(item) : renderContentCard(item))}
        </div>)}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (<div className="flex items-center justify-center gap-2">
          <button_1.Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            {t('common.previous')}
          </button_1.Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (<button_1.Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)}>
                  {page}
                </button_1.Button>);
            })}
          </div>
          
          <button_1.Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            {t('common.next')}
          </button_1.Button>
        </div>)}
    </div>);
}
exports.default = ContentDisplay;
//# sourceMappingURL=content-display.js.map