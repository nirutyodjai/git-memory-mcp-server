/**
 * MCP Protocol Middleware
 * Handles MCP Protocol request/response processing and validation
 */

const logger = require('../utils/logger');
const MCPProtocolService = require('../services/MCPProtocolService');

// Initialize MCP Protocol Service
const mcpProtocolService = new MCPProtocolService();

/**
 * MCP Protocol Request Middleware
 * Processes incoming MCP Protocol requests
 */
const mcpProtocolMiddleware = async (req, res, next) => {
  try {
    // Set MCP-specific headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-MCP-Protocol-Version', '1.0.0');
    res.setHeader('X-Server-Type', 'git-memory-mcp-server');
    
    // Add MCP service to request object
    req.mcpService = mcpProtocolService;
    
    // Log incoming MCP request
    logger.debug('MCP Protocol request received', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      user_agent: req.get('User-Agent'),
      ip: req.ip
    });
    
    next();
  } catch (error) {
    logger.error('MCP Protocol middleware error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    
    res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal server error in MCP middleware',
        data: {
          timestamp: new Date().toISOString()
        }
      }
    });
  }
};

/**
 * MCP Request Validator Middleware
 * Validates MCP Protocol request structure
 */
const mcpRequestValidator = (req, res, next) => {
  try {
    const { body } = req;
    
    // Check if request body exists
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Invalid Request - Request body must be a valid JSON object',
          data: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // Check JSON-RPC version
    if (body.jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: body.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request - JSON-RPC version must be "2.0"',
          data: {
            received_version: body.jsonrpc,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // Check method
    if (!body.method || typeof body.method !== 'string') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: body.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request - Method is required and must be a string',
          data: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // Check params (optional, but if present must be object or array)
    if (body.params !== undefined && 
        typeof body.params !== 'object' && 
        !Array.isArray(body.params)) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: body.id || null,
        error: {
          code: -32602,
          message: 'Invalid params - Params must be an object or array if provided',
          data: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // Add validated flag to request
    req.mcpValidated = true;
    
    logger.debug('MCP request validation passed', {
      method: body.method,
      id: body.id,
      has_params: !!body.params
    });
    
    next();
  } catch (error) {
    logger.error('MCP request validation error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal error during request validation',
        data: {
          timestamp: new Date().toISOString()
        }
      }
    });
  }
};

/**
 * MCP Response Formatter Middleware
 * Formats responses according to MCP Protocol
 */
const mcpResponseFormatter = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to format MCP responses
  res.json = function(data) {
    try {
      let formattedResponse;
      
      // If data is already a valid MCP response, use it as-is
      if (data && data.jsonrpc === '2.0' && (data.result !== undefined || data.error !== undefined)) {
        formattedResponse = data;
      } else {
        // Format as MCP success response
        formattedResponse = {
          jsonrpc: '2.0',
          id: req.body?.id || null,
          result: {
            success: true,
            data: data,
            metadata: {
              timestamp: new Date().toISOString(),
              protocol_version: '1.0.0',
              server_type: 'git-memory-mcp-server'
            }
          }
        };
      }
      
      // Log response
      logger.debug('MCP response sent', {
        id: formattedResponse.id,
        success: !formattedResponse.error,
        response_size: JSON.stringify(formattedResponse).length
      });
      
      // Call original json method with formatted response
      return originalJson.call(this, formattedResponse);
    } catch (error) {
      logger.error('MCP response formatting error', {
        error: error.message,
        stack: error.stack,
        original_data: data
      });
      
      // Send error response
      return originalJson.call(this, {
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: 'Internal error during response formatting',
          data: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  };
  
  next();
};

/**
 * MCP Error Handler Middleware
 * Handles errors and formats them according to MCP Protocol
 */
const mcpErrorHandler = (error, req, res, next) => {
  try {
    logger.error('MCP Protocol error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      user_agent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Determine error code based on error type
    let errorCode = -32603; // Internal error
    let statusCode = 500;
    
    if (error.message.includes('Invalid request')) {
      errorCode = -32600;
      statusCode = 400;
    } else if (error.message.includes('Method not found') || error.message.includes('Unsupported method')) {
      errorCode = -32601;
      statusCode = 404;
    } else if (error.message.includes('Invalid params')) {
      errorCode = -32602;
      statusCode = 400;
    } else if (error.message.includes('Unauthorized')) {
      errorCode = -32001; // Custom: Unauthorized
      statusCode = 401;
    } else if (error.message.includes('Forbidden')) {
      errorCode = -32002; // Custom: Forbidden
      statusCode = 403;
    } else if (error.message.includes('Rate limit')) {
      errorCode = -32003; // Custom: Rate limit exceeded
      statusCode = 429;
    }
    
    // Create MCP error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: errorCode,
        message: error.message,
        data: {
          timestamp: new Date().toISOString(),
          protocol_version: '1.0.0',
          server_type: 'git-memory-mcp-server',
          request_id: req.body?.id,
          method: req.body?.method
        }
      }
    };
    
    // Set appropriate status code and send response
    res.status(statusCode).json(errorResponse);
  } catch (handlerError) {
    logger.error('Error in MCP error handler', {
      original_error: error.message,
      handler_error: handlerError.message,
      stack: handlerError.stack
    });
    
    // Fallback error response
    res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Critical internal server error',
        data: {
          timestamp: new Date().toISOString()
        }
      }
    });
  }
};

/**
 * MCP Rate Limiting Middleware
 * Implements rate limiting for MCP requests
 */
const mcpRateLimit = (() => {
  const requestCounts = new Map();
  const WINDOW_SIZE = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 100; // 100 requests per minute
  
  return (req, res, next) => {
    try {
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      
      // Clean up old entries
      for (const [id, data] of requestCounts.entries()) {
        if (now - data.windowStart > WINDOW_SIZE) {
          requestCounts.delete(id);
        }
      }
      
      // Get or create client data
      let clientData = requestCounts.get(clientId);
      if (!clientData || now - clientData.windowStart > WINDOW_SIZE) {
        clientData = {
          count: 0,
          windowStart: now
        };
        requestCounts.set(clientId, clientData);
      }
      
      // Check rate limit
      if (clientData.count >= MAX_REQUESTS) {
        logger.warn('MCP rate limit exceeded', {
          client_id: clientId,
          count: clientData.count,
          max_requests: MAX_REQUESTS,
          window_size: WINDOW_SIZE
        });
        
        return res.status(429).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32003,
            message: 'Rate limit exceeded',
            data: {
              limit: MAX_REQUESTS,
              window_size_ms: WINDOW_SIZE,
              retry_after: WINDOW_SIZE - (now - clientData.windowStart),
              timestamp: new Date().toISOString()
            }
          }
        });
      }
      
      // Increment counter
      clientData.count++;
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - clientData.count));
      res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + WINDOW_SIZE).toISOString());
      
      next();
    } catch (error) {
      logger.error('MCP rate limiting error', {
        error: error.message,
        stack: error.stack
      });
      
      // Continue without rate limiting on error
      next();
    }
  };
})();

/**
 * MCP Metrics Middleware
 * Collects metrics for MCP requests
 */
const mcpMetrics = (() => {
  const metrics = {
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    methods: new Map(),
    response_times: [],
    start_time: Date.now()
  };
  
  return {
    middleware: (req, res, next) => {
      const startTime = Date.now();
      
      // Track request
      metrics.total_requests++;
      const method = req.body?.method || 'unknown';
      metrics.methods.set(method, (metrics.methods.get(method) || 0) + 1);
      
      // Override end method to capture response time
      const originalEnd = res.end;
      res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        
        // Track response time
        metrics.response_times.push(responseTime);
        if (metrics.response_times.length > 1000) {
          metrics.response_times = metrics.response_times.slice(-1000);
        }
        
        // Track success/failure
        if (res.statusCode < 400) {
          metrics.successful_requests++;
        } else {
          metrics.failed_requests++;
        }
        
        logger.debug('MCP request completed', {
          method,
          status_code: res.statusCode,
          response_time: responseTime,
          success: res.statusCode < 400
        });
        
        return originalEnd.apply(this, args);
      };
      
      next();
    },
    
    getMetrics: () => {
      const now = Date.now();
      const uptime = now - metrics.start_time;
      const avgResponseTime = metrics.response_times.length > 0 ?
        metrics.response_times.reduce((a, b) => a + b, 0) / metrics.response_times.length : 0;
      
      return {
        total_requests: metrics.total_requests,
        successful_requests: metrics.successful_requests,
        failed_requests: metrics.failed_requests,
        success_rate: metrics.total_requests > 0 ? 
          (metrics.successful_requests / metrics.total_requests * 100).toFixed(2) + '%' : '0%',
        average_response_time: Math.round(avgResponseTime),
        uptime_ms: uptime,
        uptime_seconds: Math.floor(uptime / 1000),
        methods: Object.fromEntries(metrics.methods),
        recent_response_times: metrics.response_times.slice(-10)
      };
    },
    
    resetMetrics: () => {
      metrics.total_requests = 0;
      metrics.successful_requests = 0;
      metrics.failed_requests = 0;
      metrics.methods.clear();
      metrics.response_times = [];
      metrics.start_time = Date.now();
    }
  };
})();

module.exports = {
  mcpProtocolMiddleware,
  mcpRequestValidator,
  mcpResponseFormatter,
  mcpErrorHandler,
  mcpRateLimit,
  mcpMetrics,
  mcpProtocolService
};