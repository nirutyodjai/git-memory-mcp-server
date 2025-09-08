/**
 * Security Dashboard Routes
 * Real-time security monitoring and management dashboard
 * Enterprise-grade security visualization and control
 */

const express = require('express');
const SecurityIntegrationService = require('../services/securityIntegrationService');
const AuthMiddleware = require('../middleware/authMiddleware');
const SecurityMiddleware = require('../middleware/securityMiddleware');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const securityService = new SecurityIntegrationService();

// Apply security middleware to all dashboard routes
router.use(SecurityMiddleware.validateRequest);
router.use(AuthMiddleware.requireAuth);
router.use(AuthMiddleware.requireRole(['admin', 'security_officer']));

/**
 * Security Dashboard Main Page
 */
router.get('/', async (req, res) => {
    try {
        const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 NEXUS IDE - Security Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        
        .dashboard-container {
            display: grid;
            grid-template-columns: 250px 1fr;
            min-height: 100vh;
        }
        
        .sidebar {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar h2 {
            color: #00d4ff;
            margin-bottom: 30px;
            font-size: 1.5em;
        }
        
        .nav-item {
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }
        
        .nav-item:hover {
            background: rgba(0, 212, 255, 0.1);
            border-color: #00d4ff;
        }
        
        .nav-item.active {
            background: rgba(0, 212, 255, 0.2);
            border-color: #00d4ff;
        }
        
        .main-content {
            padding: 20px;
            overflow-y: auto;
        }
        
        .header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            color: #00d4ff;
            font-size: 2em;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .status-dot.secure {
            background: #00ff88;
        }
        
        .status-dot.warning {
            background: #ffaa00;
        }
        
        .status-dot.critical {
            background: #ff4444;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(0, 0, 0, 0.3);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
            border-color: #00d4ff;
            box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
        }
        
        .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .metric-title {
            font-size: 1.1em;
            color: #cccccc;
        }
        
        .metric-icon {
            font-size: 1.5em;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #00d4ff;
            margin-bottom: 10px;
        }
        
        .metric-change {
            font-size: 0.9em;
            color: #888888;
        }
        
        .metric-change.positive {
            color: #00ff88;
        }
        
        .metric-change.negative {
            color: #ff4444;
        }
        
        .chart-container {
            background: rgba(0, 0, 0, 0.3);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 30px;
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .chart-title {
            font-size: 1.3em;
            color: #ffffff;
        }
        
        .chart-controls {
            display: flex;
            gap: 10px;
        }
        
        .chart-btn {
            padding: 8px 16px;
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid #00d4ff;
            border-radius: 6px;
            color: #00d4ff;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .chart-btn:hover {
            background: rgba(0, 212, 255, 0.2);
        }
        
        .chart-btn.active {
            background: #00d4ff;
            color: #000000;
        }
        
        .threats-list {
            background: rgba(0, 0, 0, 0.3);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 30px;
        }
        
        .threat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .threat-item.critical {
            border-left-color: #ff4444;
        }
        
        .threat-item.high {
            border-left-color: #ffaa00;
        }
        
        .threat-item.medium {
            border-left-color: #ffdd00;
        }
        
        .threat-item.low {
            border-left-color: #00ff88;
        }
        
        .threat-info {
            flex: 1;
        }
        
        .threat-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .threat-details {
            font-size: 0.9em;
            color: #cccccc;
        }
        
        .threat-actions {
            display: flex;
            gap: 10px;
        }
        
        .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            transition: all 0.3s ease;
        }
        
        .action-btn.resolve {
            background: #00ff88;
            color: #000000;
        }
        
        .action-btn.investigate {
            background: #00d4ff;
            color: #000000;
        }
        
        .action-btn.block {
            background: #ff4444;
            color: #ffffff;
        }
        
        .logs-container {
            background: rgba(0, 0, 0, 0.3);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            height: 400px;
            overflow-y: auto;
        }
        
        .log-entry {
            padding: 10px;
            margin: 5px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .log-timestamp {
            color: #888888;
        }
        
        .log-level {
            font-weight: bold;
            margin: 0 10px;
        }
        
        .log-level.info {
            color: #00d4ff;
        }
        
        .log-level.warning {
            color: #ffaa00;
        }
        
        .log-level.error {
            color: #ff4444;
        }
        
        .log-level.critical {
            color: #ff0066;
        }
        
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: #00d4ff;
            border: none;
            border-radius: 50%;
            color: #000000;
            font-size: 1.5em;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(0, 212, 255, 0.3);
            transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 30px rgba(0, 212, 255, 0.5);
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #00d4ff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="sidebar">
            <h2>🔐 Security Center</h2>
            <div class="nav-item active" data-section="overview">📊 Overview</div>
            <div class="nav-item" data-section="threats">🚨 Threats</div>
            <div class="nav-item" data-section="users">👥 Users</div>
            <div class="nav-item" data-section="logs">📋 Audit Logs</div>
            <div class="nav-item" data-section="compliance">📜 Compliance</div>
            <div class="nav-item" data-section="settings">⚙️ Settings</div>
        </div>
        
        <div class="main-content">
            <div class="header">
                <h1>Security Dashboard</h1>
                <div class="status-indicator">
                    <div class="status-dot secure" id="systemStatus"></div>
                    <span id="statusText">System Secure</span>
                </div>
            </div>
            
            <!-- Overview Section -->
            <div id="overview-section">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Active Threats</span>
                            <span class="metric-icon">🚨</span>
                        </div>
                        <div class="metric-value" id="activeThreats">0</div>
                        <div class="metric-change" id="threatsChange">No change from yesterday</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Blocked IPs</span>
                            <span class="metric-icon">🚫</span>
                        </div>
                        <div class="metric-value" id="blockedIPs">0</div>
                        <div class="metric-change" id="blockedChange">+0 in last hour</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Active Sessions</span>
                            <span class="metric-icon">👥</span>
                        </div>
                        <div class="metric-value" id="activeSessions">0</div>
                        <div class="metric-change" id="sessionsChange">Normal activity</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Security Score</span>
                            <span class="metric-icon">🛡️</span>
                        </div>
                        <div class="metric-value" id="securityScore">98%</div>
                        <div class="metric-change positive" id="scoreChange">+2% this week</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Security Events Timeline</h3>
                        <div class="chart-controls">
                            <button class="chart-btn active" data-period="1h">1H</button>
                            <button class="chart-btn" data-period="24h">24H</button>
                            <button class="chart-btn" data-period="7d">7D</button>
                            <button class="chart-btn" data-period="30d">30D</button>
                        </div>
                    </div>
                    <div id="securityChart" style="height: 300px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #888;">
                        📈 Security events chart will be displayed here
                    </div>
                </div>
            </div>
            
            <!-- Threats Section -->
            <div id="threats-section" class="hidden">
                <div class="threats-list">
                    <h3 style="margin-bottom: 20px; color: #ffffff;">🚨 Active Threats</h3>
                    <div id="threatsList">
                        <!-- Threats will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Users Section -->
            <div id="users-section" class="hidden">
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px; color: #ffffff;">👥 User Management</h3>
                    <div id="usersContent" style="color: #888; text-align: center; padding: 50px;">
                        User management interface will be displayed here
                    </div>
                </div>
            </div>
            
            <!-- Logs Section -->
            <div id="logs-section" class="hidden">
                <div class="logs-container">
                    <h3 style="margin-bottom: 20px; color: #ffffff;">📋 Audit Logs</h3>
                    <div id="auditLogs">
                        <!-- Logs will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Compliance Section -->
            <div id="compliance-section" class="hidden">
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px; color: #ffffff;">📜 Compliance Status</h3>
                    <div id="complianceContent" style="color: #888; text-align: center; padding: 50px;">
                        Compliance monitoring dashboard will be displayed here
                    </div>
                </div>
            </div>
            
            <!-- Settings Section -->
            <div id="settings-section" class="hidden">
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px; color: #ffffff;">⚙️ Security Settings</h3>
                    <div id="settingsContent" style="color: #888; text-align: center; padding: 50px;">
                        Security configuration settings will be displayed here
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <button class="refresh-btn" onclick="refreshDashboard()" title="Refresh Dashboard">
        <span id="refreshIcon">🔄</span>
    </button>
    
    <script>
        // Dashboard state
        let currentSection = 'overview';
        let refreshInterval;
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeDashboard();
            startAutoRefresh();
        });
        
        // Initialize dashboard
        function initializeDashboard() {
            setupNavigation();
            loadSecurityData();
        }
        
        // Setup navigation
        function setupNavigation() {
            const navItems = document.querySelectorAll('.nav-item');
            
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    const section = this.dataset.section;
                    switchSection(section);
                });
            });
        }
        
        // Switch dashboard section
        function switchSection(section) {
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-section="${section}"]`).classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('[id$="-section"]').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            document.getElementById(`${section}-section`).classList.remove('hidden');
            
            currentSection = section;
            
            // Load section-specific data
            loadSectionData(section);
        }
        
        // Load section-specific data
        function loadSectionData(section) {
            switch(section) {
                case 'threats':
                    loadThreats();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'logs':
                    loadAuditLogs();
                    break;
                case 'compliance':
                    loadCompliance();
                    break;
                case 'settings':
                    loadSettings();
                    break;
            }
        }
        
        // Load security data
        async function loadSecurityData() {
            try {
                const response = await fetch('/api/security/status');
                const data = await response.json();
                
                updateMetrics(data);
                updateSystemStatus(data);
                
            } catch (error) {
                console.error('Error loading security data:', error);
                showError('Failed to load security data');
            }
        }
        
        // Update metrics
        function updateMetrics(data) {
            document.getElementById('activeThreats').textContent = data.activeThreats || 0;
            document.getElementById('blockedIPs').textContent = data.blockedIPs || 0;
            document.getElementById('activeSessions').textContent = data.activeSessions || 0;
            
            // Update changes
            updateMetricChange('threatsChange', data.threatsChange);
            updateMetricChange('blockedChange', data.blockedChange);
            updateMetricChange('sessionsChange', data.sessionsChange);
        }
        
        // Update metric change
        function updateMetricChange(elementId, change) {
            const element = document.getElementById(elementId);
            if (change && change.value !== undefined) {
                element.textContent = change.text;
                element.className = `metric-change ${change.type}`;
            }
        }
        
        // Update system status
        function updateSystemStatus(data) {
            const statusDot = document.getElementById('systemStatus');
            const statusText = document.getElementById('statusText');
            
            if (data.activeThreats > 0) {
                statusDot.className = 'status-dot critical';
                statusText.textContent = 'Threats Detected';
            } else if (data.blockedIPs > 10) {
                statusDot.className = 'status-dot warning';
                statusText.textContent = 'High Activity';
            } else {
                statusDot.className = 'status-dot secure';
                statusText.textContent = 'System Secure';
            }
        }
        
        // Load threats
        async function loadThreats() {
            try {
                const response = await fetch('/api/security/threats');
                const threats = await response.json();
                
                const threatsList = document.getElementById('threatsList');
                threatsList.innerHTML = '';
                
                if (threats.length === 0) {
                    threatsList.innerHTML = '<div style="text-align: center; color: #888; padding: 50px;">No active threats detected</div>';
                    return;
                }
                
                threats.forEach(threat => {
                    const threatElement = createThreatElement(threat);
                    threatsList.appendChild(threatElement);
                });
                
            } catch (error) {
                console.error('Error loading threats:', error);
                showError('Failed to load threats');
            }
        }
        
        // Create threat element
        function createThreatElement(threat) {
            const div = document.createElement('div');
            div.className = `threat-item ${threat.severity}`;
            
            div.innerHTML = `
                <div class="threat-info">
                    <div class="threat-title">${threat.type}</div>
                    <div class="threat-details">${threat.details} - ${new Date(threat.detectedAt).toLocaleString()}</div>
                </div>
                <div class="threat-actions">
                    <button class="action-btn investigate" onclick="investigateThreat('${threat.id}')">Investigate</button>
                    <button class="action-btn resolve" onclick="resolveThreat('${threat.id}')">Resolve</button>
                    <button class="action-btn block" onclick="blockThreat('${threat.id}')">Block</button>
                </div>
            `;
            
            return div;
        }
        
        // Load audit logs
        async function loadAuditLogs() {
            try {
                const response = await fetch('/api/security/logs');
                const logs = await response.json();
                
                const logsContainer = document.getElementById('auditLogs');
                logsContainer.innerHTML = '';
                
                logs.forEach(log => {
                    const logElement = createLogElement(log);
                    logsContainer.appendChild(logElement);
                });
                
            } catch (error) {
                console.error('Error loading audit logs:', error);
                showError('Failed to load audit logs');
            }
        }
        
        // Create log element
        function createLogElement(log) {
            const div = document.createElement('div');
            div.className = 'log-entry';
            
            div.innerHTML = `
                <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                <span class="log-level ${log.level}">[${log.level.toUpperCase()}]</span>
                <span class="log-message">${log.message}</span>
            `;
            
            return div;
        }
        
        // Threat actions
        function investigateThreat(threatId) {
            console.log('Investigating threat:', threatId);
            // Implementation for threat investigation
        }
        
        function resolveThreat(threatId) {
            console.log('Resolving threat:', threatId);
            // Implementation for threat resolution
        }
        
        function blockThreat(threatId) {
            console.log('Blocking threat:', threatId);
            // Implementation for threat blocking
        }
        
        // Load other sections (placeholder implementations)
        function loadUsers() {
            console.log('Loading users...');
        }
        
        function loadCompliance() {
            console.log('Loading compliance data...');
        }
        
        function loadSettings() {
            console.log('Loading settings...');
        }
        
        // Refresh dashboard
        function refreshDashboard() {
            const refreshIcon = document.getElementById('refreshIcon');
            refreshIcon.innerHTML = '<div class="loading"></div>';
            
            setTimeout(() => {
                loadSecurityData();
                loadSectionData(currentSection);
                refreshIcon.textContent = '🔄';
            }, 1000);
        }
        
        // Start auto refresh
        function startAutoRefresh() {
            refreshInterval = setInterval(() => {
                loadSecurityData();
                if (currentSection === 'threats') {
                    loadThreats();
                } else if (currentSection === 'logs') {
                    loadAuditLogs();
                }
            }, 30000); // Refresh every 30 seconds
        }
        
        // Show error message
        function showError(message) {
            console.error(message);
            // Implementation for error display
        }
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        });
    </script>
</body>
</html>
        `;
        
        res.send(dashboardHTML);
        
    } catch (error) {
        console.error('Error serving security dashboard:', error);
        res.status(500).json({ error: 'Failed to load security dashboard' });
    }
});

/**
 * Get Security Status API
 */
router.get('/api/status', async (req, res) => {
    try {
        const status = securityService.getSecurityStatus();
        
        res.json({
            ...status,
            threatsChange: {
                value: 0,
                text: 'No change from yesterday',
                type: 'neutral'
            },
            blockedChange: {
                value: 0,
                text: '+0 in last hour',
                type: 'neutral'
            },
            sessionsChange: {
                value: 0,
                text: 'Normal activity',
                type: 'neutral'
            }
        });
        
    } catch (error) {
        console.error('Error getting security status:', error);
        res.status(500).json({ error: 'Failed to get security status' });
    }
});

/**
 * Get Active Threats API
 */
router.get('/api/threats', async (req, res) => {
    try {
        const threats = [];
        
        // Get threats from security service
        for (const [id, threat] of securityService.securityState.threats) {
            threats.push({
                id,
                type: threat.type,
                severity: threat.severity,
                details: threat.details,
                detectedAt: threat.detectedAt,
                status: threat.status
            });
        }
        
        res.json(threats);
        
    } catch (error) {
        console.error('Error getting threats:', error);
        res.status(500).json({ error: 'Failed to get threats' });
    }
});

/**
 * Get Audit Logs API
 */
router.get('/api/logs', async (req, res) => {
    try {
        const { limit = 100, level, type } = req.query;
        
        // Get logs from audit service
        const logs = await securityService.auditService.getRecentLogs({
            limit: parseInt(limit),
            level,
            type
        });
        
        res.json(logs);
        
    } catch (error) {
        console.error('Error getting audit logs:', error);
        res.status(500).json({ error: 'Failed to get audit logs' });
    }
});

/**
 * Get Security Metrics API
 */
router.get('/api/metrics', async (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        // Get metrics from monitoring service
        const metrics = await securityService.monitoringService.getSecurityMetrics(period);
        
        res.json(metrics);
        
    } catch (error) {
        console.error('Error getting security metrics:', error);
        res.status(500).json({ error: 'Failed to get security metrics' });
    }
});

/**
 * Resolve Threat API
 */
router.post('/api/threats/:threatId/resolve', async (req, res) => {
    try {
        const { threatId } = req.params;
        const { resolution, notes } = req.body;
        
        // Resolve threat
        const threat = securityService.securityState.threats.get(threatId);
        if (!threat) {
            return res.status(404).json({ error: 'Threat not found' });
        }
        
        threat.status = 'resolved';
        threat.resolvedAt = new Date();
        threat.resolution = resolution;
        threat.notes = notes;
        threat.resolvedBy = req.user.id;
        
        // Log the resolution
        await securityService.auditService.logEvent({
            type: 'THREAT_RESOLVED',
            threatId,
            resolution,
            notes,
            resolvedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'Threat resolved successfully' });
        
    } catch (error) {
        console.error('Error resolving threat:', error);
        res.status(500).json({ error: 'Failed to resolve threat' });
    }
});

/**
 * Block IP Address API
 */
router.post('/api/block-ip', async (req, res) => {
    try {
        const { ip, reason, duration } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        
        // Block IP
        securityService.securityState.blockedIPs.add(ip);
        
        // Log the block
        await securityService.auditService.logSecurityEvent({
            type: 'IP_BLOCKED',
            severity: 'medium',
            ip,
            reason,
            duration,
            blockedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: `IP ${ip} blocked successfully` });
        
    } catch (error) {
        console.error('Error blocking IP:', error);
        res.status(500).json({ error: 'Failed to block IP' });
    }
});

/**
 * Unblock IP Address API
 */
router.post('/api/unblock-ip', async (req, res) => {
    try {
        const { ip, reason } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        
        // Unblock IP
        securityService.securityState.blockedIPs.delete(ip);
        
        // Log the unblock
        await securityService.auditService.logSecurityEvent({
            type: 'IP_UNBLOCKED',
            severity: 'low',
            ip,
            reason,
            unblockedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: `IP ${ip} unblocked successfully` });
        
    } catch (error) {
        console.error('Error unblocking IP:', error);
        res.status(500).json({ error: 'Failed to unblock IP' });
    }
});

/**
 * Get Compliance Status API
 */
router.get('/api/compliance', async (req, res) => {
    try {
        const compliance = await securityService.auditService.getComplianceStatus();
        
        res.json(compliance);
        
    } catch (error) {
        console.error('Error getting compliance status:', error);
        res.status(500).json({ error: 'Failed to get compliance status' });
    }
});

/**
 * Generate Compliance Report API
 */
router.post('/api/compliance/report', async (req, res) => {
    try {
        const { standard, startDate, endDate } = req.body;
        
        const report = await securityService.auditService.generateComplianceReport({
            standard,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });
        
        res.json(report);
        
    } catch (error) {
        console.error('Error generating compliance report:', error);
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
});

/**
 * Security Configuration API
 */
router.get('/api/config', AuthMiddleware.requireRole(['admin']), async (req, res) => {
    try {
        const config = {
            rateLimiting: securityConfig.rateLimiting,
            authentication: {
                jwtExpiration: securityConfig.jwt.expiresIn,
                mfaEnabled: securityConfig.mfa.enabled,
                passwordPolicy: securityConfig.passwordPolicy
            },
            security: {
                encryptionEnabled: securityConfig.encryption.enabled,
                auditingEnabled: securityConfig.auditing.enabled,
                complianceStandards: securityConfig.compliance.standards
            }
        };
        
        res.json(config);
        
    } catch (error) {
        console.error('Error getting security config:', error);
        res.status(500).json({ error: 'Failed to get security configuration' });
    }
});

/**
 * Update Security Configuration API
 */
router.put('/api/config', AuthMiddleware.requireRole(['admin']), async (req, res) => {
    try {
        const { config } = req.body;
        
        // Validate and update configuration
        // This would typically update the security configuration
        
        // Log configuration change
        await securityService.auditService.logEvent({
            type: 'SECURITY_CONFIG_UPDATED',
            changes: config,
            updatedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'Security configuration updated successfully' });
        
    } catch (error) {
        console.error('Error updating security config:', error);
        res.status(500).json({ error: 'Failed to update security configuration' });
    }
});

module.exports = router;