/**
 * NEXUS IDE Security Dashboard - Utility Functions
 * Enterprise-grade utilities for dashboard functionality
 */

class SecurityUtils {
    /**
     * Format bytes to human readable format
     * @param {number} bytes - Number of bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted string
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format duration in milliseconds to human readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    static formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    }

    /**
     * Format timestamp to relative time
     * @param {Date|string|number} timestamp - Timestamp to format
     * @returns {string} Relative time string
     */
    static formatRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    static formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    /**
     * Generate secure random string
     * @param {number} length - Length of string
     * @returns {string} Random string
     */
    static generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate IP address
     * @param {string} ip - IP address to validate
     * @returns {boolean} Is valid IP
     */
    static isValidIP(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }

    /**
     * Sanitize HTML string
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Get threat level color
     * @param {string} level - Threat level
     * @returns {string} CSS color class
     */
    static getThreatLevelColor(level) {
        const colors = {
            'low': 'threat-low',
            'medium': 'threat-medium',
            'high': 'threat-high',
            'critical': 'threat-critical'
        };
        return colors[level?.toLowerCase()] || 'threat-low';
    }

    /**
     * Get status color
     * @param {string} status - Status
     * @returns {string} CSS color class
     */
    static getStatusColor(status) {
        const colors = {
            'operational': 'status-operational',
            'warning': 'status-warning',
            'critical': 'status-critical',
            'unknown': 'status-unknown',
            'healthy': 'status-operational',
            'unhealthy': 'status-critical',
            'degraded': 'status-warning'
        };
        return colors[status?.toLowerCase()] || 'status-unknown';
    }

    /**
     * Calculate percentage
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage
     */
    static calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    /**
     * Generate chart colors
     * @param {number} count - Number of colors needed
     * @returns {Array} Array of colors
     */
    static generateChartColors(count) {
        const baseColors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
            '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        
        return colors;
    }
}

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        this.container = document.querySelector('.notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, danger, warning, info)
     * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
     * @returns {string} Notification ID
     */
    show(message, type = 'info', duration = 5000) {
        const id = SecurityUtils.generateRandomString(8);
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.set(id, { element: notification, timer: null });
        
        // Trigger show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-hide if duration is set
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.hide(id);
            }, duration);
            this.notifications.get(id).timer = timer;
        }
        
        return id;
    }

    /**
     * Hide notification
     * @param {string} id - Notification ID
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Clear timer if exists
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // Trigger hide animation
        notification.element.classList.add('hide');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Create notification element
     * @param {string} id - Notification ID
     * @param {string} message - Message
     * @param {string} type - Type
     * @returns {HTMLElement} Notification element
     */
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.dataset.id = id;
        
        const icons = {
            success: 'fas fa-check-circle',
            danger: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <span>${SecurityUtils.sanitizeHTML(message)}</span>
            </div>
            <button class="notification-close" onclick="window.notificationManager.hide('${id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return notification;
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    // Convenience methods
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 8000) {
        return this.show(message, 'danger', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
    }

    /**
     * Show loading state for element
     * @param {string|HTMLElement} target - Target element or selector
     * @param {string} message - Loading message
     */
    show(target, message = 'Loading...') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;
        
        const loadingId = SecurityUtils.generateRandomString(8);
        const overlay = this.createLoadingOverlay(message);
        
        element.style.position = 'relative';
        element.appendChild(overlay);
        
        this.loadingStates.set(element, { overlay, id: loadingId });
        
        return loadingId;
    }

    /**
     * Hide loading state for element
     * @param {string|HTMLElement} target - Target element or selector
     */
    hide(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;
        
        const loadingState = this.loadingStates.get(element);
        if (loadingState && loadingState.overlay.parentNode) {
            loadingState.overlay.parentNode.removeChild(loadingState.overlay);
            this.loadingStates.delete(element);
        }
    }

    /**
     * Create loading overlay
     * @param {string} message - Loading message
     * @returns {HTMLElement} Loading overlay
     */
    createLoadingOverlay(message) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${SecurityUtils.sanitizeHTML(message)}</div>
            </div>
        `;
        return overlay;
    }
}

class APIClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }

    /**
     * Make HTTP request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // HTTP method shortcuts
    get(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin + this.baseURL);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        return this.request(url.pathname + url.search, { method: 'GET' });
    }

    post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {...any} args - Event arguments
     */
    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        });
    }

    /**
     * Add one-time event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
}

// Initialize global instances
window.SecurityUtils = SecurityUtils;
window.notificationManager = new NotificationManager();
window.loadingManager = new LoadingManager();
window.apiClient = new APIClient();
window.eventBus = new EventEmitter();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SecurityUtils,
        NotificationManager,
        LoadingManager,
        APIClient,
        EventEmitter
    };
}