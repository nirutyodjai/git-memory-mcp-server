export interface SemanticMemoryConfig {
  [key: string]: any;
}

export interface SemanticSearchResult {
  content: string;
  score: number;
  metadata: {
    [key: string]: any;
  };
}

export class SemanticMemoryService {
  constructor(config: SemanticMemoryConfig, logger: any);
  
  searchMemory(options: {
    query: string;
    type?: string;
    limit?: number;
    [key: string]: any;
  }): Promise<SemanticSearchResult[]>;
  
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
  
  getMemoryContexts(): Promise<any[]>;
  
  [key: string]: any;
}