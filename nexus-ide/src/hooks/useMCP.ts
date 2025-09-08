/**
 * useMCP Hook
 * Manages connection to Git Memory MCP Server
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useProxy } from './useProxy';
import proxyConfig from '../config/proxy-config.json';

interface MCPConnection {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  url: string;
  lastConnected?: Date;
  errorCount: number;
  mode: 'proxy' | 'direct';
  error?: string;
}

interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  timestamp: Date;
}

interface UseMCPReturn {
  connection: MCPConnection | null;
  messages: MCPMessage[];
  isConnected: boolean;
  connect: (url?: string, useProxy?: boolean) => Promise<void>;
  disconnect: () => void;
  sendMessage: (method: string, params?: any) => Promise<any>;
  clearMessages: () => void;
  switchToProxy: () => Promise<void>;
  switchToDirect: () => Promise<void>;
}

const DEFAULT_SERVER_URL = proxyConfig.proxy.enabled ? 
  proxyConfig.proxy.apiGateway.url : 
  proxyConfig.directConnection.servers.gitMemory.url;
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useMCP(autoConnect: boolean = false): UseMCPReturn {
  const [connection, setConnection] = useState<MCPConnection | null>(null);
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Use proxy hook for proxy connections
  const proxy = useProxy();

  const addMessage = useCallback((message: MCPMessage) => {
    setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
  }, []);

  const generateMessageId = useCallback(() => {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }
    
    if (ws) {
      ws.close();
      setWs(null);
    }
    
    setConnection(prev => prev ? {
      ...prev,
      status: 'disconnected',
    } : null);
    
    setReconnectAttempts(0);
  }, [ws, reconnectTimer]);

  const connect = useCallback(async (url?: string, useProxy: boolean = proxyConfig.proxy.enabled) => {
    const targetUrl = url || DEFAULT_SERVER_URL;
    
    // Disconnect existing connection
    if (ws && ws.readyState === WebSocket.OPEN) {
      disconnect();
    }

    // Create new connection object
    const newConnection: MCPConnection = {
      id: generateMessageId(),
      status: 'connecting',
      url: targetUrl,
      errorCount: 0,
      mode: useProxy ? 'proxy' : 'direct'
    };
    
    setConnection(newConnection);
    setReconnectAttempts(0);

    try {
      if (useProxy && proxyConfig.proxy.enabled) {
        // Use proxy connection
        await proxy.connect('api-gateway');
        
        if (proxy.isConnected) {
          setConnection(prev => prev ? { 
            ...prev, 
            status: 'connected', 
            lastConnected: new Date()
          } : null);
          
          // Send handshake through proxy
          const handshakeMessage: MCPMessage = {
            id: generateMessageId(),
            type: 'request',
            method: 'initialize',
            params: {
              clientInfo: {
                name: 'NEXUS IDE',
                version: '1.0.0',
              },
              capabilities: {
                roots: { listChanged: true },
                sampling: {},
              },
            },
            timestamp: new Date(),
          };
          
          addMessage(handshakeMessage);
          await proxy.sendRequest('/api/mcp/initialize', handshakeMessage);
          
          toast.success('Connected to MCP Server via Proxy successfully');
        } else {
          throw new Error('Cannot connect to Proxy');
        }
      } else {
        // Use direct WebSocket connection
        const websocket = new WebSocket(targetUrl);
        
        websocket.onopen = () => {
          setConnection(prev => prev ? ({
            ...prev,
            status: 'connected',
            lastConnected: new Date(),
            error: undefined,
          }) : null);
          
          setReconnectAttempts(0);
          toast.success('Connected to MCP Server directly successfully');
          
          // Send initial handshake
          const handshakeMessage: MCPMessage = {
            id: generateMessageId(),
            type: 'request',
            method: 'initialize',
            params: {
              clientInfo: {
                name: 'NEXUS IDE',
                version: '1.0.0',
              },
              capabilities: {
                roots: { listChanged: true },
                sampling: {},
              },
            },
            timestamp: new Date(),
          };
          
          websocket.send(JSON.stringify(handshakeMessage));
          addMessage(handshakeMessage);
        };

        websocket.onmessage = (event) => {
          try {
            const message: MCPMessage = JSON.parse(event.data);
            message.timestamp = new Date();
            addMessage(message);
          } catch (error) {
            console.error('Failed to parse MCP message:', error);
          }
        };

        websocket.onerror = (error) => {
          // Only log error if it's not a connection refused (common during development)
          if (error && error.type !== 'error') {
            console.warn('MCP WebSocket connection issue:', error.type || 'Unknown error');
          }
          
          setConnection(prev => prev ? ({
            ...prev,
            status: 'error',
            error: 'Cannot connect to MCP Server',
          }) : null);
          
          // Show user-friendly message instead of console error
          toast.error('Cannot connect to MCP Server. Please check settings');
        };

        websocket.onclose = (event) => {
          setWs(null);
          
          if (event.wasClean) {
            setConnection(prev => prev ? ({
              ...prev,
              status: 'disconnected',
            }) : null);
          } else {
            setConnection(prev => prev ? ({
              ...prev,
              status: 'error',
              error: `Connection closed unexpectedly (${event.code}: ${event.reason})`,
            }) : null);
            
            // Auto-reconnect logic
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const timer = setTimeout(() => {
                setReconnectAttempts(prev => prev + 1);
                connect(targetUrl);
              }, RECONNECT_INTERVAL);
              
              setReconnectTimer(timer);
              toast.error(`Connection lost. Retrying... (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            } else {
              toast.error('Cannot connect to MCP Server');
            }
          }
        };

        setWs(websocket);
      }
    } catch (error) {
      setConnection(prev => prev ? ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown connection error',
      }) : null);
      
      toast.error('Cannot connect to MCP Server');
    }
  }, [ws, disconnect, reconnectAttempts, addMessage, generateMessageId, proxy, proxyConfig, reconnectTimer, setReconnectTimer, setReconnectAttempts, setWs, setConnection, toast]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !connection) {
      connect();
    }
  }, [autoConnect, connection, connect]);

  const sendMessage = useCallback(async (method: string, params?: any): Promise<any> => {
    if (!connection || connection.status !== 'connected') {
      throw new Error('MCP connection is not available');
    }

    const message: MCPMessage = {
      id: generateMessageId(),
      type: 'request',
      method,
      params,
      timestamp: new Date(),
    };

    addMessage(message);

    if (connection.mode === 'proxy' && proxy.isConnected) {
      // Send through proxy
      return await proxy.sendRequest(`/api/mcp/${method}`, message);
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      // Send through WebSocket
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 30000);

        const handleMessage = (event: MessageEvent) => {
          try {
            const response: MCPMessage = JSON.parse(event.data);
            if (response.id === message.id) {
              clearTimeout(timeout);
              ws.removeEventListener('message', handleMessage);
              
              if (response.error) {
                reject(new Error(response.error.message || 'MCP Server error'));
              } else {
                resolve(response.result);
              }
            }
          } catch (error) {
            // Ignore parsing errors for other messages
          }
        };

        ws.addEventListener('message', handleMessage);
        ws.send(JSON.stringify(message));
      });
    } else {
      throw new Error('No active connection available');
    }
  }, [connection, ws, proxy, addMessage, generateMessageId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const switchToProxy = useCallback(async () => {
    await connect(undefined, true);
  }, [connect]);

  const switchToDirect = useCallback(async () => {
    await connect(undefined, false);
  }, [connect]);

  const isConnected = connection?.status === 'connected';

  return {
    connection,
    messages,
    isConnected,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    switchToProxy,
    switchToDirect,
  };
}