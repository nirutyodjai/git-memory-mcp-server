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
exports.ContentEditor = ContentEditor;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const select_1 = require("@/components/ui/select");
const switch_1 = require("@/components/ui/switch");
const separator_1 = require("@/components/ui/separator");
const i18n_provider_1 = require("@/components/providers/i18n-provider");
const hooks_1 = require("@/lib/cms/hooks");
const lucide_react_1 = require("lucide-react");
const navigation_1 = require("next/navigation");
function ContentEditor({ contentId, onSave, onCancel, className }) {
    const { t } = (0, i18n_provider_1.useI18n)();
    const router = (0, navigation_1.useRouter)();
    const { data: existingContent, loading: contentLoading } = (0, hooks_1.useContentById)(contentId || '');
    const { data: categoryData } = (0, hooks_1.useCategories)();
    const { createContent, updateContent } = (0, hooks_1.useContentMutations)();
    const [formData, setFormData] = (0, react_1.useState)({
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
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [errors, setErrors] = (0, react_1.useState)({});
    const [previewMode, setPreviewMode] = (0, react_1.useState)(false);
    const [tagInput, setTagInput] = (0, react_1.useState)('');
    const [showSeoSettings, setShowSeoSettings] = (0, react_1.useState)(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = (0, react_1.useState)(false);
    // Load existing content
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = t('cms.content.validation.titleRequired', 'common');
        }
        if (!formData.slug.trim()) {
            newErrors.slug = t('cms.content.validation.slugRequired', 'common');
        }
        else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = t('cms.content.validation.slugInvalid', 'common');
        }
        if (!formData.content.trim()) {
            newErrors.content = t('cms.content.validation.contentRequired', 'common');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async (status) => {
        if (!validateForm())
            return;
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
            let savedContent;
            if (contentId) {
                savedContent = await updateContent(contentId, contentData);
            }
            else {
                savedContent = await createContent(contentData);
            }
            onSave?.(savedContent);
            if (!onSave) {
                router.push('/admin/cms');
            }
        }
        catch (error) {
            console.error('Failed to save content:', error);
            setErrors({ general: error.message || t('cms.content.error.saveFailed', 'common') });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            updateFormData('tags', [...formData.tags, tagInput.trim()]);
            setTagInput('');
        }
    };
    const handleRemoveTag = (tagToRemove) => {
        updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };
    if (contentLoading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    return (<div className={`space-y-6 ${className}`}>
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
          <button_1.Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <lucide_react_1.EyeIcon className="h-4 w-4 mr-2"/>
            {previewMode ? t('common.edit', 'common') : t('common.preview', 'common')}
          </button_1.Button>
          {onCancel && (<button_1.Button variant="outline" onClick={onCancel}>
              {t('common.cancel', 'common')}
            </button_1.Button>)}
        </div>
      </div>

      {errors.general && (<div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {previewMode ? (<ContentPreview content={formData}/>) : (<>
              {/* Basic Information */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>{t('cms.content.basicInfo', 'common')}</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="title">{t('cms.content.title', 'common')} *</label_1.Label>
                    <input_1.Input id="title" value={formData.title} onChange={(e) => updateFormData('title', e.target.value)} placeholder={t('cms.content.titlePlaceholder', 'common')} className={errors.title ? 'border-red-500' : ''}/>
                    {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <label_1.Label htmlFor="slug">{t('cms.content.slug', 'common')} *</label_1.Label>
                    <input_1.Input id="slug" value={formData.slug} onChange={(e) => updateFormData('slug', e.target.value)} placeholder={t('cms.content.slugPlaceholder', 'common')} className={errors.slug ? 'border-red-500' : ''}/>
                    {errors.slug && <p className="text-red-500 text-sm">{errors.slug}</p>}
                  </div>

                  <div className="space-y-2">
                    <label_1.Label htmlFor="excerpt">{t('cms.content.excerpt', 'common')}</label_1.Label>
                    <textarea_1.Textarea id="excerpt" value={formData.excerpt} onChange={(e) => updateFormData('excerpt', e.target.value)} placeholder={t('cms.content.excerptPlaceholder', 'common')} rows={3}/>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              {/* Content Editor */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>{t('cms.content.content', 'common')} *</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  {/* Toolbar */}
                  <div className="border-b pb-3 mb-4">
                    <div className="flex items-center space-x-1">
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.BoldIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.ItalicIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.UnderlineIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <separator_1.Separator orientation="vertical" className="h-6"/>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.AlignLeftIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.AlignCenterIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.AlignRightIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <separator_1.Separator orientation="vertical" className="h-6"/>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.ListIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.QuoteIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.CodeIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.LinkIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.ImageIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <separator_1.Separator orientation="vertical" className="h-6"/>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.UndoIcon className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.RedoIcon className="h-4 w-4"/>
                      </button_1.Button>
                    </div>
                  </div>

                  <textarea_1.Textarea value={formData.content} onChange={(e) => updateFormData('content', e.target.value)} placeholder={t('cms.content.contentPlaceholder', 'common')} className={`min-h-[400px] font-mono ${errors.content ? 'border-red-500' : ''}`}/>
                  {errors.content && <p className="text-red-500 text-sm mt-2">{errors.content}</p>}
                </card_1.CardContent>
              </card_1.Card>
            </>)}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('cms.content.publishSettings', 'common')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="space-y-2">
                <label_1.Label>{t('cms.content.status', 'common')}</label_1.Label>
                <select_1.Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="draft">{t('cms.content.status.draft', 'common')}</select_1.SelectItem>
                    <select_1.SelectItem value="published">{t('cms.content.status.published', 'common')}</select_1.SelectItem>
                    <select_1.SelectItem value="archived">{t('cms.content.status.archived', 'common')}</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="space-y-2">
                <label_1.Label>{t('cms.content.type', 'common')}</label_1.Label>
                <select_1.Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="page">{t('cms.content.type.page', 'common')}</select_1.SelectItem>
                    <select_1.SelectItem value="post">{t('cms.content.type.post', 'common')}</select_1.SelectItem>
                    <select_1.SelectItem value="project">{t('cms.content.type.project', 'common')}</select_1.SelectItem>
                    <select_1.SelectItem value="skill">{t('cms.content.type.skill', 'common')}</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              {formData.status === 'published' && (<div className="space-y-2">
                  <label_1.Label htmlFor="publishedAt">{t('cms.content.publishedAt', 'common')}</label_1.Label>
                  <input_1.Input id="publishedAt" type="datetime-local" value={formData.publishedAt || ''} onChange={(e) => updateFormData('publishedAt', e.target.value)}/>
                </div>)}

              <div className="flex items-center space-x-2">
                <switch_1.Switch id="isPublic" checked={formData.isPublic} onCheckedChange={(checked) => updateFormData('isPublic', checked)}/>
                <label_1.Label htmlFor="isPublic">{t('cms.content.isPublic', 'common')}</label_1.Label>
              </div>

              <div className="flex items-center space-x-2">
                <switch_1.Switch id="allowComments" checked={formData.allowComments} onCheckedChange={(checked) => updateFormData('allowComments', checked)}/>
                <label_1.Label htmlFor="allowComments">{t('cms.content.allowComments', 'common')}</label_1.Label>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Category */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('cms.content.category', 'common')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <select_1.Select value={formData.categoryId || ''} onValueChange={(value) => updateFormData('categoryId', value || undefined)}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue placeholder={t('cms.content.selectCategory', 'common')}/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="">{t('cms.content.noCategory', 'common')}</select_1.SelectItem>
                  {categoryData?.categories.map((category) => (<select_1.SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </select_1.SelectItem>))}
                </select_1.SelectContent>
              </select_1.Select>
            </card_1.CardContent>
          </card_1.Card>

          {/* Tags */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('cms.content.tags', 'common')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-3">
              <div className="flex space-x-2">
                <input_1.Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={t('cms.content.addTag', 'common')} className="flex-1"/>
                <button_1.Button onClick={handleAddTag} size="sm">
                  {t('common.add', 'common')}
                </button_1.Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (<badge_1.Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500">
                      <lucide_react_1.XIcon className="h-3 w-3"/>
                    </button>
                  </badge_1.Badge>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Featured Image */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>{t('cms.content.featuredImage', 'common')}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-3">
                <input_1.Input value={formData.featuredImage || ''} onChange={(e) => updateFormData('featuredImage', e.target.value)} placeholder={t('cms.content.featuredImageUrl', 'common')}/>
                <button_1.Button variant="outline" className="w-full">
                  <lucide_react_1.ImageIcon className="h-4 w-4 mr-2"/>
                  {t('cms.content.selectImage', 'common')}
                </button_1.Button>
                {formData.featuredImage && (<div className="aspect-video bg-muted rounded-md overflow-hidden">
                    <img src={formData.featuredImage} alt="Featured image preview" className="w-full h-full object-cover"/>
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* SEO Settings */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center justify-between">
                {t('cms.content.seoSettings', 'common')}
                <button_1.Button variant="ghost" size="sm" onClick={() => setShowSeoSettings(!showSeoSettings)}>
                  {showSeoSettings ? t('common.hide', 'common') : t('common.show', 'common')}
                </button_1.Button>
              </card_1.CardTitle>
            </card_1.CardHeader>
            {showSeoSettings && (<card_1.CardContent className="space-y-4">
                <div className="space-y-2">
                  <label_1.Label htmlFor="seoTitle">{t('cms.content.seoTitle', 'common')}</label_1.Label>
                  <input_1.Input id="seoTitle" value={formData.seoTitle || ''} onChange={(e) => updateFormData('seoTitle', e.target.value)} placeholder={t('cms.content.seoTitlePlaceholder', 'common')}/>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="seoDescription">{t('cms.content.seoDescription', 'common')}</label_1.Label>
                  <textarea_1.Textarea id="seoDescription" value={formData.seoDescription || ''} onChange={(e) => updateFormData('seoDescription', e.target.value)} placeholder={t('cms.content.seoDescriptionPlaceholder', 'common')} rows={3}/>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="seoKeywords">{t('cms.content.seoKeywords', 'common')}</label_1.Label>
                  <input_1.Input id="seoKeywords" value={formData.seoKeywords || ''} onChange={(e) => updateFormData('seoKeywords', e.target.value)} placeholder={t('cms.content.seoKeywordsPlaceholder', 'common')}/>
                </div>
              </card_1.CardContent>)}
          </card_1.Card>

          {/* Save Actions */}
          <card_1.Card>
            <card_1.CardContent className="pt-6">
              <div className="space-y-2">
                <button_1.Button onClick={() => handleSave('published')} disabled={isLoading} className="w-full">
                  <lucide_react_1.SaveIcon className="h-4 w-4 mr-2"/>
                  {isLoading ? t('common.saving', 'common') : t('cms.content.publish', 'common')}
                </button_1.Button>
                <button_1.Button variant="outline" onClick={() => handleSave('draft')} disabled={isLoading} className="w-full">
                  {t('cms.content.saveDraft', 'common')}
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
// Content Preview Component
function ContentPreview({ content }) {
    const { t } = (0, i18n_provider_1.useI18n)();
    return (<card_1.Card>
      <card_1.CardHeader>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <badge_1.Badge>{t(`cms.content.type.${content.type}`, 'common')}</badge_1.Badge>
            <badge_1.Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
              {t(`cms.content.status.${content.status}`, 'common')}
            </badge_1.Badge>
          </div>
          <h1 className="text-3xl font-bold">{content.title || t('cms.content.untitled', 'common')}</h1>
          {content.excerpt && (<p className="text-lg text-muted-foreground">{content.excerpt}</p>)}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{t('cms.content.slug', 'common')}: /{content.slug}</span>
            {content.publishedAt && (<span>{t('cms.content.publishedAt', 'common')}: {new Date(content.publishedAt).toLocaleDateString()}</span>)}
          </div>
          {content.tags.length > 0 && (<div className="flex flex-wrap gap-1">
              {content.tags.map((tag) => (<badge_1.Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </badge_1.Badge>))}
            </div>)}
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        {content.featuredImage && (<div className="aspect-video bg-muted rounded-md overflow-hidden mb-6">
            <img src={content.featuredImage} alt="Featured image" className="w-full h-full object-cover"/>
          </div>)}
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap">
            {content.content || t('cms.content.noContent', 'common')}
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
exports.default = ContentEditor;
//# sourceMappingURL=content-editor.js.map