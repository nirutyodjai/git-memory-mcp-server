export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: BlogCategory;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  comments: BlogComment[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parentId?: string;
  postCount: number;
}

export interface BlogComment {
  id: string;
  postId: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  parentId?: string; // For nested comments
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalComments: number;
  totalCategories: number;
  popularPosts: BlogPost[];
  recentPosts: BlogPost[];
}

export interface BlogSearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  status?: BlogPost['status'];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'publishedAt' | 'views' | 'likes' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BlogSearchResult {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BlogService {
  private posts: BlogPost[] = [];
  private categories: BlogCategory[] = [];
  private comments: BlogComment[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize with some default categories
    this.categories = [
      {
        id: '1',
        name: 'Technology',
        slug: 'technology',
        description: 'Latest technology trends and insights',
        color: '#3B82F6',
        postCount: 0,
      },
      {
        id: '2',
        name: 'Design',
        slug: 'design',
        description: 'Design principles and best practices',
        color: '#8B5CF6',
        postCount: 0,
      },
      {
        id: '3',
        name: 'Business',
        slug: 'business',
        description: 'Business strategies and insights',
        color: '#10B981',
        postCount: 0,
      },
    ];
  }

  // Post management
  async getPosts(filters?: BlogSearchFilters): Promise<BlogSearchResult> {
    let filteredPosts = [...this.posts];

    // Apply filters
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      filteredPosts = filteredPosts.filter(
        post =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query)
      );
    }

    if (filters?.category) {
      filteredPosts = filteredPosts.filter(
        post => post.category.slug === filters.category
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      filteredPosts = filteredPosts.filter(post =>
        filters.tags!.some(tag => post.tags.includes(tag))
      );
    }

    if (filters?.author) {
      filteredPosts = filteredPosts.filter(
        post => post.author.id === filters.author
      );
    }

    if (filters?.status) {
      filteredPosts = filteredPosts.filter(
        post => post.status === filters.status
      );
    }

    if (filters?.dateFrom) {
      filteredPosts = filteredPosts.filter(
        post => new Date(post.createdAt) >= filters.dateFrom!
      );
    }

    if (filters?.dateTo) {
      filteredPosts = filteredPosts.filter(
        post => new Date(post.createdAt) <= filters.dateTo!
      );
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';
    
    filteredPosts.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'publishedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    return {
      posts: paginatedPosts,
      total: filteredPosts.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPosts.length / limit),
    };
  }

  async getPostById(id: string): Promise<BlogPost | null> {
    return this.posts.find(post => post.id === id) || null;
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    return this.posts.find(post => post.slug === slug) || null;
  }

  async createPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'comments'>): Promise<BlogPost> {
    const post: BlogPost = {
      ...postData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0,
      comments: [],
    };

    this.posts.push(post);
    this.updateCategoryPostCount(post.category.id);
    return post;
  }

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      throw new Error('Post not found');
    }

    const updatedPost = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.posts[postIndex] = updatedPost;
    return updatedPost;
  }

  async deletePost(id: string): Promise<void> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      throw new Error('Post not found');
    }

    const post = this.posts[postIndex];
    this.posts.splice(postIndex, 1);
    this.updateCategoryPostCount(post.category.id);
  }

  async publishPost(id: string): Promise<BlogPost> {
    return this.updatePost(id, {
      status: 'published',
      publishedAt: new Date(),
    });
  }

  async unpublishPost(id: string): Promise<BlogPost> {
    return this.updatePost(id, {
      status: 'draft',
      publishedAt: undefined,
    });
  }

  async incrementViews(id: string): Promise<void> {
    const post = await this.getPostById(id);
    if (post) {
      await this.updatePost(id, { views: post.views + 1 });
    }
  }

  async toggleLike(id: string): Promise<BlogPost> {
    const post = await this.getPostById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    return this.updatePost(id, { likes: post.likes + 1 });
  }

  // Category management
  async getCategories(): Promise<BlogCategory[]> {
    return [...this.categories];
  }

  async getCategoryById(id: string): Promise<BlogCategory | null> {
    return this.categories.find(category => category.id === id) || null;
  }

  async getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    return this.categories.find(category => category.slug === slug) || null;
  }

  async createCategory(categoryData: Omit<BlogCategory, 'id' | 'postCount'>): Promise<BlogCategory> {
    const category: BlogCategory = {
      ...categoryData,
      id: Date.now().toString(),
      postCount: 0,
    };

    this.categories.push(category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<BlogCategory>): Promise<BlogCategory> {
    const categoryIndex = this.categories.findIndex(category => category.id === id);
    if (categoryIndex === -1) {
      throw new Error('Category not found');
    }

    const updatedCategory = {
      ...this.categories[categoryIndex],
      ...updates,
    };

    this.categories[categoryIndex] = updatedCategory;
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const categoryIndex = this.categories.findIndex(category => category.id === id);
    if (categoryIndex === -1) {
      throw new Error('Category not found');
    }

    // Check if category has posts
    const postsInCategory = this.posts.filter(post => post.category.id === id);
    if (postsInCategory.length > 0) {
      throw new Error('Cannot delete category with existing posts');
    }

    this.categories.splice(categoryIndex, 1);
  }

  private updateCategoryPostCount(categoryId: string): void {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.postCount = this.posts.filter(post => post.category.id === categoryId).length;
    }
  }

  // Comment management
  async getComments(postId?: string): Promise<BlogComment[]> {
    if (postId) {
      return this.comments.filter(comment => comment.postId === postId);
    }
    return [...this.comments];
  }

  async addComment(commentData: Omit<BlogComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogComment> {
    const comment: BlogComment = {
      ...commentData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.comments.push(comment);
    
    // Update post comments
    const post = await this.getPostById(comment.postId);
    if (post) {
      post.comments.push(comment);
    }

    return comment;
  }

  async updateComment(id: string, updates: Partial<BlogComment>): Promise<BlogComment> {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const updatedComment = {
      ...this.comments[commentIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.comments[commentIndex] = updatedComment;
    return updatedComment;
  }

  async deleteComment(id: string): Promise<void> {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const comment = this.comments[commentIndex];
    this.comments.splice(commentIndex, 1);

    // Remove from post comments
    const post = await this.getPostById(comment.postId);
    if (post) {
      const postCommentIndex = post.comments.findIndex(c => c.id === id);
      if (postCommentIndex !== -1) {
        post.comments.splice(postCommentIndex, 1);
      }
    }
  }

  async approveComment(id: string): Promise<BlogComment> {
    return this.updateComment(id, { status: 'approved' });
  }

  async rejectComment(id: string): Promise<BlogComment> {
    return this.updateComment(id, { status: 'rejected' });
  }

  // Statistics
  async getBlogStats(): Promise<BlogStats> {
    const totalPosts = this.posts.length;
    const publishedPosts = this.posts.filter(post => post.status === 'published').length;
    const draftPosts = this.posts.filter(post => post.status === 'draft').length;
    const totalViews = this.posts.reduce((sum, post) => sum + post.views, 0);
    const totalComments = this.comments.length;
    const totalCategories = this.categories.length;

    // Get popular posts (top 5 by views)
    const popularPosts = [...this.posts]
      .filter(post => post.status === 'published')
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Get recent posts (top 5 by creation date)
    const recentPosts = [...this.posts]
      .filter(post => post.status === 'published')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalComments,
      totalCategories,
      popularPosts,
      recentPosts,
    };
  }

  // Utility methods
  async getAllTags(): Promise<string[]> {
    const allTags = this.posts.flatMap(post => post.tags);
    return [...new Set(allTags)].sort();
  }

  async getRelatedPosts(postId: string, limit: number = 3): Promise<BlogPost[]> {
    const post = await this.getPostById(postId);
    if (!post) {
      return [];
    }

    // Find posts with similar tags or same category
    const relatedPosts = this.posts
      .filter(p => 
        p.id !== postId && 
        p.status === 'published' && 
        (p.category.id === post.category.id || 
         p.tags.some(tag => post.tags.includes(tag)))
      )
      .sort((a, b) => {
        // Sort by number of matching tags, then by views
        const aMatchingTags = a.tags.filter(tag => post.tags.includes(tag)).length;
        const bMatchingTags = b.tags.filter(tag => post.tags.includes(tag)).length;
        
        if (aMatchingTags !== bMatchingTags) {
          return bMatchingTags - aMatchingTags;
        }
        
        return b.views - a.views;
      })
      .slice(0, limit);

    return relatedPosts;
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}