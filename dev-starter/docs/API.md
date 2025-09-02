# Git Memory MCP Server - API Documentation

## Overview

Git Memory MCP Server provides a comprehensive RESTful API for managing MCP (Model Context Protocol) servers with persistent Git-based memory. This documentation covers all available endpoints, authentication, and usage examples.

## Base URL

```
http://localhost:8080/api
```

## Authentication

The API uses JWT (JSON Web Token) based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-string",
  "refreshToken": "refresh-token-string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token-string",
  "refreshToken": "new-refresh-token-string"
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /auth/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "email": "string",
  "username": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### PUT /auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### MCP Server Management

#### GET /servers
Get list of all MCP servers.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status` (optional): Filter by server status (running, stopped, error)
- `limit` (optional): Number of servers to return (default: 50)
- `offset` (optional): Number of servers to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "servers": [
    {
      "id": "string",
      "name": "string",
      "status": "running",
      "port": 3000,
      "health": "healthy",
      "uptime": 3600,
      "lastHealthCheck": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

#### POST /servers
Create a new MCP server.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "string",
  "config": {
    "port": 3000,
    "memory": {
      "type": "git",
      "repository": "path/to/repo"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Server created successfully",
  "server": {
    "id": "string",
    "name": "string",
    "status": "starting",
    "port": 3000,
    "config": {
      "port": 3000,
      "memory": {
        "type": "git",
        "repository": "path/to/repo"
      }
    }
  }
}
```

#### GET /servers/:id
Get specific MCP server details.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "server": {
    "id": "string",
    "name": "string",
    "status": "running",
    "port": 3000,
    "health": "healthy",
    "uptime": 3600,
    "metrics": {
      "requestCount": 1000,
      "errorCount": 5,
      "averageResponseTime": 50
    },
    "config": {
      "port": 3000,
      "memory": {
        "type": "git",
        "repository": "path/to/repo"
      }
    }
  }
}
```

#### PUT /servers/:id
Update MCP server configuration.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "string",
  "config": {
    "port": 3001,
    "memory": {
      "type": "git",
      "repository": "path/to/new/repo"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Server updated successfully",
  "server": {
    "id": "string",
    "name": "string",
    "status": "running",
    "config": {
      "port": 3001,
      "memory": {
        "type": "git",
        "repository": "path/to/new/repo"
      }
    }
  }
}
```

#### DELETE /servers/:id
Delete MCP server.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Server deleted successfully"
}
```

#### POST /servers/:id/start
Start MCP server.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Server started successfully",
  "server": {
    "id": "string",
    "status": "starting"
  }
}
```

#### POST /servers/:id/stop
Stop MCP server.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Server stopped successfully",
  "server": {
    "id": "string",
    "status": "stopped"
  }
}
```

#### POST /servers/:id/restart
Restart MCP server.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Server restarted successfully",
  "server": {
    "id": "string",
    "status": "restarting"
  }
}
```

### Memory Management

#### GET /servers/:id/memory
Get memory data for specific server.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `key` (optional): Specific memory key to retrieve
- `limit` (optional): Number of entries to return
- `offset` (optional): Number of entries to skip

**Response:**
```json
{
  "success": true,
  "memory": {
    "key1": "value1",
    "key2": "value2"
  },
  "metadata": {
    "total": 100,
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "gitCommit": "abc123"
  }
}
```

#### POST /servers/:id/memory
Store data in server memory.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "key": "string",
  "value": "any",
  "metadata": {
    "description": "string",
    "tags": ["tag1", "tag2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory stored successfully",
  "key": "string",
  "gitCommit": "abc123"
}
```

#### PUT /servers/:id/memory/:key
Update memory data.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "value": "any",
  "metadata": {
    "description": "string",
    "tags": ["tag1", "tag2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory updated successfully",
  "key": "string",
  "gitCommit": "def456"
}
```

#### DELETE /servers/:id/memory/:key
Delete memory data.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Memory deleted successfully",
  "gitCommit": "ghi789"
}
```

### Health and Monitoring

#### GET /health
Get system health status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "git": "healthy",
    "coordinator": "healthy"
  }
}
```

#### GET /metrics
Get system metrics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalServers": 10,
    "runningServers": 8,
    "totalRequests": 10000,
    "averageResponseTime": 45,
    "errorRate": 0.01,
    "memoryUsage": {
      "used": "512MB",
      "total": "2GB",
      "percentage": 25
    },
    "cpuUsage": 15.5
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `SERVER_ERROR` (500): Internal server error
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

## Rate Limiting

API requests are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute per user
- **Authentication endpoints**: 10 requests per minute per IP
- **Server management**: 50 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket API

For real-time updates, connect to the WebSocket endpoint:

```
ws://localhost:8080/ws
```

### Authentication

Send JWT token after connection:

```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

### Event Types

#### Server Status Updates
```json
{
  "type": "server_status",
  "serverId": "string",
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Health Check Updates
```json
{
  "type": "health_check",
  "serverId": "string",
  "health": "healthy",
  "metrics": {
    "responseTime": 45,
    "requestCount": 1000
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Memory Updates
```json
{
  "type": "memory_update",
  "serverId": "string",
  "key": "string",
  "operation": "create|update|delete",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## SDK and Client Libraries

### JavaScript/Node.js

```bash
npm install git-memory-mcp-client
```

```javascript
const { MCPClient } = require('git-memory-mcp-client');

const client = new MCPClient({
  baseURL: 'http://localhost:8080/api',
  token: 'your-jwt-token'
});

// Get all servers
const servers = await client.servers.list();

// Create new server
const newServer = await client.servers.create({
  name: 'my-server',
  config: { port: 3000 }
});

// Store memory
await client.memory.store('server-id', 'key', 'value');
```

### Python

```bash
pip install git-memory-mcp-client
```

```python
from git_memory_mcp import MCPClient

client = MCPClient(
    base_url='http://localhost:8080/api',
    token='your-jwt-token'
)

# Get all servers
servers = client.servers.list()

# Create new server
new_server = client.servers.create({
    'name': 'my-server',
    'config': {'port': 3000}
})

# Store memory
client.memory.store('server-id', 'key', 'value')
```

## Examples

### Complete Workflow Example

```bash
# 1. Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword"
  }'

# 2. Login and get token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword"
  }'

# 3. Create MCP server
curl -X POST http://localhost:8080/api/servers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "my-first-server",
    "config": {
      "port": 3000,
      "memory": {
        "type": "git",
        "repository": "/path/to/memory/repo"
      }
    }
  }'

# 4. Start server
curl -X POST http://localhost:8080/api/servers/SERVER_ID/start \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Store memory
curl -X POST http://localhost:8080/api/servers/SERVER_ID/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "key": "user_preferences",
    "value": {
      "theme": "dark",
      "language": "en"
    }
  }'

# 6. Get server status
curl -X GET http://localhost:8080/api/servers/SERVER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For API support and questions:

- **Documentation**: [https://docs.git-memory-mcp.com](https://docs.git-memory-mcp.com)
- **GitHub Issues**: [https://github.com/your-org/git-memory-mcp-server/issues](https://github.com/your-org/git-memory-mcp-server/issues)
- **Email**: support@git-memory-mcp.com
- **Discord**: [https://discord.gg/git-memory-mcp](https://discord.gg/git-memory-mcp)