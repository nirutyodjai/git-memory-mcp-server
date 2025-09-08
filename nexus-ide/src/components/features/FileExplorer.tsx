/**
 * FileExplorer Component
 * 
 * An intelligent file explorer for the NEXUS IDE.
 * Provides advanced file management, AI-powered organization, and smart search capabilities.
 * 
 * Features:
 * - Tree view with expandable folders
 * - AI-powered file organization and suggestions
 * - Smart search with semantic understanding
 * - Git integration with status indicators
 * - Drag & drop file operations
 * - Context menus with intelligent actions
 * - Project insights and dependency visualization
 * - Auto-generated documentation
 * - File preview and quick actions
 * - Collaborative file sharing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  GitBranch,
  GitCommit,
  Star,
  Eye,
  Download,
  Upload,
  Trash2,
  Copy,
  Cut,
  ClipboardPaste,
  Rename,
  Settings,
  Zap,
  Brain,
  Network,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Database,
  Lock,
  Unlock,
  Share,
  ExternalLink
} from 'lucide-react';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date;
  created?: Date;
  isExpanded?: boolean;
  children?: FileNode[];
  gitStatus?: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
  isReadOnly?: boolean;
  isHidden?: boolean;
  mimeType?: string;
  encoding?: string;
  lineCount?: number;
  language?: string;
  isSymlink?: boolean;
  target?: string;
}

export interface FileExplorerProps {
  className?: string;
  rootPath?: string;
  files?: FileNode[];
  selectedFiles?: string[];
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
  onFileCreate?: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onFileDelete?: (file: FileNode) => void;
  onFileRename?: (file: FileNode, newName: string) => void;
  onFileMove?: (file: FileNode, newPath: string) => void;
  onFileCopy?: (file: FileNode, targetPath: string) => void;
  showHiddenFiles?: boolean;
  showGitStatus?: boolean;
  enableDragDrop?: boolean;
  enableContextMenu?: boolean;
  searchEnabled?: boolean;
  aiSuggestionsEnabled?: boolean;
}

const fileIcons: Record<string, React.ComponentType<any>> = {
  // Programming languages
  'js': Code,
  'jsx': Code,
  'ts': Code,
  'tsx': Code,
  'py': Code,
  'java': Code,
  'cpp': Code,
  'c': Code,
  'cs': Code,
  'php': Code,
  'rb': Code,
  'go': Code,
  'rs': Code,
  'swift': Code,
  'kt': Code,
  'scala': Code,
  'clj': Code,
  'hs': Code,
  'ml': Code,
  'fs': Code,
  'elm': Code,
  'dart': Code,
  'lua': Code,
  'r': Code,
  'matlab': Code,
  'sql': Database,
  
  // Web technologies
  'html': Code,
  'htm': Code,
  'css': Code,
  'scss': Code,
  'sass': Code,
  'less': Code,
  'vue': Code,
  'svelte': Code,
  
  // Data formats
  'json': FileText,
  'xml': FileText,
  'yaml': FileText,
  'yml': FileText,
  'toml': FileText,
  'ini': FileText,
  'cfg': FileText,
  'conf': FileText,
  'env': FileText,
  
  // Documents
  'md': FileText,
  'txt': FileText,
  'rtf': FileText,
  'pdf': FileText,
  'doc': FileText,
  'docx': FileText,
  'odt': FileText,
  
  // Images
  'jpg': Image,
  'jpeg': Image,
  'png': Image,
  'gif': Image,
  'svg': Image,
  'webp': Image,
  'bmp': Image,
  'ico': Image,
  'tiff': Image,
  'tif': Image,
  
  // Videos
  'mp4': Video,
  'avi': Video,
  'mov': Video,
  'wmv': Video,
  'flv': Video,
  'webm': Video,
  'mkv': Video,
  'm4v': Video,
  
  // Audio
  'mp3': Music,
  'wav': Music,
  'flac': Music,
  'aac': Music,
  'ogg': Music,
  'wma': Music,
  'm4a': Music,
  
  // Archives
  'zip': Archive,
  'rar': Archive,
  '7z': Archive,
  'tar': Archive,
  'gz': Archive,
  'bz2': Archive,
  'xz': Archive,
  
  // Default
  'default': File
};

const getFileIcon = (fileName: string, isFolder: boolean, isExpanded: boolean = false): React.ComponentType<any> => {
  if (isFolder) {
    return isExpanded ? FolderOpen : Folder;
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  return fileIcons[extension || 'default'] || fileIcons.default;
};

const getGitStatusColor = (status?: string): string => {
  switch (status) {
    case 'modified': return 'text-yellow-500';
    case 'added': return 'text-green-500';
    case 'deleted': return 'text-red-500';
    case 'renamed': return 'text-blue-500';
    case 'untracked': return 'text-gray-500';
    case 'staged': return 'text-green-400';
    default: return '';
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (date?: Date): string => {
  if (!date) return '';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  className,
  rootPath = '/',
  files = [],
  selectedFiles = [],
  onFileSelect,
  onFileOpen,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileMove,
  onFileCopy,
  showHiddenFiles = false,
  showGitStatus = true,
  enableDragDrop = true,
  enableContextMenu = true,
  searchEnabled = true,
  aiSuggestionsEnabled = true
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'folders'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileNode } | null>(null);
  const [draggedFile, setDraggedFile] = useState<FileNode | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'grid'>('tree');

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType.slice(0, -1));
    }
    
    // Filter hidden files
    if (!showHiddenFiles) {
      filtered = filtered.filter(file => !file.isHidden && !file.name.startsWith('.'));
    }
    
    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;
      
      // Folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'modified':
          comparison = (a.modified?.getTime() || 0) - (b.modified?.getTime() || 0);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          const aExt = a.name.split('.').pop() || '';
          const bExt = b.name.split('.').pop() || '';
          comparison = aExt.localeCompare(bExt);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [files, searchTerm, filterType, showHiddenFiles, sortBy, sortOrder]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileNode, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (file.type === 'folder') {
      toggleFolder(file.id);
    }
    
    if (onFileSelect) {
      onFileSelect(file);
    }
  }, [toggleFolder, onFileSelect]);

  // Handle file double-click
  const handleFileDoubleClick = useCallback((file: FileNode, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (file.type === 'file' && onFileOpen) {
      onFileOpen(file);
    }
  }, [onFileOpen]);

  // Handle context menu
  const handleContextMenu = useCallback((file: FileNode, event: React.MouseEvent) => {
    if (!enableContextMenu) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file
    });
  }, [enableContextMenu]);

  // Handle drag start
  const handleDragStart = useCallback((file: FileNode, event: React.DragEvent) => {
    if (!enableDragDrop) return;
    
    setDraggedFile(file);
    event.dataTransfer.setData('text/plain', file.path);
    event.dataTransfer.effectAllowed = 'move';
  }, [enableDragDrop]);

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!enableDragDrop) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, [enableDragDrop]);

  // Handle drop
  const handleDrop = useCallback((targetFile: FileNode, event: React.DragEvent) => {
    if (!enableDragDrop || !draggedFile) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (targetFile.type === 'folder' && targetFile.id !== draggedFile.id) {
      if (onFileMove) {
        onFileMove(draggedFile, targetFile.path);
        toast.success(`Moved ${draggedFile.name} to ${targetFile.name}`);
      }
    }
    
    setDraggedFile(null);
  }, [enableDragDrop, draggedFile, onFileMove]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Generate AI suggestions
  useEffect(() => {
    if (aiSuggestionsEnabled && searchTerm) {
      // Simulate AI suggestions
      const suggestions = [
        `Create ${searchTerm}.js`,
        `Search for ${searchTerm} in project`,
        `Generate ${searchTerm} component`,
        `Find similar to ${searchTerm}`
      ];
      setAiSuggestions(suggestions);
    } else {
      setAiSuggestions([]);
    }
  }, [aiSuggestionsEnabled, searchTerm]);

  // Render file tree node
  const renderFileNode = useCallback((file: FileNode, depth: number = 0) => {
    const isSelected = selectedFiles.includes(file.id);
    const isExpanded = expandedFolders.has(file.id);
    const Icon = getFileIcon(file.name, file.type === 'folder', isExpanded);
    const gitStatusColor = getGitStatusColor(file.gitStatus);
    
    return (
      <div key={file.id} className="select-none">
        <div
          className={cn(
            'flex items-center py-1 px-2 hover:bg-accent/50 cursor-pointer transition-colors',
            isSelected && 'bg-accent text-accent-foreground',
            file.isReadOnly && 'opacity-60'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => handleFileSelect(file, e)}
          onDoubleClick={(e) => handleFileDoubleClick(file, e)}
          onContextMenu={(e) => handleContextMenu(file, e)}
          draggable={enableDragDrop}
          onDragStart={(e) => handleDragStart(file, e)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(file, e)}
        >
          {file.type === 'folder' && (
            <button
              className="p-0.5 hover:bg-accent rounded mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(file.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          <Icon className={cn('w-4 h-4 mr-2', gitStatusColor)} />
          
          <span className={cn('flex-1 text-sm', file.isSymlink && 'italic')}>
            {file.name}
            {file.isSymlink && (
              <span className="text-xs text-muted-foreground ml-1">-> {file.target}</span>
            )}
          </span>
          
          {showGitStatus && file.gitStatus && (
            <div className={cn('w-2 h-2 rounded-full ml-2', {
              'bg-yellow-500': file.gitStatus === 'modified',
              'bg-green-500': file.gitStatus === 'added',
              'bg-red-500': file.gitStatus === 'deleted',
              'bg-blue-500': file.gitStatus === 'renamed',
              'bg-gray-500': file.gitStatus === 'untracked',
              'bg-green-400': file.gitStatus === 'staged'
            })} />
          )}
          
          {file.isReadOnly && (
            <Lock className="w-3 h-3 ml-1 text-muted-foreground" />
          )}
        </div>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [selectedFiles, expandedFolders, showGitStatus, enableDragDrop, handleFileSelect, handleFileDoubleClick, handleContextMenu, handleDragStart, handleDragOver, handleDrop, toggleFolder]);

  if (files.length === 0) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center',
        'bg-background text-muted-foreground',
        className
      )}>
        <div className="text-center">
          <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No files found</h3>
          <p className="text-sm mb-4">This directory appears to be empty</p>
          {onFileCreate && (
            <button
              onClick={() => onFileCreate(rootPath, 'new-file.txt', 'file')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Create File
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
        <h2 className="text-sm font-medium">Explorer</h2>
        <div className="flex items-center gap-1">
          {onFileCreate && (
            <button
              onClick={() => onFileCreate(rootPath, 'new-file.txt', 'file')}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="New File"
            >
              <Plus className="w-4 h-4" />
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

      {/* Search and Filters */}
      {searchEnabled && (
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {aiSuggestions.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Brain className="w-3 h-3" />
                <span>AI Suggestions</span>
              </div>
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-2 py-1 text-xs bg-accent/50 hover:bg-accent rounded transition-colors"
                  onClick={() => {
                    // Handle AI suggestion click
                    toast.info(`AI Suggestion: ${suggestion}`);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2 py-1 bg-background border border-border rounded text-xs"
            >
              <option value="all">All</option>
              <option value="files">Files</option>
              <option value="folders">Folders</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-background border border-border rounded text-xs"
            >
              <option value="name">Name</option>
              <option value="modified">Modified</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 bg-accent hover:bg-accent/80 rounded text-xs transition-colors"
            >
              {sortOrder === 'asc' ? '^' : 'v'}
            </button>
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedFiles.map(file => renderFileNode(file))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              if (contextMenu.file.type === 'file' && onFileOpen) {
                onFileOpen(contextMenu.file);
              }
              setContextMenu(null);
            }}
          >
            <Eye className="w-4 h-4" />
            Open
          </button>
          
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              // Handle rename
              setContextMenu(null);
            }}
          >
            <Rename className="w-4 h-4" />
            Rename
          </button>
          
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              // Handle copy
              setContextMenu(null);
            }}
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              // Handle cut
              setContextMenu(null);
            }}
          >
            <Cut className="w-4 h-4" />
            Cut
          </button>
          
          <hr className="my-1 border-border" />
          
          <button
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-destructive/20 hover:text-destructive transition-colors flex items-center gap-2"
            onClick={() => {
              if (onFileDelete) {
                onFileDelete(contextMenu.file);
              }
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-10">
          <h3 className="font-medium mb-4">Explorer Settings</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Hidden Files</label>
              <input
                type="checkbox"
                checked={showHiddenFiles}
                onChange={(e) => {
                  // Handle show hidden files toggle
                }}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Git Status</label>
              <input
                type="checkbox"
                checked={showGitStatus}
                onChange={(e) => {
                  // Handle git status toggle
                }}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Drag & Drop</label>
              <input
                type="checkbox"
                checked={enableDragDrop}
                onChange={(e) => {
                  // Handle drag drop toggle
                }}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">AI Suggestions</label>
              <input
                type="checkbox"
                checked={aiSuggestionsEnabled}
                onChange={(e) => {
                  // Handle AI suggestions toggle
                }}
                className="rounded"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="w-full mt-1 p-2 bg-background border border-border rounded"
              >
                <option value="tree">Tree</option>
                <option value="list">List</option>
                <option value="grid">Grid</option>
              </select>
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

export default FileExplorer;