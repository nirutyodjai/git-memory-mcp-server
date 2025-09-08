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
        return (react_1.default.createElement("div", { className: "flex items-center justify-center h-64" },
            react_1.default.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" })));
    }
    return (react_1.default.createElement("div", { className: `space-y-6 ${className}` },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-3xl font-bold tracking-tight" }, contentId ? t('cms.content.edit', 'common') : t('cms.content.create', 'common')),
                react_1.default.createElement("p", { className: "text-muted-foreground" }, contentId ? t('cms.content.editDescription', 'common') : t('cms.content.createDescription', 'common'))),
            react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => setPreviewMode(!previewMode) },
                    react_1.default.createElement(lucide_react_1.EyeIcon, { className: "h-4 w-4 mr-2" }),
                    previewMode ? t('common.edit', 'common') : t('common.preview', 'common')),
                onCancel && (react_1.default.createElement(button_1.Button, { variant: "outline", onClick: onCancel }, t('common.cancel', 'common'))))),
        errors.general && (react_1.default.createElement("div", { className: "bg-red-50 border border-red-200 rounded-md p-4" },
            react_1.default.createElement("p", { className: "text-red-600 text-sm" }, errors.general))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
            react_1.default.createElement("div", { className: "lg:col-span-2 space-y-6" }, previewMode ? (react_1.default.createElement(ContentPreview, { content: formData })) : (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('cms.content.basicInfo', 'common'))),
                    react_1.default.createElement(card_1.CardContent, { className: "space-y-4" },
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "title" },
                                t('cms.content.title', 'common'),
                                " *"),
                            react_1.default.createElement(input_1.Input, { id: "title", value: formData.title, onChange: (e) => updateFormData('title', e.target.value), placeholder: t('cms.content.titlePlaceholder', 'common'), className: errors.title ? 'border-red-500' : '' }),
                            errors.title && react_1.default.createElement("p", { className: "text-red-500 text-sm" }, errors.title)),
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "slug" },
                                t('cms.content.slug', 'common'),
                                " *"),
                            react_1.default.createElement(input_1.Input, { id: "slug", value: formData.slug, onChange: (e) => updateFormData('slug', e.target.value), placeholder: t('cms.content.slugPlaceholder', 'common'), className: errors.slug ? 'border-red-500' : '' }),
                            errors.slug && react_1.default.createElement("p", { className: "text-red-500 text-sm" }, errors.slug)),
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "excerpt" }, t('cms.content.excerpt', 'common')),
                            react_1.default.createElement(textarea_1.Textarea, { id: "excerpt", value: formData.excerpt, onChange: (e) => updateFormData('excerpt', e.target.value), placeholder: t('cms.content.excerptPlaceholder', 'common'), rows: 3 })))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null,
                            t('cms.content.content', 'common'),
                            " *")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "border-b pb-3 mb-4" },
                            react_1.default.createElement("div", { className: "flex items-center space-x-1" },
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.BoldIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.ItalicIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.UnderlineIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(separator_1.Separator, { orientation: "vertical", className: "h-6" }),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.AlignLeftIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.AlignCenterIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.AlignRightIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(separator_1.Separator, { orientation: "vertical", className: "h-6" }),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.ListIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.QuoteIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.CodeIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.LinkIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.ImageIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(separator_1.Separator, { orientation: "vertical", className: "h-6" }),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.UndoIcon, { className: "h-4 w-4" })),
                                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                    react_1.default.createElement(lucide_react_1.RedoIcon, { className: "h-4 w-4" })))),
                        react_1.default.createElement(textarea_1.Textarea, { value: formData.content, onChange: (e) => updateFormData('content', e.target.value), placeholder: t('cms.content.contentPlaceholder', 'common'), className: `min-h-[400px] font-mono ${errors.content ? 'border-red-500' : ''}` }),
                        errors.content && react_1.default.createElement("p", { className: "text-red-500 text-sm mt-2" }, errors.content)))))),
            react_1.default.createElement("div", { className: "space-y-6" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('cms.content.publishSettings', 'common'))),
                    react_1.default.createElement(card_1.CardContent, { className: "space-y-4" },
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, null, t('cms.content.status', 'common')),
                            react_1.default.createElement(select_1.Select, { value: formData.status, onValueChange: (value) => updateFormData('status', value) },
                                react_1.default.createElement(select_1.SelectTrigger, null,
                                    react_1.default.createElement(select_1.SelectValue, null)),
                                react_1.default.createElement(select_1.SelectContent, null,
                                    react_1.default.createElement(select_1.SelectItem, { value: "draft" }, t('cms.content.status.draft', 'common')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "published" }, t('cms.content.status.published', 'common')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "archived" }, t('cms.content.status.archived', 'common'))))),
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, null, t('cms.content.type', 'common')),
                            react_1.default.createElement(select_1.Select, { value: formData.type, onValueChange: (value) => updateFormData('type', value) },
                                react_1.default.createElement(select_1.SelectTrigger, null,
                                    react_1.default.createElement(select_1.SelectValue, null)),
                                react_1.default.createElement(select_1.SelectContent, null,
                                    react_1.default.createElement(select_1.SelectItem, { value: "page" }, t('cms.content.type.page', 'common')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "post" }, t('cms.content.type.post', 'common')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "project" }, t('cms.content.type.project', 'common')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "skill" }, t('cms.content.type.skill', 'common'))))),
                        formData.status === 'published' && (react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "publishedAt" }, t('cms.content.publishedAt', 'common')),
                            react_1.default.createElement(input_1.Input, { id: "publishedAt", type: "datetime-local", value: formData.publishedAt || '', onChange: (e) => updateFormData('publishedAt', e.target.value) }))),
                        react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                            react_1.default.createElement(switch_1.Switch, { id: "isPublic", checked: formData.isPublic, onCheckedChange: (checked) => updateFormData('isPublic', checked) }),
                            react_1.default.createElement(label_1.Label, { htmlFor: "isPublic" }, t('cms.content.isPublic', 'common'))),
                        react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                            react_1.default.createElement(switch_1.Switch, { id: "allowComments", checked: formData.allowComments, onCheckedChange: (checked) => updateFormData('allowComments', checked) }),
                            react_1.default.createElement(label_1.Label, { htmlFor: "allowComments" }, t('cms.content.allowComments', 'common'))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('cms.content.category', 'common'))),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement(select_1.Select, { value: formData.categoryId || '', onValueChange: (value) => updateFormData('categoryId', value || undefined) },
                            react_1.default.createElement(select_1.SelectTrigger, null,
                                react_1.default.createElement(select_1.SelectValue, { placeholder: t('cms.content.selectCategory', 'common') })),
                            react_1.default.createElement(select_1.SelectContent, null,
                                react_1.default.createElement(select_1.SelectItem, { value: "" }, t('cms.content.noCategory', 'common')),
                                categoryData?.categories.map((category) => (react_1.default.createElement(select_1.SelectItem, { key: category.id, value: category.id }, category.name))))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('cms.content.tags', 'common'))),
                    react_1.default.createElement(card_1.CardContent, { className: "space-y-3" },
                        react_1.default.createElement("div", { className: "flex space-x-2" },
                            react_1.default.createElement(input_1.Input, { value: tagInput, onChange: (e) => setTagInput(e.target.value), onKeyPress: handleKeyPress, placeholder: t('cms.content.addTag', 'common'), className: "flex-1" }),
                            react_1.default.createElement(button_1.Button, { onClick: handleAddTag, size: "sm" }, t('common.add', 'common'))),
                        react_1.default.createElement("div", { className: "flex flex-wrap gap-2" }, formData.tags.map((tag) => (react_1.default.createElement(badge_1.Badge, { key: tag, variant: "secondary", className: "flex items-center space-x-1" },
                            react_1.default.createElement("span", null, tag),
                            react_1.default.createElement("button", { onClick: () => handleRemoveTag(tag), className: "ml-1 hover:text-red-500" },
                                react_1.default.createElement(lucide_react_1.XIcon, { className: "h-3 w-3" })))))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('cms.content.featuredImage', 'common'))),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-3" },
                            react_1.default.createElement(input_1.Input, { value: formData.featuredImage || '', onChange: (e) => updateFormData('featuredImage', e.target.value), placeholder: t('cms.content.featuredImageUrl', 'common') }),
                            react_1.default.createElement(button_1.Button, { variant: "outline", className: "w-full" },
                                react_1.default.createElement(lucide_react_1.ImageIcon, { className: "h-4 w-4 mr-2" }),
                                t('cms.content.selectImage', 'common')),
                            formData.featuredImage && (react_1.default.createElement("div", { className: "aspect-video bg-muted rounded-md overflow-hidden" },
                                react_1.default.createElement("img", { src: formData.featuredImage, alt: "Featured image preview", className: "w-full h-full object-cover" })))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, { className: "flex items-center justify-between" },
                            t('cms.content.seoSettings', 'common'),
                            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setShowSeoSettings(!showSeoSettings) }, showSeoSettings ? t('common.hide', 'common') : t('common.show', 'common')))),
                    showSeoSettings && (react_1.default.createElement(card_1.CardContent, { className: "space-y-4" },
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "seoTitle" }, t('cms.content.seoTitle', 'common')),
                            react_1.default.createElement(input_1.Input, { id: "seoTitle", value: formData.seoTitle || '', onChange: (e) => updateFormData('seoTitle', e.target.value), placeholder: t('cms.content.seoTitlePlaceholder', 'common') })),
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "seoDescription" }, t('cms.content.seoDescription', 'common')),
                            react_1.default.createElement(textarea_1.Textarea, { id: "seoDescription", value: formData.seoDescription || '', onChange: (e) => updateFormData('seoDescription', e.target.value), placeholder: t('cms.content.seoDescriptionPlaceholder', 'common'), rows: 3 })),
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(label_1.Label, { htmlFor: "seoKeywords" }, t('cms.content.seoKeywords', 'common')),
                            react_1.default.createElement(input_1.Input, { id: "seoKeywords", value: formData.seoKeywords || '', onChange: (e) => updateFormData('seoKeywords', e.target.value), placeholder: t('cms.content.seoKeywordsPlaceholder', 'common') }))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                        react_1.default.createElement("div", { className: "space-y-2" },
                            react_1.default.createElement(button_1.Button, { onClick: () => handleSave('published'), disabled: isLoading, className: "w-full" },
                                react_1.default.createElement(lucide_react_1.SaveIcon, { className: "h-4 w-4 mr-2" }),
                                isLoading ? t('common.saving', 'common') : t('cms.content.publish', 'common')),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => handleSave('draft'), disabled: isLoading, className: "w-full" }, t('cms.content.saveDraft', 'common')))))))));
}
// Content Preview Component
function ContentPreview({ content }) {
    const { t } = (0, i18n_provider_1.useI18n)();
    return (react_1.default.createElement(card_1.Card, null,
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement("div", { className: "space-y-2" },
                react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                    react_1.default.createElement(badge_1.Badge, null, t(`cms.content.type.${content.type}`, 'common')),
                    react_1.default.createElement(badge_1.Badge, { variant: content.status === 'published' ? 'default' : 'secondary' }, t(`cms.content.status.${content.status}`, 'common'))),
                react_1.default.createElement("h1", { className: "text-3xl font-bold" }, content.title || t('cms.content.untitled', 'common')),
                content.excerpt && (react_1.default.createElement("p", { className: "text-lg text-muted-foreground" }, content.excerpt)),
                react_1.default.createElement("div", { className: "flex items-center space-x-4 text-sm text-muted-foreground" },
                    react_1.default.createElement("span", null,
                        t('cms.content.slug', 'common'),
                        ": /",
                        content.slug),
                    content.publishedAt && (react_1.default.createElement("span", null,
                        t('cms.content.publishedAt', 'common'),
                        ": ",
                        new Date(content.publishedAt).toLocaleDateString()))),
                content.tags.length > 0 && (react_1.default.createElement("div", { className: "flex flex-wrap gap-1" }, content.tags.map((tag) => (react_1.default.createElement(badge_1.Badge, { key: tag, variant: "outline", className: "text-xs" }, tag))))))),
        react_1.default.createElement(card_1.CardContent, null,
            content.featuredImage && (react_1.default.createElement("div", { className: "aspect-video bg-muted rounded-md overflow-hidden mb-6" },
                react_1.default.createElement("img", { src: content.featuredImage, alt: "Featured image", className: "w-full h-full object-cover" }))),
            react_1.default.createElement("div", { className: "prose max-w-none" },
                react_1.default.createElement("div", { className: "whitespace-pre-wrap" }, content.content || t('cms.content.noContent', 'common'))))));
}
exports.default = ContentEditor;
