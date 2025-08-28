import { NextRequest } from 'next/server';
export declare const securityHeaders: {
    'X-Frame-Options': string;
    'X-Content-Type-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'Content-Security-Policy': string;
    'Permissions-Policy': string;
};
export declare class InputValidator {
    static isValidEmail(email: string): boolean;
    static isValidUsername(username: string): boolean;
    static isStrongPassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static sanitizeHtml(input: string): string;
    static sanitizeSqlInput(input: string): string;
    static validateFileUpload(file: File, options?: {
        maxSize?: number;
        allowedTypes?: string[];
        allowedExtensions?: string[];
    }): {
        isValid: boolean;
        errors: string[];
    };
}
export declare class CSRFProtection {
    private static readonly SECRET_KEY;
    static generateToken(sessionId: string): string;
    static verifyToken(token: string, sessionId: string): boolean;
}
export declare class RequestValidator {
    static isSuspiciousRequest(request: NextRequest): {
        isSuspicious: boolean;
        reasons: string[];
    };
    static isValidOrigin(request: NextRequest, allowedOrigins: string[]): boolean;
}
export declare class SecurityLogger {
    static logSecurityEvent(event: {
        type: 'RATE_LIMIT' | 'SUSPICIOUS_REQUEST' | 'AUTH_FAILURE' | 'CSRF_VIOLATION' | 'INVALID_ORIGIN';
        ip: string;
        userAgent?: string;
        url?: string;
        details?: any;
    }): void;
}
export declare function generateSecureRandom(length?: number): string;
export declare function hashSensitiveData(data: string, salt?: string): {
    hash: string;
    salt: string;
};
export declare function verifyHashedData(data: string, hash: string, salt: string): boolean;
//# sourceMappingURL=security.d.ts.map