# 🛠️ NEXUS IDE Development Guide

## 📋 Overview

This guide provides comprehensive information for developers who want to contribute to the Git Memory MCP Server and NEXUS IDE integration project. This document is automatically synchronized with the codebase and PRD updates.

### 🔄 Auto-Update System

This development guide is part of an automated system that ensures consistency between:
- Product Requirements Document (PRD)
- Codebase changes
- Documentation updates
- NEXUS IDE integration

When any component is modified, the system automatically updates related documentation and configurations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Environment](#development-environment)
4. [Architecture Overview](#architecture-overview)
5. [Core Components](#core-components)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Git**: Version 2.30 or higher
- **SQLite**: For local development database
- **Docker**: Optional, for containerized development

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/your-org/git-memory-mcp-server.git
cd git-memory-mcp-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8080
DASHBOARD_PORT=8081
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Git Configuration
GIT_MEMORY_PATH=./memory-repos
GIT_USER_NAME="MCP Server"
GIT_USER_EMAIL="mcp@example.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_COLLECTION_INTERVAL=60000

# Security
CORS_ORIGIN=http://localhost:3000
API_KEY_HEADER=X-API-Key

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

## Project Structure

```
git-memory-mcp-server/
├── src/                          # Source code
│   ├── api-gateway/             # API Gateway implementation
│   │   ├── api-gateway-main.js  # Main gateway server
│   │   ├── api-gateway-middleware.js
│   │   └── api-gateway-dashboard.js
│   ├── auth/                    # Authentication system
│   │   ├── auth-middleware.js   # Auth middleware
│   │   ├── auth-routes.js       # Auth routes
│   │   ├── auth-module.js       # Auth module
│   │   └── user-service.js      # User management
│   ├── coordinator/             # MCP Coordinator
│   │   ├── coordinator.js       # Main coordinator
│   │   └── load-balancer.js     # Load balancing
│   ├── memory/                  # Memory management
│   │   ├── git-memory.js        # Git-based memory
│   │   └── memory-operations.js # Memory operations
│   ├── monitoring/              # Monitoring system
│   │   ├── health-monitor.js    # Health monitoring
│   │   ├── metrics-collector.js # Metrics collection
│   │   └── alert-system.js      # Alert system
│   ├── security/                # Security components
│   │   ├── security-middleware.js
│   │   └── rate-limiter.js
│   ├── utils/                   # Utility functions
│   │   ├── logger.js            # Logging utility
│   │   ├── config.js            # Configuration
│   │   └── helpers.js           # Helper functions
│   ├── mcp-server.js           # Core MCP server
│   └── main.js                 # Application entry point
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── DEVELOPMENT.md          # This file
│   └── DEPLOYMENT.md           # Deployment guide
├── prisma/                     # Database schema
│   ├── schema.prisma           # Prisma schema
│   └── migrations/             # Database migrations
├── docker/                     # Docker configuration
│   ├── Dockerfile              # Main Dockerfile
│   └── docker-compose.yml      # Docker Compose
├── scripts/                    # Build and utility scripts
├── .env.example               # Environment variables template
├── package.json               # Node.js dependencies
├── jest.config.js             # Jest configuration
└── README.md                  # Project README
```

## Development Environment

### IDE Setup

#### Visual Studio Code

Recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-jest"
  ]
}
```

#### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:debug        # Start with debugging enabled
npm run dev:dashboard    # Start only dashboard

# Building
npm run build            # Build for production
npm run build:watch      # Build with watch mode

# Testing
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Database
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:dev       # Run development environment
```

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Dashboard     │    │   External APIs │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │  - Authentication         │
                    │  - Rate Limiting          │
                    │  - Load Balancing         │
                    │  - Request Routing        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    MCP Coordinator        │
                    │  - Server Management      │
                    │  - Health Monitoring      │
                    │  - Resource Allocation    │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                        │                         │
┌───────┴───────┐    ┌───────────┴───────────┐    ┌───────┴───────┐
│  MCP Server 1 │    │    MCP Server 2       │    │  MCP Server N │
│               │    │                       │    │               │
│ ┌───────────┐ │    │ ┌───────────────────┐ │    │ ┌───────────┐ │
│ │Git Memory │ │    │ │   Git Memory      │ │    │ │Git Memory │ │
│ │Repository │ │    │ │   Repository      │ │    │ │Repository │ │
│ └───────────┘ │    │ └───────────────────┘ │    │ └───────────┘ │
└───────────────┘    └───────────────────────┘    └───────────────┘
```

### Component Interaction Flow

1. **Client Request** → API Gateway
2. **API Gateway** → Authentication & Rate Limiting
3. **API Gateway** → MCP Coordinator (if authenticated)
4. **MCP Coordinator** → Target MCP Server (load balanced)
5. **MCP Server** → Git Memory Repository (for persistence)
6. **Response** flows back through the same chain

## Core Components

### 1. API Gateway (`src/api-gateway/`)

**Purpose**: Central entry point for all API requests

**Key Features**:
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and security
- Request/response logging
- CORS handling

**Main Files**:
- `api-gateway-main.js`: Main server implementation
- `api-gateway-middleware.js`: Middleware functions
- `api-gateway-dashboard.js`: Management dashboard

### 2. Authentication System (`src/auth/`)

**Purpose**: User management and authentication

**Key Features**:
- JWT-based authentication
- User registration and login
- Role-based access control (RBAC)
- Session management
- Password security

**Main Files**:
- `auth-middleware.js`: Authentication middleware
- `auth-routes.js`: Authentication endpoints
- `user-service.js`: User management logic
- `auth-module.js`: Authentication module

### 3. MCP Coordinator (`src/coordinator/`)

**Purpose**: Orchestrates multiple MCP servers

**Key Features**:
- Server lifecycle management
- Health monitoring
- Load balancing
- Resource allocation
- Automatic scaling

**Main Files**:
- `coordinator.js`: Main coordinator logic
- `load-balancer.js`: Load balancing algorithms

### 4. Memory Management (`src/memory/`)

**Purpose**: Git-based persistent memory system

**Key Features**:
- Version-controlled memory storage
- Distributed memory sharing
- Automatic backup and recovery
- Memory operations (CRUD)
- Git integration

**Main Files**:
- `git-memory.js`: Git memory implementation
- `memory-operations.js`: Memory CRUD operations

### 5. Monitoring System (`src/monitoring/`)

**Purpose**: System health and performance monitoring

**Key Features**:
- Real-time health checks
- Performance metrics collection
- Alert system
- Dashboard integration
- Historical data tracking

**Main Files**:
- `health-monitor.js`: Health monitoring
- `metrics-collector.js`: Metrics collection
- `alert-system.js`: Alert management

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ...

# Run tests
npm test

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Code Style Guidelines

#### JavaScript/Node.js

```javascript
// Use ES6+ features
const { someFunction } = require('./utils');

// Use async/await instead of callbacks
async function fetchData() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    logger.error('Error fetching data:', error);
    throw error;
  }
}

// Use descriptive variable names
const userAuthenticationToken = generateToken(user);

// Add JSDoc comments for functions
/**
 * Authenticates user credentials
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<Object>} Authentication result
 */
async function authenticateUser(username, password) {
  // Implementation
}
```

#### Error Handling

```javascript
// Use custom error classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Consistent error responses
function handleError(error, res) {
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: {
      code: error.name || 'INTERNAL_ERROR',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };
  
  res.status(statusCode).json(response);
}
```

### 3. Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_new_table

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### 4. Adding New API Endpoints

1. **Define route in appropriate router**:

```javascript
// src/auth/auth-routes.js
class AuthRoutes {
  setupRoutes() {
    this.router.post('/new-endpoint', 
      this.authMiddleware.verifyToken.bind(this.authMiddleware),
      this.newEndpointHandler.bind(this)
    );
  }

  async newEndpointHandler(req, res) {
    try {
      // Implementation
      res.json({ success: true, data: result });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
```

2. **Add validation**:

```javascript
const Joi = require('joi');

const newEndpointSchema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().min(0)
});

// In handler
const { error, value } = newEndpointSchema.validate(req.body);
if (error) {
  throw new ValidationError(error.details[0].message);
}
```

3. **Write tests**:

```javascript
// tests/integration/auth-integration.test.ts
describe('New Endpoint', () => {
  it('should handle valid request', async () => {
    const response = await request(app)
      .post('/api/auth/new-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send({ field1: 'value1', field2: 123 })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should reject invalid request', async () => {
    const response = await request(app)
      .post('/api/auth/new-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send({ field1: '' }) // Invalid data
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
```

## Testing

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── auth/
│   ├── coordinator/
│   ├── memory/
│   └── utils/
├── integration/             # Integration tests
│   ├── auth-integration.test.ts
│   ├── server-integration.test.ts
│   └── memory-integration.test.ts
└── e2e/                     # End-to-end tests
    ├── api-workflow.test.ts
    └── dashboard.test.ts
```

### Writing Tests

#### Unit Tests

```javascript
// tests/unit/auth/user-service.test.js
const UserService = require('../../../src/auth/user-service');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('registerUser', () => {
    it('should register new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'securepassword'
      };

      const result = await userService.registerUser(userData);

      expect(result.success).toBe(true);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject duplicate username', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'securepassword'
      };

      await expect(userService.registerUser(userData))
        .rejects
        .toThrow('Username already exists');
    });
  });
});
```

#### Integration Tests

```javascript
// tests/integration/api-integration.test.ts
const request = require('supertest');
const app = require('../../src/api-gateway/api-gateway-main');

describe('API Integration', () => {
  let authToken;

  beforeAll(async () => {
    // Setup test user and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('Server Management', () => {
    it('should create new MCP server', async () => {
      const serverData = {
        name: 'test-server',
        config: { port: 3000 }
      };

      const response = await request(app)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serverData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.server.name).toBe(serverData.name);
    });
  });
});
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/main.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.ts'
  ]
};
```

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Set production environment
export NODE_ENV=production

# Start production server
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
    volumes:
      - ./data:/app/data
      - ./memory-repos:/app/memory-repos
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL="file:./dev.db"
```

#### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL="file:./staging.db"
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

## Contributing

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** following code style guidelines
4. **Add tests** for new functionality
5. **Run test suite**: `npm test`
6. **Update documentation** if needed
7. **Commit changes**: `git commit -m 'feat: add amazing feature'`
8. **Push to branch**: `git push origin feature/amazing-feature`
9. **Create Pull Request**

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add OAuth2 authentication
fix(coordinator): resolve memory leak in server management
docs(api): update authentication endpoints documentation
```

### Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Error handling is appropriate
- [ ] Logging is adequate
- [ ] Breaking changes are documented

## Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Symptoms**: Server fails to start with port binding errors

**Solutions**:
```bash
# Check if port is in use
lsof -i :8080

# Kill process using port
kill -9 <PID>

# Or use different port
export PORT=8081
npm start
```

#### 2. Database Connection Issues

**Symptoms**: Database connection errors

**Solutions**:
```bash
# Reset database
npm run db:reset

# Check database file permissions
ls -la *.db

# Regenerate Prisma client
npx prisma generate
```

#### 3. Authentication Failures

**Symptoms**: JWT token validation errors

**Solutions**:
```bash
# Check JWT secret configuration
echo $JWT_SECRET

# Clear existing tokens
# (logout and login again)

# Check token expiration
# Use jwt.io to decode token
```

#### 4. Memory Repository Issues

**Symptoms**: Git memory operations failing

**Solutions**:
```bash
# Check Git configuration
git config --list

# Initialize memory repository
git init memory-repos/default

# Check file permissions
ls -la memory-repos/
```

#### 5. High Memory Usage

**Symptoms**: Server consuming excessive memory

**Solutions**:
```bash
# Monitor memory usage
node --inspect src/main.js

# Enable garbage collection logging
node --trace-gc src/main.js

# Check for memory leaks in tests
npm run test:memory
```

### Debug Mode

```bash
# Start with debugging
DEBUG=* npm run dev

# Debug specific modules
DEBUG=auth:*,coordinator:* npm run dev

# Node.js inspector
node --inspect-brk src/main.js
```

### Logging

```javascript
// Use structured logging
const logger = require('./src/utils/logger');

logger.info('Server started', { port: 8080, env: 'development' });
logger.error('Database connection failed', { error: error.message });
logger.debug('Processing request', { userId: req.user.id, endpoint: req.path });
```

### Performance Monitoring

```bash
# Monitor performance
npm run monitor

# Generate performance report
npm run perf:report

# Profile memory usage
node --prof src/main.js
```

## Additional Resources

### Documentation
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Decision Records](./ADR/)

### External Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Community
- [GitHub Discussions](https://github.com/your-org/git-memory-mcp-server/discussions)
- [Discord Server](https://discord.gg/git-memory-mcp)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/git-memory-mcp)

---

**Happy coding! 🚀**

For questions or support, please reach out through our [GitHub Issues](https://github.com/your-org/git-memory-mcp-server/issues) or [Discord community](https://discord.gg/git-memory-mcp).