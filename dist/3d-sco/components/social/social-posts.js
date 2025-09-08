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
exports.SocialPosts = SocialPosts;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const select_1 = require("@/components/ui/select");
const dialog_1 = require("@/components/ui/dialog");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const lucide_react_1 = require("lucide-react");
const social_service_1 = require("@/lib/social/social-service");
const use_translation_1 = require("@/lib/i18n/use-translation");
function SocialPosts() {
    const { t } = (0, use_translation_1.useTranslation)();
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [platforms, setPlatforms] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [createDialog, setCreateDialog] = (0, react_1.useState)(false);
    const [editDialog, setEditDialog] = (0, react_1.useState)({ open: false });
    const [formData, setFormData] = (0, react_1.useState)({
        content: '',
        platform: '',
        images: [],
    });
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [filter, setFilter] = (0, react_1.useState)({
        platform: 'all',
        status: 'all',
    });
    (0, react_1.useEffect)(() => {
        loadData();
    }, [filter]);
    const loadData = async () => {
        try {
            setLoading(true);
            const [postsData, platformsData] = await Promise.all([
                social_service_1.socialService.getPosts({
                    platform: filter.platform !== 'all' ? filter.platform : undefined,
                    status: filter.status !== 'all' ? filter.status : undefined,
                }),
                social_service_1.socialService.getPlatforms(),
            ]);
            setPosts(postsData);
            setPlatforms(platformsData.filter(p => p.isConnected));
        }
        catch (error) {
            console.error('Failed to load data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreatePost = async () => {
        if (!formData.content || !formData.platform)
            return;
        try {
            setSubmitting(true);
            await social_service_1.socialService.createPost({
                content: formData.content,
                platform: formData.platform,
                images: formData.images,
                scheduledAt: formData.scheduledAt,
                status: formData.scheduledAt ? 'scheduled' : 'draft',
            });
            await loadData();
            setCreateDialog(false);
            resetForm();
        }
        catch (error) {
            console.error('Failed to create post:', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleUpdatePost = async () => {
        if (!editDialog.post || !formData.content)
            return;
        try {
            setSubmitting(true);
            await social_service_1.socialService.updatePost(editDialog.post.id, {
                content: formData.content,
                images: formData.images,
                scheduledAt: formData.scheduledAt,
            });
            await loadData();
            setEditDialog({ open: false });
            resetForm();
        }
        catch (error) {
            console.error('Failed to update post:', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDeletePost = async (postId) => {
        try {
            await social_service_1.socialService.deletePost(postId);
            await loadData();
        }
        catch (error) {
            console.error('Failed to delete post:', error);
        }
    };
    const handlePublishPost = async (postId) => {
        try {
            await social_service_1.socialService.publishPost(postId);
            await loadData();
        }
        catch (error) {
            console.error('Failed to publish post:', error);
        }
    };
    const resetForm = () => {
        setFormData({
            content: '',
            platform: '',
            images: [],
        });
    };
    const openEditDialog = (post) => {
        setFormData({
            content: post.content,
            platform: post.platform,
            images: post.images || [],
            scheduledAt: post.scheduledAt,
        });
        setEditDialog({ open: true, post });
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'published':
                return react_1.default.createElement(lucide_react_1.CheckCircle, { className: "w-4 h-4 text-green-500" });
            case 'scheduled':
                return react_1.default.createElement(lucide_react_1.Clock, { className: "w-4 h-4 text-blue-500" });
            case 'failed':
                return react_1.default.createElement(lucide_react_1.XCircle, { className: "w-4 h-4 text-red-500" });
            default:
                return react_1.default.createElement(lucide_react_1.AlertCircle, { className: "w-4 h-4 text-yellow-500" });
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };
    const getPlatformName = (platformId) => {
        const platform = platforms.find(p => p.id === platformId);
        return platform?.name || platformId;
    };
    if (loading) {
        return (react_1.default.createElement("div", { className: "flex items-center justify-center p-8" },
            react_1.default.createElement(lucide_react_1.Loader2, { className: "w-8 h-8 animate-spin" })));
    }
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-2xl font-bold" }, t('social.posts.title')),
                react_1.default.createElement("p", { className: "text-muted-foreground" }, t('social.posts.description'))),
            react_1.default.createElement(button_1.Button, { onClick: () => setCreateDialog(true) },
                react_1.default.createElement(lucide_react_1.Plus, { className: "w-4 h-4 mr-2" }),
                t('social.posts.create'))),
        react_1.default.createElement("div", { className: "flex space-x-4" },
            react_1.default.createElement(select_1.Select, { value: filter.platform, onValueChange: (value) => setFilter(prev => ({ ...prev, platform: value })) },
                react_1.default.createElement(select_1.SelectTrigger, { className: "w-48" },
                    react_1.default.createElement(select_1.SelectValue, { placeholder: t('social.selectPlatform') })),
                react_1.default.createElement(select_1.SelectContent, null,
                    react_1.default.createElement(select_1.SelectItem, { value: "all" }, t('common.all')),
                    platforms.map((platform) => (react_1.default.createElement(select_1.SelectItem, { key: platform.id, value: platform.id }, platform.name))))),
            react_1.default.createElement(select_1.Select, { value: filter.status, onValueChange: (value) => setFilter(prev => ({ ...prev, status: value })) },
                react_1.default.createElement(select_1.SelectTrigger, { className: "w-48" },
                    react_1.default.createElement(select_1.SelectValue, { placeholder: t('social.selectStatus') })),
                react_1.default.createElement(select_1.SelectContent, null,
                    react_1.default.createElement(select_1.SelectItem, { value: "all" }, t('common.all')),
                    react_1.default.createElement(select_1.SelectItem, { value: "draft" }, t('social.status.draft')),
                    react_1.default.createElement(select_1.SelectItem, { value: "scheduled" }, t('social.status.scheduled')),
                    react_1.default.createElement(select_1.SelectItem, { value: "published" }, t('social.status.published')),
                    react_1.default.createElement(select_1.SelectItem, { value: "failed" }, t('social.status.failed'))))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, posts.map((post) => (react_1.default.createElement(card_1.Card, { key: post.id, className: "relative" },
            react_1.default.createElement(card_1.CardHeader, { className: "pb-3" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                        react_1.default.createElement(badge_1.Badge, { variant: "outline" }, getPlatformName(post.platform)),
                        react_1.default.createElement(badge_1.Badge, { className: getStatusColor(post.status) },
                            getStatusIcon(post.status),
                            react_1.default.createElement("span", { className: "ml-1" }, t(`social.status.${post.status}`)))),
                    react_1.default.createElement(dropdown_menu_1.DropdownMenu, null,
                        react_1.default.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                                react_1.default.createElement(lucide_react_1.MoreHorizontal, { className: "w-4 h-4" }))),
                        react_1.default.createElement(dropdown_menu_1.DropdownMenuContent, { align: "end" },
                            react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => openEditDialog(post) },
                                react_1.default.createElement(lucide_react_1.Edit, { className: "w-4 h-4 mr-2" }),
                                t('common.edit')),
                            post.status === 'draft' && (react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => handlePublishPost(post.id) },
                                react_1.default.createElement(lucide_react_1.Send, { className: "w-4 h-4 mr-2" }),
                                t('social.publish'))),
                            react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => handleDeletePost(post.id), className: "text-red-600" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4 mr-2" }),
                                t('common.delete')))))),
            react_1.default.createElement(card_1.CardContent, { className: "space-y-4" },
                react_1.default.createElement("p", { className: "text-sm line-clamp-3" }, post.content),
                post.images && post.images.length > 0 && (react_1.default.createElement("div", { className: "flex items-center space-x-2 text-sm text-muted-foreground" },
                    react_1.default.createElement(lucide_react_1.Image, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null,
                        post.images.length,
                        " ",
                        t('social.images')))),
                post.scheduledAt && (react_1.default.createElement("div", { className: "flex items-center space-x-2 text-sm text-muted-foreground" },
                    react_1.default.createElement(lucide_react_1.Calendar, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null, new Date(post.scheduledAt).toLocaleString()))),
                post.status === 'published' && (react_1.default.createElement("div", { className: "grid grid-cols-2 gap-2 text-sm" },
                    react_1.default.createElement("div", { className: "flex items-center space-x-1" },
                        react_1.default.createElement(lucide_react_1.Heart, { className: "w-4 h-4 text-red-500" }),
                        react_1.default.createElement("span", null, post.engagement.likes)),
                    react_1.default.createElement("div", { className: "flex items-center space-x-1" },
                        react_1.default.createElement(lucide_react_1.Share2, { className: "w-4 h-4 text-blue-500" }),
                        react_1.default.createElement("span", null, post.engagement.shares)),
                    react_1.default.createElement("div", { className: "flex items-center space-x-1" },
                        react_1.default.createElement(lucide_react_1.MessageCircle, { className: "w-4 h-4 text-green-500" }),
                        react_1.default.createElement("span", null, post.engagement.comments)),
                    react_1.default.createElement("div", { className: "flex items-center space-x-1" },
                        react_1.default.createElement(lucide_react_1.Eye, { className: "w-4 h-4 text-purple-500" }),
                        react_1.default.createElement("span", null, post.engagement.reach)))),
                react_1.default.createElement("div", { className: "text-xs text-muted-foreground" },
                    t('common.created'),
                    ": ",
                    new Date(post.createdAt).toLocaleDateString())))))),
        posts.length === 0 && (react_1.default.createElement("div", { className: "text-center py-12" },
            react_1.default.createElement("p", { className: "text-muted-foreground" }, t('social.posts.empty')))),
        react_1.default.createElement(dialog_1.Dialog, { open: createDialog || editDialog.open, onOpenChange: (open) => {
                if (!open) {
                    setCreateDialog(false);
                    setEditDialog({ open: false });
                    resetForm();
                }
            } },
            react_1.default.createElement(dialog_1.DialogContent, { className: "max-w-2xl" },
                react_1.default.createElement(dialog_1.DialogHeader, null,
                    react_1.default.createElement(dialog_1.DialogTitle, null, editDialog.open ? t('social.posts.edit') : t('social.posts.create')),
                    react_1.default.createElement(dialog_1.DialogDescription, null, t('social.posts.createDescription'))),
                react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement("div", { className: "space-y-2" },
                        react_1.default.createElement(label_1.Label, { htmlFor: "platform" }, t('social.platform')),
                        react_1.default.createElement(select_1.Select, { value: formData.platform, onValueChange: (value) => setFormData(prev => ({ ...prev, platform: value })), disabled: editDialog.open },
                            react_1.default.createElement(select_1.SelectTrigger, null,
                                react_1.default.createElement(select_1.SelectValue, { placeholder: t('social.selectPlatform') })),
                            react_1.default.createElement(select_1.SelectContent, null, platforms.map((platform) => (react_1.default.createElement(select_1.SelectItem, { key: platform.id, value: platform.id }, platform.name)))))),
                    react_1.default.createElement("div", { className: "space-y-2" },
                        react_1.default.createElement(label_1.Label, { htmlFor: "content" }, t('social.content')),
                        react_1.default.createElement(textarea_1.Textarea, { id: "content", value: formData.content, onChange: (e) => setFormData(prev => ({ ...prev, content: e.target.value })), placeholder: t('social.contentPlaceholder'), rows: 4 })),
                    react_1.default.createElement("div", { className: "space-y-2" },
                        react_1.default.createElement(label_1.Label, { htmlFor: "scheduledAt" },
                            t('social.scheduleAt'),
                            " (",
                            t('common.optional'),
                            ")"),
                        react_1.default.createElement(input_1.Input, { id: "scheduledAt", type: "datetime-local", value: formData.scheduledAt ? new Date(formData.scheduledAt.getTime() - formData.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '', onChange: (e) => setFormData(prev => ({
                                ...prev,
                                scheduledAt: e.target.value ? new Date(e.target.value) : undefined
                            })) }))),
                react_1.default.createElement(dialog_1.DialogFooter, null,
                    react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => {
                            setCreateDialog(false);
                            setEditDialog({ open: false });
                            resetForm();
                        } }, t('common.cancel')),
                    react_1.default.createElement(button_1.Button, { onClick: editDialog.open ? handleUpdatePost : handleCreatePost, disabled: submitting || !formData.content || !formData.platform },
                        submitting ? (react_1.default.createElement(lucide_react_1.Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (react_1.default.createElement(lucide_react_1.Send, { className: "w-4 h-4 mr-2" })),
                        editDialog.open ? t('common.update') : t('social.posts.create')))))));
}
