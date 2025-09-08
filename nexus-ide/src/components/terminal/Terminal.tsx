import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  Clipboard,
  RotateCcw,
  Play,
  Square,
  Pause,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Brain,
  History,
  Command,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Split,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

// Terminal types
interface TerminalSession {
  id: string;
  title: string;
  shell: string;
  cwd: string;
  isActive: boolean;
  isRunning: boolean;
  pid?: number;
  output: TerminalOutput[];
  history: string[];
  historyIndex: number;
  environment: Record<string, string>;
  createdAt: Date;
  lastActivity: Date;
}

interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
  command?: string;
  exitCode?: number;
}

interface TerminalProps {
  className?: string;
  initialSessions?: TerminalSession[];
}

interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light' | 'auto';
  shell: string;
  scrollback: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  bellSound: boolean;
  rightClickSelectsWord: boolean;
  copyOnSelect: boolean;
  pasteOnRightClick: boolean;
  confirmOnExit: boolean;
  closeOnExit: boolean;
  showWelcomeMessage: boolean;
  enableAI: boolean;
  enableAutoComplete: boolean;
  enableSyntaxHighlighting: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ className = '', initialSessions = [] }) => {
  const { actualTheme } = useTheme();
  const { servers, sendMessage } = useMCP();
  const { executeShortcut } = useKeyboardShortcuts();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const [sessions, setSessions] = useState<TerminalSession[]>(() => {
    if (initialSessions.length > 0) {
      return initialSessions;
    }
    
    // Create default session
    const defaultSession: TerminalSession = {
      id: 'default',
      title: 'Terminal',
      shell: 'bash',
      cwd: '/',
      isActive: true,
      isRunning: false,
      output: [
        {
          id: 'welcome',
          type: 'system',
          content: `Welcome to NEXUS IDE Terminal\n\nEnhanced terminal with AI assistance\nType 'help' for available commands\nUse 'ai <query>' for AI assistance\n\nHappy coding!\n`,
          timestamp: new Date(),
        },
      ],
      history: [],
      historyIndex: -1,
      environment: {},
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    
    return [defaultSession];
  });
  
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return sessions.find(s => s.isActive)?.id || sessions[0]?.id || 'default';
  });
  
  const [currentInput, setCurrentInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  
  const [settings, setSettings] = useState<TerminalSettings>({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    theme: 'auto',
    shell: 'bash',
    scrollback: 1000,
    cursorStyle: 'block',
    cursorBlink: true,
    bellSound: false,
    rightClickSelectsWord: true,
    copyOnSelect: false,
    pasteOnRightClick: true,
    confirmOnExit: true,
    closeOnExit: false,
    showWelcomeMessage: true,
    enableAI: true,
    enableAutoComplete: true,
    enableSyntaxHighlighting: true,
  });

  // Get active session
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeSession?.output]);

  // Focus input when terminal is clicked
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const terminalElement = terminalRef.current;
    if (terminalElement) {
      terminalElement.addEventListener('click', handleClick);
      return () => terminalElement.removeEventListener('click', handleClick);
    }
  }, []);

  // Handle command execution
  const executeCommand = useCallback(async (command: string, sessionId: string) => {
    if (!command.trim()) return;

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Add command to output
    const commandOutput: TerminalOutput = {
      id: `cmd-${Date.now()}`,
      type: 'input',
      content: `${session.cwd}$ ${command}`,
      timestamp: new Date(),
      command,
    };

    setSessions(prevSessions => 
      prevSessions.map(s => 
        s.id === sessionId
          ? {
              ...s,
              output: [...s.output, commandOutput],
              history: [command, ...s.history.filter(h => h !== command)].slice(0, 100),
              historyIndex: -1,
              lastActivity: new Date(),
              isRunning: true,
            }
          : s
      )
    );

    try {
      // Handle built-in commands
      if (command.startsWith('ai ')) {
        await handleAICommand(command.substring(3), sessionId);
        return;
      }

      if (command === 'help') {
        await handleHelpCommand(sessionId);
        return;
      }

      if (command === 'clear') {
        await handleClearCommand(sessionId);
        return;
      }

      if (command.startsWith('cd ')) {
        await handleCdCommand(command.substring(3), sessionId);
        return;
      }

      // Execute command through MCP
      const response = await sendMessage('terminal-execute', {
        command,
        cwd: session.cwd,
        shell: session.shell,
        environment: session.environment,
      });

      const output: TerminalOutput = {
        id: `out-${Date.now()}`,
        type: response.error ? 'error' : 'output',
        content: response.output || response.error || '',
        timestamp: new Date(),
        command,
        exitCode: response.exitCode,
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? {
                ...s,
                output: [...s.output, output],
                cwd: response.cwd || s.cwd,
                isRunning: false,
              }
            : s
        )
      );

    } catch (error) {
      const errorOutput: TerminalOutput = {
        id: `err-${Date.now()}`,
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        command,
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? {
                ...s,
                output: [...s.output, errorOutput],
                isRunning: false,
              }
            : s
        )
      );
    }
  }, [sessions, sendMessage]);

  // Handle AI command
  const handleAICommand = useCallback(async (query: string, sessionId: string) => {
    if (!settings.enableAI) {
      const output: TerminalOutput = {
        id: `ai-disabled-${Date.now()}`,
        type: 'error',
        content: 'AI assistance is disabled. Enable it in terminal settings.',
        timestamp: new Date(),
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? { ...s, output: [...s.output, output], isRunning: false }
            : s
        )
      );
      return;
    }

    try {
      const response = await sendMessage('ai-terminal-assist', {
        query,
        context: {
          cwd: activeSession?.cwd,
          shell: activeSession?.shell,
          recentCommands: activeSession?.history.slice(0, 10),
          environment: activeSession?.environment,
        },
      });

      const output: TerminalOutput = {
        id: `ai-${Date.now()}`,
        type: 'output',
        content: `AI Assistant:\n${response.answer || 'No response from AI'}\n${response.suggestedCommand ? `\nSuggested command: ${response.suggestedCommand}` : ''}`,
        timestamp: new Date(),
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? { ...s, output: [...s.output, output], isRunning: false }
            : s
        )
      );

    } catch (error) {
      const errorOutput: TerminalOutput = {
        id: `ai-err-${Date.now()}`,
        type: 'error',
        content: `AI Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? { ...s, output: [...s.output, errorOutput], isRunning: false }
            : s
        )
      );
    }
  }, [settings.enableAI, activeSession, sendMessage]);

  // Handle help command
  const handleHelpCommand = useCallback(async (sessionId: string) => {
    const helpText = `
NEXUS IDE Terminal - Available Commands:

Built-in Commands:
  help                 Show this help message
  clear                Clear terminal output
  cd <path>           Change directory
  ai <query>          Ask AI assistant
  history             Show command history
  env                 Show environment variables
  pwd                 Print working directory
  exit                Exit terminal session

AI Features:
  ai "how to..."       Get help with commands
  ai "explain <cmd>"   Explain a command
  ai "fix <error>"     Get help fixing errors
  ai "optimize"       Get performance tips

Keyboard Shortcuts:
  Ctrl+C              Cancel current command
  Ctrl+L              Clear screen
  Ctrl+R              Search command history
  Up/Down Arrow       Navigate command history
  Tab                 Auto-complete
  Ctrl+Shift+C        Copy selection
  Ctrl+Shift+V        Paste

Tips:
  - Use Tab for auto-completion
  - AI can help with complex commands
  - Right-click for context menu
  - Drag files to get their paths

`;

    const output: TerminalOutput = {
      id: `help-${Date.now()}`,
      type: 'system',
      content: helpText,
      timestamp: new Date(),
    };

    setSessions(prevSessions => 
      prevSessions.map(s => 
        s.id === sessionId
          ? { ...s, output: [...s.output, output], isRunning: false }
          : s
      )
    );
  }, []);

  // Handle clear command
  const handleClearCommand = useCallback(async (sessionId: string) => {
    setSessions(prevSessions => 
      prevSessions.map(s => 
        s.id === sessionId
          ? { ...s, output: [], isRunning: false }
          : s
      )
    );
  }, []);

  // Handle cd command
  const handleCdCommand = useCallback(async (path: string, sessionId: string) => {
    try {
      const response = await sendMessage('terminal-cd', {
        path: path.trim(),
        currentCwd: activeSession?.cwd,
      });

      const output: TerminalOutput = {
        id: `cd-${Date.now()}`,
        type: response.error ? 'error' : 'output',
        content: response.error || `Changed directory to: ${response.newCwd}`,
        timestamp: new Date(),
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? {
                ...s,
                output: [...s.output, output],
                cwd: response.newCwd || s.cwd,
                isRunning: false,
              }
            : s
        )
      );

    } catch (error) {
      const errorOutput: TerminalOutput = {
        id: `cd-err-${Date.now()}`,
        type: 'error',
        content: `cd: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId
            ? { ...s, output: [...s.output, errorOutput], isRunning: false }
            : s
        )
      );
    }
  }, [activeSession?.cwd, sendMessage]);

  // Handle input key events
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const session = activeSession;
    if (!session) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (currentInput.trim()) {
          executeCommand(currentInput, session.id);
          setCurrentInput('');
          setSuggestions([]);
          setSelectedSuggestion(-1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        } else if (session.history.length > 0) {
          const newIndex = Math.min(session.historyIndex + 1, session.history.length - 1);
          setSessions(prevSessions => 
            prevSessions.map(s => 
              s.id === session.id ? { ...s, historyIndex: newIndex } : s
            )
          );
          setCurrentInput(session.history[newIndex] || '');
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (session.historyIndex > -1) {
          const newIndex = session.historyIndex - 1;
          setSessions(prevSessions => 
            prevSessions.map(s => 
              s.id === session.id ? { ...s, historyIndex: newIndex } : s
            )
          );
          setCurrentInput(newIndex >= 0 ? session.history[newIndex] : '');
        }
        break;

      case 'Tab':
        event.preventDefault();
        if (suggestions.length > 0 && selectedSuggestion >= 0) {
          setCurrentInput(suggestions[selectedSuggestion]);
          setSuggestions([]);
          setSelectedSuggestion(-1);
        } else if (settings.enableAutoComplete) {
          // Request auto-completion
          handleAutoComplete(currentInput);
        }
        break;

      case 'Escape':
        setSuggestions([]);
        setSelectedSuggestion(-1);
        break;

      case 'c':
        if (event.ctrlKey) {
          event.preventDefault();
          // Cancel current command
          if (session.isRunning) {
            // Send cancel signal through MCP
            sendMessage('terminal-cancel', { sessionId: session.id });
          }
        }
        break;

      case 'l':
        if (event.ctrlKey) {
          event.preventDefault();
          handleClearCommand(session.id);
        }
        break;
    }
  }, [activeSession, currentInput, suggestions, selectedSuggestion, settings.enableAutoComplete, executeCommand, handleClearCommand, sendMessage]);

  // Handle auto-completion
  const handleAutoComplete = useCallback(async (input: string) => {
    if (!settings.enableAutoComplete || !input.trim()) return;

    try {
      const response = await sendMessage('terminal-autocomplete', {
        input,
        cwd: activeSession?.cwd,
        shell: activeSession?.shell,
      });

      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        setSelectedSuggestion(0);
      }
    } catch (error) {
      console.error('Auto-completion error:', error);
    }
  }, [settings.enableAutoComplete, activeSession, sendMessage]);

  // Handle input change
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCurrentInput(value);
    
    // Clear suggestions when input changes
    if (suggestions.length > 0) {
      setSuggestions([]);
      setSelectedSuggestion(-1);
    }
    
    // Trigger auto-completion after a delay
    if (settings.enableAutoComplete && value.trim()) {
      const timeoutId = setTimeout(() => {
        handleAutoComplete(value);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [suggestions.length, settings.enableAutoComplete, handleAutoComplete]);

  // Create new terminal session
  const createNewSession = useCallback(() => {
    const newSession: TerminalSession = {
      id: `terminal-${Date.now()}`,
      title: `Terminal ${sessions.length + 1}`,
      shell: settings.shell,
      cwd: activeSession?.cwd || '/',
      isActive: false,
      isRunning: false,
      output: settings.showWelcomeMessage ? [
        {
          id: 'welcome',
          type: 'system',
          content: `Welcome to NEXUS IDE Terminal\n\nType 'help' for available commands.\n`,
          timestamp: new Date(),
        },
      ] : [],
      history: [],
      historyIndex: -1,
      environment: {},
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    setSessions(prevSessions => [...prevSessions, newSession]);
    setActiveSessionId(newSession.id);
  }, [sessions.length, settings.shell, settings.showWelcomeMessage, activeSession?.cwd]);

  // Close terminal session
  const closeSession = useCallback((sessionId: string) => {
    if (sessions.length <= 1) return; // Don't close the last session

    const sessionToClose = sessions.find(s => s.id === sessionId);
    if (sessionToClose?.isRunning && settings.confirmOnExit) {
      const shouldClose = window.confirm('Terminal is running a command. Close anyway?');
      if (!shouldClose) return;
    }

    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    if (activeSessionId === sessionId) {
      const newActiveSession = newSessions[newSessions.length - 1];
      if (newActiveSession) {
        setActiveSessionId(newActiveSession.id);
      }
    }
  }, [sessions, activeSessionId, settings.confirmOnExit]);

  // Render output item
  const renderOutput = (output: TerminalOutput) => {
    const getOutputColor = () => {
      switch (output.type) {
        case 'input':
          return 'text-blue-400';
        case 'error':
          return 'text-red-400';
        case 'system':
          return 'text-green-400';
        default:
          return 'text-foreground';
      }
    };

    return (
      <div key={output.id} className={`font-mono text-sm whitespace-pre-wrap ${getOutputColor()}`}>
        {output.content}
      </div>
    );
  };

  // Render session tab
  const renderSessionTab = (session: TerminalSession) => (
    <div
      key={session.id}
      className={`flex items-center px-3 py-2 border-r border-border cursor-pointer transition-colors ${
        session.id === activeSessionId
          ? 'bg-background text-foreground border-b-2 border-b-primary'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      onClick={() => setActiveSessionId(session.id)}
    >
      <TerminalIcon className="w-4 h-4 mr-2" />
      <span className="text-sm truncate max-w-24">{session.title}</span>
      {session.isRunning && (
        <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse" />
      )}
      {sessions.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeSession(session.id);
          }}
          className="ml-2 p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  if (!isExpanded) {
    return (
      <div className={`flex items-center justify-between p-2 bg-muted/30 border-t border-border ${className}`}>
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Terminal</span>
          {activeSession?.isRunning && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-background border-t border-border ${className}`} style={{ height: '300px' }}>
      {/* Terminal Header */}
      <div className="flex items-center bg-muted/30 border-b border-border">
        {/* Session Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto">
          {sessions.map(renderSessionTab)}
        </div>
        
        {/* Terminal Actions */}
        <div className="flex items-center px-2 space-x-1">
          <button
            onClick={createNewSession}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="New Terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center p-2 bg-muted/50 border-b border-border space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search terminal output..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setShowSearch(false)}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={outputRef}
        className="flex-1 p-4 overflow-y-auto bg-background font-mono text-sm"
        style={{
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
        }}
      >
        {activeSession?.output.map(renderOutput)}
        
        {/* Current Input Line */}
        <div className="flex items-center mt-2">
          <span className="text-blue-400 mr-2">
            {activeSession?.cwd}$
          </span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none text-foreground"
              placeholder={isAIMode ? "Ask AI assistant..." : "Type a command..."}
              autoFocus
            />
            
            {/* Auto-completion Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      index === selectedSuggestion
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => {
                      setCurrentInput(suggestion);
                      setSuggestions([]);
                      setSelectedSuggestion(-1);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* AI Mode Indicator */}
          {isAIMode && (
            <Brain className="w-4 h-4 text-primary ml-2" />
          )}
          
          {/* Running Indicator */}
          {activeSession?.isRunning && (
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse" />
          )}
        </div>
      </div>

      {/* Terminal Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border text-xs">
        <div className="flex items-center space-x-4">
          <span>{activeSession?.shell}</span>
          <span>{activeSession?.cwd}</span>
          {activeSession?.isRunning && (
            <span className="text-green-500">Running</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {settings.enableAI && (
            <button
              onClick={() => setIsAIMode(!isAIMode)}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                isAIMode
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>AI</span>
            </button>
          )}
          <span className="text-muted-foreground">
            {activeSession?.output.length || 0} lines
          </span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;

// Terminal utilities and hooks
export const useTerminalActions = () => {
  const handleAction = (action: string, data?: any) => {
    window.dispatchEvent(new CustomEvent(`nexus:terminal-${action}`, { detail: data }));
  };

  return {
    newSession: () => handleAction('new-session'),
    closeSession: (sessionId: string) => handleAction('close-session', { sessionId }),
    executeCommand: (command: string, sessionId?: string) => handleAction('execute-command', { command, sessionId }),
    clearOutput: (sessionId?: string) => handleAction('clear-output', { sessionId }),
    showSettings: () => handleAction('show-settings'),
    toggleExpanded: () => handleAction('toggle-expanded'),
    focusInput: () => handleAction('focus-input'),
  };
};

// Terminal configuration
export const terminalConfig = {
  defaultSettings: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    theme: 'auto' as const,
    shell: 'bash',
    scrollback: 1000,
    cursorStyle: 'block' as const,
    cursorBlink: true,
    bellSound: false,
    rightClickSelectsWord: true,
    copyOnSelect: false,
    pasteOnRightClick: true,
    confirmOnExit: true,
    closeOnExit: false,
    showWelcomeMessage: true,
    enableAI: true,
    enableAutoComplete: true,
    enableSyntaxHighlighting: true,
  },
  supportedShells: {
    windows: ['powershell', 'cmd', 'wsl', 'git-bash'],
    unix: ['bash', 'zsh', 'fish', 'sh'],
  },
  builtinCommands: [
    'help', 'clear', 'cd', 'ai', 'history', 'env', 'pwd', 'exit',
  ],
};

// Export terminal component with display name
Terminal.displayName = 'Terminal';

export { Terminal };