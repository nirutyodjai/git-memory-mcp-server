#!/usr/bin/env node
export declare class GitMemoryServer {
    private server;
    private git;
    private memory;
    private memoryFile;
    private memoryCache;
    private readonly CACHE_SIZE;
    private readonly CACHE_TTL;
    private compressionEnabled;
    private lastSaveTime;
    private readonly SAVE_DEBOUNCE_MS;
    constructor();
    private initializeAsync;
    private loadMemory;
    private saveMemory;
    private validateGitRepository;
    private validateStringInput;
    private cleanupCache;
    private getCachedMemory;
    private setCachedMemory;
    private compressData;
    private decompressData;
    private debouncedSave;
    private setupToolHandlers;
    private handleGitStatus;
    private handleGitLog;
    private handleGitDiff;
    private handleMemoryStore;
    private handleMemoryRetrieve;
    private handleMemoryList;
    private handleMemoryDelete;
    private handleMemorySearch;
    private handleMemoryFilter;
    private handleGitAdd;
    private handleGitCommit;
    private handleGitPush;
    private handleGitPull;
    private handleGitBranch;
    private handleGitMerge;
    run(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map