export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  username?: string;
  followers?: number;
  lastSync?: Date;
}

export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  images?: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAnalytics {
  platform: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    followers: number;
    followersGrowth: number;
    posts: number;
    engagement: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  };
  topPosts: SocialPost[];
}

export interface SocialSchedule {
  id: string;
  platforms: string[];
  content: string;
  images?: string[];
  scheduledAt: Date;
  status: 'pending' | 'published' | 'failed';
  createdAt: Date;
}

export class SocialService {
  private static instance: SocialService;
  private platforms: SocialPlatform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      isConnected: false,
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: 'twitter',
      color: '#000000',
      isConnected: false,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      isConnected: false,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0A66C2',
      isConnected: false,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'youtube',
      color: '#FF0000',
      isConnected: false,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'tiktok',
      color: '#000000',
      isConnected: false,
    },
  ];

  private posts: SocialPost[] = [];
  private schedules: SocialSchedule[] = [];

  public static getInstance(): SocialService {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  // Platform Management
  async getPlatforms(): Promise<SocialPlatform[]> {
    return this.platforms;
  }

  async connectPlatform(platformId: string, credentials: any): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) throw new Error('Platform not found');

    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    platform.isConnected = true;
    platform.username = credentials.username || `user_${platformId}`;
    platform.followers = Math.floor(Math.random() * 10000) + 1000;
    platform.lastSync = new Date();

    return true;
  }

  async disconnectPlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) throw new Error('Platform not found');

    platform.isConnected = false;
    platform.username = undefined;
    platform.followers = undefined;
    platform.lastSync = undefined;

    return true;
  }

  async syncPlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform || !platform.isConnected) {
      throw new Error('Platform not connected');
    }

    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));

    platform.lastSync = new Date();
    platform.followers = (platform.followers || 0) + Math.floor(Math.random() * 100);

    return true;
  }

  // Post Management
  async getPosts(filters?: {
    platform?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<SocialPost[]> {
    let filteredPosts = [...this.posts];

    if (filters?.platform) {
      filteredPosts = filteredPosts.filter(p => p.platform === filters.platform);
    }

    if (filters?.status) {
      filteredPosts = filteredPosts.filter(p => p.status === filters.status);
    }

    if (filters?.dateFrom) {
      filteredPosts = filteredPosts.filter(p => p.createdAt >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      filteredPosts = filteredPosts.filter(p => p.createdAt <= filters.dateTo!);
    }

    return filteredPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPost(postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'engagement'>): Promise<SocialPost> {
    const post: SocialPost = {
      ...postData,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        reach: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.posts.push(post);
    return post;
  }

  async updatePost(postId: string, updates: Partial<SocialPost>): Promise<SocialPost> {
    const postIndex = this.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) throw new Error('Post not found');

    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return this.posts[postIndex];
  }

  async deletePost(postId: string): Promise<boolean> {
    const postIndex = this.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) throw new Error('Post not found');

    this.posts.splice(postIndex, 1);
    return true;
  }

  async publishPost(postId: string): Promise<boolean> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    // Simulate publishing
    await new Promise(resolve => setTimeout(resolve, 1000));

    post.status = 'published';
    post.publishedAt = new Date();
    post.updatedAt = new Date();

    // Simulate engagement
    setTimeout(() => {
      post.engagement = {
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 25),
        reach: Math.floor(Math.random() * 1000) + 100,
      };
    }, 5000);

    return true;
  }

  // Scheduling
  async schedulePost(scheduleData: Omit<SocialSchedule, 'id' | 'createdAt'>): Promise<SocialSchedule> {
    const schedule: SocialSchedule = {
      ...scheduleData,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.schedules.push(schedule);
    return schedule;
  }

  async getScheduledPosts(): Promise<SocialSchedule[]> {
    return this.schedules.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async cancelScheduledPost(scheduleId: string): Promise<boolean> {
    const scheduleIndex = this.schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) throw new Error('Scheduled post not found');

    this.schedules.splice(scheduleIndex, 1);
    return true;
  }

  // Analytics
  async getAnalytics(platform: string, period: 'day' | 'week' | 'month' | 'year'): Promise<SocialAnalytics> {
    const platformPosts = this.posts.filter(p => p.platform === platform && p.status === 'published');
    
    const totalEngagement = platformPosts.reduce((sum, post) => 
      sum + post.engagement.likes + post.engagement.shares + post.engagement.comments, 0
    );

    const totalReach = platformPosts.reduce((sum, post) => sum + post.engagement.reach, 0);

    return {
      platform,
      period,
      metrics: {
        followers: Math.floor(Math.random() * 10000) + 1000,
        followersGrowth: Math.floor(Math.random() * 200) - 100,
        posts: platformPosts.length,
        engagement: totalEngagement,
        engagementRate: platformPosts.length > 0 ? (totalEngagement / totalReach) * 100 : 0,
        reach: totalReach,
        impressions: totalReach * (Math.random() * 2 + 1),
      },
      topPosts: platformPosts
        .sort((a, b) => {
          const aEngagement = a.engagement.likes + a.engagement.shares + a.engagement.comments;
          const bEngagement = b.engagement.likes + b.engagement.shares + b.engagement.comments;
          return bEngagement - aEngagement;
        })
        .slice(0, 5),
    };
  }

  async getCrossPlatformAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalFollowers: number;
    totalPosts: number;
    totalEngagement: number;
    platformBreakdown: { platform: string; followers: number; engagement: number }[];
  }> {
    const connectedPlatforms = this.platforms.filter(p => p.isConnected);
    const platformBreakdown = [];
    let totalFollowers = 0;
    let totalEngagement = 0;

    for (const platform of connectedPlatforms) {
      const analytics = await this.getAnalytics(platform.id, period);
      totalFollowers += analytics.metrics.followers;
      totalEngagement += analytics.metrics.engagement;
      
      platformBreakdown.push({
        platform: platform.name,
        followers: analytics.metrics.followers,
        engagement: analytics.metrics.engagement,
      });
    }

    return {
      totalFollowers,
      totalPosts: this.posts.filter(p => p.status === 'published').length,
      totalEngagement,
      platformBreakdown,
    };
  }
}

export const socialService = SocialService.getInstance();