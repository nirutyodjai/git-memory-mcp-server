# MCP Tools Documentation

This document provides comprehensive information about the Model Context Protocol (MCP) tools installed in the 3D-SCO project.

## Overview

MCP (Model Context Protocol) tools provide a standardized way to integrate external services and capabilities into AI applications. Our implementation includes five main MCP servers:

1. **Playwright** - Browser automation and web testing with Trae AI integration
2. **Multi Fetch** - Web content fetching and processing
3. **Blender** - 3D modeling and rendering integration
4. **Sequential Thinking** - Structured problem-solving processes
5. **Memory** - Data storage and memory management

## Installation Status

✅ **Installed Packages:**
- `axios` - HTTP client for web requests
- `cheerio` - Server-side HTML parsing
- `puppeteer` - Headless browser automation
- `playwright` - Cross-browser automation
- `jsdom` - DOM implementation for Node.js
- `node-fetch` - Fetch API for Node.js
- `sharp` - Image processing
- `canvas` - Canvas API for Node.js
- `fabric` - Canvas library

✅ **Created Files:**
- `/src/lib/playwright-tools.ts` - Playwright automation utilities (Trae AI)
- `/src/app/api/mcp/playwright/route.ts` - Playwright API routes (Trae AI)
- `/src/lib/mcp-tools.ts` - Core MCP utilities
- `/src/lib/blender-tools.ts` - Blender integration tools
- `/src/lib/sequential-thinking.ts` - Thinking process tools
- `/src/lib/memory-tools.ts` - Memory management tools
- `/src/lib/mcp-server.ts` - MCP server configuration
- `/src/app/api/mcp/fetch/route.ts` - Multi Fetch API
- `/src/app/api/mcp/blender/route.ts` - Blender API
- `/src/app/api/mcp/thinking/route.ts` - Sequential Thinking API
- `/src/app/api/mcp/memory/route.ts` - Memory API

## MCP Servers

### 1. Playwright MCP Server (Trae AI Integration)

**Base URL:** `/api/mcp/playwright`

**Capabilities:**
- Browser automation (Chromium, Firefox, WebKit)
- Web testing and validation
- Element interaction and form filling
- Screenshot and DOM extraction
- JavaScript code execution
- Test code generation
- Session management
- Trae AI specific optimizations

**Available Actions:**
- `init_browser` - Initialize browser sessions
- `close_browser` - Close browser sessions
- `navigate_to_url` - Navigate to specific URLs
- `click_element` - Click on page elements
- `fill_input` - Fill form inputs
- `wait_for_element` - Wait for elements to appear
- `extract_text` - Extract text from elements
- `get_screenshot` - Capture page screenshots
- `get_full_dom` - Get complete DOM structure
- `execute_code` - Execute JavaScript code in browser
- `validate_selectors` - Validate CSS selectors
- `generate_test_code` - Generate Playwright test code
- `run_test` - Execute test scenarios
- `get_sessions` - List active browser sessions
- `get_context` - Get session context information
- `cleanup` - Clean up all browser sessions

**Example Usage:**
```javascript
// Initialize browser and navigate
const response = await fetch('/api/mcp/playwright', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'init_browser',
    browserType: 'chromium',
    options: {
      headless: true,
      viewport: { width: 1280, height: 720 }
    }
  })
});
```

### 2. Multi Fetch MCP Server

**Base URL:** `/api/mcp/fetch`

**Capabilities:**
- HTML content fetching
- JSON data retrieval
- Text and Markdown extraction
- Content chunking for large responses
- Proxy support
- Browser mode with Puppeteer/Playwright
- Intelligent content extraction
- Rate limiting

**Available Actions:**
- `fetch_html` - Fetch HTML content
- `fetch_json` - Fetch JSON data
- `fetch_txt` - Fetch plain text
- `fetch_markdown` - Fetch as Markdown
- `fetch_plaintext` - Fetch with HTML tags removed

**Example Usage:**
```javascript
// Fetch HTML content
const response = await fetch('/api/mcp/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'fetch_html',
    url: 'https://example.com',
    startCursor: 0,
    contentSizeLimit: 50000,
    extractContent: true
  })
});
```

### 2. Blender MCP Server

**Base URL:** `/api/mcp/blender`

**Capabilities:**
- Scene information retrieval
- Object manipulation
- Viewport screenshots
- Python code execution
- Polyhaven asset integration
- Sketchfab model import
- Hyper3D model generation

**Available Actions:**
- `get_scene_info` - Get current scene details
- `get_object_info` - Get specific object information
- `execute_python` - Execute Python code in Blender
- `take_screenshot` - Capture viewport screenshot
- `search_polyhaven` - Search Polyhaven assets
- `download_asset` - Download and import assets

**Example Usage:**
```javascript
// Get scene information
const response = await fetch('/api/mcp/blender', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get_scene_info'
  })
});
```

### 3. Sequential Thinking MCP Server

**Base URL:** `/api/mcp/thinking`

**Capabilities:**
- Template management
- Process creation and tracking
- Step-by-step execution
- Progress monitoring
- Export/import functionality

**Available Templates:**
- `problem-solving` - Systematic problem analysis
- `design-thinking` - Creative design process
- `software-development` - Development workflow
- `research` - Research methodology
- `decision-making` - Decision analysis

**Available Actions:**
- `get_templates` - List available templates
- `create_process` - Create new thinking process
- `start_process` - Begin process execution
- `complete_step` - Mark step as completed
- `get_progress` - Check process progress

**Example Usage:**
```javascript
// Create a problem-solving process
const response = await fetch('/api/mcp/thinking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_process',
    templateId: 'problem-solving',
    title: 'Fix API Performance Issue',
    description: 'Analyze and resolve slow response times'
  })
});
```

### 4. Memory MCP Server

**Base URL:** `/api/mcp/memory`

**Capabilities:**
- Key-value storage
- Metadata management
- Query system with filtering
- Backup and restore
- Statistics and analytics
- Bulk operations
- TTL (Time To Live) support

**Available Actions:**
- `set` - Store data with metadata
- `get` - Retrieve data by key
- `query` - Search with filters
- `delete` - Remove data
- `stats` - Get storage statistics
- `backup` - Create backup
- `restore` - Restore from backup
- `bulk_set` - Store multiple entries
- `bulk_get` - Retrieve multiple entries

**Example Usage:**
```javascript
// Store user data
const response = await fetch('/api/mcp/memory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'set',
    key: 'user_123',
    value: { name: 'John Doe', email: 'john@example.com' },
    options: {
      tags: ['user', 'profile'],
      namespace: 'users',
      priority: 'high',
      ttl: 3600000 // 1 hour
    }
  })
});
```

## Rate Limiting

All MCP servers implement rate limiting to prevent abuse:

- **Playwright:** 30 requests per 15 minutes
- **Multi Fetch:** 50 requests per minute
- **Blender:** 30 requests per minute
- **Sequential Thinking:** 100 requests per minute
- **Memory:** 100 requests per minute

## Security Features

- Input validation and sanitization
- Rate limiting by client IP
- Error handling and logging
- Content size limits
- Timeout protection
- CORS support

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# MCP Configuration
MCP_RATE_LIMIT_WINDOW=60000
MCP_RATE_LIMIT_MAX_REQUESTS=100
MCP_CONTENT_SIZE_LIMIT=50000
MCP_REQUEST_TIMEOUT=30000

# Blender Integration (optional)
BLENDER_PATH=/path/to/blender
BLENDER_PYTHON_PATH=/path/to/blender/python

# Proxy Settings (optional)
HTTP_PROXY=http://proxy:8080
HTTPS_PROXY=https://proxy:8080
```

### Memory Configuration

```javascript
import { memoryTools } from '@/lib/memory-tools';

// Set maximum memory usage (100MB)
memoryTools.setMaxSize(100 * 1024 * 1024);

// Get current usage
const usage = memoryTools.getCurrentSize();
const maxSize = memoryTools.getMaxSize();
console.log(`Memory usage: ${usage}/${maxSize} bytes`);
```

## Usage Examples

### Frontend Integration

```typescript
import { mcpClient } from '@/lib/mcp-server';

// Fetch web content
const content = await mcpClient.multiFetch('fetch_html', {
  url: 'https://example.com',
  startCursor: 0,
  extractContent: true
});

// Store in memory
const stored = await mcpClient.memory('set', {
  key: 'fetched_content',
  value: content,
  options: {
    tags: ['web', 'content'],
    ttl: 3600000
  }
});

// Create thinking process
const process = await mcpClient.thinking('create_process', {
  templateId: 'problem-solving',
  title: 'Analyze Content',
  description: 'Process the fetched content'
});
```

### API Integration

```javascript
// Direct API calls
const fetchContent = async (url) => {
  const response = await fetch('/api/mcp/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'fetch_html',
      url,
      startCursor: 0
    })
  });
  return response.json();
};

const storeData = async (key, value) => {
  const response = await fetch('/api/mcp/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'set',
      key,
      value
    })
  });
  return response.json();
};
```

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Wait for the rate limit window to reset
   - Implement client-side rate limiting
   - Use bulk operations when possible

2. **Content Size Limit**
   - Use content chunking for large responses
   - Adjust `contentSizeLimit` parameter
   - Process content in smaller pieces

3. **Memory Full**
   - Increase memory limit with `setMaxSize()`
   - Clear old entries with `clear()`
   - Use TTL to auto-expire entries

4. **Blender Connection Issues**
   - Ensure Blender is running
   - Check Blender Python path
   - Verify network connectivity

### Debug Mode

Enable debug logging:

```javascript
// Enable debug mode for fetch operations
const response = await fetch('/api/mcp/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'fetch_html',
    url: 'https://example.com',
    startCursor: 0,
    debug: true
  })
});
```

## Performance Optimization

### Best Practices

1. **Use appropriate content size limits**
2. **Implement client-side caching**
3. **Use bulk operations for multiple items**
4. **Set appropriate TTL values**
5. **Monitor memory usage**
6. **Use content extraction for cleaner data**

### Monitoring

```javascript
// Get memory statistics
const stats = await fetch('/api/mcp/memory?action=stats');
const data = await stats.json();
console.log('Memory stats:', data.stats);

// Get server status
const status = await fetch('/api/mcp/fetch');
const serverInfo = await status.json();
console.log('Server status:', serverInfo);
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced caching mechanisms
- [ ] Plugin system for custom MCP servers
- [ ] Distributed memory storage
- [ ] Enhanced security features
- [ ] Performance metrics dashboard
- [ ] Auto-scaling capabilities

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Test with debug mode enabled
4. Verify configuration settings

---

**Note:** All MCP tools are now successfully installed and configured. The system provides a comprehensive set of capabilities for web content processing, 3D modeling integration, structured thinking, and memory management.