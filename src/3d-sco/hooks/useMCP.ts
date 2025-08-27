/**
 * React Hooks for MCP Integration
 * Provides easy-to-use hooks for interacting with MCP servers in React components
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MCPClient,
  MultiFetchClient,
  BlenderClient,
  ThinkingClient,
  PlaywrightClient,
  MemoryClient,
  MCPRequest,
  MCPResponse
} from '@/lib/mcp-client';

// Base MCP hook
export function useMCP() {
  const [client] = useState(() => new MCPClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T = any>(req: MCPRequest): Promise<MCPResponse<T> | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.request<T>(req);
      if (!response.success) {
        setError(response.error || 'Unknown error');
        return null;
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getServerStatus = useCallback(async (serverName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getServerStatus(serverName);
      if (!response.success) {
        setError(response.error || 'Unknown error');
        return null;
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    client,
    request,
    getServerStatus,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Multi Fetch hooks
export function useMultiFetch() {
  const [client] = useState(() => new MultiFetchClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchHtml = useCallback(async (url: string, options?: {
    startCursor?: number;
    headers?: Record<string, string>;
    contentSizeLimit?: number;
    extractContent?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.fetchHtml(url, options);
      if (response.success) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch HTML');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchJson = useCallback(async (url: string, options?: {
    startCursor?: number;
    headers?: Record<string, string>;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.fetchJson(url, options);
      if (response.success) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch JSON');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchText = useCallback(async (url: string, options?: {
    startCursor?: number;
    extractContent?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.fetchText(url, options);
      if (response.success) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch text');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchMarkdown = useCallback(async (url: string, options?: {
    startCursor?: number;
    extractContent?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.fetchMarkdown(url, options);
      if (response.success) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch markdown');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    fetchHtml,
    fetchJson,
    fetchText,
    fetchMarkdown,
    data,
    loading,
    error,
    clearError: () => setError(null),
    clearData: () => setData(null)
  };
}

// Blender hooks
export function useBlender() {
  const [client] = useState(() => new BlenderClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sceneInfo, setSceneInfo] = useState<any>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const getSceneInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getSceneInfo();
      if (response.success) {
        setSceneInfo(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to get scene info');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getObjectInfo = useCallback(async (objectName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getObjectInfo(objectName);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get object info');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const takeScreenshot = useCallback(async (maxSize: number = 800) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.takeScreenshot(maxSize);
      if (response.success && response.data?.image) {
        setScreenshot(response.data.image);
        return response.data.image;
      } else {
        setError(response.error || 'Failed to take screenshot');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const executeCode = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.executeCode(code);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to execute code');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const generateModel = useCallback(async (prompt: string, bboxCondition?: number[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.generateHyper3DModel(prompt, bboxCondition);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to generate model');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    getSceneInfo,
    getObjectInfo,
    takeScreenshot,
    executeCode,
    generateModel,
    sceneInfo,
    screenshot,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Sequential Thinking hooks
export function useThinking() {
  const [client] = useState(() => new ThinkingClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [processes, setProcesses] = useState<Map<string, any>>(new Map());

  const getTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getTemplates();
      if (response.success) {
        setTemplates(response.data?.templates || []);
        return response.data?.templates;
      } else {
        setError(response.error || 'Failed to get templates');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createProcess = useCallback(async (templateId: string, title: string, description?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.createProcess(templateId, title, description);
      if (response.success && response.data?.process) {
        const process = response.data.process;
        setProcesses(prev => new Map(prev.set(process.id, process)));
        return process;
      } else {
        setError(response.error || 'Failed to create process');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getProcess = useCallback(async (processId: string) => {
    const cached = processes.get(processId);
    if (cached) return cached;

    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getProcess(processId);
      if (response.success && response.data?.process) {
        const process = response.data.process;
        setProcesses(prev => new Map(prev.set(processId, process)));
        return process;
      } else {
        setError(response.error || 'Failed to get process');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, processes]);

  const startProcess = useCallback(async (processId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.startProcess(processId);
      if (response.success) {
        // Refresh process data
        await getProcess(processId);
        return response.data;
      } else {
        setError(response.error || 'Failed to start process');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, getProcess]);

  const completeStep = useCallback(async (processId: string, stepId: string, result: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.completeStep(processId, stepId, result);
      if (response.success) {
        // Refresh process data
        await getProcess(processId);
        return response.data;
      } else {
        setError(response.error || 'Failed to complete step');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, getProcess]);

  return {
    getTemplates,
    createProcess,
    getProcess,
    startProcess,
    completeStep,
    templates,
    processes: Array.from(processes.values()),
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Memory hooks
export function useMemory() {
  const [client] = useState(() => new MemoryClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const set = useCallback(async (key: string, value: any, options?: {
    ttl?: number;
    tags?: string[];
    namespace?: string;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.set(key, value, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to set value');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const get = useCallback(async (key: string, namespace?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.get(key, namespace);
      if (response.success) {
        return response.data?.value;
      } else {
        setError(response.error || 'Failed to get value');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const query = useCallback(async (queryParams: {
    namespace?: string;
    tags?: string[];
    pattern?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.query(queryParams);
      if (response.success) {
        return response.data?.entries || [];
      } else {
        setError(response.error || 'Failed to query data');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  const search = useCallback(async (searchTerm: string, options?: {
    namespace?: string;
    limit?: number;
    fuzzy?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.search(searchTerm, options);
      if (response.success) {
        return response.data?.results || [];
      } else {
        setError(response.error || 'Failed to search');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getStats();
      if (response.success) {
        setStats(response.data?.stats);
        return response.data?.stats;
      } else {
        setError(response.error || 'Failed to get stats');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Auto-refresh stats periodically
  useEffect(() => {
    getStats();
    const interval = setInterval(getStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [getStats]);

  return {
    set,
    get,
    query,
    search,
    getStats,
    stats,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Playwright hooks
export function usePlaywright() {
  const [client] = useState(() => new PlaywrightClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);

  const initBrowser = useCallback(async (options?: { headless?: boolean; browserType?: 'chromium' | 'firefox' | 'webkit' }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.initBrowser(options);
      if (response.success && response.data?.sessionId) {
        setActiveSessions(prev => [...prev, response.data.sessionId]);
        return response.data;
      } else {
        setError(response.error || 'Failed to initialize browser');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const closeBrowser = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.closeBrowser(sessionId);
      if (response.success) {
        setActiveSessions(prev => prev.filter(id => id !== sessionId));
        return response.data;
      } else {
        setError(response.error || 'Failed to close browser');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const navigateToUrl = useCallback(async (sessionId: string, url: string, options?: { timeout?: number; waitUntil?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.navigateToUrl(sessionId, url, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to navigate to URL');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const clickElement = useCallback(async (sessionId: string, selector: string, options?: { timeout?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.clickElement(sessionId, selector, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to click element');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fillInput = useCallback(async (sessionId: string, selector: string, value: string, options?: { timeout?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.fillInput(sessionId, selector, value, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fill input');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const waitForElement = useCallback(async (sessionId: string, selector: string, options?: { timeout?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.waitForElement(sessionId, selector, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to wait for element');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const extractText = useCallback(async (sessionId: string, selector: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.extractText(sessionId, selector);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to extract text');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getScreenshot = useCallback(async (sessionId: string, options?: { fullPage?: boolean; format?: 'png' | 'jpeg' }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getScreenshot(sessionId, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get screenshot');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getFullDOM = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getFullDOM(sessionId);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get full DOM');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const executeCode = useCallback(async (sessionId: string, code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.executeCode(sessionId, code);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to execute code');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const validateSelectors = useCallback(async (sessionId: string, selectors: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.validateSelectors(sessionId, selectors);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to validate selectors');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const generateTestCode = useCallback(async (testCase: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.generateTestCode(testCase);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to generate test code');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const runTest = useCallback(async (sessionId: string, testCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.runTest(sessionId, testCode);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to run test');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getSessions();
      if (response.success && response.data?.sessions) {
        setActiveSessions(response.data.sessions.map((s: any) => s.id));
        return response.data.sessions;
      } else {
        setError(response.error || 'Failed to get sessions');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getContext = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.getContext(sessionId);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get context');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const cleanup = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.cleanup();
      if (response.success) {
        setActiveSessions([]);
        return response.data;
      } else {
        setError(response.error || 'Failed to cleanup');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    initBrowser,
    closeBrowser,
    navigateToUrl,
    clickElement,
    fillInput,
    waitForElement,
    extractText,
    getScreenshot,
    getFullDOM,
    executeCode,
    validateSelectors,
    generateTestCode,
    runTest,
    getSessions,
    getContext,
    cleanup,
    activeSessions,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Combined hook for all MCP functionality
export function useMCPTools() {
  const mcp = useMCP();
  const multiFetch = useMultiFetch();
  const blender = useBlender();
  const thinking = useThinking();
  const playwright = usePlaywright();
  const memory = useMemory();

  return {
    mcp,
    multiFetch,
    blender,
    thinking,
    playwright,
    memory
  };
}