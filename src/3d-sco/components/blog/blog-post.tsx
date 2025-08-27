'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost, BlogComment } from '@/lib/blog/blog-service';
import { useBlog } from './blog-provider';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Eye, 
  Heart, 
  MessageCircle, 
  User, 
  Share2, 
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPostProps {
  slug: string;
}

interface CommentFormData {
  content: string;
  author: {
    name: string;
    email: string;
  };
  parentId?: string;
}

export function BlogPost({ slug }: BlogPostProps) {
  const { t } = useTranslation();
  const { state, loadPost, incrementViews, toggleLike, addComment, loadComments } = useBlog();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [commentForm, setCommentForm] = useState<CommentFormData>({
    content: '',
    author: { name: '', email: '' }
  });

  const post = state.currentPost;

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug, loadPost]);

  useEffect(() => {
    if (post) {
      // Increment view count after a short delay
      const timer = setTimeout(() => {
        incrementViews(post.id);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [post, incrementViews]);

  const handleLike = async () => {
    if (!post) return;
    
    try {
      await toggleLike(post.id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark functionality
  };

  const handleShare = async () => {
    if (!post) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentForm.content.trim()) return;

    try {
      await addComment(post.id, {
        content: commentForm.content,
        author: commentForm.author,
        parentId: replyToComment || undefined,
      });
      
      setCommentForm({ content: '', author: { name: '', email: '' } });
      setReplyToComment(null);
      setShowCommentForm(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const renderComment = (comment: BlogComment, level = 0) => {
    const maxLevel = 3;
    const canReply = level < maxLevel;
    
    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 mt-4' : 'mt-6'}`}>
        <Card className="">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback>
                  {comment.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                  {comment.status === 'approved' && (
                    <Badge variant="secondary" className="text-xs">
                      {t('blog.comment.approved')}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm leading-relaxed">{comment.content}</p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ThumbsUp className="h-3 w-3" />
                    {comment.likes}
                  </button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ThumbsDown className="h-3 w-3" />
                    {comment.dislikes}
                  </button>
                  {canReply && (
                    <button 
                      onClick={() => setReplyToComment(comment.id)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <Reply className="h-3 w-3" />
                      {t('blog.comment.reply')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Reply Form */}
        {replyToComment === comment.id && (
          <Card className="mt-3 ml-8">
            <CardContent className="pt-4">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Textarea
                  placeholder={t('blog.comment.replyPlaceholder')}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    {t('blog.comment.submitReply')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReplyToComment(null)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (state.error || !post) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">{t('blog.post.notFound')}</h3>
            <p className="text-muted-foreground mb-4">{state.error || t('blog.post.notFoundDescription')}</p>
            <Link href="/blog">
              <Button>{t('blog.post.backToBlog')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground transition-colors">
            {t('blog.title')}
          </Link>
          <span>/</span>
          <Badge 
            variant="secondary" 
            style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
          >
            {post.category.name}
          </Badge>
        </div>
        
        <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
        
        <p className="text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>
                  {post.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(post.publishedAt || post.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.comments.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={isLiked ? 'text-red-500 border-red-200' : ''}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {post.likes}
            </Button>
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative h-96 w-full rounded-lg overflow-hidden">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{t('blog.post.tags')}:</span>
          {post.tags.map(tag => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Author Bio */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-lg">
                {post.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{post.author.name}</h3>
              {post.author.bio && (
                <p className="text-muted-foreground mt-1">{post.author.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{t('blog.author.posts', { count: post.author.postCount || 0 })}</span>
                {post.author.website && (
                  <Link 
                    href={post.author.website} 
                    target="_blank" 
                    className="hover:text-foreground transition-colors"
                  >
                    {t('blog.author.website')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {t('blog.comments.title')} ({post.comments.length})
          </h2>
          <Button 
            onClick={() => setShowCommentForm(!showCommentForm)}
            variant="outline"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('blog.comments.add')}
          </Button>
        </div>

        {/* Comment Form */}
        {showCommentForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t('blog.comments.writeComment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder={t('blog.comments.name')}
                    value={commentForm.author.name}
                    onChange={(e) => setCommentForm(prev => ({
                      ...prev,
                      author: { ...prev.author, name: e.target.value }
                    }))}
                    required
                  />
                  <Input
                    type="email"
                    placeholder={t('blog.comments.email')}
                    value={commentForm.author.email}
                    onChange={(e) => setCommentForm(prev => ({
                      ...prev,
                      author: { ...prev.author, email: e.target.value }
                    }))}
                    required
                  />
                </div>
                <Textarea
                  placeholder={t('blog.comments.message')}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[120px]"
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit">
                    {t('blog.comments.submit')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowCommentForm(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {post.comments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('blog.comments.empty.title')}</h3>
                <p className="text-muted-foreground">{t('blog.comments.empty.description')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {post.comments
              .filter(comment => !comment.parentId)
              .map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </article>
  );
}