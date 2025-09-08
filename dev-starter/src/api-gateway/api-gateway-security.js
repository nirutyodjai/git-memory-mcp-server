/**
 * Git Memory MCP Server - API Gateway Security
 * Advanced Security System สำหรับ API Gateway
 * 
 * Features:
 * - Multi-layer authentication (JWT, API Key, OAuth2, mTLS)
 * - Role-based access control (RBAC)
 * - Rate limiting and DDoS protection
 * - Request/response encryption
 * - Security headers management
 * - Threat detection and prevention
 * - Audit logging
 * - IP whitelisting/blacklisting
 * - CORS management
 * - Input validation and sanitization
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const EventEmitter = require('events');

class APIGatewaySecurity extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            jwt: {
                secret: process.env.JWT_SECRET || 'your-super-secret-key',
                expiresIn: '24h',
                algorithm: 'HS256',
                issuer: 'api-gateway',
                audience: 'mcp-servers'
            },
            apiKey: {
                enabled: true,
                headerName: 'X-API-Key',
                queryParam: 'api_key',
                encryption: true
            },
            oauth2: {
                enabled: false,
                providers: {
                    google: {
                        clientId: process.env.GOOGLE_CLIENT_ID,
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET
                    }
                }
            },
            mtls: {
                enabled: false,
                ca: null,
                cert: null,
                key: null,
                rejectUnauthorized: true
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // requests per window
                message: 'Too many requests from this IP',
                standardHeaders: true,
                legacyHeaders: false
            },
            ddosProtection: {
                enabled: true,
                maxConnections: 100,
                maxRequestsPerSecond: 50,
                banDuration: 300000 // 5 minutes
            },
            encryption: {
                enabled: true,
                algorithm: 'aes-256-gcm',
                keyRotationInterval: 24 * 60 * 60 * 1000 // 24 hours
            },
            cors: {
                enabled: true,
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
                credentials: false
            },
            ipFiltering: {
                enabled: false,
                whitelist: [],
                blacklist: []
            },
            threatDetection: {
                enabled: true,
                sqlInjection: true,
                xss: true,
                pathTraversal: true,
                commandInjection: true
            },
            audit: {
                enabled: true,
                logLevel: 'info',
                includeRequestBody: false,
                includeResponseBody: false,
                retention: 30 // days
            },
            ...config
        };
        
        this.apiKeys = new Map();
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.sessions = new Map();
        this.bannedIPs = new Map();
        this.connectionCounts = new Map();
        this.requestCounts = new Map();
        this.encryptionKeys = new Map();
        this.auditLogs = [];
        
        this.setupDefaultRoles();
        this.setupEncryption();
        this.setupCleanupTasks();
        
        console.log('🔒 Security system initialized');
    }
    
    /**
     * Setup default roles and permissions
     */
    setupDefaultRoles() {
        // Define permissions
        const permissions = [
            'read:servers',
            'write:servers',
            'delete:servers',
            'read:metrics',
            'write:config',
            'admin:all'
        ];
        
        permissions.forEach(permission => {
            this.permissions.set(permission, {
                id: permission,
                description: `Permission to ${permission.replace(':', ' ')}`
            });
        });
        
        // Define roles
        this.roles.set('admin', {
            id: 'admin',
            name: 'Administrator',
            permissions: ['admin:all']
        });
        
        this.roles.set('operator', {
            id: 'operator',
            name: 'Operator',
            permissions: ['read:servers', 'read:metrics', 'write:servers']
        });
        
        this.roles.set('viewer', {
            id: 'viewer',
            name: 'Viewer',
            permissions: ['read:servers', 'read:metrics']
        });
        
        console.log('🔒 Default roles and permissions configured');
    }
    
    /**
     * Setup encryption
     */
    setupEncryption() {
        this.generateEncryptionKey();
        
        // Rotate encryption keys periodically
        setInterval(() => {
            this.rotateEncryptionKeys();
        }, this.config.encryption.keyRotationInterval);
    }
    
    /**
     * Generate encryption key
     */
    generateEncryptionKey() {
        const key = crypto.randomBytes(32);
        const keyId = crypto.randomBytes(16).toString('hex');
        
        this.encryptionKeys.set(keyId, {
            key,
            created: Date.now(),
            active: true
        });
        
        this.currentKeyId = keyId;
        console.log('🔒 New encryption key generated');
    }
    
    /**
     * Rotate encryption keys
     */
    rotateEncryptionKeys() {
        // Mark current key as inactive
        const currentKey = this.encryptionKeys.get(this.currentKeyId);
        if (currentKey) {
            currentKey.active = false;
        }
        
        // Generate new key
        this.generateEncryptionKey();
        
        // Clean up old keys (keep last 3)
        const keys = Array.from(this.encryptionKeys.entries())
            .sort((a, b) => b[1].created - a[1].created);
        
        if (keys.length > 3) {
            for (let i = 3; i < keys.length; i++) {
                this.encryptionKeys.delete(keys[i][0]);
            }
        }
        
        console.log('🔒 Encryption keys rotated');
    }
    
    /**
     * Setup cleanup tasks
     */
    setupCleanupTasks() {
        // Clean up expired sessions
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000); // Every minute
        
        // Clean up banned IPs
        setInterval(() => {
            this.cleanupBannedIPs();
        }, 60000);
        
        // Clean up audit logs
        setInterval(() => {
            this.cleanupAuditLogs();
        }, 24 * 60 * 60 * 1000); // Daily
    }
    
    /**
     * Create API key
     */
    createApiKey(userId, permissions = [], expiresIn = null) {
        const apiKey = crypto.randomBytes(32).toString('hex');
        const hashedKey = this.hashApiKey(apiKey);
        
        const keyData = {
            id: crypto.randomUUID(),
            userId,
            hashedKey,
            permissions,
            created: Date.now(),
            expires: expiresIn ? Date.now() + expiresIn : null,
            active: true,
            lastUsed: null,
            usageCount: 0
        };
        
        this.apiKeys.set(hashedKey, keyData);
        
        this.auditLog('api_key_created', {
            keyId: keyData.id,
            userId,
            permissions
        });
        
        return apiKey;
    }
    
    /**
     * Hash API key
     */
    hashApiKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }
    
    /**
     * Validate API key
     */
    validateApiKey(apiKey) {
        const hashedKey = this.hashApiKey(apiKey);
        const keyData = this.apiKeys.get(hashedKey);
        
        if (!keyData || !keyData.active) {
            return null;
        }
        
        if (keyData.expires && Date.now() > keyData.expires) {
            keyData.active = false;
            return null;
        }
        
        // Update usage statistics
        keyData.lastUsed = Date.now();
        keyData.usageCount++;
        
        return keyData;
    }
    
    /**
     * Create user
     */
    async createUser(userData) {
        const userId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const user = {
            id: userId,
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            roles: userData.roles || ['viewer'],
            active: true,
            created: Date.now(),
            lastLogin: null,
            loginAttempts: 0,
            locked: false,
            lockUntil: null
        };
        
        this.users.set(userId, user);
        
        this.auditLog('user_created', {
            userId,
            username: userData.username,
            roles: user.roles
        });
        
        return user;
    }
    
    /**
     * Authenticate user
     */
    async authenticateUser(username, password) {
        const user = Array.from(this.users.values())
            .find(u => u.username === username || u.email === username);
        
        if (!user || !user.active) {
            this.auditLog('authentication_failed', { username, reason: 'user_not_found' });
            return null;
        }
        
        if (user.locked && Date.now() < user.lockUntil) {
            this.auditLog('authentication_failed', { username, reason: 'account_locked' });
            return null;
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            user.loginAttempts++;
            
            if (user.loginAttempts >= 5) {
                user.locked = true;
                user.lockUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
            }
            
            this.auditLog('authentication_failed', { username, reason: 'invalid_password' });
            return null;
        }
        
        // Reset login attempts
        user.loginAttempts = 0;
        user.locked = false;
        user.lockUntil = null;
        user.lastLogin = Date.now();
        
        this.auditLog('authentication_success', { userId: user.id, username });
        
        return user;
    }
    
    /**
     * Generate JWT token
     */
    generateJWT(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            roles: user.roles,
            iat: Math.floor(Date.now() / 1000)
        };
        
        return jwt.sign(payload, this.config.jwt.secret, {
            expiresIn: this.config.jwt.expiresIn,
            algorithm: this.config.jwt.algorithm,
            issuer: this.config.jwt.issuer,
            audience: this.config.jwt.audience
        });
    }
    
    /**
     * Verify JWT token
     */
    verifyJWT(token) {
        try {
            return jwt.verify(token, this.config.jwt.secret, {
                algorithms: [this.config.jwt.algorithm],
                issuer: this.config.jwt.issuer,
                audience: this.config.jwt.audience
            });
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Check permissions
     */
    hasPermission(user, requiredPermission) {
        if (!user || !user.roles) {
            return false;
        }
        
        // Admin has all permissions
        if (user.roles.includes('admin')) {
            return true;
        }
        
        // Check role permissions
        for (const roleId of user.roles) {
            const role = this.roles.get(roleId);
            if (role && role.permissions.includes(requiredPermission)) {
                return true;
            }
            
            // Check for admin:all permission
            if (role && role.permissions.includes('admin:all')) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Encrypt data
     */
    encrypt(data) {
        if (!this.config.encryption.enabled) {
            return data;
        }
        
        const key = this.encryptionKeys.get(this.currentKeyId).key;
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.config.encryption.algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            keyId: this.currentKeyId,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted
        };
    }
    
    /**
     * Decrypt data
     */
    decrypt(encryptedData) {
        if (!this.config.encryption.enabled || typeof encryptedData !== 'object') {
            return encryptedData;
        }
        
        const keyData = this.encryptionKeys.get(encryptedData.keyId);
        if (!keyData) {
            throw new Error('Encryption key not found');
        }
        
        const decipher = crypto.createDecipher(
            this.config.encryption.algorithm,
            keyData.key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    /**
     * Validate input for security threats
     */
    validateInput(input, type = 'general') {
        if (!this.config.threatDetection.enabled) {
            return { valid: true, threats: [] };
        }
        
        const threats = [];
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        
        // SQL Injection detection
        if (this.config.threatDetection.sqlInjection) {
            const sqlPatterns = [
                /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
                /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
            ];
            
            for (const pattern of sqlPatterns) {
                if (pattern.test(inputStr)) {
                    threats.push('sql_injection');
                    break;
                }
            }
        }
        
        // XSS detection
        if (this.config.threatDetection.xss) {
            const xssPatterns = [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi
            ];
            
            for (const pattern of xssPatterns) {
                if (pattern.test(inputStr)) {
                    threats.push('xss');
                    break;
                }
            }
        }
        
        // Path traversal detection
        if (this.config.threatDetection.pathTraversal) {
            const pathPatterns = [
                /\.\.\/|\.\.\\/g,
                /%2e%2e%2f|%2e%2e%5c/gi
            ];
            
            for (const pattern of pathPatterns) {
                if (pattern.test(inputStr)) {
                    threats.push('path_traversal');
                    break;
                }
            }
        }
        
        // Command injection detection
        if (this.config.threatDetection.commandInjection) {
            const cmdPatterns = [
                /[;&|`$(){}\[\]]/,
                /(rm|cat|ls|ps|kill|chmod|chown)/i
            ];
            
            for (const pattern of cmdPatterns) {
                if (pattern.test(inputStr)) {
                    threats.push('command_injection');
                    break;
                }
            }
        }
        
        return {
            valid: threats.length === 0,
            threats
        };
    }
    
    /**
     * Check IP filtering
     */
    checkIPFiltering(ip) {
        if (!this.config.ipFiltering.enabled) {
            return { allowed: true, reason: null };
        }
        
        // Check blacklist first
        if (this.config.ipFiltering.blacklist.includes(ip)) {
            return { allowed: false, reason: 'blacklisted' };
        }
        
        // Check if IP is banned
        const banInfo = this.bannedIPs.get(ip);
        if (banInfo && Date.now() < banInfo.until) {
            return { allowed: false, reason: 'banned' };
        }
        
        // Check whitelist if configured
        if (this.config.ipFiltering.whitelist.length > 0) {
            if (!this.config.ipFiltering.whitelist.includes(ip)) {
                return { allowed: false, reason: 'not_whitelisted' };
            }
        }
        
        return { allowed: true, reason: null };
    }
    
    /**
     * Check DDoS protection
     */
    checkDDoSProtection(ip) {
        if (!this.config.ddosProtection.enabled) {
            return { allowed: true, reason: null };
        }
        
        const now = Date.now();
        
        // Check connection count
        const connections = this.connectionCounts.get(ip) || 0;
        if (connections > this.config.ddosProtection.maxConnections) {
            this.banIP(ip, 'too_many_connections');
            return { allowed: false, reason: 'connection_limit_exceeded' };
        }
        
        // Check request rate
        const requestData = this.requestCounts.get(ip) || { count: 0, window: now };
        
        if (now - requestData.window > 1000) {
            // Reset window
            requestData.count = 1;
            requestData.window = now;
        } else {
            requestData.count++;
        }
        
        this.requestCounts.set(ip, requestData);
        
        if (requestData.count > this.config.ddosProtection.maxRequestsPerSecond) {
            this.banIP(ip, 'rate_limit_exceeded');
            return { allowed: false, reason: 'rate_limit_exceeded' };
        }
        
        return { allowed: true, reason: null };
    }
    
    /**
     * Ban IP address
     */
    banIP(ip, reason) {
        const until = Date.now() + this.config.ddosProtection.banDuration;
        
        this.bannedIPs.set(ip, {
            reason,
            until,
            created: Date.now()
        });
        
        this.auditLog('ip_banned', { ip, reason, until });
        console.log(`🔒 IP ${ip} banned for ${reason}`);
    }
    
    /**
     * Unban IP address
     */
    unbanIP(ip) {
        if (this.bannedIPs.delete(ip)) {
            this.auditLog('ip_unbanned', { ip });
            console.log(`🔒 IP ${ip} unbanned`);
            return true;
        }
        return false;
    }
    
    /**
     * Increment connection count
     */
    incrementConnectionCount(ip) {
        const current = this.connectionCounts.get(ip) || 0;
        this.connectionCounts.set(ip, current + 1);
    }
    
    /**
     * Decrement connection count
     */
    decrementConnectionCount(ip) {
        const current = this.connectionCounts.get(ip) || 0;
        if (current > 0) {
            this.connectionCounts.set(ip, current - 1);
        }
    }
    
    /**
     * Audit log
     */
    auditLog(event, data = {}) {
        if (!this.config.audit.enabled) {
            return;
        }
        
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            event,
            data,
            ip: data.ip || null,
            userId: data.userId || null
        };
        
        this.auditLogs.push(logEntry);
        
        // Emit event for external logging
        this.emit('auditLog', logEntry);
        
        console.log(`🔒 Audit: ${event}`, data);
    }
    
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.expires && now > session.expires) {
                this.sessions.delete(sessionId);
            }
        }
    }
    
    /**
     * Clean up banned IPs
     */
    cleanupBannedIPs() {
        const now = Date.now();
        for (const [ip, banInfo] of this.bannedIPs.entries()) {
            if (now > banInfo.until) {
                this.bannedIPs.delete(ip);
            }
        }
    }
    
    /**
     * Clean up audit logs
     */
    cleanupAuditLogs() {
        const cutoff = Date.now() - (this.config.audit.retention * 24 * 60 * 60 * 1000);
        this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoff);
    }
    
    /**
     * Get security statistics
     */
    getSecurityStats() {
        return {
            users: {
                total: this.users.size,
                active: Array.from(this.users.values()).filter(u => u.active).length,
                locked: Array.from(this.users.values()).filter(u => u.locked).length
            },
            apiKeys: {
                total: this.apiKeys.size,
                active: Array.from(this.apiKeys.values()).filter(k => k.active).length
            },
            security: {
                bannedIPs: this.bannedIPs.size,
                activeConnections: Array.from(this.connectionCounts.values()).reduce((a, b) => a + b, 0),
                auditLogs: this.auditLogs.length
            },
            threats: {
                detected: this.auditLogs.filter(log => 
                    log.event === 'threat_detected' && 
                    Date.now() - log.timestamp < 24 * 60 * 60 * 1000
                ).length
            }
        };
    }
    
    /**
     * Export audit logs
     */
    exportAuditLogs(format = 'json', filters = {}) {
        let logs = [...this.auditLogs];
        
        // Apply filters
        if (filters.startDate) {
            logs = logs.filter(log => log.timestamp >= filters.startDate);
        }
        
        if (filters.endDate) {
            logs = logs.filter(log => log.timestamp <= filters.endDate);
        }
        
        if (filters.event) {
            logs = logs.filter(log => log.event === filters.event);
        }
        
        if (filters.userId) {
            logs = logs.filter(log => log.data.userId === filters.userId);
        }
        
        if (format === 'csv') {
            const headers = ['timestamp', 'event', 'userId', 'ip', 'data'];
            const rows = logs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.event,
                log.data.userId || '',
                log.ip || '',
                JSON.stringify(log.data)
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        
        return JSON.stringify(logs, null, 2);
    }
}

// Export class
module.exports = APIGatewaySecurity;

// CLI interface
if (require.main === module) {
    const security = new APIGatewaySecurity({
        jwt: {
            secret: 'test-secret-key'
        },
        rateLimit: {
            max: 100
        },
        ddosProtection: {
            enabled: true,
            maxConnections: 50
        }
    });
    
    // Create test user
    security.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        roles: ['admin']
    }).then(user => {
        console.log('🔒 Test user created:', user.username);
        
        // Create API key
        const apiKey = security.createApiKey(user.id, ['read:servers', 'write:servers']);
        console.log('🔒 API key created:', apiKey);
        
        // Test authentication
        security.authenticateUser('admin', 'admin123').then(authUser => {
            if (authUser) {
                const token = security.generateJWT(authUser);
                console.log('🔒 JWT token generated');
                
                const decoded = security.verifyJWT(token);
                console.log('🔒 JWT token verified:', decoded.username);
            }
        });
        
        // Test threat detection
        const testInputs = [
            "SELECT * FROM users WHERE id = '1' OR '1'='1'",
            "<script>alert('xss')</script>",
            "../../../etc/passwd",
            "normal input"
        ];
        
        testInputs.forEach(input => {
            const result = security.validateInput(input);
            console.log(`🔒 Input validation for "${input}":`, result);
        });
        
        // Print security stats
        setInterval(() => {
            const stats = security.getSecurityStats();
            console.log('🔒 Security Stats:', JSON.stringify(stats, null, 2));
        }, 10000);
    });
}