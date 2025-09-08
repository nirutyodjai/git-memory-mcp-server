import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, DocumentIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  lastModified?: Date;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged';
  children?: FileNode[];
  isExpanded?: boolean;
  aiInsights?: {
    importance: 'high' | 'medium' | 'low';
    category: string;
    dependencies: string[];
    suggestions: string[];
  };
}

interface IntelligentFileExplorerProps {
  rootPath: string;
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
  onFileRename?: (file: FileNode, newName: string) => void;
  onFolderCreate?: (parentPath: string, folderName: string) => void;
  aiEnabled?: boolean;
  gitIntegration?: boolean;
  className?: string;
}

interface SearchResult {
  file: FileNode;
  relevanceScore: number;
  matchType: 'name' | 'content' | 'semantic';
  snippet?: string;
}

interface ProjectInsights {
  totalFiles: number;
  totalSize: string;
  languages: { [key: string]: number };
  complexity: 'low' | 'medium' | 'high';
  maintainability: number;
  testCoverage: number;
  dependencies: string[];
  recommendations: string[];
}

const IntelligentFileExplorer: React.FC<IntelligentFileExplorerProps> = ({
  rootPath,
  onFileSelect,
  onFileOpen,
  onFileDelete,
  onFileRename,
  onFolderCreate,
  aiEnabled = true,
  gitIntegration = true,
  className = ''
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectInsights, setProjectInsights] = useState<ProjectInsights | null>(null);
  const [aiOrganizing, setAiOrganizing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Load file tree
  const loadFileTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const tree = await fetchFileTree(rootPath);
      
      if (aiEnabled) {
        const enhancedTree = await enhanceTreeWithAI(tree);
        setFileTree(enhancedTree);
      } else {
        setFileTree(tree);
      }
      
      if (aiEnabled) {
        const insights = await generateProjectInsights(tree);
        setProjectInsights(insights);
      }
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setIsLoading(false);
    }
  }, [rootPath, aiEnabled]);

  // Smart search with AI
  const performSmartSearch = useCallback(debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await performAISearch(query, fileTree, aiEnabled);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, 300), [fileTree, aiEnabled]);

  // AI-powered file organization
  const organizeFilesWithAI = useCallback(async () => {
    if (!aiEnabled) return;
    
    setAiOrganizing(true);
    try {
      const organizationPlan = await generateOrganizationPlan(fileTree);
      
      // Show organization suggestions to user
      const confirmed = window.confirm(
        `AI suggests organizing files:\n${organizationPlan.suggestions.join('\n')}\n\nProceed?`
      );
      
      if (confirmed) {
        const organizedTree = await applyOrganizationPlan(fileTree, organizationPlan);
        setFileTree(organizedTree);
      }
    } catch (error) {
      console.error('AI organization failed:', error);
    } finally {
      setAiOrganizing(false);
    }
  }, [fileTree, aiEnabled]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === folderId && node.type === 'folder') {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    
    setFileTree(updateTree(fileTree));
  }, [fileTree]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileNode) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  // Handle file double-click
  const handleFileDoubleClick = useCallback((file: FileNode) => {
    if (file.type === 'file' && onFileOpen) {
      onFileOpen(file);
    } else if (file.type === 'folder') {
      toggleFolder(file.id);
    }
  }, [onFileOpen, toggleFolder]);

  // Get file icon based on extension
  const getFileIcon = useCallback((file: FileNode) => {
    if (file.type === 'folder') {
      return <FolderIcon className="w-4 h-4 text-blue-500" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconColor = getFileIconColor(extension);
    
    return <DocumentIcon className={`w-4 h-4 ${iconColor}`} />;
  }, []);

  // Get git status indicator
  const getGitStatusIndicator = useCallback((file: FileNode) => {
    if (!gitIntegration || !file.gitStatus) return null;
    
    const statusColors = {
      modified: 'bg-yellow-500',
      added: 'bg-green-500',
      deleted: 'bg-red-500',
      untracked: 'bg-gray-500',
      staged: 'bg-blue-500'
    };
    
    return (
      <div 
        className={`w-2 h-2 rounded-full ${statusColors[file.gitStatus]}`}
        title={`Git: ${file.gitStatus}`}
      />
    );
  }, [gitIntegration]);

  // Render file tree node
  const renderFileNode = useCallback((node: FileNode, depth: number = 0) => {
    const isSelected = selectedFile?.id === node.id;
    const paddingLeft = depth * 20 + 8;
    
    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          style={{ paddingLeft }}
          onClick={() => handleFileSelect(node)}
          onDoubleClick={() => handleFileDoubleClick(node)}
        >
          {node.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {node.isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </button>
          )}
          
          {getFileIcon(node)}
          
          <span className="ml-2 text-sm truncate flex-1">{node.name}</span>
          
          {/* AI Insights Indicator */}
          {aiEnabled && node.aiInsights && (
            <div className="flex items-center space-x-1">
              {node.aiInsights.importance === 'high' && (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="High importance" />
              )}
              <SparklesIcon className="w-3 h-3 text-purple-500" title="AI insights available" />
            </div>
          )}
          
          {/* Git Status */}
          {getGitStatusIndicator(node)}
        </div>
        
        {/* Render children if expanded */}
        {node.type === 'folder' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [selectedFile, handleFileSelect, handleFileDoubleClick, toggleFolder, getFileIcon, getGitStatusIndicator, aiEnabled]);

  // Render search results
  const renderSearchResults = useCallback(() => {
    if (searchResults.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          {searchQuery ? 'No results found' : 'Start typing to search...'}
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {searchResults.map((result, index) => (
          <div
            key={`${result.file.id}-${index}`}
            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => handleFileSelect(result.file)}
            onDoubleClick={() => handleFileDoubleClick(result.file)}
          >
            {getFileIcon(result.file)}
            <div className="ml-2 flex-1">
              <div className="text-sm font-medium">{result.file.name}</div>
              <div className="text-xs text-gray-500">{result.file.path}</div>
              {result.snippet && (
                <div className="text-xs text-gray-400 mt-1">{result.snippet}</div>
              )}
            </div>
            <div className="text-xs text-blue-500">
              {Math.round(result.relevanceScore * 100)}%
            </div>
          </div>
        ))}
      </div>
    );
  }, [searchResults, searchQuery, handleFileSelect, handleFileDoubleClick, getFileIcon]);

  // Initialize
  useEffect(() => {
    loadFileTree();
  }, [loadFileTree]);

  // Handle search
  useEffect(() => {
    performSmartSearch(searchQuery);
  }, [searchQuery, performSmartSearch]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            File Explorer
          </h3>
          
          {aiEnabled && (
            <div className="flex space-x-1">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="p-1 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900 rounded"
                title="Project Insights"
              >
                <SparklesIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={organizeFilesWithAI}
                disabled={aiOrganizing}
                className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded disabled:opacity-50"
                title="AI Organization"
              >
                {aiOrganizing ? '🤖' : '📁'}
              </button>
            </div>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={aiEnabled ? "Smart search (AI-powered)..." : "Search files..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Project Insights */}
      {showInsights && projectInsights && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-700">
          <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
            🤖 AI Project Insights
          </h4>
          <div className="space-y-1 text-xs text-purple-800 dark:text-purple-200">
            <div>Files: {projectInsights.totalFiles} | Size: {projectInsights.totalSize}</div>
            <div>Complexity: {projectInsights.complexity} | Maintainability: {projectInsights.maintainability}%</div>
            <div>Test Coverage: {projectInsights.testCoverage}%</div>
            {projectInsights.recommendations.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Recommendations:</div>
                {projectInsights.recommendations.slice(0, 2).map((rec, i) => (
                  <div key={i} className="ml-2">• {rec}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading...
          </div>
        ) : searchQuery ? (
          renderSearchResults()
        ) : (
          <div>
            {fileTree.map(node => renderFileNode(node))}
          </div>
        )}
      </div>
      
      {/* Selected File Info */}
      {selectedFile && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="font-semibold">{selectedFile.name}</div>
            <div>{selectedFile.path}</div>
            {selectedFile.size && (
              <div>Size: {formatFileSize(selectedFile.size)}</div>
            )}
            {selectedFile.lastModified && (
              <div>Modified: {selectedFile.lastModified.toLocaleDateString()}</div>
            )}
            {selectedFile.aiInsights && (
              <div className="mt-2 text-purple-600 dark:text-purple-400">
                <div>🤖 AI Category: {selectedFile.aiInsights.category}</div>
                <div>Importance: {selectedFile.aiInsights.importance}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Functions
function getFileIconColor(extension?: string): string {
  const colorMap: { [key: string]: string } = {
    'js': 'text-yellow-500',
    'ts': 'text-blue-500',
    'jsx': 'text-cyan-500',
    'tsx': 'text-cyan-600',
    'html': 'text-orange-500',
    'css': 'text-blue-400',
    'scss': 'text-pink-500',
    'json': 'text-green-500',
    'md': 'text-gray-600',
    'py': 'text-green-600',
    'java': 'text-red-500',
    'cpp': 'text-blue-600',
    'c': 'text-blue-700',
    'go': 'text-cyan-400',
    'rs': 'text-orange-600',
    'php': 'text-purple-500',
    'rb': 'text-red-400',
    'swift': 'text-orange-500',
    'kt': 'text-purple-600'
  };
  
  return colorMap[extension || ''] || 'text-gray-500';
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Mock AI Functions (In real implementation, these would call actual AI services)
async function fetchFileTree(rootPath: string): Promise<FileNode[]> {
  // Mock file tree data
  return [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: '/src',
      isExpanded: true,
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          isExpanded: false,
          children: [
            {
              id: '3',
              name: 'Button.tsx',
              type: 'file',
              path: '/src/components/Button.tsx',
              size: 1024,
              lastModified: new Date(),
              gitStatus: 'modified'
            }
          ]
        },
        {
          id: '4',
          name: 'utils',
          type: 'folder',
          path: '/src/utils',
          isExpanded: false,
          children: []
        }
      ]
    }
  ];
}

async function enhanceTreeWithAI(tree: FileNode[]): Promise<FileNode[]> {
  // Mock AI enhancement
  const enhanceNode = (node: FileNode): FileNode => {
    const enhanced = { ...node };
    
    if (node.type === 'file') {
      enhanced.aiInsights = {
        importance: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        category: getCategoryFromFileName(node.name),
        dependencies: [],
        suggestions: ['Consider adding tests', 'Could be optimized']
      };
    }
    
    if (node.children) {
      enhanced.children = node.children.map(enhanceNode);
    }
    
    return enhanced;
  };
  
  return tree.map(enhanceNode);
}

async function generateProjectInsights(tree: FileNode[]): Promise<ProjectInsights> {
  // Mock project insights
  return {
    totalFiles: 42,
    totalSize: '2.3 MB',
    languages: {
      'TypeScript': 65,
      'JavaScript': 25,
      'CSS': 10
    },
    complexity: 'medium',
    maintainability: 85,
    testCoverage: 72,
    dependencies: ['react', 'typescript', 'tailwindcss'],
    recommendations: [
      'Add more unit tests for utility functions',
      'Consider splitting large components',
      'Update outdated dependencies'
    ]
  };
}

async function performAISearch(query: string, tree: FileNode[], aiEnabled: boolean): Promise<SearchResult[]> {
  // Mock AI search
  const results: SearchResult[] = [];
  
  const searchNode = (node: FileNode) => {
    if (node.name.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        file: node,
        relevanceScore: Math.random(),
        matchType: 'name',
        snippet: `Found "${query}" in ${node.name}`
      });
    }
    
    if (node.children) {
      node.children.forEach(searchNode);
    }
  };
  
  tree.forEach(searchNode);
  
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function generateOrganizationPlan(tree: FileNode[]) {
  // Mock organization plan
  return {
    suggestions: [
      'Move utility files to /src/utils',
      'Group components by feature',
      'Create separate folder for types'
    ],
    actions: []
  };
}

async function applyOrganizationPlan(tree: FileNode[], plan: any): Promise<FileNode[]> {
  // Mock organization application
  return tree;
}

function getCategoryFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const categoryMap: { [key: string]: string } = {
    'tsx': 'React Component',
    'ts': 'TypeScript',
    'js': 'JavaScript',
    'css': 'Stylesheet',
    'json': 'Configuration',
    'md': 'Documentation',
    'test.ts': 'Test File',
    'spec.ts': 'Test File'
  };
  
  return categoryMap[extension || ''] || 'Unknown';
}

export default IntelligentFileExplorer;
export type { FileNode, IntelligentFileExplorerProps, SearchResult, ProjectInsights };