'use client';

import { z } from 'zod';

// Types
export interface Content {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  type: 'page' | 'post' | 'project' | 'skill';
  category?: string;
  tags: string[];
  featuredImage?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    ogImage?: string;
  };
  publishedAt?: string;
  locale: 'th' | 'en' | 'zh' | 'ja';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  locale: 'th' | 'en' | 'zh' | 'ja';
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  description?: string;
  tags: string[];
  category?: string;
  isPublic: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ContentResponse {
  content: Content[];
  pagination: PaginationInfo;
  filters: {
    status?: string;
    type?: string;
    category?: string;
    locale?: string;
    search?: string;
  };
}

export interface CategoryResponse {
  categories: Category[];
  total: number;
}

export interface MediaResponse {
  media: Media[];
  pagination: PaginationInfo;
  stats: {
    totalFiles: number;
    totalSize: number;
    typeStats: Record<string, number>;
  };
  filters: {
    type?: string;
    category?: string;
    isPublic?: boolean;
    search?: string;
  };
}

// Query parameters
export interface ContentQuery {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published' | 'archived';
  type?: 'page' | 'post' | 'project' | 'skill';
  category?: string;
  search?: string;
  locale?: 'th' | 'en' | 'zh' | 'ja';
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryQuery {
  locale?: 'th' | 'en' | 'zh' | 'ja';
  parentId?: string;
  isActive?: boolean;
  includeChildren?: boolean;
}

export interface MediaQuery {
  page?: number;
  limit?: number;
  type?: 'image' | 'video' | 'audio' | 'document' | 'other';
  category?: string;
  search?: string;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

// API Client Class
export class CMSClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = '/api/cms') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  // Content methods
  async getContent(query: ContentQuery = {}): Promise<ContentResponse> {
    const queryString = this.buildQueryString(query);
    const endpoint = `/content${queryString ? `?${queryString}` : ''}`;
    return this.request<ContentResponse>(endpoint);
  }

  async getContentById(id: string): Promise<Content> {
    const response = await this.getContent();
    const content = response.content.find(item => item.id === id);
    if (!content) {
      throw new Error('Content not found');
    }
    return content;
  }

  async getContentBySlug(slug: string, locale?: string): Promise<Content> {
    const response = await this.getContent({ locale });
    const content = response.content.find(item => item.slug === slug);
    if (!content) {
      throw new Error('Content not found');
    }
    return content;
  }

  async createContent(data: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<Content> {
    const response = await this.request<{ content: Content }>('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.content;
  }

  async updateContent(id: string, data: Partial<Content>): Promise<Content> {
    const response = await this.request<{ content: Content }>('/content', {
      method: 'PUT',
      body: JSON.stringify({ ...data, id }),
    });
    return response.content;
  }

  async deleteContent(id: string): Promise<void> {
    await this.request(`/content?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Category methods
  async getCategories(query: CategoryQuery = {}): Promise<CategoryResponse> {
    const queryString = this.buildQueryString(query);
    const endpoint = `/categories${queryString ? `?${queryString}` : ''}`;
    return this.request<CategoryResponse>(endpoint);
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await this.getCategories();
    const category = response.categories.find(item => item.id === id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'children'>): Promise<Category> {
    const response = await this.request<{ category: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.category;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await this.request<{ category: Category }>('/categories', {
      method: 'PUT',
      body: JSON.stringify({ ...data, id }),
    });
    return response.category;
  }

  async deleteCategory(id: string, force: boolean = false): Promise<void> {
    await this.request(`/categories?id=${id}&force=${force}`, {
      method: 'DELETE',
    });
  }

  // Media methods
  async getMedia(query: MediaQuery = {}): Promise<MediaResponse> {
    const queryString = this.buildQueryString(query);
    const endpoint = `/media${queryString ? `?${queryString}` : ''}`;
    return this.request<MediaResponse>(endpoint);
  }

  async getMediaById(id: string): Promise<Media> {
    const response = await this.getMedia();
    const media = response.media.find(item => item.id === id);
    if (!media) {
      throw new Error('Media not found');
    }
    return media;
  }

  async uploadMedia(
    file: File,
    metadata?: Partial<Omit<Media, 'id' | 'name' | 'originalName' | 'url' | 'type' | 'mimeType' | 'size' | 'uploadedBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(`${this.baseUrl}/media`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.media;
  }

  async updateMedia(id: string, data: Partial<Media>): Promise<Media> {
    const response = await this.request<{ media: Media }>('/media', {
      method: 'PUT',
      body: JSON.stringify({ ...data, id }),
    });
    return response.media;
  }

  async deleteMedia(id: string): Promise<void> {
    await this.request(`/media?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  async searchContent(query: string, options: Partial<ContentQuery> = {}): Promise<ContentResponse> {
    return this.getContent({ ...options, search: query });
  }

  async getPublishedContent(options: Partial<ContentQuery> = {}): Promise<ContentResponse> {
    return this.getContent({ ...options, status: 'published' });
  }

  async getContentByType(type: Content['type'], options: Partial<ContentQuery> = {}): Promise<ContentResponse> {
    return this.getContent({ ...options, type });
  }

  async getContentByCategory(category: string, options: Partial<ContentQuery> = {}): Promise<ContentResponse> {
    return this.getContent({ ...options, category });
  }

  async getActiveCategories(locale?: string): Promise<CategoryResponse> {
    return this.getCategories({ locale, isActive: true });
  }

  async getCategoryTree(locale?: string): Promise<CategoryResponse> {
    return this.getCategories({ locale, includeChildren: true });
  }

  async getPublicMedia(options: Partial<MediaQuery> = {}): Promise<MediaResponse> {
    return this.getMedia({ ...options, isPublic: true });
  }

  async getMediaByType(type: Media['type'], options: Partial<MediaQuery> = {}): Promise<MediaResponse> {
    return this.getMedia({ ...options, type });
  }
}

// Default client instance
export const cmsClient = new CMSClient();

// React hooks for CMS data
export function useCMSClient() {
  return cmsClient;
}

// Helper functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getMediaTypeIcon(type: Media['type']): string {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    other: '📎',
  };
  return icons[type] || icons.other;
}

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function getExcerpt(content: string, maxLength: number = 160): string {
  const plainText = stripHtml(content);
  return truncateText(plainText, maxLength);
}