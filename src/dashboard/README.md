# 🛡️ Enterprise Security Dashboard

## 📋 Overview

Enterprise Security Dashboard เป็นระบบ dashboard ที่ออกแบบมาเพื่อการจัดการความปลอดภัยระดับองค์กร พร้อมด้วยฟีเจอร์ขั้นสูงสำหรับการติดตาม วิเคราะห์ และจัดการความเสี่ยงด้านความปลอดภัย

### ✨ Key Features

- 🔐 **Enterprise-grade Security**: ระบบความปลอดภัยระดับองค์กร
- 📊 **Real-time Monitoring**: การติดตามแบบ real-time
- 🤖 **AI-Powered Analytics**: การวิเคราะห์ด้วย AI
- 🔄 **Multi-tenant Architecture**: รองรับหลาย tenant
- 📈 **Advanced Visualization**: การแสดงผลข้อมูลขั้นสูง
- 🚨 **Threat Intelligence**: ระบบข่าวกรองภัยคุกคาม
- 📋 **Compliance Management**: การจัดการมาตรฐานความปลอดภัย
- 🔍 **Audit Logging**: ระบบ audit log ที่ครบถ้วน

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   React     │ │   Chart.js  │ │    WebSocket        │  │
│  │   Dashboard │ │   Visualize │ │    Real-time        │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Express   │ │   Security  │ │    Rate Limiting    │  │
│  │   Server    │ │ Middleware  │ │    & Validation     │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Security  │ │   Threat    │ │    Compliance       │  │
│  │   Analytics │ │ Intelligence│ │    Management       │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ PostgreSQL  │ │    Redis    │ │     MongoDB         │  │
│  │  Database   │ │    Cache    │ │   Document Store    │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL >= 13
- Redis >= 6.0
- MongoDB >= 5.0 (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd security-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Database Setup**
   ```bash
   # PostgreSQL
   createdb security_dashboard
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
src/dashboard/
├── config/                 # Configuration files
│   └── dashboard-config.js  # Main configuration
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication & Authorization
│   ├── security.js        # Security middleware
│   └── validation.js      # Request validation
├── routes/                # API routes
│   ├── api.js            # Main API endpoints
│   └── websocket.js      # WebSocket handlers
├── utils/                 # Utility functions
│   ├── logger.js         # Advanced logging system
│   ├── security.js       # Security utilities
│   └── database.js       # Database utilities
├── public/               # Static files
│   ├── index.html        # Main HTML file
│   ├── static/
│   │   ├── css/          # Stylesheets
│   │   └── js/           # JavaScript files
│   └── assets/           # Images and other assets
├── server.js             # Main server file
└── package.json          # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=security_dashboard
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security Configuration
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
SESSION_SECRET=your-session-secret

# External Services
THREAT_INTEL_API_KEY=your-threat-intel-key
SIEM_ENDPOINT=https://your-siem-endpoint
```

### Database Configuration

The dashboard supports multiple database systems:

- **PostgreSQL**: Primary database for structured data
- **Redis**: Caching and session storage
- **MongoDB**: Document storage for logs and analytics (optional)

## 🛡️ Security Features

### Authentication & Authorization

- **Multi-factor Authentication (MFA)**
- **Role-based Access Control (RBAC)**
- **JWT Token Management**
- **Session Management**
- **Password Policies**

### Security Middleware

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Request sanitization
- **SQL Injection Protection**
- **XSS Protection**

### Monitoring & Logging

- **Security Event Logging**
- **Performance Monitoring**
- **Audit Trail**
- **Real-time Alerts**
- **Threat Detection**

## 📊 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/mfa/setup
POST /api/auth/mfa/verify
```

### Dashboard Endpoints

```http
GET  /api/dashboard/overview
GET  /api/dashboard/stats
GET  /api/dashboard/threats
GET  /api/dashboard/incidents
GET  /api/dashboard/compliance
```

### Security Monitoring

```http
GET  /api/security/events
GET  /api/security/threats
GET  /api/security/vulnerabilities
POST /api/security/incidents
GET  /api/security/audit-logs
```

### System Management

```http
GET  /api/system/health
GET  /api/system/metrics
GET  /api/system/performance
POST /api/system/config
GET  /api/system/users
```

## 🔄 WebSocket Events

### Real-time Data Streams

```javascript
// Security Events
socket.on('security:threat-detected', (data) => {
  // Handle threat detection
});

// System Monitoring
socket.on('system:performance-update', (data) => {
  // Handle performance updates
});

// Collaboration
socket.on('collaboration:user-joined', (data) => {
  // Handle user collaboration
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t security-dashboard .

# Run with Docker Compose
docker-compose up -d
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
npm run pm2:start

# Monitor application
npm run pm2:monitor
```

### Cloud Deployment

- **AWS**: ECS, EKS, or EC2
- **Google Cloud**: GKE or Compute Engine
- **Azure**: AKS or Virtual Machines
- **Heroku**: Direct deployment

## 📈 Performance Optimization

### Caching Strategy

- **Redis Caching**: API responses and session data
- **Memory Caching**: Frequently accessed data
- **CDN**: Static assets delivery

### Database Optimization

- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries
- **Read Replicas**: Load distribution

### Monitoring

- **Application Performance Monitoring (APM)**
- **Real-time Metrics**
- **Error Tracking**
- **Performance Profiling**

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   npm run db:check
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis connectivity
   npm run redis:check
   ```

3. **Authentication Issues**
   ```bash
   # Reset JWT secrets
   npm run auth:reset
   ```

### Logging

```bash
# View application logs
npm run logs

# View error logs
npm run logs:error

# View security logs
npm run logs:security
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@your-domain.com

## 🔗 Related Projects

- [Git Memory MCP Server](../../../README.md)
- [AI Central Server](../../ai-central/README.md)
- [Security Utilities](../utils/README.md)

---

**Built with ❤️ for Enterprise Security**