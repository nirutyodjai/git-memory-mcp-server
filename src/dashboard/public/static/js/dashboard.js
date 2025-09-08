/**
 * NEXUS IDE Security Dashboard - Main JavaScript
 * Enterprise-grade security monitoring and management interface
 */

class SecurityDashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'overview';
        this.socket = null;
        this.charts = {};
        this.refreshInterval = null;
        this.notifications = [];
        this.theme = localStorage.getItem('dashboard-theme') || 'light';
        
        this.init();
    }

    async init() {
        try {
            // Apply theme
            this.applyTheme();
            
            // Check authentication
            await this.checkAuth();
            
            // Initialize components
            this.initializeEventListeners();
            this.initializeWebSocket();
            this.initializeCharts();
            this.loadDashboardData();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('Security Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    // Authentication Methods
    async checkAuth() {
        const token = localStorage.getItem('auth-token');
        if (!token) {
            this.showLoginModal();
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData.user;
                this.updateUserInterface();
            } else {
                throw new Error('Token verification failed');
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            localStorage.removeItem('auth-token');
            this.showLoginModal();
        }
    }

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('auth-token', data.token);
                this.currentUser = data.user;
                this.hideLoginModal();
                this.updateUserInterface();
                this.showNotification('Login successful', 'success');
                return true;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message);
            return false;
        }
    }

    logout() {
        localStorage.removeItem('auth-token');
        this.currentUser = null;
        this.socket?.disconnect();
        this.showLoginModal();
        this.showNotification('Logged out successfully', 'info');
    }

    // UI Methods
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const dashboard = document.querySelector('.dashboard');
        
        modal.classList.add('active');
        dashboard.style.display = 'none';
        
        // Focus on username field
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        const dashboard = document.querySelector('.dashboard');
        
        modal.classList.remove('active');
        dashboard.style.display = 'flex';
        
        // Clear form
        document.getElementById('loginForm').reset();
        this.clearLoginError();
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearLoginError() {
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'none';
    }

    hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    updateUserInterface() {
        if (this.currentUser) {
            document.getElementById('userAvatar').textContent = this.currentUser.name || 'User';
            document.getElementById('userName').textContent = this.currentUser.name || 'Unknown User';
            document.getElementById('userRole').textContent = this.currentUser.role || 'User';
        }
    }

    // Navigation Methods
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            this.currentSection = sectionId;
            
            // Add active class to corresponding nav item
            const navItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }
            
            // Load section-specific data
            this.loadSectionData(sectionId);
        }
    }

    async loadSectionData(sectionId) {
        try {
            switch (sectionId) {
                case 'overview':
                    await this.loadOverviewData();
                    break;
                case 'monitoring':
                    await this.loadMonitoringData();
                    break;
                case 'audit':
                    await this.loadAuditData();
                    break;
                case 'compliance':
                    await this.loadComplianceData();
                    break;
                case 'threats':
                    await this.loadThreatsData();
                    break;
                case 'config':
                    await this.loadConfigData();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${sectionId} data:`, error);
            this.showError(`Failed to load ${sectionId} data`);
        }
    }

    // Data Loading Methods
    async loadDashboardData() {
        await this.loadOverviewData();
    }

    async loadOverviewData() {
        try {
            const [statsResponse, activityResponse] = await Promise.all([
                this.fetchWithAuth('/api/dashboard/stats'),
                this.fetchWithAuth('/api/dashboard/activity')
            ]);

            const stats = await statsResponse.json();
            const activity = await activityResponse.json();

            this.updateStatsCards(stats);
            this.updateActivityFeed(activity.activities);
            this.updateCharts(stats.charts);
        } catch (error) {
            console.error('Failed to load overview data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadMonitoringData() {
        try {
            const response = await this.fetchWithAuth('/api/monitoring/status');
            const data = await response.json();
            
            this.updateMonitoringStatus(data);
        } catch (error) {
            console.error('Failed to load monitoring data:', error);
        }
    }

    async loadAuditData() {
        try {
            const response = await this.fetchWithAuth('/api/audit/logs');
            const data = await response.json();
            
            this.updateAuditLogs(data.logs);
        } catch (error) {
            console.error('Failed to load audit data:', error);
        }
    }

    async loadComplianceData() {
        try {
            const response = await this.fetchWithAuth('/api/compliance/status');
            const data = await response.json();
            
            this.updateComplianceStatus(data);
        } catch (error) {
            console.error('Failed to load compliance data:', error);
        }
    }

    async loadThreatsData() {
        try {
            const response = await this.fetchWithAuth('/api/threats/current');
            const data = await response.json();
            
            this.updateThreatsData(data);
        } catch (error) {
            console.error('Failed to load threats data:', error);
        }
    }

    async loadConfigData() {
        try {
            const response = await this.fetchWithAuth('/api/config/current');
            const data = await response.json();
            
            this.updateConfigData(data);
        } catch (error) {
            console.error('Failed to load config data:', error);
        }
    }

    // UI Update Methods
    updateStatsCards(stats) {
        const cards = {
            'systemStatus': stats.systemStatus || 'operational',
            'activeThreats': stats.activeThreats || 0,
            'securityScore': stats.securityScore || 95,
            'complianceRate': stats.complianceRate || 98
        };

        Object.entries(cards).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (typeof value === 'number') {
                    this.animateNumber(element, value);
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    updateActivityFeed(activities) {
        const container = document.getElementById('activityList');
        if (!container) return;

        container.innerHTML = '';

        activities.forEach(activity => {
            const item = this.createActivityItem(activity);
            container.appendChild(item);
        });
    }

    createActivityItem(activity) {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        const iconClass = this.getActivityIconClass(activity.type);
        const timeAgo = this.formatTimeAgo(activity.timestamp);
        
        item.innerHTML = `
            <div class="activity-icon ${activity.severity || 'info'}">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${timeAgo}</div>
        `;
        
        return item;
    }

    getActivityIconClass(type) {
        const icons = {
            'security': 'fas fa-shield-alt',
            'audit': 'fas fa-clipboard-list',
            'threat': 'fas fa-exclamation-triangle',
            'compliance': 'fas fa-check-circle',
            'system': 'fas fa-cog',
            'user': 'fas fa-user',
            'default': 'fas fa-info-circle'
        };
        return icons[type] || icons.default;
    }

    // Chart Methods
    initializeCharts() {
        this.initThreatChart();
        this.initPerformanceChart();
        this.initComplianceChart();
    }

    initThreatChart() {
        const ctx = document.getElementById('threatChart');
        if (!ctx) return;

        this.charts.threat = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Threats Detected',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CPU', 'Memory', 'Disk', 'Network'],
                datasets: [{
                    data: [65, 45, 30, 20],
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#17a2b8'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initComplianceChart() {
        const ctx = document.getElementById('complianceChart');
        if (!ctx) return;

        this.charts.compliance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI'],
                datasets: [{
                    label: 'Compliance Score',
                    data: [95, 98, 92, 88, 96],
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateCharts(chartData) {
        if (chartData && this.charts.threat) {
            this.charts.threat.data.labels = chartData.threat?.labels || [];
            this.charts.threat.data.datasets[0].data = chartData.threat?.data || [];
            this.charts.threat.update();
        }
    }

    // WebSocket Methods
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.showNotification('Real-time monitoring connected', 'success');
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.showNotification('Real-time monitoring disconnected', 'warning');
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                this.initializeWebSocket();
            }, 5000);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'threat_detected':
                this.handleThreatAlert(data.payload);
                break;
            case 'system_status':
                this.updateSystemStatus(data.payload);
                break;
            case 'audit_event':
                this.handleAuditEvent(data.payload);
                break;
            case 'compliance_update':
                this.updateComplianceStatus(data.payload);
                break;
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    handleThreatAlert(threat) {
        this.showNotification(
            `New ${threat.severity} threat detected: ${threat.title}`,
            'danger'
        );
        
        // Update threat counter
        const counter = document.getElementById('activeThreats');
        if (counter) {
            const current = parseInt(counter.textContent) || 0;
            this.animateNumber(counter, current + 1);
        }
    }

    // Utility Methods
    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('auth-token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        return fetch(url, {
            ...options,
            headers
        });
    }

    animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    showNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        this.notifications.unshift(notification);
        this.renderNotification(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    renderNotification(notification) {
        const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
        
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        
        element.innerHTML = `
            <div class="notification-content">
                <i class="${this.getNotificationIcon(notification.type)}"></i>
                <span>${notification.message}</span>
            </div>
            <button class="notification-close" onclick="dashboard.removeNotification(${notification.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(element);
        
        // Animate in
        setTimeout(() => {
            element.classList.add('show');
        }, 10);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    removeNotification(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('hide');
            setTimeout(() => {
                element.remove();
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'danger': 'fas fa-exclamation-triangle',
            'warning': 'fas fa-exclamation-circle',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    // Theme Methods
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('dashboard-theme', this.theme);
    }

    applyTheme() {
        document.body.className = `theme-${this.theme}`;
    }

    // Auto-refresh Methods
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.currentUser) {
                this.loadSectionData(this.currentSection);
            }
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Event Listeners
    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                const loginBtn = document.getElementById('loginBtn');
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                
                const success = await this.login(username, password);
                
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            });
        }

        // Navigation
        document.querySelectorAll('[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // User menu
        const userAvatar = document.getElementById('userAvatar');
        const userMenu = document.getElementById('userMenu');
        if (userAvatar && userMenu) {
            userAvatar.addEventListener('click', () => {
                userMenu.classList.toggle('active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!userAvatar.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.classList.remove('active');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadSectionData(this.currentSection);
            });
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new SecurityDashboard();
});

// Export for global access
window.dashboard = dashboard;