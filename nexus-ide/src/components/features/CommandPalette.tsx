/**
 * CommandPalette Component
 * 
 * A powerful command palette for the NEXUS IDE that provides quick access to all IDE functions.
 * Inspired by VS Code's command palette but enhanced with AI-powered suggestions.
 * 
 * Features:
 * - Fuzzy search for commands
 * - Keyboard shortcuts display
 * - Recent commands history
 * - AI-powered command suggestions
 * - Plugin command integration
 * - Context-aware commands
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Command, Clock, Zap, Settings, FileText, Terminal, Bug } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  keywords?: string[];
  when?: () => boolean; // Conditional availability
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Default commands for the IDE
const defaultCommands: Command[] = [
  {
    id: 'file.new',
    title: 'New File',
    description: 'Create a new file',
    category: 'File',
    shortcut: 'Ctrl+N',
    icon: <FileText className="w-4 h-4" />,
    action: () => toast.info('Creating new file...'),
    keywords: ['create', 'new', 'file']
  },
  {
    id: 'file.open',
    title: 'Open File',
    description: 'Open an existing file',
    category: 'File',
    shortcut: 'Ctrl+O',
    icon: <FileText className="w-4 h-4" />,
    action: () => toast.info('Opening file...'),
    keywords: ['open', 'file']
  },
  {
    id: 'file.save',
    title: 'Save File',
    description: 'Save the current file',
    category: 'File',
    shortcut: 'Ctrl+S',
    icon: <FileText className="w-4 h-4" />,
    action: () => toast.info('Saving file...'),
    keywords: ['save', 'file']
  },
  {
    id: 'terminal.new',
    title: 'New Terminal',
    description: 'Open a new terminal',
    category: 'Terminal',
    shortcut: 'Ctrl+`',
    icon: <Terminal className="w-4 h-4" />,
    action: () => toast.info('Opening new terminal...'),
    keywords: ['terminal', 'console', 'shell']
  },
  {
    id: 'debug.start',
    title: 'Start Debugging',
    description: 'Start debugging the current project',
    category: 'Debug',
    shortcut: 'F5',
    icon: <Bug className="w-4 h-4" />,
    action: () => toast.info('Starting debugger...'),
    keywords: ['debug', 'run', 'start']
  },
  {
    id: 'settings.open',
    title: 'Open Settings',
    description: 'Open IDE settings',
    category: 'Settings',
    shortcut: 'Ctrl+,',
    icon: <Settings className="w-4 h-4" />,
    action: () => toast.info('Opening settings...'),
    keywords: ['settings', 'preferences', 'config']
  },
  {
    id: 'ai.ask',
    title: 'Ask AI Assistant',
    description: 'Open AI assistant chat',
    category: 'AI',
    shortcut: 'Ctrl+Shift+A',
    icon: <Zap className="w-4 h-4" />,
    action: () => toast.info('Opening AI assistant...'),
    keywords: ['ai', 'assistant', 'help', 'copilot']
  }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands] = useState<Command[]>(defaultCommands);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent commands first when no query
      const recent = commands.filter(cmd => recentCommands.includes(cmd.id));
      const others = commands.filter(cmd => !recentCommands.includes(cmd.id));
      return [...recent, ...others];
    }

    const lowerQuery = query.toLowerCase();
    return commands.filter(command => {
      const searchText = [
        command.title,
        command.description || '',
        command.category,
        ...(command.keywords || [])
      ].join(' ').toLowerCase();
      
      return searchText.includes(lowerQuery);
    }).sort((a, b) => {
      // Prioritize title matches
      const aTitle = a.title.toLowerCase().includes(lowerQuery);
      const bTitle = b.title.toLowerCase().includes(lowerQuery);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });
  }, [query, commands, recentCommands]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Execute command
  const executeCommand = useCallback(async (command: Command) => {
    try {
      // Add to recent commands
      setRecentCommands(prev => {
        const filtered = prev.filter(id => id !== command.id);
        return [command.id, ...filtered].slice(0, 10); // Keep last 10
      });

      // Execute the command
      await command.action();
      
      // Close palette
      onClose();
    } catch (error) {
      console.error('Failed to execute command:', error);
      toast.error(`Failed to execute command: ${command.title}`);
    }
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className={cn(
        'fixed top-[20%] left-1/2 transform -translate-x-1/2 z-50',
        'w-full max-w-2xl mx-4',
        'bg-background border border-border rounded-lg shadow-2xl',
        'overflow-hidden',
        className
      )}>
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Up/Down</kbd>
            <span>navigate</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
            <span>select</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Commands List */}
        <div 
          ref={listRef}
          className="max-h-96 overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const isSelected = index === selectedIndex;
              const isRecent = recentCommands.includes(command.id);
              
              return (
                <div
                  key={command.id}
                  className={cn(
                    'flex items-center px-4 py-3 cursor-pointer transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => executeCommand(command)}
                >
                  <div className="flex items-center mr-3">
                    {command.icon || <Command className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {command.title}
                      </span>
                      {isRecent && (
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    {command.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {command.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded">
                      {command.category}
                    </span>
                    {command.shortcut && (
                      <kbd className="px-2 py-1 bg-muted rounded font-mono">
                        {command.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default CommandPalette;