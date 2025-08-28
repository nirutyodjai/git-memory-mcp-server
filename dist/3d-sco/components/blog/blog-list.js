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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogList = BlogList;
const react_1 = __importStar(require("react"));
const blog_provider_1 = require("./blog-provider");
const use_translation_1 = require("@/lib/i18n/use-translation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const select_1 = require("@/components/ui/select");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
function BlogList({ showFilters = true, showSearch = true, limit, categoryId, authorId, status = 'published', variant = 'grid', }) {
    const { t } = (0, use_translation_1.useTranslation)();
    const { state, loadPosts, loadCategories } = (0, blog_provider_1.useBlog)();
    const [filters, setFilters] = (0, react_1.useState)({
        status,
        category: categoryId,
        author: authorId,
        limit,
        page: 1,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
    });
    const [viewMode, setViewMode] = (0, react_1.useState)(variant);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        loadCategories();
        loadPosts(filters);
    }, [loadCategories, loadPosts, filters]);
    const handleSearch = (query) => {
        setSearchQuery(query);
        setFilters(prev => ({ ...prev, query, page: 1 }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };
    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };
    const renderPostCard = (post) => {
        const isGridView = viewMode === 'grid';
        return (<card_1.Card key={post.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${isGridView ? '' : 'flex flex-row'}`}>
        {post.featuredImage && (<div className={`relative ${isGridView ? 'h-48 w-full' : 'h-32 w-48 flex-shrink-0'}`}>
            <image_1.default src={post.featuredImage} alt={post.title} fill className="object-cover"/>
          </div>)}
        
        <div className={`${isGridView ? '' : 'flex-1'}`}>
          <card_1.CardHeader className={`${isGridView ? 'pb-2' : 'pb-1'}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <badge_1.Badge variant="secondary" style={{ backgroundColor: post.category.color + '20', color: post.category.color }}>
                {post.category.name}
              </badge_1.Badge>
              <span className="flex items-center gap-1">
                <lucide_react_1.Calendar className="h-3 w-3"/>
                {(0, date_fns_1.format)(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <card_1.CardTitle className={`${isGridView ? 'text-lg' : 'text-base'} line-clamp-2`}>
              <link_1.default href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                {post.title}
              </link_1.default>
            </card_1.CardTitle>
          </card_1.CardHeader>
          
          <card_1.CardContent className={`${isGridView ? 'pt-0' : 'pt-0 pb-2'}`}>
            <p className={`text-muted-foreground mb-4 ${isGridView ? 'line-clamp-3' : 'line-clamp-2'}`}>
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <lucide_react_1.User className="h-3 w-3"/>
                  {post.author.name}
                </span>
                <span className="flex items-center gap-1">
                  <lucide_react_1.Eye className="h-3 w-3"/>
                  {post.views}
                </span>
                <span className="flex items-center gap-1">
                  <lucide_react_1.Heart className="h-3 w-3"/>
                  {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <lucide_react_1.MessageCircle className="h-3 w-3"/>
                  {post.comments.length}
                </span>
              </div>
              
              {post.tags.length > 0 && (<div className="flex gap-1 flex-wrap">
                  {post.tags.slice(0, isGridView ? 3 : 2).map(tag => (<badge_1.Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </badge_1.Badge>))}
                  {post.tags.length > (isGridView ? 3 : 2) && (<badge_1.Badge variant="outline" className="text-xs">
                      +{post.tags.length - (isGridView ? 3 : 2)}
                    </badge_1.Badge>)}
                </div>)}
            </div>
          </card_1.CardContent>
        </div>
      </card_1.Card>);
    };
    const renderPagination = () => {
        if (!state.searchResult || state.searchResult.totalPages <= 1)
            return null;
        const { page, totalPages } = state.searchResult;
        const pages = [];
        for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
            pages.push(i);
        }
        return (<div className="flex items-center justify-center gap-2 mt-8">
        <button_1.Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
          {t('common.previous')}
        </button_1.Button>
        
        {pages.map(pageNum => (<button_1.Button key={pageNum} variant={pageNum === page ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(pageNum)}>
            {pageNum}
          </button_1.Button>))}
        
        <button_1.Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
          {t('common.next')}
        </button_1.Button>
      </div>);
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('blog.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {state.searchResult ?
            t('blog.postsFound', { count: state.searchResult.total }) :
            t('blog.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button_1.Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <lucide_react_1.Grid className="h-4 w-4"/>
          </button_1.Button>
          <button_1.Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <lucide_react_1.List className="h-4 w-4"/>
          </button_1.Button>
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (<card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="space-y-4">
              {showSearch && (<div className="relative">
                  <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <input_1.Input placeholder={t('blog.search.placeholder')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10"/>
                </div>)}
              
              {showFilters && (<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select_1.Select value={filters.category || ''} onValueChange={(value) => handleFilterChange('category', value || undefined)}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder={t('blog.filters.category')}/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">{t('blog.filters.allCategories')}</select_1.SelectItem>
                      {state.categories.map(category => (<select_1.SelectItem key={category.id} value={category.slug}>
                          {category.name} ({category.postCount})
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                  
                  <select_1.Select value={filters.sortBy || 'publishedAt'} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder={t('blog.filters.sortBy')}/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="publishedAt">{t('blog.sort.newest')}</select_1.SelectItem>
                      <select_1.SelectItem value="views">{t('blog.sort.popular')}</select_1.SelectItem>
                      <select_1.SelectItem value="likes">{t('blog.sort.liked')}</select_1.SelectItem>
                      <select_1.SelectItem value="title">{t('blog.sort.title')}</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                  
                  <select_1.Select value={filters.sortOrder || 'desc'} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder={t('blog.filters.order')}/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="desc">{t('blog.sort.descending')}</select_1.SelectItem>
                      <select_1.SelectItem value="asc">{t('blog.sort.ascending')}</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                  
                  <select_1.Select value={filters.limit?.toString() || '10'} onValueChange={(value) => handleFilterChange('limit', parseInt(value))}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder={t('blog.filters.perPage')}/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="5">5 {t('blog.filters.posts')}</select_1.SelectItem>
                      <select_1.SelectItem value="10">10 {t('blog.filters.posts')}</select_1.SelectItem>
                      <select_1.SelectItem value="20">20 {t('blog.filters.posts')}</select_1.SelectItem>
                      <select_1.SelectItem value="50">50 {t('blog.filters.posts')}</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>)}
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Loading State */}
      {state.loading && (<div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>)}

      {/* Error State */}
      {state.error && (<card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{state.error}</p>
              <button_1.Button onClick={() => loadPosts(filters)}>
                {t('common.retry')}
              </button_1.Button>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Posts Grid/List */}
      {!state.loading && !state.error && state.searchResult && (<>
          {state.searchResult.posts.length === 0 ? (<card_1.Card>
              <card_1.CardContent className="pt-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">{t('blog.empty.title')}</h3>
                  <p className="text-muted-foreground mb-4">{t('blog.empty.description')}</p>
                  <button_1.Button onClick={() => {
                    setSearchQuery('');
                    setFilters({ status, page: 1, sortBy: 'publishedAt', sortOrder: 'desc' });
                }}>
                    {t('blog.empty.clearFilters')}
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>) : (<div className={`${viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'}`}>
              {state.searchResult.posts.map(renderPostCard)}
            </div>)}
          
          {renderPagination()}
        </>)}
    </div>);
}
//# sourceMappingURL=blog-list.js.map