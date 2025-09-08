export interface GitMemoryConfig {
  [key: string]: any;
}

export interface GitContext {
  filePath: string;
  branch: string;
  commitHash: string;
  [key: string]: any;
}

export interface MemoryData {
  [key: string]: any;
}

export class GitMemoryService {
  constructor(config: GitMemoryConfig, logger: any);
  
  searchMemory(options: {
    query: string;
    type?: string;
    limit?: number;
    [key: string]: any;
  }): Promise<MemoryData[]>;
  
  storeMemoryContext(
    content: string,
    type: string,
    metadata: {
      tags?: string[];
      confidence?: number;
      source?: string;
      timestamp?: number;
      [key: string]: any;
    }
  ): Promise<void>;
  
  getMemoryContexts(): Promise<MemoryData[]>;
  
  [key: string]: any;
}