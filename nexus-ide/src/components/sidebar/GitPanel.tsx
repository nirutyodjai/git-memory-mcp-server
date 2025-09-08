import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Plus,
  Minus,
  RotateCcw,
  Upload,
  Download,
  RefreshCw,
  Clock,
  User,
  Calendar,
  Hash,
  FileText,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { Checkbox } from '../ui/Checkbox';
import { useGit } from '../../hooks/useGit';
import { useGitStatus } from '../../hooks/useGitStatus';

/**
 * Git File Status Interface
 */
interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'copied' | 'untracked' | 'ignored';
  staged: boolean;
  oldPath?: string; // For renamed files
  additions?: number;
  deletions?: number;
}

/**
 * Git Commit Interface
 */
interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  parents: string[];
  refs: string[];
}

/**
 * Git Branch Interface
 */
interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  ahead?: number;
  behind?: number;
  lastCommit?: GitCommit;
}

/**
 * Git File Status Item Component
 */
interface GitFileItemProps {
  file: GitFileStatus;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onDiscard: (path: string) => void;
  onView: (path: string) => void;
  selected: boolean;
  onSelect: (path: string, selected: boolean) => void;
}

const GitFileItem: React.FC<GitFileItemProps> = ({
  file,
  onStage,
  onUnstage,
  onDiscard,
  onView,
  selected,
  onSelect,
}) => {
  const getStatusIcon = useCallback(() => {
    switch (file.status) {
      case 'modified':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'added':
        return <Plus className="h-3 w-3 text-green-500" />;
      case 'deleted':
        return <Minus className="h-3 w-3 text-red-500" />;
      case 'renamed':
        return <RotateCcw className="h-3 w-3 text-blue-500" />;
      case 'untracked':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  }, [file.status]);

  const getStatusText = useCallback(() => {
    switch (file.status) {
      case 'modified':
        return 'M';
      case 'added':
        return 'A';
      case 'deleted':
        return 'D';
      case 'renamed':
        return 'R';
      case 'copied':
        return 'C';
      case 'untracked':
        return 'U';
      default:
        return '?';
    }
  }, [file.status]);

  return (
    <div className="flex items-center py-1 px-2 hover:bg-accent/50 group">
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelect(file.path, !!checked)}
        className="mr-2"
      />
      
      <div className="flex items-center mr-2">
        {getStatusIcon()}
      </div>
      
      <Badge variant="outline" className="mr-2 text-xs w-6 h-5 p-0 flex items-center justify-center">
        {getStatusText()}
      </Badge>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">
          {file.path}
        </div>
        {file.oldPath && (
          <div className="text-xs text-muted-foreground truncate">
              {file.oldPath} -> {file.path}
            </div>
        )}
        {(file.additions !== undefined || file.deletions !== undefined) && (
          <div className="flex items-center space-x-2 text-xs">
            {file.additions !== undefined && (
              <span className="text-green-600">+{file.additions}</span>
            )}
            {file.deletions !== undefined && (
              <span className="text-red-600">-{file.deletions}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(file.path)}
          className="h-6 w-6 p-0"
        >
          <Eye className="h-3 w-3" />
        </Button>
        
        {file.staged ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnstage(file.path)}
            className="h-6 w-6 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStage(file.path)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDiscard(file.path)}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Git Commit Item Component
 */
interface GitCommitItemProps {
  commit: GitCommit;
  onSelect: (commit: GitCommit) => void;
  selected: boolean;
}

const GitCommitItem: React.FC<GitCommitItemProps> = ({
  commit,
  onSelect,
  selected,
}) => {
  return (
    <div
      className={cn(
        'p-3 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors',
        selected && 'bg-accent text-accent-foreground'
      )}
      onClick={() => onSelect(commit)}
    >
      <div className="flex items-start space-x-3">
        <GitCommit className="h-4 w-4 mt-0.5 text-muted-foreground" />
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-1">
            {commit.message.split('\n')[0]}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{commit.author.name}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{commit.date.toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{commit.shortHash}</span>
            </div>
          </div>
          
          {commit.refs.length > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              {commit.refs.map((ref) => (
                <Badge key={ref} variant="outline" className="text-xs">
                  {ref}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Git Branch Item Component
 */
interface GitBranchItemProps {
  branch: GitBranch;
  onCheckout: (branch: string) => void;
  onDelete: (branch: string) => void;
  onMerge: (branch: string) => void;
}

const GitBranchItem: React.FC<GitBranchItemProps> = ({
  branch,
  onCheckout,
  onDelete,
  onMerge,
}) => {
  return (
    <div className="flex items-center py-2 px-3 hover:bg-accent/50 group">
      <GitBranch className={cn(
        'h-4 w-4 mr-2',
        branch.current ? 'text-green-500' : 'text-muted-foreground'
      )} />
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-sm',
          branch.current && 'font-medium text-green-600'
        )}>
          {branch.name}
          {branch.current && ' (current)'}
        </div>
        
        {(branch.ahead || branch.behind) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {branch.ahead && (
              <span className="text-green-600">^{branch.ahead}</span>
            )}
            {branch.behind && (
              <span className="text-red-600">v{branch.behind}</span>
            )}
          </div>
        )}
      </div>
      
      {!branch.current && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCheckout(branch.name)}>
              <GitBranch className="mr-2 h-4 w-4" />
              Checkout
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMerge(branch.name)}>
              <GitMerge className="mr-2 h-4 w-4" />
              Merge
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(branch.name)}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

/**
 * Main Git Panel Component
 */
interface GitPanelProps {
  className?: string;
}

export const GitPanel: React.FC<GitPanelProps> = ({ className }) => {
  const {
    status,
    branches,
    commits,
    currentBranch,
    loading,
    error,
    stage,
    unstage,
    commit,
    push,
    pull,
    fetch,
    checkout,
    createBranch,
    deleteBranch,
    merge,
    discard,
    refresh,
  } = useGit();
  
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedCommit, setSelectedCommit] = useState<string>();
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [changesExpanded, setChangesExpanded] = useState(true);
  const [stagedExpanded, setStagedExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [branchesExpanded, setBranchesExpanded] = useState(false);

  // Separate staged and unstaged files
  const stagedFiles = useMemo(() => status.filter(file => file.staged), [status]);
  const unstagedFiles = useMemo(() => status.filter(file => !file.staged), [status]);

  // Handle file selection
  const handleFileSelect = useCallback((path: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(path);
      } else {
        newSet.delete(path);
      }
      return newSet;
    });
  }, []);

  // Handle select all files
  const handleSelectAll = useCallback((files: GitFileStatus[], select: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      files.forEach(file => {
        if (select) {
          newSet.add(file.path);
        } else {
          newSet.delete(file.path);
        }
      });
      return newSet;
    });
  }, []);

  // Handle stage selected files
  const handleStageSelected = useCallback(async () => {
    const filesToStage = Array.from(selectedFiles).filter(path => 
      unstagedFiles.some(file => file.path === path)
    );
    
    for (const path of filesToStage) {
      await stage(path);
    }
    
    setSelectedFiles(new Set());
    refresh();
  }, [selectedFiles, unstagedFiles, stage, refresh]);

  // Handle unstage selected files
  const handleUnstageSelected = useCallback(async () => {
    const filesToUnstage = Array.from(selectedFiles).filter(path => 
      stagedFiles.some(file => file.path === path)
    );
    
    for (const path of filesToUnstage) {
      await unstage(path);
    }
    
    setSelectedFiles(new Set());
    refresh();
  }, [selectedFiles, stagedFiles, unstage, refresh]);

  // Handle commit
  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return;
    
    try {
      await commit(commitMessage);
      setCommitMessage('');
      setShowCommitDialog(false);
      refresh();
    } catch (error) {
      console.error('Commit failed:', error);
    }
  }, [commitMessage, stagedFiles, commit, refresh]);

  // Handle create branch
  const handleCreateBranch = useCallback(async () => {
    if (!newBranchName.trim()) return;
    
    try {
      await createBranch(newBranchName);
      setNewBranchName('');
      setShowBranchDialog(false);
      refresh();
    } catch (error) {
      console.error('Create branch failed:', error);
    }
  }, [newBranchName, createBranch, refresh]);

  // Handle file view
  const handleViewFile = useCallback((path: string) => {
    const event = new CustomEvent('nexus:git-diff', {
      detail: { file: path }
    });
    window.dispatchEvent(event);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading git status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 space-y-2">
        <div className="text-sm text-destructive">Git error: {error}</div>
        <Button variant="outline" size="sm" onClick={refresh}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('nexus-git-panel h-full flex flex-col', className)}>
      {/* Git Header */}
      <div className="p-3 border-b space-y-3">
        {/* Current Branch & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{currentBranch || 'No branch'}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={fetch}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={pull}>
              <GitPullRequest className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={push}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={stagedFiles.length === 0}>
                <GitCommit className="mr-2 h-4 w-4" />
                Commit ({stagedFiles.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Commit Changes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Commit message..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCommitDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCommit} disabled={!commitMessage.trim()}>
                    Commit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Branch name..."
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBranchDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Git Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {/* Staged Changes */}
          <Collapsible open={stagedExpanded} onOpenChange={setStagedExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3">
                <span className="flex items-center">
                  {stagedExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  Staged Changes
                  <Badge variant="secondary" className="ml-2">
                    {stagedFiles.length}
                  </Badge>
                </span>
                {stagedFiles.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAll(stagedFiles, !selectedFiles.size);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      {selectedFiles.size > 0 ? 'Deselect' : 'Select'} All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnstageSelected();
                      }}
                      className="h-6 px-2 text-xs"
                      disabled={selectedFiles.size === 0}
                    >
                      Unstage
                    </Button>
                  </div>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {stagedFiles.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No staged changes
                </div>
              ) : (
                stagedFiles.map((file) => (
                  <GitFileItem
                    key={file.path}
                    file={file}
                    onStage={stage}
                    onUnstage={unstage}
                    onDiscard={discard}
                    onView={handleViewFile}
                    selected={selectedFiles.has(file.path)}
                    onSelect={handleFileSelect}
                  />
                ))
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Unstaged Changes */}
          <Collapsible open={changesExpanded} onOpenChange={setChangesExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3">
                <span className="flex items-center">
                  {changesExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  Changes
                  <Badge variant="secondary" className="ml-2">
                    {unstagedFiles.length}
                  </Badge>
                </span>
                {unstagedFiles.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAll(unstagedFiles, !selectedFiles.size);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      {selectedFiles.size > 0 ? 'Deselect' : 'Select'} All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageSelected();
                      }}
                      className="h-6 px-2 text-xs"
                      disabled={selectedFiles.size === 0}
                    >
                      Stage
                    </Button>
                  </div>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {unstagedFiles.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No changes
                </div>
              ) : (
                unstagedFiles.map((file) => (
                  <GitFileItem
                    key={file.path}
                    file={file}
                    onStage={stage}
                    onUnstage={unstage}
                    onDiscard={discard}
                    onView={handleViewFile}
                    selected={selectedFiles.has(file.path)}
                    onSelect={handleFileSelect}
                  />
                ))
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Branches */}
          <Collapsible open={branchesExpanded} onOpenChange={setBranchesExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3">
                <span className="flex items-center">
                  {branchesExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  Branches
                  <Badge variant="secondary" className="ml-2">
                    {branches.length}
                  </Badge>
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {branches.map((branch) => (
                <GitBranchItem
                  key={branch.name}
                  branch={branch}
                  onCheckout={checkout}
                  onDelete={deleteBranch}
                  onMerge={merge}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Commit History */}
          <Collapsible open={historyExpanded} onOpenChange={setHistoryExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3">
                <span className="flex items-center">
                  {historyExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  History
                  <Badge variant="secondary" className="ml-2">
                    {commits.length}
                  </Badge>
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {commits.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No commits
                </div>
              ) : (
                commits.slice(0, 20).map((commit) => (
                  <GitCommitItem
                    key={commit.hash}
                    commit={commit}
                    onSelect={(commit) => setSelectedCommit(commit.hash)}
                    selected={selectedCommit === commit.hash}
                  />
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};

export default GitPanel;

/**
 * Git Panel Features:
 * 
 * 1. Status Overview:
 *    - Current branch display
 *    - Staged/unstaged file counts
 *    - Quick action buttons
 *    - Repository status indicators
 * 
 * 2. File Management:
 *    - Stage/unstage individual files
 *    - Bulk operations (stage all, unstage all)
 *    - File status indicators (M, A, D, R, U)
 *    - Discard changes functionality
 * 
 * 3. Commit Operations:
 *    - Commit message input
 *    - Commit staged changes
 *    - Commit history display
 *    - Author and timestamp info
 * 
 * 4. Branch Management:
 *    - List all branches
 *    - Create new branches
 *    - Switch between branches
 *    - Delete branches
 *    - Merge branches
 * 
 * 5. Remote Operations:
 *    - Push to remote
 *    - Pull from remote
 *    - Fetch updates
 *    - Sync status display
 */