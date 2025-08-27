import { GitManager } from './git-manager.js';
import { MemoryManager } from './memory-manager.js';
import natural from 'natural';
const { WordTokenizer, PorterStemmer } = natural;

export class IntegratedOperations {
  private tokenizer: any;

  constructor(
    private gitManager: GitManager,
    private memoryManager: MemoryManager
  ) {
    this.tokenizer = new WordTokenizer();
  }

  async smartCommit(repoPath?: string, userMessage?: string, addAll?: boolean) {
    try {
      // Get current repository status
      const repoInfo = await this.gitManager.getRepoInfo(repoPath);
      
      // Get diff to understand what's being committed
      const diffResult = await this.gitManager.getDiff(repoPath, false);
      const diffContent = diffResult.content[0]?.text || '';
      
      let commitMessage = userMessage;
      
      // If no user message provided, generate one using memory and context
      if (!commitMessage) {
        commitMessage = await this.generateSmartCommitMessage(repoInfo, diffContent);
      }
      
      // Store the commit context in memory for future reference
      await this.storeCommitContext(repoInfo, diffContent, commitMessage);
      
      // Perform the actual commit
      const commitResult = await this.gitManager.commit(commitMessage, repoPath, addAll);
      
      // Store successful commit in memory
      if (!commitResult.isError) {
        const commitInfo = JSON.parse(commitResult.content[0].text);
        await this.memoryManager.store(
          `commit_${commitInfo.commit}`,
          `Commit: ${commitMessage}\n\nDiff:\n${diffContent}`,
          ['git', 'commit', 'smart_commit'],
          {
            hash: commitInfo.commit,
            branch: commitInfo.branch,
            author: commitInfo.author,
            timestamp: Date.now(),
          }
        );
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              commitResult: JSON.parse(commitResult.content[0].text),
              generatedMessage: !userMessage,
              message: commitMessage,
              contextStored: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in smart commit: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async generateSmartCommitMessage(repoInfo: any, diffContent: string): Promise<string> {
    try {
      // Search for similar commits in memory
      const similarCommits = await this.memoryManager.search(
        `diff changes ${diffContent.substring(0, 200)}`,
        5,
        ['git', 'commit']
      );
      
      // Analyze the diff to understand the changes
      const changeAnalysis = this.analyzeDiffChanges(diffContent);
      
      // Generate message based on patterns and similar commits
      let message = this.generateMessageFromAnalysis(changeAnalysis);
      
      // Enhance with memory insights if available
      if (similarCommits.content[0]) {
        const memoryData = JSON.parse(similarCommits.content[0].text);
        if (memoryData.results && memoryData.results.length > 0) {
          const patterns = this.extractCommitPatterns(memoryData.results);
          message = this.enhanceMessageWithPatterns(message, patterns);
        }
      }
      
      return message;
    } catch (error) {
      // Fallback to basic analysis if memory search fails
      const changeAnalysis = this.analyzeDiffChanges(diffContent);
      return this.generateMessageFromAnalysis(changeAnalysis);
    }
  }

  private analyzeDiffChanges(diffContent: string) {
    const lines = diffContent.split('\n');
    const analysis = {
      filesChanged: new Set<string>(),
      linesAdded: 0,
      linesRemoved: 0,
      changeTypes: new Set<string>(),
    };
    
    lines.forEach(line => {
      if (line.startsWith('+++') || line.startsWith('---')) {
        const filename = line.substring(4).replace(/^[ab]\//, '');
        if (filename !== '/dev/null') {
          analysis.filesChanged.add(filename);
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        analysis.linesAdded++;
        if (line.includes('function') || line.includes('def ')) {
          analysis.changeTypes.add('function');
        }
        if (line.includes('class ')) {
          analysis.changeTypes.add('class');
        }
        if (line.includes('import ') || line.includes('require(')) {
          analysis.changeTypes.add('import');
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        analysis.linesRemoved++;
      }
    });
    
    return analysis;
  }

  private generateMessageFromAnalysis(analysis: any): string {
    const files = Array.from(analysis.filesChanged);
    const changeTypes = Array.from(analysis.changeTypes);
    
    if (files.length === 0) {
      return 'Update files';
    }
    
    let message = '';
    
    if (changeTypes.includes('function')) {
      message = 'Add/update functions';
    } else if (changeTypes.includes('class')) {
      message = 'Add/update classes';
    } else if (changeTypes.includes('import')) {
      message = 'Update imports/dependencies';
    } else if (analysis.linesAdded > analysis.linesRemoved * 2) {
      message = 'Add new features';
    } else if (analysis.linesRemoved > analysis.linesAdded * 2) {
      message = 'Remove/cleanup code';
    } else {
      message = 'Update code';
    }
    
    if (files.length === 1) {
      message += ` in ${files[0]}`;
    } else if (files.length <= 3) {
      message += ` in ${files.join(', ')}`;
    } else {
      message += ` in ${files.length} files`;
    }
    
    return message;
  }

  private extractCommitPatterns(results: any[]): any {
    const patterns = {
      commonPrefixes: new Map<string, number>(),
      commonWords: new Map<string, number>(),
    };
    
    results.forEach(result => {
      const content = result.content || '';
      const commitMatch = content.match(/Commit: (.+)/);
      if (commitMatch) {
        const message = commitMatch[1];
        const words = this.tokenizer.tokenize(message.toLowerCase()) || [];
        
        // Track common prefixes
        const firstWord = words[0];
        if (firstWord) {
          patterns.commonPrefixes.set(firstWord, (patterns.commonPrefixes.get(firstWord) || 0) + 1);
        }
        
        // Track common words
        words.forEach((word: string) => {
          if (word.length > 3) {
            patterns.commonWords.set(word, (patterns.commonWords.get(word) || 0) + 1);
          }
        });
      }
    });
    
    return patterns;
  }

  private enhanceMessageWithPatterns(message: string, patterns: any): string {
    // Find most common prefix
    const sortedPrefixes = Array.from(patterns.commonPrefixes.entries()) as [string, number][];
    sortedPrefixes.sort((a, b) => b[1] - a[1]);
    
    if (sortedPrefixes.length > 0 && sortedPrefixes[0][1] > 1) {
      const commonPrefix = sortedPrefixes[0][0];
      if (!message.toLowerCase().startsWith(commonPrefix)) {
        message = `${commonPrefix}: ${message.toLowerCase()}`;
      }
    }
    
    return message;
  }

  private async storeCommitContext(repoInfo: any, diffContent: string, commitMessage: string) {
    const context = {
      branch: repoInfo.currentBranch,
      filesChanged: repoInfo.status.modified.concat(repoInfo.status.staged),
      commitMessage,
      diffPreview: diffContent.substring(0, 500),
      timestamp: Date.now(),
    };
    
    await this.memoryManager.store(
      `commit_context_${Date.now()}`,
      JSON.stringify(context, null, 2),
      ['git', 'commit', 'context'],
      context
    );
  }

  async analyzePatterns(repoPath: string | undefined, analysisType: string) {
    try {
      const repoInfo = await this.gitManager.getRepoInfo(repoPath);
      const memoryEntries = this.memoryManager.getEntriesByTags(['git']);
      
      switch (analysisType) {
        case 'commit_patterns':
          return await this.analyzeCommitPatterns(repoInfo, memoryEntries);
        case 'branch_patterns':
          return await this.analyzeBranchPatterns(repoInfo, memoryEntries);
        case 'file_patterns':
          return await this.analyzeFilePatterns(repoInfo, memoryEntries);
        case 'author_patterns':
          return await this.analyzeAuthorPatterns(repoInfo, memoryEntries);
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing patterns: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async analyzeCommitPatterns(repoInfo: any, memoryEntries: any[]) {
    const commitMessages = repoInfo.recentCommits.map((c: any) => c.message);
    const memoryCommits = memoryEntries
      .filter(e => e.tags?.includes('commit'))
      .map(e => {
        const match = e.content.match(/Commit: (.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);
    
    const allMessages = [...commitMessages, ...memoryCommits];
    
    const patterns = {
      messageLength: {
        average: allMessages.reduce((sum, msg) => sum + msg.length, 0) / allMessages.length,
        shortest: Math.min(...allMessages.map(msg => msg.length)),
        longest: Math.max(...allMessages.map(msg => msg.length)),
      },
      commonWords: this.getWordFrequency(allMessages),
      messageTypes: this.categorizeCommitMessages(allMessages),
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ commitPatterns: patterns }, null, 2),
        },
      ],
    };
  }

  private async analyzeBranchPatterns(repoInfo: any, memoryEntries: any[]) {
    const branches = repoInfo.branches;
    const branchData = memoryEntries
      .filter(e => e.metadata?.branch)
      .map(e => e.metadata.branch);
    
    const allBranches = [...branches, ...branchData];
    const uniqueBranches = [...new Set(allBranches)];
    
    const patterns = {
      totalBranches: uniqueBranches.length,
      currentBranch: repoInfo.currentBranch,
      branchFrequency: this.getFrequency(allBranches),
      namingPatterns: this.analyzeBranchNaming(uniqueBranches),
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ branchPatterns: patterns }, null, 2),
        },
      ],
    };
  }

  private async analyzeFilePatterns(repoInfo: any, memoryEntries: any[]) {
    const modifiedFiles = [...repoInfo.status.modified, ...repoInfo.status.staged];
    const memoryFiles = memoryEntries
      .map(e => e.content.match(/\+\+\+ [ab]\/(.+)/g))
      .filter(Boolean)
      .flat()
      .map(match => match?.replace(/\+\+\+ [ab]\//, ''))
      .filter(Boolean);
    
    const allFiles = [...modifiedFiles, ...memoryFiles];
    const fileExtensions = allFiles
      .map(file => file.split('.').pop())
      .filter(Boolean);
    
    const patterns = {
      mostModifiedFiles: this.getFrequency(allFiles),
      fileExtensions: this.getFrequency(fileExtensions),
      totalUniqueFiles: new Set(allFiles).size,
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ filePatterns: patterns }, null, 2),
        },
      ],
    };
  }

  private async analyzeAuthorPatterns(repoInfo: any, memoryEntries: any[]) {
    const authors = repoInfo.recentCommits.map((c: any) => c.author_name);
    const memoryAuthors = memoryEntries
      .filter(e => e.metadata?.author)
      .map(e => e.metadata.author.name || e.metadata.author)
      .filter(Boolean);
    
    const allAuthors = [...authors, ...memoryAuthors];
    
    const patterns = {
      authorFrequency: this.getFrequency(allAuthors),
      totalAuthors: new Set(allAuthors).size,
      mostActiveAuthor: this.getMostFrequent(allAuthors),
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ authorPatterns: patterns }, null, 2),
        },
      ],
    };
  }

  async contextSearch(query: string, repoPath?: string, includeCommits: boolean = true, includeMemory: boolean = true) {
    try {
      const results: any = {
        query,
        gitResults: null,
        memoryResults: null,
        combinedInsights: [],
      };
      
      // Search Git history if requested
      if (includeCommits !== false) {
        const repoInfo = await this.gitManager.getRepoInfo(repoPath);
        const relevantCommits = repoInfo.recentCommits.filter((commit: any) => 
          commit.message.toLowerCase().includes(query.toLowerCase()) ||
          commit.author_name.toLowerCase().includes(query.toLowerCase())
        );
        results.gitResults = relevantCommits;
      }
      
      // Search memory if requested
      if (includeMemory !== false) {
        const memorySearch = await this.memoryManager.search(query, 10);
        results.memoryResults = JSON.parse(memorySearch.content[0].text);
      }
      
      // Generate combined insights
      results.combinedInsights = this.generateCombinedInsights(results.gitResults, results.memoryResults);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in context search: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private generateCombinedInsights(gitResults: any, memoryResults: any): string[] {
    const insights: string[] = [];
    
    if (gitResults && gitResults.length > 0) {
      insights.push(`Found ${gitResults.length} relevant commits in Git history`);
    }
    
    if (memoryResults && memoryResults.results && memoryResults.results.length > 0) {
      insights.push(`Found ${memoryResults.results.length} relevant memories`);
      
      const highSimilarity = memoryResults.results.filter((r: any) => r.similarity > 0.5);
      if (highSimilarity.length > 0) {
        insights.push(`${highSimilarity.length} memories have high similarity to the query`);
      }
    }
    
    return insights;
  }

  // Helper methods
  private getWordFrequency(messages: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    messages.forEach(message => {
      const words = message.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });
    });
    return frequency;
  }

  private getFrequency(items: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return frequency;
  }

  private getMostFrequent(items: string[]): string | null {
    const frequency = this.getFrequency(items);
    const entries = Object.entries(frequency);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  private categorizeCommitMessages(messages: string[]): Record<string, number> {
    const categories: Record<string, number> = {
      feature: 0,
      fix: 0,
      update: 0,
      refactor: 0,
      docs: 0,
      other: 0,
    };
    
    messages.forEach(message => {
      const lower = message.toLowerCase();
      if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) {
        categories.feature++;
      } else if (lower.includes('fix') || lower.includes('bug')) {
        categories.fix++;
      } else if (lower.includes('update') || lower.includes('change')) {
        categories.update++;
      } else if (lower.includes('refactor') || lower.includes('cleanup')) {
        categories.refactor++;
      } else if (lower.includes('doc') || lower.includes('readme')) {
        categories.docs++;
      } else {
        categories.other++;
      }
    });
    
    return categories;
  }

  private analyzeBranchNaming(branches: string[]): any {
    const patterns = {
      hasPrefix: 0,
      commonPrefixes: new Set<string>(),
      hasNumbers: 0,
      averageLength: 0,
    };
    
    branches.forEach(branch => {
      if (branch.includes('/') || branch.includes('-')) {
        patterns.hasPrefix++;
        const prefix = branch.split(/[\/\-]/)[0];
        patterns.commonPrefixes.add(prefix);
      }
      if (/\d/.test(branch)) {
        patterns.hasNumbers++;
      }
    });
    
    patterns.averageLength = branches.reduce((sum, b) => sum + b.length, 0) / branches.length;
    
    return {
      ...patterns,
      commonPrefixes: Array.from(patterns.commonPrefixes),
    };
  }
}