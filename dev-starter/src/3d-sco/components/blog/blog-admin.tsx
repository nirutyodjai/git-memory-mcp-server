'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory } from '@/lib/blog/blog-service';
import { useBlog } from './blog-provider';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  User, 
  MessageCircle,
  Heart,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Image as ImageIcon,
  Tag,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  categoryId: string;
  tags: string[];
  featuredImage?: string;
  status: BlogPost['status'];
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
}

export function BlogAdmin() {
  const { t } = useTranslation();
  const { 
    state, 
    loadPosts, 
    loadCategories, 
    createPost, 
    updatePost, 
    deletePost, 
    publishPost, 
    unpublishPost,
    createCategory,
    updateCategory,
    deleteCategory
  } = useBlog();
  
  const [activeTab, setActiveTab] = useState('posts');
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogPost['status'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [postForm, setPostForm] = useState<PostFormData>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    categoryId: '',
    tags: [],
    status: 'draft',
  });
  
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
  });
  
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
    loadCategories();
  }, [loadPosts, loadCategories, statusFilter]);

  // Auto-generate slug from title
  useEffect(() => {
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
  useEffect(() => {
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

  const handleEditPost = (post: BlogPost) => {
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
      publishedAt: post.publishedAt ? format(new Date(post.publishedAt), 'yyyy-MM-dd\'T\'HH:mm') : undefined,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      seoKeywords: post.seoKeywords,
    });
    setShowPostDialog(true);
  };

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
    });
    setShowCategoryDialog(true);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPost) {
        await updatePost(editingPost.id, postForm);
      } else {
        await createPost(postForm);
      }
      
      setShowPostDialog(false);
      resetPostForm();
      loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
      } else {
        await createCategory(categoryForm);
      }
      
      setShowCategoryDialog(false);
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm(t('blog.admin.confirmDelete'))) {
      try {
        await deletePost(postId);
        loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm(t('blog.admin.confirmDeleteCategory'))) {
      try {
        await deleteCategory(categoryId);
        loadCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.status === 'published') {
        await unpublishPost(post.id);
      } else {
        await publishPost(post.id);
      }
      loadPosts({ status: statusFilter === 'all' ? undefined : statusFilter });
    } catch (error) {
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

  const handleRemoveTag = (tagToRemove: string) => {
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

  const getStatusBadge = (status: BlogPost['status']) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {t(`blog.status.${status}`)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('blog.admin.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('blog.admin.description')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">{t('blog.admin.posts')}</TabsTrigger>
          <TabsTrigger value="categories">{t('blog.admin.categories')}</TabsTrigger>
          <TabsTrigger value="stats">{t('blog.admin.statistics')}</TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          {/* Posts Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('blog.admin.searchPosts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('blog.admin.allStatus')}</SelectItem>
                  <SelectItem value="draft">{t('blog.status.draft')}</SelectItem>
                  <SelectItem value="published">{t('blog.status.published')}</SelectItem>
                  <SelectItem value="archived">{t('blog.status.archived')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('blog.admin.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('blog.admin.allCategories')}</SelectItem>
                  {state.categories.map(category => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetPostForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('blog.admin.newPost')}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? t('blog.admin.editPost') : t('blog.admin.newPost')}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handlePostSubmit} className="space-y-6">
                  <Tabs defaultValue="content">
                    <TabsList>
                      <TabsTrigger value="content">{t('blog.admin.content')}</TabsTrigger>
                      <TabsTrigger value="settings">{t('blog.admin.settings')}</TabsTrigger>
                      <TabsTrigger value="seo">{t('blog.admin.seo')}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">{t('blog.admin.title')}</Label>
                          <Input
                            id="title"
                            value={postForm.title}
                            onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="slug">{t('blog.admin.slug')}</Label>
                          <Input
                            id="slug"
                            value={postForm.slug}
                            onChange={(e) => setPostForm(prev => ({ ...prev, slug: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="excerpt">{t('blog.admin.excerpt')}</Label>
                        <Textarea
                          id="excerpt"
                          value={postForm.excerpt}
                          onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="content">{t('blog.admin.content')}</Label>
                        <Textarea
                          id="content"
                          value={postForm.content}
                          onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={12}
                          className="font-mono"
                          required
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">{t('blog.admin.category')}</Label>
                          <Select
                            value={postForm.categoryId}
                            onValueChange={(value) => setPostForm(prev => ({ ...prev, categoryId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('blog.admin.selectCategory')} />
                            </SelectTrigger>
                            <SelectContent>
                              {state.categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="status">{t('blog.admin.status')}</Label>
                          <Select
                            value={postForm.status}
                            onValueChange={(value: BlogPost['status']) => setPostForm(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">{t('blog.status.draft')}</SelectItem>
                              <SelectItem value="published">{t('blog.status.published')}</SelectItem>
                              <SelectItem value="archived">{t('blog.status.archived')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="featuredImage">{t('blog.admin.featuredImage')}</Label>
                        <Input
                          id="featuredImage"
                          type="url"
                          value={postForm.featuredImage || ''}
                          onChange={(e) => setPostForm(prev => ({ ...prev, featuredImage: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('blog.admin.tags')}</Label>
                        <div className="flex gap-2">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder={t('blog.admin.addTag')}
                          />
                          <Button type="button" onClick={handleAddTag}>
                            {t('common.add')}
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {postForm.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                              {tag} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {postForm.status === 'published' && (
                        <div className="space-y-2">
                          <Label htmlFor="publishedAt">{t('blog.admin.publishDate')}</Label>
                          <Input
                            id="publishedAt"
                            type="datetime-local"
                            value={postForm.publishedAt || ''}
                            onChange={(e) => setPostForm(prev => ({ ...prev, publishedAt: e.target.value }))}
                          />
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="seo" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seoTitle">{t('blog.admin.seoTitle')}</Label>
                        <Input
                          id="seoTitle"
                          value={postForm.seoTitle || ''}
                          onChange={(e) => setPostForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                          placeholder={postForm.title}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="seoDescription">{t('blog.admin.seoDescription')}</Label>
                        <Textarea
                          id="seoDescription"
                          value={postForm.seoDescription || ''}
                          onChange={(e) => setPostForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                          placeholder={postForm.excerpt}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="seoKeywords">{t('blog.admin.seoKeywords')}</Label>
                        <Input
                          id="seoKeywords"
                          value={postForm.seoKeywords || ''}
                          onChange={(e) => setPostForm(prev => ({ ...prev, seoKeywords: e.target.value }))}
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowPostDialog(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      {editingPost ? t('common.update') : t('common.create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {post.featuredImage && (
                      <div className="relative h-20 w-32 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(post.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(post)}
                          >
                            {post.status === 'published' ? (
                              <><EyeOff className="h-4 w-4 mr-1" /> {t('blog.admin.unpublish')}</>
                            ) : (
                              <><Eye className="h-4 w-4 mr-1" /> {t('blog.admin.publish')}</>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: post.category.color, color: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
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
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredPosts.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('blog.admin.noPosts')}</h3>
                    <p className="text-muted-foreground">{t('blog.admin.noPostsDescription')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('blog.admin.categories')}</h2>
            
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetCategoryForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('blog.admin.newCategory')}
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? t('blog.admin.editCategory') : t('blog.admin.newCategory')}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">{t('blog.admin.name')}</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categorySlug">{t('blog.admin.slug')}</Label>
                    <Input
                      id="categorySlug"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">{t('blog.admin.description')}</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryColor">{t('blog.admin.color')}</Label>
                    <Input
                      id="categoryColor"
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit">
                      {editingCategory ? t('common.update') : t('common.create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.categories.map(category => (
              <Card key={category.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-2">{category.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('blog.admin.postsCount', { count: category.postCount })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{state.stats?.totalPosts || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalPosts')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Eye className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{state.stats?.totalViews || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalViews')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{state.stats?.totalComments || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalComments')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Tag className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{state.categories.length}</p>
                    <p className="text-sm text-muted-foreground">{t('blog.stats.totalCategories')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}