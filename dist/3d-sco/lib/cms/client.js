"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsClient = exports.CMSClient = void 0;
exports.useCMSClient = useCMSClient;
exports.formatFileSize = formatFileSize;
exports.getMediaTypeIcon = getMediaTypeIcon;
exports.isImageType = isImageType;
exports.isVideoType = isVideoType;
exports.generateSlug = generateSlug;
exports.truncateText = truncateText;
exports.stripHtml = stripHtml;
exports.getExcerpt = getExcerpt;
// API Client Class
class CMSClient {
    constructor(baseUrl = '/api/cms') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
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
    buildQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        return searchParams.toString();
    }
    // Content methods
    async getContent(query = {}) {
        const queryString = this.buildQueryString(query);
        const endpoint = `/content${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    async getContentById(id) {
        const response = await this.getContent();
        const content = response.content.find(item => item.id === id);
        if (!content) {
            throw new Error('Content not found');
        }
        return content;
    }
    async getContentBySlug(slug, locale) {
        const response = await this.getContent({ locale });
        const content = response.content.find(item => item.slug === slug);
        if (!content) {
            throw new Error('Content not found');
        }
        return content;
    }
    async createContent(data) {
        const response = await this.request('/content', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.content;
    }
    async updateContent(id, data) {
        const response = await this.request('/content', {
            method: 'PUT',
            body: JSON.stringify({ ...data, id }),
        });
        return response.content;
    }
    async deleteContent(id) {
        await this.request(`/content?id=${id}`, {
            method: 'DELETE',
        });
    }
    // Category methods
    async getCategories(query = {}) {
        const queryString = this.buildQueryString(query);
        const endpoint = `/categories${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    async getCategoryById(id) {
        const response = await this.getCategories();
        const category = response.categories.find(item => item.id === id);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }
    async createCategory(data) {
        const response = await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.category;
    }
    async updateCategory(id, data) {
        const response = await this.request('/categories', {
            method: 'PUT',
            body: JSON.stringify({ ...data, id }),
        });
        return response.category;
    }
    async deleteCategory(id, force = false) {
        await this.request(`/categories?id=${id}&force=${force}`, {
            method: 'DELETE',
        });
    }
    // Media methods
    async getMedia(query = {}) {
        const queryString = this.buildQueryString(query);
        const endpoint = `/media${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    async getMediaById(id) {
        const response = await this.getMedia();
        const media = response.media.find(item => item.id === id);
        if (!media) {
            throw new Error('Media not found');
        }
        return media;
    }
    async uploadMedia(file, metadata) {
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
    async updateMedia(id, data) {
        const response = await this.request('/media', {
            method: 'PUT',
            body: JSON.stringify({ ...data, id }),
        });
        return response.media;
    }
    async deleteMedia(id) {
        await this.request(`/media?id=${id}`, {
            method: 'DELETE',
        });
    }
    // Utility methods
    async searchContent(query, options = {}) {
        return this.getContent({ ...options, search: query });
    }
    async getPublishedContent(options = {}) {
        return this.getContent({ ...options, status: 'published' });
    }
    async getContentByType(type, options = {}) {
        return this.getContent({ ...options, type });
    }
    async getContentByCategory(category, options = {}) {
        return this.getContent({ ...options, category });
    }
    async getActiveCategories(locale) {
        return this.getCategories({ locale, isActive: true });
    }
    async getCategoryTree(locale) {
        return this.getCategories({ locale, includeChildren: true });
    }
    async getPublicMedia(options = {}) {
        return this.getMedia({ ...options, isPublic: true });
    }
    async getMediaByType(type, options = {}) {
        return this.getMedia({ ...options, type });
    }
}
exports.CMSClient = CMSClient;
// Default client instance
exports.cmsClient = new CMSClient();
// React hooks for CMS data
function useCMSClient() {
    return exports.cmsClient;
}
// Helper functions
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function getMediaTypeIcon(type) {
    const icons = {
        image: '🖼️',
        video: '🎥',
        audio: '🎵',
        document: '📄',
        other: '📎',
    };
    return icons[type] || icons.other;
}
function isImageType(mimeType) {
    return mimeType.startsWith('image/');
}
function isVideoType(mimeType) {
    return mimeType.startsWith('video/');
}
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
}
function getExcerpt(content, maxLength = 160) {
    const plainText = stripHtml(content);
    return truncateText(plainText, maxLength);
}
//# sourceMappingURL=client.js.map