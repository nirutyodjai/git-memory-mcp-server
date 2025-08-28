/**
 * React Hooks for MCP Integration
 * Provides easy-to-use hooks for interacting with MCP servers in React components
 */
export declare function useMCP(): {
    client: any;
    request: any;
    getServerStatus: any;
    loading: any;
    error: any;
    clearError: () => any;
};
export declare function useMultiFetch(): {
    fetchHtml: any;
    fetchJson: any;
    fetchText: any;
    fetchMarkdown: any;
    data: any;
    loading: any;
    error: any;
    clearError: () => any;
    clearData: () => any;
};
export declare function useBlender(): {
    getSceneInfo: any;
    getObjectInfo: any;
    takeScreenshot: any;
    executeCode: any;
    generateModel: any;
    sceneInfo: any;
    screenshot: any;
    loading: any;
    error: any;
    clearError: () => any;
};
export declare function useThinking(): {
    getTemplates: any;
    createProcess: any;
    getProcess: any;
    startProcess: any;
    completeStep: any;
    templates: any;
    processes: unknown[];
    loading: any;
    error: any;
    clearError: () => any;
};
export declare function useMemory(): {
    set: any;
    get: any;
    query: any;
    search: any;
    getStats: any;
    stats: any;
    loading: any;
    error: any;
    clearError: () => any;
};
export declare function usePlaywright(): {
    initBrowser: any;
    closeBrowser: any;
    navigateToUrl: any;
    clickElement: any;
    fillInput: any;
    waitForElement: any;
    extractText: any;
    getScreenshot: any;
    getFullDOM: any;
    executeCode: any;
    validateSelectors: any;
    generateTestCode: any;
    runTest: any;
    getSessions: any;
    getContext: any;
    cleanup: any;
    activeSessions: any;
    loading: any;
    error: any;
    clearError: () => any;
};
export declare function useMCPTools(): {
    mcp: {
        client: any;
        request: any;
        getServerStatus: any;
        loading: any;
        error: any;
        clearError: () => any;
    };
    multiFetch: {
        fetchHtml: any;
        fetchJson: any;
        fetchText: any;
        fetchMarkdown: any;
        data: any;
        loading: any;
        error: any;
        clearError: () => any;
        clearData: () => any;
    };
    blender: {
        getSceneInfo: any;
        getObjectInfo: any;
        takeScreenshot: any;
        executeCode: any;
        generateModel: any;
        sceneInfo: any;
        screenshot: any;
        loading: any;
        error: any;
        clearError: () => any;
    };
    thinking: {
        getTemplates: any;
        createProcess: any;
        getProcess: any;
        startProcess: any;
        completeStep: any;
        templates: any;
        processes: unknown[];
        loading: any;
        error: any;
        clearError: () => any;
    };
    playwright: {
        initBrowser: any;
        closeBrowser: any;
        navigateToUrl: any;
        clickElement: any;
        fillInput: any;
        waitForElement: any;
        extractText: any;
        getScreenshot: any;
        getFullDOM: any;
        executeCode: any;
        validateSelectors: any;
        generateTestCode: any;
        runTest: any;
        getSessions: any;
        getContext: any;
        cleanup: any;
        activeSessions: any;
        loading: any;
        error: any;
        clearError: () => any;
    };
    memory: {
        set: any;
        get: any;
        query: any;
        search: any;
        getStats: any;
        stats: any;
        loading: any;
        error: any;
        clearError: () => any;
    };
};
//# sourceMappingURL=useMCP.d.ts.map