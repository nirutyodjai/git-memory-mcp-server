/**
 * CollaborationHub Component
 * 
 * A comprehensive real-time collaboration hub for the NEXUS IDE.
 * Enables seamless teamwork with advanced features and AI assistance.
 * 
 * Features:
 * - Real-time collaborative editing with operational transformation
 * - Live cursors and selections with user presence
 * - Voice and video chat integration
 * - Screen sharing capabilities
 * - Collaborative debugging sessions
 * - Team chat with AI moderation
 * - Shared workspaces and project management
 * - Code review and commenting system
 * - Knowledge sharing and documentation
 * - Activity feeds and notifications
 * - Permission management and access control
 * - Integration with version control systems
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  UserMinus,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Share,
  Share2,
  MessageSquare,
  MessageCircle,
  Send,
  Smile,
  Paperclip,
  Image,
  File,
  Download,
  Upload,
  Settings,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Code,
  FileText,
  Folder,
  Search,
  Filter,
  Bell,
  BellOff,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquareMore,
  Reply,
  Forward,
  Edit,
  Trash2,
  Pin,
  Archive,
  Clock,
  Calendar,
  MapPin,
  Zap,
  Brain,
  Robot,
  Sparkles,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Award,
  Trophy,
  Medal,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Link,
  ExternalLink,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  RefreshCw,
  Power,
  Wifi,
  WifiOff
} from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  permissions: string[];
  cursor?: {
    file: string;
    line: number;
    column: number;
    selection?: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
  };
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'code' | 'file' | 'image' | 'system' | 'ai';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions: { emoji: string; users: string[] }[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  metadata?: {
    language?: string;
    fileName?: string;
    lineNumbers?: boolean;
  };
}

export interface CollaborationSession {
  id: string;
  name: string;
  description?: string;
  type: 'coding' | 'review' | 'debugging' | 'meeting' | 'planning';
  status: 'active' | 'paused' | 'ended';
  startTime: Date;
  endTime?: Date;
  participants: User[];
  host: string;
  settings: {
    allowScreenShare: boolean;
    allowVoiceChat: boolean;
    allowVideoChat: boolean;
    allowFileSharing: boolean;
    requirePermission: boolean;
    recordSession: boolean;
    aiModerationEnabled: boolean;
  };
  sharedFiles: string[];
  activeDocument?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'commit' | 'merge' | 'deploy' | 'debug' | 'share';
  description: string;
  timestamp: Date;
  metadata?: {
    file?: string;
    line?: number;
    commit?: string;
    branch?: string;
    pullRequest?: string;
  };
}

export interface CollaborationHubProps {
  className?: string;
  session?: CollaborationSession;
  currentUser?: User;
  users?: User[];
  messages?: ChatMessage[];
  activities?: ActivityItem[];
  onUserInvite?: (email: string, role: string) => void;
  onUserRemove?: (userId: string) => void;
  onUserRoleChange?: (userId: string, role: string) => void;
  onMessageSend?: (content: string, type: string, metadata?: any) => void;
  onMessageEdit?: (messageId: string, content: string) => void;
  onMessageDelete?: (messageId: string) => void;
  onMessageReact?: (messageId: string, emoji: string) => void;
  onFileShare?: (file: File) => void;
  onScreenShare?: (enabled: boolean) => void;
  onVoiceToggle?: (enabled: boolean) => void;
  onVideoToggle?: (enabled: boolean) => void;
  onSessionStart?: (type: string, settings: any) => void;
  onSessionEnd?: () => void;
  aiAssistanceEnabled?: boolean;
  voiceEnabled?: boolean;
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
}

const getUserStatusColor = (status: string): string => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getRoleIcon = (role: string): React.ComponentType<any> => {
  switch (role) {
    case 'owner': return Crown;
    case 'admin': return Shield;
    case 'member': return Users;
    case 'viewer': return Eye;
    default: return Users;
  }
};

const getActivityIcon = (type: string): React.ComponentType<any> => {
  switch (type) {
    case 'join': return UserPlus;
    case 'leave': return UserMinus;
    case 'edit': return Edit;
    case 'comment': return MessageSquare;
    case 'commit': return GitCommit;
    case 'merge': return GitMerge;
    case 'deploy': return Zap;
    case 'debug': return Target;
    case 'share': return Share;
    default: return Activity;
  }
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
};

export const CollaborationHub: React.FC<CollaborationHubProps> = ({
  className,
  session,
  currentUser,
  users = [],
  messages = [],
  activities = [],
  onUserInvite,
  onUserRemove,
  onUserRoleChange,
  onMessageSend,
  onMessageEdit,
  onMessageDelete,
  onMessageReact,
  onFileShare,
  onScreenShare,
  onVoiceToggle,
  onVideoToggle,
  onSessionStart,
  onSessionEnd,
  aiAssistanceEnabled = true,
  voiceEnabled = false,
  videoEnabled = false,
  screenShareEnabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'users' | 'activity' | 'settings'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    return messages.filter(message => 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      users.find(u => u.id === message.userId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm, users]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() && onMessageSend) {
      const metadata = replyToMessage ? { replyTo: replyToMessage } : undefined;
      onMessageSend(newMessage.trim(), 'text', metadata);
      setNewMessage('');
      setReplyToMessage(null);
      toast.success('Message sent');
    }
  }, [newMessage, onMessageSend, replyToMessage]);

  // Handle message edit
  const handleEditMessage = useCallback((messageId: string, content: string) => {
    if (onMessageEdit) {
      onMessageEdit(messageId, content);
      setEditingMessage(null);
      setEditContent('');
      toast.success('Message updated');
    }
  }, [onMessageEdit]);

  // Handle user invite
  const handleInviteUser = useCallback(() => {
    if (inviteEmail.trim() && onUserInvite) {
      onUserInvite(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteDialog(false);
      toast.success(`Invitation sent to ${inviteEmail}`);
    }
  }, [inviteEmail, inviteRole, onUserInvite]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (onFileShare) {
        onFileShare(file);
        toast.success(`Shared file: ${file.name}`);
      }
    });
  }, [onFileShare]);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (onFileShare) {
        onFileShare(file);
        toast.success(`Shared file: ${file.name}`);
      }
    });
    e.target.value = '';
  }, [onFileShare]);

  // Get user by ID
  const getUserById = useCallback((userId: string) => {
    return users.find(user => user.id === userId);
  }, [users]);

  // Render message
  const renderMessage = useCallback((message: ChatMessage) => {
    const user = getUserById(message.userId);
    const isCurrentUser = currentUser?.id === message.userId;
    const isEditing = editingMessage === message.id;
    const replyMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
    const replyUser = replyMessage ? getUserById(replyMessage.userId) : null;
    
    return (
      <div
        key={message.id}
        className={cn(
          'group flex gap-3 p-3 hover:bg-accent/20 transition-colors',
          selectedMessage === message.id && 'bg-accent/30'
        )}
        onClick={() => setSelectedMessage(message.id)}
      >
        <div className="flex-shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {user?.name || 'Unknown User'}
            </span>
            
            {message.type === 'ai' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                <Brain className="w-3 h-3" />
                AI
              </div>
            )}
            
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
            
            {message.edited && (
              <span className="text-xs text-muted-foreground">
                (edited)
              </span>
            )}
          </div>
          
          {replyMessage && replyUser && (
            <div className="mb-2 p-2 bg-accent/30 rounded border-l-2 border-primary/50">
              <div className="text-xs text-muted-foreground mb-1">
                Replying to {replyUser.name}
              </div>
              <div className="text-sm truncate">
                {replyMessage.content}
              </div>
            </div>
          )}
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditMessage(message.id, editContent)}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setEditContent('');
                  }}
                  className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {message.type === 'code' ? (
                <pre className="bg-accent/30 p-3 rounded text-sm font-mono overflow-x-auto">
                  <code>{message.content}</code>
                </pre>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 bg-accent/20 rounded border"
                    >
                      <File className="w-4 h-4" />
                      <span className="text-sm flex-1">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </span>
                      <button className="p-1 hover:bg-accent rounded">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {message.reactions.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {message.reactions.map((reaction, index) => (
                    <button
                      key={index}
                      onClick={() => onMessageReact && onMessageReact(message.id, reaction.emoji)}
                      className="flex items-center gap-1 px-2 py-1 bg-accent/30 hover:bg-accent/50 rounded text-xs transition-colors"
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.users.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReplyToMessage(message.id)}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </button>
            
            {isCurrentUser && (
              <button
                onClick={() => {
                  setEditingMessage(message.id);
                  setEditContent(message.content);
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="React"
            >
              <Smile className="w-4 h-4" />
            </button>
            
            <button
              className="p-1 hover:bg-accent rounded transition-colors"
              title="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }, [currentUser, editingMessage, editContent, selectedMessage, messages, users, getUserById, handleEditMessage, onMessageReact, showEmojiPicker]);

  if (!session) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center',
        'bg-background text-muted-foreground',
        className
      )}>
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Active Session</h3>
          <p className="text-sm mb-4">Start a collaboration session to work with your team</p>
          {onSessionStart && (
            <button
              onClick={() => onSessionStart('coding', {
                allowScreenShare: true,
                allowVoiceChat: true,
                allowVideoChat: true,
                allowFileSharing: true,
                requirePermission: false,
                recordSession: false,
                aiModerationEnabled: true
              })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Users className="w-4 h-4 mr-2 inline" />
              Start Session
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
          <Users className="w-4 h-4" />
          <h2 className="text-sm font-medium">{session.name}</h2>
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', {
              'bg-green-500': session.status === 'active',
              'bg-yellow-500': session.status === 'paused',
              'bg-gray-500': session.status === 'ended'
            })} />
            <span className="text-xs text-muted-foreground">
              {session.participants.length} participants
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onVoiceToggle && onVoiceToggle(!voiceEnabled)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              voiceEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'hover:bg-accent'
            )}
            title={voiceEnabled ? 'Mute' : 'Unmute'}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onVideoToggle && onVideoToggle(!videoEnabled)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              videoEnabled
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'hover:bg-accent'
            )}
            title={videoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onScreenShare && onScreenShare(!screenShareEnabled)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              screenShareEnabled
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'hover:bg-accent'
            )}
            title={screenShareEnabled ? 'Stop Sharing' : 'Share Screen'}
          >
            <Share className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <>
            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {dragOver && (
                <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center z-10">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Drop files to share</p>
                  </div>
                </div>
              )}
              
              {replyToMessage && (
                <div className="p-3 bg-accent/20 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Replying to </span>
                      <span className="font-medium">
                        {getUserById(messages.find(m => m.id === replyToMessage)?.userId || '')?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyToMessage(null)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    {messages.find(m => m.id === replyToMessage)?.content}
                  </div>
                </div>
              )}
              
              <div className="space-y-0">
                {filteredMessages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
              
              {filteredMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                  title="Attach File"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full p-2 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 mr-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <button
                onClick={() => setShowInviteDialog(true)}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2 inline" />
                Invite
              </button>
            </div>
            
            <div className="space-y-2">
              {filteredUsers.map(user => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-accent/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                          getUserStatusColor(user.status)
                        )} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          <RoleIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {user.status}
                          {user.lastSeen && user.status === 'offline' && (
                            <span> * Last seen {formatTimestamp(user.lastSeen)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {currentUser?.id !== user.id && currentUser?.role === 'owner' && (
                      <div className="flex items-center gap-1">
                        <select
                          value={user.role}
                          onChange={(e) => onUserRoleChange && onUserRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 bg-background border border-border rounded text-sm"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        
                        <button
                          onClick={() => onUserRemove && onUserRemove(user.id)}
                          className="p-1 hover:bg-red-100 hover:text-red-700 rounded transition-colors"
                          title="Remove User"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {activities.map(activity => {
                const user = getUserById(activity.userId);
                const ActivityIcon = getActivityIcon(activity.type);
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 hover:bg-accent/20 rounded-lg transition-colors"
                  >
                    <div className="flex-shrink-0 p-2 bg-accent/30 rounded-full">
                      <ActivityIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{user?.name || 'Unknown User'}</span>
                        <span className="ml-1">{activity.description}</span>
                      </div>
                      
                      {activity.metadata && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {activity.metadata.file && (
                            <span>File: {activity.metadata.file}</span>
                          )}
                          {activity.metadata.line && (
                            <span> * Line: {activity.metadata.line}</span>
                          )}
                          {activity.metadata.commit && (
                            <span> * Commit: {activity.metadata.commit.substring(0, 7)}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Session Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow Screen Sharing</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.allowScreenShare}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow Voice Chat</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.allowVoiceChat}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow Video Chat</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.allowVideoChat}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow File Sharing</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.allowFileSharing}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Require Permission</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.requirePermission}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Record Session</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.recordSession}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">AI Moderation</label>
                    <input
                      type="checkbox"
                      defaultChecked={session.settings.aiModerationEnabled}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Danger Zone</h3>
                <button
                  onClick={onSessionEnd}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-background border border-border rounded-lg p-6 w-96">
            <h3 className="font-medium mb-4">Invite User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleInviteUser}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Send Invite
              </button>
              <button
                onClick={() => setShowInviteDialog(false)}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default CollaborationHub;