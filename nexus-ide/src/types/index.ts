// Core types for NEXUS IDE

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  isDark: boolean;
}

// File system types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  created?: Date;
  children?: FileNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  gitStatus?: GitFileStatus;
  language?: string;
  encoding?: string;
  permissions?: FilePermissions;
}

export interface FilePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export type GitFileStatus = 
  | 'untracked'
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'unmerged'
  | 'ignored'
  | 'clean';

// Editor types
export interface EditorTab {
  id: string;
  title: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  isPreview?: boolean;
  cursorPosition?: Position;
  scrollPosition?: Position;
  selections?: Selection[];
  foldingRanges?: FoldingRange[];
  decorations?: EditorDecoration[];
}

export interface Position {
  line: number;
  column: number;
}

export interface Selection {
  start: Position;
  end: Position;
}

export interface FoldingRange {
  start: number;
  end: number;
  kind?: 'comment' | 'imports' | 'region';
}

export interface EditorDecoration {
  id: string;
  range: Selection;
  className?: string;
  hoverMessage?: string;
  type: 'error' | 'warning' | 'info' | 'hint' | 'highlight';
}

// Terminal types
export interface TerminalSession {
  id: string;
  title: string;
  shell: string;
  cwd: string;
  isActive: boolean;
  pid?: number;
  exitCode?: number;
  history: TerminalHistoryEntry[];
  environment?: Record<string, string>;
}

export interface TerminalHistoryEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
}

// MCP types
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: MCPServerStatus;
  capabilities: MCPCapability[];
  version?: string;
  description?: string;
  lastConnected?: Date;
  lastError?: string;
  config?: Record<string, any>;
}

export type MCPServerStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'reconnecting';

export type MCPCapability = 
  | 'git'
  | 'file-system'
  | 'search'
  | 'ai'
  | 'database'
  | 'api'
  | 'terminal'
  | 'debug'
  | 'test'
  | 'deploy';

export interface MCPMessage {
  id: string;
  type: MCPMessageType;
  payload: any;
  timestamp: Date;
  serverId?: string;
  response?: MCPMessage;
}

export type MCPMessageType = 
  | 'request'
  | 'response'
  | 'notification'
  | 'error';

// AI types
export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  capabilities: AICapability[];
  maxTokens: number;
  costPerToken?: number;
  isAvailable: boolean;
  description?: string;
}

export type AIProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'microsoft'
  | 'meta'
  | 'local';

export type AICapability = 
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'image-generation'
  | 'image-analysis'
  | 'code-generation'
  | 'code-analysis'
  | 'translation'
  | 'summarization';

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  context?: AIContext;
  created: Date;
  updated: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  attachments?: AIAttachment[];
}

export interface AIContext {
  files: string[];
  project: string;
  language: string;
  framework?: string;
  dependencies?: string[];
}

export interface AIAttachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'error' | 'log';
  name: string;
  content: string;
  metadata?: Record<string, any>;
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: () => void | Promise<void>;
  category: ShortcutCategory;
  enabled: boolean;
  global?: boolean;
  context?: string[];
}

export type ShortcutCategory = 
  | 'file'
  | 'edit'
  | 'view'
  | 'navigation'
  | 'debug'
  | 'terminal'
  | 'ai'
  | 'git'
  | 'search'
  | 'custom';

// Plugin types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  categories: PluginCategory[];
  capabilities: PluginCapability[];
  dependencies?: PluginDependency[];
  config?: PluginConfig;
  isEnabled: boolean;
  isInstalled: boolean;
  installDate?: Date;
  updateDate?: Date;
}

export type PluginCategory = 
  | 'editor'
  | 'theme'
  | 'language'
  | 'debug'
  | 'git'
  | 'ai'
  | 'productivity'
  | 'utility'
  | 'integration';

export type PluginCapability = 
  | 'commands'
  | 'keybindings'
  | 'themes'
  | 'languages'
  | 'debuggers'
  | 'formatters'
  | 'linters'
  | 'snippets'
  | 'completions'
  | 'hovers'
  | 'definitions'
  | 'references';

export interface PluginDependency {
  id: string;
  version: string;
  optional?: boolean;
}

export interface PluginConfig {
  [key: string]: any;
}

// Project types
export interface Project {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  language: string;
  framework?: string;
  version?: string;
  description?: string;
  repository?: GitRepository;
  dependencies?: ProjectDependency[];
  scripts?: ProjectScript[];
  config?: ProjectConfig;
  created: Date;
  lastOpened: Date;
  isActive: boolean;
}

export type ProjectType = 
  | 'web'
  | 'mobile'
  | 'desktop'
  | 'library'
  | 'cli'
  | 'api'
  | 'game'
  | 'data'
  | 'ml'
  | 'other';

export interface GitRepository {
  url: string;
  branch: string;
  remote: string;
  status: GitStatus;
  commits?: GitCommit[];
  branches?: GitBranch[];
  tags?: GitTag[];
}

export interface GitStatus {
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
  conflicts: number;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface GitBranch {
  name: string;
  isActive: boolean;
  isRemote: boolean;
  lastCommit?: GitCommit;
}

export interface GitTag {
  name: string;
  commit: string;
  date: Date;
  message?: string;
}

export interface ProjectDependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  description?: string;
  homepage?: string;
}

export interface ProjectScript {
  name: string;
  command: string;
  description?: string;
}

export interface ProjectConfig {
  [key: string]: any;
}

// Search types
export interface SearchResult {
  id: string;
  file: string;
  line: number;
  column: number;
  text: string;
  context: string;
  type: SearchResultType;
  score?: number;
}

export type SearchResultType = 
  | 'text'
  | 'symbol'
  | 'file'
  | 'reference'
  | 'definition';

export interface SearchQuery {
  query: string;
  type: SearchType;
  options: SearchOptions;
}

export type SearchType = 
  | 'text'
  | 'regex'
  | 'symbol'
  | 'file'
  | 'semantic';

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  includeFiles?: string[];
  excludeFiles?: string[];
  maxResults?: number;
}

// Debug types
export interface DebugSession {
  id: string;
  name: string;
  type: string;
  status: DebugStatus;
  configuration: DebugConfiguration;
  breakpoints: Breakpoint[];
  callStack?: StackFrame[];
  variables?: Variable[];
  threads?: Thread[];
}

export type DebugStatus = 
  | 'stopped'
  | 'running'
  | 'paused'
  | 'terminated'
  | 'error';

export interface DebugConfiguration {
  name: string;
  type: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  [key: string]: any;
}

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
  enabled: boolean;
  verified: boolean;
}

export interface StackFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column: number;
  source?: string;
}

export interface Variable {
  name: string;
  value: string;
  type?: string;
  variablesReference?: number;
  indexedVariables?: number;
  namedVariables?: number;
}

export interface Thread {
  id: number;
  name: string;
}

// Performance types
export interface PerformanceMetrics {
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  editor: EditorMetrics;
}

export interface CPUMetrics {
  usage: number; // percentage
  cores: number;
  frequency: number; // MHz
}

export interface MemoryMetrics {
  used: number; // bytes
  total: number; // bytes
  available: number; // bytes
  percentage: number;
}

export interface DiskMetrics {
  read: number; // bytes/sec
  write: number; // bytes/sec
  usage: number; // percentage
  available: number; // bytes
}

export interface NetworkMetrics {
  download: number; // bytes/sec
  upload: number; // bytes/sec
  latency: number; // ms
}

export interface EditorMetrics {
  openFiles: number;
  linesOfCode: number;
  charactersTyped: number;
  commandsExecuted: number;
  renderTime: number; // ms
}

// Settings types
export interface Settings {
  editor: EditorSettings;
  terminal: TerminalSettings;
  ai: AISettings;
  git: GitSettings;
  theme: ThemeSettings;
  keyboard: KeyboardSettings;
  performance: PerformanceSettings;
  privacy: PrivacySettings;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  minimap: boolean;
  folding: boolean;
  autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
  autoSaveDelay: number;
  formatOnSave: boolean;
  formatOnPaste: boolean;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
}

export interface TerminalSettings {
  shell: string;
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'line';
  cursorBlink: boolean;
  scrollback: number;
  fastScrollSensitivity: number;
  mouseWheelScrollSensitivity: number;
}

export interface AISettings {
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  autoComplete: boolean;
  contextWindow: number;
  enableTelemetry: boolean;
}

export interface GitSettings {
  autoFetch: boolean;
  fetchInterval: number;
  autoStage: boolean;
  confirmSync: boolean;
  defaultBranch: string;
  signCommits: boolean;
}

export interface ThemeSettings {
  mode: ThemeMode;
  preset: string;
  customColors?: Partial<ThemeColors>;
  animations: boolean;
  transparency: number;
}

export interface KeyboardSettings {
  shortcuts: Record<string, string[]>;
  enableVim: boolean;
  enableEmacs: boolean;
}

export interface PerformanceSettings {
  maxFileSize: number; // bytes
  maxFiles: number;
  enableIndexing: boolean;
  indexingDelay: number;
  renderDelay: number;
}

export interface PrivacySettings {
  telemetry: boolean;
  crashReports: boolean;
  analytics: boolean;
  dataCollection: boolean;
}

// Event types
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: Date;
  source?: string;
}

export interface FileEvent extends AppEvent {
  type: 'file:open' | 'file:close' | 'file:save' | 'file:create' | 'file:delete' | 'file:rename';
  payload: {
    path: string;
    content?: string;
    oldPath?: string;
    newPath?: string;
  };
}

export interface EditorEvent extends AppEvent {
  type: 'editor:change' | 'editor:selection' | 'editor:cursor' | 'editor:scroll';
  payload: {
    tabId: string;
    content?: string;
    selection?: Selection;
    position?: Position;
  };
}

export interface TerminalEvent extends AppEvent {
  type: 'terminal:command' | 'terminal:output' | 'terminal:exit';
  payload: {
    sessionId: string;
    command?: string;
    output?: string;
    exitCode?: number;
  };
}

export interface AIEvent extends AppEvent {
  type: 'ai:request' | 'ai:response' | 'ai:error';
  payload: {
    conversationId: string;
    message?: AIMessage;
    error?: string;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// API types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: Date;
  source?: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
}

// Hook return types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseLocalStorage<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

// Export all types
export * from './notifications';

// Re-export common React types
export type { 
  FC, 
  ReactNode, 
  ComponentProps, 
  RefObject, 
  MutableRefObject 
} from 'react';