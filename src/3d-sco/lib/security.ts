import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Security headers configuration
export const securityHeaders = {
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
export class InputValidator {
  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate username (alphanumeric, underscore, hyphen)
  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
  }

  // Validate password strength
  static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
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
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate and sanitize SQL input
  static sanitizeSqlInput(input: string): string {
    // Remove potential SQL injection patterns
    return input
      .replace(/[';"\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .trim();
  }

  // Validate file upload
  static validateFileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    } = options;

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

// CSRF protection
export class CSRFProtection {
  private static readonly SECRET_KEY = process.env.CSRF_SECRET || (() => {
    console.warn('Warning: CSRF_SECRET not set in environment variables. Using insecure default.');
    return 'default-csrf-secret';
  })();

  // Generate CSRF token
  static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(data)
      .digest('hex');
    
    return Buffer.from(`${data}:${signature}`).toString('base64');
  }

  // Verify CSRF token
  static verifyToken(token: string, sessionId: string): boolean {
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
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(data)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}

// Request validation
export class RequestValidator {
  // Check for suspicious patterns in request
  static isSuspiciousRequest(request: NextRequest): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
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
  static isValidOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true; // Allow requests without origin (same-origin)
    
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      return origin === allowed;
    });
  }
}

// Security logging
export class SecurityLogger {
  static logSecurityEvent(event: {
    type: 'RATE_LIMIT' | 'SUSPICIOUS_REQUEST' | 'AUTH_FAILURE' | 'CSRF_VIOLATION' | 'INVALID_ORIGIN';
    ip: string;
    userAgent?: string;
    url?: string;
    details?: any;
  }): void {
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

// Generate secure random strings
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Hash sensitive data
export function hashSensitiveData(data: string, salt?: string): {
  hash: string;
  salt: string;
} {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
  
  return { hash, salt: actualSalt };
}

// Verify hashed data
export function verifyHashedData(data: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}