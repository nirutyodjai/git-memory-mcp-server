"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogger = exports.RequestValidator = exports.CSRFProtection = exports.InputValidator = exports.securityHeaders = void 0;
exports.generateSecureRandom = generateSecureRandom;
exports.hashSensitiveData = hashSensitiveData;
exports.verifyHashedData = verifyHashedData;
const crypto_1 = __importDefault(require("crypto"));
// Security headers configuration
exports.securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Content Security Policy (very permissive for Spline 3D models)
    'Content-Security-Policy': [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https:",
        "style-src 'self' 'unsafe-inline' data:",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https:",
        "connect-src 'self' ws: wss: blob: data: https:",
        "worker-src 'self' blob: data:",
        "child-src 'self' blob: data:",
        "object-src 'self' blob: data:",
        "media-src 'self' blob: data:",
        "manifest-src 'self'",
        "frame-ancestors 'none'"
    ].join('; '),
    // Permissions policy
    'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()'
    ].join(', ')
};
// Input validation and sanitization
class InputValidator {
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    // Validate username (alphanumeric, underscore, hyphen)
    static isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
        return usernameRegex.test(username);
    }
    // Validate password strength
    static isStrongPassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
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
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    // Sanitize HTML input
    static sanitizeHtml(input) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    // Validate and sanitize SQL input
    static sanitizeSqlInput(input) {
        // Remove potential SQL injection patterns
        return input
            .replace(/[';"\\]/g, '')
            .replace(/--/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '')
            .trim();
    }
    // Validate file upload
    static validateFileUpload(file, options = {}) {
        const errors = [];
        const { maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] } = options;
        // Check file size
        if (file.size > maxSize) {
            errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        }
        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} is not allowed`);
        }
        // Check file extension
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            errors.push(`File extension ${extension} is not allowed`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.InputValidator = InputValidator;
// CSRF protection
class CSRFProtection {
    // Generate CSRF token
    static generateToken(sessionId) {
        const timestamp = Date.now().toString();
        const data = `${sessionId}:${timestamp}`;
        const signature = crypto_1.default
            .createHmac('sha256', this.SECRET_KEY)
            .update(data)
            .digest('hex');
        return Buffer.from(`${data}:${signature}`).toString('base64');
    }
    // Verify CSRF token
    static verifyToken(token, sessionId) {
        try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [receivedSessionId, timestamp, signature] = decoded.split(':');
            // Check if session ID matches
            if (receivedSessionId !== sessionId) {
                return false;
            }
            // Check if token is not too old (1 hour)
            const tokenAge = Date.now() - parseInt(timestamp);
            if (tokenAge > 60 * 60 * 1000) {
                return false;
            }
            // Verify signature
            const data = `${receivedSessionId}:${timestamp}`;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.SECRET_KEY)
                .update(data)
                .digest('hex');
            return signature === expectedSignature;
        }
        catch {
            return false;
        }
    }
}
exports.CSRFProtection = CSRFProtection;
CSRFProtection.SECRET_KEY = process.env.CSRF_SECRET || 'default-csrf-secret';
// Request validation
class RequestValidator {
    // Check for suspicious patterns in request
    static isSuspiciousRequest(request) {
        const reasons = [];
        const url = request.url;
        const userAgent = request.headers.get('user-agent') || '';
        const referer = request.headers.get('referer') || '';
        // Check for common attack patterns in URL
        const suspiciousPatterns = [
            /\.\.\//, // Directory traversal
            /<script/i, // XSS attempts
            /union.*select/i, // SQL injection
            /exec\(/i, // Code execution
            /eval\(/i, // Code evaluation
            /javascript:/i, // JavaScript protocol
            /vbscript:/i, // VBScript protocol
            /data:.*base64/i, // Base64 data URLs
        ];
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(url)) {
                reasons.push(`Suspicious pattern in URL: ${pattern.source}`);
            }
        }
        // Check for bot-like user agents
        const botPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /java/i,
        ];
        const isBotUserAgent = botPatterns.some(pattern => pattern.test(userAgent));
        if (isBotUserAgent && !userAgent.includes('Googlebot') && !userAgent.includes('Bingbot')) {
            reasons.push('Suspicious user agent detected');
        }
        // Check for missing or suspicious referer
        if (request.method === 'POST' && !referer && !request.url.includes('/api/')) {
            reasons.push('Missing referer for POST request');
        }
        return {
            isSuspicious: reasons.length > 0,
            reasons
        };
    }
    // Validate request origin
    static isValidOrigin(request, allowedOrigins) {
        const origin = request.headers.get('origin');
        if (!origin)
            return true; // Allow requests without origin (same-origin)
        return allowedOrigins.some(allowed => {
            if (allowed === '*')
                return true;
            if (allowed.startsWith('*.')) {
                const domain = allowed.slice(2);
                return origin.endsWith(domain);
            }
            return origin === allowed;
        });
    }
}
exports.RequestValidator = RequestValidator;
// Security logging
class SecurityLogger {
    static logSecurityEvent(event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'SECURITY',
            ...event
        };
        // In production, you would send this to a proper logging service
        console.warn('[SECURITY]', JSON.stringify(logEntry));
        // You could also store in database or send to external monitoring service
        // Example: await storeSecurityLog(logEntry);
    }
}
exports.SecurityLogger = SecurityLogger;
// Generate secure random strings
function generateSecureRandom(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
// Hash sensitive data
function hashSensitiveData(data, salt) {
    const actualSalt = salt || crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
}
// Verify hashed data
function verifyHashedData(data, hash, salt) {
    const verifyHash = crypto_1.default.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}
//# sourceMappingURL=security.js.map