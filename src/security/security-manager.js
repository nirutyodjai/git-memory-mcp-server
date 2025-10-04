import crypto from 'crypto';
import { createLogger } from 'winston';
import { EventEmitter } from 'events';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import xss from 'xss';
import jwt from 'jsonwebtoken';

const logger = createLogger({
  level: 'info',
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.json()
  ),
  transports: [
    new logger.transports.Console(),
    new logger.transports.File({ filename: 'security.log' })
  ]
});

export class SecurityManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Authentication settings
      jwtSecret: options.jwtSecret || this.generateSecureSecret(),
      jwtExpiresIn: options.jwtExpiresIn || '1h',
      sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
      
      // Rate limiting
      rateLimiting: {
        windowMs: options.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
        max: options.rateLimitMax || 100, // requests per window
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        standardHeaders: true,
        legacyHeaders: false
      },
      
      // Input validation
      validation: {
        maxInputLength: options.maxInputLength || 10000,
        allowedFileTypes: options.allowedFileTypes || ['.js', '.json', '.md', '.txt'],
        maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
        sanitizeHtml: options.sanitizeHtml !== false
      },
      
      // Security headers
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      },
      
      // IP filtering
      ipFiltering: {
        enabled: options.enableIpFiltering || false,
        whitelist: options.ipWhitelist || [],
        blacklist: options.ipBlacklist || [],
        maxConnectionsPerIp: options.maxConnectionsPerIp || 10
      },
      
      // Audit logging
      auditLog: {
        enabled: options.enableAuditLog !== false,
        logLevel: options.auditLogLevel || 'info',
        includeRequestBody: options.includeRequestBody || false,
        maxLogSize: options.maxLogSize || 100 * 1024 * 1024 // 100MB
      },
      
      ...options
    };
    
    this.sessions = new Map();
    this.ipConnections = new Map();
    this.securityEvents = [];
    this.blockedIps = new Set();
    
    this.setupSecurityMiddleware();
  }

  // Generate secure secret for JWT
  generateSecureSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Setup security middleware
  setupSecurityMiddleware() {
    // Rate limiting middleware
    this.rateLimiter = rateLimit({
      ...this.config.rateLimiting,
      handler: (req, res) => {
        this.logSecurityEvent('rate_limit_exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        
        res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(this.config.rateLimiting.windowMs / 1000)
        });
      },
      skip: (req) => {
        // Skip rate limiting for whitelisted IPs
        return this.config.ipFiltering.whitelist.includes(req.ip);
      }
    });
    
    // Helmet security headers
    this.helmetMiddleware = helmet(this.config.helmet);
  }

  // Validate and sanitize input
  validateInput(input, type = 'general') {
    const errors = [];
    
    try {
      // Basic validation
      if (typeof input !== 'string') {
        input = String(input);
      }
      
      // Length validation
      if (input.length > this.config.validation.maxInputLength) {
        errors.push(`Input exceeds maximum length of ${this.config.validation.maxInputLength} characters`);
      }
      
      // Type-specific validation
      switch (type) {
        case 'email':
          if (!validator.isEmail(input)) {
            errors.push('Invalid email format');
          }
          break;
          
        case 'url':
          if (!validator.isURL(input, { protocols: ['http', 'https'] })) {
            errors.push('Invalid URL format');
          }
          break;
          
        case 'path':
          if (!this.isValidPath(input)) {
            errors.push('Invalid file path');
          }
          break;
          
        case 'json':
          try {
            JSON.parse(input);
          } catch (e) {
            errors.push('Invalid JSON format');
          }
          break;
          
        case 'alphanumeric':
          if (!validator.isAlphanumeric(input)) {
            errors.push('Input must contain only alphanumeric characters');
          }
          break;
          
        case 'filename':
          if (!this.isValidFilename(input)) {
            errors.push('Invalid filename');
          }
          break;
      }
      
      // XSS protection
      if (this.config.validation.sanitizeHtml) {
        input = xss(input, {
          whiteList: {}, // No HTML tags allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      }
      
      // SQL injection protection (basic)
      if (this.containsSqlInjection(input)) {
        errors.push('Potentially malicious input detected');
        this.logSecurityEvent('sql_injection_attempt', { input: input.substring(0, 100) });
      }
      
      // Command injection protection
      if (this.containsCommandInjection(input)) {
        errors.push('Command injection attempt detected');
        this.logSecurityEvent('command_injection_attempt', { input: input.substring(0, 100) });
      }
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: input
    };
  }

  // Validate file path
  isValidPath(path) {
    // Prevent directory traversal
    if (path.includes('..') || path.includes('~')) {
      return false;
    }
    
    // Check for null bytes
    if (path.includes('\0')) {
      return false;
    }
    
    // Validate against allowed patterns
    const pathRegex = /^[a-zA-Z0-9\-_./\\:]+$/;
    return pathRegex.test(path);
  }

  // Validate filename
  isValidFilename(filename) {
    // Basic filename validation
    const filenameRegex = /^[a-zA-Z0-9\-_. ]+$/;
    if (!filenameRegex.test(filename)) {
      return false;
    }
    
    // Check file extension
    const ext = filename.substring(filename.lastIndexOf('.'));
    if (ext && !this.config.validation.allowedFileTypes.includes(ext.toLowerCase())) {
      return false;
    }
    
    return true;
  }

  // Check for SQL injection patterns
  containsSqlInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
      /(\bONLOAD\s*=)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Check for command injection patterns
  containsCommandInjection(input) {
    const commandPatterns = [
      /[;&|`$(){}[\]]/,
      /\b(rm|del|format|shutdown|reboot|kill|ps|ls|dir|cat|type|echo|curl|wget|nc|netcat)\b/i,
      /(>|<|>>|<<)/,
      /\$\{.*\}/,
      /`.*`/
    ];
    
    return commandPatterns.some(pattern => pattern.test(input));
  }

  // IP filtering and connection tracking
  checkIpAccess(ip, userAgent = '') {
    // Check if IP is blocked
    if (this.blockedIps.has(ip)) {
      this.logSecurityEvent('blocked_ip_access', { ip, userAgent });
      return {
        allowed: false,
        reason: 'IP address is blocked'
      };
    }
    
    // Check blacklist
    if (this.config.ipFiltering.blacklist.includes(ip)) {
      this.blockedIps.add(ip);
      this.logSecurityEvent('blacklisted_ip_access', { ip, userAgent });
      return {
        allowed: false,
        reason: 'IP address is blacklisted'
      };
    }
    
    // Check whitelist (if enabled)
    if (this.config.ipFiltering.whitelist.length > 0) {
      if (!this.config.ipFiltering.whitelist.includes(ip)) {
        this.logSecurityEvent('non_whitelisted_ip_access', { ip, userAgent });
        return {
          allowed: false,
          reason: 'IP address not in whitelist'
        };
      }
    }
    
    // Check connection limits per IP
    const currentConnections = this.ipConnections.get(ip) || 0;
    if (currentConnections >= this.config.ipFiltering.maxConnectionsPerIp) {
      this.logSecurityEvent('ip_connection_limit_exceeded', { ip, userAgent, connections: currentConnections });
      return {
        allowed: false,
        reason: 'Too many connections from this IP'
      };
    }
    
    return { allowed: true };
  }

  // Track IP connection
  trackIpConnection(ip, action = 'connect') {
    const current = this.ipConnections.get(ip) || 0;
    
    if (action === 'connect') {
      this.ipConnections.set(ip, current + 1);
    } else if (action === 'disconnect') {
      this.ipConnections.set(ip, Math.max(0, current - 1));
      
      // Clean up if no connections
      if (this.ipConnections.get(ip) === 0) {
        this.ipConnections.delete(ip);
      }
    }
  }

  // Create secure session
  createSession(userId, metadata = {}) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata,
      isValid: true
    };
    
    this.sessions.set(sessionId, session);
    
    // Set session timeout
    setTimeout(() => {
      this.invalidateSession(sessionId);
    }, this.config.sessionTimeout);
    
    this.logSecurityEvent('session_created', { sessionId, userId });
    
    return sessionId;
  }

  // Validate session
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isValid) {
      return { valid: false, reason: 'Session not found or invalid' };
    }
    
    // Check session timeout
    const now = Date.now();
    if (now - session.lastActivity > this.config.sessionTimeout) {
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }
    
    // Update last activity
    session.lastActivity = now;
    
    return { valid: true, session };
  }

  // Invalidate session
  invalidateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isValid = false;
      this.sessions.delete(sessionId);
      this.logSecurityEvent('session_invalidated', { sessionId });
    }
  }

  // Generate JWT token
  generateJwtToken(payload) {
    try {
      return jwt.sign(payload, this.config.jwtSecret, {
        expiresIn: this.config.jwtExpiresIn,
        issuer: 'git-memory-mcp-server',
        audience: 'mcp-client'
      });
    } catch (error) {
      logger.error('JWT generation failed:', error);
      throw new Error('Token generation failed');
    }
  }

  // Verify JWT token
  verifyJwtToken(token) {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'git-memory-mcp-server',
        audience: 'mcp-client'
      });
    } catch (error) {
      this.logSecurityEvent('jwt_verification_failed', { error: error.message });
      return null;
    }
  }

  // Log security events
  logSecurityEvent(eventType, details = {}) {
    const event = {
      timestamp: Date.now(),
      type: eventType,
      details,
      severity: this.getEventSeverity(eventType)
    };
    
    this.securityEvents.push(event);
    
    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents.shift();
    }
    
    // Log to Winston
    const logLevel = event.severity === 'critical' ? 'error' : 
                    event.severity === 'high' ? 'warn' : 'info';
    
    logger[logLevel](`Security event: ${eventType}`, details);
    
    // Emit event for real-time monitoring
    this.emit('securityEvent', event);
    
    // Auto-block IPs for critical events
    if (event.severity === 'critical' && details.ip) {
      this.blockIp(details.ip, `Auto-blocked due to ${eventType}`);
    }
  }

  // Get event severity
  getEventSeverity(eventType) {
    const severityMap = {
      'sql_injection_attempt': 'critical',
      'command_injection_attempt': 'critical',
      'blocked_ip_access': 'high',
      'blacklisted_ip_access': 'high',
      'rate_limit_exceeded': 'medium',
      'ip_connection_limit_exceeded': 'medium',
      'non_whitelisted_ip_access': 'low',
      'session_created': 'low',
      'session_invalidated': 'low',
      'jwt_verification_failed': 'medium'
    };
    
    return severityMap[eventType] || 'low';
  }

  // Block IP address
  blockIp(ip, reason = 'Security violation') {
    this.blockedIps.add(ip);
    this.logSecurityEvent('ip_blocked', { ip, reason });
    
    // Disconnect all connections from this IP
    this.ipConnections.delete(ip);
    
    logger.warn(`IP ${ip} has been blocked: ${reason}`);
  }

  // Unblock IP address
  unblockIp(ip) {
    if (this.blockedIps.delete(ip)) {
      this.logSecurityEvent('ip_unblocked', { ip });
      logger.info(`IP ${ip} has been unblocked`);
      return true;
    }
    return false;
  }

  // Get security statistics
  getSecurityStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(e => e.timestamp > last24h);
    
    const eventsByType = {};
    const eventsBySeverity = {};
    
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });
    
    return {
      totalEvents: this.securityEvents.length,
      recentEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedIps: Array.from(this.blockedIps),
      activeSessions: this.sessions.size,
      ipConnections: Object.fromEntries(this.ipConnections),
      timestamp: now
    };
  }

  // Get security report
  getSecurityReport(timeRange = 24) {
    const now = Date.now();
    const startTime = now - (timeRange * 60 * 60 * 1000);
    
    const events = this.securityEvents.filter(e => e.timestamp >= startTime);
    
    return {
      timeRange: `${timeRange} hours`,
      startTime,
      endTime: now,
      totalEvents: events.length,
      events: events.sort((a, b) => b.timestamp - a.timestamp),
      summary: this.getSecurityStats()
    };
  }

  // Cleanup expired sessions and old events
  cleanup() {
    const now = Date.now();
    
    // Clean up expired sessions
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        this.invalidateSession(sessionId);
      }
    }
    
    // Clean up old security events (keep last 30 days)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(e => e.timestamp > thirtyDaysAgo);
    
    logger.debug('Security cleanup completed');
  }

  // Get middleware functions
  getMiddleware() {
    return {
      rateLimit: this.rateLimiter,
      helmet: this.helmetMiddleware,
      ipFilter: (req, res, next) => {
        const access = this.checkIpAccess(req.ip, req.get('User-Agent'));
        if (!access.allowed) {
          return res.status(403).json({
            error: 'Access denied',
            message: access.reason
          });
        }
        next();
      },
      validateInput: (type = 'general') => (req, res, next) => {
        if (req.body) {
          const validation = this.validateInput(JSON.stringify(req.body), type);
          if (!validation.isValid) {
            return res.status(400).json({
              error: 'Invalid input',
              errors: validation.errors
            });
          }
        }
        next();
      }
    };
  }
}

export default SecurityManager;