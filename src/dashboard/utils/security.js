/**
 * NEXUS IDE Security Dashboard - Advanced Security Utilities
 * Enterprise-grade security utilities and helpers
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { SECURITY } = require('../config/dashboard-config');
const logger = require('./logger');

/**
 * Encryption Utilities
 */
class EncryptionUtils {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        this.saltLength = 32;
    }
    
    /**
     * Generate a secure random key
     */
    generateKey() {
        return crypto.randomBytes(this.keyLength);
    }
    
    /**
     * Derive key from password using PBKDF2
     */
    deriveKey(password, salt, iterations = 100000) {
        return crypto.pbkdf2Sync(password, salt, iterations, this.keyLength, 'sha256');
    }
    
    /**
     * Encrypt data with AES-256-GCM
     */
    encrypt(data, key) {
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, key, iv);
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        } catch (error) {
            logger.error('Encryption failed', { error: error.message });
            throw new Error('Encryption failed');
        }
    }
    
    /**
     * Decrypt data with AES-256-GCM
     */
    decrypt(encryptedData, key) {
        try {
            const { encrypted, iv, tag } = encryptedData;
            const decipher = crypto.createDecipher(this.algorithm, key, Buffer.from(iv, 'hex'));
            
            decipher.setAuthTag(Buffer.from(tag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            logger.error('Decryption failed', { error: error.message });
            throw new Error('Decryption failed');
        }
    }
    
    /**
     * Hash data with SHA-256
     */
    hash(data, salt = '') {
        return crypto.createHash('sha256').update(data + salt).digest('hex');
    }
    
    /**
     * Generate HMAC
     */
    generateHMAC(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }
    
    /**
     * Verify HMAC
     */
    verifyHMAC(data, secret, signature) {
        const expectedSignature = this.generateHMAC(data, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }
}

/**
 * Password Security Utilities
 */
class PasswordUtils {
    constructor() {
        this.saltRounds = 12;
        this.minLength = 8;
        this.maxLength = 128;
    }
    
    /**
     * Hash password with bcrypt
     */
    async hashPassword(password) {
        try {
            if (!this.validatePassword(password)) {
                throw new Error('Password does not meet security requirements');
            }
            
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            logger.error('Password hashing failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('Password verification failed', { error: error.message });
            return false;
        }
    }
    
    /**
     * Validate password strength
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, errors: ['Password is required'] };
        }
        
        const errors = [];
        
        // Length check
        if (password.length < this.minLength) {
            errors.push(`Password must be at least ${this.minLength} characters long`);
        }
        
        if (password.length > this.maxLength) {
            errors.push(`Password must not exceed ${this.maxLength} characters`);
        }
        
        // Complexity checks
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        // Common password check
        if (this.isCommonPassword(password)) {
            errors.push('Password is too common');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }
    
    /**
     * Calculate password strength score
     */
    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length bonus
        score += Math.min(password.length * 2, 20);
        
        // Character variety bonus
        if (/[a-z]/.test(password)) score += 5;
        if (/[A-Z]/.test(password)) score += 5;
        if (/\d/.test(password)) score += 5;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
        
        // Pattern penalties
        if (/(..).*\1/.test(password)) score -= 10; // Repeated patterns
        if (/^\d+$/.test(password)) score -= 20; // Only numbers
        if (/^[a-zA-Z]+$/.test(password)) score -= 10; // Only letters
        
        // Normalize to 0-100
        score = Math.max(0, Math.min(100, score));
        
        if (score < 30) return 'weak';
        if (score < 60) return 'medium';
        if (score < 80) return 'strong';
        return 'very-strong';
    }
    
    /**
     * Check if password is commonly used
     */
    isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            'dragon', 'master', 'shadow', 'superman', 'michael'
        ];
        
        return commonPasswords.includes(password.toLowerCase());
    }
    
    /**
     * Generate secure random password
     */
    generateSecurePassword(length = 16) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';
        
        // Ensure at least one character from each category
        password += lowercase[crypto.randomInt(lowercase.length)];
        password += uppercase[crypto.randomInt(uppercase.length)];
        password += numbers[crypto.randomInt(numbers.length)];
        password += symbols[crypto.randomInt(symbols.length)];
        
        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += allChars[crypto.randomInt(allChars.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
    }
}

/**
 * JWT Token Utilities
 */
class TokenUtils {
    constructor() {
        this.accessTokenExpiry = '15m';
        this.refreshTokenExpiry = '7d';
        this.issuer = 'nexus-security-dashboard';
    }
    
    /**
     * Generate JWT access token
     */
    generateAccessToken(payload, options = {}) {
        const tokenPayload = {
            ...payload,
            type: 'access',
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID()
        };
        
        return jwt.sign(tokenPayload, SECURITY.jwtSecret, {
            expiresIn: options.expiresIn || this.accessTokenExpiry,
            issuer: this.issuer,
            algorithm: 'HS256'
        });
    }
    
    /**
     * Generate JWT refresh token
     */
    generateRefreshToken(payload, options = {}) {
        const tokenPayload = {
            ...payload,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID()
        };
        
        return jwt.sign(tokenPayload, SECURITY.jwtSecret, {
            expiresIn: options.expiresIn || this.refreshTokenExpiry,
            issuer: this.issuer,
            algorithm: 'HS256'
        });
    }
    
    /**
     * Verify JWT token
     */
    verifyToken(token, options = {}) {
        try {
            return jwt.verify(token, SECURITY.jwtSecret, {
                issuer: this.issuer,
                algorithms: ['HS256'],
                ...options
            });
        } catch (error) {
            logger.warn('Token verification failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Decode token without verification
     */
    decodeToken(token) {
        return jwt.decode(token, { complete: true });
    }
    
    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.payload.exp) {
                return true;
            }
            
            return Date.now() >= decoded.payload.exp * 1000;
        } catch (error) {
            return true;
        }
    }
    
    /**
     * Generate token pair (access + refresh)
     */
    generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
            expiresIn: this.accessTokenExpiry
        };
    }
}

/**
 * Multi-Factor Authentication Utilities
 */
class MFAUtils {
    constructor() {
        this.serviceName = 'NEXUS Security Dashboard';
        this.issuer = 'NEXUS IDE';
    }
    
    /**
     * Generate TOTP secret
     */
    generateSecret(userEmail) {
        return speakeasy.generateSecret({
            name: `${this.serviceName} (${userEmail})`,
            issuer: this.issuer,
            length: 32
        });
    }
    
    /**
     * Generate QR code for TOTP setup
     */
    async generateQRCode(secret) {
        try {
            return await QRCode.toDataURL(secret.otpauth_url);
        } catch (error) {
            logger.error('QR code generation failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Verify TOTP token
     */
    verifyTOTP(token, secret, window = 2) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window
        });
    }
    
    /**
     * Generate backup codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto.randomInt(100000, 999999).toString();
            codes.push(code);
        }
        return codes;
    }
    
    /**
     * Hash backup codes for storage
     */
    async hashBackupCodes(codes) {
        const passwordUtils = new PasswordUtils();
        const hashedCodes = [];
        
        for (const code of codes) {
            hashedCodes.push(await passwordUtils.hashPassword(code));
        }
        
        return hashedCodes;
    }
    
    /**
     * Verify backup code
     */
    async verifyBackupCode(code, hashedCodes) {
        const passwordUtils = new PasswordUtils();
        
        for (const hashedCode of hashedCodes) {
            if (await passwordUtils.verifyPassword(code, hashedCode)) {
                return true;
            }
        }
        
        return false;
    }
}

/**
 * Input Validation and Sanitization
 */
class ValidationUtils {
    /**
     * Sanitize HTML input
     */
    sanitizeHtml(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        return validator.escape(input);
    }
    
    /**
     * Validate email address
     */
    validateEmail(email) {
        return validator.isEmail(email) && email.length <= 254;
    }
    
    /**
     * Validate URL
     */
    validateUrl(url) {
        return validator.isURL(url, {
            protocols: ['http', 'https'],
            require_protocol: true
        });
    }
    
    /**
     * Validate IP address
     */
    validateIP(ip) {
        return validator.isIP(ip);
    }
    
    /**
     * Validate UUID
     */
    validateUUID(uuid) {
        return validator.isUUID(uuid);
    }
    
    /**
     * Sanitize filename
     */
    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
    
    /**
     * Validate JSON
     */
    validateJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Check for SQL injection patterns
     */
    detectSQLInjection(input) {
        const sqlPatterns = [
            /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
            /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
            /(script|javascript|vbscript|onload|onerror|onclick)/i
        ];
        
        return sqlPatterns.some(pattern => pattern.test(input));
    }
    
    /**
     * Check for XSS patterns
     */
    detectXSS(input) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<\s*\w.*?\s*on\w+\s*=.*?>/gi
        ];
        
        return xssPatterns.some(pattern => pattern.test(input));
    }
}

/**
 * Rate Limiting Utilities
 */
class RateLimitUtils {
    /**
     * Create standard rate limiter
     */
    createRateLimit(options = {}) {
        return rateLimit({
            windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
            max: options.max || 100, // limit each IP to 100 requests per windowMs
            message: options.message || 'Too many requests from this IP',
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });
                
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: options.message || 'Too many requests from this IP',
                    retryAfter: Math.round(options.windowMs / 1000)
                });
            },
            ...options
        });
    }
    
    /**
     * Create slow down middleware
     */
    createSlowDown(options = {}) {
        return slowDown({
            windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
            delayAfter: options.delayAfter || 50, // allow 50 requests per windowMs without delay
            delayMs: options.delayMs || 500, // add 500ms delay per request after delayAfter
            maxDelayMs: options.maxDelayMs || 20000, // max delay of 20 seconds
            ...options
        });
    }
    
    /**
     * Create login rate limiter
     */
    createLoginRateLimit() {
        return this.createRateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 login requests per windowMs
            message: 'Too many login attempts, please try again later',
            skipSuccessfulRequests: true
        });
    }
    
    /**
     * Create API rate limiter
     */
    createAPIRateLimit() {
        return this.createRateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 60, // limit each IP to 60 API requests per minute
            message: 'API rate limit exceeded'
        });
    }
}

/**
 * Security Headers Utilities
 */
class SecurityHeaders {
    /**
     * Get security headers
     */
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': this.getCSPHeader(),
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }
    
    /**
     * Get Content Security Policy header
     */
    getCSPHeader() {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
            "img-src 'self' data: https:",
            "connect-src 'self' ws: wss:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');
    }
    
    /**
     * Apply security headers middleware
     */
    middleware() {
        return (req, res, next) => {
            const headers = this.getSecurityHeaders();
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            next();
        };
    }
}

// Create instances
const encryptionUtils = new EncryptionUtils();
const passwordUtils = new PasswordUtils();
const tokenUtils = new TokenUtils();
const mfaUtils = new MFAUtils();
const validationUtils = new ValidationUtils();
const rateLimitUtils = new RateLimitUtils();
const securityHeaders = new SecurityHeaders();

// Export utilities
module.exports = {
    EncryptionUtils,
    PasswordUtils,
    TokenUtils,
    MFAUtils,
    ValidationUtils,
    RateLimitUtils,
    SecurityHeaders,
    encryption: encryptionUtils,
    password: passwordUtils,
    token: tokenUtils,
    mfa: mfaUtils,
    validation: validationUtils,
    rateLimit: rateLimitUtils,
    headers: securityHeaders
};