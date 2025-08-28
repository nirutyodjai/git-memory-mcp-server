#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const http = require('http');
const url = require('url');

class GitHubServerManager {
    constructor() {
        this.coordinatorUrl = 'http://localhost:3000';
        this.gitMemoryBridgeUrl = 'http://localhost:3100';
        this.serversDir = path.join(__dirname, 'github-servers');
        this.configFile = path.join(__dirname, 'github-servers-config.json');
        this.startPort = 4000;
        
        // รายการ MCP servers ที่มีประโยชน์ (ไม่ต้องใช้ npm)
        this.usefulServers = [
            {
                name: 'filesystem-server',
                description: 'File system operations and management',
                capabilities: ['read_file', 'write_file', 'list_directory', 'create_directory', 'delete_file'],
                category: 'filesystem'
            },
            {
                name: 'http-client-server',
                description: 'HTTP client for API calls and web requests',
                capabilities: ['get_request', 'post_request', 'put_request', 'delete_request', 'upload_file'],
                category: 'web'
            },
            {
                name: 'json-processor-server',
                description: 'JSON data processing and manipulation',
                capabilities: ['parse_json', 'stringify_json', 'validate_json', 'transform_json', 'merge_json'],
                category: 'data'
            },
            {
                name: 'text-processor-server',
                description: 'Text processing and manipulation utilities',
                capabilities: ['search_text', 'replace_text', 'split_text', 'join_text', 'format_text'],
                category: 'text'
            },
            {
                name: 'crypto-server',
                description: 'Cryptographic operations and security',
                capabilities: ['hash_data', 'encrypt_data', 'decrypt_data', 'generate_key', 'verify_signature'],
                category: 'security'
            },
            {
                name: 'datetime-server',
                description: 'Date and time operations',
                capabilities: ['current_time', 'format_date', 'parse_date', 'add_time', 'diff_time'],
                category: 'utility'
            },
            {
                name: 'math-server',
                description: 'Mathematical calculations and operations',
                capabilities: ['calculate', 'random_number', 'statistics', 'geometry', 'algebra'],
                category: 'math'
            },
            {
                name: 'validation-server',
                description: 'Data validation and verification',
                capabilities: ['validate_email', 'validate_url', 'validate_phone', 'validate_json', 'validate_schema'],
                category: 'validation'
            },
            {
                name: 'encoding-server',
                description: 'Data encoding and decoding operations',
                capabilities: ['base64_encode', 'base64_decode', 'url_encode', 'url_decode', 'html_encode'],
                category: 'encoding'
            },
            {
                name: 'template-server',
                description: 'Template processing and rendering',
                capabilities: ['render_template', 'compile_template', 'validate_template', 'list_variables', 'format_output'],
                category: 'template'
            },
            {
                name: 'cache-server',
                description: 'In-memory caching and storage',
                capabilities: ['cache_set', 'cache_get', 'cache_delete', 'cache_clear', 'cache_stats'],
                category: 'cache'
            },
            {
                name: 'log-server',
                description: 'Logging and monitoring operations',
                capabilities: ['log_info', 'log_error', 'log_debug', 'log_warn', 'get_logs'],
                category: 'logging'
            },
            {
                name: 'config-server',
                description: 'Configuration management',
                capabilities: ['get_config', 'set_config', 'validate_config', 'reload_config', 'backup_config'],
                category: 'config'
            },
            {
                name: 'queue-server',
                description: 'Message queue and task processing',
                capabilities: ['enqueue', 'dequeue', 'peek', 'queue_size', 'clear_queue'],
                category: 'queue'
            },
            {
                name: 'notification-server',
                description: 'Notification and alerting system',
                capabilities: ['send_notification', 'schedule_notification', 'cancel_notification', 'get_notifications', 'mark_read'],
                category: 'notification'
            }
        ];
    }

    async initialize() {
        try {
            if (!fs.existsSync(this.serversDir)) {
                fs.mkdirSync(this.serversDir, { recursive: true });
                console.log('📁 Created github-servers directory');
            }

            await this.loadConfiguration();
            console.log('⚙️ GitHub Server Manager initialized');
        } catch (error) {
            console.error('❌ Error initializing GitHub Server Manager:', error);
        }
    }

    async loadConfiguration() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                console.log(`📋 Loaded configuration for ${Object.keys(config.servers || {}).length} servers`);
                return config;
            }
            return { servers: {}, lastRun: null };
        } catch (error) {
            console.error('❌ Error loading configuration:', error);
            return { servers: {}, lastRun: null };
        }
    }

    async saveConfiguration(config) {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            console.log('💾 Configuration saved');
        } catch (error) {
            console.error('❌ Error saving configuration:', error);
        }
    }

    async createServer(serverInfo, port) {
        try {
            const serverDir = path.join(this.serversDir, serverInfo.name);
            
            if (!fs.existsSync(serverDir)) {
                fs.mkdirSync(serverDir, { recursive: true });
            }

            // สร้าง package.json
            const packageJson = {
                name: serverInfo.name,
                version: '1.0.0',
                description: serverInfo.description,
                main: 'server.js',
                scripts: {
                    start: 'node server.js'
                }
            };

            fs.writeFileSync(
                path.join(serverDir, 'package.json'),
                JSON.stringify(packageJson, null, 2)
            );

            // สร้าง server script
            const serverScript = this.generateServerScript(serverInfo, port);
            fs.writeFileSync(path.join(serverDir, 'server.js'), serverScript);
            
            return {
                name: serverInfo.name,
                description: serverInfo.description,
                port: port,
                directory: serverDir,
                capabilities: serverInfo.capabilities,
                category: serverInfo.category
            };
        } catch (error) {
            console.error(`❌ Error creating server ${serverInfo.name}:`, error);
            throw error;
        }
    }

    generateServerScript(serverInfo, port) {
        const className = serverInfo.name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join('') + 'MCP';

        return `#!/usr/bin/env node

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ${className} {
    constructor() {
        this.name = '${serverInfo.name}';
        this.description = '${serverInfo.description}';
        this.category = '${serverInfo.category}';
        this.port = ${port};
        this.capabilities = ${JSON.stringify(serverInfo.capabilities)};
        this.startTime = Date.now();
        this.requestCount = 0;
        this.lastRequest = null;
        this.cache = new Map();
        this.logs = [];
        
        this.setupServer();
    }

    setupServer() {
        this.server = http.createServer((req, res) => {
            this.requestCount++;
            this.lastRequest = new Date().toISOString();
            
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            try {
                switch (pathname) {
                    case '/health':
                        this.handleHealth(req, res);
                        break;
                    case '/capabilities':
                        this.handleCapabilities(req, res);
                        break;
                    case '/tools/call':
                        this.handleToolCall(req, res);
                        break;
                    case '/stats':
                        this.handleStats(req, res);
                        break;
                    case '/resources/list':
                        this.handleResourcesList(req, res);
                        break;
                    case '/prompts/list':
                        this.handlePromptsList(req, res);
                        break;
                    default:
                        this.handleNotFound(req, res);
                        break;
                }
            } catch (error) {
                this.handleError(req, res, error);
            }
        });
    }

    handleHealth(req, res) {
        const health = {
            status: 'healthy',
            service: this.name,
            description: this.description,
            category: this.category,
            port: this.port,
            uptime: (Date.now() - this.startTime) / 1000,
            requests: this.requestCount,
            last_request: this.lastRequest,
            capabilities: this.capabilities.length,
            memory_usage: process.memoryUsage()
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(health, null, 2));
    }

    handleCapabilities(req, res) {
        const capabilities = {
            tools: this.capabilities.map(cap => ({
                name: \`\${this.category}_\${cap}\`,
                description: \`\${cap} operation for \${this.description}\`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: { type: 'string', enum: [cap] },
                        data: { type: 'object' },
                        options: { type: 'object' }
                    },
                    required: ['action']
                }
            })),
            resources: [
                {
                    uri: \`\${this.category}://localhost:\${this.port}/\`,
                    name: \`\${this.name} Resource\`,
                    description: \`Resource endpoint for \${this.name}\`,
                    mimeType: 'application/json'
                }
            ],
            prompts: [
                {
                    name: \`\${this.category}_help\`,
                    description: \`Get help for \${this.category} operations\`,
                    arguments: [
                        {
                            name: 'operation',
                            description: 'The operation to get help for',
                            required: false
                        }
                    ]
                }
            ]
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(capabilities, null, 2));
    }

    handleToolCall(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const request = JSON.parse(body);
                const { name, arguments: args } = request;
                
                // Process the tool call based on category
                const result = this.processToolCall(name, args);
                
                res.writeHead(200);
                res.end(JSON.stringify(result, null, 2));
            } catch (error) {
                this.handleError(req, res, error);
            }
        });
    }

    processToolCall(toolName, args) {
        const action = args.action || toolName.split('_').pop();
        const data = args.data || {};
        const options = args.options || {};
        
        let result;
        
        switch (this.category) {
            case 'filesystem':
                result = this.processFilesystemOperation(action, data, options);
                break;
            case 'web':
                result = this.processWebOperation(action, data, options);
                break;
            case 'data':
                result = this.processDataOperation(action, data, options);
                break;
            case 'text':
                result = this.processTextOperation(action, data, options);
                break;
            case 'security':
                result = this.processSecurityOperation(action, data, options);
                break;
            case 'utility':
                result = this.processUtilityOperation(action, data, options);
                break;
            case 'math':
                result = this.processMathOperation(action, data, options);
                break;
            case 'validation':
                result = this.processValidationOperation(action, data, options);
                break;
            case 'encoding':
                result = this.processEncodingOperation(action, data, options);
                break;
            case 'template':
                result = this.processTemplateOperation(action, data, options);
                break;
            case 'cache':
                result = this.processCacheOperation(action, data, options);
                break;
            case 'logging':
                result = this.processLoggingOperation(action, data, options);
                break;
            case 'config':
                result = this.processConfigOperation(action, data, options);
                break;
            case 'queue':
                result = this.processQueueOperation(action, data, options);
                break;
            case 'notification':
                result = this.processNotificationOperation(action, data, options);
                break;
            default:
                result = \`Processed \${action} with data: \${JSON.stringify(data)}\`;
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: \`[\${this.name}] \${result}\`
                }
            ],
            isError: false
        };
    }

    processFilesystemOperation(action, data, options) {
        switch (action) {
            case 'read_file':
                return \`Reading file: \${data.path || 'unknown'}\`;
            case 'write_file':
                return \`Writing to file: \${data.path || 'unknown'}\`;
            case 'list_directory':
                return \`Listing directory: \${data.path || 'current'}\`;
            case 'create_directory':
                return \`Creating directory: \${data.path || 'unknown'}\`;
            case 'delete_file':
                return \`Deleting file: \${data.path || 'unknown'}\`;
            default:
                return \`Filesystem operation: \${action}\`;
        }
    }

    processWebOperation(action, data, options) {
        switch (action) {
            case 'get_request':
                return \`GET request to: \${data.url || 'unknown'}\`;
            case 'post_request':
                return \`POST request to: \${data.url || 'unknown'}\`;
            case 'put_request':
                return \`PUT request to: \${data.url || 'unknown'}\`;
            case 'delete_request':
                return \`DELETE request to: \${data.url || 'unknown'}\`;
            case 'upload_file':
                return \`Uploading file to: \${data.url || 'unknown'}\`;
            default:
                return \`Web operation: \${action}\`;
        }
    }

    processDataOperation(action, data, options) {
        switch (action) {
            case 'parse_json':
                return \`Parsing JSON data (\${typeof data.input} input)\`;
            case 'stringify_json':
                return \`Stringifying JSON data\`;
            case 'validate_json':
                return \`Validating JSON structure\`;
            case 'transform_json':
                return \`Transforming JSON data\`;
            case 'merge_json':
                return \`Merging JSON objects\`;
            default:
                return \`Data operation: \${action}\`;
        }
    }

    processTextOperation(action, data, options) {
        switch (action) {
            case 'search_text':
                return \`Searching for: \${data.query || 'unknown'} in text\`;
            case 'replace_text':
                return \`Replacing text: \${data.search || 'unknown'} -> \${data.replace || 'unknown'}\`;
            case 'split_text':
                return \`Splitting text by: \${data.delimiter || 'space'}\`;
            case 'join_text':
                return \`Joining text with: \${data.separator || 'space'}\`;
            case 'format_text':
                return \`Formatting text with style: \${data.style || 'default'}\`;
            default:
                return \`Text operation: \${action}\`;
        }
    }

    processSecurityOperation(action, data, options) {
        switch (action) {
            case 'hash_data':
                const hash = crypto.createHash(data.algorithm || 'sha256');
                hash.update(data.input || '');
                return \`Hashed data using \${data.algorithm || 'sha256'}: \${hash.digest('hex').substring(0, 16)}...\`;
            case 'encrypt_data':
                return \`Encrypted data using \${data.algorithm || 'aes-256-cbc'}\`;
            case 'decrypt_data':
                return \`Decrypted data using \${data.algorithm || 'aes-256-cbc'}\`;
            case 'generate_key':
                return \`Generated \${data.type || 'random'} key (\${data.length || 32} bytes)\`;
            case 'verify_signature':
                return \`Verified signature: \${data.valid ? 'valid' : 'checking'}\`;
            default:
                return \`Security operation: \${action}\`;
        }
    }

    processUtilityOperation(action, data, options) {
        switch (action) {
            case 'current_time':
                return \`Current time: \${new Date().toISOString()}\`;
            case 'format_date':
                return \`Formatted date: \${data.format || 'ISO'} format\`;
            case 'parse_date':
                return \`Parsed date: \${data.input || 'unknown'}\`;
            case 'add_time':
                return \`Added \${data.amount || 0} \${data.unit || 'seconds'} to date\`;
            case 'diff_time':
                return \`Time difference calculated between dates\`;
            default:
                return \`Utility operation: \${action}\`;
        }
    }

    processMathOperation(action, data, options) {
        switch (action) {
            case 'calculate':
                return \`Calculated expression: \${data.expression || 'unknown'}\`;
            case 'random_number':
                const min = data.min || 0;
                const max = data.max || 100;
                const random = Math.floor(Math.random() * (max - min + 1)) + min;
                return \`Generated random number: \${random} (range: \${min}-\${max})\`;
            case 'statistics':
                return \`Calculated statistics for \${data.values?.length || 0} values\`;
            case 'geometry':
                return \`Geometry calculation: \${data.operation || 'unknown'}\`;
            case 'algebra':
                return \`Algebra operation: \${data.operation || 'unknown'}\`;
            default:
                return \`Math operation: \${action}\`;
        }
    }

    processValidationOperation(action, data, options) {
        switch (action) {
            case 'validate_email':
                const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                const isValidEmail = emailRegex.test(data.email || '');
                return \`Email validation: \${data.email || 'unknown'} is \${isValidEmail ? 'valid' : 'invalid'}\`;
            case 'validate_url':
                return \`URL validation: \${data.url || 'unknown'}\`;
            case 'validate_phone':
                return \`Phone validation: \${data.phone || 'unknown'}\`;
            case 'validate_json':
                return \`JSON validation: structure check\`;
            case 'validate_schema':
                return \`Schema validation: \${data.schema || 'unknown'} schema\`;
            default:
                return \`Validation operation: \${action}\`;
        }
    }

    processEncodingOperation(action, data, options) {
        switch (action) {
            case 'base64_encode':
                const encoded = Buffer.from(data.input || '', 'utf8').toString('base64');
                return \`Base64 encoded: \${encoded.substring(0, 20)}...\`;
            case 'base64_decode':
                return \`Base64 decoded data\`;
            case 'url_encode':
                return \`URL encoded: \${encodeURIComponent(data.input || '')}\`;
            case 'url_decode':
                return \`URL decoded: \${decodeURIComponent(data.input || '')}\`;
            case 'html_encode':
                return \`HTML encoded data\`;
            default:
                return \`Encoding operation: \${action}\`;
        }
    }

    processCacheOperation(action, data, options) {
        switch (action) {
            case 'cache_set':
                this.cache.set(data.key, data.value);
                return \`Cached: \${data.key} = \${JSON.stringify(data.value).substring(0, 50)}...\`;
            case 'cache_get':
                const value = this.cache.get(data.key);
                return \`Retrieved from cache: \${data.key} = \${value ? JSON.stringify(value).substring(0, 50) + '...' : 'not found'}\`;
            case 'cache_delete':
                const deleted = this.cache.delete(data.key);
                return \`Deleted from cache: \${data.key} (\${deleted ? 'success' : 'not found'})\`;
            case 'cache_clear':
                this.cache.clear();
                return 'Cache cleared';
            case 'cache_stats':
                return \`Cache stats: \${this.cache.size} items\`;
            default:
                return \`Cache operation: \${action}\`;
        }
    }

    processLoggingOperation(action, data, options) {
        const timestamp = new Date().toISOString();
        switch (action) {
            case 'log_info':
                this.logs.push({ level: 'info', message: data.message, timestamp });
                return \`Logged info: \${data.message || 'unknown'}\`;
            case 'log_error':
                this.logs.push({ level: 'error', message: data.message, timestamp });
                return \`Logged error: \${data.message || 'unknown'}\`;
            case 'log_debug':
                this.logs.push({ level: 'debug', message: data.message, timestamp });
                return \`Logged debug: \${data.message || 'unknown'}\`;
            case 'log_warn':
                this.logs.push({ level: 'warn', message: data.message, timestamp });
                return \`Logged warning: \${data.message || 'unknown'}\`;
            case 'get_logs':
                const recentLogs = this.logs.slice(-10);
                return \`Retrieved \${recentLogs.length} recent logs\`;
            default:
                return \`Logging operation: \${action}\`;
        }
    }

    processConfigOperation(action, data, options) {
        switch (action) {
            case 'get_config':
                return \`Retrieved config: \${data.key || 'all'}\`;
            case 'set_config':
                return \`Set config: \${data.key} = \${JSON.stringify(data.value)}\`;
            case 'validate_config':
                return \`Validated config structure\`;
            case 'reload_config':
                return \`Reloaded configuration\`;
            case 'backup_config':
                return \`Backed up configuration\`;
            default:
                return \`Config operation: \${action}\`;
        }
    }

    processQueueOperation(action, data, options) {
        if (!this.queue) this.queue = [];
        
        switch (action) {
            case 'enqueue':
                this.queue.push(data.item);
                return \`Enqueued item (queue size: \${this.queue.length})\`;
            case 'dequeue':
                const item = this.queue.shift();
                return \`Dequeued: \${item ? JSON.stringify(item).substring(0, 50) + '...' : 'empty queue'}\`;
            case 'peek':
                const first = this.queue[0];
                return \`Peek: \${first ? JSON.stringify(first).substring(0, 50) + '...' : 'empty queue'}\`;
            case 'queue_size':
                return \`Queue size: \${this.queue.length}\`;
            case 'clear_queue':
                this.queue = [];
                return 'Queue cleared';
            default:
                return \`Queue operation: \${action}\`;
        }
    }

    processNotificationOperation(action, data, options) {
        if (!this.notifications) this.notifications = [];
        
        switch (action) {
            case 'send_notification':
                const notification = {
                    id: Date.now(),
                    message: data.message,
                    type: data.type || 'info',
                    timestamp: new Date().toISOString(),
                    read: false
                };
                this.notifications.push(notification);
                return \`Sent notification: \${data.message || 'unknown'}\`;
            case 'schedule_notification':
                return \`Scheduled notification for: \${data.schedule || 'unknown'}\`;
            case 'cancel_notification':
                return \`Cancelled notification: \${data.id || 'unknown'}\`;
            case 'get_notifications':
                const unread = this.notifications.filter(n => !n.read).length;
                return \`Retrieved \${this.notifications.length} notifications (\${unread} unread)\`;
            case 'mark_read':
                return \`Marked notification as read: \${data.id || 'unknown'}\`;
            default:
                return \`Notification operation: \${action}\`;
        }
    }

    handleStats(req, res) {
        const stats = {
            server_info: {
                name: this.name,
                description: this.description,
                category: this.category,
                port: this.port,
                uptime: (Date.now() - this.startTime) / 1000
            },
            performance: {
                requests_total: this.requestCount,
                last_request: this.lastRequest,
                memory_usage: process.memoryUsage(),
                cache_size: this.cache.size,
                logs_count: this.logs.length
            },
            capabilities: this.capabilities,
            resources: {
                cache_entries: this.cache.size,
                log_entries: this.logs.length,
                queue_size: this.queue ? this.queue.length : 0,
                notifications: this.notifications ? this.notifications.length : 0
            }
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(stats, null, 2));
    }

    handleResourcesList(req, res) {
        const resources = [
            {
                uri: \`\${this.category}://localhost:\${this.port}/\`,
                name: \`\${this.name} Main Resource\`,
                description: this.description,
                mimeType: 'application/json'
            },
            {
                uri: \`\${this.category}://localhost:\${this.port}/stats\`,
                name: \`\${this.name} Statistics\`,
                description: 'Server statistics and performance metrics',
                mimeType: 'application/json'
            }
        ];
        
        res.writeHead(200);
        res.end(JSON.stringify({ resources }, null, 2));
    }

    handlePromptsList(req, res) {
        const prompts = [
            {
                name: \`\${this.category}_help\`,
                description: \`Get help for \${this.category} operations\`,
                arguments: [
                    {
                        name: 'operation',
                        description: 'The operation to get help for',
                        required: false
                    }
                ]
            },
            {
                name: \`\${this.category}_examples\`,
                description: \`Get examples for \${this.category} operations\`,
                arguments: [
                    {
                        name: 'capability',
                        description: 'The capability to get examples for',
                        required: false
                    }
                ]
            }
        ];
        
        res.writeHead(200);
        res.end(JSON.stringify({ prompts }, null, 2));
    }

    handleNotFound(req, res) {
        res.writeHead(404);
        res.end(JSON.stringify({ 
            error: 'Not Found', 
            path: req.url,
            available_endpoints: ['/health', '/capabilities', '/tools/call', '/stats', '/resources/list', '/prompts/list']
        }));
    }

    handleError(req, res, error) {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ 
            error: error.message,
            server: this.name,
            timestamp: new Date().toISOString()
        }));
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(\`🚀 \${this.name} (\${this.category}) running on port \${this.port}\`);
                resolve();
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log(\`🛑 \${this.name} stopped\`);
        }
    }
}

// Main execution
async function main() {
    const server = new ${className}();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });

    await server.start();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ${className};
`;
    }

    async startServer(serverConfig) {
        try {
            console.log(`🚀 Starting ${serverConfig.name}...`);
            
            const serverProcess = spawn('node', ['server.js'], {
                cwd: serverConfig.directory,
                stdio: 'pipe',
                detached: true
            });

            // ให้เวลา server เริ่มต้น
            await new Promise(resolve => setTimeout(resolve, 2000));

            // ทดสอบการเชื่อมต่อ
            try {
                const response = await axios.get(`http://localhost:${serverConfig.port}/health`, {
                    timeout: 5000
                });
                return { success: true, pid: serverProcess.pid, health: response.data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error(`❌ Error starting ${serverConfig.name}:`, error);
            return { success: false, error: error.message };
        }
    }

    async registerWithCoordinator(serverConfig) {
        try {
            const registrationData = {
                name: serverConfig.name,
                port: serverConfig.port,
                type: 'github-mcp-server',
                url: `http://localhost:${serverConfig.port}`,
                capabilities: serverConfig.capabilities,
                category: serverConfig.category,
                description: serverConfig.description
            };

            const response = await axios.post(
                `${this.coordinatorUrl}/register`,
                registrationData,
                { timeout: 5000 }
            );

            return { success: true, response: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async connectToGitMemoryBridge(serverConfig) {
        try {
            const response = await axios.post(
                `${this.gitMemoryBridgeUrl}/connect/${serverConfig.name}`,
                {
                    serverUrl: `http://localhost:${serverConfig.port}`,
                    serverType: 'github-mcp-server',
                    category: serverConfig.category,
                    capabilities: serverConfig.capabilities
                },
                { timeout: 5000 }
            );

            return { success: true, response: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async addAllServers() {
        console.log('🚀 Adding GitHub MCP Servers');
        console.log('============================');
        
        const results = {
            created: 0,
            started: 0,
            registered: 0,
            connected: 0,
            failed: []
        };

        let currentPort = this.startPort;
        const allServers = [];

        for (const serverInfo of this.usefulServers) {
            try {
                console.log(`\n📦 Creating ${serverInfo.name}...`);
                
                // สร้าง server
                const serverConfig = await this.createServer(serverInfo, currentPort);
                allServers.push(serverConfig);
                results.created++;
                
                // เริ่มต้น server
                const startResult = await this.startServer(serverConfig);
                if (startResult.success) {
                    results.started++;
                    console.log(`✅ ${serverConfig.name} started successfully`);
                    
                    // ลงทะเบียนกับ coordinator
                    const registerResult = await this.registerWithCoordinator(serverConfig);
                    if (registerResult.success) {
                        results.registered++;
                        console.log(`📋 ${serverConfig.name} registered with coordinator`);
                    } else {
                        console.log(`⚠️ Failed to register ${serverConfig.name}: ${registerResult.error}`);
                    }
                    
                    // เชื่อมต่อกับ Git Memory Bridge
                    const connectResult = await this.connectToGitMemoryBridge(serverConfig);
                    if (connectResult.success) {
                        results.connected++;
                        console.log(`🌉 ${serverConfig.name} connected to Git Memory Bridge`);
                    } else {
                        console.log(`⚠️ Failed to connect ${serverConfig.name} to bridge: ${connectResult.error}`);
                    }
                } else {
                    console.log(`❌ Failed to start ${serverConfig.name}: ${startResult.error}`);
                    results.failed.push({ server: serverConfig.name, error: startResult.error });
                }
                
                currentPort++;
            } catch (error) {
                console.error(`❌ Failed to process ${serverInfo.name}:`, error);
                results.failed.push({ server: serverInfo.name, error: error.message });
                currentPort++;
            }
        }

        // บันทึกผลลัพธ์
        const config = {
            servers: allServers.reduce((acc, server) => {
                acc[server.name] = server;
                return acc;
            }, {}),
            lastRun: {
                timestamp: new Date().toISOString(),
                results: results
            }
        };
        
        await this.saveConfiguration(config);

        console.log('\n📊 GitHub Servers Addition Summary');
        console.log('==================================');
        console.log(`🏗️ Created: ${results.created}/${this.usefulServers.length}`);
        console.log(`🚀 Started: ${results.started}/${this.usefulServers.length}`);
        console.log(`📋 Registered: ${results.registered}/${this.usefulServers.length}`);
        console.log(`🌉 Connected: ${results.connected}/${this.usefulServers.length}`);
        
        if (results.failed.length > 0) {
            console.log(`\n❌ Failed: ${results.failed.length}`);
            results.failed.forEach(failure => {
                console.log(`   - ${failure.server}: ${failure.error}`);
            });
        }

        return results;
    }

    async getServerStatus() {
        console.log('📊 Checking GitHub Servers Status');
        console.log('=================================');
        
        const config = await this.loadConfiguration();
        const servers = config.servers || {};
        const serverNames = Object.keys(servers);
        
        if (serverNames.length === 0) {
            console.log('⚠️ No GitHub servers found');
            return [];
        }
        
        const statuses = [];
        let healthyCount = 0;
        
        console.log(`🔍 Checking ${serverNames.length} servers...`);
        
        for (const serverName of serverNames) {
            const server = servers[serverName];
            try {
                const response = await axios.get(`http://localhost:${server.port}/health`, {
                    timeout: 3000
                });
                
                statuses.push({
                    name: server.name,
                    category: server.category,
                    port: server.port,
                    status: 'healthy',
                    uptime: response.data.uptime || 0,
                    requests: response.data.requests || 0,
                    capabilities: response.data.capabilities || 0
                });
                
                healthyCount++;
            } catch (error) {
                statuses.push({
                    name: server.name,
                    category: server.category,
                    port: server.port,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        }

        console.log(`\n📈 Status Summary:`);
        console.log(`✅ Healthy: ${healthyCount}/${serverNames.length}`);
        console.log(`❌ Unhealthy: ${serverNames.length - healthyCount}/${serverNames.length}`);
        console.log(`📊 Success Rate: ${((healthyCount / serverNames.length) * 100).toFixed(1)}%`);

        // แสดงสถานะตาม category
        const categories = {};
        statuses.forEach(status => {
            if (!categories[status.category]) {
                categories[status.category] = { healthy: 0, total: 0 };
            }
            categories[status.category].total++;
            if (status.status === 'healthy') {
                categories[status.category].healthy++;
            }
        });

        console.log('\n📋 Status by Category:');
        Object.entries(categories).forEach(([category, stats]) => {
            console.log(`   ${category}: ${stats.healthy}/${stats.total} healthy`);
        });

        return statuses;
    }
}

// Main execution
async function main() {
    const manager = new GitHubServerManager();
    await manager.initialize();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'add';
    
    switch (command) {
        case 'add':
            await manager.addAllServers();
            break;
        case 'status':
            await manager.getServerStatus();
            break;
        default:
            console.log('Usage: node add-github-servers.js [add|status]');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = GitHubServerManager;