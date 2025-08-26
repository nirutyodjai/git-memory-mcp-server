// Authentication and Authorization Middleware for MCP Proxy Servers
const crypto = require('crypto');

// Simple API Key store (in production, use database or external service)
const API_KEYS = {
    'mcp-admin-key-2024': {
        name: 'Admin User',
        permissions: ['read', 'write', 'admin'],
        created: new Date().toISOString()
    },
    'mcp-readonly-key-2024': {
        name: 'Read Only User', 
        permissions: ['read'],
        created: new Date().toISOString()
    },
    'mcp-developer-key-2024': {
        name: 'Developer User',
        permissions: ['read', 'write'],
        created: new Date().toISOString()
    }
};

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map();

// Authentication middleware
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'API key must be provided in X-API-Key header or api_key query parameter'
        });
    }
    
    const keyData = API_KEYS[apiKey];
    if (!keyData) {
        return res.status(401).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
        });
    }
    
    // Attach user info to request
    req.user = {
        apiKey: apiKey,
        name: keyData.name,
        permissions: keyData.permissions
    };
    
    next();
}

// Authorization middleware
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated'
            });
        }
        
        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This operation requires '${permission}' permission`
            });
        }
        
        next();
    };
}

// Rate limiting middleware
function rateLimit(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
        const key = req.user ? req.user.apiKey : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Get or create rate limit data for this key
        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, []);
        }
        
        const requests = rateLimitStore.get(key);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Maximum ${maxRequests} requests per ${windowMs/1000} seconds`,
                retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
            });
        }
        
        // Add current request
        validRequests.push(now);
        rateLimitStore.set(key, validRequests);
        
        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - validRequests.length,
            'X-RateLimit-Reset': new Date(windowStart + windowMs).toISOString()
        });
        
        next();
    };
}

// Logging middleware
function logRequest(req, res, next) {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
        const duration = Date.now() - start;
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            user: req.user ? req.user.name : 'Anonymous',
            apiKey: req.user ? req.user.apiKey.substring(0, 8) + '...' : 'None',
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent') || 'Unknown'
        };
        
        console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration} - ${logData.user}`);
        
        originalSend.call(this, data);
    };
    
    next();
}

// Health check endpoint (no auth required)
function healthCheck(req, res) {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
}

module.exports = {
    authenticateApiKey,
    requirePermission,
    rateLimit,
    logRequest,
    healthCheck,
    API_KEYS
};