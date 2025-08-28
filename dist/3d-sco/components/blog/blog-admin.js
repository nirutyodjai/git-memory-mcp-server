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
exports.BlogAdmin = BlogAdmin;
const react_1 = __importStar(require("react"));
const blog_provider_1 = require("./blog-provider");
const use_translation_1 = require("@/lib/i18n/use-translation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const select_1 = require("@/components/ui/select");
const dialog_1 = require("@/components/ui/dialog");
const tabs_1 = require("@/components/ui/tabs");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const image_1 = __importDefault(require("next/image"));
function BlogAdmin() {
    const { t } = (0, use_translation_1.useTranslation)();
    const { state, loadPosts, loadCategories, createPost, updatePost, deletePost, publishPost, unpublishPost, createCategory, updateCategory, deleteCategory } = (0, blog_provider_1.useBlog)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('posts');
    const [showPostDialog, setShowPostDialog] = (0, react_1.useState)(false);
    const [showCategoryDialog, setShowCategoryDialog] = (0, react_1.useState)(false);
    const [editingPost, setEditingPost] = (0, react_1.useState)(null);
    const [editingCategory, setEditingCategory] = (0, react_1.useState)(null);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('all');
    const [categoryFilter, setCategoryFilter] = (0, react_1.useState)('all');
    const [postForm, setPostForm] = (0, react_1.useState)({
        title: '',
        content: '',
        excerpt: '',
        slug: '',
        categoryId: '',
        tags: [],
        status: 'draft',
    });
    const [categoryForm, setCategoryForm] = (0, react_1.useState)({
        name: '',
        slug: '',
        description: '',
        color: '#3b82f6',
    });
    const [tagInput, setTagInput] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
        loadCategories();
    }, [loadPosts, loadCategories, statusFilter]);
    // Auto-generate slug from title
    (0, react_1.useEffect)(() => {
        if (postForm.title && !editingPost) {
            const slug = postForm.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setPostForm(prev => ({ ...prev, slug }));
        }
    }, [postForm.title, editingPost]);
    // Auto-generate category slug from name
    (0, react_1.useEffect)(() => {
        if (categoryForm.name && !editingCategory) {
            const slug = categoryForm.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setCategoryForm(prev => ({ ...prev, slug }));
        }
    }, [categoryForm.name, editingCategory]);
    const resetPostForm = () => {
        setPostForm({
            title: '',
            content: '',
            excerpt: '',
            slug: '',
            categoryId: '',
            tags: [],
            status: 'draft',
        });
        setTagInput('');
        setEditingPost(null);
    };
    const resetCategoryForm = () => {
        setCategoryForm({
            name: '',
            slug: '',
            description: '',
            color: '#3b82f6',
        });
        setEditingCategory(null);
    };
    const handleEditPost = (post) => {
        setEditingPost(post);
        setPostForm({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            slug: post.slug,
            categoryId: post.category.id,
            tags: post.tags,
            featuredImage: post.featuredImage,
            status: post.status,
            publishedAt: post.publishedAt ? (0, date_fns_1.format)(new Date(post.publishedAt), 'yyyy-MM-dd\'T\'HH:mm') : undefined,
            seoTitle: post.seoTitle,
            seoDescription: post.seoDescription,
            seoKeywords: post.seoKeywords,
        });
        setShowPostDialog(true);
    };
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            slug: category.slug,
            description: category.description,
            color: category.color,
        });
        setShowCategoryDialog(true);
    };
    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPost) {
                await updatePost(editingPost.id, postForm);
            }
            else {
                await createPost(postForm);
            }
            setShowPostDialog(false);
            resetPostForm();
            loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
        }
        catch (error) {
            console.error('Failed to save post:', error);
        }
    };
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, categoryForm);
            }
            else {
                await createCategory(categoryForm);
            }
            setShowCategoryDialog(false);
            resetCategoryForm();
            loadCategories();
        }
        catch (error) {
            console.error('Failed to save category:', error);
        }
    };
    const handleDeletePost = async (postId) => {
        if (confirm(t('blog.admin.confirmDelete'))) {
            try {
                await deletePost(postId);
                loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
            }
            catch (error) {
                console.error('Failed to delete post:', error);
            }
        }
    };
    const handleDeleteCategory = async (categoryId) => {
        if (confirm(t('blog.admin.confirmDeleteCategory'))) {
            try {
                await deleteCategory(categoryId);
                loadCategories();
            }
            catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };
    const handleTogglePublish = async (post) => {
        try {
            if (post.status === 'published') {
                await unpublishPost(post.id);
            }
            else {
                await publishPost(post.id);
            }
            loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
        }
        catch (error) {
            console.error('Failed to toggle publish status:', error);
        }
    };
    const handleAddTag = () => {
        if (tagInput.trim() && !postForm.tags.includes(tagInput.trim())) {
            setPostForm(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };
    const handleRemoveTag = (tagToRemove) => {
        setPostForm(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const filteredPosts = state.searchResult?.posts.filter(post => {
        const matchesSearch = !searchQuery ||
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || post.category.slug === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];
    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            published: 'default',
            archived: 'outline',
        };
        return (<badge_1.Badge variant={variants[status]}>
        {t(`blog.status.${status}`)}
      </badge_1.Badge>);
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('blog.admin.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('blog.admin.description')}</p>
        </div>
      </div>

      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="posts">{t('blog.admin.posts')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="categories">{t('blog.admin.categories')}</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="stats">{t('blog.admin.statistics')}</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        {/* Posts Tab */}
        <tabs_1.TabsContent value="posts" className="space-y-6">
          {/* Posts Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <input_1.Input placeholder={t('blog.admin.searchPosts')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64"/>
              </div>
              
              <select_1.Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <select_1.SelectTrigger className="w-32">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">{t('blog.admin.allStatus')}</select_1.SelectItem>
                  <select_1.SelectItem value="draft">{t('blog.status.draft')}</select_1.SelectItem>
                  <select_1.SelectItem value="published">{t('blog.status.published')}</select_1.SelectItem>
                  <select_1.SelectItem value="archived">{t('blog.status.archived')}</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
              
              <select_1.Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <select_1.SelectTrigger className="w-40">
                  <select_1.SelectValue placeholder={t('blog.admin.allCategories')}/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">{t('blog.admin.allCategories')}</select_1.SelectItem>
                  {state.categories.map(category => (<select_1.SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </select_1.SelectItem>))}
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            
            <dialog_1.Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
              <dialog_1.DialogTrigger asChild>
                <button_1.Button onClick={resetPostForm}>
                  <lucide_react_1.Plus className="h-4 w-4 mr-2"/>
                  {t('blog.admin.newPost')}
                </button_1.Button>
              </dialog_1.DialogTrigger>
              
              <dialog_1.DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <dialog_1.DialogHeader>
                  <dialog_1.DialogTitle>
                    {editingPost ? t('blog.admin.editPost') : t('blog.admin.newPost')}
                  </dialog_1.DialogTitle>
                </dialog_1.DialogHeader>
                
                <form onSubmit={handlePostSubmit} className="space-y-6">
                  <tabs_1.Tabs defaultValue="content">
                    <tabs_1.TabsList>
                      <tabs_1.TabsTrigger value="content">{t('blog.admin.content')}</tabs_1.TabsTrigger>
                      <tabs_1.TabsTrigger value="settings">{t('blog.admin.settings')}</tabs_1.TabsTrigger>
                      <tabs_1.TabsTrigger value="seo">{t('blog.admin.seo')}</tabs_1.TabsTrigger>
                    </tabs_1.TabsList>
                    
                    <tabs_1.TabsContent value="content" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label_1.Label htmlFor="title">{t('blog.admin.title')}</label_1.Label>
                          <input_1.Input id="title" value={postForm.title} onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))} required/>
                        </div>
                        
                        <div className="space-y-2">
                          <label_1.Label htmlFor="slug">{t('blog.admin.slug')}</label_1.Label>
                          <input_1.Input id="slug" value={postForm.slug} onChange={(e) => setPostForm(prev => ({ ...prev, slug: e.target.value }))} required/>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label_1.Label htmlFor="excerpt">{t('blog.admin.excerpt')}</label_1.Label>
                        <textarea_1.Textarea id="excerpt" value={postForm.excerpt} onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))} rows={3}/>
                      </div>
                      
                      <div className="space-y-2">
                        <label_1.Label htmlFor="content">{t('blog.admin.content')}</label_1.Label>
                        <textarea_1.Textarea id="content" value={postForm.content} onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))} rows={12} className="font-mono" required/>
                      </div>
                    </tabs_1.TabsContent>
                    
                    <tabs_1.TabsContent value="settings" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label_1.Label htmlFor="category">{t('blog.admin.category')}</label_1.Label>
                          <select_1.Select value={postForm.categoryId} onValueChange={(value) => setPostForm(prev => ({ ...prev, categoryId: value }))}>
                            <select_1.SelectTrigger>
                              <select_1.SelectValue placeholder={t('blog.admin.selectCategory')}/>
                            </select_1.SelectTrigger>
                            <select_1.SelectContent>
                              {state.categories.map(category => (<select_1.SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </select_1.SelectItem>))}
                            </select_1.SelectContent>
                          </select_1.Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label_1.Label htmlFor="status">{t('blog.admin.status')}</label_1.Label>
                          <select_1.Select value={postForm.status} onValueChange={(value) => setPostForm(prev => ({ ...prev, status: value }))}>
                            <select_1.SelectTrigger>
                              <select_1.SelectValue />
                            </select_1.SelectTrigger>
                            <select_1.SelectContent>
                              <select_1.SelectItem value="draft">{t('blog.status.draft')}</select_1.SelectItem>
                              <select_1.SelectItem value="published">{t('blog.status.published')}</select_1.SelectItem>
                              <select_1.SelectItem value="archived">{t('blog.status.archived')}</select_1.SelectItem>
                            </select_1.SelectContent>
                          </select_1.Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label_1.Label htmlFor="featuredImage">{t('blog.admin.featuredImage')}</label_1.Label>
                        <input_1.Input id="featuredImage" type="url" value={postForm.featuredImage || ''} onChange={(e) => setPostForm(prev => ({ ...prev, featuredImage: e.target.value }))} placeholder="https://example.com/image.jpg"/>
                      </div>
                      
                      <div className="space-y-2">
                        <label_1.Label>{t('blog.admin.tags')}</label_1.Label>
                        <div className="flex gap-2">
                          <input_1.Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder={t('blog.admin.addTag')}/>
                          <button_1.Button type="button" onClick={handleAddTag}>
                            {t('common.add')}
                          </button_1.Button>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {postForm.tags.map(tag => (<badge_1.Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                              {tag} <lucide_react_1.X className="h-3 w-3 ml-1"/>
                            </badge_1.Badge>))}
                        </div>
                      </div>
                      
                      {postForm.status === 'published' && (<div className="space-y-2">
                          <label_1.Label htmlFor="publishedAt">{t('blog.admin.publishDate')}</label_1.Label>
                          <input_1.Input id="publishedAt" type="datetime-local" value={postForm.publishedAt || ''} onChange={(e) => setPostForm(prev => ({ ...prev, publishedAt: e.target.value }))}/>
                        </div>)}
                    </tabs_1.TabsContent>
                    
                    <tabs_1.TabsContent value="seo" className="space-y-4">
                      <div className="space-y-2">
                        <label_1.Label htmlFor="seoTitle">{t('blog.admin.seoTitle')}</label_1.Label>
                        <input_1.Input id="seoTitle" value={postForm.seoTitle || ''} onChange={(e) => setPostForm(prev => ({ ...prev, seoTitle: e.target.value }))} placeholder={postForm.title}/>
                      </div>
                      
                      <div className="space-y-2">
                        <label_1.Label htmlFor="seoDescription">{t('blog.admin.seoDescription')}</label_1.Label>
                        <textarea_1.Textarea id="seoDescription" value={postForm.seoDescription || ''} onChange={(e) => setPostForm(prev => ({ ...prev, seoDescription: e.target.value }))} placeholder={postForm.excerpt} rows={3}/>
                      </div>
                      
                      <div className="space-y-2">
                        <label_1.Label htmlFor="seoKeywords">{t('blog.admin.seoKeywords')}</label_1.Label>
                        <input_1.Input id="seoKeywords" value={postForm.seoKeywords || ''} onChange={(e) => setPostForm(prev => ({ ...prev, seoKeywords: e.target.value }))} placeholder="keyword1, keyword2, keyword3"/>
                      </div>
                    </tabs_1.TabsContent>
                  </tabs_1.Tabs>
                  
                  <div className="flex justify-end gap-2">
                    <button_1.Button type="button" variant="outline" onClick={() => setShowPostDialog(false)}>
                      {t('common.cancel')}
                    </button_1.Button>
                    <button_1.Button type="submit">
                      <lucide_react_1.Save className="h-4 w-4 mr-2"/>
                      {editingPost ? t('common.update') : t('common.create')}
                    </button_1.Button>
                  </div>
                </form>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map(post => (<card_1.Card key={post.id}>
                <card_1.CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {post.featuredImage && (<div className="relative h-20 w-32 flex-shrink-0 rounded-md overflow-hidden">
                        <image_1.default src={post.featuredImage} alt={post.title} fill className="object-cover"/>
                      </div>)}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(post.status)}
                          <button_1.Button variant="outline" size="sm" onClick={() => handleTogglePublish(post)}>
                            {post.status === 'published' ? (<><lucide_react_1.EyeOff className="h-4 w-4 mr-1"/> {t('blog.admin.unpublish')}</>) : (<><lucide_react_1.Eye className="h-4 w-4 mr-1"/> {t('blog.admin.publish')}</>)}
                          </button_1.Button>
                          <button_1.Button variant="outline" size="sm" onClick={() => handleEditPost(post)}>
                            <lucide_react_1.Edit className="h-4 w-4"/>
                          </button_1.Button>
                          <button_1.Button variant="outline" size="sm" onClick={() => handleDeletePost(post.id)}>
                            <lucide_react_1.Trash2 className="h-4 w-4"/>
                          </button_1.Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <lucide_react_1.User className="h-3 w-3"/>
                          {post.author.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <lucide_react_1.Calendar className="h-3 w-3"/>
                          {(0, date_fns_1.format)(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <badge_1.Badge variant="outline" style={{ borderColor: post.category.color, color: post.category.color }}>
                          {post.category.name}
                        </badge_1.Badge>
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
                          {post.tags.map(tag => (<badge_1.Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </badge_1.Badge>))}
                        </div>)}
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>))}
            
            {filteredPosts.length === 0 && (<card_1.Card>
                <card_1.CardContent className="pt-6">
                  <div className="text-center py-8">
                    <lucide_react_1.FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                    <h3 className="text-lg font-semibold mb-2">{t('blog.admin.noPosts')}</h3>
                    <p className="text-muted-foreground">{t('blog.admin.noPostsDescription')}</p>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}
          </div>
        </tabs_1.TabsContent>

        {/* Categories Tab */}
        <tabs_1.TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('blog.admin.categories')}</h2>
            
            <dialog_1.Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <dialog_1.DialogTrigger asChild>
                <button_1.Button onClick={resetCategoryForm}>
                  <lucide_react_1.Plus className="h-4 w-4 mr-2"/>
                  {t('blog.admin.newCategory')}
                </button_1.Button>
              </dialog_1.DialogTrigger>
              
              <dialog_1.DialogContent>
                <dialog_1.DialogHeader>
                  <dialog_1.DialogTitle>
                    {editingCategory ? t('blog.admin.editCategory') : t('blog.admin.newCategory')}
                  </dialog_1.DialogTitle>
                </dialog_1.DialogHeader>
                
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="categoryName">{t('blog.admin.name')}</label_1.Label>
                    <input_1.Input id="categoryName" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} required/>
                  </div>
                  
                  <div className="space-y-2">
                    <label_1.Label htmlFor="categorySlug">{t('blog.admin.slug')}</label_1.Label>
                    <input_1.Input id="categorySlug" value={categoryForm.slug} onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))} required/>
                  </div>
                  
                  <div className="space-y-2">
                    <label_1.Label htmlFor="categoryDescription">{t('blog.admin.description')}</label_1.Label>
                    <textarea_1.Textarea id="categoryDescription" value={categoryForm.description} onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))} rows={3}/>
                  </div>
                  
                  <div className="space-y-2">
                    <label_1.Label htmlFor="categoryColor">{t('blog.admin.color')}</label_1.Label>
                    <input_1.Input id="categoryColor" type="color" value={categoryForm.color} onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}/>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button_1.Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                      {t('common.cancel')}
                    </button_1.Button>
                    <button_1.Button type="submit">
                      {editingCategory ? t('common.update') : t('common.create')}
                    </button_1.Button>
                  </div>
                </form>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.categories.map(category => (<card_1.Card key={category.id}>
                <card_1.CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}/>
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button_1.Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                        <lucide_react_1.Edit className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <lucide_react_1.Trash2 className="h-4 w-4"/>
                      </button_1.Button>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-2">{category.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('blog.admin.postsCount', { count: category.postCount })}
                  </p>
                </card_1.CardContent>
              </card_1.Card>))}
          </div>
        </tabs_1.TabsContent>

        {/* Statistics Tab */}
        <tabs_1.TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <card_1.Card>
              <card_1.CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <lucide_react_1.FileText className="h-8 w-8 text-blue-500"/>
                  <div>
                    <p className="text-2xl font-bold">{state.stats?.totalPosts || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalPosts')}</p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
            
            <card_1.Card>
              <card_1.CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Eye className="h-8 w-8 text-green-500"/>
                  <div>
                    <p className="text-2xl font-bold">{state.stats?.totalViews || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalViews')}</p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
            
            <card_1.Card>
              <card_1.CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <lucide_react_1.MessageCircle className="h-8 w-8 text-purple-500"/>
                  <div>
                    <p className="text-2xl font-bold">{state.stats?.totalComments || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalComments')}</p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
            
            <card_1.Card>
              <card_1.CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Tag className="h-8 w-8 text-orange-500"/>
                  <div>
                    <p className="text-2xl font-bold">{state.categories.length}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalCategories')}</p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=blog-admin.js.map