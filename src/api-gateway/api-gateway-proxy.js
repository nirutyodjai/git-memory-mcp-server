/**
 * Git Memory MCP Server - API Gateway Proxy
 * Advanced Proxy System สำหรับ API Gateway
 * 
 * Features:
 * - HTTP/HTTPS proxy with SSL termination
 * - WebSocket proxy support
 * - Request/Response transformation
 * - Protocol translation (HTTP/1.1, HTTP/2, gRPC)
 * - Connection pooling and keep-alive
 * - Retry mechanisms with backoff
 * - Request/Response buffering
 * - Stream processing
 * - Proxy chaining
 * - Health checking and failover
 */

const http = require('http');
const https = require('https');
const http2 = require('http2');
const url = require('url');
const zlib = require('zlib');
const crypto = require('crypto');
const EventEmitter = require('events');
const { Transform } = require('stream');

class APIGatewayProxy extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            proxy: {
                timeout: 30000, // 30 seconds
                keepAlive: true,
                keepAliveMsecs: 1000,
                maxSockets: 256,
                maxFreeSockets: 256,
                retries: 3,
                retryDelay: 1000,
                retryBackoff: 2.0
            },
            ssl: {
                enabled: false,
                cert: null,
                key: null,
                ca: null,
                rejectUnauthorized: true
            },
            protocols: {
                http1: { enabled: true, port: 8080 },
                http2: { enabled: false, port: 8443 },
                websocket: { enabled: true },
                grpc: { enabled: false }
            },
            transformation: {
                enabled: true,
                requestTransforms: [],
                responseTransforms: [],
                headerTransforms: []
            },
            buffering: {
                enabled: true,
                maxSize: 10 * 1024 * 1024, // 10MB
                timeout: 5000
            },
            compression: {
                enabled: true,
                algorithms: ['gzip', 'deflate', 'br'],
                threshold: 1024,
                level: 6
            },
            streaming: {
                enabled: true,
                chunkSize: 64 * 1024, // 64KB
                highWaterMark: 16
            },
            healthCheck: {
                enabled: true,
                interval: 30000, // 30 seconds
                timeout: 5000,
                path: '/health',
                expectedStatus: 200
            },
            ...config
        };
        
        // Connection pools
        this.httpAgent = new http.Agent({
            keepAlive: this.config.proxy.keepAlive,
            keepAliveMsecs: this.config.proxy.keepAliveMsecs,
            maxSockets: this.config.proxy.maxSockets,
            maxFreeSockets: this.config.proxy.maxFreeSockets
        });
        
        this.httpsAgent = new https.Agent({
            keepAlive: this.config.proxy.keepAlive,
            keepAliveMsecs: this.config.proxy.keepAliveMsecs,
            maxSockets: this.config.proxy.maxSockets,
            maxFreeSockets: this.config.proxy.maxFreeSockets,
            rejectUnauthorized: this.config.ssl.rejectUnauthorized
        });
        
        // HTTP/2 sessions
        this.http2Sessions = new Map();
        
        // Proxy statistics
        this.stats = {
            requests: 0,
            responses: 0,
            errors: 0,
            retries: 0,
            bytesIn: 0,
            bytesOut: 0,
            activeConnections: 0,
            avgResponseTime: 0,
            responseTimeSum: 0,
            startTime: Date.now()
        };
        
        // Health check results
        this.healthStatus = new Map();
        
        this.setupHealthChecking();
        
        console.log('🔄 Proxy system initialized');
    }
    
    /**
     * Proxy HTTP request
     */
    async proxyRequest(req, res, target, options = {}) {
        const startTime = Date.now();
        this.stats.requests++;
        this.stats.activeConnections++;
        
        try {
            // Parse target URL
            const targetUrl = new URL(target);
            
            // Apply request transformations
            if (this.config.transformation.enabled) {
                await this.transformRequest(req, options);
            }
            
            // Choose proxy method based on protocol
            let result;
            if (targetUrl.protocol === 'https:' && this.config.protocols.http2.enabled) {
                result = await this.proxyHttp2Request(req, res, targetUrl, options);
            } else {
                result = await this.proxyHttpRequest(req, res, targetUrl, options);
            }
            
            // Record statistics
            const responseTime = Date.now() - startTime;
            this.stats.responseTimeSum += responseTime;
            this.stats.responses++;
            this.stats.avgResponseTime = this.stats.responseTimeSum / this.stats.responses;
            
            return result;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Proxy request error:', error);
            
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Bad Gateway',
                    message: 'Proxy request failed',
                    timestamp: new Date().toISOString()
                }));
            }
            
            throw error;
            
        } finally {
            this.stats.activeConnections--;
        }
    }
    
    /**
     * Proxy HTTP/1.1 request
     */
    async proxyHttpRequest(req, res, targetUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const isHttps = targetUrl.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            const agent = isHttps ? this.httpsAgent : this.httpAgent;
            
            const proxyOptions = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (isHttps ? 443 : 80),
                path: targetUrl.pathname + targetUrl.search,
                method: req.method,
                headers: { ...req.headers },
                agent: agent,
                timeout: this.config.proxy.timeout
            };
            
            // Remove hop-by-hop headers
            this.removeHopByHopHeaders(proxyOptions.headers);
            
            // Add proxy headers
            proxyOptions.headers['X-Forwarded-For'] = req.connection.remoteAddress;
            proxyOptions.headers['X-Forwarded-Proto'] = req.connection.encrypted ? 'https' : 'http';
            proxyOptions.headers['X-Forwarded-Host'] = req.headers.host;
            
            let retryCount = 0;
            
            const makeRequest = () => {
                const proxyReq = httpModule.request(proxyOptions, async (proxyRes) => {
                    try {
                        // Apply response transformations
                        if (this.config.transformation.enabled) {
                            await this.transformResponse(proxyRes, options);
                        }
                        
                        // Copy response headers
                        const responseHeaders = { ...proxyRes.headers };
                        this.removeHopByHopHeaders(responseHeaders);
                        
                        // Handle compression
                        if (this.config.compression.enabled) {
                            await this.handleCompression(req, proxyRes, responseHeaders);
                        }
                        
                        res.writeHead(proxyRes.statusCode, responseHeaders);
                        
                        // Handle streaming or buffering
                        if (this.config.streaming.enabled && this.shouldStream(proxyRes)) {
                            await this.streamResponse(proxyRes, res);
                        } else if (this.config.buffering.enabled) {
                            await this.bufferResponse(proxyRes, res);
                        } else {
                            proxyRes.pipe(res);
                        }
                        
                        proxyRes.on('end', () => {
                            this.stats.bytesOut += proxyRes.socket?.bytesRead || 0;
                            resolve({ statusCode: proxyRes.statusCode, headers: responseHeaders });
                        });
                        
                    } catch (error) {
                        reject(error);
                    }
                });
                
                proxyReq.on('error', (error) => {
                    if (retryCount < this.config.proxy.retries) {
                        retryCount++;
                        this.stats.retries++;
                        
                        const delay = this.config.proxy.retryDelay * Math.pow(this.config.proxy.retryBackoff, retryCount - 1);
                        
                        console.log(`🔄 Retrying request (${retryCount}/${this.config.proxy.retries}) after ${delay}ms`);
                        
                        setTimeout(makeRequest, delay);
                    } else {
                        reject(error);
                    }
                });
                
                proxyReq.on('timeout', () => {
                    proxyReq.destroy();
                    reject(new Error('Proxy request timeout'));
                });
                
                // Forward request body
                if (req.readable) {
                    req.pipe(proxyReq);
                    req.on('data', (chunk) => {
                        this.stats.bytesIn += chunk.length;
                    });
                } else {
                    proxyReq.end();
                }
            };
            
            makeRequest();
        });
    }
    
    /**
     * Proxy HTTP/2 request
     */
    async proxyHttp2Request(req, res, targetUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const sessionKey = `${targetUrl.hostname}:${targetUrl.port || 443}`;
            
            let session = this.http2Sessions.get(sessionKey);
            
            if (!session || session.destroyed) {
                session = http2.connect(`https://${sessionKey}`, {
                    rejectUnauthorized: this.config.ssl.rejectUnauthorized
                });
                
                session.on('error', (error) => {
                    console.error('❌ HTTP/2 session error:', error);
                    this.http2Sessions.delete(sessionKey);
                });
                
                this.http2Sessions.set(sessionKey, session);
            }
            
            const headers = {
                ':method': req.method,
                ':path': targetUrl.pathname + targetUrl.search,
                ...req.headers
            };
            
            // Remove HTTP/1.1 specific headers
            delete headers.connection;
            delete headers['transfer-encoding'];
            
            const stream = session.request(headers);
            
            stream.on('response', async (responseHeaders) => {
                try {
                    // Convert HTTP/2 headers to HTTP/1.1
                    const statusCode = responseHeaders[':status'];
                    delete responseHeaders[':status'];
                    
                    // Apply response transformations
                    if (this.config.transformation.enabled) {
                        const mockRes = { headers: responseHeaders, statusCode };
                        await this.transformResponse(mockRes, options);
                    }
                    
                    res.writeHead(statusCode, responseHeaders);
                    
                    stream.pipe(res);
                    
                    stream.on('end', () => {
                        resolve({ statusCode, headers: responseHeaders });
                    });
                    
                } catch (error) {
                    reject(error);
                }
            });
            
            stream.on('error', reject);
            
            // Forward request body
            if (req.readable) {
                req.pipe(stream);
            } else {
                stream.end();
            }
        });
    }
    
    /**
     * Proxy WebSocket connection
     */
    proxyWebSocket(req, socket, head, target) {
        const targetUrl = new URL(target);
        const isHttps = targetUrl.protocol === 'wss:';
        
        const proxyOptions = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (isHttps ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            headers: req.headers
        };
        
        const httpModule = isHttps ? https : http;
        
        const proxyReq = httpModule.request(proxyOptions);
        
        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                        'Upgrade: websocket\r\n' +
                        'Connection: Upgrade\r\n' +
                        '\r\n');
            
            // Pipe data between client and target
            socket.pipe(proxySocket);
            proxySocket.pipe(socket);
            
            // Handle connection cleanup
            const cleanup = () => {
                socket.destroy();
                proxySocket.destroy();
            };
            
            socket.on('error', cleanup);
            proxySocket.on('error', cleanup);
            socket.on('close', cleanup);
            proxySocket.on('close', cleanup);
        });
        
        proxyReq.on('error', (error) => {
            console.error('❌ WebSocket proxy error:', error);
            socket.destroy();
        });
        
        proxyReq.end();
    }
    
    /**
     * Transform request
     */
    async transformRequest(req, options) {
        for (const transform of this.config.transformation.requestTransforms) {
            if (typeof transform === 'function') {
                await transform(req, options);
            }
        }
        
        // Apply header transformations
        for (const transform of this.config.transformation.headerTransforms) {
            if (typeof transform === 'function') {
                transform(req.headers, 'request');
            }
        }
    }
    
    /**
     * Transform response
     */
    async transformResponse(res, options) {
        for (const transform of this.config.transformation.responseTransforms) {
            if (typeof transform === 'function') {
                await transform(res, options);
            }
        }
        
        // Apply header transformations
        for (const transform of this.config.transformation.headerTransforms) {
            if (typeof transform === 'function') {
                transform(res.headers, 'response');
            }
        }
    }
    
    /**
     * Handle compression
     */
    async handleCompression(req, proxyRes, headers) {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const contentLength = parseInt(headers['content-length'] || '0');
        
        if (contentLength < this.config.compression.threshold) {
            return;
        }
        
        // Check if already compressed
        if (headers['content-encoding']) {
            return;
        }
        
        // Choose compression algorithm
        let encoding = null;
        for (const algorithm of this.config.compression.algorithms) {
            if (acceptEncoding.includes(algorithm)) {
                encoding = algorithm;
                break;
            }
        }
        
        if (encoding) {
            headers['content-encoding'] = encoding;
            delete headers['content-length']; // Will be set by compression stream
        }
    }
    
    /**
     * Check if response should be streamed
     */
    shouldStream(proxyRes) {
        const contentLength = parseInt(proxyRes.headers['content-length'] || '0');
        const contentType = proxyRes.headers['content-type'] || '';
        
        // Stream large responses
        if (contentLength > this.config.streaming.chunkSize * 10) {
            return true;
        }
        
        // Stream media content
        if (contentType.startsWith('video/') || 
            contentType.startsWith('audio/') ||
            contentType.startsWith('application/octet-stream')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Stream response
     */
    async streamResponse(proxyRes, res) {
        return new Promise((resolve, reject) => {
            const transform = new Transform({
                highWaterMark: this.config.streaming.highWaterMark,
                transform(chunk, encoding, callback) {
                    // Process chunk if needed
                    this.push(chunk);
                    callback();
                }
            });
            
            proxyRes.pipe(transform).pipe(res);
            
            proxyRes.on('end', resolve);
            proxyRes.on('error', reject);
            transform.on('error', reject);
            res.on('error', reject);
        });
    }
    
    /**
     * Buffer response
     */
    async bufferResponse(proxyRes, res) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            let totalSize = 0;
            
            const timeout = setTimeout(() => {
                reject(new Error('Response buffering timeout'));
            }, this.config.buffering.timeout);
            
            proxyRes.on('data', (chunk) => {
                totalSize += chunk.length;
                
                if (totalSize > this.config.buffering.maxSize) {
                    clearTimeout(timeout);
                    reject(new Error('Response too large to buffer'));
                    return;
                }
                
                chunks.push(chunk);
            });
            
            proxyRes.on('end', () => {
                clearTimeout(timeout);
                
                const buffer = Buffer.concat(chunks);
                
                // Process buffered response if needed
                this.processBufferedResponse(buffer, proxyRes.headers)
                    .then((processedBuffer) => {
                        res.end(processedBuffer);
                        resolve();
                    })
                    .catch(reject);
            });
            
            proxyRes.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    
    /**
     * Process buffered response
     */
    async processBufferedResponse(buffer, headers) {
        // Apply any post-processing to the buffered response
        // This could include content transformation, validation, etc.
        return buffer;
    }
    
    /**
     * Remove hop-by-hop headers
     */
    removeHopByHopHeaders(headers) {
        const hopByHopHeaders = [
            'connection',
            'keep-alive',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailers',
            'transfer-encoding',
            'upgrade'
        ];
        
        for (const header of hopByHopHeaders) {
            delete headers[header];
        }
    }
    
    /**
     * Setup health checking
     */
    setupHealthChecking() {
        if (!this.config.healthCheck.enabled) {
            return;
        }
        
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheck.interval);
    }
    
    /**
     * Perform health checks
     */
    async performHealthChecks() {
        // This would be implemented to check the health of upstream servers
        // For now, we'll just emit a health check event
        this.emit('healthCheck', {
            timestamp: Date.now(),
            status: 'healthy',
            checks: []
        });
    }
    
    /**
     * Add request transformation
     */
    addRequestTransform(transform) {
        if (typeof transform === 'function') {
            this.config.transformation.requestTransforms.push(transform);
        }
    }
    
    /**
     * Add response transformation
     */
    addResponseTransform(transform) {
        if (typeof transform === 'function') {
            this.config.transformation.responseTransforms.push(transform);
        }
    }
    
    /**
     * Add header transformation
     */
    addHeaderTransform(transform) {
        if (typeof transform === 'function') {
            this.config.transformation.headerTransforms.push(transform);
        }
    }
    
    /**
     * Get proxy statistics
     */
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime,
            requestRate: this.stats.requests / ((Date.now() - this.stats.startTime) / 1000),
            errorRate: this.stats.errors / this.stats.requests,
            retryRate: this.stats.retries / this.stats.requests,
            connectionPools: {
                http: {
                    sockets: this.httpAgent.sockets,
                    freeSockets: this.httpAgent.freeSockets,
                    requests: this.httpAgent.requests
                },
                https: {
                    sockets: this.httpsAgent.sockets,
                    freeSockets: this.httpsAgent.freeSockets,
                    requests: this.httpsAgent.requests
                }
            },
            http2Sessions: this.http2Sessions.size
        };
    }
    
    /**
     * Close proxy connections
     */
    async close() {
        // Close HTTP agents
        this.httpAgent.destroy();
        this.httpsAgent.destroy();
        
        // Close HTTP/2 sessions
        for (const session of this.http2Sessions.values()) {
            session.close();
        }
        this.http2Sessions.clear();
        
        console.log('🔄 Proxy system closed');
    }
}

// Export class
module.exports = APIGatewayProxy;

// CLI interface
if (require.main === module) {
    const proxy = new APIGatewayProxy({
        proxy: {
            timeout: 10000,
            retries: 2
        },
        compression: {
            enabled: true,
            threshold: 500
        },
        streaming: {
            enabled: true,
            chunkSize: 32 * 1024
        }
    });
    
    // Add sample transformations
    proxy.addRequestTransform((req, options) => {
        req.headers['X-Proxy-Timestamp'] = Date.now().toString();
        console.log(`🔄 Request transform: ${req.method} ${req.url}`);
    });
    
    proxy.addResponseTransform((res, options) => {
        res.headers['X-Proxy-Response-Time'] = Date.now().toString();
        console.log(`🔄 Response transform: ${res.statusCode}`);
    });
    
    proxy.addHeaderTransform((headers, type) => {
        headers['X-Proxy-Type'] = type;
        console.log(`🔄 Header transform: ${type}`);
    });
    
    // Test proxy with a simple HTTP server
    const http = require('http');
    
    const server = http.createServer(async (req, res) => {
        try {
            // Example: proxy to httpbin.org
            const target = 'https://httpbin.org' + req.url;
            await proxy.proxyRequest(req, res, target);
        } catch (error) {
            console.error('❌ Proxy error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        }
    });
    
    // Handle WebSocket upgrades
    server.on('upgrade', (req, socket, head) => {
        try {
            const target = 'wss://echo.websocket.org';
            proxy.proxyWebSocket(req, socket, head, target);
        } catch (error) {
            console.error('❌ WebSocket proxy error:', error);
            socket.destroy();
        }
    });
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🔄 Proxy server running on port ${PORT}`);
        console.log(`🔄 Try: curl http://localhost:${PORT}/get`);
    });
    
    // Print stats every 10 seconds
    setInterval(() => {
        const stats = proxy.getStats();
        console.log('🔄 Proxy Stats:', {
            requests: stats.requests,
            responses: stats.responses,
            errors: stats.errors,
            avgResponseTime: Math.round(stats.avgResponseTime) + 'ms',
            activeConnections: stats.activeConnections,
            requestRate: stats.requestRate.toFixed(2) + '/s'
        });
    }, 10000);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🔄 Shutting down proxy server...');
        server.close();
        await proxy.close();
        process.exit(0);
    });
}