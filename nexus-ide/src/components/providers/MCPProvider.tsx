import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

// MCP Server types
interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  capabilities: string[];
  lastPing?: number;
  metadata?: Record<string, any>;
}

interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  timestamp: number;
}

interface MCPProviderState {
  servers: MCPServer[];
  activeServer: MCPServer | null;
  isConnecting: boolean;
  messages: MCPMessage[];
  // Actions
  connectServer: (server: Omit<MCPServer, 'id' | 'status'>) => Promise<void>;
  disconnectServer: (serverId: string) => Promise<void>;
  sendMessage: (serverId: string, message: Omit<MCPMessage, 'id' | 'timestamp'>) => Promise<any>;
  setActiveServer: (serverId: string | null) => void;
  getServerCapabilities: (serverId: string) => string[];
  clearMessages: () => void;
}

const initialState: MCPProviderState = {
  servers: [],
  activeServer: null,
  isConnecting: false,
  messages: [],
  connectServer: async () => {},
  disconnectServer: async () => {},
  sendMessage: async () => {},
  setActiveServer: () => {},
  getServerCapabilities: () => [],
  clearMessages: () => {},
};

const MCPProviderContext = createContext<MCPProviderState>(initialState);

interface MCPProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
  defaultServers?: Omit<MCPServer, 'id' | 'status'>[];
}

export function MCPProvider({ 
  children, 
  autoConnect = true,
  defaultServers = []
}: MCPProviderProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [activeServer, setActiveServerState] = useState<MCPServer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [connections, setConnections] = useState<Map<string, WebSocket>>(new Map());

  // Generate unique ID for servers
  const generateServerId = useCallback(() => {
    return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Connect to MCP server
  const connectServer = useCallback(async (serverConfig: Omit<MCPServer, 'id' | 'status'>) => {
    const serverId = generateServerId();
    const server: MCPServer = {
      ...serverConfig,
      id: serverId,
      status: 'connecting',
    };

    setServers(prev => [...prev, server]);
    setIsConnecting(true);

    try {
      // Handle mock URLs
      if (server.url.startsWith('mock://')) {
        // Simulate connection for mock servers
        setTimeout(() => {
          setServers(prev => 
            prev.map(s => s.id === serverId ? { ...s, status: 'connected' as const, lastPing: Date.now() } : s)
          );
          toast.success(`Connected to ${server.name} (Mock Mode)`);
        }, 1000);
        return;
      }

      // Create WebSocket connection for real URLs
      const ws = new WebSocket(server.url);
      
      ws.onopen = () => {
        setServers(prev => 
          prev.map(s => s.id === serverId ? { ...s, status: 'connected' as const, lastPing: Date.now() } : s)
        );
        setConnections(prev => new Map(prev).set(serverId, ws));
        
        toast.success(`Connected to ${server.name}`);
        
        // Send initial handshake
        const handshakeMessage: MCPMessage = {
          id: `handshake-${Date.now()}`,
          type: 'request',
          method: 'initialize',
          params: {
            protocolVersion: '1.0',
            clientInfo: {
              name: 'NEXUS IDE',
              version: '1.0.0',
            },
          },
          timestamp: Date.now(),
        };
        
        ws.send(JSON.stringify(handshakeMessage));
        setMessages(prev => [...prev, handshakeMessage]);
      };

      ws.onmessage = (event) => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);
          
          // Handle server capabilities response
          if (message.method === 'initialize' && message.result) {
            const capabilities = message.result.capabilities || [];
            setServers(prev => 
              prev.map(s => s.id === serverId ? { ...s, capabilities } : s)
            );
          }
        } catch (error) {
          console.error('Failed to parse MCP message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('MCP WebSocket error:', error);
        setServers(prev => 
          prev.map(s => s.id === serverId ? { ...s, status: 'error' as const } : s)
        );
        toast.error(`Connection error: ${server.name}`);
      };

      ws.onclose = () => {
        setServers(prev => 
          prev.map(s => s.id === serverId ? { ...s, status: 'disconnected' as const } : s)
        );
        setConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(serverId);
          return newMap;
        });
        toast.info(`Disconnected from ${server.name}`);
      };

    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      setServers(prev => 
        prev.map(s => s.id === serverId ? { ...s, status: 'error' as const } : s)
      );
      toast.error(`Failed to connect to ${server.name}`);
    } finally {
      setIsConnecting(false);
    }
  }, [generateServerId]);

  // Disconnect from MCP server
  const disconnectServer = useCallback(async (serverId: string) => {
    const connection = connections.get(serverId);
    if (connection) {
      connection.close();
    }
    
    setServers(prev => prev.filter(s => s.id !== serverId));
    setConnections(prev => {
      const newMap = new Map(prev);
      newMap.delete(serverId);
      return newMap;
    });
    
    if (activeServer?.id === serverId) {
      setActiveServerState(null);
    }
  }, [connections, activeServer]);

  // Send message to MCP server
  const sendMessage = useCallback(async (serverId: string, messageData: Omit<MCPMessage, 'id' | 'timestamp'>) => {
    const server = servers.find(s => s.id === serverId);
    const connection = connections.get(serverId);
    
    // Handle mock servers
    if (server?.url.startsWith('mock://')) {
      const message: MCPMessage = {
        ...messageData,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      
      // Simulate mock response
      const mockResponse: MCPMessage = {
        id: `response-${Date.now()}`,
        type: 'response',
        result: { success: true, message: 'Mock response from ' + server.name },
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, message, mockResponse]);
      return mockResponse;
    }
    
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      throw new Error('Server not connected');
    }

    const message: MCPMessage = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 30000); // 30 second timeout

      const handleResponse = (event: MessageEvent) => {
        try {
          const response: MCPMessage = JSON.parse(event.data);
          if (response.id === message.id || 
              (response.type === 'response' && messageData.type === 'request')) {
            clearTimeout(timeout);
            connection.removeEventListener('message', handleResponse);
            
            if (response.error) {
              reject(new Error(response.error.message || 'MCP Error'));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          // Ignore parsing errors for unrelated messages
        }
      };

      connection.addEventListener('message', handleResponse);
      connection.send(JSON.stringify(message));
      setMessages(prev => [...prev, message]);
    });
  }, [connections, servers]);

  // Set active server
  const setActiveServer = useCallback((serverId: string | null) => {
    if (serverId) {
      const server = servers.find(s => s.id === serverId);
      setActiveServerState(server || null);
    } else {
      setActiveServerState(null);
    }
  }, [servers]);

  // Get server capabilities
  const getServerCapabilities = useCallback((serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    return server?.capabilities || [];
  }, [servers]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Auto-connect to default servers
  useEffect(() => {
    if (autoConnect && defaultServers.length > 0) {
      defaultServers.forEach(server => {
        connectServer(server);
      });
    }
  }, [autoConnect, defaultServers, connectServer]);

  // Ping connected servers periodically
  useEffect(() => {
    const interval = setInterval(() => {
      servers.forEach(server => {
        if (server.status === 'connected') {
          const connection = connections.get(server.id);
          if (connection && connection.readyState === WebSocket.OPEN) {
            // Send ping message
            const pingMessage: MCPMessage = {
              id: `ping-${Date.now()}`,
              type: 'request',
              method: 'ping',
              params: {},
              timestamp: Date.now(),
            };
            
            connection.send(JSON.stringify(pingMessage));
            
            // Update last ping time
            setServers(prev => 
              prev.map(s => s.id === server.id ? { ...s, lastPing: Date.now() } : s)
            );
          }
        }
      });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(interval);
  }, [servers, connections]);

  // Cleanup connections on unmount
  useEffect(() => {
    return () => {
      connections.forEach(connection => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.close();
        }
      });
    };
  }, [connections]);

  const value: MCPProviderState = {
    servers,
    activeServer,
    isConnecting,
    messages,
    connectServer,
    disconnectServer,
    sendMessage,
    setActiveServer,
    getServerCapabilities,
    clearMessages,
  };

  return (
    <MCPProviderContext.Provider value={value}>
      {children}
    </MCPProviderContext.Provider>
  );
}

export const useMCP = () => {
  const context = useContext(MCPProviderContext);
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
};

// MCP utilities and hooks
export const useMCPServer = (serverId: string) => {
  const { servers, sendMessage, getServerCapabilities } = useMCP();
  const server = servers.find(s => s.id === serverId);
  
  return {
    server,
    isConnected: server?.status === 'connected',
    capabilities: server ? getServerCapabilities(serverId) : [],
    send: (message: Omit<MCPMessage, 'id' | 'timestamp'>) => sendMessage(serverId, message),
  };
};

export const useMCPCapability = (capability: string) => {
  const { servers, activeServer } = useMCP();
  
  const availableServers = servers.filter(server => 
    server.status === 'connected' && server.capabilities.includes(capability)
  );
  
  const currentServer = activeServer && activeServer.capabilities.includes(capability) 
    ? activeServer 
    : availableServers[0] || null;
  
  return {
    availableServers,
    currentServer,
    hasCapability: availableServers.length > 0,
  };
};

// Default MCP servers configuration
export const defaultMCPServers = [
  {
    name: 'Git Memory MCP Server (Mock)',
    url: 'mock://localhost:8080/mcp',
    capabilities: ['git', 'memory', 'search', 'analysis'],
    metadata: {
      description: 'Mock Git Memory MCP Server for development (WebSocket servers not running)',
      version: '1.0.0',
      mock: true,
    },
  },
  {
    name: 'AI Services MCP (Mock)',
    url: 'mock://localhost:8081/mcp',
    capabilities: ['ai', 'completion', 'analysis', 'generation'],
    metadata: {
      description: 'Mock AI services for development (WebSocket servers not running)',
      version: '1.0.0',
      mock: true,
    },
  },
  {
    name: 'File System MCP (Mock)',
    url: 'mock://localhost:8082/mcp',
    capabilities: ['filesystem', 'search', 'watch'],
    metadata: {
      description: 'Mock file system operations for development (WebSocket servers not running)',
      version: '1.0.0',
      mock: true,
    },
  },
];

// Export context for advanced usage
export { MCPProviderContext };
export type { MCPServer, MCPMessage, MCPProviderState };