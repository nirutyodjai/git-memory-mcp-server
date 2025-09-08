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
exports.BlogPost = BlogPost;
const react_1 = __importStar(require("react"));
const blog_provider_1 = require("./blog-provider");
const use_translation_1 = require("@/lib/i18n/use-translation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const avatar_1 = require("@/components/ui/avatar");
const separator_1 = require("@/components/ui/separator");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
function BlogPost({ slug }) {
    const { t } = (0, use_translation_1.useTranslation)();
    const { state, loadPost, incrementViews, toggleLike, addComment, loadComments } = (0, blog_provider_1.useBlog)();
    const [isLiked, setIsLiked] = (0, react_1.useState)(false);
    const [isBookmarked, setIsBookmarked] = (0, react_1.useState)(false);
    const [showCommentForm, setShowCommentForm] = (0, react_1.useState)(false);
    const [replyToComment, setReplyToComment] = (0, react_1.useState)(null);
    const [commentForm, setCommentForm] = (0, react_1.useState)({
        content: '',
        author: { name: '', email: '' }
    });
    const post = state.currentPost;
    (0, react_1.useEffect)(() => {
        if (slug) {
            loadPost(slug);
        }
    }, [slug, loadPost]);
    (0, react_1.useEffect)(() => {
        if (post) {
            // Increment view count after a short delay
            const timer = setTimeout(() => {
                incrementViews(post.id);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [post, incrementViews]);
    const handleLike = async () => {
        if (!post)
            return;
        try {
            await toggleLike(post.id);
            setIsLiked(!isLiked);
        }
        catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };
    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        // TODO: Implement bookmark functionality
    };
    const handleShare = async () => {
        if (!post)
            return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: window.location.href,
                });
            }
            catch (error) {
                console.error('Error sharing:', error);
            }
        }
        else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!post || !commentForm.content.trim())
            return;
        try {
            await addComment(post.id, {
                content: commentForm.content,
                author: commentForm.author,
                parentId: replyToComment || undefined,
            });
            setCommentForm({ content: '', author: { name: '', email: '' } });
            setReplyToComment(null);
            setShowCommentForm(false);
        }
        catch (error) {
            console.error('Failed to add comment:', error);
        }
    };
    const renderComment = (comment, level = 0) => {
        const maxLevel = 3;
        const canReply = level < maxLevel;
        return (react_1.default.createElement("div", { key: comment.id, className: `${level > 0 ? 'ml-8 mt-4' : 'mt-6'}` },
            react_1.default.createElement(card_1.Card, { className: "" },
                react_1.default.createElement(card_1.CardContent, { className: "pt-4" },
                    react_1.default.createElement("div", { className: "flex items-start gap-3" },
                        react_1.default.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                            react_1.default.createElement(avatar_1.AvatarImage, { src: comment.author.avatar }),
                            react_1.default.createElement(avatar_1.AvatarFallback, null, comment.author.name.charAt(0).toUpperCase())),
                        react_1.default.createElement("div", { className: "flex-1 space-y-2" },
                            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                react_1.default.createElement("span", { className: "font-medium text-sm" }, comment.author.name),
                                react_1.default.createElement("span", { className: "text-xs text-muted-foreground" }, (0, date_fns_1.format)(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')),
                                comment.status === 'approved' && (react_1.default.createElement(badge_1.Badge, { variant: "secondary", className: "text-xs" }, t('blog.comment.approved')))),
                            react_1.default.createElement("p", { className: "text-sm leading-relaxed" }, comment.content),
                            react_1.default.createElement("div", { className: "flex items-center gap-4 text-xs text-muted-foreground" },
                                react_1.default.createElement("button", { className: "flex items-center gap-1 hover:text-foreground transition-colors" },
                                    react_1.default.createElement(lucide_react_1.ThumbsUp, { className: "h-3 w-3" }),
                                    comment.likes),
                                react_1.default.createElement("button", { className: "flex items-center gap-1 hover:text-foreground transition-colors" },
                                    react_1.default.createElement(lucide_react_1.ThumbsDown, { className: "h-3 w-3" }),
                                    comment.dislikes),
                                canReply && (react_1.default.createElement("button", { onClick: () => setReplyToComment(comment.id), className: "flex items-center gap-1 hover:text-foreground transition-colors" },
                                    react_1.default.createElement(lucide_react_1.Reply, { className: "h-3 w-3" }),
                                    t('blog.comment.reply')))))))),
            replyToComment === comment.id && (react_1.default.createElement(card_1.Card, { className: "mt-3 ml-8" },
                react_1.default.createElement(card_1.CardContent, { className: "pt-4" },
                    react_1.default.createElement("form", { onSubmit: handleCommentSubmit, className: "space-y-3" },
                        react_1.default.createElement(textarea_1.Textarea, { placeholder: t('blog.comment.replyPlaceholder'), value: commentForm.content, onChange: (e) => setCommentForm(prev => ({ ...prev, content: e.target.value })), className: "min-h-[80px]" }),
                        react_1.default.createElement("div", { className: "flex gap-2" },
                            react_1.default.createElement(button_1.Button, { type: "submit", size: "sm" }, t('blog.comment.submitReply')),
                            react_1.default.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: () => setReplyToComment(null) }, t('common.cancel'))))))),
            comment.replies && comment.replies.length > 0 && (react_1.default.createElement("div", { className: "mt-2" }, comment.replies.map(reply => renderComment(reply, level + 1))))));
    };
    if (state.loading) {
        return (react_1.default.createElement("div", { className: "flex items-center justify-center py-12" },
            react_1.default.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" })));
    }
    if (state.error || !post) {
        return (react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                react_1.default.createElement("div", { className: "text-center py-8" },
                    react_1.default.createElement("h3", { className: "text-lg font-semibold mb-2" }, t('blog.post.notFound')),
                    react_1.default.createElement("p", { className: "text-muted-foreground mb-4" }, state.error || t('blog.post.notFoundDescription')),
                    react_1.default.createElement(link_1.default, { href: "/blog" },
                        react_1.default.createElement(button_1.Button, null, t('blog.post.backToBlog')))))));
    }
    return (react_1.default.createElement("article", { className: "max-w-4xl mx-auto space-y-8" },
        react_1.default.createElement("div", { className: "space-y-4" },
            react_1.default.createElement("div", { className: "flex items-center gap-2 text-sm text-muted-foreground" },
                react_1.default.createElement(link_1.default, { href: "/blog", className: "hover:text-foreground transition-colors" }, t('blog.title')),
                react_1.default.createElement("span", null, "/"),
                react_1.default.createElement(badge_1.Badge, { variant: "secondary", style: { backgroundColor: post.category.color + '20', color: post.category.color } }, post.category.name)),
            react_1.default.createElement("h1", { className: "text-4xl font-bold leading-tight" }, post.title),
            react_1.default.createElement("p", { className: "text-xl text-muted-foreground leading-relaxed" }, post.excerpt),
            react_1.default.createElement("div", { className: "flex items-center justify-between" },
                react_1.default.createElement("div", { className: "flex items-center gap-4" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                        react_1.default.createElement(avatar_1.Avatar, { className: "h-10 w-10" },
                            react_1.default.createElement(avatar_1.AvatarImage, { src: post.author.avatar }),
                            react_1.default.createElement(avatar_1.AvatarFallback, null, post.author.name.charAt(0).toUpperCase())),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("p", { className: "font-medium" }, post.author.name),
                            react_1.default.createElement("p", { className: "text-sm text-muted-foreground" }, (0, date_fns_1.format)(new Date(post.publishedAt || post.createdAt), 'MMMM dd, yyyy')))),
                    react_1.default.createElement(separator_1.Separator, { orientation: "vertical", className: "h-8" }),
                    react_1.default.createElement("div", { className: "flex items-center gap-4 text-sm text-muted-foreground" },
                        react_1.default.createElement("span", { className: "flex items-center gap-1" },
                            react_1.default.createElement(lucide_react_1.Eye, { className: "h-4 w-4" }),
                            post.views),
                        react_1.default.createElement("span", { className: "flex items-center gap-1" },
                            react_1.default.createElement(lucide_react_1.MessageCircle, { className: "h-4 w-4" }),
                            post.comments.length))),
                react_1.default.createElement("div", { className: "flex items-center gap-2" },
                    react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: handleLike, className: isLiked ? 'text-red-500 border-red-200' : '' },
                        react_1.default.createElement(lucide_react_1.Heart, { className: `h-4 w-4 ${isLiked ? 'fill-current' : ''}` }),
                        post.likes),
                    react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: handleBookmark },
                        react_1.default.createElement(lucide_react_1.Bookmark, { className: `h-4 w-4 ${isBookmarked ? 'fill-current' : ''}` })),
                    react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: handleShare },
                        react_1.default.createElement(lucide_react_1.Share2, { className: "h-4 w-4" }))))),
        post.featuredImage && (react_1.default.createElement("div", { className: "relative h-96 w-full rounded-lg overflow-hidden" },
            react_1.default.createElement(image_1.default, { src: post.featuredImage, alt: post.title, fill: true, className: "object-cover" }))),
        react_1.default.createElement("div", { className: "prose prose-lg max-w-none dark:prose-invert" },
            react_1.default.createElement("div", { dangerouslySetInnerHTML: { __html: post.content } })),
        post.tags.length > 0 && (react_1.default.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
            react_1.default.createElement("span", { className: "text-sm font-medium" },
                t('blog.post.tags'),
                ":"),
            post.tags.map(tag => (react_1.default.createElement(badge_1.Badge, { key: tag, variant: "outline" },
                "#",
                tag))))),
        react_1.default.createElement(separator_1.Separator, null),
        react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                react_1.default.createElement("div", { className: "flex items-start gap-4" },
                    react_1.default.createElement(avatar_1.Avatar, { className: "h-16 w-16" },
                        react_1.default.createElement(avatar_1.AvatarImage, { src: post.author.avatar }),
                        react_1.default.createElement(avatar_1.AvatarFallback, { className: "text-lg" }, post.author.name.charAt(0).toUpperCase())),
                    react_1.default.createElement("div", { className: "flex-1" },
                        react_1.default.createElement("h3", { className: "font-semibold text-lg" }, post.author.name),
                        post.author.bio && (react_1.default.createElement("p", { className: "text-muted-foreground mt-1" }, post.author.bio)),
                        react_1.default.createElement("div", { className: "flex items-center gap-4 mt-3 text-sm text-muted-foreground" },
                            react_1.default.createElement("span", null, t('blog.author.posts', { count: post.author.postCount || 0 })),
                            post.author.website && (react_1.default.createElement(link_1.default, { href: post.author.website, target: "_blank", className: "hover:text-foreground transition-colors" }, t('blog.author.website')))))))),
        react_1.default.createElement("div", { className: "space-y-6" },
            react_1.default.createElement("div", { className: "flex items-center justify-between" },
                react_1.default.createElement("h2", { className: "text-2xl font-bold" },
                    t('blog.comments.title'),
                    " (",
                    post.comments.length,
                    ")"),
                react_1.default.createElement(button_1.Button, { onClick: () => setShowCommentForm(!showCommentForm), variant: "outline" },
                    react_1.default.createElement(lucide_react_1.MessageCircle, { className: "h-4 w-4 mr-2" }),
                    t('blog.comments.add'))),
            showCommentForm && (react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, null,
                    react_1.default.createElement(card_1.CardTitle, null, t('blog.comments.writeComment'))),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("form", { onSubmit: handleCommentSubmit, className: "space-y-4" },
                        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                            react_1.default.createElement(input_1.Input, { placeholder: t('blog.comments.name'), value: commentForm.author.name, onChange: (e) => setCommentForm(prev => ({
                                    ...prev,
                                    author: { ...prev.author, name: e.target.value }
                                })), required: true }),
                            react_1.default.createElement(input_1.Input, { type: "email", placeholder: t('blog.comments.email'), value: commentForm.author.email, onChange: (e) => setCommentForm(prev => ({
                                    ...prev,
                                    author: { ...prev.author, email: e.target.value }
                                })), required: true })),
                        react_1.default.createElement(textarea_1.Textarea, { placeholder: t('blog.comments.message'), value: commentForm.content, onChange: (e) => setCommentForm(prev => ({ ...prev, content: e.target.value })), className: "min-h-[120px]", required: true }),
                        react_1.default.createElement("div", { className: "flex gap-2" },
                            react_1.default.createElement(button_1.Button, { type: "submit" }, t('blog.comments.submit')),
                            react_1.default.createElement(button_1.Button, { type: "button", variant: "outline", onClick: () => setShowCommentForm(false) }, t('common.cancel'))))))),
            post.comments.length === 0 ? (react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                    react_1.default.createElement("div", { className: "text-center py-8" },
                        react_1.default.createElement(lucide_react_1.MessageCircle, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
                        react_1.default.createElement("h3", { className: "text-lg font-semibold mb-2" }, t('blog.comments.empty.title')),
                        react_1.default.createElement("p", { className: "text-muted-foreground" }, t('blog.comments.empty.description')))))) : (react_1.default.createElement("div", { className: "space-y-4" }, post.comments
                .filter(comment => !comment.parentId)
                .map(comment => renderComment(comment)))))));
}
