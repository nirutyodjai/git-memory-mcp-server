'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Send,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { socialService, SocialPost, SocialPlatform } from '@/lib/social/social-service';
import { useTranslation } from '@/lib/i18n/use-translation';

interface PostFormData {
  content: string;
  platform: string;
  images: string[];
  scheduledAt?: Date;
}

export function SocialPosts() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; post?: SocialPost }>({ open: false });
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    platform: '',
    images: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({
    platform: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsData, platformsData] = await Promise.all([
        socialService.getPosts({
          platform: filter.platform !== 'all' ? filter.platform : undefined,
          status: filter.status !== 'all' ? filter.status : undefined,
        }),
        socialService.getPlatforms(),
      ]);
      setPosts(postsData);
      setPlatforms(platformsData.filter(p => p.isConnected));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!formData.content || !formData.platform) return;

    try {
      setSubmitting(true);
      await socialService.createPost({
        content: formData.content,
        platform: formData.platform,
        images: formData.images,
        scheduledAt: formData.scheduledAt,
        status: formData.scheduledAt ? 'scheduled' : 'draft',
      });
      await loadData();
      setCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editDialog.post || !formData.content) return;

    try {
      setSubmitting(true);
      await socialService.updatePost(editDialog.post.id, {
        content: formData.content,
        images: formData.images,
        scheduledAt: formData.scheduledAt,
      });
      await loadData();
      setEditDialog({ open: false });
      resetForm();
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await socialService.deletePost(postId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      await socialService.publishPost(postId);
      await loadData();
    } catch (error) {
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

  const openEditDialog = (post: SocialPost) => {
    setFormData({
      content: post.content,
      platform: post.platform,
      images: post.images || [],
      scheduledAt: post.scheduledAt,
    });
    setEditDialog({ open: true, post });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || platformId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('social.posts.title')}</h2>
          <p className="text-muted-foreground">
            {t('social.posts.description')}
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('social.posts.create')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filter.platform} onValueChange={(value) => setFilter(prev => ({ ...prev, platform: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('social.selectPlatform')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('social.selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="draft">{t('social.status.draft')}</SelectItem>
            <SelectItem value="scheduled">{t('social.status.scheduled')}</SelectItem>
            <SelectItem value="published">{t('social.status.published')}</SelectItem>
            <SelectItem value="failed">{t('social.status.failed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getPlatformName(post.platform)}</Badge>
                  <Badge className={getStatusColor(post.status)}>
                    {getStatusIcon(post.status)}
                    <span className="ml-1">{t(`social.status.${post.status}`)}</span>
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(post)}>
                      <Edit className="w-4 h-4 mr-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    {post.status === 'draft' && (
                      <DropdownMenuItem onClick={() => handlePublishPost(post.id)}>
                        <Send className="w-4 h-4 mr-2" />
                        {t('social.publish')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm line-clamp-3">{post.content}</p>

              {post.images && post.images.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>{post.images.length} {t('social.images')}</span>
                </div>
              )}

              {post.scheduledAt && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.scheduledAt).toLocaleString()}</span>
                </div>
              )}

              {post.status === 'published' && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>{post.engagement.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share2 className="w-4 h-4 text-blue-500" />
                    <span>{post.engagement.shares}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span>{post.engagement.comments}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <span>{post.engagement.reach}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                {t('common.created')}: {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('social.posts.empty')}</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialog || editDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialog(false);
            setEditDialog({ open: false });
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editDialog.open ? t('social.posts.edit') : t('social.posts.create')}
            </DialogTitle>
            <DialogDescription>
              {t('social.posts.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">{t('social.platform')}</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                disabled={editDialog.open}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('social.selectPlatform')} />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t('social.content')}</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('social.contentPlaceholder')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">{t('social.scheduleAt')} ({t('common.optional')})</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt ? new Date(formData.scheduledAt.getTime() - formData.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scheduledAt: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialog(false);
                setEditDialog({ open: false });
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={editDialog.open ? handleUpdatePost : handleCreatePost}
              disabled={submitting || !formData.content || !formData.platform}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {editDialog.open ? t('common.update') : t('social.posts.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}