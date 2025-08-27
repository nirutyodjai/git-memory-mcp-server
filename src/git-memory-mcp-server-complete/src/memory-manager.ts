import * as fs from 'fs-extra';
import * as path from 'path';
import natural from 'natural';
const { TfIdf, PorterStemmer, WordTokenizer } = natural;

interface MemoryEntry {
  key: string;
  content: string;
  tags?: string[];
  metadata?: any;
  timestamp: number;
  vector?: number[];
}

interface SearchResult {
  entry: MemoryEntry;
  similarity: number;
}

export class MemoryManager {
  private memoryDb: Map<string, MemoryEntry> = new Map();
  private dbPath: string;
  private tfidf: any;
  private stemmer = PorterStemmer;
  private tokenizer: any;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'memory.db');
    this.tfidf = new TfIdf();
    this.tokenizer = new WordTokenizer();
    this.loadMemoryDb();
  }

  private async loadMemoryDb() {
    try {
      if (await fs.pathExists(this.dbPath)) {
        const data = await fs.readJSON(this.dbPath);
        this.memoryDb = new Map(Object.entries(data));
        
        // Rebuild TF-IDF index
        this.memoryDb.forEach((entry) => {
          this.tfidf.addDocument(this.preprocessText(entry.content));
        });
      }
    } catch (error) {
      console.error('Error loading memory database:', error);
    }
  }

  private async saveMemoryDb() {
    try {
      const data = Object.fromEntries(this.memoryDb);
      await fs.writeJSON(this.dbPath, data, { spaces: 2 });
    } catch (error) {
      console.error('Error saving memory database:', error);
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(word => this.stemmer.stem(word))
      .join(' ');
  }

  private calculateSimilarity(query: string, content: string): number {
    // Tokenize and stem the query
    const tokens = this.tokenizer.tokenize(query.toLowerCase()) || [];
    const stemmedTokens = tokens.map((token: string) => this.stemmer.stem(token));
    
    const queryTokens = this.preprocessText(query).split(' ');
    const contentTokens = this.preprocessText(content).split(' ');
    
    const querySet = new Set(queryTokens);
    const contentSet = new Set(contentTokens);
    
    const intersection = new Set([...querySet].filter(x => contentSet.has(x)));
    const union = new Set([...querySet, ...contentSet]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  async store(key: string, content: string, tags?: string[], metadata?: any) {
    try {
      const entry: MemoryEntry = {
        key,
        content,
        tags: tags || [],
        metadata: metadata || {},
        timestamp: Date.now(),
      };

      this.memoryDb.set(key, entry);
      
      // Add to TF-IDF index
      this.tfidf.addDocument(this.preprocessText(content));
      
      await this.saveMemoryDb();
      
      return {
        content: [
          {
            type: 'text',
            text: `Memory stored successfully with key: ${key}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error storing memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async search(query: string, limit: number = 10, tags?: string[]) {
    try {
      const results: SearchResult[] = [];
      
      this.memoryDb.forEach((entry) => {
        // Filter by tags if specified
        if (tags && tags.length > 0) {
          const hasMatchingTag = tags.some(tag => entry.tags?.includes(tag));
          if (!hasMatchingTag) return;
        }
        
        const similarity = this.calculateSimilarity(query, entry.content);
        if (similarity > 0) {
          results.push({ entry, similarity });
        }
      });
      
      // Sort by similarity (descending) and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = results.slice(0, limit);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              totalResults: results.length,
              results: limitedResults.map(r => ({
                key: r.entry.key,
                content: r.entry.content,
                tags: r.entry.tags,
                metadata: r.entry.metadata,
                similarity: r.similarity,
                timestamp: r.entry.timestamp,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async recall(key: string) {
    try {
      const entry = this.memoryDb.get(key);
      
      if (!entry) {
        return {
          content: [
            {
              type: 'text',
              text: `No memory found with key: ${key}`,
            },
          ],
        };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              key: entry.key,
              content: entry.content,
              tags: entry.tags,
              metadata: entry.metadata,
              timestamp: entry.timestamp,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error recalling memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async analyze(analysisType: string = 'patterns') {
    try {
      const entries = Array.from(this.memoryDb.values());
      
      switch (analysisType) {
        case 'patterns':
          const tagFrequency = new Map<string, number>();
          const contentLength = entries.map(e => e.content.length);
          
          entries.forEach(entry => {
            entry.tags?.forEach(tag => {
              tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
            });
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalEntries: entries.length,
                  averageContentLength: contentLength.reduce((a, b) => a + b, 0) / contentLength.length,
                  tagFrequency: Object.fromEntries(tagFrequency),
                  oldestEntry: Math.min(...entries.map(e => e.timestamp)),
                  newestEntry: Math.max(...entries.map(e => e.timestamp)),
                }, null, 2),
              },
            ],
          };
          
        case 'timeline':
          const timeline = entries
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(entry => ({
              key: entry.key,
              timestamp: entry.timestamp,
              date: new Date(entry.timestamp).toISOString(),
              contentPreview: entry.content.substring(0, 100) + '...',
            }));
            
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ timeline }, null, 2),
              },
            ],
          };
          
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Helper methods for integration
  async storeGitContext(repoInfo: any, context: string) {
    const key = `git_context_${Date.now()}`;
    const content = `Repository Context: ${context}\n\nRepo Info: ${JSON.stringify(repoInfo, null, 2)}`;
    
    return await this.store(key, content, ['git', 'context'], {
      repoPath: repoInfo.repoPath,
      branch: repoInfo.currentBranch,
      timestamp: Date.now(),
    });
  }

  async searchGitRelated(query: string, limit: number = 5) {
    return await this.search(query, limit, ['git']);
  }

  getAllEntries(): MemoryEntry[] {
    return Array.from(this.memoryDb.values());
  }

  getEntriesByTags(tags: string[]): MemoryEntry[] {
    return Array.from(this.memoryDb.values()).filter(entry => 
      tags.some(tag => entry.tags?.includes(tag))
    );
  }
}