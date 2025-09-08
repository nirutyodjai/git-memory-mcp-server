# 🔐 Enterprise Security System for Git Memory MCP Server

## 📋 Overview

Enterprise-grade Security System ที่ออกแบบมาเพื่อให้ความปลอดภัยระดับองค์กรสำหรับ Git Memory MCP Server พร้อมด้วยฟีเจอร์ความปลอดภัยที่ครอบคลุมและทันสมัย

### 🎯 Key Features

- **🏢 Multi-Tenant Architecture**: รองรับหลายองค์กรในระบบเดียว
- **🔑 Advanced Authentication**: JWT, API Keys, OAuth 2.0, Multi-Factor Authentication
- **👥 Role-Based Access Control (RBAC)**: ระบบจัดการสิทธิ์ที่ละเอียดและยืดหยุ่น
- **🛡️ Real-time Security Monitoring**: ติดตามความปลอดภัยแบบ real-time
- **📊 Comprehensive Audit Logging**: บันทึกการใช้งานและเหตุการณ์ความปลอดภัย
- **🚨 Threat Detection & Response**: ตรวจจับและตอบสนองภัยคุกคาม
- **📈 Performance Monitoring**: ติดตามประสิทธิภาพระบบ
- **🔧 Dynamic Configuration**: จัดการการตั้งค่าแบบ dynamic
- **🧪 Security Testing Suite**: ชุดทดสอบความปลอดภัยที่ครอบคลุม

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Redis (optional, for session management)
- MongoDB/MySQL/PostgreSQL (optional, for data persistence)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/git-memory-mcp-server.git
cd git-memory-mcp-server

# Install security dependencies
npm install --package-lock-only -f package-security.json

# Copy security configuration
cp .env.security.example .env.security

# Edit configuration
nano .env.security
```

### Basic Usage

```bash
# Start the security system
npm run start

# Start in development mode
npm run start:dev

# Start in production mode
npm run start:prod
```

### Using the Security System

```javascript
const { createSecuritySystem } = require('./src/security/securityIntegration');

// Create security system instance
const securitySystem = createSecuritySystem({
    port: 3333,
    host: 'localhost',
    environment: 'development',
    enableDashboard: true,
    enableAPI: true,
    enableMonitoring: true,
    enableAudit: true
});

// Start the system
await securitySystem.start();

// Listen to security events
securitySystem.on('security_event', (event) => {
    console.log('Security Event:', event);
});

securitySystem.on('threat_detected', (threat) => {
    console.log('Threat Detected:', threat);
});
```

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Integration Layer                    │
├─────────────────────────────────────────────────────────────────┤
│  Authentication  │  Authorization  │   Monitoring   │   Audit   │
│   Middleware     │   Middleware    │    Service     │  Service  │
├─────────────────────────────────────────────────────────────────┤
│     User         │    Security     │  Configuration │ Integration│
│    Service       │   Middleware    │    Manager     │  Service  │
├─────────────────────────────────────────────────────────────────┤
│  Security API    │   Dashboard     │    Routes      │   Tests   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Services

1. **Authentication Service** (`authMiddleware.js`)
   - JWT token management
   - API key validation
   - Multi-factor authentication
   - Session management

2. **User Management Service** (`userService.js`)
   - User CRUD operations
   - Role and permission management
   - Multi-tenant user isolation
   - Password policies

3. **Audit Service** (`auditService.js`)
   - Security event logging
   - Compliance reporting
   - Log rotation and archival
   - Real-time alerting

4. **Monitoring Service** (`monitoringService.js`)
   - Performance metrics
   - Security metrics
   - Health checks
   - Anomaly detection

5. **Security Configuration Manager** (`securityConfigManager.js`)
   - Dynamic configuration
   - Configuration validation
   - Configuration history
   - Environment-specific settings

---

## 🔧 Configuration

### Environment Variables

```bash
# Security Configuration
SECURITY_PORT=3333
SECURITY_HOST=localhost
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# API Key Configuration
API_KEY_LENGTH=32
API_KEY_EXPIRES_IN=30d

# Database Configuration
DB_TYPE=mongodb
DB_HOST=localhost
DB_PORT=27017
DB_NAME=security_db
DB_USER=security_user
DB_PASS=security_password

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Security Settings
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
CSRF_SECRET=your-csrf-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000

# Audit Logging
AUDIT_ENABLED=true
AUDIT_LOG_LEVEL=info
AUDIT_RETENTION_DAYS=90

# Email Configuration (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Notification Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Security Configuration File

```json
{
  "security": {
    "authentication": {
      "jwt": {
        "enabled": true,
        "algorithm": "HS256",
        "expiresIn": "24h",
        "refreshExpiresIn": "7d"
      },
      "apiKey": {
        "enabled": true,
        "length": 32,
        "expiresIn": "30d"
      },
      "oauth": {
        "enabled": true,
        "providers": ["google", "github"]
      },
      "mfa": {
        "enabled": true,
        "methods": ["totp", "sms", "email"]
      }
    },
    "authorization": {
      "rbac": {
        "enabled": true,
        "strictMode": true
      },
      "permissions": {
        "inheritance": true,
        "caching": true
      }
    },
    "security": {
      "rateLimiting": {
        "enabled": true,
        "windowMs": 900000,
        "maxRequests": 100
      },
      "cors": {
        "enabled": true,
        "allowedOrigins": ["http://localhost:3000"]
      },
      "csrf": {
        "enabled": true
      },
      "helmet": {
        "enabled": true
      }
    },
    "monitoring": {
      "enabled": true,
      "interval": 30000,
      "metrics": {
        "performance": true,
        "security": true,
        "audit": true
      }
    },
    "audit": {
      "enabled": true,
      "level": "info",
      "retention": 90,
      "encryption": true
    }
  }
}
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/security/auth/login`
Login with username/password

```json
{
  "username": "user@example.com",
  "password": "password123",
  "tenantId": "tenant-uuid"
}
```

#### POST `/api/security/auth/refresh`
Refresh JWT token

```json
{
  "refreshToken": "refresh-token-here"
}
```

#### POST `/api/security/auth/logout`
Logout and invalidate tokens

### User Management Endpoints

#### GET `/api/security/users`
Get all users (with pagination)

#### POST `/api/security/users`
Create new user

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "roles": ["user"],
  "tenantId": "tenant-uuid"
}
```

#### PUT `/api/security/users/:id`
Update user

#### DELETE `/api/security/users/:id`
Delete user

### Role & Permission Endpoints

#### GET `/api/security/roles`
Get all roles

#### POST `/api/security/roles`
Create new role

```json
{
  "name": "editor",
  "description": "Content Editor Role",
  "permissions": ["read", "write"],
  "tenantId": "tenant-uuid"
}
```

### API Key Management

#### GET `/api/security/api-keys`
Get user's API keys

#### POST `/api/security/api-keys`
Generate new API key

```json
{
  "name": "My API Key",
  "permissions": ["read"],
  "expiresIn": "30d"
}
```

### Security Monitoring

#### GET `/api/security/monitoring/status`
Get security status

#### GET `/api/security/monitoring/metrics`
Get security metrics

#### GET `/api/security/monitoring/threats`
Get detected threats

### Audit Logs

#### GET `/api/security/audit/logs`
Get audit logs (with filtering)

#### GET `/api/security/audit/events`
Get security events

#### GET `/api/security/audit/reports`
Get compliance reports

---

## 🎨 Security Dashboard

Access the web-based security dashboard at: `http://localhost:3333/dashboard`

### Dashboard Features

- **Real-time Security Status**: ภาพรวมความปลอดภัยแบบ real-time
- **User Management**: จัดการผู้ใช้และสิทธิ์
- **Role & Permission Management**: จัดการบทบาทและสิทธิ์
- **API Key Management**: จัดการ API keys
- **Security Monitoring**: ติดตามความปลอดภัย
- **Audit Logs Viewer**: ดูบันทึกการตรวจสอบ
- **Threat Detection**: ตรวจจับภัยคุกคาม
- **Configuration Management**: จัดการการตั้งค่า
- **Performance Metrics**: เมตริกประสิทธิภาพ
- **Compliance Reports**: รายงานการปฏิบัติตามกฎระเบียบ

---

## 🧪 Testing

### Running Tests

```bash
# Run all security tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run security audit
npm run security:audit

# Run security scan
npm run security:scan

# Run penetration tests
npm run security:penetration
```

### Test Categories

1. **Authentication Tests**
   - JWT token validation
   - API key authentication
   - Multi-factor authentication
   - Session management

2. **Authorization Tests**
   - Role-based access control
   - Permission validation
   - Multi-tenant isolation

3. **Security Tests**
   - Input validation
   - XSS protection
   - CSRF protection
   - SQL injection prevention

4. **Performance Tests**
   - Load testing
   - Stress testing
   - Rate limiting

5. **Penetration Tests**
   - Vulnerability scanning
   - Security assessment
   - Compliance testing

---

## 📊 Monitoring & Alerting

### Metrics Collected

- **Security Metrics**
  - Failed login attempts
  - Suspicious activities
  - API usage patterns
  - Permission violations

- **Performance Metrics**
  - Response times
  - Throughput
  - Error rates
  - Resource usage

- **Audit Metrics**
  - Event counts
  - Compliance status
  - Log integrity

### Alert Rules

- **Security Alerts**
  - Multiple failed logins
  - Suspicious IP addresses
  - Privilege escalation attempts
  - Data access violations

- **Performance Alerts**
  - High response times
  - Error rate spikes
  - Resource exhaustion

- **System Alerts**
  - Service failures
  - Configuration changes
  - Compliance violations

---

## 🔒 Security Best Practices

### Implementation Guidelines

1. **Authentication**
   - Use strong JWT secrets
   - Implement token rotation
   - Enable multi-factor authentication
   - Use secure session management

2. **Authorization**
   - Follow principle of least privilege
   - Implement proper RBAC
   - Validate permissions on every request
   - Use tenant isolation

3. **Data Protection**
   - Encrypt sensitive data
   - Use HTTPS everywhere
   - Implement proper input validation
   - Sanitize all outputs

4. **Monitoring**
   - Log all security events
   - Monitor for anomalies
   - Set up proper alerting
   - Regular security assessments

### Security Checklist

- [ ] Strong authentication mechanisms
- [ ] Proper authorization controls
- [ ] Input validation and sanitization
- [ ] Output encoding
- [ ] HTTPS enforcement
- [ ] Security headers implementation
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Audit logging
- [ ] Security monitoring
- [ ] Regular security testing
- [ ] Compliance validation

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: git-memory-security
  namespace: security
spec:
  replicas: 3
  selector:
    matchLabels:
      app: git-memory-security
  template:
    metadata:
      labels:
        app: git-memory-security
    spec:
      containers:
      - name: security
        image: git-memory-security:latest
        ports:
        - containerPort: 3333
        env:
        - name: NODE_ENV
          value: "production"
        - name: SECURITY_PORT
          value: "3333"
```

### Production Considerations

1. **Environment Setup**
   - Use production-grade databases
   - Configure proper logging
   - Set up monitoring and alerting
   - Implement backup strategies

2. **Security Hardening**
   - Use strong secrets
   - Enable all security features
   - Regular security updates
   - Network security configuration

3. **Performance Optimization**
   - Enable caching
   - Configure load balancing
   - Optimize database queries
   - Monitor resource usage

---

## 📚 Documentation

### Additional Resources

- [API Documentation](./docs/api.md)
- [Configuration Guide](./docs/configuration.md)
- [Security Guide](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

### Code Documentation

```bash
# Generate code documentation
npm run docs
```

---

## 🤝 Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Install development dependencies
npm install --only=dev

# Set up pre-commit hooks
npm run prepare
```

### Code Standards

- Follow ESLint configuration
- Use Prettier for formatting
- Write comprehensive tests
- Document all functions
- Follow security best practices

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Run security audit
6. Submit pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

- [GitHub Issues](https://github.com/your-org/git-memory-mcp-server/issues)
- [Documentation](https://docs.your-org.com/security)
- [Community Forum](https://community.your-org.com)
- [Security Contact](mailto:security@your-org.com)

### Security Issues

For security vulnerabilities, please email: security@your-org.com

**Do not create public GitHub issues for security vulnerabilities.**

---

## 🔄 Changelog

### Version 1.0.0 (Current)

- ✅ Initial release
- ✅ Multi-tenant architecture
- ✅ JWT & API key authentication
- ✅ Role-based access control
- ✅ Real-time monitoring
- ✅ Comprehensive audit logging
- ✅ Security dashboard
- ✅ Threat detection
- ✅ Configuration management
- ✅ Security testing suite

### Roadmap

- 🔄 OAuth 2.0 integration
- 🔄 SAML support
- 🔄 Advanced threat detection
- 🔄 Machine learning anomaly detection
- 🔄 Compliance automation
- 🔄 Mobile app support
- 🔄 API rate limiting per user
- 🔄 Advanced reporting

---

**Built with ❤️ for Enterprise Security**