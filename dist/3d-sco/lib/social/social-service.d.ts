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
export declare class SocialService {
    private static instance;
    private platforms;
    private posts;
    private schedules;
    static getInstance(): SocialService;
    getPlatforms(): Promise<SocialPlatform[]>;
    connectPlatform(platformId: string, credentials: any): Promise<boolean>;
    disconnectPlatform(platformId: string): Promise<boolean>;
    syncPlatform(platformId: string): Promise<boolean>;
    getPosts(filters?: {
        platform?: string;
        status?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<SocialPost[]>;
    createPost(postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'engagement'>): Promise<SocialPost>;
    updatePost(postId: string, updates: Partial<SocialPost>): Promise<SocialPost>;
    deletePost(postId: string): Promise<boolean>;
    publishPost(postId: string): Promise<boolean>;
    schedulePost(scheduleData: Omit<SocialSchedule, 'id' | 'createdAt'>): Promise<SocialSchedule>;
    getScheduledPosts(): Promise<SocialSchedule[]>;
    cancelScheduledPost(scheduleId: string): Promise<boolean>;
    getAnalytics(platform: string, period: 'day' | 'week' | 'month' | 'year'): Promise<SocialAnalytics>;
    getCrossPlatformAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<{
        totalFollowers: number;
        totalPosts: number;
        totalEngagement: number;
        platformBreakdown: {
            platform: string;
            followers: number;
            engagement: number;
        }[];
    }>;
}
export declare const socialService: SocialService;
//# sourceMappingURL=social-service.d.ts.map