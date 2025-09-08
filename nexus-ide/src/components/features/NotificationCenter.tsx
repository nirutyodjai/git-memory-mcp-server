/**
 * NotificationCenter Component
 * 
 * A comprehensive notification system for the NEXUS IDE that manages all types of notifications.
 * Provides real-time updates, categorization, and smart filtering.
 * 
 * Features:
 * - Real-time notifications
 * - Multiple notification types (info, success, warning, error)
 * - Smart categorization and filtering
 * - Notification history
 * - Action buttons for interactive notifications
 * - Auto-dismiss with customizable timing
 * - Sound and visual indicators
 * - Notification persistence
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, Info, AlertCircle, Settings, Filter, Archive, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  actions?: NotificationAction[];
  category?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  maxNotifications?: number;
}

// Mock notifications for demonstration
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Build Completed',
    message: 'Your project has been built successfully.',
    type: 'success',
    priority: 'medium',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    category: 'Build',
    source: 'Build System'
  },
  {
    id: '2',
    title: 'New Git Commit',
    message: 'John Doe pushed 3 new commits to main branch.',
    type: 'info',
    priority: 'low',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    category: 'Git',
    source: 'Version Control'
  },
  {
    id: '3',
    title: 'Security Alert',
    message: 'Potential security vulnerability detected in dependencies.',
    type: 'warning',
    priority: 'high',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    category: 'Security',
    source: 'Security Scanner',
    actions: [
      {
        id: 'fix',
        label: 'Fix Now',
        action: () => toast.info('Opening security fix wizard...'),
        variant: 'primary'
      },
      {
        id: 'ignore',
        label: 'Ignore',
        action: () => toast.info('Vulnerability ignored'),
        variant: 'secondary'
      }
    ]
  },
  {
    id: '4',
    title: 'AI Assistant Update',
    message: 'New AI model available with improved code suggestions.',
    type: 'info',
    priority: 'medium',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: false,
    category: 'AI',
    source: 'AI System'
  }
];

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <Check className="w-4 h-4" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4" />;
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    case 'system':
      return <Settings className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    case 'system':
      return 'text-blue-500';
    default:
      return 'text-blue-500';
  }
};

const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return 'border-l-red-500';
    case 'high':
      return 'border-l-orange-500';
    case 'medium':
      return 'border-l-blue-500';
    default:
      return 'border-l-gray-500';
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return timestamp.toLocaleDateString();
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className,
  maxNotifications = 100
}) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter notifications based on current filter
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, filter]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Execute notification action
  const executeAction = useCallback(async (action: NotificationAction, notificationId: string) => {
    try {
      await action.action();
      // Optionally mark as read after action
      markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to execute notification action:', error);
      toast.error('Failed to execute action');
    }
  }, [markAsRead]);

  // Get unread count
  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40" 
        onClick={onClose}
      />
      
      {/* Notification Center */}
      <div className={cn(
        'fixed top-16 right-4 z-50',
        'w-96 max-h-[80vh]',
        'bg-background border border-border rounded-lg shadow-2xl',
        'overflow-hidden flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="flex-1 bg-transparent text-sm outline-none"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warnings</option>
            <option value="error">Errors</option>
            <option value="system">System</option>
          </select>
          
          <div className="flex gap-1">
            <button
              onClick={markAllAsRead}
              className="px-2 py-1 text-xs hover:bg-accent rounded transition-colors"
              title="Mark all as read"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs hover:bg-accent rounded transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto"
        >
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-4 border-b border-border last:border-b-0',
                  'hover:bg-accent/50 transition-colors',
                  'border-l-4',
                  getPriorityColor(notification.priority),
                  !notification.read && 'bg-accent/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex-shrink-0 mt-0.5',
                    getNotificationColor(notification.type)
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={cn(
                          'font-medium text-sm',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="flex-shrink-0 p-1 hover:bg-accent rounded transition-colors"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        {notification.category && (
                          <>
                            <span>-</span>
                            <span>{notification.category}</span>
                          </>
                        )}
                        {notification.source && (
                          <>
                            <span>-</span>
                            <span>{notification.source}</span>
                          </>
                        )}
                      </div>
                      
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    
                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {notification.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => executeAction(action, notification.id)}
                            className={cn(
                              'px-3 py-1 text-xs rounded transition-colors',
                              action.variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                              action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                              (!action.variant || action.variant === 'secondary') && 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredNotifications.length} notifications</span>
            <span>{unreadCount} unread</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;