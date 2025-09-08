/**
 * NEXUS IDE Security Dashboard - Validation Middleware
 * Enterprise-grade request validation and data sanitization
 */

const Joi = require('joi');
const validator = require('validator');
const { body, query, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validation Middleware Manager
 */
class ValidationMiddleware {
    constructor() {
        this.schemas = this.initializeSchemas();
    }
    
    /**
     * Initialize validation schemas
     */
    initializeSchemas() {
        return {
            // User schemas
            user: {
                login: Joi.object({
                    username: Joi.string().alphanum().min(3).max(30).required(),
                    password: Joi.string().min(8).max(128).required(),
                    rememberMe: Joi.boolean().optional(),
                    mfaCode: Joi.string().length(6).pattern(/^[0-9]+$/).optional()
                }),
                
                register: Joi.object({
                    username: Joi.string().alphanum().min(3).max(30).required(),
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).max(128)
                        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
                    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
                    firstName: Joi.string().min(1).max(50).required(),
                    lastName: Joi.string().min(1).max(50).required(),
                    role: Joi.string().valid('admin', 'user', 'viewer').default('user')
                }),
                
                update: Joi.object({
                    email: Joi.string().email().optional(),
                    firstName: Joi.string().min(1).max(50).optional(),
                    lastName: Joi.string().min(1).max(50).optional(),
                    role: Joi.string().valid('admin', 'user', 'viewer').optional(),
                    isActive: Joi.boolean().optional()
                }),
                
                changePassword: Joi.object({
                    currentPassword: Joi.string().required(),
                    newPassword: Joi.string().min(8).max(128)
                        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
                    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
                })
            },
            
            // Security schemas
            security: {
                audit: Joi.object({
                    type: Joi.string().valid('system', 'application', 'network', 'compliance').required(),
                    target: Joi.string().min(1).max(255).optional(),
                    parameters: Joi.object().optional()
                }),
                
                scan: Joi.object({
                    type: Joi.string().valid('vulnerability', 'malware', 'configuration').required(),
                    scope: Joi.string().valid('full', 'quick', 'custom').default('quick'),
                    targets: Joi.array().items(Joi.string()).optional()
                }),
                
                policy: Joi.object({
                    name: Joi.string().min(1).max(100).required(),
                    description: Joi.string().max(500).optional(),
                    rules: Joi.array().items(Joi.object()).required(),
                    enabled: Joi.boolean().default(true),
                    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
                })
            },
            
            // Configuration schemas
            config: {
                update: Joi.object({
                    category: Joi.string().valid('security', 'monitoring', 'alerts', 'general').required(),
                    settings: Joi.object().required()
                }),
                
                backup: Joi.object({
                    type: Joi.string().valid('full', 'incremental', 'differential').default('incremental'),
                    compression: Joi.boolean().default(true),
                    encryption: Joi.boolean().default(true),
                    destination: Joi.string().valid('local', 'cloud', 'both').default('local')
                })
            },
            
            // Monitoring schemas
            monitoring: {
                alert: Joi.object({
                    type: Joi.string().valid('security', 'performance', 'system', 'custom').required(),
                    severity: Joi.string().valid('info', 'warning', 'error', 'critical').required(),
                    message: Joi.string().min(1).max(1000).required(),
                    metadata: Joi.object().optional()
                }),
                
                threshold: Joi.object({
                    metric: Joi.string().required(),
                    operator: Joi.string().valid('>', '<', '>=', '<=', '==', '!=').required(),
                    value: Joi.number().required(),
                    duration: Joi.number().min(1).max(3600).default(60) // seconds
                })
            },
            
            // Query schemas
            query: {
                pagination: Joi.object({
                    page: Joi.number().integer().min(1).default(1),
                    limit: Joi.number().integer().min(1).max(100).default(20),
                    sortBy: Joi.string().optional(),
                    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
                }),
                
                dateRange: Joi.object({
                    startDate: Joi.date().iso().optional(),
                    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
                    period: Joi.string().valid('1h', '6h', '12h', '24h', '7d', '30d').optional()
                }),
                
                filter: Joi.object({
                    status: Joi.string().valid('active', 'inactive', 'pending', 'resolved').optional(),
                    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
                    type: Joi.string().optional(),
                    search: Joi.string().max(255).optional()
                })
            }
        };
    }
    
    /**
     * Generic validation middleware
     */
    validate(schema, source = 'body') {
        return (req, res, next) => {
            try {
                const data = req[source];
                const { error, value } = schema.validate(data, {
                    abortEarly: false,
                    stripUnknown: true,
                    convert: true
                });
                
                if (error) {
                    const errors = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value
                    }));
                    
                    logger.warn('Validation failed', {
                        source,
                        errors,
                        ip: req.ip,
                        path: req.path
                    });
                    
                    return res.status(400).json({
                        error: 'Validation failed',
                        message: 'Request data is invalid',
                        details: errors
                    });
                }
                
                // Replace original data with validated and sanitized data
                req[source] = value;
                next();
            } catch (err) {
                logger.error('Validation middleware error', {
                    error: err.message,
                    stack: err.stack,
                    path: req.path
                });
                
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Validation processing failed'
                });
            }
        };
    }
    
    /**
     * Express-validator based validation
     */
    expressValidate(validations) {
        return async (req, res, next) => {
            // Run all validations
            await Promise.all(validations.map(validation => validation.run(req)));
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const formattedErrors = errors.array().map(error => ({
                    field: error.param,
                    message: error.msg,
                    value: error.value,
                    location: error.location
                }));
                
                logger.warn('Express validation failed', {
                    errors: formattedErrors,
                    ip: req.ip,
                    path: req.path
                });
                
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Request data is invalid',
                    details: formattedErrors
                });
            }
            
            next();
        };
    }
    
    /**
     * User login validation
     */
    validateLogin() {
        return this.validate(this.schemas.user.login);
    }
    
    /**
     * User registration validation
     */
    validateRegistration() {
        return this.validate(this.schemas.user.register);
    }
    
    /**
     * User update validation
     */
    validateUserUpdate() {
        return this.validate(this.schemas.user.update);
    }
    
    /**
     * Password change validation
     */
    validatePasswordChange() {
        return this.validate(this.schemas.user.changePassword);
    }
    
    /**
     * Security audit validation
     */
    validateSecurityAudit() {
        return this.validate(this.schemas.security.audit);
    }
    
    /**
     * Security scan validation
     */
    validateSecurityScan() {
        return this.validate(this.schemas.security.scan);
    }
    
    /**
     * Security policy validation
     */
    validateSecurityPolicy() {
        return this.validate(this.schemas.security.policy);
    }
    
    /**
     * Configuration update validation
     */
    validateConfigUpdate() {
        return this.validate(this.schemas.config.update);
    }
    
    /**
     * Backup configuration validation
     */
    validateBackupConfig() {
        return this.validate(this.schemas.config.backup);
    }
    
    /**
     * Alert validation
     */
    validateAlert() {
        return this.validate(this.schemas.monitoring.alert);
    }
    
    /**
     * Threshold validation
     */
    validateThreshold() {
        return this.validate(this.schemas.monitoring.threshold);
    }
    
    /**
     * Query pagination validation
     */
    validatePagination() {
        return this.validate(this.schemas.query.pagination, 'query');
    }
    
    /**
     * Date range validation
     */
    validateDateRange() {
        return this.validate(this.schemas.query.dateRange, 'query');
    }
    
    /**
     * Filter validation
     */
    validateFilter() {
        return this.validate(this.schemas.query.filter, 'query');
    }
    
    /**
     * ID parameter validation
     */
    validateId() {
        return this.expressValidate([
            param('id').isMongoId().withMessage('Invalid ID format')
        ]);
    }
    
    /**
     * UUID parameter validation
     */
    validateUUID() {
        return this.expressValidate([
            param('id').isUUID().withMessage('Invalid UUID format')
        ]);
    }
    
    /**
     * Email validation
     */
    validateEmail() {
        return this.expressValidate([
            body('email').isEmail().normalizeEmail().withMessage('Invalid email format')
        ]);
    }
    
    /**
     * File upload validation
     */
    validateFileUpload(options = {}) {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            required = false
        } = options;
        
        return (req, res, next) => {
            if (!req.file && required) {
                return res.status(400).json({
                    error: 'File required',
                    message: 'A file must be uploaded'
                });
            }
            
            if (req.file) {
                // Check file size
                if (req.file.size > maxSize) {
                    return res.status(400).json({
                        error: 'File too large',
                        message: `File size must be less than ${maxSize / 1024 / 1024}MB`
                    });
                }
                
                // Check file type
                if (!allowedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        error: 'Invalid file type',
                        message: `Allowed types: ${allowedTypes.join(', ')}`
                    });
                }
                
                // Sanitize filename
                req.file.originalname = validator.escape(req.file.originalname);
            }
            
            next();
        };
    }
    
    /**
     * JSON validation middleware
     */
    validateJSON() {
        return (req, res, next) => {
            if (req.is('application/json')) {
                try {
                    if (typeof req.body === 'string') {
                        req.body = JSON.parse(req.body);
                    }
                } catch (error) {
                    logger.warn('Invalid JSON in request', {
                        error: error.message,
                        ip: req.ip,
                        path: req.path
                    });
                    
                    return res.status(400).json({
                        error: 'Invalid JSON',
                        message: 'Request body contains invalid JSON'
                    });
                }
            }
            next();
        };
    }
    
    /**
     * Custom validation function
     */
    custom(validationFn, errorMessage = 'Validation failed') {
        return (req, res, next) => {
            try {
                const isValid = validationFn(req);
                if (!isValid) {
                    return res.status(400).json({
                        error: 'Validation failed',
                        message: errorMessage
                    });
                }
                next();
            } catch (error) {
                logger.error('Custom validation error', {
                    error: error.message,
                    stack: error.stack,
                    path: req.path
                });
                
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Validation processing failed'
                });
            }
        };
    }
    
    /**
     * Sanitize HTML content
     */
    sanitizeHTML(fields = []) {
        return (req, res, next) => {
            const sanitizeValue = (value) => {
                if (typeof value === 'string') {
                    return validator.escape(value);
                }
                return value;
            };
            
            const sanitizeObject = (obj, fieldsToSanitize) => {
                for (const field of fieldsToSanitize) {
                    if (obj[field] !== undefined) {
                        if (Array.isArray(obj[field])) {
                            obj[field] = obj[field].map(sanitizeValue);
                        } else {
                            obj[field] = sanitizeValue(obj[field]);
                        }
                    }
                }
            };
            
            if (fields.length === 0) {
                // Sanitize all string fields
                const sanitizeAll = (obj) => {
                    for (const key in obj) {
                        if (typeof obj[key] === 'string') {
                            obj[key] = sanitizeValue(obj[key]);
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            sanitizeAll(obj[key]);
                        }
                    }
                };
                
                if (req.body) sanitizeAll(req.body);
                if (req.query) sanitizeAll(req.query);
            } else {
                // Sanitize specific fields
                if (req.body) sanitizeObject(req.body, fields);
                if (req.query) sanitizeObject(req.query, fields);
            }
            
            next();
        };
    }
    
    /**
     * Rate limiting validation
     */
    validateRateLimit(windowMs = 15 * 60 * 1000, max = 100) {
        const requests = new Map();
        
        return (req, res, next) => {
            const key = req.ip;
            const now = Date.now();
            
            // Clean old requests
            const userRequests = requests.get(key) || [];
            const validRequests = userRequests.filter(time => now - time < windowMs);
            
            if (validRequests.length >= max) {
                logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    requests: validRequests.length,
                    limit: max
                });
                
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.round(windowMs / 1000)
                });
            }
            
            // Add current request
            validRequests.push(now);
            requests.set(key, validRequests);
            
            next();
        };
    }
    
    /**
     * Content type validation
     */
    validateContentType(allowedTypes = ['application/json']) {
        return (req, res, next) => {
            const contentType = req.get('Content-Type');
            
            if (req.method !== 'GET' && req.method !== 'DELETE') {
                if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
                    return res.status(415).json({
                        error: 'Unsupported media type',
                        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
                    });
                }
            }
            
            next();
        };
    }
    
    /**
     * Get validation schema by name
     */
    getSchema(schemaPath) {
        const parts = schemaPath.split('.');
        let schema = this.schemas;
        
        for (const part of parts) {
            schema = schema[part];
            if (!schema) {
                throw new Error(`Schema not found: ${schemaPath}`);
            }
        }
        
        return schema;
    }
    
    /**
     * Add custom schema
     */
    addSchema(name, schema) {
        const parts = name.split('.');
        let current = this.schemas;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = schema;
    }
}

// Create singleton instance
const validationMiddleware = new ValidationMiddleware();

module.exports = {
    ValidationMiddleware,
    validationMiddleware
};