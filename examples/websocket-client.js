/**
 * Git Memory MCP Server - WebSocket Client Example
 *
 * Demonstrates how to connect to the WebSocket server and use real-time features
 * including repository event subscriptions and tool execution monitoring.
 */

class GitMemoryWebSocketClient {
  constructor(serverUrl = 'ws://localhost:3000', apiKey = null) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.ws = null;
    this.connectionId = null;
    this.eventListeners = new Map();
    this.subscriptions = new Map();

    // Auto-reconnect settings
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
  }

  /**
   * Connect to the WebSocket server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = (event) => {
          console.log('✅ Connected to Git Memory MCP Server');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve(event);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.handleDisconnection();
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    console.log('📨 Received message:', message.type);

    switch (message.type) {
      case 'welcome':
        this.connectionId = message.connectionId;
        console.log(`🎯 Connection ID: ${this.connectionId}`);
        break;

      case 'repo_event':
        this.emit('repoEvent', message);
        console.log(`📁 Repository event: ${message.eventType} for ${message.repoPath}`);
        break;

      case 'tool_execution_event':
        this.emit('toolExecution', message);
        console.log(`🔧 Tool execution: ${message.toolName} - ${message.data.status}`);
        break;

      case 'subscription_confirmed':
        console.log(`✅ ${message.message}`);
        break;

      case 'unsubscription_confirmed':
        console.log(`✅ ${message.message}`);
        break;

      case 'error':
        console.error(`❌ Error: ${message.message}`);
        this.emit('error', message);
        break;

      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  /**
   * Handle disconnection and attempt reconnection
   */
  handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('disconnected');
    }
  }

  /**
   * Subscribe to repository events
   */
  subscribeToRepoEvents(repoPath) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'subscribe_repo_events',
      data: { repoPath }
    };

    this.ws.send(JSON.stringify(message));
    console.log(`📋 Subscribed to events for repository: ${repoPath}`);
  }

  /**
   * Unsubscribe from repository events
   */
  unsubscribeFromRepoEvents(repoPath) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'unsubscribe_repo_events',
      data: { repoPath }
    };

    this.ws.send(JSON.stringify(message));
    console.log(`📋 Unsubscribed from events for repository: ${repoPath}`);
  }

  /**
   * Subscribe to tool execution events
   */
  subscribeToToolExecutions(toolName) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'subscribe_tool_executions',
      data: { toolName }
    };

    this.ws.send(JSON.stringify(message));
    console.log(`📋 Subscribed to execution events for tool: ${toolName}`);
  }

  /**
   * Unsubscribe from tool execution events
   */
  unsubscribeFromToolExecutions(toolName) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'unsubscribe_tool_executions',
      data: { toolName }
    };

    this.ws.send(JSON.stringify(message));
    console.log(`📋 Unsubscribed from execution events for tool: ${toolName}`);
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'get_active_subscriptions',
      data: {}
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Execute a tool with real-time updates
   */
  executeTool(toolName, args) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'execute_tool',
      data: {
        name: toolName,
        arguments: args
      }
    };

    this.ws.send(JSON.stringify(message));
    console.log(`🔧 Executing tool: ${toolName}`);
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'ping',
      data: {}
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }
}

// Example usage and demo functions
class GitMemoryWebSocketDemo {
  constructor() {
    this.client = new GitMemoryWebSocketClient('ws://localhost:3000', 'your-api-key-here');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Repository events
    this.client.on('repoEvent', (event) => {
      console.log('📁 Repository Event:', {
        repo: event.repoPath,
        type: event.eventType,
        data: event.data,
        timestamp: event.timestamp
      });

      // Update UI or trigger actions based on event type
      switch (event.eventType) {
        case 'status_checked':
          this.updateStatusDisplay(event.data);
          break;
        case 'fetch_completed':
          this.updateFetchStatus(event.data);
          break;
        case 'rebase_completed':
          this.updateRebaseStatus(event.data);
          break;
      }
    });

    // Tool execution events
    this.client.on('toolExecution', (event) => {
      console.log('🔧 Tool Execution Event:', {
        tool: event.toolName,
        status: event.data.status,
        executionId: event.data.executionId,
        duration: event.data.duration,
        timestamp: event.timestamp
      });

      switch (event.data.status) {
        case 'started':
          this.showProgressIndicator(event.data);
          break;
        case 'completed':
          this.hideProgressIndicator();
          this.showSuccessMessage(event.data);
          break;
        case 'failed':
          this.hideProgressIndicator();
          this.showErrorMessage(event.data);
          break;
      }
    });

    // Connection events
    this.client.on('disconnected', () => {
      console.log('🔌 Disconnected from server');
      this.updateConnectionStatus('disconnected');
    });
  }

  async runDemo() {
    try {
      console.log('🚀 Starting Git Memory WebSocket Demo...');

      // Connect to server
      await this.client.connect();
      this.updateConnectionStatus('connected');

      // Subscribe to repository events
      console.log('\n📋 Subscribing to repository events...');
      this.client.subscribeToRepoEvents('/path/to/your/repository');

      // Subscribe to tool execution events
      console.log('📋 Subscribing to tool execution events...');
      this.client.subscribeToToolExecutions('git_status_cli');

      // Execute some tools
      console.log('\n🔧 Executing tools...');
      this.client.executeTool('git_status_cli', {
        repoPath: '/path/to/your/repository',
        json: true
      });

      // Wait a bit then execute another tool
      setTimeout(() => {
        this.client.executeTool('git_fetch_cli', {
          repoPath: '/path/to/your/repository',
          remote: 'origin',
          prune: false
        });
      }, 3000);

      // Keep connection alive
      setInterval(() => {
        this.client.ping();
      }, 30000);

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  // UI update methods (implement based on your UI framework)
  updateStatusDisplay(data) {
    console.log('📊 Updating status display:', data);
    // Update your UI here
  }

  updateFetchStatus(data) {
    console.log('📥 Updating fetch status:', data);
    // Update your UI here
  }

  updateRebaseStatus(data) {
    console.log('🔄 Updating rebase status:', data);
    // Update your UI here
  }

  showProgressIndicator(data) {
    console.log('⏳ Showing progress indicator:', data);
    // Show loading spinner/progress bar
  }

  hideProgressIndicator() {
    console.log('✅ Hiding progress indicator');
    // Hide loading spinner/progress bar
  }

  showSuccessMessage(data) {
    console.log('✅ Showing success message:', data);
    // Show success notification
  }

  showErrorMessage(data) {
    console.error('❌ Showing error message:', data);
    // Show error notification
  }

  updateConnectionStatus(status) {
    console.log(`🔗 Connection status: ${status}`);
    // Update connection status indicator
  }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GitMemoryWebSocketClient, GitMemoryWebSocketDemo };
}

// Browser usage example:
/*
const demo = new GitMemoryWebSocketDemo();
demo.runDemo();

// Or use client directly:
const client = new GitMemoryWebSocketClient('ws://localhost:3000', 'your-api-key');
await client.connect();
client.subscribeToRepoEvents('/path/to/repo');
client.on('repoEvent', (event) => console.log('Repo event:', event));
*/

// Node.js usage example:
/*
const { GitMemoryWebSocketClient, GitMemoryWebSocketDemo } = require('./websocket-client');

const demo = new GitMemoryWebSocketDemo();
demo.runDemo().catch(console.error);
*/

export { GitMemoryWebSocketClient, GitMemoryWebSocketDemo };
