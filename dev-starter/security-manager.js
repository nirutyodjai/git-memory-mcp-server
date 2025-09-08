#!/usr/bin/env node
/**
 * Advanced Security Manager
 * ระบบรักษาความปลอดภัยขั้นสูงสำหรับ Git Memory MCP Server System
 * รองรับ Authentication, Authorization, Encryption และ Security Monitoring
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class SecurityManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // JWT Configuration
            jwtSecret: options.jwtSecret || this.generateSecretKey(),
            jwtExpiresIn: options.jwtExpiresIn || '24h',
            jwtRefreshExpiresIn: options.jwtRefreshExpiresIn || '7d',
            
            // Encryption Configuration
            encryptionAlgorithm: 'aes-256-gcm',
            encryptionKey: options.encryptionKey || this.generateEncryptionKey(),
            
            // Security Policies
            maxLoginAttempts: options.maxLoginAttempts || 5,
            lockoutDuration: options.lockoutDuration || 15 * 60 * 1000, // 15 minutes
            passwordMinLength: options.passwordMinLength || 8,
            requireMFA: options.requireMFA || false,
            
            // Rate Limiting
            rateLimitWindow: options.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
            rateLimitMax: options.rateLimitMax || 100,
            
            // Security Monitoring
            enableSecurityLogging: options.enableSecurityLogging !== false,
            enableIntrusionDetection: options.enableIntrusionDetection !== false,
            
            // File Paths
            usersFile: options.usersFile || path.join(__dirname, 'security', 'users.json'),
            rolesFile: options.rolesFile || path.join(__dirname, 'security', 'roles.json'),
            securityLogFile: options.securityLogFile || path.join(__dirname, 'logs', 'security.log'),
            
            ...options
        };
        
        // Internal state
        this.users = new Map();
        this.roles = new Map();
        this.sessions = new Map();
        this.loginAttempts = new Map();
        this.rateLimits = new Map();
        this.securityEvents = [];
        
        // Initialize
        this.initialize();
    }
    
    /**
     * เริ่มต้นระบบความปลอดภัย
     */
    async initialize() {
        try {
            console.log('🔐 เริ่มต้น Security Manager...');
            
            // สร้างโฟลเดอร์ที่จำเป็น
            await this.ensureDirectories();
            
            // โหลดข้อมูลผู้ใช้และบทบาท
            await this.loadUsers();
            await this.loadRoles();
            
            // สร้างผู้ใช้ admin เริ่มต้น (ถ้ายังไม่มี)
            await this.createDefaultAdmin();
            
            // เริ่มต้นระบบตรวจสอบความปลอดภัย
            this.startSecurityMonitoring();
            
            console.log('✅ Security Manager เริ่มต้นเสร็จสิ้น');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Error initializing Security Manager:', error.message);
            throw error;
        }
    }
    
    /**
     * สร้างโฟลเดอร์ที่จำเป็น
     */
    async ensureDirectories() {
        const dirs = [
            path.dirname(this.config.usersFile),
            path.dirname(this.config.rolesFile),
            path.dirname(this.config.securityLogFile)
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // ไม่สำคัญถ้าโฟลเดอร์มีอยู่แล้ว
            }
        }
    }
    
    /**
     * สร้าง Secret Key สำหรับ JWT
     */
    generateSecretKey() {
        return crypto.randomBytes(64).toString('hex');
    }
    
    /**
     * สร้าง Encryption Key
     */
    generateEncryptionKey() {
        return crypto.randomBytes(32);
    }
    
    /**
     * เข้ารหัสข้อมูล
     */
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.config.encryptionAlgorithm, this.config.encryptionKey);
            cipher.setAAD(Buffer.from('git-memory-mcp'));
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }
    
    /**
     * ถอดรหัสข้อมูล
     */
    decrypt(encryptedData) {
        try {
            const { encrypted, iv, authTag } = encryptedData;
            
            const decipher = crypto.createDecipher(this.config.encryptionAlgorithm, this.config.encryptionKey);
            decipher.setAAD(Buffer.from('git-memory-mcp'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
    
    /**
     * สร้าง JWT Token
     */
    generateToken(payload, expiresIn = null) {
        const options = {
            expiresIn: expiresIn || this.config.jwtExpiresIn,
            issuer: 'git-memory-mcp-server',
            audience: 'mcp-clients'
        };
        
        return jwt.sign(payload, this.config.jwtSecret, options);
    }
    
    /**
     * ตรวจสอบ JWT Token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.config.jwtSecret, {
                issuer: 'git-memory-mcp-server',
                audience: 'mcp-clients'
            });
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
    
    /**
     * Hash รหัสผ่าน
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    
    /**
     * ตรวจสอบรหัสผ่าน
     */
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    
    /**
     * ตรวจสอบความแข็งแรงของรหัสผ่าน
     */
    validatePasswordStrength(password) {
        const errors = [];
        
        if (password.length < this.config.passwordMinLength) {
            errors.push(`Password must be at least ${this.config.passwordMinLength} characters`);
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * สร้างผู้ใช้ใหม่
     */
    async createUser(userData) {
        try {
            const { username, password, email, roles = ['user'], permissions = [] } = userData;
            
            // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
            if (this.users.has(username)) {
                throw new Error('Username already exists');
            }
            
            // ตรวจสอบความแข็งแรงของรหัสผ่าน
            const passwordValidation = this.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
            }
            
            // Hash รหัสผ่าน
            const hashedPassword = await this.hashPassword(password);
            
            // สร้างข้อมูลผู้ใช้
            const user = {
                id: this.generateUserId(),
                username,
                email,
                password: hashedPassword,
                roles,
                permissions,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true,
                mfaEnabled: false,
                mfaSecret: null
            };
            
            // บันทึกผู้ใช้
            this.users.set(username, user);
            await this.saveUsers();
            
            // บันทึก Security Event
            await this.logSecurityEvent('USER_CREATED', {
                username,
                email,
                roles,
                createdBy: 'system'
            });
            
            console.log(`👤 สร้างผู้ใช้ ${username} สำเร็จ`);
            return { id: user.id, username, email, roles };
            
        } catch (error) {
            await this.logSecurityEvent('USER_CREATION_FAILED', {
                username: userData.username,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * ตรวจสอบการเข้าสู่ระบบ
     */
    async authenticate(username, password, clientInfo = {}) {
        try {
            // ตรวจสอบ Rate Limiting
            if (!this.checkRateLimit(clientInfo.ip)) {
                throw new Error('Too many requests. Please try again later.');
            }
            
            // ตรวจสอบการล็อคบัญชี
            if (this.isAccountLocked(username)) {
                throw new Error('Account is temporarily locked due to multiple failed login attempts');
            }
            
            // ค้นหาผู้ใช้
            const user = this.users.get(username);
            if (!user || !user.isActive) {
                await this.recordFailedLogin(username, clientInfo);
                throw new Error('Invalid credentials');
            }
            
            // ตรวจสอบรหัสผ่าน
            const isPasswordValid = await this.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                await this.recordFailedLogin(username, clientInfo);
                throw new Error('Invalid credentials');
            }
            
            // รีเซ็ตการนับความพยายามเข้าสู่ระบบ
            this.loginAttempts.delete(username);
            
            // อัปเดตเวลาเข้าสู่ระบบล่าสุด
            user.lastLogin = new Date().toISOString();
            await this.saveUsers();
            
            // สร้าง JWT Tokens
            const tokenPayload = {
                userId: user.id,
                username: user.username,
                roles: user.roles,
                permissions: user.permissions
            };
            
            const accessToken = this.generateToken(tokenPayload);
            const refreshToken = this.generateToken(
                { userId: user.id, type: 'refresh' },
                this.config.jwtRefreshExpiresIn
            );
            
            // บันทึก Session
            const sessionId = this.generateSessionId();
            this.sessions.set(sessionId, {
                userId: user.id,
                username: user.username,
                accessToken,
                refreshToken,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                clientInfo
            });
            
            // บันทึก Security Event
            await this.logSecurityEvent('USER_LOGIN_SUCCESS', {
                username,
                userId: user.id,
                clientInfo
            });
            
            console.log(`🔓 ผู้ใช้ ${username} เข้าสู่ระบบสำเร็จ`);
            
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles,
                    permissions: user.permissions
                },
                tokens: {
                    accessToken,
                    refreshToken
                },
                sessionId
            };
            
        } catch (error) {
            await this.logSecurityEvent('USER_LOGIN_FAILED', {
                username,
                error: error.message,
                clientInfo
            });
            throw error;
        }
    }
    
    /**
     * ตรวจสอบสิทธิ์การเข้าถึง
     */
    async authorize(token, requiredPermissions = [], requiredRoles = []) {
        try {
            // ตรวจสอบ Token
            const decoded = this.verifyToken(token);
            
            // ค้นหาผู้ใช้
            const user = Array.from(this.users.values()).find(u => u.id === decoded.userId);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }
            
            // ตรวจสอบ Roles
            if (requiredRoles.length > 0) {
                const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
                if (!hasRequiredRole) {
                    throw new Error('Insufficient role permissions');
                }
            }
            
            // ตรวจสอบ Permissions
            if (requiredPermissions.length > 0) {
                const hasRequiredPermission = requiredPermissions.every(permission => 
                    user.permissions.includes(permission) || user.roles.includes('admin')
                );
                if (!hasRequiredPermission) {
                    throw new Error('Insufficient permissions');
                }
            }
            
            return {
                authorized: true,
                user: {
                    id: user.id,
                    username: user.username,
                    roles: user.roles,
                    permissions: user.permissions
                }
            };
            
        } catch (error) {
            await this.logSecurityEvent('AUTHORIZATION_FAILED', {
                error: error.message,
                requiredPermissions,
                requiredRoles
            });
            throw error;
        }
    }
    
    /**
     * ตรวจสอบ Rate Limiting
     */
    checkRateLimit(identifier) {
        if (!identifier) return true;
        
        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        
        if (!this.rateLimits.has(identifier)) {
            this.rateLimits.set(identifier, []);
        }
        
        const requests = this.rateLimits.get(identifier);
        
        // ลบ requests ที่เก่าเกินไป
        const validRequests = requests.filter(time => time > windowStart);
        
        if (validRequests.length >= this.config.rateLimitMax) {
            return false;
        }
        
        // เพิ่ม request ใหม่
        validRequests.push(now);
        this.rateLimits.set(identifier, validRequests);
        
        return true;
    }
    
    /**
     * บันทึกความพยายามเข้าสู่ระบบที่ล้มเหลว
     */
    async recordFailedLogin(username, clientInfo) {
        const now = Date.now();
        
        if (!this.loginAttempts.has(username)) {
            this.loginAttempts.set(username, []);
        }
        
        const attempts = this.loginAttempts.get(username);
        attempts.push({ timestamp: now, clientInfo });
        
        // ลบความพยายามที่เก่าเกินไป
        const validAttempts = attempts.filter(attempt => 
            now - attempt.timestamp < this.config.lockoutDuration
        );
        
        this.loginAttempts.set(username, validAttempts);
        
        // บันทึก Security Event
        await this.logSecurityEvent('LOGIN_ATTEMPT_FAILED', {
            username,
            attemptCount: validAttempts.length,
            clientInfo
        });
    }
    
    /**
     * ตรวจสอบว่าบัญชีถูกล็อคหรือไม่
     */
    isAccountLocked(username) {
        const attempts = this.loginAttempts.get(username);
        if (!attempts) return false;
        
        const now = Date.now();
        const recentAttempts = attempts.filter(attempt => 
            now - attempt.timestamp < this.config.lockoutDuration
        );
        
        return recentAttempts.length >= this.config.maxLoginAttempts;
    }
    
    /**
     * บันทึก Security Event
     */
    async logSecurityEvent(eventType, eventData) {
        if (!this.config.enableSecurityLogging) return;
        
        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp: new Date().toISOString(),
            data: eventData,
            severity: this.getEventSeverity(eventType)
        };
        
        this.securityEvents.push(event);
        
        // เก็บเฉพาะ events ล่าสุด 1000 รายการ
        if (this.securityEvents.length > 1000) {
            this.securityEvents = this.securityEvents.slice(-1000);
        }
        
        // เขียนลงไฟล์ log
        try {
            const logEntry = `${event.timestamp} [${event.severity}] ${event.type}: ${JSON.stringify(event.data)}\n`;
            await fs.appendFile(this.config.securityLogFile, logEntry);
        } catch (error) {
            console.error('Failed to write security log:', error.message);
        }
        
        // ส่ง Event
        this.emit('securityEvent', event);
    }
    
    /**
     * กำหนดระดับความรุนแรงของ Event
     */
    getEventSeverity(eventType) {
        const severityMap = {
            'USER_LOGIN_SUCCESS': 'INFO',
            'USER_LOGIN_FAILED': 'WARNING',
            'USER_CREATED': 'INFO',
            'USER_CREATION_FAILED': 'ERROR',
            'AUTHORIZATION_FAILED': 'WARNING',
            'LOGIN_ATTEMPT_FAILED': 'WARNING',
            'SUSPICIOUS_ACTIVITY': 'CRITICAL',
            'INTRUSION_DETECTED': 'CRITICAL'
        };
        
        return severityMap[eventType] || 'INFO';
    }
    
    /**
     * เริ่มต้นระบบตรวจสอบความปลอดภัย
     */
    startSecurityMonitoring() {
        if (!this.config.enableIntrusionDetection) return;
        
        // ตรวจสอบทุก 5 นาที
        setInterval(() => {
            this.detectSuspiciousActivity();
        }, 5 * 60 * 1000);
        
        console.log('🛡️  เริ่มต้นระบบตรวจสอบความปลอดภัย');
    }
    
    /**
     * ตรวจจับกิจกรรมที่น่าสงสัย
     */
    async detectSuspiciousActivity() {
        const now = Date.now();
        const timeWindow = 10 * 60 * 1000; // 10 นาที
        
        // ตรวจสอบการเข้าสู่ระบบล้มเหลวจำนวนมาก
        const recentFailedLogins = this.securityEvents.filter(event => 
            event.type === 'LOGIN_ATTEMPT_FAILED' && 
            now - new Date(event.timestamp).getTime() < timeWindow
        );
        
        if (recentFailedLogins.length > 20) {
            await this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
                type: 'MULTIPLE_FAILED_LOGINS',
                count: recentFailedLogins.length,
                timeWindow: '10 minutes'
            });
        }
        
        // ตรวจสอบการเข้าถึงจาก IP ที่น่าสงสัย
        const ipCounts = new Map();
        recentFailedLogins.forEach(event => {
            const ip = event.data.clientInfo?.ip;
            if (ip) {
                ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
            }
        });
        
        for (const [ip, count] of ipCounts) {
            if (count > 10) {
                await this.logSecurityEvent('INTRUSION_DETECTED', {
                    type: 'SUSPICIOUS_IP',
                    ip,
                    failedAttempts: count,
                    timeWindow: '10 minutes'
                });
            }
        }
    }
    
    /**
     * โหลดข้อมูลผู้ใช้
     */
    async loadUsers() {
        try {
            const data = await fs.readFile(this.config.usersFile, 'utf8');
            const users = JSON.parse(data);
            
            this.users.clear();
            users.forEach(user => {
                this.users.set(user.username, user);
            });
            
            console.log(`👥 โหลดข้อมูลผู้ใช้ ${users.length} คน`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading users:', error.message);
            }
        }
    }
    
    /**
     * บันทึกข้อมูลผู้ใช้
     */
    async saveUsers() {
        try {
            const users = Array.from(this.users.values());
            await fs.writeFile(this.config.usersFile, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('Error saving users:', error.message);
        }
    }
    
    /**
     * โหลดข้อมูลบทบาท
     */
    async loadRoles() {
        try {
            const data = await fs.readFile(this.config.rolesFile, 'utf8');
            const roles = JSON.parse(data);
            
            this.roles.clear();
            roles.forEach(role => {
                this.roles.set(role.name, role);
            });
            
            console.log(`🎭 โหลดข้อมูลบทบาท ${roles.length} บทบาท`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading roles:', error.message);
            }
            
            // สร้างบทบาทเริ่มต้น
            await this.createDefaultRoles();
        }
    }
    
    /**
     * สร้างบทบาทเริ่มต้น
     */
    async createDefaultRoles() {
        const defaultRoles = [
            {
                name: 'admin',
                description: 'System Administrator',
                permissions: ['*']
            },
            {
                name: 'user',
                description: 'Regular User',
                permissions: ['read', 'write']
            },
            {
                name: 'readonly',
                description: 'Read-only User',
                permissions: ['read']
            }
        ];
        
        defaultRoles.forEach(role => {
            this.roles.set(role.name, role);
        });
        
        await this.saveRoles();
        console.log('🎭 สร้างบทบาทเริ่มต้น');
    }
    
    /**
     * บันทึกข้อมูลบทบาท
     */
    async saveRoles() {
        try {
            const roles = Array.from(this.roles.values());
            await fs.writeFile(this.config.rolesFile, JSON.stringify(roles, null, 2));
        } catch (error) {
            console.error('Error saving roles:', error.message);
        }
    }
    
    /**
     * สร้างผู้ใช้ admin เริ่มต้น
     */
    async createDefaultAdmin() {
        if (this.users.has('admin')) {
            return; // มี admin อยู่แล้ว
        }
        
        const defaultPassword = this.generateRandomPassword();
        
        await this.createUser({
            username: 'admin',
            password: defaultPassword,
            email: 'admin@git-memory-mcp.local',
            roles: ['admin'],
            permissions: ['*']
        });
        
        console.log('👑 สร้างผู้ใช้ admin เริ่มต้น');
        console.log(`🔑 รหัสผ่าน admin: ${defaultPassword}`);
        console.log('⚠️  กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก');
    }
    
    /**
     * สร้างรหัสผ่านแบบสุ่ม
     */
    generateRandomPassword(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        return password;
    }
    
    /**
     * สร้าง User ID
     */
    generateUserId() {
        return 'user_' + crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * สร้าง Session ID
     */
    generateSessionId() {
        return 'session_' + crypto.randomBytes(16).toString('hex');
    }
    
    /**
     * สร้าง Event ID
     */
    generateEventId() {
        return 'event_' + crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * ดึงสถิติความปลอดภัย
     */
    getSecurityStats() {
        const now = Date.now();
        const last24h = now - 24 * 60 * 60 * 1000;
        
        const recentEvents = this.securityEvents.filter(event => 
            new Date(event.timestamp).getTime() > last24h
        );
        
        const eventCounts = {};
        recentEvents.forEach(event => {
            eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        });
        
        return {
            totalUsers: this.users.size,
            activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
            totalSessions: this.sessions.size,
            recentEvents: recentEvents.length,
            eventCounts,
            lockedAccounts: Array.from(this.loginAttempts.keys()).filter(username => 
                this.isAccountLocked(username)
            ).length
        };
    }
    
    /**
     * ปิดระบบความปลอดภัย
     */
    async shutdown() {
        console.log('🔐 ปิดระบบ Security Manager...');
        
        // บันทึกข้อมูลทั้งหมด
        await this.saveUsers();
        await this.saveRoles();
        
        // ล้าง sessions
        this.sessions.clear();
        
        console.log('✅ Security Manager ปิดระบบเรียบร้อย');
    }
}

// เรียกใช้งานจาก command line
if (require.main === module) {
    const securityManager = new SecurityManager();
    
    // จัดการ graceful shutdown
    process.on('SIGINT', async () => {
        await securityManager.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await securityManager.shutdown();
        process.exit(0);
    });
}

module.exports = SecurityManager;