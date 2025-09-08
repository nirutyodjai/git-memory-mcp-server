import { useState, useCallback } from 'react';
import { useAiServices } from './useAiServices';

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  gitStatus?: string;
}

export const useFileExplorer = (initialPath: string) => {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const { searchResults, performSearch, isLoading: isAiSearchLoading } = useAiServices();

  const fetchInitialTree = useCallback(async () => {
    // In a real application, you would fetch this from a backend API
    // For now, we'll use a mock structure.
    const mockTree: FileNode = {
      path: 'd:/Ai Server/git-memory-mcp-server/nexus-ide/src',
      name: 'src',
      type: 'directory',
      children: [
        { path: 'd:/Ai Server/git-memory-mcp-server/nexus-ide/src/components', name: 'components', type: 'directory' },
        { path: 'd:/Ai Server/git-memory-mcp-server/nexus-ide/src/hooks', name: 'hooks', type: 'directory' },
        { path: 'd:/Ai Server/git-memory-mcp-server/nexus-ide/src/App.tsx', name: 'App.tsx', type: 'file', gitStatus: 'M' },
      ],
    };
    setTree(mockTree);
    setExpandedDirs(new Set([mockTree.path]));
  }, []);


  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
        // Here you would fetch the directory content if it's not already loaded
      }
      return newSet;
    });
  };

  const handleFileClick = (path: string) => {
    setActiveFile(path);
    // Here you would typically open the file in the editor
    console.log(`Opening file: ${path}`);
  };

  const handleSearch = async (query: string) => {
    if (query.length > 2) {
      await performSearch(query);
    }
  };

  return {
    tree,
    expandedDirs,
    activeFile,
    isAiSearchLoading,
    searchResults,
    fetchInitialTree,
    toggleDirectory,
    handleFileClick,
    handleSearch,
  };
};