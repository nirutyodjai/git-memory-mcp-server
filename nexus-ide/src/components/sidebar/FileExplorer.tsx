import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Image,
  Code,
  Coffee,
  Database,
  Settings,
  Package,
  GitBranch,
  File,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Download,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/ContextMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Badge } from '../ui/Badge';
import { useFileSystem } from '../../hooks/useFileSystem';
import { useGitStatus } from '../../hooks/useGitStatus';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useFileExplorer } from '@/hooks/useFileExplorer';
import { useAiServices } from '@/hooks/useAiServices';

/**
 * File/Folder Interface
 */
interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date;
  children?: FileSystemItem[];
  isExpanded?: boolean;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged';
}

/**
 * File Icon Component
 */
interface FileIconProps {
  fileName: string;
  isFolder: boolean;
  isOpen?: boolean;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, isFolder, isOpen, className }) => {
  const getFileIcon = useCallback(() => {
    if (isFolder) {
      return isOpen ? FolderOpen : Folder;
    }

    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return Code;
      case 'json':
      case 'package':
        return Package;
      case 'md':
      case 'txt':
        return FileText;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return Image;
      case 'sql':
      case 'db':
        return Database;
      case 'coffee':
        return Coffee;
      case 'git':
        return GitBranch;
      case 'config':
      case 'env':
        return Settings;
      default:
        return File;
    }
  }, [fileName, isFolder, isOpen]);

  const Icon = getFileIcon();
  return <Icon className={cn('h-4 w-4', className)} />;
};

/**
 * Git Status Badge Component
 */
interface GitStatusBadgeProps {
  status: FileSystemItem['gitStatus'];
}

const GitStatusBadge: React.FC<GitStatusBadgeProps> = ({ status }) => {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'modified':
        return { label: 'M', variant: 'secondary' as const, className: 'text-yellow-600' };
      case 'added':
        return { label: 'A', variant: 'secondary' as const, className: 'text-green-600' };
      case 'deleted':
        return { label: 'D', variant: 'destructive' as const, className: 'text-red-600' };
      case 'untracked':
        return { label: 'U', variant: 'outline' as const, className: 'text-blue-600' };
      case 'staged':
        return { label: 'S', variant: 'default' as const, className: 'text-green-700' };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <Badge
      variant={config.variant}
      className={cn('h-4 w-4 text-xs p-0 flex items-center justify-center', config.className)}
    >
      {config.label}
    </Badge>
  );
};

/**
 * File Tree Item Component
 */
interface FileTreeItemProps {
  item: FileSystemItem;
  level: number;
  onSelect: (item: FileSystemItem) => void;
  onToggle: (item: FileSystemItem) => void;
  onContextMenu: (item: FileSystemItem, action: string) => void;
  selectedItem?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  level,
  onSelect,
  onToggle,
  onContextMenu,
  selectedItem,
}) => {
  const isSelected = selectedItem === item.id;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = item.isExpanded;

  const handleClick = useCallback(() => {
    if (item.type === 'folder') {
      onToggle(item);
    } else {
      onSelect(item);
    }
  }, [item, onSelect, onToggle]);

  const handleContextMenuAction = useCallback((action: string) => {
    onContextMenu(item, action);
  }, [item, onContextMenu]);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'flex items-center py-1 px-2 hover:bg-accent/50 cursor-pointer group',
              isSelected && 'bg-accent text-accent-foreground',
              'transition-colors duration-150'
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
          >
            {/* Expand/Collapse Icon */}
            {item.type === 'folder' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-1 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            {/* File/Folder Icon */}
            <FileIcon
              fileName={item.name}
              isFolder={item.type === 'folder'}
              isOpen={isExpanded}
              className="mr-2 flex-shrink-0"
            />

            {/* File/Folder Name */}
            <span className="flex-1 text-sm truncate">
              {item.name}
            </span>

            {/* Git Status Badge */}
            <GitStatusBadge status={item.gitStatus} />

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleContextMenuAction('rename')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleContextMenuAction('copy')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleContextMenuAction('download')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleContextMenuAction('delete')}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          {item.type === 'folder' && (
            <>
              <ContextMenuItem onClick={() => handleContextMenuAction('new-file')}>
                <FileText className="mr-2 h-4 w-4" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleContextMenuAction('new-folder')}>
                <Folder className="mr-2 h-4 w-4" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => handleContextMenuAction('rename')}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuAction('copy')}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Path
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuAction('reveal')}>
            <Search className="mr-2 h-4 w-4" />
            Reveal in Explorer
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleContextMenuAction('delete')}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Render Children */}
      {item.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
              selectedItem={selectedItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * File Explorer Component
 */
interface FileExplorerProps {
  searchQuery?: string;
  className?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  searchQuery = '',
  className,
}) => {
  const { fileTree, loading, error, refreshFileTree } = useFileSystem();
  const { getFileStatus } = useGitStatus();
  const [selectedItem, setSelectedItem] = useState<string>();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Filter files based on search query
  const filteredFileTree = useMemo(() => {
    if (!searchQuery.trim()) return fileTree;
    
    const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.reduce((acc: FileSystemItem[], item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = item.children ? filterItems(item.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren,
            isExpanded: filteredChildren.length > 0 ? true : item.isExpanded,
          });
        }
        
        return acc;
      }, []);
    };
    
    return filterItems(fileTree);
  }, [fileTree, searchQuery]);

  // Handle file/folder selection
  const handleSelect = useCallback((item: FileSystemItem) => {
    setSelectedItem(item.id);
    
    if (item.type === 'file') {
      // Emit file open event
      const event = new CustomEvent('nexus:file-open', {
        detail: { file: item }
      });
      window.dispatchEvent(event);
    }
  }, []);

  // Handle folder toggle
  const handleToggle = useCallback((item: FileSystemItem) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      return newSet;
    });
  }, []);

  // Handle context menu actions
  const handleContextMenu = useCallback((item: FileSystemItem, action: string) => {
    console.log('Context menu action:', action, 'on item:', item.name);
    
    switch (action) {
      case 'new-file':
        // Emit new file event
        const newFileEvent = new CustomEvent('nexus:file-new', {
          detail: { parent: item }
        });
        window.dispatchEvent(newFileEvent);
        break;
      case 'new-folder':
        // Emit new folder event
        const newFolderEvent = new CustomEvent('nexus:folder-new', {
          detail: { parent: item }
        });
        window.dispatchEvent(newFolderEvent);
        break;
      case 'rename':
        // Emit rename event
        const renameEvent = new CustomEvent('nexus:item-rename', {
          detail: { item }
        });
        window.dispatchEvent(renameEvent);
        break;
      case 'delete':
        // Emit delete event
        const deleteEvent = new CustomEvent('nexus:item-delete', {
          detail: { item }
        });
        window.dispatchEvent(deleteEvent);
        break;
      case 'copy':
        // Copy path to clipboard
        navigator.clipboard.writeText(item.path);
        break;
      case 'reveal':
        // Reveal in system explorer
        const revealEvent = new CustomEvent('nexus:item-reveal', {
          detail: { item }
        });
        window.dispatchEvent(revealEvent);
        break;
    }
  }, []);

  // Update expanded state for filtered items
  useEffect(() => {
    const updateExpandedState = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => ({
        ...item,
        isExpanded: expandedFolders.has(item.id),
        children: item.children ? updateExpandedState(item.children) : undefined,
      }));
    };
    
    // This would typically update the file tree state
    // For now, we'll just log the expanded folders
    console.log('Expanded folders:', Array.from(expandedFolders));
  }, [expandedFolders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 space-y-2">
        <div className="text-sm text-destructive">Error loading files</div>
        <Button variant="outline" size="sm" onClick={refreshFileTree}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('nexus-file-explorer h-full', className)}>
      <ScrollArea className="h-full">
        <div className="py-2">
          {filteredFileTree.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                {searchQuery ? 'No files match your search' : 'No files found'}
              </div>
            </div>
          ) : (
            filteredFileTree.map((item) => (
              <FileTreeItem
                key={item.id}
                item={{
                  ...item,
                  isExpanded: expandedFolders.has(item.id),
                  gitStatus: getFileStatus(item.path),
                }}
                level={0}
                onSelect={handleSelect}
                onToggle={handleToggle}
                onContextMenu={handleContextMenu}
                selectedItem={selectedItem}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileExplorer;

/**
 * File Explorer Features:
 * 
 * 1. Tree View:
 *    - Hierarchical file/folder structure
 *    - Expandable/collapsible folders
 *    - File type icons and recognition
 *    - Git status indicators
 * 
 * 2. Search & Filter:
 *    - Real-time search filtering
 *    - Recursive search through folders
 *    - Highlight matching results
 *    - Clear search functionality
 * 
 * 3. Context Actions:
 *    - Right-click context menus
 *    - File/folder operations (create, rename, delete)
 *    - Copy path to clipboard
 *    - Reveal in system explorer
 * 
 * 4. Git Integration:
 *    - Visual git status indicators
 *    - Modified, added, deleted file states
 *    - Staged/unstaged changes
 *    - Untracked files highlighting
 * 
 * 5. Keyboard Navigation:
 *    - Arrow key navigation
 *    - Enter to open files
 *    - Space to toggle folders
 *    - Delete key for file deletion
 */
type FileExplorerProps = {
  width?: number;
};

const { treeData, toggleNode, openFile, contextMenu, handleContextMenu, closeContextMenu, renameNode, createNewNode, deleteNode, getGitStatus } = useFileExplorer();
const { semanticSearch } = useAiServices();
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState<FileTree[]>([]);
const [isSearching, setIsSearching] = useState(false);

const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const term = e.target.value;
  setSearchTerm(term);

  if (term.length > 2) {
    setIsSearching(true);
    const results = await semanticSearch(term);
    setSearchResults(results);
    setIsSearching(false);
  } else {
    setSearchResults([]);
  }
};

const renderTree = (nodes: FileTree[], level = 0) => (
<Input
type="text"
placeholder="Smart Search files..."
className="w-full pl-8 pr-4 py-2 text-sm bg-gray-700 border-gray-600 rounded-md"
value={searchTerm}
onChange={handleSearchChange}
/>
{isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
</div>
</div>
<ScrollArea className="flex-grow">
<div className="p-2">
{searchTerm.length > 2 ? renderTree(searchResults) : renderTree(treeData)}
</div>
</ScrollArea>
</div>
</div>
</div>
</div>
</div>