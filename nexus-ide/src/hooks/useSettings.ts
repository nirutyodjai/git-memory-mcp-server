/**
 * Advanced Settings Hook for NEXUS IDE
 * Provides comprehensive settings management with AI-powered optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAI } from './useAI';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  wordWrapColumn: number;
  minimap: {
    enabled: boolean;
    side: 'left' | 'right';
    size: 'proportional' | 'fill' | 'fit';
    showSlider: 'always' | 'mouseover';
  };
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  renderControlCharacters: boolean;
  renderIndentGuides: boolean;
  highlightActiveIndentGuide: boolean;
  bracketPairColorization: boolean;
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoSurround: 'languageDefined' | 'quotes' | 'brackets' | 'never';
  formatOnSave: boolean;
  formatOnPaste: boolean;
  formatOnType: boolean;
  trimAutoWhitespace: boolean;
  acceptSuggestionOnEnter: 'on' | 'smart' | 'off';
  acceptSuggestionOnCommitCharacter: boolean;
  snippetSuggestions: 'top' | 'bottom' | 'inline' | 'none';
  emptySelectionClipboard: boolean;
  copyWithSyntaxHighlighting: boolean;
  multiCursorModifier: 'ctrlCmd' | 'alt';
  accessibilitySupport: 'auto' | 'off' | 'on';
  folding: boolean;
  foldingStrategy: 'auto' | 'indentation';
  showFoldingControls: 'always' | 'mouseover';
  unfoldOnClickAfterEndOfLine: boolean;
  matchBrackets: 'never' | 'near' | 'always';
  glyphMargin: boolean;
  smoothScrolling: boolean;
  scrollBeyondLastLine: boolean;
  scrollBeyondLastColumn: number;
  columnSelection: boolean;
  mouseWheelZoom: boolean;
  quickSuggestions: {
    other: boolean;
    comments: boolean;
    strings: boolean;
  };
  quickSuggestionsDelay: number;
  parameterHints: {
    enabled: boolean;
    cycle: boolean;
  };
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  contextmenu: boolean;
  mouseWheelScrollSensitivity: number;
  fastScrollSensitivity: number;
  scrollPredominantAxis: boolean;
  selectionHighlight: boolean;
  occurrencesHighlight: boolean;
  codeLens: boolean;
  lightbulb: {
    enabled: boolean;
  };
  codeActionsOnSave: {
    'source.organizeImports': boolean;
    'source.fixAll': boolean;
  };
  rulers: number[];
  colorDecorators: boolean;
  semanticHighlighting: {
    enabled: boolean;
  };
  unicodeHighlight: {
    ambiguousCharacters: boolean;
    invisibleCharacters: boolean;
  };
}

export interface TerminalSettings {
  shell: {
    windows: string;
    linux: string;
    osx: string;
  };
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlinking: boolean;
  scrollback: number;
  fastScrollModifier: 'alt' | 'ctrl' | 'shift';
  rightClickBehavior: 'default' | 'copyPaste' | 'paste' | 'selectWord';
  copyOnSelection: boolean;
  allowChords: boolean;
  allowMnemonics: boolean;
  drawBoldTextInBrightColors: boolean;
  experimentalBufferImpl: 'JsArray' | 'TypedArray';
  macOptionIsMeta: boolean;
  macOptionClickForcesSelection: boolean;
  altClickMovesCursor: boolean;
  gpuAcceleration: 'auto' | 'on' | 'off';
  localEchoLatencyThreshold: number;
  localEchoExcludePrograms: string[];
  localEchoStyle: 'bold' | 'dim' | 'italic' | 'underlined' | 'inverted';
  enableBell: boolean;
  env: Record<string, string>;
  cwd: string;
  detectLocale: 'auto' | 'off' | 'on';
  unicodeVersion: '6' | '11';
  wordSeparators: string;
  enableFileLinks: boolean;
  confirmOnExit: 'never' | 'always' | 'hasChildProcesses';
  enablePersistentSessions: boolean;
  persistentSessionReviveProcess: 'onExit' | 'onExitAndWindowClose' | 'never';
  tabs: {
    enabled: boolean;
    hideCondition: 'never' | 'singleTerminal' | 'singleGroup';
    location: 'left' | 'right';
    showActiveTerminal: 'always' | 'singleTerminal' | 'singleTerminalOrNarrow' | 'never';
    showActions: 'always' | 'singleTerminal' | 'singleTerminalOrNarrow' | 'never';
  };
}

export interface AISettings {
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  timeout: number;
  retries: number;
  streaming: boolean;
  contextWindow: number;
  systemPrompt: string;
  codeGeneration: {
    enabled: boolean;
    autoComplete: boolean;
    inlineCompletion: boolean;
    multiLineCompletion: boolean;
    commentGeneration: boolean;
    docstringGeneration: boolean;
    testGeneration: boolean;
    refactoring: boolean;
  };
  codeAnalysis: {
    enabled: boolean;
    bugDetection: boolean;
    performanceAnalysis: boolean;
    securityAnalysis: boolean;
    codeReview: boolean;
    complexityAnalysis: boolean;
    duplicateDetection: boolean;
  };
  chat: {
    enabled: boolean;
    contextAware: boolean;
    projectContext: boolean;
    fileContext: boolean;
    historyLength: number;
    autoSave: boolean;
  };
  privacy: {
    sendTelemetry: boolean;
    sendCode: boolean;
    sendComments: boolean;
    sendFilenames: boolean;
    anonymizeData: boolean;
  };
  experimental: {
    voiceInput: boolean;
    imageGeneration: boolean;
    multiModal: boolean;
    agentMode: boolean;
  };
}

export interface CollaborationSettings {
  enabled: boolean;
  autoJoin: boolean;
  shareByDefault: boolean;
  allowAnonymous: boolean;
  maxParticipants: number;
  sessionTimeout: number;
  voice: {
    enabled: boolean;
    autoMute: boolean;
    noiseSuppression: boolean;
    echoCancellation: boolean;
    quality: 'low' | 'medium' | 'high';
  };
  video: {
    enabled: boolean;
    autoDisable: boolean;
    resolution: '480p' | '720p' | '1080p';
    frameRate: 15 | 30 | 60;
  };
  screen: {
    shareEnabled: boolean;
    allowControl: boolean;
    quality: 'low' | 'medium' | 'high';
  };
  chat: {
    enabled: boolean;
    showNotifications: boolean;
    soundEnabled: boolean;
    historyLength: number;
  };
  cursors: {
    showOtherCursors: boolean;
    showNames: boolean;
    fadeTimeout: number;
  };
  awareness: {
    showPresence: boolean;
    showActivity: boolean;
    updateInterval: number;
  };
}

export interface SecuritySettings {
  authentication: {
    required: boolean;
    method: 'password' | 'oauth' | 'sso' | 'mfa';
    sessionTimeout: number;
    rememberDevice: boolean;
  };
  encryption: {
    enabled: boolean;
    algorithm: 'AES-256' | 'ChaCha20';
    keyRotation: number;
  };
  network: {
    allowedDomains: string[];
    blockedDomains: string[];
    requireHttps: boolean;
    certificateValidation: boolean;
  };
  files: {
    scanUploads: boolean;
    allowedExtensions: string[];
    blockedExtensions: string[];
    maxFileSize: number;
  };
  code: {
    scanForSecrets: boolean;
    scanForVulnerabilities: boolean;
    allowExecution: boolean;
    sandboxMode: boolean;
  };
  audit: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    retention: number;
    exportEnabled: boolean;
  };
}

export interface PerformanceSettings {
  rendering: {
    gpuAcceleration: boolean;
    vsync: boolean;
    frameRate: 30 | 60 | 120 | 144;
    antiAliasing: boolean;
  };
  memory: {
    maxHeapSize: number;
    garbageCollection: 'auto' | 'aggressive' | 'conservative';
    cacheSize: number;
  };
  network: {
    maxConnections: number;
    timeout: number;
    retries: number;
    compression: boolean;
  };
  files: {
    watcherExclude: string[];
    maxFileSize: number;
    indexingEnabled: boolean;
    indexingThreads: number;
  };
  search: {
    maxResults: number;
    fuzzyMatching: boolean;
    cacheResults: boolean;
  };
}

export interface AccessibilitySettings {
  screenReader: {
    enabled: boolean;
    announceChanges: boolean;
    announceErrors: boolean;
    verbosity: 'low' | 'medium' | 'high';
  };
  keyboard: {
    navigation: boolean;
    shortcuts: boolean;
    stickyKeys: boolean;
    slowKeys: boolean;
    bounceKeys: boolean;
  };
  visual: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  };
  audio: {
    soundEnabled: boolean;
    volume: number;
    notifications: boolean;
  };
}

export interface Settings {
  editor: EditorSettings;
  terminal: TerminalSettings;
  ai: AISettings;
  collaboration: CollaborationSettings;
  security: SecuritySettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  appearance: {
    theme: string;
    colorScheme: 'light' | 'dark' | 'auto';
    accentColor: string;
    fontSize: number;
    fontFamily: string;
    density: 'compact' | 'comfortable' | 'spacious';
    animations: boolean;
    transparency: number;
  };
  workspace: {
    autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
    autoSaveDelay: number;
    files: {
      exclude: string[];
      watcherExclude: string[];
      associations: Record<string, string>;
      encoding: string;
      eol: '\n' | '\r\n' | 'auto';
      trimTrailingWhitespace: boolean;
      insertFinalNewline: boolean;
      trimFinalNewlines: boolean;
    };
    search: {
      exclude: string[];
      useRipgrep: boolean;
      followSymlinks: boolean;
      smartCase: boolean;
    };
  };
  extensions: {
    autoUpdate: boolean;
    autoCheckUpdates: boolean;
    ignoreRecommendations: boolean;
    showRecommendationsOnlyOnDemand: boolean;
  };
  telemetry: {
    enableTelemetry: boolean;
    enableCrashReporter: boolean;
    telemetryLevel: 'off' | 'error' | 'crash' | 'all';
  };
  update: {
    mode: 'none' | 'manual' | 'start' | 'default';
    channel: 'stable' | 'insider';
    enableWindowsBackgroundUpdates: boolean;
  };
}

export interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  profiles: SettingsProfile[];
  currentProfile: string;
  syncEnabled: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  validationErrors: Record<string, string[]>;
  searchQuery: string;
  searchResults: SettingsSearchResult[];
  categories: SettingsCategory[];
  recentlyChanged: string[];
}

export interface SettingsProfile {
  id: string;
  name: string;
  description: string;
  settings: Partial<Settings>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsSearchResult {
  key: string;
  path: string;
  title: string;
  description: string;
  value: any;
  category: string;
}

export interface SettingsCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories: SettingsSubcategory[];
}

export interface SettingsSubcategory {
  id: string;
  name: string;
  description: string;
  settings: string[];
}

export interface SettingsActions {
  // Settings Management
  getSetting: <T = any>(key: string) => T;
  setSetting: <T = any>(key: string, value: T) => Promise<void>;
  resetSetting: (key: string) => Promise<void>;
  resetAllSettings: () => Promise<void>;
  
  // Profile Management
  createProfile: (name: string, description: string, settings?: Partial<Settings>) => Promise<string>;
  updateProfile: (profileId: string, updates: Partial<SettingsProfile>) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  exportProfile: (profileId: string) => Promise<string>;
  importProfile: (data: string) => Promise<string>;
  
  // Search & Discovery
  searchSettings: (query: string) => SettingsSearchResult[];
  getSettingsByCategory: (categoryId: string) => SettingsSearchResult[];
  getRecommendedSettings: () => Promise<SettingsSearchResult[]>;
  
  // Validation
  validateSetting: (key: string, value: any) => string[];
  validateAllSettings: () => Record<string, string[]>;
  
  // Sync & Backup
  syncSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<void>;
  backupSettings: () => Promise<string>;
  restoreSettings: (backupData: string) => Promise<void>;
  
  // AI Integration
  optimizeSettings: () => Promise<Partial<Settings>>;
  getSettingsRecommendations: () => Promise<SettingsSearchResult[]>;
  explainSetting: (key: string) => Promise<string>;
  
  // Monitoring
  getSettingsUsage: () => Promise<Record<string, number>>;
  getPerformanceImpact: () => Promise<Record<string, number>>;
}

const DEFAULT_SETTINGS: Settings = {
  editor: {
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineHeight: 1.5,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off',
    wordWrapColumn: 80,
    minimap: {
      enabled: true,
      side: 'right',
      size: 'proportional',
      showSlider: 'mouseover'
    },
    lineNumbers: 'on',
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    renderWhitespace: 'selection',
    renderControlCharacters: false,
    renderIndentGuides: true,
    highlightActiveIndentGuide: true,
    bracketPairColorization: true,
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    autoSurround: 'languageDefined',
    formatOnSave: true,
    formatOnPaste: true,
    formatOnType: false,
    trimAutoWhitespace: true,
    acceptSuggestionOnEnter: 'on',
    acceptSuggestionOnCommitCharacter: true,
    snippetSuggestions: 'top',
    emptySelectionClipboard: true,
    copyWithSyntaxHighlighting: true,
    multiCursorModifier: 'ctrlCmd',
    accessibilitySupport: 'auto',
    folding: true,
    foldingStrategy: 'auto',
    showFoldingControls: 'mouseover',
    unfoldOnClickAfterEndOfLine: false,
    matchBrackets: 'always',
    glyphMargin: true,
    smoothScrolling: false,
    scrollBeyondLastLine: true,
    scrollBeyondLastColumn: 5,
    columnSelection: false,
    mouseWheelZoom: false,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    quickSuggestionsDelay: 10,
    parameterHints: {
      enabled: true,
      cycle: false
    },
    autoIndent: 'full',
    contextmenu: true,
    mouseWheelScrollSensitivity: 1,
    fastScrollSensitivity: 5,
    scrollPredominantAxis: true,
    selectionHighlight: true,
    occurrencesHighlight: true,
    codeLens: true,
    lightbulb: {
      enabled: true
    },
    codeActionsOnSave: {
      'source.organizeImports': true,
      'source.fixAll': false
    },
    rulers: [],
    colorDecorators: true,
    semanticHighlighting: {
      enabled: true
    },
    unicodeHighlight: {
      ambiguousCharacters: true,
      invisibleCharacters: true
    }
  },
  terminal: {
    shell: {
      windows: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      linux: '/bin/bash',
      osx: '/bin/zsh'
    },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineHeight: 1.2,
    cursorStyle: 'block',
    cursorBlinking: true,
    scrollback: 1000,
    fastScrollModifier: 'alt',
    rightClickBehavior: 'copyPaste',
    copyOnSelection: false,
    allowChords: true,
    allowMnemonics: true,
    drawBoldTextInBrightColors: true,
    experimentalBufferImpl: 'TypedArray',
    macOptionIsMeta: false,
    macOptionClickForcesSelection: false,
    altClickMovesCursor: true,
    gpuAcceleration: 'auto',
    localEchoLatencyThreshold: 30,
    localEchoExcludePrograms: ['vim', 'vi', 'nano', 'tmux'],
    localEchoStyle: 'dim',
    enableBell: false,
    env: {},
    cwd: '',
    detectLocale: 'auto',
    unicodeVersion: '11',
    wordSeparators: ' ()[]{}\',"`\';./<>?:"',
    enableFileLinks: true,
    confirmOnExit: 'never',
    enablePersistentSessions: true,
    persistentSessionReviveProcess: 'onExit',
    tabs: {
      enabled: true,
      hideCondition: 'singleTerminal',
      location: 'right',
      showActiveTerminal: 'singleTerminalOrNarrow',
      showActions: 'singleTerminalOrNarrow'
    }
  },
  ai: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    timeout: 30000,
    retries: 3,
    streaming: true,
    contextWindow: 8192,
    systemPrompt: 'You are an AI assistant helping with code development.',
    codeGeneration: {
      enabled: true,
      autoComplete: true,
      inlineCompletion: true,
      multiLineCompletion: true,
      commentGeneration: true,
      docstringGeneration: true,
      testGeneration: true,
      refactoring: true
    },
    codeAnalysis: {
      enabled: true,
      bugDetection: true,
      performanceAnalysis: true,
      securityAnalysis: true,
      codeReview: true,
      complexityAnalysis: true,
      duplicateDetection: true
    },
    chat: {
      enabled: true,
      contextAware: true,
      projectContext: true,
      fileContext: true,
      historyLength: 50,
      autoSave: true
    },
    privacy: {
      sendTelemetry: false,
      sendCode: true,
      sendComments: false,
      sendFilenames: false,
      anonymizeData: true
    },
    experimental: {
      voiceInput: false,
      imageGeneration: false,
      multiModal: false,
      agentMode: false
    }
  },
  collaboration: {
    enabled: true,
    autoJoin: false,
    shareByDefault: false,
    allowAnonymous: false,
    maxParticipants: 10,
    sessionTimeout: 3600000,
    voice: {
      enabled: true,
      autoMute: true,
      noiseSuppression: true,
      echoCancellation: true,
      quality: 'medium'
    },
    video: {
      enabled: true,
      autoDisable: false,
      resolution: '720p',
      frameRate: 30
    },
    screen: {
      shareEnabled: true,
      allowControl: false,
      quality: 'medium'
    },
    chat: {
      enabled: true,
      showNotifications: true,
      soundEnabled: true,
      historyLength: 100
    },
    cursors: {
      showOtherCursors: true,
      showNames: true,
      fadeTimeout: 5000
    },
    awareness: {
      showPresence: true,
      showActivity: true,
      updateInterval: 1000
    }
  },
  security: {
    authentication: {
      required: false,
      method: 'password',
      sessionTimeout: 3600000,
      rememberDevice: false
    },
    encryption: {
      enabled: true,
      algorithm: 'AES-256',
      keyRotation: 86400000
    },
    network: {
      allowedDomains: [],
      blockedDomains: [],
      requireHttps: true,
      certificateValidation: true
    },
    files: {
      scanUploads: true,
      allowedExtensions: [],
      blockedExtensions: ['.exe', '.bat', '.cmd', '.scr'],
      maxFileSize: 104857600
    },
    code: {
      scanForSecrets: true,
      scanForVulnerabilities: true,
      allowExecution: false,
      sandboxMode: true
    },
    audit: {
      enabled: true,
      logLevel: 'info',
      retention: 2592000000,
      exportEnabled: false
    }
  },
  performance: {
    rendering: {
      gpuAcceleration: true,
      vsync: true,
      frameRate: 60,
      antiAliasing: true
    },
    memory: {
      maxHeapSize: 2048,
      garbageCollection: 'auto',
      cacheSize: 256
    },
    network: {
      maxConnections: 10,
      timeout: 30000,
      retries: 3,
      compression: true
    },
    files: {
      watcherExclude: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      maxFileSize: 52428800,
      indexingEnabled: true,
      indexingThreads: 4
    },
    search: {
      maxResults: 1000,
      fuzzyMatching: true,
      cacheResults: true
    }
  },
  accessibility: {
    screenReader: {
      enabled: false,
      announceChanges: true,
      announceErrors: true,
      verbosity: 'medium'
    },
    keyboard: {
      navigation: true,
      shortcuts: true,
      stickyKeys: false,
      slowKeys: false,
      bounceKeys: false
    },
    visual: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      colorBlindness: 'none'
    },
    audio: {
      soundEnabled: true,
      volume: 0.5,
      notifications: true
    }
  },
  appearance: {
    theme: 'dark',
    colorScheme: 'auto',
    accentColor: '#007ACC',
    fontSize: 13,
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    density: 'comfortable',
    animations: true,
    transparency: 0.95
  },
  workspace: {
    autoSave: 'afterDelay',
    autoSaveDelay: 1000,
    files: {
      exclude: ['**/node_modules', '**/.git', '**/.DS_Store'],
      watcherExclude: ['**/node_modules/**', '**/.git/objects/**', '**/.git/subtree-cache/**'],
      associations: {},
      encoding: 'utf8',
      eol: 'auto',
      trimTrailingWhitespace: false,
      insertFinalNewline: false,
      trimFinalNewlines: false
    },
    search: {
      exclude: ['**/node_modules', '**/.git', '**/dist', '**/build'],
      useRipgrep: true,
      followSymlinks: true,
      smartCase: true
    }
  },
  extensions: {
    autoUpdate: true,
    autoCheckUpdates: true,
    ignoreRecommendations: false,
    showRecommendationsOnlyOnDemand: false
  },
  telemetry: {
    enableTelemetry: false,
    enableCrashReporter: true,
    telemetryLevel: 'error'
  },
  update: {
    mode: 'default',
    channel: 'stable',
    enableWindowsBackgroundUpdates: true
  }
};

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'editor',
    name: 'Editor',
    icon: 'edit',
    description: 'Code editor settings and preferences',
    subcategories: [
      {
        id: 'editor.general',
        name: 'General',
        description: 'Basic editor settings',
        settings: ['editor.fontSize', 'editor.fontFamily', 'editor.tabSize']
      },
      {
        id: 'editor.display',
        name: 'Display',
        description: 'Visual display options',
        settings: ['editor.minimap', 'editor.lineNumbers', 'editor.wordWrap']
      }
    ]
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    icon: 'robot',
    description: 'AI-powered features and settings',
    subcategories: [
      {
        id: 'ai.general',
        name: 'General',
        description: 'Basic AI settings',
        settings: ['ai.provider', 'ai.model', 'ai.temperature']
      },
      {
        id: 'ai.features',
        name: 'Features',
        description: 'AI feature toggles',
        settings: ['ai.codeGeneration', 'ai.codeAnalysis', 'ai.chat']
      }
    ]
  }
];

export function useSettings(): SettingsState & SettingsActions {
  const [state, setState] = useState<SettingsState>({
    settings: DEFAULT_SETTINGS,
    isLoading: false,
    error: null,
    isDirty: false,
    lastSaved: null,
    profiles: [
      {
        id: 'default',
        name: 'Default',
        description: 'Default settings profile',
        settings: DEFAULT_SETTINGS,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    currentProfile: 'default',
    syncEnabled: false,
    syncStatus: 'idle',
    validationErrors: {},
    searchQuery: '',
    searchResults: [],
    categories: SETTINGS_CATEGORIES,
    recentlyChanged: []
  });

  const { generateCode } = useAI();
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings when changed
  useEffect(() => {
    if (state.isDirty) {
      const timer = setTimeout(() => {
        saveSettings();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.isDirty]);

  const loadSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const stored = localStorage.getItem('nexus-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        settingsRef.current = { ...DEFAULT_SETTINGS, ...settings };
        
        setState(prev => ({
          ...prev,
          settings: settingsRef.current,
          lastSaved: new Date(),
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load settings',
        isLoading: false
      }));
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      localStorage.setItem('nexus-settings', JSON.stringify(settingsRef.current));
      
      setState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to save settings'
      }));
    }
  }, []);

  const getSetting = useCallback(<T = any>(key: string): T => {
    const keys = key.split('.');
    let value: any = settingsRef.current;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return value as T;
  }, []);

  const setSetting = useCallback(async <T = any>(key: string, value: T): Promise<void> => {
    const keys = key.split('.');
    const newSettings = { ...settingsRef.current };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
    settingsRef.current = newSettings;
    
    setState(prev => ({
      ...prev,
      settings: newSettings,
      isDirty: true,
      recentlyChanged: [key, ...prev.recentlyChanged.slice(0, 9)]
    }));
  }, []);

  const searchSettings = useCallback((query: string): SettingsSearchResult[] => {
    if (!query.trim()) return [];
    
    const results: SettingsSearchResult[] = [];
    const searchTerm = query.toLowerCase();
    
    const searchObject = (obj: any, path: string = '', category: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        if (key.toLowerCase().includes(searchTerm) || 
            title.toLowerCase().includes(searchTerm)) {
          results.push({
            key: currentPath,
            path: currentPath,
            title,
            description: `Setting: ${currentPath}`,
            value,
            category: category || path.split('.')[0] || 'general'
          });
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          searchObject(value, currentPath, category || path.split('.')[0]);
        }
      }
    };
    
    searchObject(settingsRef.current);
    
    setState(prev => ({
      ...prev,
      searchQuery: query,
      searchResults: results
    }));
    
    return results;
  }, []);

  const optimizeSettings = useCallback(async (): Promise<Partial<Settings>> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const prompt = `Analyze these IDE settings and suggest optimizations for better performance and user experience:

${JSON.stringify(settingsRef.current, null, 2)}

Return optimized settings as JSON with explanations for each change.`;
      
      const response = await generateCode(prompt, 'json');
      
      let optimizedSettings: Partial<Settings>;
      try {
        optimizedSettings = JSON.parse(response || '{}');
      } catch {
        throw new Error('Failed to parse AI response');
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return optimizedSettings;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to optimize settings',
        isLoading: false
      }));
      return {};
    }
  }, [generateCode]);

  const explainSetting = useCallback(async (key: string): Promise<string> => {
    const value = getSetting(key);
    const prompt = `Explain this IDE setting in simple terms:

Setting: ${key}
Value: ${JSON.stringify(value)}

Provide a clear explanation of what this setting does and how it affects the user experience.`;
    
    try {
      const explanation = await generateCode(prompt, 'text');
      return explanation || 'No explanation available.';
    } catch {
      return 'Failed to generate explanation.';
    }
  }, [getSetting, generateCode]);

  return {
    ...state,
    getSetting,
    setSetting,
    resetSetting: async (key: string) => {
      // Implementation for resetting individual setting
    },
    resetAllSettings: async () => {
      settingsRef.current = DEFAULT_SETTINGS;
      setState(prev => ({
        ...prev,
        settings: DEFAULT_SETTINGS,
        isDirty: true
      }));
    },
    createProfile: async () => '',
    updateProfile: async () => {},
    deleteProfile: async () => {},
    switchProfile: async () => {},
    exportProfile: async () => '',
    importProfile: async () => '',
    searchSettings,
    getSettingsByCategory: () => [],
    getRecommendedSettings: async () => [],
    validateSetting: () => [],
    validateAllSettings: () => ({}),
    syncSettings: async () => {},
    exportSettings: async () => JSON.stringify(settingsRef.current),
    importSettings: async (data: string) => {
      try {
        const imported = JSON.parse(data);
        settingsRef.current = { ...DEFAULT_SETTINGS, ...imported };
        setState(prev => ({
          ...prev,
          settings: settingsRef.current,
          isDirty: true
        }));
      } catch {
        throw new Error('Invalid settings data');
      }
    },
    backupSettings: async () => JSON.stringify(settingsRef.current),
    restoreSettings: async () => {},
    optimizeSettings,
    getSettingsRecommendations: async () => [],
    explainSetting,
    getSettingsUsage: async () => ({}),
    getPerformanceImpact: async () => ({})
  };
}

export default useSettings;