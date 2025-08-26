# MCP Proxy Server API Documentation

## Overview

The MCP Proxy Server system provides a secure, scalable interface for accessing Multiple MCP (Model Context Protocol) servers through a unified API. The system includes authentication, authorization, rate limiting, and comprehensive logging.

## Architecture

- **3 Proxy Servers**: Running on ports 3001, 3002, and 3003
- **170 Total MCP Servers**: Distributed across the proxy servers
- **671 Available Tools**: Accessible through standardized endpoints

## Authentication

### API Key Authentication

All protected endpoints require an API key provided via:
- **Header**: `X-API-Key: your-api-key`
- **Query Parameter**: `?api_key=your-api-key`

### Available API Keys

| API Key | User Type | Permissions | Rate Limit |
|---------|-----------|-------------|------------|
| `mcp-admin-key-2024` | Admin User | read, write, admin | 100 req/min |
| `mcp-readonly-key-2024` | Read Only User | read | 100 req/min |
| `mcp-developer-key-2024` | Developer User | read, write | 100 req/min (read), 30 req/min (write) |

## Base URLs

- **Proxy Server 1**: `http://localhost:3001`
- **Proxy Server 2**: `http://localhost:3002`
- **Proxy Server 3**: `http://localhost:3003`

## Endpoints

### Public Endpoints (No Authentication Required)

#### GET `/`
Returns server information and available endpoints.

**Response:**
```json
{
  "message": "MCP Proxy Server 1 - Authentication Enabled",
  "version": "2.0.0",
  "proxy": "proxy-1",
  "port": 3001,
  "servers": 60,
  "endpoints": {
    "/": "This endpoint",
    "/health": "Health check (no auth)",
    "/status": "Server status (requires auth)",
    "/tools": "List all tools (requires read permission)",
    "/call": "Execute MCP tool (requires write permission)",
    "/mcp/:serverName/:toolName": "Legacy endpoint (requires write permission)"
  },
  "authentication": {
    "required": true,
    "method": "API Key",
    "header": "X-API-Key or api_key query parameter"
  }
}
```

#### GET `/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-26T13:41:30.626Z",
  "uptime": 1234.567,
  "memory": {
    "rss": 45678912,
    "heapTotal": 23456789,
    "heapUsed": 12345678,
    "external": 1234567
  },
  "version": "v18.17.0"
}
```

### Protected Endpoints (Authentication Required)

#### GET `/status`
**Required Permission**: `read`

Returns detailed server status and statistics.

**Headers:**
```
X-API-Key: mcp-readonly-key-2024
```

**Response:**
```json
{
  "proxy": "proxy-1",
  "port": 3001,
  "status": "running",
  "uptime": 1234.567,
  "memory": {
    "rss": 45678912,
    "heapTotal": 23456789,
    "heapUsed": 12345678,
    "external": 1234567
  },
  "servers": {
    "total": 60,
    "active": 60,
    "inactive": 0
  },
  "timestamp": "2025-08-26T13:41:30.626Z",
  "user": "Read Only User",
  "permissions": ["read"]
}
```

#### GET `/tools`
**Required Permission**: `read`

Returns a list of all available tools across all MCP servers.

**Headers:**
```
X-API-Key: mcp-readonly-key-2024
```

**Response:**
```json
{
  "tools": [
    {
      "server": "mcp.config.usrlocalmcp.3d-sco-time",
      "tool": "get_current_time",
      "description": "Time and timezone management"
    },
    {
      "server": "mcp.config.usrlocalmcp.3d-sco-git",
      "tool": "git_status",
      "description": "Git repository management and version control"
    }
  ],
  "proxy": "proxy-1",
  "count": 671
}
```

#### POST `/call`
**Required Permission**: `write`

Execute a tool on a specific MCP server.

**Headers:**
```
X-API-Key: mcp-admin-key-2024
Content-Type: application/json
```

**Request Body:**
```json
{
  "server_name": "mcp.config.usrlocalmcp.3d-sco-time",
  "tool_name": "get_current_time",
  "args": {
    "timezone": "Asia/Bangkok"
  }
}
```

**Response:**
```json
{
  "success": true,
  "server": "mcp.config.usrlocalmcp.3d-sco-time",
  "tool": "get_current_time",
  "args": {
    "timezone": "Asia/Bangkok"
  },
  "result": "Successfully executed get_current_time on mcp.config.usrlocalmcp.3d-sco-time",
  "execution_time": 67.73836846516845,
  "proxy": "proxy-1",
  "timestamp": "2025-08-26T13:41:30.626Z"
}
```

#### POST `/mcp/:serverName/:toolName` (Legacy)
**Required Permission**: `write`

Legacy endpoint for backward compatibility.

**Headers:**
```
X-API-Key: mcp-developer-key-2024
Content-Type: application/json
```

**Request Body:**
```json
{
  "args": {
    "timezone": "Asia/Bangkok"
  }
}
```

**Response:**
```json
{
  "result": "Executed get_current_time on mcp.config.usrlocalmcp.3d-sco-time",
  "args": {
    "timezone": "Asia/Bangkok"
  },
  "proxy": "proxy-1",
  "timestamp": "2025-08-26T13:41:30.626Z"
}
```

## Rate Limiting

### Rate Limit Headers
All responses include rate limiting information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-08-26T13:42:30.626Z
```

### Rate Limits by Permission

| Permission | Endpoints | Limit |
|------------|-----------|-------|
| `read` | `/status`, `/tools` | 100 requests per minute |
| `write` | `/call`, `/mcp/*` | 30 requests per minute |

## Error Responses

### Authentication Errors

#### 401 Unauthorized - Missing API Key
```json
{
  "error": "Authentication required",
  "message": "API key must be provided in X-API-Key header or api_key query parameter"
}
```

#### 401 Unauthorized - Invalid API Key
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### Authorization Errors

#### 403 Forbidden - Insufficient Permissions
```json
{
  "error": "Insufficient permissions",
  "message": "This operation requires 'write' permission"
}
```

### Rate Limiting Errors

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per 60 seconds",
  "retryAfter": 45
}
```

### Validation Errors

#### 400 Bad Request - Missing Fields
```json
{
  "error": "Missing required fields: server_name and tool_name",
  "proxy": "proxy-1"
}
```

#### 404 Not Found - Server Not Found
```json
{
  "error": "Server 'invalid-server' not found",
  "proxy": "proxy-1",
  "available_servers": ["mcp.config.usrlocalmcp.3d-sco-time", "..."]
}
```

#### 404 Not Found - Tool Not Found
```json
{
  "error": "Tool 'invalid-tool' not found in server 'mcp.config.usrlocalmcp.3d-sco-time'",
  "proxy": "proxy-1",
  "available_tools": ["get_current_time", "convert_time"]
}
```

## Available MCP Servers

### Core Servers (All Proxies)
- `mcp.config.usrlocalmcp.3d-sco-time` - Time and timezone management
- `mcp.config.usrlocalmcp.3d-sco-git` - Git repository management
- `mcp.config.usrlocalmcp.3d-sco-filesystem` - File system operations
- `mcp.config.usrlocalmcp.3d-sco-playwright` - Web automation and testing
- `mcp.config.usrlocalmcp.3d-sco-multifetch` - Web content fetching
- `mcp.config.usrlocalmcp.3d-sco-blender` - 3D modeling and rendering
- `mcp.config.usrlocalmcp.3d-sco-thinking` - Sequential thinking and reasoning
- `mcp.config.usrlocalmcp.3d-sco-memory` - Memory management and storage
- `mcp.config.usrlocalmcp.antv-chart` - Chart and visualization generation
- `mcp.config.usrlocalmcp.apiweaver` - API integration and weaving

### Test Servers
- `test-server-01` through `test-server-50` (Proxy 1)
- `test-server-01` through `test-server-45` (Proxy 2 & 3)

## Usage Examples

### cURL Examples

#### Get Server Status
```bash
curl -H "X-API-Key: mcp-readonly-key-2024" \
     http://localhost:3001/status
```

#### List All Tools
```bash
curl -H "X-API-Key: mcp-readonly-key-2024" \
     http://localhost:3001/tools
```

#### Execute a Tool
```bash
curl -X POST \
     -H "X-API-Key: mcp-admin-key-2024" \
     -H "Content-Type: application/json" \
     -d '{
       "server_name": "mcp.config.usrlocalmcp.3d-sco-time",
       "tool_name": "get_current_time",
       "args": {"timezone": "Asia/Bangkok"}
     }' \
     http://localhost:3001/call
```

### JavaScript Examples

#### Using Fetch API
```javascript
// Get server status
const response = await fetch('http://localhost:3001/status', {
  headers: {
    'X-API-Key': 'mcp-readonly-key-2024'
  }
});
const status = await response.json();
console.log(status);

// Execute a tool
const toolResponse = await fetch('http://localhost:3001/call', {
  method: 'POST',
  headers: {
    'X-API-Key': 'mcp-admin-key-2024',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    server_name: 'mcp.config.usrlocalmcp.3d-sco-time',
    tool_name: 'get_current_time',
    args: { timezone: 'Asia/Bangkok' }
  })
});
const result = await toolResponse.json();
console.log(result);
```

### Python Examples

#### Using Requests
```python
import requests

# Configuration
base_url = 'http://localhost:3001'
headers = {'X-API-Key': 'mcp-admin-key-2024'}

# Get server status
response = requests.get(f'{base_url}/status', headers=headers)
status = response.json()
print(status)

# Execute a tool
payload = {
    'server_name': 'mcp.config.usrlocalmcp.3d-sco-time',
    'tool_name': 'get_current_time',
    'args': {'timezone': 'Asia/Bangkok'}
}

response = requests.post(
    f'{base_url}/call',
    headers={**headers, 'Content-Type': 'application/json'},
    json=payload
)
result = response.json()
print(result)
```

## Load Balancing

For high availability and load distribution, you can distribute requests across multiple proxy servers:

```javascript
const proxyServers = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
];

// Simple round-robin load balancing
let currentServer = 0;

function getNextServer() {
  const server = proxyServers[currentServer];
  currentServer = (currentServer + 1) % proxyServers.length;
  return server;
}

// Use in requests
const serverUrl = getNextServer();
const response = await fetch(`${serverUrl}/status`, {
  headers: { 'X-API-Key': 'mcp-readonly-key-2024' }
});
```

## Security Best Practices

1. **API Key Management**
   - Store API keys securely (environment variables, key management systems)
   - Rotate API keys regularly
   - Use least privilege principle (read-only keys when possible)

2. **Rate Limiting**
   - Monitor rate limit headers
   - Implement exponential backoff for 429 responses
   - Distribute load across multiple proxy servers

3. **Error Handling**
   - Always check response status codes
   - Handle authentication and authorization errors gracefully
   - Log errors for monitoring and debugging

4. **Network Security**
   - Use HTTPS in production environments
   - Implement proper firewall rules
   - Consider VPN or private networks for sensitive operations

## Monitoring and Logging

All requests are logged with the following information:
- Timestamp
- HTTP method and URL
- User name and API key (truncated)
- Response status code
- Response time
- User agent

Example log entry:
```
[2025-08-26T13:41:30.626Z] POST /call - 200 - 67ms - Admin User
```

## Support and Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check API key format and validity
2. **403 Forbidden**: Verify user permissions for the endpoint
3. **429 Rate Limited**: Implement proper rate limiting and retry logic
4. **404 Not Found**: Verify server and tool names
5. **500 Internal Server Error**: Check server logs and contact support

### Health Monitoring

Use the `/health` endpoint for monitoring:
- Response time should be < 100ms
- Memory usage should be monitored
- Uptime indicates server stability

### Performance Optimization

1. **Connection Pooling**: Reuse HTTP connections
2. **Caching**: Cache tool lists and server information
3. **Load Balancing**: Distribute requests across proxy servers
4. **Monitoring**: Track response times and error rates

---

**Version**: 2.0.0  
**Last Updated**: August 26, 2025  
**Total Servers**: 170 MCP Servers  
**Total Tools**: 671 Available Tools