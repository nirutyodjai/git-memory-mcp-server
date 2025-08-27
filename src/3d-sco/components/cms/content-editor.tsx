'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/components/providers/i18n-provider';
import {
  useContentById,
  useCategories,
  useContentMutations,
} from '@/lib/cms/hooks';
import { Content, Category } from '@/lib/cms/client';
import {
  SaveIcon,
  EyeIcon,
  ImageIcon,
  LinkIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  QuoteIcon,
  CodeIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  UndoIcon,
  RedoIcon,
  XIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContentEditorProps {
  contentId?: string;
  onSave?: (content: Content) => void;
  onCancel?: () => void;
  className?: string;
}

interface ContentFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: Content['type'];
  status: Content['status'];
  categoryId?: string;
  tags: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isPublic: boolean;
  allowComments: boolean;
  publishedAt?: string;
}

export function ContentEditor({ contentId, onSave, onCancel, className }: ContentEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { data: existingContent, loading: contentLoading } = useContentById(contentId || '');
  const { data: categoryData } = useCategories();
  const { createContent, updateContent } = useContentMutations();
  
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    type: 'post',
    status: 'draft',
    tags: [],
    isPublic: true,
    allowComments: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showSeoSettings, setShowSeoSettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Load existing content
  useEffect(() => {
    if (existingContent) {
      setFormData({
        title: existingContent.title,
        slug: existingContent.slug,
        content: existingContent.content,
        excerpt: existingContent.excerpt || '',
        type: existingContent.type,
        status: existingContent.status,
        categoryId: existingContent.categoryId,
        tags: existingContent.tags || [],
        featuredImage: existingContent.featuredImage,
        seoTitle: existingContent.seo?.title,
        seoDescription: existingContent.seo?.description,
        seoKeywords: existingContent.seo?.keywords,
        isPublic: existingContent.isPublic,
        allowComments: existingContent.allowComments,
        publishedAt: existingContent.publishedAt ? new Date(existingContent.publishedAt).toISOString().slice(0, 16) : undefined,
      });
    }
  }, [existingContent]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !contentId) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, contentId]);

  const updateFormData = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('cms.content.validation.titleRequired', 'common');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = t('cms.content.validation.slugRequired', 'common');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('cms.content.validation.slugInvalid', 'common');
    }

    if (!formData.content.trim()) {
      newErrors.content = t('cms.content.validation.contentRequired', 'common');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status?: Content['status']) => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const contentData = {
        ...formData,
        status: status || formData.status,
        seo: {
          title: formData.seoTitle,
          description: formData.seoDescription,
          keywords: formData.seoKeywords,
        },
        publishedAt: status === 'published' && !formData.publishedAt 
          ? new Date().toISOString() 
          : formData.publishedAt ? new Date(formData.publishedAt).toISOString() : undefined,
      };

      let savedContent: Content;
      if (contentId) {
        savedContent = await updateContent(contentId, contentData);
      } else {
        savedContent = await createContent(contentData);
      }

      onSave?.(savedContent);
      
      if (!onSave) {
        router.push('/admin/cms');
      }
    } catch (error: any) {
      console.error('Failed to save content:', error);
      setErrors({ general: error.message || t('cms.content.error.saveFailed', 'common') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {contentId ? t('cms.content.edit', 'common') : t('cms.content.create', 'common')}
          </h1>
          <p className="text-muted-foreground">
            {contentId ? t('cms.content.editDescription', 'common') : t('cms.content.createDescription', 'common')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <EyeIcon className="h-4 w-4 mr-2" />
            {previewMode ? t('common.edit', 'common') : t('common.preview', 'common')}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel', 'common')}
            </Button>
          )}
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {previewMode ? (
            <ContentPreview content={formData} />
          ) : (
            <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('cms.content.basicInfo', 'common')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('cms.content.title', 'common')} *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder={t('cms.content.titlePlaceholder', 'common')}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">{t('cms.content.slug', 'common')} *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => updateFormData('slug', e.target.value)}
                      placeholder={t('cms.content.slugPlaceholder', 'common')}
                      className={errors.slug ? 'border-red-500' : ''}
                    />
                    {errors.slug && <p className="text-red-500 text-sm">{errors.slug}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">{t('cms.content.excerpt', 'common')}</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => updateFormData('excerpt', e.target.value)}
                      placeholder={t('cms.content.excerptPlaceholder', 'common')}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('cms.content.content', 'common')} *</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Toolbar */}
                  <div className="border-b pb-3 mb-4">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <BoldIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ItalicIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <UnderlineIcon className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm">
                        <AlignLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <AlignCenterIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <AlignRightIcon className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm">
                        <ListIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <QuoteIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <CodeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm">
                        <UndoIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RedoIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={formData.content}
                    onChange={(e) => updateFormData('content', e.target.value)}
                    placeholder={t('cms.content.contentPlaceholder', 'common')}
                    className={`min-h-[400px] font-mono ${errors.content ? 'border-red-500' : ''}`}
                  />
                  {errors.content && <p className="text-red-500 text-sm mt-2">{errors.content}</p>}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('cms.content.publishSettings', 'common')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('cms.content.status', 'common')}</Label>
                <Select value={formData.status} onValueChange={(value: Content['status']) => updateFormData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('cms.content.status.draft', 'common')}</SelectItem>
                    <SelectItem value="published">{t('cms.content.status.published', 'common')}</SelectItem>
                    <SelectItem value="archived">{t('cms.content.status.archived', 'common')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('cms.content.type', 'common')}</Label>
                <Select value={formData.type} onValueChange={(value: Content['type']) => updateFormData('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">{t('cms.content.type.page', 'common')}</SelectItem>
                    <SelectItem value="post">{t('cms.content.type.post', 'common')}</SelectItem>
                    <SelectItem value="project">{t('cms.content.type.project', 'common')}</SelectItem>
                    <SelectItem value="skill">{t('cms.content.type.skill', 'common')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'published' && (
                <div className="space-y-2">
                  <Label htmlFor="publishedAt">{t('cms.content.publishedAt', 'common')}</Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={formData.publishedAt || ''}
                    onChange={(e) => updateFormData('publishedAt', e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => updateFormData('isPublic', checked)}
                />
                <Label htmlFor="isPublic">{t('cms.content.isPublic', 'common')}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allowComments"
                  checked={formData.allowComments}
                  onCheckedChange={(checked) => updateFormData('allowComments', checked)}
                />
                <Label htmlFor="allowComments">{t('cms.content.allowComments', 'common')}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>{t('cms.content.category', 'common')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.categoryId || ''} onValueChange={(value) => updateFormData('categoryId', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('cms.content.selectCategory', 'common')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('cms.content.noCategory', 'common')}</SelectItem>
                  {categoryData?.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>{t('cms.content.tags', 'common')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('cms.content.addTag', 'common')}
                  className="flex-1"
                />
                <Button onClick={handleAddTag} size="sm">
                  {t('common.add', 'common')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>{t('cms.content.featuredImage', 'common')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  value={formData.featuredImage || ''}
                  onChange={(e) => updateFormData('featuredImage', e.target.value)}
                  placeholder={t('cms.content.featuredImageUrl', 'common')}
                />
                <Button variant="outline" className="w-full">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {t('cms.content.selectImage', 'common')}
                </Button>
                {formData.featuredImage && (
                  <div className="aspect-video bg-muted rounded-md overflow-hidden">
                    <img
                      src={formData.featuredImage}
                      alt="Featured image preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('cms.content.seoSettings', 'common')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSeoSettings(!showSeoSettings)}
                >
                  {showSeoSettings ? t('common.hide', 'common') : t('common.show', 'common')}
                </Button>
              </CardTitle>
            </CardHeader>
            {showSeoSettings && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">{t('cms.content.seoTitle', 'common')}</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle || ''}
                    onChange={(e) => updateFormData('seoTitle', e.target.value)}
                    placeholder={t('cms.content.seoTitlePlaceholder', 'common')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">{t('cms.content.seoDescription', 'common')}</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription || ''}
                    onChange={(e) => updateFormData('seoDescription', e.target.value)}
                    placeholder={t('cms.content.seoDescriptionPlaceholder', 'common')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">{t('cms.content.seoKeywords', 'common')}</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords || ''}
                    onChange={(e) => updateFormData('seoKeywords', e.target.value)}
                    placeholder={t('cms.content.seoKeywordsPlaceholder', 'common')}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button
                  onClick={() => handleSave('published')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isLoading ? t('common.saving', 'common') : t('cms.content.publish', 'common')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={isLoading}
                  className="w-full"
                >
                  {t('cms.content.saveDraft', 'common')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Content Preview Component
function ContentPreview({ content }: { content: ContentFormData }) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge>{t(`cms.content.type.${content.type}`, 'common')}</Badge>
            <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
              {t(`cms.content.status.${content.status}`, 'common')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{content.title || t('cms.content.untitled', 'common')}</h1>
          {content.excerpt && (
            <p className="text-lg text-muted-foreground">{content.excerpt}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{t('cms.content.slug', 'common')}: /{content.slug}</span>
            {content.publishedAt && (
              <span>{t('cms.content.publishedAt', 'common')}: {new Date(content.publishedAt).toLocaleDateString()}</span>
            )}
          </div>
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {content.featuredImage && (
          <div className="aspect-video bg-muted rounded-md overflow-hidden mb-6">
            <img
              src={content.featuredImage}
              alt="Featured image"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap">
            {content.content || t('cms.content.noContent', 'common')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContentEditor;