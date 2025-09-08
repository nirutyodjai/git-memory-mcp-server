# 📚 NEXUS IDE API Reference

## 📋 Overview

This document provides comprehensive API reference for the Git Memory MCP Server integration with NEXUS IDE.

## 🔗 Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://git-memory-server.nexus-ide.com`
- **WebSocket**: `ws://localhost:3000/ws` (dev) / `wss://git-memory-server.nexus-ide.com/ws` (prod)

## 🔐 Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer <your-nexus-api-key>
Content-Type: application/json
```

## 📡 MCP Protocol Endpoints

### Initialize Connection

**Endpoint**: `POST /mcp`

**Description**: Initialize MCP connection with NEXUS IDE

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "tools": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "prompts": { "listChanged": true },
      "logging": {}
    },
    "clientInfo": {
      "name": "NEXUS-IDE",
      "version": "2.0.0"
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "logging": {},
      "tools": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "prompts": { "listChanged": true }
    },
    "serverInfo": {
      "name": "git-memory-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

### List Available Tools

**Endpoint**: `POST /mcp`

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "git_status",
        "description": "Get the current git status of a repository",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string",
              "description": "Path to the git repository"
            }
          },
          "required": ["path"]
        }
      },
      {
        "name": "git_log",
        "description": "Get git commit history",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string",
              "description": "Path to the git repository"
            },
            "limit": {
              "type": "number",
              "description": "Number of commits to retrieve",
              "default": 10
            },
            "branch": {
              "type": "string",
              "description": "Branch name",
              "default": "main"
            }
          },
          "required": ["path"]
        }
      },
      {
        "name": "memory_search",
        "description": "Search through code memory",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query"
            },
            "type": {
              "type": "string",
              "enum": ["code", "comment", "documentation", "all"],
              "default": "all"
            },
            "limit": {
              "type": "number",
              "default": 10
            }
          },
          "required": ["query"]
        }
      }
    ]
  }
}
```

### Execute Tool

**Endpoint**: `POST /mcp`

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "git_status",
    "arguments": {
      "path": "/path/to/repository"
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  modified:   src/index.js\n  modified:   package.json\n\nUntracked files:\n  new-feature.js"
      }
    ],
    "isError": false
  }
}
```

## 🔧 REST API Endpoints

### Health Check

**Endpoint**: `GET /health`

**Description**: Check server health status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "git": "healthy",
    "memory": "healthy",
    "database": "healthy",
    "nexus": "connected"
  },
  "metrics": {
    "memory": {
      "used": "45.2 MB",
      "total": "128 MB",
      "percentage": 35.3
    },
    "cpu": {
      "usage": "12.5%"
    },
    "requests": {
      "total": 1250,
      "perMinute": 25
    }
  }
}
```

### Git Operations

#### Get Git Status

**Endpoint**: `GET /git/status`

**Query Parameters**:
- `path` (required): Repository path
- `format` (optional): Response format (`json`, `text`)

**Response**:
```json
{
  "repository": "/path/to/repo",
  "branch": "main",
  "ahead": 0,
  "behind": 0,
  "staged": [],
  "unstaged": [
    {
      "file": "src/index.js",
      "status": "modified"
    },
    {
      "file": "package.json",
      "status": "modified"
    }
  ],
  "untracked": [
    "new-feature.js"
  ],
  "clean": false
}
```

#### Get Git Log

**Endpoint**: `GET /git/log`

**Query Parameters**:
- `path` (required): Repository path
- `limit` (optional): Number of commits (default: 10)
- `branch` (optional): Branch name (default: current)
- `since` (optional): Date filter (ISO 8601)
- `author` (optional): Author filter

**Response**:
```json
{
  "repository": "/path/to/repo",
  "branch": "main",
  "commits": [
    {
      "hash": "abc123def456",
      "shortHash": "abc123d",
      "author": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "date": "2024-01-15T10:30:00Z",
      "message": "feat: add new feature",
      "files": [
        "src/feature.js",
        "tests/feature.test.js"
      ],
      "stats": {
        "additions": 45,
        "deletions": 12,
        "total": 57
      }
    }
  ],
  "total": 150,
  "hasMore": true
}
```

#### Get Branches

**Endpoint**: `GET /git/branches`

**Query Parameters**:
- `path` (required): Repository path
- `type` (optional): `local`, `remote`, `all` (default: `all`)

**Response**:
```json
{
  "repository": "/path/to/repo",
  "current": "main",
  "branches": {
    "local": [
      {
        "name": "main",
        "current": true,
        "lastCommit": {
          "hash": "abc123def456",
          "message": "feat: add new feature",
          "date": "2024-01-15T10:30:00Z"
        }
      },
      {
        "name": "feature/new-ui",
        "current": false,
        "lastCommit": {
          "hash": "def456ghi789",
          "message": "wip: update UI components",
          "date": "2024-01-14T15:20:00Z"
        }
      }
    ],
    "remote": [
      {
        "name": "origin/main",
        "lastCommit": {
          "hash": "abc123def456",
          "message": "feat: add new feature",
          "date": "2024-01-15T10:30:00Z"
        }
      }
    ]
  }
}
```

#### Create Commit

**Endpoint**: `POST /git/commit`

**Request Body**:
```json
{
  "path": "/path/to/repo",
  "message": "feat: add new feature",
  "files": ["src/feature.js", "tests/feature.test.js"],
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "addAll": false
}
```

**Response**:
```json
{
  "success": true,
  "commit": {
    "hash": "ghi789jkl012",
    "shortHash": "ghi789j",
    "message": "feat: add new feature",
    "author": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "date": "2024-01-15T11:00:00Z",
    "files": [
      "src/feature.js",
      "tests/feature.test.js"
    ]
  }
}
```

### Memory Management

#### Get Memory Status

**Endpoint**: `GET /memory/status`

**Response**:
```json
{
  "status": "active",
  "entries": {
    "total": 1250,
    "byType": {
      "code": 800,
      "comment": 200,
      "documentation": 150,
      "other": 100
    }
  },
  "storage": {
    "used": "45.2 MB",
    "available": "82.8 MB",
    "percentage": 35.3
  },
  "performance": {
    "avgSearchTime": "12ms",
    "hitRate": "89.5%",
    "lastIndexed": "2024-01-15T10:45:00Z"
  }
}
```

#### Search Memory

**Endpoint**: `POST /memory/search`

**Request Body**:
```json
{
  "query": "function authentication",
  "type": "code",
  "limit": 10,
  "filters": {
    "language": "javascript",
    "file": "*.js",
    "dateRange": {
      "from": "2024-01-01T00:00:00Z",
      "to": "2024-01-15T23:59:59Z"
    }
  },
  "includeContext": true
}
```

**Response**:
```json
{
  "query": "function authentication",
  "results": [
    {
      "id": "mem_001",
      "type": "code",
      "content": "function authenticateUser(username, password) {\n  // Authentication logic\n  return jwt.sign({ username }, secret);\n}",
      "metadata": {
        "file": "src/auth.js",
        "line": 15,
        "language": "javascript",
        "lastModified": "2024-01-15T09:30:00Z"
      },
      "context": {
        "before": "// User authentication module\nconst jwt = require('jsonwebtoken');",
        "after": "\nmodule.exports = { authenticateUser };"
      },
      "score": 0.95
    }
  ],
  "total": 5,
  "searchTime": "8ms"
}
```

#### Add Memory Entry

**Endpoint**: `POST /memory/add`

**Request Body**:
```json
{
  "type": "code",
  "content": "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}",
  "metadata": {
    "file": "src/utils.js",
    "line": 25,
    "language": "javascript",
    "tags": ["utility", "calculation", "array"]
  },
  "context": {
    "description": "Utility function to calculate total price of items",
    "usage": "Used in shopping cart and order processing"
  }
}
```

**Response**:
```json
{
  "success": true,
  "id": "mem_002",
  "message": "Memory entry added successfully",
  "indexed": true
}
```

### NEXUS IDE Integration

#### Get NEXUS Configuration

**Endpoint**: `GET /nexus/config`

**Response**:
```json
{
  "nexusIDE": {
    "version": "2.0.0",
    "apiEndpoint": "https://nexus-ide.local/api",
    "websocketEndpoint": "wss://nexus-ide.local/ws",
    "connected": true,
    "lastSync": "2024-01-15T10:45:00Z"
  },
  "integration": {
    "realTimeSync": true,
    "autoCommit": false,
    "aiAssistance": true,
    "collaborativeEditing": true
  },
  "features": {
    "codeCompletion": true,
    "gitIntegration": true,
    "memorySearch": true,
    "realTimeCollab": true
  }
}
```

#### Get Capabilities

**Endpoint**: `GET /nexus/capabilities`

**Response**:
```json
{
  "mcp": {
    "protocolVersion": "2024-11-05",
    "tools": 15,
    "resources": 8,
    "prompts": 5
  },
  "git": {
    "operations": ["status", "log", "commit", "branch", "merge", "diff"],
    "providers": ["github", "gitlab", "bitbucket", "local"]
  },
  "memory": {
    "searchTypes": ["semantic", "keyword", "fuzzy"],
    "contentTypes": ["code", "comment", "documentation", "test"],
    "languages": ["javascript", "typescript", "python", "java", "go"]
  },
  "ai": {
    "models": ["gpt-4", "claude-3", "llama-2"],
    "features": ["completion", "explanation", "generation", "analysis"]
  }
}
```

#### Sync with NEXUS IDE

**Endpoint**: `POST /nexus/sync`

**Request Body**:
```json
{
  "type": "full",
  "includeMemory": true,
  "includeGit": true,
  "includeConfig": true,
  "force": false
}
```

**Response**:
```json
{
  "success": true,
  "syncId": "sync_123456",
  "startTime": "2024-01-15T11:00:00Z",
  "status": "in_progress",
  "progress": {
    "memory": "completed",
    "git": "in_progress",
    "config": "pending"
  },
  "estimatedCompletion": "2024-01-15T11:02:00Z"
}
```

## 🤖 AI Integration Endpoints

### Code Completion

**Endpoint**: `POST /ai/complete`

**Request Body**:
```json
{
  "context": {
    "file": "src/example.js",
    "position": {
      "line": 10,
      "column": 5
    },
    "code": "function calculateDiscount(price, percentage) {\n  // cursor here\n}",
    "language": "javascript"
  },
  "options": {
    "maxSuggestions": 5,
    "includeSnippets": true,
    "includeImports": true,
    "temperature": 0.7
  }
}
```

**Response**:
```json
{
  "suggestions": [
    {
      "text": "return price * (1 - percentage / 100);",
      "type": "completion",
      "confidence": 0.95,
      "description": "Calculate discounted price"
    },
    {
      "text": "if (percentage < 0 || percentage > 100) {\n    throw new Error('Invalid percentage');\n  }\n  return price * (1 - percentage / 100);",
      "type": "snippet",
      "confidence": 0.88,
      "description": "Calculate discounted price with validation"
    }
  ],
  "processingTime": "45ms"
}
```

### Code Explanation

**Endpoint**: `POST /ai/explain`

**Request Body**:
```json
{
  "code": "const result = array.reduce((acc, item) => acc + item.value, 0);",
  "context": "JavaScript array processing",
  "language": "javascript",
  "level": "intermediate"
}
```

**Response**:
```json
{
  "explanation": {
    "summary": "This code calculates the sum of all 'value' properties in an array of objects.",
    "detailed": "The reduce() method is used to iterate through the array and accumulate values. It starts with an initial value of 0 and adds each item's 'value' property to the accumulator.",
    "breakdown": [
      {
        "part": "array.reduce()",
        "explanation": "Calls the reduce method on the array to process all elements"
      },
      {
        "part": "(acc, item) => acc + item.value",
        "explanation": "Arrow function that adds each item's value to the accumulator"
      },
      {
        "part": "0",
        "explanation": "Initial value for the accumulator"
      }
    ]
  },
  "examples": [
    {
      "input": "[{value: 10}, {value: 20}, {value: 30}]",
      "output": "60",
      "explanation": "Sum of 10 + 20 + 30"
    }
  ],
  "relatedConcepts": ["Array.reduce()", "Arrow functions", "Object properties"]
}
```

### Bug Analysis

**Endpoint**: `POST /ai/analyze`

**Request Body**:
```json
{
  "code": "function divide(a, b) {\n  return a / b;\n}",
  "file": "src/math.js",
  "analysisType": "bugs",
  "severity": "all"
}
```

**Response**:
```json
{
  "issues": [
    {
      "type": "bug",
      "severity": "high",
      "line": 2,
      "column": 10,
      "message": "Division by zero not handled",
      "description": "The function doesn't check if 'b' is zero, which would result in Infinity or NaN.",
      "suggestion": "Add a check for zero division: if (b === 0) throw new Error('Division by zero');",
      "fixedCode": "function divide(a, b) {\n  if (b === 0) throw new Error('Division by zero');\n  return a / b;\n}"
    }
  ],
  "metrics": {
    "complexity": "low",
    "maintainability": "high",
    "testability": "medium"
  },
  "suggestions": [
    "Add input validation",
    "Consider returning null or undefined for invalid operations",
    "Add JSDoc comments for better documentation"
  ]
}
```

## 🌐 WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-nexus-api-key'
}));
```

### Message Types

#### Ping/Pong

**Send**:
```json
{
  "type": "ping",
  "timestamp": 1705312200000
}
```

**Receive**:
```json
{
  "type": "pong",
  "timestamp": 1705312200000,
  "serverTime": 1705312200050
}
```

#### Git Changes

**Receive**:
```json
{
  "type": "git_change",
  "data": {
    "repository": "/path/to/repo",
    "event": "file_modified",
    "files": ["src/index.js"],
    "branch": "main",
    "timestamp": "2024-01-15T11:15:00Z"
  }
}
```

#### Memory Updates

**Receive**:
```json
{
  "type": "memory_update",
  "data": {
    "action": "added",
    "entryId": "mem_003",
    "type": "code",
    "file": "src/new-feature.js",
    "timestamp": "2024-01-15T11:15:00Z"
  }
}
```

#### Collaboration Events

**Send**:
```json
{
  "type": "collab_join",
  "data": {
    "sessionId": "session_123",
    "userId": "user_456",
    "file": "src/shared.js"
  }
}
```

**Receive**:
```json
{
  "type": "collab_user_joined",
  "data": {
    "sessionId": "session_123",
    "user": {
      "id": "user_789",
      "name": "Jane Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T11:16:00Z"
  }
}
```

#### Edit Operations

**Send**:
```json
{
  "type": "edit",
  "data": {
    "sessionId": "session_123",
    "operation": {
      "type": "insert",
      "position": {
        "line": 5,
        "column": 10
      },
      "text": "console.log('hello');"
    },
    "userId": "user_456"
  }
}
```

**Receive**:
```json
{
  "type": "edit_applied",
  "data": {
    "sessionId": "session_123",
    "operation": {
      "type": "insert",
      "position": {
        "line": 5,
        "column": 10
      },
      "text": "console.log('hello');"
    },
    "userId": "user_789",
    "timestamp": "2024-01-15T11:17:00Z"
  }
}
```

## 📊 Metrics and Monitoring

### Get Metrics

**Endpoint**: `GET /metrics`

**Response**:
```json
{
  "server": {
    "uptime": 7200,
    "version": "1.0.0",
    "nodeVersion": "20.10.0",
    "memory": {
      "used": "67.5 MB",
      "total": "128 MB",
      "percentage": 52.7,
      "heap": {
        "used": "45.2 MB",
        "total": "89.6 MB"
      }
    },
    "cpu": {
      "usage": "15.3%",
      "loadAverage": [0.5, 0.7, 0.8]
    }
  },
  "requests": {
    "total": 2500,
    "successful": 2450,
    "failed": 50,
    "rate": {
      "perSecond": 2.5,
      "perMinute": 150,
      "perHour": 9000
    },
    "responseTime": {
      "average": "45ms",
      "p50": "35ms",
      "p95": "120ms",
      "p99": "250ms"
    }
  },
  "git": {
    "operations": {
      "total": 500,
      "status": 200,
      "log": 150,
      "commit": 100,
      "branch": 50
    },
    "repositories": {
      "active": 15,
      "total": 25
    },
    "performance": {
      "avgResponseTime": "65ms",
      "cacheHitRate": "78.5%"
    }
  },
  "memory": {
    "entries": {
      "total": 1850,
      "code": 1200,
      "comments": 350,
      "documentation": 200,
      "other": 100
    },
    "searches": {
      "total": 800,
      "successful": 750,
      "avgTime": "18ms",
      "hitRate": "93.8%"
    },
    "indexing": {
      "lastUpdate": "2024-01-15T11:00:00Z",
      "entriesPerSecond": 50,
      "status": "up_to_date"
    }
  },
  "nexus": {
    "connection": {
      "status": "connected",
      "lastSync": "2024-01-15T11:15:00Z",
      "syncDuration": "2.3s"
    },
    "features": {
      "realTimeSync": true,
      "collaboration": true,
      "aiAssistance": true
    }
  }
}
```

## ❌ Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": {
      "field": "path",
      "reason": "Path is required"
    },
    "timestamp": "2024-01-15T11:20:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `GIT_ERROR` | 422 | Git operation failed |
| `MEMORY_ERROR` | 422 | Memory operation failed |
| `NEXUS_ERROR` | 422 | NEXUS IDE integration error |

### MCP Error Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Path parameter is required"
    }
  }
}
```

## 🔒 Rate Limiting

### Limits

- **General API**: 100 requests per 15 minutes per IP
- **MCP Protocol**: 1000 requests per 15 minutes per authenticated user
- **WebSocket**: 10 connections per IP, 100 messages per minute per connection
- **AI Endpoints**: 50 requests per 15 minutes per authenticated user

### Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
X-RateLimit-Window: 900
```

## 📝 Request/Response Examples

### Complete Workflow Example

```javascript
// 1. Initialize MCP connection
const initResponse = await fetch('/mcp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: true } },
      clientInfo: { name: 'NEXUS-IDE', version: '2.0.0' }
    }
  })
});

// 2. Get git status
const gitStatus = await fetch('/git/status?path=/path/to/repo', {
  headers: { 'Authorization': 'Bearer your-api-key' }
});

// 3. Search memory
const memorySearch = await fetch('/memory/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'authentication function',
    type: 'code',
    limit: 5
  })
});

// 4. Get AI code completion
const aiCompletion = await fetch('/ai/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    context: {
      file: 'src/auth.js',
      position: { line: 10, column: 5 },
      code: 'function login(username, password) {\n  // cursor here\n}'
    },
    options: {
      maxSuggestions: 3,
      includeSnippets: true
    }
  })
});
```

---

## 📚 Additional Resources

- [Integration Guide](./NEXUS-IDE-INTEGRATION.md)
- [Development Guide](./DEVELOPMENT.md)
- [WebSocket Events Reference](./WEBSOCKET-EVENTS.md)
- [Error Handling Guide](./ERROR-HANDLING.md)

---

**📡 Need help with the API? Check our [GitHub Issues](https://github.com/your-org/git-memory-mcp-server/issues) or join our [Discord](https://discord.gg/nexus-ide)!**