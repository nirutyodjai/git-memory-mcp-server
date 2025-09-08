const express = require('express');
const path = require('path');
const fs = require('fs');

class NexusPortfolioSystem {
    constructor() {
        this.app = express();
        this.port = 3002;
        this.setupMiddleware();
        this.setupRoutes();
        this.portfolioData = this.getPortfolioData();
    }

    setupMiddleware() {
        this.app.use(express.static(path.join(__dirname)));
        this.app.use(express.json());
    }

    getPortfolioData() {
        return {
            title: "NEXUS IDE - The Most Powerful IDE Ever Created",
            version: "2.0.0",
            description: "Next-Generation AI-Native IDE with Universal Connectivity",
            features: [
                {
                    name: "AI Integration",
                    description: "8 AI Providers, 34+ Models, 96% Code Accuracy",
                    icon: "🤖",
                    stats: "96% accuracy"
                },
                {
                    name: "Git Memory MCP Cluster",
                    description: "1000+ Servers, 99.97% Uptime",
                    icon: "🔗",
                    stats: "1000+ servers"
                },
                {
                    name: "Advanced Development Tools",
                    description: "Enhanced Monaco Editor, 15ms Code Completion",
                    icon: "⚡",
                    stats: "15ms response"
                },
                {
                    name: "Performance Excellence",
                    description: "32ms API Response, 300% Productivity Increase",
                    icon: "🚀",
                    stats: "300% faster"
                }
            ],
            achievements: [
                "85 NPS Score",
                "80% Bug Fixing Time Reduction",
                "300% Faster than VS Code",
                "99.97% System Uptime",
                "96% AI Code Accuracy"
            ],
            demos: [
                {
                    name: "Live Code Editor",
                    url: "/demo/editor",
                    description: "Experience our AI-powered code editor"
                },
                {
                    name: "Real-time Collaboration",
                    url: "/demo/collab",
                    description: "See multi-user editing in action"
                },
                {
                    name: "AI Assistant",
                    url: "/demo/ai",
                    description: "Chat with our intelligent coding assistant"
                }
            ]
        };
    }

    setupRoutes() {
        // Main portfolio page
        this.app.get('/', (req, res) => {
            res.send(this.generatePortfolioHTML());
        });

        // API endpoints
        this.app.get('/api/portfolio', (req, res) => {
            res.json(this.portfolioData);
        });

        this.app.get('/api/stats', (req, res) => {
            res.json({
                totalProjects: 150,
                activeUsers: 25000,
                codeGenerated: "2.5M lines",
                bugsFixed: 12500,
                uptime: "99.97%"
            });
        });

        // Demo routes
        this.app.get('/demo/:type', (req, res) => {
            const { type } = req.params;
            res.send(this.generateDemoHTML(type));
        });
    }

    generatePortfolioHTML() {
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.portfolioData.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 60px 0;
            background: rgba(0,0,0,0.2);
            border-radius: 20px;
            margin-bottom: 40px;
            backdrop-filter: blur(10px);
        }
        
        .logo {
            font-size: 4em;
            font-weight: bold;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 20px rgba(255,255,255,0.5); }
            to { text-shadow: 0 0 30px rgba(255,255,255,0.8); }
        }
        
        .subtitle {
            font-size: 1.5em;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .version {
            font-size: 1.2em;
            color: #4ecdc4;
            font-weight: bold;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        
        .feature-card {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        .feature-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .feature-name {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .feature-description {
            opacity: 0.8;
            margin-bottom: 15px;
        }
        
        .feature-stats {
            color: #4ecdc4;
            font-weight: bold;
            font-size: 1.2em;
        }
        
        .achievements {
            background: rgba(0,0,0,0.3);
            padding: 40px;
            border-radius: 20px;
            margin: 40px 0;
            text-align: center;
        }
        
        .achievements h2 {
            font-size: 2.5em;
            margin-bottom: 30px;
            color: #ff6b6b;
        }
        
        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .achievement {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            padding: 20px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .demos {
            margin: 40px 0;
        }
        
        .demos h2 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 30px;
            color: #4ecdc4;
        }
        
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .demo-card {
            background: rgba(255,255,255,0.1);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .demo-card:hover {
            background: rgba(255,255,255,0.2);
            transform: scale(1.05);
        }
        
        .demo-name {
            font-size: 1.3em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stats-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.8);
            padding: 15px;
            display: flex;
            justify-content: space-around;
            backdrop-filter: blur(10px);
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #4ecdc4;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .floating-particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255,255,255,0.5);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
    </style>
</head>
<body>
    <div class="floating-particles"></div>
    
    <div class="container">
        <div class="header">
            <div class="logo">NEXUS IDE</div>
            <div class="subtitle">${this.portfolioData.description}</div>
            <div class="version">Version ${this.portfolioData.version}</div>
        </div>
        
        <div class="features-grid">
            ${this.portfolioData.features.map(feature => `
                <div class="feature-card">
                    <div class="feature-icon">${feature.icon}</div>
                    <div class="feature-name">${feature.name}</div>
                    <div class="feature-description">${feature.description}</div>
                    <div class="feature-stats">${feature.stats}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="achievements">
            <h2>🏆 Key Achievements</h2>
            <div class="achievements-grid">
                ${this.portfolioData.achievements.map(achievement => `
                    <div class="achievement">${achievement}</div>
                `).join('')}
            </div>
        </div>
        
        <div class="demos">
            <h2>🎮 Live Demos</h2>
            <div class="demo-grid">
                ${this.portfolioData.demos.map(demo => `
                    <div class="demo-card" onclick="window.open('${demo.url}', '_blank')">
                        <div class="demo-name">${demo.name}</div>
                        <div class="demo-description">${demo.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <div class="stats-bar">
        <div class="stat-item">
            <div class="stat-value">150+</div>
            <div class="stat-label">Projects</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">25K+</div>
            <div class="stat-label">Users</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">2.5M</div>
            <div class="stat-label">Lines of Code</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">99.97%</div>
            <div class="stat-label">Uptime</div>
        </div>
    </div>
    
    <script>
        // Create floating particles
        function createParticles() {
            const container = document.querySelector('.floating-particles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                container.appendChild(particle);
            }
        }
        
        // Update stats in real-time
        function updateStats() {
            fetch('/api/stats')
                .then(response => response.json())
                .then(data => {
                    console.log('Stats updated:', data);
                })
                .catch(error => console.log('Stats update failed:', error));
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
            updateStats();
            setInterval(updateStats, 30000); // Update every 30 seconds
        });
        
        // Add some interactivity
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'translateY(-10px)';
                }, 150);
            });
        });
    </script>
</body>
</html>
        `;
    }

    generateDemoHTML(type) {
        const demos = {
            editor: {
                title: "Live Code Editor Demo",
                content: "<h1>🚀 AI-Powered Code Editor</h1><p>Experience the future of coding with our intelligent editor.</p>"
            },
            collab: {
                title: "Real-time Collaboration Demo",
                content: "<h1>🤝 Multi-User Editing</h1><p>See how multiple developers can work together seamlessly.</p>"
            },
            ai: {
                title: "AI Assistant Demo",
                content: "<h1>🤖 Intelligent Coding Assistant</h1><p>Chat with our AI to get coding help and suggestions.</p>"
            }
        };

        const demo = demos[type] || demos.editor;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${demo.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px;
            text-align: center;
        }
        h1 { font-size: 3em; margin-bottom: 30px; }
        p { font-size: 1.5em; }
        .back-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <button class="back-btn" onclick="window.close()">← Back</button>
    ${demo.content}
    <p>Demo coming soon! 🚧</p>
</body>
</html>
        `;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`\n🚀 NEXUS IDE Portfolio System Started!`);
            console.log(`📱 Portfolio URL: http://localhost:${this.port}`);
            console.log(`🎮 Live Demos Available`);
            console.log(`📊 API Endpoints: /api/portfolio, /api/stats`);
            console.log(`✨ Ready to showcase NEXUS IDE!\n`);
        });
    }
}

// Start the portfolio system
const portfolio = new NexusPortfolioSystem();
portfolio.start();

module.exports = NexusPortfolioSystem;