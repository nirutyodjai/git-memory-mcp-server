"use strict";
/**
 * React Hooks for MCP Integration
 * Provides easy-to-use hooks for interacting with MCP servers in React components
 */
'use client';
/**
 * React Hooks for MCP Integration
 * Provides easy-to-use hooks for interacting with MCP servers in React components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMCP = useMCP;
exports.useMultiFetch = useMultiFetch;
exports.useBlender = useBlender;
exports.useThinking = useThinking;
exports.useMemory = useMemory;
exports.usePlaywright = usePlaywright;
exports.useMCPTools = useMCPTools;
const react_1 = require("react");
const mcp_client_1 = require("@/lib/mcp-client");
// Base MCP hook
function useMCP() {
    const [client] = (0, react_1.useState)(() => new mcp_client_1.MCPClient());
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const request = (0, react_1.useCallback)(async (req) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.request(req);
            if (!response.success) {
                setError(response.error || 'Unknown error');
                return null;
            }
            return response;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getServerStatus = (0, react_1.useCallback)(async (serverName) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getServerStatus(serverName);
            if (!response.success) {
                setError(response.error || 'Unknown error');
                return null;
            }
            return response;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
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
function useMultiFetch() {
    const [client] = (0, react_1.useState)(() => new mcp_client_1.MultiFetchClient());
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [data, setData] = (0, react_1.useState)(null);
    const fetchHtml = (0, react_1.useCallback)(async (url, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.fetchHtml(url, options);
            if (response.success) {
                setData(response.data);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to fetch HTML');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const fetchJson = (0, react_1.useCallback)(async (url, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.fetchJson(url, options);
            if (response.success) {
                setData(response.data);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to fetch JSON');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const fetchText = (0, react_1.useCallback)(async (url, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.fetchText(url, options);
            if (response.success) {
                setData(response.data);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to fetch text');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const fetchMarkdown = (0, react_1.useCallback)(async (url, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.fetchMarkdown(url, options);
            if (response.success) {
                setData(response.data);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to fetch markdown');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
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
function useBlender() {
    const [client] = (0, react_1.useState)(() => new mcp_client_1.BlenderClient());
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [sceneInfo, setSceneInfo] = (0, react_1.useState)(null);
    const [screenshot, setScreenshot] = (0, react_1.useState)(null);
    const getSceneInfo = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getSceneInfo();
            if (response.success) {
                setSceneInfo(response.data);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to get scene info');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getObjectInfo = (0, react_1.useCallback)(async (objectName) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getObjectInfo(objectName);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to get object info');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const takeScreenshot = (0, react_1.useCallback)(async (maxSize = 800) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.takeScreenshot(maxSize);
            if (response.success && response.data?.image) {
                setScreenshot(response.data.image);
                return response.data.image;
            }
            else {
                setError(response.error || 'Failed to take screenshot');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const executeCode = (0, react_1.useCallback)(async (code) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.executeCode(code);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to execute code');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const generateModel = (0, react_1.useCallback)(async (prompt, bboxCondition) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.generateHyper3DModel(prompt, bboxCondition);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to generate model');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
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
function useThinking() {
    const [client] = (0, react_1.useState)(() => new mcp_client_1.ThinkingClient());
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [templates, setTemplates] = (0, react_1.useState)([]);
    const [processes, setProcesses] = (0, react_1.useState)(new Map());
    const getTemplates = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getTemplates();
            if (response.success) {
                setTemplates(response.data?.templates || []);
                return response.data?.templates;
            }
            else {
                setError(response.error || 'Failed to get templates');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const createProcess = (0, react_1.useCallback)(async (templateId, title, description) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.createProcess(templateId, title, description);
            if (response.success && response.data?.process) {
                const process = response.data.process;
                setProcesses(prev => new Map(prev.set(process.id, process)));
                return process;
            }
            else {
                setError(response.error || 'Failed to create process');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getProcess = (0, react_1.useCallback)(async (processId) => {
        const cached = processes.get(processId);
        if (cached)
            return cached;
        setLoading(true);
        setError(null);
        try {
            const response = await client.getProcess(processId);
            if (response.success && response.data?.process) {
                const process = response.data.process;
                setProcesses(prev => new Map(prev.set(processId, process)));
                return process;
            }
            else {
                setError(response.error || 'Failed to get process');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client, processes]);
    const startProcess = (0, react_1.useCallback)(async (processId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.startProcess(processId);
            if (response.success) {
                // Refresh process data
                await getProcess(processId);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to start process');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client, getProcess]);
    const completeStep = (0, react_1.useCallback)(async (processId, stepId, result) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.completeStep(processId, stepId, result);
            if (response.success) {
                // Refresh process data
                await getProcess(processId);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to complete step');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
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
function useMemory() {
    const [client] = (0, react_1.useState)(() => new mcp_client_1.MemoryClient());
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [stats, setStats] = (0, react_1.useState)(null);
    const set = (0, react_1.useCallback)(async (key, value, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.set(key, value, options);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to set value');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const get = (0, react_1.useCallback)(async (key, namespace) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get(key, namespace);
            if (response.success) {
                return response.data?.value;
            }
            else {
                setError(response.error || 'Failed to get value');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const query = (0, react_1.useCallback)(async (queryParams) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.query(queryParams);
            if (response.success) {
                return response.data?.entries || [];
            }
            else {
                setError(response.error || 'Failed to query data');
                return [];
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return [];
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const search = (0, react_1.useCallback)(async (searchTerm, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.search(searchTerm, options);
            if (response.success) {
                return response.data?.results || [];
            }
            else {
                setError(response.error || 'Failed to search');
                return [];
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return [];
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getStats = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getStats();
            if (response.success) {
                setStats(response.data?.stats);
                return response.data?.stats;
            }
            else {
                setError(response.error || 'Failed to get stats');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    // Auto-refresh stats periodically
    (0, react_1.useEffect)(() => {
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
function usePlaywright() {
    const [client] = (0, react_1.useState)(() => new mcp_client_1.PlaywrightClient());
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [activeSessions, setActiveSessions] = (0, react_1.useState)([]);
    const initBrowser = (0, react_1.useCallback)(async (options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.initBrowser(options);
            if (response.success && response.data?.sessionId) {
                setActiveSessions(prev => [...prev, response.data.sessionId]);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to initialize browser');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const closeBrowser = (0, react_1.useCallback)(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.closeBrowser(sessionId);
            if (response.success) {
                setActiveSessions(prev => prev.filter(id => id !== sessionId));
                return response.data;
            }
            else {
                setError(response.error || 'Failed to close browser');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const navigateToUrl = (0, react_1.useCallback)(async (sessionId, url, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.navigateToUrl(sessionId, url, options);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to navigate to URL');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const clickElement = (0, react_1.useCallback)(async (sessionId, selector, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.clickElement(sessionId, selector, options);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to click element');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const fillInput = (0, react_1.useCallback)(async (sessionId, selector, value, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.fillInput(sessionId, selector, value, options);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to fill input');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const waitForElement = (0, react_1.useCallback)(async (sessionId, selector, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.waitForElement(sessionId, selector, options);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to wait for element');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const extractText = (0, react_1.useCallback)(async (sessionId, selector) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.extractText(sessionId, selector);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to extract text');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getScreenshot = (0, react_1.useCallback)(async (sessionId, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getScreenshot(sessionId, options);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to get screenshot');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getFullDOM = (0, react_1.useCallback)(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getFullDOM(sessionId);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to get full DOM');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const executeCode = (0, react_1.useCallback)(async (sessionId, code) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.executeCode(sessionId, code);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to execute code');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const validateSelectors = (0, react_1.useCallback)(async (sessionId, selectors) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.validateSelectors(sessionId, selectors);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to validate selectors');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const generateTestCode = (0, react_1.useCallback)(async (testCase) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.generateTestCode(testCase);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to generate test code');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const runTest = (0, react_1.useCallback)(async (sessionId, testCode) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.runTest(sessionId, testCode);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to run test');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getSessions = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getSessions();
            if (response.success && response.data?.sessions) {
                setActiveSessions(response.data.sessions.map((s) => s.id));
                return response.data.sessions;
            }
            else {
                setError(response.error || 'Failed to get sessions');
                return [];
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return [];
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const getContext = (0, react_1.useCallback)(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getContext(sessionId);
            if (response.success) {
                return response.data;
            }
            else {
                setError(response.error || 'Failed to get context');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [client]);
    const cleanup = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.cleanup();
            if (response.success) {
                setActiveSessions([]);
                return response.data;
            }
            else {
                setError(response.error || 'Failed to cleanup');
                return null;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
        finally {
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
function useMCPTools() {
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
