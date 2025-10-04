/**
 * Distributed Tracing for Git Memory MCP Server
 *
 * Implements OpenTelemetry distributed tracing for monitoring
 * request flow across services and identifying performance bottlenecks.
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { trace, context, propagation } from '@opentelemetry/api';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

/**
 * Tracing service for Git Memory MCP Server
 */
class TracingService {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'git-memory-mcp-server';
    this.serviceVersion = options.serviceVersion || '1.0.0';
    this.jaegerEndpoint = options.jaegerEndpoint || 'http://localhost:14268/api/traces';
    this.otlpEndpoint = options.otlpEndpoint || 'http://localhost:4318/v1/traces';
    this.enableConsoleExporter = options.enableConsoleExporter || false;
    this.samplingRatio = options.samplingRatio || 1.0; // Sample all traces in development

    this.provider = null;
    this.tracer = null;
    this.initialized = false;
  }

  /**
   * Initialize tracing
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create tracer provider
      this.provider = new NodeTracerProvider({
        resource: {
          'service.name': this.serviceName,
          'service.version': this.serviceVersion,
          'service.instance.id': process.pid.toString(),
        },
      });

      // Setup exporters
      const exporters = [];

      // Jaeger exporter (recommended for development)
      if (this.jaegerEndpoint) {
        const jaegerExporter = new JaegerExporter({
          endpoint: this.jaegerEndpoint,
        });
        exporters.push(jaegerExporter);
      }

      // OTLP exporter (for production)
      if (this.otlpEndpoint) {
        const otlpExporter = new OTLPTraceExporter({
          url: this.otlpEndpoint,
        });
        exporters.push(new BatchSpanProcessor(otlpExporter));
      }

      // Console exporter (for debugging)
      if (this.enableConsoleExporter) {
        const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
        const consoleExporter = new ConsoleSpanExporter();
        exporters.push(new BatchSpanProcessor(consoleExporter));
      }

      // Add span processors
      exporters.forEach(exporter => {
        this.provider.addSpanProcessor(new BatchSpanProcessor(exporter));
      });

      // Register the provider
      this.provider.register({
        propagator: propagation.createB3(),
      });

      // Get tracer instance
      this.tracer = trace.getTracer(this.serviceName, this.serviceVersion);

      this.initialized = true;
      console.log('✅ Tracing service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize tracing:', error);
      throw error;
    }
  }

  /**
   * Create a new span
   */
  startSpan(name, options = {}) {
    if (!this.initialized || !this.tracer) {
      throw new Error('Tracing not initialized');
    }

    return this.tracer.startSpan(name, {
      kind: options.kind || 1, // INTERNAL
      attributes: options.attributes || {},
      ...options
    });
  }

  /**
   * Start an active span (context manager)
   */
  startActiveSpan(name, fn, options = {}) {
    if (!this.initialized || !this.tracer) {
      return fn();
    }

    return this.tracer.startActiveSpan(name, (span) => {
      try {
        const result = fn(span);
        if (result && typeof result.then === 'function') {
          return result.finally(() => span.end());
        } else {
          span.end();
          return result;
        }
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        span.end();
        throw error;
      }
    }, options);
  }

  /**
   * Create a child span
   */
  createChildSpan(parentSpan, name, options = {}) {
    if (!parentSpan) {
      return this.startSpan(name, options);
    }

    const ctx = trace.setSpan(context.active(), parentSpan);
    return this.tracer.startSpan(name, { ...options, parent: parentSpan }, ctx);
  }

  /**
   * Record an exception in the current span
   */
  recordException(error, span = null) {
    const currentSpan = span || trace.getSpan(context.active());

    if (currentSpan) {
      currentSpan.recordException(error);
      currentSpan.setStatus({ code: 2, message: error.message });
    }
  }

  /**
   * Add attributes to current span
   */
  setAttributes(attributes, span = null) {
    const currentSpan = span || trace.getSpan(context.active());

    if (currentSpan) {
      currentSpan.setAttributes(attributes);
    }
  }

  /**
   * Add an event to current span
   */
  addEvent(name, attributes = {}, span = null) {
    const currentSpan = span || trace.getSpan(context.active());

    if (currentSpan) {
      currentSpan.addEvent(name, attributes);
    }
  }

  /**
   * Shutdown tracing service
   */
  async shutdown() {
    if (this.provider) {
      await this.provider.shutdown();
      console.log('✅ Tracing service shutdown');
    }
  }
}

/**
 * Middleware for tracing HTTP requests
 */
export function tracingMiddleware(tracingService) {
  return (req, res, next) => {
    if (!tracingService || !tracingService.initialized) {
      return next();
    }

    const span = tracingService.startSpan(`HTTP ${req.method} ${req.path}`, {
      kind: 1, // SERVER
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.user_agent': req.get('User-Agent') || '',
        'http.remote_ip': req.ip || req.connection.remoteAddress || '',
        'http.route': req.route?.path || '',
      }
    });

    // Set span in context
    const ctx = trace.setSpan(context.active(), span);

    // Store span in request for later use
    req.traceSpan = span;
    req.traceContext = ctx;

    // Override res.end to automatically end the span
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.status_text': res.statusMessage,
      });

      if (res.statusCode >= 400) {
        span.setStatus({ code: 2, message: `HTTP ${res.statusCode}` });
      }

      span.end();
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Middleware for tracing WebSocket connections
 */
export function websocketTracingMiddleware(tracingService) {
  return (ws, req) => {
    if (!tracingService || !tracingService.initialized) {
      return;
    }

    const span = tracingService.startSpan('WebSocket Connection', {
      kind: 1, // SERVER
      attributes: {
        'websocket.subprotocol': req.headers['sec-websocket-protocol'] || '',
        'websocket.version': req.headers['sec-websocket-version'] || '',
        'http.remote_ip': req.ip || req.connection.remoteAddress || '',
      }
    });

    // Store span in WebSocket object for later use
    ws.traceSpan = span;

    ws.on('message', (data) => {
      const messageSpan = tracingService.createChildSpan(span, 'WebSocket Message', {
        attributes: {
          'websocket.message_size': data.length,
          'websocket.message_type': 'text',
        }
      });

      // Parse and trace message content
      try {
        const message = JSON.parse(data.toString());
        messageSpan.setAttributes({
          'websocket.message.type': message.type || 'unknown',
        });
      } catch (error) {
        messageSpan.recordException(error);
      }

      messageSpan.end();
    });

    ws.on('close', (code, reason) => {
      span.setAttributes({
        'websocket.close_code': code,
        'websocket.close_reason': reason || '',
      });

      span.end();
    });

    ws.on('error', (error) => {
      tracingService.recordException(error, span);
      span.end();
    });
  };
}

/**
 * Enhanced logger with tracing context
 */
export class TracingLogger {
  constructor(logger, tracingService) {
    this.logger = logger;
    this.tracingService = tracingService;
  }

  info(message, meta = {}) {
    const span = trace.getSpan(context.active());
    if (span) {
      meta.traceId = span.spanContext().traceId;
      meta.spanId = span.spanContext().spanId;
    }

    this.logger.info(message, meta);
  }

  error(message, error = null, meta = {}) {
    const span = trace.getSpan(context.active());
    if (span) {
      meta.traceId = span.spanContext().traceId;
      meta.spanId = span.spanContext().spanId;

      if (error) {
        this.tracingService.recordException(error, span);
      }
    }

    this.logger.error(message, { ...meta, error: error?.message, stack: error?.stack });
  }

  warn(message, meta = {}) {
    const span = trace.getSpan(context.active());
    if (span) {
      meta.traceId = span.spanContext().traceId;
      meta.spanId = span.spanContext().spanId;
    }

    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    const span = trace.getSpan(context.active());
    if (span) {
      meta.traceId = span.spanContext().traceId;
      meta.spanId = span.spanContext().spanId;
    }

    this.logger.debug(message, meta);
  }
}

/**
 * Decorator for tracing function execution
 */
export function withTracing(name, options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const tracingService = this.tracingService;
      if (!tracingService || !tracingService.initialized) {
        return originalMethod.apply(this, args);
      }

      return tracingService.startActiveSpan(name, async (span) => {
        try {
          // Add method arguments as attributes (excluding sensitive data)
          if (options.includeArgs) {
            span.setAttributes({
              'function.args': JSON.stringify(args.slice(0, options.maxArgs || 3)),
            });
          }

          const result = await originalMethod.apply(this, args);

          if (options.includeResult) {
            span.setAttributes({
              'function.result_size': JSON.stringify(result).length,
            });
          }

          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          throw error;
        }
      }, options);
    };

    return descriptor;
  };
}

// Export tracing service instance
export { TracingService };
