import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import {
  Search,
  Command,
  FileText,
  Folder,
  Settings,
  Palette,
  Play,
  Bug,
  GitBranch,
  Terminal,
  Brain,
  Zap,
  Clock,
  Star,
  Hash,
  ArrowRight,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  Code,
  Database,
  Globe,
  Package,
  Users,
  BookOpen,
  Lightbulb,
  Target,
  Filter,
  SortAsc,
  History,
  Bookmark,
  Tag,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Scissors,
  Clipboard,
  Save,
  FolderOpen,
  FileSearch,
  Replace,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Square,
  MoreHorizontal,
} from 'lucide-react';

// Command types
interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void | Promise<void>;
  keywords?: string[];
  priority?: number;
  isRecent?: boolean;
  isFavorite?: boolean;
  isDisabled?: boolean;
  badge?: string;
  group?: string;
}

type CommandCategory = 
  | 'file'
  | 'edit'
  | 'view'
  | 'search'
  | 'debug'
  | 'terminal'
  | 'git'
  | 'ai'
  | 'settings'
  | 'navigation'
  | 'workspace'
  | 'help'
  | 'recent'
  | 'favorites';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialCategory?: CommandCategory;
}

interface CommandGroup {
  category: CommandCategory;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  initialCategory,
}) => {
  const { actualTheme, setTheme, applyPreset } = useTheme();
  const { servers, sendMessage } = useMCP();
  const { shortcuts, executeShortcut } = useKeyboardShortcuts();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | 'all'>(
    initialCategory || 'all'
  );
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [favoriteCommands, setFavoriteCommands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Command[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'alphabetical' | 'recent' | 'category'>('relevance');

  // Define all available commands
  const allCommands = useMemo<Command[]>(() => [
    // File Commands
    {
      id: 'file.new',
      title: 'New File',
      description: 'Create a new file',
      category: 'file',
      icon: FileText,
      shortcut: 'Ctrl+N',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:file-new'));
        onClose();
      },
      keywords: ['create', 'new', 'file'],
      priority: 10,
    },
    {
      id: 'file.open',
      title: 'Open File',
      description: 'Open an existing file',
      category: 'file',
      icon: FolderOpen,
      shortcut: 'Ctrl+O',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:file-open'));
        onClose();
      },
      keywords: ['open', 'file', 'browse'],
      priority: 10,
    },
    {
      id: 'file.save',
      title: 'Save File',
      description: 'Save the current file',
      category: 'file',
      icon: Save,
      shortcut: 'Ctrl+S',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:file-save'));
        onClose();
      },
      keywords: ['save', 'file'],
      priority: 9,
    },
    {
      id: 'file.save-as',
      title: 'Save As',
      description: 'Save the current file with a new name',
      category: 'file',
      icon: Save,
      shortcut: 'Ctrl+Shift+S',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:file-save-as'));
        onClose();
      },
      keywords: ['save', 'as', 'file', 'rename'],
      priority: 8,
    },
    {
      id: 'file.close',
      title: 'Close File',
      description: 'Close the current file',
      category: 'file',
      icon: X,
      shortcut: 'Ctrl+W',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:file-close'));
        onClose();
      },
      keywords: ['close', 'file'],
      priority: 7,
    },

    // Edit Commands
    {
      id: 'edit.copy',
      title: 'Copy',
      description: 'Copy selected text',
      category: 'edit',
      icon: Copy,
      shortcut: 'Ctrl+C',
      action: () => {
        document.execCommand('copy');
        onClose();
      },
      keywords: ['copy', 'clipboard'],
      priority: 9,
    },
    {
      id: 'edit.cut',
      title: 'Cut',
      description: 'Cut selected text',
      category: 'edit',
      icon: Scissors,
      shortcut: 'Ctrl+X',
      action: () => {
        document.execCommand('cut');
        onClose();
      },
      keywords: ['cut', 'clipboard'],
      priority: 9,
    },
    {
      id: 'edit.paste',
      title: 'Paste',
      description: 'Paste from clipboard',
      category: 'edit',
      icon: Clipboard,
      shortcut: 'Ctrl+V',
      action: () => {
        document.execCommand('paste');
        onClose();
      },
      keywords: ['paste', 'clipboard'],
      priority: 9,
    },
    {
      id: 'edit.undo',
      title: 'Undo',
      description: 'Undo last action',
      category: 'edit',
      icon: RotateCcw,
      shortcut: 'Ctrl+Z',
      action: () => {
        document.execCommand('undo');
        onClose();
      },
      keywords: ['undo', 'revert'],
      priority: 8,
    },
    {
      id: 'edit.redo',
      title: 'Redo',
      description: 'Redo last undone action',
      category: 'edit',
      icon: RotateCw,
      shortcut: 'Ctrl+Y',
      action: () => {
        document.execCommand('redo');
        onClose();
      },
      keywords: ['redo', 'repeat'],
      priority: 8,
    },

    // Search Commands
    {
      id: 'search.find',
      title: 'Find',
      description: 'Find text in current file',
      category: 'search',
      icon: Search,
      shortcut: 'Ctrl+F',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:search-find'));
        onClose();
      },
      keywords: ['find', 'search', 'locate'],
      priority: 10,
    },
    {
      id: 'search.replace',
      title: 'Find and Replace',
      description: 'Find and replace text in current file',
      category: 'search',
      icon: Replace,
      shortcut: 'Ctrl+H',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:search-replace'));
        onClose();
      },
      keywords: ['find', 'replace', 'substitute'],
      priority: 9,
    },
    {
      id: 'search.files',
      title: 'Search in Files',
      description: 'Search across all files in workspace',
      category: 'search',
      icon: FileSearch,
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:search-files'));
        onClose();
      },
      keywords: ['search', 'files', 'global', 'workspace'],
      priority: 9,
    },

    // View Commands
    {
      id: 'view.command-palette',
      title: 'Command Palette',
      description: 'Show command palette',
      category: 'view',
      icon: Command,
      shortcut: 'Ctrl+Shift+P',
      action: () => {
        // Already open, just close
        onClose();
      },
      keywords: ['command', 'palette', 'commands'],
      priority: 10,
    },
    {
      id: 'view.explorer',
      title: 'Toggle Explorer',
      description: 'Show/hide file explorer',
      category: 'view',
      icon: Folder,
      shortcut: 'Ctrl+Shift+E',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:toggle-explorer'));
        onClose();
      },
      keywords: ['explorer', 'files', 'sidebar'],
      priority: 9,
    },
    {
      id: 'view.terminal',
      title: 'Toggle Terminal',
      description: 'Show/hide integrated terminal',
      category: 'view',
      icon: Terminal,
      shortcut: 'Ctrl+`',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:toggle-terminal'));
        onClose();
      },
      keywords: ['terminal', 'console', 'shell'],
      priority: 9,
    },
    {
      id: 'view.fullscreen',
      title: 'Toggle Fullscreen',
      description: 'Enter/exit fullscreen mode',
      category: 'view',
      icon: Maximize,
      shortcut: 'F11',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        onClose();
      },
      keywords: ['fullscreen', 'maximize', 'expand'],
      priority: 7,
    },

    // Terminal Commands
    {
      id: 'terminal.new',
      title: 'New Terminal',
      description: 'Create a new terminal session',
      category: 'terminal',
      icon: Terminal,
      shortcut: 'Ctrl+Shift+`',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:terminal-new'));
        onClose();
      },
      keywords: ['terminal', 'new', 'session'],
      priority: 9,
    },
    {
      id: 'terminal.clear',
      title: 'Clear Terminal',
      description: 'Clear terminal output',
      category: 'terminal',
      icon: RefreshCw,
      shortcut: 'Ctrl+L',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:terminal-clear'));
        onClose();
      },
      keywords: ['terminal', 'clear', 'clean'],
      priority: 8,
    },

    // Git Commands
    {
      id: 'git.status',
      title: 'Git Status',
      description: 'Show git repository status',
      category: 'git',
      icon: GitBranch,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:git-status'));
        onClose();
      },
      keywords: ['git', 'status', 'repository'],
      priority: 9,
    },
    {
      id: 'git.commit',
      title: 'Git Commit',
      description: 'Commit changes to git',
      category: 'git',
      icon: GitBranch,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:git-commit'));
        onClose();
      },
      keywords: ['git', 'commit', 'save'],
      priority: 9,
    },
    {
      id: 'git.push',
      title: 'Git Push',
      description: 'Push changes to remote repository',
      category: 'git',
      icon: Upload,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:git-push'));
        onClose();
      },
      keywords: ['git', 'push', 'upload', 'remote'],
      priority: 8,
    },
    {
      id: 'git.pull',
      title: 'Git Pull',
      description: 'Pull changes from remote repository',
      category: 'git',
      icon: Download,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:git-pull'));
        onClose();
      },
      keywords: ['git', 'pull', 'download', 'remote'],
      priority: 8,
    },

    // AI Commands
    {
      id: 'ai.chat',
      title: 'AI Chat',
      description: 'Open AI assistant chat',
      category: 'ai',
      icon: Brain,
      shortcut: 'Ctrl+Shift+A',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:ai-chat'));
        onClose();
      },
      keywords: ['ai', 'assistant', 'chat', 'help'],
      priority: 10,
    },
    {
      id: 'ai.explain',
      title: 'Explain Code',
      description: 'Ask AI to explain selected code',
      category: 'ai',
      icon: Lightbulb,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:ai-explain'));
        onClose();
      },
      keywords: ['ai', 'explain', 'code', 'understand'],
      priority: 9,
    },
    {
      id: 'ai.optimize',
      title: 'Optimize Code',
      description: 'Ask AI to optimize selected code',
      category: 'ai',
      icon: Zap,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:ai-optimize'));
        onClose();
      },
      keywords: ['ai', 'optimize', 'improve', 'performance'],
      priority: 9,
    },
    {
      id: 'ai.generate',
      title: 'Generate Code',
      description: 'Generate code with AI',
      category: 'ai',
      icon: Sparkles,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:ai-generate'));
        onClose();
      },
      keywords: ['ai', 'generate', 'create', 'code'],
      priority: 9,
    },
    {
      id: 'ai.review',
      title: 'Code Review',
      description: 'Ask AI to review code',
      category: 'ai',
      icon: Eye,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:ai-review'));
        onClose();
      },
      keywords: ['ai', 'review', 'check', 'quality'],
      priority: 8,
    },

    // Debug Commands
    {
      id: 'debug.start',
      title: 'Start Debugging',
      description: 'Start debugging session',
      category: 'debug',
      icon: Play,
      shortcut: 'F5',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:debug-start'));
        onClose();
      },
      keywords: ['debug', 'start', 'run'],
      priority: 9,
    },
    {
      id: 'debug.stop',
      title: 'Stop Debugging',
      description: 'Stop debugging session',
      category: 'debug',
      icon: Square,
      shortcut: 'Shift+F5',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:debug-stop'));
        onClose();
      },
      keywords: ['debug', 'stop', 'end'],
      priority: 8,
    },
    {
      id: 'debug.toggle-breakpoint',
      title: 'Toggle Breakpoint',
      description: 'Toggle breakpoint on current line',
      category: 'debug',
      icon: Bug,
      shortcut: 'F9',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:debug-toggle-breakpoint'));
        onClose();
      },
      keywords: ['debug', 'breakpoint', 'toggle'],
      priority: 8,
    },

    // Settings Commands
    {
      id: 'settings.open',
      title: 'Open Settings',
      description: 'Open IDE settings',
      category: 'settings',
      icon: Settings,
      shortcut: 'Ctrl+,',
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:settings-open'));
        onClose();
      },
      keywords: ['settings', 'preferences', 'config'],
      priority: 9,
    },
    {
      id: 'settings.theme',
      title: 'Change Theme',
      description: 'Switch between light and dark theme',
      category: 'settings',
      icon: Palette,
      action: () => {
        setTheme(actualTheme === 'dark' ? 'light' : 'dark');
        onClose();
      },
      keywords: ['theme', 'dark', 'light', 'appearance'],
      priority: 8,
    },
    {
      id: 'settings.shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View and edit keyboard shortcuts',
      category: 'settings',
      icon: Command,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:settings-shortcuts'));
        onClose();
      },
      keywords: ['shortcuts', 'keyboard', 'hotkeys'],
      priority: 8,
    },

    // Help Commands
    {
      id: 'help.docs',
      title: 'Documentation',
      description: 'Open NEXUS IDE documentation',
      category: 'help',
      icon: BookOpen,
      action: () => {
        window.open('https://nexus-ide.dev/docs', '_blank');
        onClose();
      },
      keywords: ['help', 'docs', 'documentation', 'guide'],
      priority: 8,
    },
    {
      id: 'help.shortcuts',
      title: 'Keyboard Shortcuts Help',
      description: 'Show keyboard shortcuts reference',
      category: 'help',
      icon: Command,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:help-shortcuts'));
        onClose();
      },
      keywords: ['help', 'shortcuts', 'keyboard', 'reference'],
      priority: 7,
    },
    {
      id: 'help.about',
      title: 'About NEXUS IDE',
      description: 'Show information about NEXUS IDE',
      category: 'help',
      icon: Target,
      action: () => {
        window.dispatchEvent(new CustomEvent('nexus:help-about'));
        onClose();
      },
      keywords: ['help', 'about', 'version', 'info'],
      priority: 6,
    },
  ], [actualTheme, setTheme, onClose]);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    let commands = allCommands;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'recent') {
        commands = commands.filter(cmd => recentCommands.includes(cmd.id));
      } else if (selectedCategory === 'favorites') {
        commands = commands.filter(cmd => favoriteCommands.includes(cmd.id));
      } else {
        commands = commands.filter(cmd => cmd.category === selectedCategory);
      }
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      commands = commands.filter(cmd => {
        const searchText = [
          cmd.title,
          cmd.description || '',
          ...(cmd.keywords || []),
          cmd.category,
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchText.includes(term));
      });
    }

    // Sort commands
    switch (sortBy) {
      case 'alphabetical':
        commands.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'recent':
        commands.sort((a, b) => {
          const aIndex = recentCommands.indexOf(a.id);
          const bIndex = recentCommands.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        break;
      case 'category':
        commands.sort((a, b) => {
          if (a.category === b.category) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return a.category.localeCompare(b.category);
        });
        break;
      default: // relevance
        commands.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        break;
    }

    // Add AI suggestions if available
    if (aiSuggestions.length > 0 && query.trim()) {
      commands = [...aiSuggestions, ...commands];
    }

    return commands;
  }, [allCommands, selectedCategory, query, sortBy, recentCommands, favoriteCommands, aiSuggestions]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandGroup> = {};
    
    filteredCommands.forEach(command => {
      const category = command.category;
      if (!groups[category]) {
        groups[category] = {
          category,
          title: getCategoryTitle(category),
          icon: getCategoryIcon(category),
          commands: [],
        };
      }
      groups[category].commands.push(command);
    });
    
    return Object.values(groups);
  }, [filteredCommands]);

  // Get category title
  const getCategoryTitle = (category: CommandCategory): string => {
    const titles: Record<CommandCategory, string> = {
      file: 'File',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      debug: 'Debug',
      terminal: 'Terminal',
      git: 'Git',
      ai: 'AI Assistant',
      settings: 'Settings',
      navigation: 'Navigation',
      workspace: 'Workspace',
      help: 'Help',
      recent: 'Recent',
      favorites: 'Favorites',
    };
    return titles[category] || category;
  };

  // Get category icon
  const getCategoryIcon = (category: CommandCategory) => {
    const icons: Record<CommandCategory, React.ComponentType<{ className?: string }>> = {
      file: FileText,
      edit: Scissors,
      view: Eye,
      search: Search,
      debug: Bug,
      terminal: Terminal,
      git: GitBranch,
      ai: Brain,
      settings: Settings,
      navigation: ArrowRight,
      workspace: Folder,
      help: BookOpen,
      recent: Clock,
      favorites: Star,
    };
    return icons[category] || Command;
  };

  // Handle command execution
  const executeCommand = useCallback(async (command: Command) => {
    try {
      setIsLoading(true);
      
      // Add to recent commands
      setRecentCommands(prev => {
        const filtered = prev.filter(id => id !== command.id);
        return [command.id, ...filtered].slice(0, 10);
      });
      
      // Execute the command
      await command.action();
      
      // Send analytics
      sendMessage('analytics-command-executed', {
        commandId: command.id,
        category: command.category,
        timestamp: new Date().toISOString(),
      }).catch(console.error);
      
    } catch (error) {
      console.error('Command execution error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
        
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
        
      case 'Tab':
        event.preventDefault();
        setShowCategories(!showCategories);
        break;
    }
  }, [filteredCommands, selectedIndex, executeCommand, onClose, showCategories]);

  // Get AI suggestions
  const getAISuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setAiSuggestions([]);
      return;
    }

    try {
      const response = await sendMessage('ai-command-suggestions', {
        query: searchQuery,
        context: {
          availableCommands: allCommands.map(cmd => ({
            id: cmd.id,
            title: cmd.title,
            category: cmd.category,
            keywords: cmd.keywords,
          })),
          recentCommands,
          favoriteCommands,
        },
      });

      if (response.suggestions) {
        const suggestions: Command[] = response.suggestions.map((suggestion: any) => ({
          id: `ai-suggestion-${Date.now()}-${Math.random()}`,
          title: suggestion.title,
          description: suggestion.description,
          category: 'ai' as CommandCategory,
          icon: Sparkles,
          action: async () => {
            if (suggestion.commandId) {
              const originalCommand = allCommands.find(cmd => cmd.id === suggestion.commandId);
              if (originalCommand) {
                await originalCommand.action();
              }
            } else if (suggestion.action) {
              // Execute custom AI action
              window.dispatchEvent(new CustomEvent('nexus:ai-custom-action', {
                detail: suggestion.action,
              }));
            }
            onClose();
          },
          keywords: suggestion.keywords || [],
          priority: 15, // Higher priority for AI suggestions
          badge: 'AI',
        }));
        
        setAiSuggestions(suggestions);
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
      setAiSuggestions([]);
    }
  }, [allCommands, recentCommands, favoriteCommands, sendMessage, onClose]);

  // Debounced AI suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getAISuggestions(query);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [query, getAISuggestions]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setSelectedCategory(initialCategory || 'all');
      setAiSuggestions([]);
      setShowCategories(false);
    }
  }, [isOpen, initialQuery, initialCategory]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  // Toggle favorite command
  const toggleFavorite = useCallback((commandId: string) => {
    setFavoriteCommands(prev => {
      if (prev.includes(commandId)) {
        return prev.filter(id => id !== commandId);
      } else {
        return [...prev, commandId];
      }
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-border">
          <Command className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder-muted-foreground"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mr-2" />
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center px-4 py-2 bg-muted/30 border-b border-border overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-md text-sm whitespace-nowrap mr-2 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            All
          </button>
          {['recent', 'favorites', 'file', 'edit', 'view', 'search', 'ai', 'terminal', 'git', 'debug', 'settings'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as CommandCategory | 'all')}
              className={`px-3 py-1 rounded-md text-sm whitespace-nowrap mr-2 transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {getCategoryTitle(category as CommandCategory)}
            </button>
          ))}
        </div>

        {/* Commands List */}
        <div 
          ref={listRef}
          className="max-h-96 overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mb-2" />
              <p>No commands found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon || Command;
              const isSelected = index === selectedIndex;
              const isFavorite = favoriteCommands.includes(command.id);
              
              return (
                <div
                  key={command.id}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => executeCommand(command)}
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium truncate">{command.title}</span>
                      {command.badge && (
                        <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                          {command.badge}
                        </span>
                      )}
                    </div>
                    {command.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {command.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {command.shortcut && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {command.shortcut}
                      </span>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(command.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isFavorite
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Up/Down Navigate</span>
                <span>Enter Execute</span>
            <span>Tab Categories</span>
            <span>Esc Close</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border border-border rounded px-2 py-1 text-xs"
            >
              <option value="relevance">Relevance</option>
              <option value="alphabetical">A-Z</option>
              <option value="recent">Recent</option>
              <option value="category">Category</option>
            </select>
            
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

// Command palette utilities
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [initialCategory, setInitialCategory] = useState<CommandCategory | undefined>();

  const open = useCallback((query?: string, category?: CommandCategory) => {
    setInitialQuery(query || '');
    setInitialCategory(category);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInitialQuery('');
    setInitialCategory(undefined);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    initialQuery,
    initialCategory,
  };
};

// Export command palette component with display name
CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
export type { Command, CommandCategory, CommandPaletteProps };