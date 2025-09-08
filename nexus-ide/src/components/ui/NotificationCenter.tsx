import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Filter,
  Archive,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Tag,
  User,
  Code,
  GitBranch,
  Terminal,
  Bug,
  Lightbulb,
  Download,
  Upload,
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  Cpu,
  HardDrive,
  Activity,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldAlert,
  Globe,
  Package,
  Folder,
  FileText,
  Image,
  Video,
  Music,
  Archive as ArchiveIcon,
} from 'lucide-react';

// Notification types
type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'system'
  | 'git'
  | 'ai'
  | 'debug'
  | 'terminal'
  | 'file'
  | 'network'
  | 'security'
  | 'performance'
  | 'update';

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';

interface NotificationAction {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
}

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  status: NotificationStatus;
  source?: string;
  category?: string;
  tags?: string[];
  actions?: NotificationAction[];
  data?: Record<string, any>;
  persistent?: boolean;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  progress?: number; // 0-100
  icon?: React.ComponentType<{ className?: string }>;
  image?: string;
  link?: string;
  groupId?: string;
}

interface NotificationGroup {
  id: string;
  title: string;
  notifications: Notification[];
  collapsed?: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  maxNotifications?: number;
  autoHideDelay?: number;
  enableSound?: boolean;
  enableDesktopNotifications?: boolean;
}

interface NotificationFilter {
  types: NotificationType[];
  priorities: NotificationPriority[];
  statuses: NotificationStatus[];
  sources: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  maxNotifications = 100,
  autoHideDelay = 5000,
  enableSound = true,
  enableDesktopNotifications = true,
}) => {
  const { actualTheme } = useTheme();
  const { sendMessage } = useMCP();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>({
    types: [],
    priorities: [],
    statuses: [],
    sources: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'type'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [groupByType, setGroupByType] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(enableDesktopNotifications);

  // Get notification icon
  const getNotificationIcon = (type: NotificationType, customIcon?: React.ComponentType<{ className?: string }>) => {
    if (customIcon) return customIcon;
    
    const icons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
      system: Settings,
      git: GitBranch,
      ai: Lightbulb,
      debug: Bug,
      terminal: Terminal,
      file: FileText,
      network: Globe,
      security: Shield,
      performance: Activity,
      update: Download,
    };
    
    return icons[type] || Bell;
  };

  // Get notification color
  const getNotificationColor = (type: NotificationType, priority: NotificationPriority) => {
    const typeColors: Record<NotificationType, string> = {
      info: 'text-blue-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      system: 'text-gray-500',
      git: 'text-orange-500',
      ai: 'text-purple-500',
      debug: 'text-pink-500',
      terminal: 'text-cyan-500',
      file: 'text-indigo-500',
      network: 'text-teal-500',
      security: 'text-red-600',
      performance: 'text-green-600',
      update: 'text-blue-600',
    };
    
    if (priority === 'urgent') return 'text-red-600';
    if (priority === 'high') return 'text-orange-500';
    
    return typeColors[type] || 'text-gray-500';
  };

  // Get priority badge
  const getPriorityBadge = (priority: NotificationPriority) => {
    const badges: Record<NotificationPriority, { label: string; className: string }> = {
      low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
      normal: { label: 'Normal', className: 'bg-blue-100 text-blue-600' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-600' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-600' },
    };
    
    return badges[priority];
  };

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'unread',
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });
    
    // Play sound
    if (soundEnabled && notification.priority !== 'low') {
      playNotificationSound(notification.type, notification.priority);
    }
    
    // Show desktop notification
    if (desktopNotificationsEnabled && notification.priority !== 'low') {
      showDesktopNotification(newNotification);
    }
    
    // Auto-hide if specified
    if (notification.autoHide !== false && !notification.persistent) {
      const hideDelay = notification.hideAfter || autoHideDelay;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, hideDelay);
    }
    
    return newNotification.id;
  }, [maxNotifications, soundEnabled, desktopNotificationsEnabled, autoHideDelay]);

  // Update notification
  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    updateNotification(id, { status: 'read' });
  }, [updateNotification]);

  // Mark as archived
  const markAsArchived = useCallback((id: string) => {
    updateNotification(id, { status: 'archived' });
  }, [updateNotification]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.status === 'unread'
          ? { ...notification, status: 'read' }
          : notification
      )
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Archive all notifications
  const archiveAllNotifications = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, status: 'archived' }))
    );
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback((type: NotificationType, priority: NotificationPriority) => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different types and priorities
      let frequency = 440; // A4
      let duration = 200;
      
      switch (priority) {
        case 'urgent':
          frequency = 880; // A5
          duration = 500;
          break;
        case 'high':
          frequency = 660; // E5
          duration = 300;
          break;
        case 'normal':
          frequency = 440; // A4
          duration = 200;
          break;
        case 'low':
          frequency = 330; // E4
          duration = 100;
          break;
      }
      
      if (type === 'error' || type === 'security') {
        frequency *= 0.8; // Lower pitch for errors
      } else if (type === 'success') {
        frequency *= 1.2; // Higher pitch for success
      }
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [soundEnabled]);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: Notification) => {
    if (!desktopNotificationsEnabled || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
      });
      
      desktopNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        desktopNotification.close();
      };
      
      // Auto-close after delay
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          desktopNotification.close();
        }, autoHideDelay);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showDesktopNotification(notification);
        }
      });
    }
  }, [desktopNotificationsEnabled, autoHideDelay, markAsRead]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Filter by tab
    switch (selectedTab) {
      case 'unread':
        filtered = filtered.filter(n => n.status === 'unread');
        break;
      case 'archived':
        filtered = filtered.filter(n => n.status === 'archived');
        break;
      default:
        filtered = filtered.filter(n => n.status !== 'archived');
        break;
    }
    
    // Apply filters
    if (filter.types.length > 0) {
      filtered = filtered.filter(n => filter.types.includes(n.type));
    }
    
    if (filter.priorities.length > 0) {
      filtered = filtered.filter(n => filter.priorities.includes(n.priority));
    }
    
    if (filter.statuses.length > 0) {
      filtered = filtered.filter(n => filter.statuses.includes(n.status));
    }
    
    if (filter.sources.length > 0) {
      filtered = filtered.filter(n => n.source && filter.sources.includes(n.source));
    }
    
    if (filter.dateRange) {
      filtered = filtered.filter(n => 
        n.timestamp >= filter.dateRange!.start && 
        n.timestamp <= filter.dateRange!.end
      );
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.source?.toLowerCase().includes(query) ||
        n.category?.toLowerCase().includes(query) ||
        n.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort notifications
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [notifications, selectedTab, filter, searchQuery, sortBy, sortOrder]);

  // Group notifications
  const groupedNotifications = useMemo(() => {
    if (!groupByType) {
      return [{ id: 'all', title: 'All Notifications', notifications: filteredNotifications }];
    }
    
    const groups: Record<string, NotificationGroup> = {};
    
    filteredNotifications.forEach(notification => {
      const groupKey = notification.groupId || notification.type;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          title: notification.groupId ? `Group: ${notification.groupId}` : notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
          notifications: [],
        };
      }
      groups[groupKey].notifications.push(notification);
    });
    
    return Object.values(groups);
  }, [filteredNotifications, groupByType]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.status === 'unread').length;
  }, [notifications]);

  // Handle notification action
  const handleNotificationAction = useCallback(async (notification: Notification, action: NotificationAction) => {
    try {
      await action.action();
      
      // Mark as read after action
      markAsRead(notification.id);
      
      // Send analytics
      sendMessage('analytics-notification-action', {
        notificationId: notification.id,
        actionId: action.id,
        type: notification.type,
        priority: notification.priority,
        timestamp: new Date().toISOString(),
      }).catch(console.error);
    } catch (error) {
      console.error('Notification action error:', error);
      
      // Show error notification
      addNotification({
        type: 'error',
        priority: 'high',
        title: 'Action Failed',
        message: `Failed to execute action: ${action.label}`,
        source: 'notification-center',
      });
    }
  }, [markAsRead, sendMessage, addNotification]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: 'read' | 'archive' | 'delete') => {
    selectedNotifications.forEach(id => {
      switch (action) {
        case 'read':
          markAsRead(id);
          break;
        case 'archive':
          markAsArchived(id);
          break;
        case 'delete':
          removeNotification(id);
          break;
      }
    });
    
    setSelectedNotifications([]);
  }, [selectedNotifications, markAsRead, markAsArchived, removeNotification]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }, []);

  // Listen for new notifications from MCP
  useEffect(() => {
    const handleMCPNotification = (event: CustomEvent) => {
      const { type, priority, title, message, source, data } = event.detail;
      
      addNotification({
        type: type || 'system',
        priority: priority || 'normal',
        title,
        message,
        source: source || 'mcp',
        data,
      });
    };
    
    window.addEventListener('nexus:notification', handleMCPNotification as EventListener);
    
    return () => {
      window.removeEventListener('nexus:notification', handleMCPNotification as EventListener);
    };
  }, [addNotification]);

  // Initialize with sample notifications (for demo)
  useEffect(() => {
    const sampleNotifications = [
      {
        type: 'success' as NotificationType,
        priority: 'normal' as NotificationPriority,
        title: 'Build Successful',
        message: 'Your project has been built successfully.',
        source: 'build-system',
        category: 'build',
      },
      {
        type: 'ai' as NotificationType,
        priority: 'high' as NotificationPriority,
        title: 'AI Suggestion Available',
        message: 'I found a potential optimization for your code.',
        source: 'ai-assistant',
        category: 'ai',
        actions: [
          {
            id: 'view-suggestion',
            label: 'View Suggestion',
            action: () => console.log('View AI suggestion'),
            style: 'primary' as const,
            icon: Lightbulb,
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            action: () => console.log('Dismiss suggestion'),
            style: 'secondary' as const,
          },
        ],
      },
      {
        type: 'git' as NotificationType,
        priority: 'normal' as NotificationPriority,
        title: 'New Commits Available',
        message: '3 new commits are available to pull from origin/main.',
        source: 'git',
        category: 'version-control',
        actions: [
          {
            id: 'pull-changes',
            label: 'Pull Changes',
            action: () => console.log('Pull git changes'),
            style: 'primary' as const,
            icon: Download,
          },
        ],
      },
      {
        type: 'warning' as NotificationType,
        priority: 'high' as NotificationPriority,
        title: 'High Memory Usage',
        message: 'Your application is using 85% of available memory.',
        source: 'performance-monitor',
        category: 'performance',
        progress: 85,
      },
    ];
    
    // Add sample notifications with delay
    sampleNotifications.forEach((notification, index) => {
      setTimeout(() => {
        addNotification(notification);
      }, index * 1000);
    });
  }, [addNotification]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
      <div className="w-96 max-h-[80vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded transition-colors ${
                soundEnabled
                  ? 'text-foreground hover:bg-accent'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['all', 'unread', 'archived'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'unread' && unreadCount > 0 && (
                <span className="ml-1 text-xs">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-background border border-border rounded px-2 py-1"
              >
                <option value="timestamp">Time</option>
                <option value="priority">Priority</option>
                <option value="type">Type</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-accent rounded transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              <button
                onClick={() => setGroupByType(!groupByType)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  groupByType
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                Group
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              {selectedNotifications.length > 0 && (
                <>
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="text-xs px-2 py-1 bg-muted hover:bg-accent rounded transition-colors"
                    title="Mark selected as read"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="text-xs px-2 py-1 bg-muted hover:bg-accent rounded transition-colors"
                    title="Archive selected"
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="text-xs px-2 py-1 bg-muted hover:bg-accent rounded transition-colors text-red-500"
                    title="Delete selected"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
              
              <button
                onClick={markAllAsRead}
                className="text-xs px-2 py-1 bg-muted hover:bg-accent rounded transition-colors"
                title="Mark all as read"
              >
                <Check className="w-3 h-3" />
              </button>
              
              <button
                onClick={clearAllNotifications}
                className="text-xs px-2 py-1 bg-muted hover:bg-accent rounded transition-colors text-red-500"
                title="Clear all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            groupedNotifications.map(group => (
              <div key={group.id} className="border-b border-border last:border-b-0">
                {groupByType && (
                  <div className="px-4 py-2 bg-muted/30 text-sm font-medium text-muted-foreground">
                    {group.title} ({group.notifications.length})
                  </div>
                )}
                
                {group.notifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type, notification.icon);
                  const isSelected = selectedNotifications.includes(notification.id);
                  const priorityBadge = getPriorityBadge(notification.priority);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-accent/50 transition-colors border-l-4 ${
                        notification.status === 'unread'
                          ? 'border-l-primary bg-primary/5'
                          : 'border-l-transparent'
                      } ${isSelected ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            } else {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            }
                          }}
                          className="mt-1"
                        />
                        
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          getNotificationColor(notification.type, notification.priority)
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                            <div className="flex items-center space-x-2 ml-2">
                              {notification.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  priorityBadge.className
                                }`}>
                                  {priorityBadge.label}
                                </span>
                              )}
                              
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          {notification.progress !== undefined && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{notification.progress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${notification.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {notification.tags && notification.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {notification.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {notification.actions.map(action => {
                                const ActionIcon = action.icon;
                                return (
                                  <button
                                    key={action.id}
                                    onClick={() => handleNotificationAction(notification, action)}
                                    className={`inline-flex items-center px-3 py-1 text-xs rounded transition-colors ${
                                      action.style === 'primary'
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : action.style === 'destructive'
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-muted text-muted-foreground hover:bg-accent'
                                    }`}
                                  >
                                    {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                                    {action.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {notification.source && (
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {notification.source}
                                </span>
                              )}
                              {notification.category && (
                                <span className="flex items-center">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {notification.category}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {notification.status === 'unread' && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 hover:bg-accent rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => markAsArchived(notification.id)}
                                className="p-1 hover:bg-accent rounded transition-colors"
                                title="Archive"
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                              
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="p-1 hover:bg-accent rounded transition-colors text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;

// Notification center utilities
export const useNotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'unread',
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Dispatch custom event for global notification handling
    window.dispatchEvent(new CustomEvent('nexus:notification', {
      detail: newNotification,
    }));
    
    return newNotification.id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.status === 'unread').length;
  }, [notifications]);

  return {
    isOpen,
    open,
    close,
    toggle,
    notifications,
    addNotification,
    removeNotification,
    updateNotification,
    unreadCount,
  };
};

// Export notification center component with display name
NotificationCenter.displayName = 'NotificationCenter';

export { NotificationCenter };
export type { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus,
  NotificationAction,
  NotificationCenterProps 
};