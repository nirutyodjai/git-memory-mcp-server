#!/usr/bin/env node

/**
 * NEXUS IDE Web Server
 * เว็บเซิร์ฟเวอร์สำหรับ NEXUS IDE Dashboard
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

class NexusWebServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.port = process.env.PORT || 8081;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // JSON parser
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Static files
        this.app.use('/static', express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // API Routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            });
        });

        this.app.get('/api/system-health', (req, res) => {
            res.json({
                health: 'good',
                components: {
                    'nexus-master-control': 'running',
                    'universal-data-hub': 'running',
                    'git-memory-coordinator': 'running',
                    'nexus-data-integration': 'running'
                },
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/api/mcp-servers', (req, res) => {
            res.json({
                total: 3000,
                active: 2847,
                categories: {
                    'AI/ML': 1000,
                    'Enterprise': 1500,
                    'Specialized': 500
                },
                performance: {
                    avgResponseTime: '45ms',
                    throughput: '15,000 req/s',
                    errorRate: '0.02%'
                }
            });
        });

        // IDE Routes
        this.app.get('/ide', (req, res) => {
            res.send(this.generateIDEHTML());
        });

        this.app.get('/api/ide/files', (req, res) => {
            const projectPath = req.query.path || process.cwd();
            try {
                const files = this.getDirectoryStructure(projectPath);
                res.json({ files });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/ide/file/save', (req, res) => {
            const { path: filePath, content } = req.body;
            try {
                fs.writeFileSync(filePath, content, 'utf8');
                res.json({ success: true, message: 'File saved successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/ide/file/read', (req, res) => {
            const filePath = req.query.path;
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                res.json({ content });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            socket.on('join-room', (room) => {
                socket.join(room);
                console.log(`👥 Client ${socket.id} joined room: ${room}`);
            });

            socket.on('code-change', (data) => {
                socket.to(data.room).emit('code-update', data);
            });

            socket.on('cursor-move', (data) => {
                socket.to(data.room).emit('cursor-update', data);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });
    }

    getDirectoryStructure(dirPath, maxDepth = 3, currentDepth = 0) {
        if (currentDepth >= maxDepth) return [];
        
        try {
            const items = fs.readdirSync(dirPath);
            return items.map(item => {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    return {
                        name: item,
                        type: 'directory',
                        path: fullPath,
                        children: this.getDirectoryStructure(fullPath, maxDepth, currentDepth + 1)
                    };
                } else {
                    return {
                        name: item,
                        type: 'file',
                        path: fullPath,
                        size: stats.size,
                        modified: stats.mtime
                    };
                }
            });
        } catch (error) {
            return [];
        }
    }

    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div x-data="dashboard()" class="container mx-auto p-6">
        <!-- Header -->
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-rocket text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            NEXUS IDE
                        </h1>
                        <p class="text-gray-400">Ultimate Development Environment</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-sm text-gray-300">System Online</span>
                    </div>
                    <button @click="openIDE()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-code mr-2"></i>Open IDE
                    </button>
                </div>
            </div>
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">MCP Servers</p>
                        <p class="text-2xl font-bold text-blue-400" x-text="stats.mcpServers">3,000</p>
                    </div>
                    <i class="fas fa-server text-blue-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Active Connections</p>
                        <p class="text-2xl font-bold text-green-400" x-text="stats.activeConnections">2,847</p>
                    </div>
                    <i class="fas fa-plug text-green-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Response Time</p>
                        <p class="text-2xl font-bold text-yellow-400" x-text="stats.responseTime">45ms</p>
                    </div>
                    <i class="fas fa-tachometer-alt text-yellow-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Throughput</p>
                        <p class="text-2xl font-bold text-purple-400" x-text="stats.throughput">15K req/s</p>
                    </div>
                    <i class="fas fa-chart-line text-purple-400 text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- System Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-heartbeat mr-2 text-red-400"></i>
                    System Health
                </h3>
                <div class="space-y-3">
                    <template x-for="(status, component) in systemHealth" :key="component">
                        <div class="flex items-center justify-between">
                            <span x-text="component" class="text-gray-300"></span>
                            <div class="flex items-center space-x-2">
                                <div :class="status === 'running' ? 'bg-green-500' : 'bg-red-500'" class="w-2 h-2 rounded-full"></div>
                                <span :class="status === 'running' ? 'text-green-400' : 'text-red-400'" x-text="status" class="text-sm"></span>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 class="text-xl font-semibold mb-4 flex items-center">
                    <i class="fas fa-chart-pie mr-2 text-blue-400"></i>
                    MCP Categories
                </h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-300">AI/ML Services</span>
                        <span class="text-blue-400 font-semibold">1,000</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-300">Enterprise Integration</span>
                        <span class="text-green-400 font-semibold">1,500</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-300">Specialized Services</span>
                        <span class="text-purple-400 font-semibold">500</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-bolt mr-2 text-yellow-400"></i>
                Quick Actions
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button @click="openIDE()" class="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors text-center">
                    <i class="fas fa-code text-2xl mb-2"></i>
                    <p class="text-sm">Open IDE</p>
                </button>
                <button @click="viewLogs()" class="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors text-center">
                    <i class="fas fa-file-alt text-2xl mb-2"></i>
                    <p class="text-sm">View Logs</p>
                </button>
                <button @click="systemSettings()" class="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors text-center">
                    <i class="fas fa-cog text-2xl mb-2"></i>
                    <p class="text-sm">Settings</p>
                </button>
                <button @click="restartSystem()" class="bg-red-600 hover:bg-red-700 p-4 rounded-lg transition-colors text-center">
                    <i class="fas fa-redo text-2xl mb-2"></i>
                    <p class="text-sm">Restart</p>
                </button>
            </div>
        </div>
    </div>

    <script>
        function dashboard() {
            return {
                stats: {
                    mcpServers: '3,000',
                    activeConnections: '2,847',
                    responseTime: '45ms',
                    throughput: '15K req/s'
                },
                systemHealth: {
                    'NEXUS Master Control': 'running',
                    'Universal Data Hub': 'running',
                    'Git Memory Coordinator': 'running',
                    'NEXUS Data Integration': 'running'
                },
                
                init() {
                    this.connectSocket();
                    this.updateStats();
                },
                
                connectSocket() {
                    const socket = io();
                    socket.on('stats-update', (data) => {
                        this.stats = data;
                    });
                },
                
                updateStats() {
                    setInterval(() => {
                        fetch('/api/system-health')
                            .then(response => response.json())
                            .then(data => {
                                this.systemHealth = data.components;
                            });
                    }, 5000);
                },
                
                openIDE() {
                    window.open('/ide', '_blank');
                },
                
                viewLogs() {
                    alert('Logs viewer will be implemented');
                },
                
                systemSettings() {
                    alert('System settings will be implemented');
                },
                
                restartSystem() {
                    if (confirm('Are you sure you want to restart the system?')) {
                        alert('System restart will be implemented');
                    }
                }
            }
        }
    </script>
</body>
</html>
        `;
    }

    generateIDEHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js"></script>
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .monaco-editor-container {
            height: calc(100vh - 120px);
        }
    </style>
</head>
<body class="bg-gray-900 text-white overflow-hidden">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <!-- Logo -->
            <div class="p-4 border-b border-gray-700">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                        <i class="fas fa-rocket text-sm"></i>
                    </div>
                    <span class="font-bold">NEXUS IDE</span>
                </div>
            </div>
            
            <!-- File Explorer -->
            <div class="flex-1 p-4">
                <h3 class="text-sm font-semibold text-gray-400 mb-2">EXPLORER</h3>
                <div id="file-tree" class="text-sm">
                    <!-- File tree will be populated here -->
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <button class="text-gray-400 hover:text-white">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <span class="text-sm text-gray-300">Welcome.md</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="text-gray-400 hover:text-white px-2 py-1 rounded">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white px-2 py-1 rounded">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            
            <!-- Editor -->
            <div class="flex-1">
                <div id="monaco-editor" class="monaco-editor-container"></div>
            </div>
            
            <!-- Terminal -->
            <div class="h-48 bg-black border-t border-gray-700 p-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-gray-400">TERMINAL</h3>
                    <button class="text-gray-400 hover:text-white">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="font-mono text-sm text-green-400">
                    <div>nexus@ide:~$ Welcome to NEXUS IDE Terminal</div>
                    <div>nexus@ide:~$ Type 'help' for available commands</div>
                    <div class="flex items-center">
                        <span>nexus@ide:~$ </span>
                        <input type="text" class="bg-transparent border-none outline-none flex-1 text-green-400" placeholder="Enter command...">
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize Monaco Editor
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
        
        require(['vs/editor/editor.main'], function () {
            const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: [
                    '# Welcome to NEXUS IDE',
                    '',
                    'NEXUS IDE is the ultimate development environment that combines:',
                    '',
                    '## Features',
                    '- AI-powered code completion',
                    '- Real-time collaboration',
                    '- Universal data connectivity',
                    '- 3000+ MCP Servers integration',
                    '- Advanced debugging tools',
                    '',
                    '## Getting Started',
                    '1. Open a project folder',
                    '2. Start coding with AI assistance',
                    '3. Collaborate in real-time',
                    '4. Deploy with one click',
                    '',
                    'Happy coding! 🚀'
                ].join('\n'),
                language: 'markdown',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                wordWrap: 'on',
                minimap: { enabled: true },
                scrollBeyondLastLine: false
            });
            
            // Socket connection for real-time collaboration
            const socket = io();
            socket.emit('join-room', 'default-room');
            
            editor.onDidChangeModelContent(() => {
                const content = editor.getValue();
                socket.emit('code-change', {
                    room: 'default-room',
                    content: content,
                    userId: 'user-' + Math.random().toString(36).substr(2, 9)
                });
            });
            
            socket.on('code-update', (data) => {
                const currentContent = editor.getValue();
                if (currentContent !== data.content) {
                    editor.setValue(data.content);
                }
            });
        });
        
        // Load file tree
        fetch('/api/ide/files')
            .then(response => response.json())
            .then(data => {
                const fileTree = document.getElementById('file-tree');
                fileTree.innerHTML = renderFileTree(data.files);
            });
            
        function renderFileTree(files) {
            return files.map(file => {
                if (file.type === 'directory') {
                    return '<div class="mb-1"><div class="flex items-center space-x-1 cursor-pointer hover:bg-gray-700 p-1 rounded"><i class="fas fa-folder text-blue-400"></i><span>' + file.name + '</span></div></div>';
                } else {
                    return '<div class="mb-1"><div class="flex items-center space-x-1 cursor-pointer hover:bg-gray-700 p-1 rounded ml-4"><i class="fas fa-file text-gray-400"></i><span>' + file.name + '</span></div></div>';
                }
            }).join('');
        }
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌐 NEXUS IDE Web Server เริ่มต้นที่ http://localhost:${this.port}`);
            console.log(`🎮 Dashboard: http://localhost:${this.port}`);
            console.log(`💻 IDE: http://localhost:${this.port}/ide`);
        });
    }

    stop() {
        this.server.close(() => {
            console.log('🛑 NEXUS IDE Web Server หยุดทำงาน');
        });
    }
}

// เริ่มต้นเซิร์ฟเวอร์
if (require.main === module) {
    const webServer = new NexusWebServer();
    webServer.start();
    
    // จัดการการปิดโปรแกรม
    process.on('SIGINT', () => {
        console.log('\n🛑 กำลังปิด NEXUS IDE Web Server...');
        webServer.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 กำลังปิด NEXUS IDE Web Server...');
        webServer.stop();
        process.exit(0);
    });
}

module.exports = NexusWebServer;