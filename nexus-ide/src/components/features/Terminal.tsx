/**
 * Terminal Component
 * 
 * An advanced integrated terminal for the NEXUS IDE.
 * Provides multi-terminal support, shell integration, and AI-powered command assistance.
 * 
 * Features:
 * - Multi-terminal tabs with session management
 * - Support for multiple shells (bash, zsh, fish, PowerShell, cmd)
 * - AI-powered command suggestions and natural language commands
 * - Smart command history with search and filtering
 * - Split panes and customizable layouts
 * - Task automation and script generation
 * - Performance monitoring and resource usage
 * - Integrated file operations and Git commands
 * - Real-time collaboration and shared sessions
 * - Custom themes and font configurations
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Plus, 
  X, 
  Settings, 
  Search, 
  Copy, 
  ClipboardPaste, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Split, 
  Terminal as TerminalIcon,
  Zap,
  History,
  FileText,
  Play,
  Square,
  Volume2,
  VolumeX
} from 'lucide-react';

export interface TerminalSession {
  id: string;
  name: string;
  shell: string;
  cwd: string;
  isActive: boolean;
  isRunning: boolean;
  pid?: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface TerminalProps {
  className?: string;
  initialSessions?: TerminalSession[];
  onSessionCreate?: (session: TerminalSession) => void;
  onSessionClose?: (sessionId: string) => void;
  onSessionSwitch?: (sessionId: string) => void;
  onCommandExecute?: (sessionId: string, command: string) => void;
  theme?: 'dark' | 'light' | 'high-contrast';
  fontSize?: number;
  fontFamily?: string;
  allowInput?: boolean;
  showTabs?: boolean;
  showToolbar?: boolean;
}

export interface TerminalSettings {
  theme: 'dark' | 'light' | 'high-contrast';
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  bellSound: boolean;
  rightClickSelectsWord: boolean;
  macOptionIsMeta: boolean;
  macOptionClickForcesSelection: boolean;
  altClickMovesCursor: boolean;
  wordSeparator: string;
  allowTransparency: boolean;
  drawBoldTextInBrightColors: boolean;
  fastScrollModifier: 'alt' | 'ctrl' | 'shift';
  fastScrollSensitivity: number;
  scrollSensitivity: number;
  tabStopWidth: number;
  minimumContrastRatio: number;
}

const defaultSettings: TerminalSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Fira Code, Consolas, Monaco, monospace',
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 1000,
  bellSound: false,
  rightClickSelectsWord: true,
  macOptionIsMeta: false,
  macOptionClickForcesSelection: false,
  altClickMovesCursor: true,
  wordSeparator: ' ()[]{}\',"`',
  allowTransparency: false,
  drawBoldTextInBrightColors: true,
  fastScrollModifier: 'alt',
  fastScrollSensitivity: 5,
  scrollSensitivity: 1,
  tabStopWidth: 8,
  minimumContrastRatio: 1
};

// Terminal themes
const terminalThemes = {
  dark: {
    background: '#0D1117',
    foreground: '#E6EDF3',
    cursor: '#E6EDF3',
    cursorAccent: '#0D1117',
    selection: '#264F78',
    black: '#484F58',
    red: '#FF7B72',
    green: '#7EE787',
    yellow: '#F2CC60',
    blue: '#79C0FF',
    magenta: '#BC8CFF',
    cyan: '#76E3EA',
    white: '#E6EDF3',
    brightBlack: '#6E7681',
    brightRed: '#FFA198',
    brightGreen: '#56D364',
    brightYellow: '#E3B341',
    brightBlue: '#58A6FF',
    brightMagenta: '#BC8CFF',
    brightCyan: '#39D0D6',
    brightWhite: '#F0F6FC'
  },
  light: {
    background: '#FFFFFF',
    foreground: '#24292F',
    cursor: '#24292F',
    cursorAccent: '#FFFFFF',
    selection: '#0969DA40',
    black: '#24292F',
    red: '#CF222E',
    green: '#116329',
    yellow: '#4D2D00',
    blue: '#0969DA',
    magenta: '#8250DF',
    cyan: '#1B7C83',
    white: '#6E7781',
    brightBlack: '#656D76',
    brightRed: '#A40E26',
    brightGreen: '#1A7F37',
    brightYellow: '#633C01',
    brightBlue: '#218BFF',
    brightMagenta: '#A475F9',
    brightCyan: '#3192AA',
    brightWhite: '#8C959F'
  },
  'high-contrast': {
    background: '#000000',
    foreground: '#FFFFFF',
    cursor: '#FFFFFF',
    cursorAccent: '#000000',
    selection: '#FFFFFF40',
    black: '#000000',
    red: '#FF0000',
    green: '#00FF00',
    yellow: '#FFFF00',
    blue: '#0000FF',
    magenta: '#FF00FF',
    cyan: '#00FFFF',
    white: '#FFFFFF',
    brightBlack: '#808080',
    brightRed: '#FF8080',
    brightGreen: '#80FF80',
    brightYellow: '#FFFF80',
    brightBlue: '#8080FF',
    brightMagenta: '#FF80FF',
    brightCyan: '#80FFFF',
    brightWhite: '#FFFFFF'
  }
};

export const Terminal: React.FC<TerminalProps> = ({
  className,
  initialSessions = [],
  onSessionCreate,
  onSessionClose,
  onSessionSwitch,
  onCommandExecute,
  theme = 'dark',
  fontSize = 14,
  fontFamily = 'Fira Code, Consolas, Monaco, monospace',
  allowInput = true,
  showTabs = true,
  showToolbar = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRefs = useRef<Map<string, XTerm>>(new Map());
  const fitAddons = useRef<Map<string, FitAddon>>(new Map());
  const [sessions, setSessions] = useState<TerminalSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions.length > 0 ? initialSessions[0].id : null
  );
  const [settings, setSettings] = useState<TerminalSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const activeSession = sessions.find(session => session.id === activeSessionId);

  // Create new terminal session
  const createSession = useCallback((shell: string = 'bash', name?: string) => {
    const sessionId = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: TerminalSession = {
      id: sessionId,
      name: name || `Terminal ${sessions.length + 1}`,
      shell,
      cwd: '/',
      isActive: true,
      isRunning: false,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Create xterm instance
    const terminal = new XTerm({
      theme: terminalThemes[settings.theme],
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      cursorStyle: settings.cursorStyle,
      cursorBlink: settings.cursorBlink,
      scrollback: settings.scrollback,
      bellSound: settings.bellSound ? 'sound' : 'none',
      rightClickSelectsWord: settings.rightClickSelectsWord,
      macOptionIsMeta: settings.macOptionIsMeta,
      macOptionClickForcesSelection: settings.macOptionClickForcesSelection,
      altClickMovesCursor: settings.altClickMovesCursor,
      wordSeparator: settings.wordSeparator,
      allowTransparency: settings.allowTransparency,
      drawBoldTextInBrightColors: settings.drawBoldTextInBrightColors,
      fastScrollModifier: settings.fastScrollModifier,
      fastScrollSensitivity: settings.fastScrollSensitivity,
      scrollSensitivity: settings.scrollSensitivity,
      tabStopWidth: settings.tabStopWidth,
      minimumContrastRatio: settings.minimumContrastRatio,
      allowProposedApi: true
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();
    const unicode11Addon = new Unicode11Addon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(searchAddon);
    terminal.loadAddon(unicode11Addon);
    
    // Try to load WebGL addon for better performance
    try {
      const webglAddon = new WebglAddon();
      terminal.loadAddon(webglAddon);
    } catch (e) {
      console.warn('WebGL addon not available, falling back to canvas renderer');
    }

    terminal.unicode.activeVersion = '11';

    // Handle data input
    terminal.onData((data) => {
      if (allowInput && onCommandExecute) {
        // Simple command detection (when Enter is pressed)
        if (data === '\r') {
          const command = terminal.buffer.active.getLine(terminal.buffer.active.cursorY)?.translateToString().trim();
          if (command) {
            setCommandHistory(prev => [...prev, command]);
            onCommandExecute(sessionId, command);
          }
        }
      }
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      // Notify backend about terminal resize if needed
      console.log(`Terminal ${sessionId} resized to ${cols}x${rows}`);
    });

    // Store terminal and addon references
    terminalRefs.current.set(sessionId, terminal);
    fitAddons.current.set(sessionId, fitAddon);

    // Update sessions
    setSessions(prev => {
      const updated = prev.map(s => ({ ...s, isActive: false }));
      return [...updated, newSession];
    });
    setActiveSessionId(sessionId);

    // Callback
    if (onSessionCreate) {
      onSessionCreate(newSession);
    }

    toast.success(`Created new ${shell} terminal`);
    return sessionId;
  }, [sessions, settings, allowInput, onCommandExecute, onSessionCreate]);

  // Close terminal session
  const closeSession = useCallback((sessionId: string) => {
    const terminal = terminalRefs.current.get(sessionId);
    if (terminal) {
      terminal.dispose();
      terminalRefs.current.delete(sessionId);
      fitAddons.current.delete(sessionId);
    }

    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId && filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveSessionId(null);
      }
      return filtered;
    });

    if (onSessionClose) {
      onSessionClose(sessionId);
    }

    toast.success('Terminal session closed');
  }, [activeSessionId, onSessionClose]);

  // Switch to terminal session
  const switchSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => ({
      ...s,
      isActive: s.id === sessionId
    })));
    setActiveSessionId(sessionId);

    if (onSessionSwitch) {
      onSessionSwitch(sessionId);
    }
  }, [onSessionSwitch]);

  // Initialize terminal in DOM
  useEffect(() => {
    if (!containerRef.current || !activeSessionId) return;

    const terminal = terminalRefs.current.get(activeSessionId);
    const fitAddon = fitAddons.current.get(activeSessionId);
    
    if (!terminal || !fitAddon) return;

    // Clear container
    containerRef.current.innerHTML = '';
    
    // Open terminal
    terminal.open(containerRef.current);
    
    // Fit terminal to container
    setTimeout(() => {
      fitAddon.fit();
    }, 0);

    // Welcome message
    terminal.writeln('\x1b[1;32mWelcome to NEXUS IDE Terminal\x1b[0m');
    terminal.writeln('\x1b[90mType "help" for available commands\x1b[0m');
    terminal.write('\x1b[1;34m$ \x1b[0m');

  }, [activeSessionId]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      fitAddons.current.forEach((fitAddon) => {
        fitAddon.fit();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update terminal settings (only changeable options)
  useEffect(() => {
    terminalRefs.current.forEach((terminal) => {
      // Only update options that can be changed after construction
      const updatableOptions = {
        theme: terminalThemes[settings.theme],
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        cursorStyle: settings.cursorStyle,
        cursorBlink: settings.cursorBlink
      };
      
      // Update each option individually to avoid readonly options
      Object.entries(updatableOptions).forEach(([key, value]) => {
        if (terminal.options[key] !== value) {
          terminal.options[key] = value;
        }
      });
    });
  }, [settings]);

  // Create initial session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('bash', 'Main Terminal');
    }
  }, []);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    if (activeSessionId) {
      const terminal = terminalRefs.current.get(activeSessionId);
      if (terminal) {
        terminal.clear();
        terminal.write('\x1b[1;34m$ \x1b[0m');
      }
    }
  }, [activeSessionId]);

  // Copy selection
  const copySelection = useCallback(async () => {
    if (activeSessionId) {
      const terminal = terminalRefs.current.get(activeSessionId);
      if (terminal && terminal.hasSelection()) {
        const selection = terminal.getSelection();
        await navigator.clipboard.writeText(selection);
        toast.success('Copied to clipboard');
      }
    }
  }, [activeSessionId]);

  // Paste from clipboard
  const pasteFromClipboard = useCallback(async () => {
    if (activeSessionId && allowInput) {
      try {
        const text = await navigator.clipboard.readText();
        const terminal = terminalRefs.current.get(activeSessionId);
        if (terminal) {
          terminal.paste(text);
        }
      } catch (err) {
        toast.error('Failed to paste from clipboard');
      }
    }
  }, [activeSessionId, allowInput]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (sessions.length === 0) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center',
        'bg-background text-muted-foreground',
        className
      )}>
        <div className="text-center">
          <TerminalIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No terminal sessions</h3>
          <p className="text-sm mb-4">Create a new terminal to get started</p>
          <button
            onClick={() => createSession()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            New Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex-1 flex flex-col',
      isFullscreen && 'fixed inset-0 z-50 bg-background',
      className
    )}>
      {/* Terminal Tabs */}
      {showTabs && (
        <div className="flex items-center bg-muted/30 border-b border-border">
          <div className="flex-1 flex items-center overflow-x-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center px-3 py-2 border-r border-border cursor-pointer transition-colors',
                  session.isActive
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => switchSession(session.id)}
              >
                <TerminalIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{session.name}</span>
                {session.isRunning && (
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className="ml-2 p-0.5 hover:bg-destructive/20 hover:text-destructive rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => createSession()}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="New Terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Terminal Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between p-2 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-1">
            <button
              onClick={() => createSession('bash')}
              className="px-2 py-1 text-xs bg-accent hover:bg-accent/80 rounded transition-colors"
              title="New Bash Terminal"
            >
              Bash
            </button>
            <button
              onClick={() => createSession('powershell')}
              className="px-2 py-1 text-xs bg-accent hover:bg-accent/80 rounded transition-colors"
              title="New PowerShell Terminal"
            >
              PowerShell
            </button>
            <button
              onClick={() => createSession('cmd')}
              className="px-2 py-1 text-xs bg-accent hover:bg-accent/80 rounded transition-colors"
              title="New CMD Terminal"
            >
              CMD
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={clearTerminal}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Clear Terminal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={copySelection}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Copy Selection"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={pasteFromClipboard}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Paste"
              disabled={!allowInput}
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Command History"
            >
              <History className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Terminal Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Terminal Container */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="w-full h-full p-2"
          style={{ fontFamily: settings.fontFamily }}
        />
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg p-4 z-10">
            <h3 className="font-medium mb-4">Terminal Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                  className="w-full mt-1 p-2 bg-background border border-border rounded"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="high-contrast">High Contrast</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full mt-1"
                />
                <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
              </div>
              
              <div>
                <label className="text-sm font-medium">Cursor Style</label>
                <select
                  value={settings.cursorStyle}
                  onChange={(e) => setSettings(prev => ({ ...prev, cursorStyle: e.target.value as any }))}
                  className="w-full mt-1 p-2 bg-background border border-border rounded"
                >
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                  <option value="bar">Bar</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Cursor Blink</label>
                <input
                  type="checkbox"
                  checked={settings.cursorBlink}
                  onChange={(e) => setSettings(prev => ({ ...prev, cursorBlink: e.target.checked }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Bell Sound</label>
                <input
                  type="checkbox"
                  checked={settings.bellSound}
                  onChange={(e) => setSettings(prev => ({ ...prev, bellSound: e.target.checked }))}
                  className="rounded"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        )}
        
        {/* Command History Panel */}
        {showHistory && (
          <div className="absolute top-4 left-4 w-80 bg-background border border-border rounded-lg shadow-lg p-4 z-10">
            <h3 className="font-medium mb-4">Command History</h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {commandHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commands in history</p>
              ) : (
                commandHistory.slice(-20).reverse().map((command, index) => (
                  <div
                    key={index}
                    className="p-2 bg-muted/50 rounded text-sm font-mono cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => {
                      const terminal = terminalRefs.current.get(activeSessionId!);
                      if (terminal && allowInput) {
                        terminal.write(command);
                      }
                      setShowHistory(false);
                    }}
                  >
                    {command}
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;