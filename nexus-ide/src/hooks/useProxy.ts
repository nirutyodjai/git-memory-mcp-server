import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import proxyConfig from '../config/proxy-config.json';

interface ProxyConnection {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  url: string;
  type: 'api-gateway' | 'mcp-proxy' | 'load-balancer';
  lastConnected?: Date;
  errorCount: number;
}

interface ProxyMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
}

interface UseProxyReturn {
  connections: ProxyConnection[];
  metrics: ProxyMetrics;
  isConnected: boolean;
  connect: (type?: string) => Promise<void>;
  disconnect: () => void;
  sendRequest: (endpoint: string, data?: any, options?: RequestInit) => Promise<any>;
  getProxyStatus: () => Promise<any>;
  switchToDirectConnection: () => void;
  reconnect: () => Promise<void>;
}

const DEFAULT_PROXY_URL = proxyConfig.proxy.apiGateway.url;
const MCP_PROXY_URL = proxyConfig.proxy.mcpProxy.url;
const LOAD_BALANCER_URL = proxyConfig.proxy.loadBalancer.url;
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useProxy = (): UseProxyReturn => {
  const [connections, setConnections] = useState<ProxyConnection[]>([]);
  const [metrics, setMetrics] = useState<ProxyMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeConnections: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const requestTimesRef = useRef<number[]>([]);

  // Initialize proxy connections
  useEffect(() => {
    if (proxyConfig.proxy.enabled) {
      initializeProxyConnections();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const initializeProxyConnections = useCallback(() => {
    const initialConnections: ProxyConnection[] = [
      {
        id: 'api-gateway',
        status: 'disconnected',
        url: DEFAULT_PROXY_URL,
        type: 'api-gateway',
        errorCount: 0
      },
      {
        id: 'mcp-proxy',
        status: 'disconnected',
        url: MCP_PROXY_URL,
        type: 'mcp-proxy',
        errorCount: 0
      },
      {
        id: 'load-balancer',
        status: 'disconnected',
        url: LOAD_BALANCER_URL,
        type: 'load-balancer',
        errorCount: 0
      }
    ];

    setConnections(initialConnections);
  }, []);

  const updateConnectionStatus = useCallback((id: string, status: ProxyConnection['status'], error?: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === id) {
        const updatedConn = {
          ...conn,
          status,
          lastConnected: status === 'connected' ? new Date() : conn.lastConnected,
          errorCount: status === 'error' ? conn.errorCount + 1 : conn.errorCount
        };
        return updatedConn;
      }
      return conn;
    }));

    // Update overall connection status
    setIsConnected(prev => {
      const hasConnectedProxy = connections.some(conn => conn.status === 'connected');
      return hasConnectedProxy;
    });
  }, [connections]);

  const connect = useCallback(async (type: string = 'api-gateway') => {
    const connection = connections.find(conn => conn.type === type);
    if (!connection) {
      toast.error(`ไม่พบ proxy connection ประเภท: ${type}`);
      return;
    }

    updateConnectionStatus(connection.id, 'connecting');

    try {
      // Test connection to proxy
      const response = await fetch(`${connection.url}/health`, {
        method: 'GET',
        timeout: proxyConfig.proxy.apiGateway.timeout
      });

      if (response.ok) {
        updateConnectionStatus(connection.id, 'connected');
        reconnectAttemptsRef.current = 0;
        toast.success(`เชื่อมต่อ ${type} proxy สำเร็จ`);
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          activeConnections: prev.activeConnections + 1
        }));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Proxy connection error (${type}):`, error);
      updateConnectionStatus(connection.id, 'error');
      
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        toast.error(`เชื่อมต่อ ${type} proxy ล้มเหลว - กำลังลองใหม่... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect(type);
        }, RECONNECT_INTERVAL);
      } else {
        toast.error(`เชื่อมต่อ ${type} proxy ล้มเหลว - จะใช้การเชื่อมต่อโดยตรง`);
        switchToDirectConnection();
      }
    }
  }, [connections, updateConnectionStatus]);

  const disconnect = useCallback(() => {
    setConnections(prev => prev.map(conn => ({
      ...conn,
      status: 'disconnected'
    })));
    
    setIsConnected(false);
    setMetrics(prev => ({
      ...prev,
      activeConnections: 0
    }));
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    toast.success('ตัดการเชื่อมต่อ proxy แล้ว');
  }, []);

  const sendRequest = useCallback(async (endpoint: string, data?: any, options: RequestInit = {}) => {
    const startTime = Date.now();
    
    // Find active connection
    const activeConnection = connections.find(conn => conn.status === 'connected');
    if (!activeConnection) {
      throw new Error('ไม่มี proxy connection ที่ใช้งานได้');
    }

    try {
      const url = `${activeConnection.url}${endpoint}`;
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options
      };

      const response = await fetch(url, requestOptions);
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      requestTimesRef.current.push(responseTime);
      if (requestTimesRef.current.length > 100) {
        requestTimesRef.current = requestTimesRef.current.slice(-100);
      }
      
      const avgResponseTime = requestTimesRef.current.reduce((a, b) => a + b, 0) / requestTimesRef.current.length;
      
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        successfulRequests: response.ok ? prev.successfulRequests + 1 : prev.successfulRequests,
        failedRequests: response.ok ? prev.failedRequests : prev.failedRequests + 1,
        averageResponseTime: Math.round(avgResponseTime)
      }));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Proxy request error:', error);
      
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        failedRequests: prev.failedRequests + 1
      }));
      
      throw error;
    }
  }, [connections]);

  const getProxyStatus = useCallback(async () => {
    try {
      const statusPromises = connections.map(async (conn) => {
        try {
          const response = await fetch(`${conn.url}/status`, {
            method: 'GET',
            timeout: 5000
          });
          return {
            id: conn.id,
            status: response.ok ? 'healthy' : 'unhealthy',
            data: response.ok ? await response.json() : null
          };
        } catch (error) {
          return {
            id: conn.id,
            status: 'error',
            error: error.message
          };
        }
      });

      const results = await Promise.all(statusPromises);
      return results;
    } catch (error) {
      console.error('Failed to get proxy status:', error);
      throw error;
    }
  }, [connections]);

  const switchToDirectConnection = useCallback(() => {
    console.log('Switching to direct connection mode...');
    
    // Disable proxy mode
    setIsConnected(false);
    setConnections(prev => prev.map(conn => ({
      ...conn,
      status: 'disconnected'
    })));
    
    toast.success('เปลี่ยนเป็นการเชื่อมต่อโดยตรงแล้ว');
    
    // Here you would trigger the direct connection logic
    // This could be handled by the parent component or another hook
  }, []);

  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to connect to the primary proxy first
    await connect('api-gateway');
  }, [connect, disconnect]);

  return {
    connections,
    metrics,
    isConnected,
    connect,
    disconnect,
    sendRequest,
    getProxyStatus,
    switchToDirectConnection,
    reconnect
  };
};

export default useProxy;