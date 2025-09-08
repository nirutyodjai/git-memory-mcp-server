import { useState, useCallback } from 'react';
import { mcpApiService } from '@/services/mcpApiService';
import { FileTree } from '@/types';

export const useAiServices = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semanticSearch = useCallback(async (query: string): Promise<FileTree[]> => {
    setIsSearching(true);
    setError(null);
    try {
      // This will be replaced with a real API call to the MCP server
      const results = await mcpApiService.semanticSearch(query);
      return results;
    } catch (err) {
      setError('Failed to perform semantic search.');
      console.error(err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    isSearching,
    semanticSearch,
    error,
  };
};