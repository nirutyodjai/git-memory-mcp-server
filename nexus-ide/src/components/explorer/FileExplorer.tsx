import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Database,
  Settings,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Plus,
  Trash2,
  Copy,
  Cut,
  Clipboard,
  RefreshCw,
  Download,
  Upload,
  Share,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Tag,
  Clock,
  User,
  Calendar,
  HardDrive,
  Wifi,
  WifiOff,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  AlertCircle,
  CheckCircle,
  XCircle,
  MinusCircle,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Info,
  Zap,
  Bot,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Package,
  Terminal,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Cpu,
  MemoryStick,
  Server,
  Cloud,
  CloudOff,
  Shield,
  ShieldAlert,
  Key,
  Fingerprint,
  QrCode,
  Scan,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Heart,
  HeartOff,
  Bookmark,
  BookmarkOff,
  Flag,
  FlagOff,
  Pin,
  PinOff,
  Link,
  Unlink,
  Maximize,
  Minimize,
  Move,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Scissors,
  PaintBucket,
  Palette,
  Brush,
  Eraser,
  Ruler,
  Compass,
  Triangle,
  Square as SquareIcon,
  Circle,
  Hexagon,
  Pentagon,
  Octagon,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: Date;
  created?: Date;
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  gitStatus?: 'untracked' | 'modified' | 'added' | 'deleted' | 'renamed' | 'copied' | 'unmerged' | 'ignored';
  isHidden?: boolean;
  isSymlink?: boolean;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  tags?: string[];
  description?: string;
  thumbnail?: string;
  preview?: string;
  metadata?: Record<string, any>;
  children?: FileItem[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
  error?: string;
  aiInsights?: {
    complexity: number;
    maintainability: number;
    security: number;
    performance: number;
    suggestions: string[];
    dependencies: string[];
    usageCount: number;
    lastAccessed: Date;
  };
}

interface FileExplorerProps {
  className?: string;
  rootPath?: string;
  showHidden?: boolean;
  showGitStatus?: boolean;
  showAIInsights?: boolean;
  showThumbnails?: boolean;
  showPreview?: boolean;
  viewMode?: 'list' | 'grid' | 'tree';
  sortBy?: 'name' | 'type' | 'size' | 'modified' | 'created';
  sortOrder?: 'asc' | 'desc';
  filterBy?: string;
  selectedFiles?: string[];
  onFileSelect?: (file: FileItem) => void;
  onFileOpen?: (file: FileItem) => void;
  onFileCreate?: (path: string, type: 'file' | 'folder') => void;
  onFileDelete?: (files: FileItem[]) => void;
  onFileRename?: (file: FileItem, newName: string) => void;
  onFileMove?: (files: FileItem[], destination: string) => void;
  onFileCopy?: (files: FileItem[], destination: string) => void;
  onFolderExpand?: (folder: FileItem) => void;
  onFolderCollapse?: (folder: FileItem) => void;
  onContextMenu?: (file: FileItem, event: React.MouseEvent) => void;
}

interface SearchFilter {
  query: string;
  type?: 'all' | 'file' | 'folder';
  extension?: string;
  sizeMin?: number;
  sizeMax?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  gitStatus?: string;
  tags?: string[];
  hasAIInsights?: boolean;
}

interface AIRecommendation {
  id: string;
  type: 'organize' | 'cleanup' | 'optimize' | 'security' | 'refactor';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  files: string[];
  action: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  className = '',
  rootPath = '/',
  showHidden = false,
  showGitStatus = true,
  showAIInsights = true,
  showThumbnails = true,
  showPreview = false,
  viewMode = 'tree',
  sortBy = 'name',
  sortOrder = 'asc',
  filterBy = '',
  selectedFiles = [],
  onFileSelect,
  onFileOpen,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileMove,
  onFileCopy,
  onFolderExpand,
  onFolderCollapse,
  onContextMenu,
}) => {
  const { actualTheme } = useTheme();
  const { servers, sendMessage } = useMCP();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({ query: '' });
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [selectedItems, setSelectedItems] = useState<string[]>(selectedFiles);
  const [clipboard, setClipboard] = useState<{ files: FileItem[]; operation: 'copy' | 'cut' } | null>(null);
  const [draggedItems, setDraggedItems] = useState<FileItem[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ name: string; path: string }>>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [favoriteFiles, setFavoriteFiles] = useState<FileItem[]>([]);
  const [bookmarkedFolders, setBookmarkedFolders] = useState<FileItem[]>([]);
  const [fileHistory, setFileHistory] = useState<Array<{ file: FileItem; timestamp: Date }>>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(new Map());
  const [gitInfo, setGitInfo] = useState<{
    branch: string;
    status: Record<string, string>;
    commits: Array<{ hash: string; message: string; author: string; date: Date }>;
  } | null>(null);
  
  const fileExplorerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // File type icons mapping
  const getFileIcon = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      return file.isExpanded ? FolderOpen : Folder;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, React.ComponentType> = {
      // Code files
      'js': Code, 'jsx': Code, 'ts': Code, 'tsx': Code,
      'py': Code, 'java': Code, 'cpp': Code, 'c': Code,
      'cs': Code, 'php': Code, 'rb': Code, 'go': Code,
      'rs': Code, 'swift': Code, 'kt': Code, 'scala': Code,
      'clj': Code, 'hs': Code, 'ml': Code, 'fs': Code,
      'elm': Code, 'dart': Code, 'lua': Code, 'r': Code,
      'matlab': Code, 'julia': Code, 'perl': Code, 'sh': Terminal,
      'bash': Terminal, 'zsh': Terminal, 'fish': Terminal,
      'ps1': Terminal, 'bat': Terminal, 'cmd': Terminal,
      
      // Web files
      'html': Globe, 'htm': Globe, 'css': Palette,
      'scss': Palette, 'sass': Palette, 'less': Palette,
      'stylus': Palette, 'vue': Globe, 'svelte': Globe,
      'angular': Globe, 'react': Globe,
      
      // Data files
      'json': Database, 'xml': Database, 'yaml': Database,
      'yml': Database, 'toml': Database, 'ini': Settings,
      'conf': Settings, 'config': Settings, 'env': Settings,
      'sql': Database, 'db': Database, 'sqlite': Database,
      'mongodb': Database, 'redis': Database,
      
      // Document files
      'txt': FileText, 'md': FileText, 'markdown': FileText,
      'rst': FileText, 'asciidoc': FileText, 'org': FileText,
      'tex': FileText, 'latex': FileText, 'rtf': FileText,
      'doc': FileText, 'docx': FileText, 'odt': FileText,
      'pdf': FileText, 'epub': FileText, 'mobi': FileText,
      
      // Image files
      'jpg': Image, 'jpeg': Image, 'png': Image, 'gif': Image,
      'svg': Image, 'webp': Image, 'bmp': Image, 'tiff': Image,
      'ico': Image, 'psd': Image, 'ai': Image, 'sketch': Image,
      'figma': Image, 'xd': Image, 'indd': Image,
      
      // Video files
      'mp4': Video, 'avi': Video, 'mkv': Video, 'mov': Video,
      'wmv': Video, 'flv': Video, 'webm': Video, 'm4v': Video,
      '3gp': Video, 'ogv': Video, 'mpg': Video, 'mpeg': Video,
      
      // Audio files
      'mp3': Music, 'wav': Music, 'flac': Music, 'aac': Music,
      'ogg': Music, 'wma': Music, 'm4a': Music, 'opus': Music,
      'aiff': Music, 'au': Music, 'ra': Music,
      
      // Archive files
      'zip': Archive, 'rar': Archive, '7z': Archive, 'tar': Archive,
      'gz': Archive, 'bz2': Archive, 'xz': Archive, 'lz': Archive,
      'lzma': Archive, 'cab': Archive, 'iso': Archive, 'dmg': Archive,
      
      // System files
      'exe': Cpu, 'msi': Cpu, 'deb': Package, 'rpm': Package,
      'appimage': Package, 'snap': Package, 'flatpak': Package,
      'dmg': Package, 'pkg': Package, 'app': Package,
      
      // Mobile files
      'apk': Smartphone, 'ipa': Smartphone, 'aab': Smartphone,
      'xap': Smartphone, 'appx': Smartphone,
      
      // Certificate files
      'pem': Key, 'crt': Key, 'cer': Key, 'p12': Key,
      'pfx': Key, 'jks': Key, 'keystore': Key,
      
      // Log files
      'log': FileText, 'out': FileText, 'err': FileText,
    };

    return iconMap[extension || ''] || File;
  }, []);

  // Get file color based on git status
  const getFileColor = useCallback((file: FileItem) => {
    if (!showGitStatus || !file.gitStatus) return '';
    
    const colorMap: Record<string, string> = {
      'untracked': 'text-green-500',
      'modified': 'text-yellow-500',
      'added': 'text-green-600',
      'deleted': 'text-red-500',
      'renamed': 'text-blue-500',
      'copied': 'text-cyan-500',
      'unmerged': 'text-purple-500',
      'ignored': 'text-gray-400',
    };
    
    return colorMap[file.gitStatus] || '';
  }, [showGitStatus]);

  // Load files from the current path
  const loadFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sendMessage('file-system', {
        action: 'list-files',
        path,
        showHidden,
        includeGitStatus: showGitStatus,
        includeAIInsights: showAIInsights,
        includeThumbnails: showThumbnails,
      });
      
      if (response?.files) {
        setFiles(response.files);
        setCurrentPath(path);
        
        // Update breadcrumbs
        const pathParts = path.split('/').filter(Boolean);
        const newBreadcrumbs = [{ name: 'Root', path: '/' }];
        let currentBreadcrumbPath = '';
        
        pathParts.forEach(part => {
          currentBreadcrumbPath += `/${part}`;
          newBreadcrumbs.push({ name: part, path: currentBreadcrumbPath });
        });
        
        setBreadcrumbs(newBreadcrumbs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [sendMessage, showHidden, showGitStatus, showAIInsights, showThumbnails]);

  // Load git information
  const loadGitInfo = useCallback(async () => {
    try {
      const response = await sendMessage('git', {
        action: 'get-status',
        path: currentPath,
      });
      
      if (response) {
        setGitInfo(response);
      }
    } catch (err) {
      console.error('Failed to load git info:', err);
    }
  }, [sendMessage, currentPath]);

  // Get AI insights for files
  const getAIInsights = useCallback(async (files: FileItem[]) => {
    if (!showAIInsights) return;
    
    setIsAnalyzing(true);
    try {
      const response = await sendMessage('ai-assistant', {
        action: 'analyze-files',
        files: files.map(f => ({ path: f.path, type: f.type, name: f.name })),
      });
      
      if (response?.insights) {
        // Update files with AI insights
        setFiles(prev => prev.map(file => {
          const insight = response.insights.find((i: any) => i.path === file.path);
          return insight ? { ...file, aiInsights: insight } : file;
        }));
      }
      
      if (response?.recommendations) {
        setAiRecommendations(response.recommendations);
      }
    } catch (err) {
      console.error('Failed to get AI insights:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sendMessage, showAIInsights]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file => {
      // Basic search filter
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Advanced search filters
      if (searchFilter.type && searchFilter.type !== 'all' && file.type !== searchFilter.type) {
        return false;
      }
      
      if (searchFilter.extension) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== searchFilter.extension.toLowerCase()) {
          return false;
        }
      }
      
      if (searchFilter.sizeMin && file.size && file.size < searchFilter.sizeMin) {
        return false;
      }
      
      if (searchFilter.sizeMax && file.size && file.size > searchFilter.sizeMax) {
        return false;
      }
      
      if (searchFilter.modifiedAfter && file.modified && file.modified < searchFilter.modifiedAfter) {
        return false;
      }
      
      if (searchFilter.modifiedBefore && file.modified && file.modified > searchFilter.modifiedBefore) {
        return false;
      }
      
      if (searchFilter.gitStatus && file.gitStatus !== searchFilter.gitStatus) {
        return false;
      }
      
      if (searchFilter.tags && searchFilter.tags.length > 0) {
        if (!file.tags || !searchFilter.tags.some(tag => file.tags!.includes(tag))) {
          return false;
        }
      }
      
      if (searchFilter.hasAIInsights && !file.aiInsights) {
        return false;
      }
      
      return true;
    });
    
    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;
      
      // Always put folders first
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          const aExt = a.name.split('.').pop() || '';
          const bExt = b.name.split('.').pop() || '';
          comparison = aExt.localeCompare(bExt);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          comparison = (a.modified?.getTime() || 0) - (b.modified?.getTime() || 0);
          break;
        case 'created':
          comparison = (a.created?.getTime() || 0) - (b.created?.getTime() || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [files, searchQuery, searchFilter, sortBy, sortOrder]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileItem, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedItems(prev => 
        prev.includes(file.id) 
          ? prev.filter(id => id !== file.id)
          : [...prev, file.id]
      );
    } else if (event?.shiftKey && selectedItems.length > 0) {
      // Range select with Shift
      const lastSelectedIndex = filteredAndSortedFiles.findIndex(f => f.id === selectedItems[selectedItems.length - 1]);
      const currentIndex = filteredAndSortedFiles.findIndex(f => f.id === file.id);
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        const rangeIds = filteredAndSortedFiles.slice(start, end + 1).map(f => f.id);
        
        setSelectedItems(prev => {
          const newSelection = new Set([...prev, ...rangeIds]);
          return Array.from(newSelection);
        });
      }
    } else {
      // Single select
      setSelectedItems([file.id]);
    }
    
    onFileSelect?.(file);
  }, [selectedItems, filteredAndSortedFiles, onFileSelect]);

  // Handle file double-click (open)
  const handleFileOpen = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      if (file.isExpanded) {
        onFolderCollapse?.(file);
      } else {
        onFolderExpand?.(file);
        loadFiles(file.path);
      }
    } else {
      onFileOpen?.(file);
      
      // Add to recent files
      setRecentFiles(prev => {
        const filtered = prev.filter(f => f.id !== file.id);
        return [file, ...filtered].slice(0, 10);
      });
      
      // Add to file history
      setFileHistory(prev => [
        { file, timestamp: new Date() },
        ...prev.slice(0, 99)
      ]);
    }
  }, [onFileOpen, onFolderExpand, onFolderCollapse, loadFiles]);

  // Handle context menu
  const handleContextMenu = useCallback((file: FileItem, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file,
    });
    onContextMenu?.(file, event);
  }, [onContextMenu]);

  // Handle drag and drop
  const handleDragStart = useCallback((file: FileItem, event: React.DragEvent) => {
    const selectedFiles = files.filter(f => selectedItems.includes(f.id));
    const draggedFiles = selectedFiles.length > 0 ? selectedFiles : [file];
    
    setDraggedItems(draggedFiles);
    event.dataTransfer.setData('text/plain', JSON.stringify(draggedFiles.map(f => f.path)));
  }, [files, selectedItems]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((targetFile: FileItem, event: React.DragEvent) => {
    event.preventDefault();
    
    if (targetFile.type === 'folder' && draggedItems.length > 0) {
      onFileMove?.(draggedItems, targetFile.path);
    }
    
    setDraggedItems([]);
    setDropTarget(null);
  }, [draggedItems, onFileMove]);

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        key: 'Ctrl+N',
        action: () => onFileCreate?.(currentPath, 'file'),
        description: 'New File',
      },
      {
        key: 'Ctrl+Shift+N',
        action: () => onFileCreate?.(currentPath, 'folder'),
        description: 'New Folder',
      },
      {
        key: 'Delete',
        action: () => {
          const selected = files.filter(f => selectedItems.includes(f.id));
          if (selected.length > 0) {
            onFileDelete?.(selected);
          }
        },
        description: 'Delete Selected',
      },
      {
        key: 'F2',
        action: () => {
          const selected = files.find(f => selectedItems.includes(f.id));
          if (selected) {
            // Trigger rename mode
            console.log('Rename:', selected.name);
          }
        },
        description: 'Rename',
      },
      {
        key: 'Ctrl+C',
        action: () => {
          const selected = files.filter(f => selectedItems.includes(f.id));
          if (selected.length > 0) {
            setClipboard({ files: selected, operation: 'copy' });
          }
        },
        description: 'Copy',
      },
      {
        key: 'Ctrl+X',
        action: () => {
          const selected = files.filter(f => selectedItems.includes(f.id));
          if (selected.length > 0) {
            setClipboard({ files: selected, operation: 'cut' });
          }
        },
        description: 'Cut',
      },
      {
        key: 'Ctrl+V',
        action: () => {
          if (clipboard) {
            if (clipboard.operation === 'copy') {
              onFileCopy?.(clipboard.files, currentPath);
            } else {
              onFileMove?.(clipboard.files, currentPath);
            }
            setClipboard(null);
          }
        },
        description: 'Paste',
      },
      {
        key: 'Ctrl+F',
        action: () => {
          searchInputRef.current?.focus();
        },
        description: 'Search Files',
      },
      {
        key: 'F5',
        action: () => loadFiles(currentPath),
        description: 'Refresh',
      },
      {
        key: 'Ctrl+Shift+I',
        action: () => setShowAIPanel(!showAIPanel),
        description: 'Toggle AI Panel',
      },
    ];

    shortcuts.forEach(shortcut => {
      registerShortcut(shortcut.key, shortcut.action, shortcut.description);
    });

    return () => {
      shortcuts.forEach(shortcut => {
        unregisterShortcut(shortcut.key);
      });
    };
  }, [registerShortcut, unregisterShortcut, files, selectedItems, currentPath, clipboard, showAIPanel, onFileCreate, onFileDelete, onFileCopy, onFileMove, loadFiles]);

  // Load initial files
  useEffect(() => {
    loadFiles(rootPath);
    if (showGitStatus) {
      loadGitInfo();
    }
  }, [loadFiles, loadGitInfo, rootPath, showGitStatus]);

  // Get AI insights when files change
  useEffect(() => {
    if (files.length > 0 && showAIInsights) {
      getAIInsights(files);
    }
  }, [files, getAIInsights, showAIInsights]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }, []);

  // Format date
  const formatDate = useCallback((date: Date) => {
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
  }, []);

  // Render file item
  const renderFileItem = useCallback((file: FileItem, depth: number = 0) => {
    const Icon = getFileIcon(file);
    const isSelected = selectedItems.includes(file.id);
    const isDragging = draggedItems.some(item => item.id === file.id);
    const colorClass = getFileColor(file);
    
    return (
      <div
        key={file.id}
        className={`group flex items-center space-x-2 px-2 py-1 hover:bg-accent cursor-pointer transition-colors ${
          isSelected ? 'bg-accent' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={(e) => handleFileSelect(file, e)}
        onDoubleClick={() => handleFileOpen(file)}
        onContextMenu={(e) => handleContextMenu(file, e)}
        draggable
        onDragStart={(e) => handleDragStart(file, e)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(file, e)}
      >
        {/* Expand/Collapse Icon */}
        {file.type === 'folder' && (
          <button
            className="p-0.5 hover:bg-accent rounded"
            onClick={(e) => {
              e.stopPropagation();
              handleFileOpen(file);
            }}
          >
            {file.isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        
        {/* File Icon */}
        <Icon className={`w-4 h-4 ${colorClass}`} />
        
        {/* Thumbnail */}
        {showThumbnails && file.thumbnail && (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-6 h-6 object-cover rounded"
          />
        )}
        
        {/* File Name */}
        <span className={`flex-1 text-sm truncate ${colorClass}`}>
          {file.name}
        </span>
        
        {/* File Badges */}
        <div className="flex items-center space-x-1">
          {file.isFavorite && <Star className="w-3 h-3 text-yellow-500" />}
          {file.isBookmarked && <Bookmark className="w-3 h-3 text-blue-500" />}
          {file.isPinned && <Pin className="w-3 h-3 text-green-500" />}
          {file.isSymlink && <Link className="w-3 h-3 text-purple-500" />}
          {file.permissions && !file.permissions.write && <Lock className="w-3 h-3 text-red-500" />}
          
          {/* Git Status */}
          {showGitStatus && file.gitStatus && (
            <div className={`w-2 h-2 rounded-full ${
              file.gitStatus === 'modified' ? 'bg-yellow-500' :
              file.gitStatus === 'untracked' ? 'bg-green-500' :
              file.gitStatus === 'added' ? 'bg-green-600' :
              file.gitStatus === 'deleted' ? 'bg-red-500' :
              file.gitStatus === 'renamed' ? 'bg-blue-500' :
              file.gitStatus === 'copied' ? 'bg-cyan-500' :
              file.gitStatus === 'unmerged' ? 'bg-purple-500' :
              'bg-gray-400'
            }`}></div>
          )}
          
          {/* AI Insights Indicator */}
          {showAIInsights && file.aiInsights && (
            <div className="flex items-center space-x-0.5">
              <Bot className="w-3 h-3 text-blue-500" />
              <div className={`w-1 h-1 rounded-full ${
                file.aiInsights.complexity > 0.8 ? 'bg-red-500' :
                file.aiInsights.complexity > 0.6 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          )}
        </div>
        
        {/* File Size and Date */}
        {viewMode === 'list' && (
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {file.size && <span>{formatFileSize(file.size)}</span>}
            {file.modified && <span>{formatDate(file.modified)}</span>}
          </div>
        )}
      </div>
    );
  }, [selectedItems, draggedItems, getFileIcon, getFileColor, showThumbnails, showGitStatus, showAIInsights, viewMode, handleFileSelect, handleFileOpen, handleContextMenu, handleDragStart, handleDragOver, handleDrop, formatFileSize, formatDate]);

  // Render breadcrumbs
  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-1 px-3 py-2 border-b border-border">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          <button
            className="text-sm hover:text-foreground text-muted-foreground transition-colors"
            onClick={() => loadFiles(crumb.path)}
          >
            {crumb.name}
          </button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render toolbar
  const renderToolbar = () => (
    <div className="flex items-center justify-between p-2 border-b border-border">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFileCreate?.(currentPath, 'file')}
          title="New File (Ctrl+N)"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFileCreate?.(currentPath, 'folder')}
          title="New Folder (Ctrl+Shift+N)"
        >
          <Folder className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadFiles(currentPath)}
          title="Refresh (F5)"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-4 bg-border"></div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={showAIPanel ? 'bg-accent' : ''}
          title="AI Assistant (Ctrl+Shift+I)"
        >
          <Bot className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 w-48"
          />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          title="Advanced Search"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Render context menu
  const renderContextMenu = () => {
    if (!contextMenu) return null;
    
    return (
      <div
        ref={contextMenuRef}
        className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-50"
        style={{
          left: contextMenu.x,
          top: contextMenu.y,
        }}
      >
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Open
        </button>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Open With...
        </button>
        <div className="border-t border-border my-1"></div>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Cut
        </button>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Copy
        </button>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Paste
        </button>
        <div className="border-t border-border my-1"></div>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Rename
        </button>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent text-red-600">
          Delete
        </button>
        <div className="border-t border-border my-1"></div>
        <button className="w-full px-3 py-1 text-left text-sm hover:bg-accent">
          Properties
        </button>
      </div>
    );
  };

  return (
    <div ref={fileExplorerRef} className={`h-full flex flex-col bg-background ${className}`}>
      {/* Breadcrumbs */}
      {renderBreadcrumbs()}
      
      {/* Toolbar */}
      {renderToolbar()}
      
      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Input placeholder="File extension" />
            <Input placeholder="Min size (MB)" type="number" />
            <Input placeholder="Modified after" type="date" />
            <Input placeholder="Git status" />
          </div>
        </div>
      )}
      
      {/* File List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading files...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-500">
            <AlertCircle className="w-6 h-6" />
            <span className="ml-2">{error}</span>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Folder className="w-8 h-8 mb-2" />
            <p>No files found</p>
          </div>
        ) : (
          <div className="py-1">
            {filteredAndSortedFiles.map(file => renderFileItem(file))}
          </div>
        )}
      </div>
      
      {/* AI Panel */}
      {showAIPanel && (
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center">
              <Bot className="w-4 h-4 mr-2" />
              AI Assistant
              {isAnalyzing && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2"></div>}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIPanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {aiRecommendations.length > 0 ? (
            <div className="space-y-2">
              {aiRecommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="p-2 border border-border rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{rec.title}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                      rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {rec.impact}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-2">{rec.description}</p>
                  <Button size="sm" onClick={rec.action}>
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isAnalyzing ? 'Analyzing files...' : 'No recommendations available'}
            </p>
          )}
        </div>
      )}
      
      {/* Context Menu */}
      {renderContextMenu()}
    </div>
  );
};

export default FileExplorer;

// File Explorer utilities and hooks
export const useFileExplorer = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<{ files: FileItem[]; operation: 'copy' | 'cut' } | null>(null);
  
  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);
  
  const selectFile = useCallback((fileId: string) => {
    setSelectedFiles([fileId]);
  }, []);
  
  const selectMultipleFiles = useCallback((fileIds: string[]) => {
    setSelectedFiles(fileIds);
  }, []);
  
  const copyFiles = useCallback((files: FileItem[]) => {
    setClipboard({ files, operation: 'copy' });
  }, []);
  
  const cutFiles = useCallback((files: FileItem[]) => {
    setClipboard({ files, operation: 'cut' });
  }, []);
  
  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);
  
  return {
    currentPath,
    selectedFiles,
    clipboard,
    navigateToPath,
    selectFile,
    selectMultipleFiles,
    copyFiles,
    cutFiles,
    clearClipboard,
  };
};

// File Explorer configuration
export const fileExplorerConfig = {
  defaultViewMode: 'tree' as const,
  defaultSortBy: 'name' as const,
  defaultSortOrder: 'asc' as const,
  maxRecentFiles: 10,
  maxFileHistory: 100,
  thumbnailSize: 24,
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
  supportedVideoFormats: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
  supportedAudioFormats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'],
  supportedArchiveFormats: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
};

// Export File Explorer component with display name
FileExplorer.displayName = 'FileExplorer';

export { FileExplorer };
export type { FileItem, FileExplorerProps, SearchFilter, AIRecommendation };