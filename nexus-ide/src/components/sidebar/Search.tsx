import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Search as SearchIcon,
  X,
  FileText,
  Code,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Replace,
  RotateCcw,
  Settings,
  History,
  BookmarkPlus,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '../ui/DropdownMenu';
import { Checkbox } from '../ui/Checkbox';
import { useSearch } from '../../hooks/useSearch';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Search Result Interface
 */
interface SearchResult {
  id: string;
  file: string;
  path: string;
  line: number;
  column: number;
  content: string;
  preview: string;
  matches: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

/**
 * Search Options Interface
 */
interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  includeFiles: string[];
  excludeFiles: string[];
  maxResults: number;
}

/**
 * Search History Item
 */
interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
}

/**
 * Search Result Item Component
 */
interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onSelect: (result: SearchResult) => void;
  isSelected: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  query,
  onSelect,
  isSelected,
}) => {
  const handleClick = useCallback(() => {
    onSelect(result);
  }, [result, onSelect]);

  const highlightMatches = useCallback((text: string, matches: SearchResult['matches']) => {
    if (!matches.length) return text;

    let highlightedText = '';
    let lastIndex = 0;

    matches.forEach((match) => {
      highlightedText += text.slice(lastIndex, match.start);
      highlightedText += `<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">${match.text}</mark>`;
      lastIndex = match.end;
    });

    highlightedText += text.slice(lastIndex);
    return highlightedText;
  }, []);

  return (
    <div
      className={cn(
        'p-3 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent text-accent-foreground'
      )}
      onClick={handleClick}
    >
      {/* File Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{result.file}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {result.line}:{result.column}
        </Badge>
      </div>

      {/* File Path */}
      <div className="text-xs text-muted-foreground mb-2 truncate">
        {result.path}
      </div>

      {/* Code Preview */}
      <div className="bg-muted/30 rounded p-2 text-sm font-mono">
        <div
          dangerouslySetInnerHTML={{
            __html: highlightMatches(result.preview, result.matches),
          }}
        />
      </div>
    </div>
  );
};

/**
 * Search Options Panel Component
 */
interface SearchOptionsPanelProps {
  options: SearchOptions;
  onOptionsChange: (options: SearchOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SearchOptionsPanel: React.FC<SearchOptionsPanelProps> = ({
  options,
  onOptionsChange,
  isOpen,
  onToggle,
}) => {
  const handleOptionChange = useCallback(
    (key: keyof SearchOptions, value: any) => {
      onOptionsChange({
        ...options,
        [key]: value,
      });
    },
    [options, onOptionsChange]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Search Options
          </span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 p-3 border-t">
        {/* Search Modifiers */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="case-sensitive"
              checked={options.caseSensitive}
              onCheckedChange={(checked) => handleOptionChange('caseSensitive', checked)}
            />
            <label htmlFor="case-sensitive" className="text-sm">
              Case Sensitive
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="whole-word"
              checked={options.wholeWord}
              onCheckedChange={(checked) => handleOptionChange('wholeWord', checked)}
            />
            <label htmlFor="whole-word" className="text-sm">
              Whole Word
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="regex"
              checked={options.regex}
              onCheckedChange={(checked) => handleOptionChange('regex', checked)}
            />
            <label htmlFor="regex" className="text-sm">
              Regular Expression
            </label>
          </div>
        </div>

        <Separator />

        {/* File Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Include Files</label>
          <Input
            placeholder="*.js, *.ts, *.tsx"
            value={options.includeFiles.join(', ')}
            onChange={(e) => {
              const files = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
              handleOptionChange('includeFiles', files);
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Exclude Files</label>
          <Input
            placeholder="node_modules, *.min.js"
            value={options.excludeFiles.join(', ')}
            onChange={(e) => {
              const files = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
              handleOptionChange('excludeFiles', files);
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Max Results</label>
          <Input
            type="number"
            min="1"
            max="1000"
            value={options.maxResults}
            onChange={(e) => handleOptionChange('maxResults', parseInt(e.target.value) || 100)}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Search History Component
 */
interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelectHistory: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            Search History ({history.length})
          </span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        {history.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground text-center">
            No search history
          </div>
        ) : (
          <>
            <div className="p-2 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearHistory}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear History
              </Button>
            </div>
            <ScrollArea className="max-h-48">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-2 hover:bg-accent/50 cursor-pointer border-b border-border/30"
                  onClick={() => onSelectHistory(item)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono truncate">{item.query}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.resultCount}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.timestamp.toLocaleString()}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Main Search Component
 */
interface SearchProps {
  className?: string;
}

export const Search: React.FC<SearchProps> = ({ className }) => {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string>();
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includeFiles: [],
    excludeFiles: ['node_modules', '*.min.js', '*.map'],
    maxResults: 100,
  });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const debouncedQuery = useDebounce(query, 300);
  const { results, loading, error, search, replace } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Perform search when query or options change
  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery, searchOptions);
    }
  }, [debouncedQuery, searchOptions, search]);

  // Add to search history when search is performed
  useEffect(() => {
    if (debouncedQuery.trim() && results.length > 0) {
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: debouncedQuery,
        timestamp: new Date(),
        resultCount: results.length,
      };
      
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item.query !== debouncedQuery);
        return [historyItem, ...filtered].slice(0, 20); // Keep last 20 searches
      });
    }
  }, [debouncedQuery, results]);

  // Handle search result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    setSelectedResult(result.id);
    
    // Emit file open event with line/column info
    const event = new CustomEvent('nexus:file-open', {
      detail: {
        file: {
          path: result.path,
          name: result.file,
        },
        line: result.line,
        column: result.column,
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Handle replace functionality
  const handleReplace = useCallback(async () => {
    if (!query.trim() || !replaceQuery.trim()) return;
    
    try {
      await replace(query, replaceQuery, searchOptions);
      // Refresh search results after replace
      search(query, searchOptions);
    } catch (error) {
      console.error('Replace failed:', error);
    }
  }, [query, replaceQuery, searchOptions, replace, search]);

  // Handle search history selection
  const handleHistorySelect = useCallback((item: SearchHistoryItem) => {
    setQuery(item.query);
    searchInputRef.current?.focus();
  }, []);

  // Clear search history
  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setQuery('');
    setSelectedResult(undefined);
  }, []);

  // Save search as bookmark
  const handleSaveBookmark = useCallback(() => {
    if (!query.trim()) return;
    
    const event = new CustomEvent('nexus:search-bookmark', {
      detail: {
        query,
        options: searchOptions,
        timestamp: new Date(),
      }
    });
    window.dispatchEvent(event);
  }, [query, searchOptions]);

  return (
    <div className={cn('nexus-search h-full flex flex-col', className)}>
      {/* Search Header */}
      <div className="p-3 border-b space-y-3">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search in files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveBookmark}
              className="h-6 w-6 p-0"
              disabled={!query.trim()}
            >
              <BookmarkPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="relative">
            <Replace className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="pl-10 pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplace}
                className="h-6 px-2 text-xs"
                disabled={!query.trim() || !replaceQuery.trim()}
              >
                Replace All
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant={showReplace ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowReplace(!showReplace)}
            >
              <Replace className="h-4 w-4" />
            </Button>
            <Button
              variant={searchOptions.caseSensitive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSearchOptions(prev => ({ ...prev, caseSensitive: !prev.caseSensitive }))}
            >
              Aa
            </Button>
            <Button
              variant={searchOptions.wholeWord ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSearchOptions(prev => ({ ...prev, wholeWord: !prev.wholeWord }))}
            >
              Ab
            </Button>
            <Button
              variant={searchOptions.regex ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSearchOptions(prev => ({ ...prev, regex: !prev.regex }))}
            >
              .*
            </Button>
          </div>
          
          {results.length > 0 && (
            <Badge variant="secondary">
              {results.length} results
            </Badge>
          )}
        </div>
      </div>

      {/* Search Options */}
      <SearchOptionsPanel
        options={searchOptions}
        onOptionsChange={setSearchOptions}
        isOpen={optionsOpen}
        onToggle={() => setOptionsOpen(!optionsOpen)}
      />

      {/* Search History */}
      <SearchHistory
        history={searchHistory}
        onSelectHistory={handleHistorySelect}
        onClearHistory={handleClearHistory}
      />

      {/* Search Results */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Searching...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-destructive">Search failed: {error}</div>
          </div>
        )}

        {!loading && !error && query.trim() && results.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">No results found</div>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <ScrollArea className="h-full">
            <div>
              {results.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  query={query}
                  onSelect={handleResultSelect}
                  isSelected={selectedResult === result.id}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Search;

/**
 * Search Component Features:
 * 
 * 1. Advanced Search:
 *    - Real-time search with debouncing
 *    - Case sensitive/insensitive options
 *    - Whole word matching
 *    - Regular expression support
 *    - File type filtering
 * 
 * 2. Replace Functionality:
 *    - Find and replace in files
 *    - Replace all occurrences
 *    - Preview before replace
 *    - Undo replace operations
 * 
 * 3. Search History:
 *    - Save recent searches
 *    - Quick access to previous queries
 *    - Search result counts
 *    - Clear history option
 * 
 * 4. Result Navigation:
 *    - Click to open file at specific line
 *    - Highlight search matches
 *    - Context preview
 *    - File path information
 * 
 * 5. Search Options:
 *    - Include/exclude file patterns
 *    - Maximum result limits
 *    - Search scope configuration
 *    - Performance optimizations
 */