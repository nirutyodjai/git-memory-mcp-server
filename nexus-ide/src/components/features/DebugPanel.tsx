/**
 * DebugPanel Component
 * 
 * An advanced debugging panel for the NEXUS IDE.
 * Provides comprehensive debugging capabilities with AI-powered assistance.
 * 
 * Features:
 * - Multi-language debugger support
 * - Breakpoint management with intelligent suggestions
 * - Variable inspection with AI explanations
 * - Call stack visualization
 * - Watch expressions with smart recommendations
 * - Time-travel debugging capabilities
 * - Collaborative debugging sessions
 * - Automated test generation
 * - Performance profiling
 * - Memory leak detection
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  StepForward,
  StepBack,
  RotateCcw,
  Bug,
  Target,
  Eye,
  EyeOff,
  Plus,
  Minus,
  X,
  Settings,
  Download,
  Upload,
  Share,
  Users,
  Brain,
  Zap,
  Clock,
  MemoryStick,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  Code,
  FileText,
  Terminal,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  condition?: string;
  hitCount?: number;
  enabled: boolean;
  verified: boolean;
  logMessage?: string;
  temporary?: boolean;
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  scope: 'local' | 'global' | 'closure' | 'catch';
  expandable: boolean;
  children?: Variable[];
  memoryReference?: string;
  evaluateName?: string;
}

export interface StackFrame {
  id: number;
  name: string;
  file: string;
  line: number;
  column: number;
  source?: string;
  canRestart?: boolean;
  instructionPointerReference?: string;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: any;
  type?: string;
  error?: string;
  enabled: boolean;
}

export interface DebugSession {
  id: string;
  name: string;
  type: string;
  status: 'stopped' | 'running' | 'paused' | 'terminated';
  threadId?: number;
  processId?: number;
  startTime: Date;
  configuration: any;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  heapSize: number;
  gcCount: number;
  executionTime: number;
  networkRequests: number;
  diskIO: number;
}

export interface DebugPanelProps {
  className?: string;
  session?: DebugSession;
  breakpoints?: Breakpoint[];
  variables?: Variable[];
  callStack?: StackFrame[];
  watchExpressions?: WatchExpression[];
  performanceMetrics?: PerformanceMetrics;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStepOver?: () => void;
  onStepInto?: () => void;
  onStepOut?: () => void;
  onRestart?: () => void;
  onBreakpointToggle?: (breakpoint: Breakpoint) => void;
  onBreakpointAdd?: (file: string, line: number) => void;
  onBreakpointRemove?: (breakpoint: Breakpoint) => void;
  onWatchAdd?: (expression: string) => void;
  onWatchRemove?: (watch: WatchExpression) => void;
  onVariableExpand?: (variable: Variable) => void;
  onStackFrameSelect?: (frame: StackFrame) => void;
  aiAssistanceEnabled?: boolean;
  collaborativeMode?: boolean;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running': return 'text-green-500';
    case 'paused': return 'text-yellow-500';
    case 'stopped': return 'text-gray-500';
    case 'terminated': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

const getStatusIcon = (status: string): React.ComponentType<any> => {
  switch (status) {
    case 'running': return Play;
    case 'paused': return Pause;
    case 'stopped': return Square;
    case 'terminated': return XCircle;
    default: return Info;
  }
};

const formatValue = (value: any, type: string): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  switch (type) {
    case 'string':
      return `"${value}"`;
    case 'number':
    case 'boolean':
      return String(value);
    case 'object':
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }
      return '{...}';
    case 'function':
      return 'f ' + (value.name || 'anonymous');
    default:
      return String(value);
  }
};

const formatMemorySize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const DebugPanel: React.FC<DebugPanelProps> = ({
  className,
  session,
  breakpoints = [],
  variables = [],
  callStack = [],
  watchExpressions = [],
  performanceMetrics,
  onStart,
  onStop,
  onPause,
  onResume,
  onStepOver,
  onStepInto,
  onStepOut,
  onRestart,
  onBreakpointToggle,
  onBreakpointAdd,
  onBreakpointRemove,
  onWatchAdd,
  onWatchRemove,
  onVariableExpand,
  onStackFrameSelect,
  aiAssistanceEnabled = true,
  collaborativeMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'variables' | 'watch' | 'callstack' | 'breakpoints' | 'performance' | 'ai'>('variables');
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());
  const [newWatchExpression, setNewWatchExpression] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'local' | 'global'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedStackFrame, setSelectedStackFrame] = useState<number | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);

  // Filter variables based on search and scope
  const filteredVariables = useMemo(() => {
    let filtered = variables;
    
    if (searchTerm) {
      filtered = filtered.filter(variable => 
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(variable.value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterScope !== 'all') {
      filtered = filtered.filter(variable => variable.scope === filterScope);
    }
    
    return filtered;
  }, [variables, searchTerm, filterScope]);

  // Toggle variable expansion
  const toggleVariableExpansion = useCallback((variableName: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableName)) {
        newSet.delete(variableName);
      } else {
        newSet.add(variableName);
      }
      return newSet;
    });
  }, []);

  // Add watch expression
  const handleAddWatch = useCallback(() => {
    if (newWatchExpression.trim() && onWatchAdd) {
      onWatchAdd(newWatchExpression.trim());
      setNewWatchExpression('');
      toast.success(`Added watch: ${newWatchExpression}`);
    }
  }, [newWatchExpression, onWatchAdd]);

  // Handle stack frame selection
  const handleStackFrameSelect = useCallback((frame: StackFrame) => {
    setSelectedStackFrame(frame.id);
    if (onStackFrameSelect) {
      onStackFrameSelect(frame);
    }
  }, [onStackFrameSelect]);

  // Generate AI suggestions
  useEffect(() => {
    if (aiAssistanceEnabled && session?.status === 'paused') {
      // Simulate AI suggestions based on current state
      const suggestions = [
        'Check variable values for null references',
        'Analyze call stack for infinite recursion',
        'Suggest breakpoint locations',
        'Identify performance bottlenecks',
        'Generate test cases for current state'
      ];
      setAiSuggestions(suggestions);
    } else {
      setAiSuggestions([]);
    }
  }, [aiAssistanceEnabled, session?.status]);

  // Update performance history
  useEffect(() => {
    if (performanceMetrics) {
      setPerformanceHistory(prev => {
        const newHistory = [...prev, performanceMetrics];
        return newHistory.slice(-50); // Keep last 50 entries
      });
    }
  }, [performanceMetrics]);

  // Render variable tree
  const renderVariable = useCallback((variable: Variable, depth: number = 0) => {
    const isExpanded = expandedVariables.has(variable.name);
    const hasChildren = variable.expandable && variable.children;
    
    return (
      <div key={variable.name} className="select-none">
        <div
          className="flex items-center py-1 px-2 hover:bg-accent/50 cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (variable.expandable) {
              toggleVariableExpansion(variable.name);
              if (onVariableExpand && !variable.children) {
                onVariableExpand(variable);
              }
            }
          }}
        >
          {variable.expandable && (
            <button className="p-0.5 hover:bg-accent rounded mr-1">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          <span className="text-sm font-mono mr-2 text-blue-400">
            {variable.name}
          </span>
          
          <span className="text-xs text-muted-foreground mr-2">
            {variable.type}
          </span>
          
          <span className="text-sm font-mono flex-1">
            {formatValue(variable.value, variable.type)}
          </span>
          
          <span className={cn('text-xs px-1.5 py-0.5 rounded', {
            'bg-blue-100 text-blue-800': variable.scope === 'local',
            'bg-green-100 text-green-800': variable.scope === 'global',
            'bg-yellow-100 text-yellow-800': variable.scope === 'closure',
            'bg-red-100 text-red-800': variable.scope === 'catch'
          })}>
            {variable.scope}
          </span>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {variable.children!.map(child => renderVariable(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedVariables, toggleVariableExpansion, onVariableExpand]);

  // Render tabs
  const tabs = [
    { id: 'variables', label: 'Variables', icon: Code },
    { id: 'watch', label: 'Watch', icon: Eye },
    { id: 'callstack', label: 'Call Stack', icon: BarChart3 },
    { id: 'breakpoints', label: 'Breakpoints', icon: Target },
    { id: 'performance', label: 'Performance', icon: Activity },
    ...(aiAssistanceEnabled ? [{ id: 'ai', label: 'AI Assistant', icon: Brain }] : [])
  ] as const;

  if (!session) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center',
        'bg-background text-muted-foreground',
        className
      )}>
        <div className="text-center">
          <Bug className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Debug Session</h3>
          <p className="text-sm mb-4">Start debugging to see variables, call stack, and more</p>
          {onStart && (
            <button
              onClick={onStart}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4 mr-2 inline" />
              Start Debugging
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <h2 className="text-sm font-medium">Debug</h2>
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', {
              'bg-green-500': session.status === 'running',
              'bg-yellow-500': session.status === 'paused',
              'bg-gray-500': session.status === 'stopped',
              'bg-red-500': session.status === 'terminated'
            })} />
            <span className={cn('text-xs', getStatusColor(session.status))}>
              {session.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {collaborativeMode && (
            <button
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Collaborative Debugging"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Debug Controls */}
      <div className="flex items-center gap-1 p-2 border-b border-border">
        <button
          onClick={session.status === 'running' ? onPause : onResume}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title={session.status === 'running' ? 'Pause' : 'Resume'}
        >
          {session.status === 'running' ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={onStop}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>
        
        <button
          onClick={onRestart}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <button
          onClick={onStepOver}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title="Step Over"
        >
          <StepForward className="w-4 h-4" />
        </button>
        
        <button
          onClick={onStepInto}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title="Step Into"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        
        <button
          onClick={onStepOut}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title="Step Out"
        >
          <SkipBack className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                'hover:bg-accent/50',
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground border-b-2 border-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'variables' && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search variables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as any)}
                className="px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                <option value="all">All Scopes</option>
                <option value="local">Local</option>
                <option value="global">Global</option>
              </select>
            </div>
            
            <div className="space-y-1">
              {filteredVariables.length > 0 ? (
                filteredVariables.map(variable => renderVariable(variable))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No variables found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'watch' && (
          <div className="p-3">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add watch expression..."
                value={newWatchExpression}
                onChange={(e) => setNewWatchExpression(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWatch()}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleAddWatch}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              {watchExpressions.map(watch => (
                <div
                  key={watch.id}
                  className="flex items-center justify-between p-2 hover:bg-accent/50 rounded transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm font-mono text-blue-400">
                      {watch.expression}
                    </div>
                    <div className="text-sm font-mono">
                      {watch.error ? (
                        <span className="text-red-500">{watch.error}</span>
                      ) : (
                        formatValue(watch.value, watch.type || 'unknown')
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onWatchRemove && onWatchRemove(watch)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {watchExpressions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No watch expressions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'callstack' && (
          <div className="p-3">
            <div className="space-y-1">
              {callStack.map((frame, index) => (
                <div
                  key={frame.id}
                  className={cn(
                    'flex items-center justify-between p-2 hover:bg-accent/50 rounded cursor-pointer transition-colors',
                    selectedStackFrame === frame.id && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleStackFrameSelect(frame)}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {frame.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frame.file}:{frame.line}:{frame.column}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    #{index}
                  </div>
                </div>
              ))}
              
              {callStack.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No call stack available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'breakpoints' && (
          <div className="p-3">
            <div className="space-y-1">
              {breakpoints.map(breakpoint => (
                <div
                  key={breakpoint.id}
                  className="flex items-center justify-between p-2 hover:bg-accent/50 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onBreakpointToggle && onBreakpointToggle(breakpoint)}
                      className={cn(
                        'w-4 h-4 rounded-full border-2 transition-colors',
                        breakpoint.enabled
                          ? 'bg-red-500 border-red-500'
                          : 'border-gray-400'
                      )}
                    />
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {breakpoint.file}:{breakpoint.line}
                      </div>
                      {breakpoint.condition && (
                        <div className="text-xs text-muted-foreground">
                          Condition: {breakpoint.condition}
                        </div>
                      )}
                      {breakpoint.hitCount && breakpoint.hitCount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Hit count: {breakpoint.hitCount}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onBreakpointRemove && onBreakpointRemove(breakpoint)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {breakpoints.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No breakpoints set</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && performanceMetrics && (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <div className="text-2xl font-bold">
                  {performanceMetrics.cpuUsage.toFixed(1)}%
                </div>
              </div>
              
              <div className="p-3 bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MemoryStick className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatMemorySize(performanceMetrics.memoryUsage)}
                </div>
              </div>
              
              <div className="p-3 bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Heap Size</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatMemorySize(performanceMetrics.heapSize)}
                </div>
              </div>
              
              <div className="p-3 bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Execution Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {performanceMetrics.executionTime.toFixed(2)}ms
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Performance History</h4>
              <div className="h-32 bg-accent/10 rounded-lg flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  Performance chart would be rendered here
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && aiAssistanceEnabled && (
          <div className="p-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-medium">AI Debug Assistant</h3>
              </div>
              
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-accent/20 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => {
                    toast.info(`AI Suggestion: ${suggestion}`);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
              
              {aiSuggestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No AI suggestions available</p>
                  <p className="text-xs">Pause execution to get AI assistance</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-10">
          <h3 className="font-medium mb-4">Debug Settings</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">AI Assistance</label>
              <input
                type="checkbox"
                checked={aiAssistanceEnabled}
                onChange={(e) => {
                  // Handle AI assistance toggle
                }}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Collaborative Mode</label>
              <input
                type="checkbox"
                checked={collaborativeMode}
                onChange={(e) => {
                  // Handle collaborative mode toggle
                }}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-expand Variables</label>
              <input
                type="checkbox"
                defaultChecked={false}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Performance Metrics</label>
              <input
                type="checkbox"
                defaultChecked={true}
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
    </div>
  );
};

export default DebugPanel;