/**
 * Advanced Terminal Hook for NEXUS IDE
 * Provides comprehensive terminal management with AI integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAI } from './useAI';
import { useMCP } from './useMCP';

export interface TerminalSession {
  id: string;
  name: string;
  shell: string;
  cwd: string;
  pid?: number;
  isActive: boolean;
  isRunning: boolean;
  lastActivity: Date;
  history: TerminalHistoryEntry[];
  environment: Record<string, string>;
  size: { cols: number; rows: number };
}

export interface TerminalHistoryEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
  cwd: string;
}

export interface TerminalCommand {
  command: string;
  description: string;
  category: string;
  usage: string;
  examples: string[];
  aiGenerated?: boolean;
}

export interface TerminalState {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  splitView: 'none' | 'horizontal' | 'vertical';
  secondarySessionId: string | null;
  isLoading: boolean;
  error: string | null;
  suggestions: TerminalCommand[];
  isAIMode: boolean;
  autoComplete: string[];
}

export interface TerminalActions {
  createSession: (name?: string, shell?: string, cwd?: string) => Promise<string>;
  closeSession: (sessionId: string) => void;
  closeAllSessions: () => void;
  setActiveSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  duplicateSession: (sessionId: string) => Promise<string>;
  executeCommand: (sessionId: string, command: string) => Promise<void>;
  sendInput: (sessionId: string, input: string) => void;
  sendSignal: (sessionId: string, signal: string) => void;
  clearHistory: (sessionId: string) => void;
  exportHistory: (sessionId: string) => string;
  importHistory: (sessionId: string, history: string) => void;
  searchHistory: (sessionId: string, query: string) => TerminalHistoryEntry[];
  getCommandSuggestions: (input: string) => Promise<TerminalCommand[]>;
  executeNaturalLanguageCommand: (sessionId: string, nlCommand: string) => Promise<void>;
  createScript: (commands: string[], name: string) => Promise<void>;
  runScript: (sessionId: string, scriptName: string) => Promise<void>;
  splitTerminal: (direction: 'horizontal' | 'vertical') => void;
  closeSplit: () => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  changeDirectory: (sessionId: string, path: string) => Promise<void>;
  setEnvironmentVariable: (sessionId: string, key: string, value: string) => void;
  getEnvironmentVariables: (sessionId: string) => Record<string, string>;
  toggleAIMode: () => void;
  getAutoComplete: (sessionId: string, input: string) => Promise<string[]>;
}

export interface TerminalSettings {
  defaultShell: string;
  fontSize: number;
  fontFamily: string;
  theme: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  bellSound: boolean;
  copyOnSelect: boolean;
  pasteOnRightClick: boolean;
  confirmOnExit: boolean;
  saveHistory: boolean;
  historySize: number;
  aiSuggestions: boolean;
  autoComplete: boolean;
}

const DEFAULT_SETTINGS: TerminalSettings = {
  defaultShell: process.platform === 'win32' ? 'powershell' : 'bash',
  fontSize: 14,
  fontFamily: 'Fira Code, Consolas, Monaco, monospace',
  theme: 'dark',
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 1000,
  bellSound: false,
  copyOnSelect: true,
  pasteOnRightClick: true,
  confirmOnExit: true,
  saveHistory: true,
  historySize: 10000,
  aiSuggestions: true,
  autoComplete: true
};

const COMMON_COMMANDS: TerminalCommand[] = [
  {
    command: 'ls',
    description: 'List directory contents',
    category: 'File System',
    usage: 'ls [options] [directory]',
    examples: ['ls -la', 'ls -lh /home', 'ls --color=auto']
  },
  {
    command: 'cd',
    description: 'Change directory',
    category: 'Navigation',
    usage: 'cd [directory]',
    examples: ['cd /home/user', 'cd ..', 'cd ~']
  },
  {
    command: 'git',
    description: 'Git version control',
    category: 'Version Control',
    usage: 'git [command] [options]',
    examples: ['git status', 'git add .', 'git commit -m "message"', 'git push']
  },
  {
    command: 'npm',
    description: 'Node Package Manager',
    category: 'Package Management',
    usage: 'npm [command] [options]',
    examples: ['npm install', 'npm run dev', 'npm test', 'npm build']
  },
  {
    command: 'docker',
    description: 'Docker container management',
    category: 'Containers',
    usage: 'docker [command] [options]',
    examples: ['docker ps', 'docker build .', 'docker run -p 3000:3000 app']
  }
];

export function useTerminal(): TerminalState & TerminalActions & { settings: TerminalSettings; updateSettings: (settings: Partial<TerminalSettings>) => void } {
  const [state, setState] = useState<TerminalState>({
    sessions: [],
    activeSessionId: null,
    splitView: 'none',
    secondarySessionId: null,
    isLoading: false,
    error: null,
    suggestions: COMMON_COMMANDS,
    isAIMode: false,
    autoComplete: []
  });

  const [settings, setSettings] = useState<TerminalSettings>(DEFAULT_SETTINGS);
  const websocketRef = useRef<WebSocket | null>(null);
  const { generateCode, explainCode } = useAI();
  const { sendMessage } = useMCP();

  // Initialize WebSocket connection for terminal communication
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001/terminal');
      
      ws.onopen = () => {
        console.log('Terminal WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleTerminalMessage(data);
      };

      ws.onclose = () => {
        console.log('Terminal WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('Terminal WebSocket error:', error);
      };

      websocketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Handle terminal messages from WebSocket
  const handleTerminalMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'output':
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(session => 
            session.id === data.sessionId
              ? {
                  ...session,
                  history: [
                    ...session.history,
                    {
                      id: Date.now().toString(),
                      command: data.command || '',
                      output: data.output,
                      exitCode: data.exitCode || 0,
                      timestamp: new Date(),
                      duration: data.duration || 0,
                      cwd: session.cwd
                    }
                  ],
                  lastActivity: new Date()
                }
              : session
          )
        }));
        break;

      case 'session_created':
        const newSession: TerminalSession = {
          id: data.sessionId,
          name: data.name || `Terminal ${data.sessionId.slice(0, 8)}`,
          shell: data.shell || settings.defaultShell,
          cwd: data.cwd || process.cwd(),
          pid: data.pid,
          isActive: true,
          isRunning: true,
          lastActivity: new Date(),
          history: [],
          environment: data.environment || {},
          size: data.size || { cols: 80, rows: 24 }
        };

        setState(prev => ({
          ...prev,
          sessions: [...prev.sessions.map(s => ({ ...s, isActive: false })), newSession],
          activeSessionId: newSession.id
        }));
        break;

      case 'session_closed':
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.filter(s => s.id !== data.sessionId),
          activeSessionId: prev.activeSessionId === data.sessionId ? 
            (prev.sessions.length > 1 ? prev.sessions.find(s => s.id !== data.sessionId)?.id || null : null) :
            prev.activeSessionId
        }));
        break;

      case 'cwd_changed':
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(session => 
            session.id === data.sessionId
              ? { ...session, cwd: data.cwd }
              : session
          )
        }));
        break;

      case 'error':
        setState(prev => ({ ...prev, error: data.message }));
        break;
    }
  }, [settings.defaultShell]);

  // Create new terminal session
  const createSession = useCallback(async (name?: string, shell?: string, cwd?: string): Promise<string> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'create_session',
          sessionId,
          name: name || `Terminal ${sessionId.slice(8, 16)}`,
          shell: shell || settings.defaultShell,
          cwd: cwd || process.cwd(),
          size: { cols: 80, rows: 24 }
        }));
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return sessionId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create terminal session'
      }));
      throw error;
    }
  }, [settings.defaultShell]);

  // Close terminal session
  const closeSession = useCallback((sessionId: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'close_session',
        sessionId
      }));
    }
  }, []);

  // Execute command in terminal
  const executeCommand = useCallback(async (sessionId: string, command: string): Promise<void> => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Terminal connection not available');
    }

    // Add command to history immediately
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => 
        session.id === sessionId
          ? {
              ...session,
              history: [
                ...session.history,
                {
                  id: Date.now().toString(),
                  command,
                  output: '',
                  exitCode: -1, // Pending
                  timestamp: new Date(),
                  duration: 0,
                  cwd: session.cwd
                }
              ],
              lastActivity: new Date()
            }
          : session
      )
    }));

    websocketRef.current.send(JSON.stringify({
      type: 'execute_command',
      sessionId,
      command
    }));
  }, []);

  // Execute natural language command using AI
  const executeNaturalLanguageCommand = useCallback(async (sessionId: string, nlCommand: string): Promise<void> => {
    try {
      const prompt = `Convert this natural language command to a shell command: "${nlCommand}"
      
Context: ${process.platform} system
Current directory: ${state.sessions.find(s => s.id === sessionId)?.cwd || process.cwd()}
      
Return only the shell command, no explanation.`;
      
      const shellCommand = await generateCode(prompt, 'shell');
      
      if (shellCommand) {
        await executeCommand(sessionId, shellCommand.trim());
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to convert natural language command' }));
    }
  }, [generateCode, executeCommand, state.sessions]);

  // Get command suggestions
  const getCommandSuggestions = useCallback(async (input: string): Promise<TerminalCommand[]> => {
    const filtered = COMMON_COMMANDS.filter(cmd => 
      cmd.command.toLowerCase().includes(input.toLowerCase()) ||
      cmd.description.toLowerCase().includes(input.toLowerCase())
    );

    if (settings.aiSuggestions && input.length > 2) {
      try {
        const aiSuggestions = await generateCode(
          `Suggest shell commands related to: "${input}". Return as JSON array with command, description, category, usage, examples fields.`,
          'json'
        );
        
        if (aiSuggestions) {
          const parsed = JSON.parse(aiSuggestions);
          if (Array.isArray(parsed)) {
            return [...filtered, ...parsed.map((cmd: any) => ({ ...cmd, aiGenerated: true }))];
          }
        }
      } catch (error) {
        console.error('Failed to get AI suggestions:', error);
      }
    }

    return filtered;
  }, [generateCode, settings.aiSuggestions]);

  // Get auto-complete suggestions
  const getAutoComplete = useCallback(async (sessionId: string, input: string): Promise<string[]> => {
    if (!settings.autoComplete || input.length < 2) {
      return [];
    }

    // Basic auto-complete based on command history
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return [];

    const historyCommands = session.history
      .map(entry => entry.command)
      .filter(cmd => cmd.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10);

    // Add common commands
    const commonMatches = COMMON_COMMANDS
      .filter(cmd => cmd.command.toLowerCase().startsWith(input.toLowerCase()))
      .map(cmd => cmd.command)
      .slice(0, 5);

    return [...new Set([...historyCommands, ...commonMatches])];
  }, [settings.autoComplete, state.sessions]);

  // Search command history
  const searchHistory = useCallback((sessionId: string, query: string): TerminalHistoryEntry[] => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return [];

    return session.history.filter(entry => 
      entry.command.toLowerCase().includes(query.toLowerCase()) ||
      entry.output.toLowerCase().includes(query.toLowerCase())
    );
  }, [state.sessions]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TerminalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Placeholder implementations for other actions
  const closeAllSessions = useCallback(() => {
    state.sessions.forEach(session => closeSession(session.id));
  }, [state.sessions, closeSession]);

  const setActiveSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => ({
        ...session,
        isActive: session.id === sessionId
      })),
      activeSessionId: sessionId
    }));
  }, []);

  const toggleAIMode = useCallback(() => {
    setState(prev => ({ ...prev, isAIMode: !prev.isAIMode }));
  }, []);

  return {
    ...state,
    settings,
    createSession,
    closeSession,
    closeAllSessions,
    setActiveSession,
    renameSession: () => {},
    duplicateSession: async () => '',
    executeCommand,
    sendInput: () => {},
    sendSignal: () => {},
    clearHistory: () => {},
    exportHistory: () => '',
    importHistory: () => {},
    searchHistory,
    getCommandSuggestions,
    executeNaturalLanguageCommand,
    createScript: async () => {},
    runScript: async () => {},
    splitTerminal: () => {},
    closeSplit: () => {},
    resizeTerminal: () => {},
    changeDirectory: async () => {},
    setEnvironmentVariable: () => {},
    getEnvironmentVariables: () => ({}),
    toggleAIMode,
    getAutoComplete,
    updateSettings
  };
}

export default useTerminal;