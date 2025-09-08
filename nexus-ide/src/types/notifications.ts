// Notification system types for NEXUS IDE

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'loading'
  | 'ai'
  | 'git'
  | 'system'
  | 'plugin'
  | 'update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  description?: string;
  icon?: string;
  image?: string;
  timestamp: Date;
  duration?: number; // ms, 0 for persistent
  dismissible: boolean;
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
  read: boolean;
  archived: boolean;
  category?: string;
  tags?: string[];
  source?: string;
  relatedId?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void | Promise<void>;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
}

export interface NotificationMetadata {
  userId?: string;
  projectId?: string;
  fileId?: string;
  sessionId?: string;
  version?: string;
  environment?: string;
  [key: string]: any;
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: Notification[];
  collapsed: boolean;
  priority: NotificationPriority;
  count: number;
  unreadCount: number;
}

export interface NotificationFilter {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  categories?: string[];
  tags?: string[];
  sources?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  read?: boolean;
  archived?: boolean;
  search?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  position: NotificationPosition;
  maxVisible: number;
  defaultDuration: number;
  soundEnabled: boolean;
  soundVolume: number;
  desktopEnabled: boolean;
  groupSimilar: boolean;
  showPreview: boolean;
  animationEnabled: boolean;
  typeSettings: Record<NotificationType, NotificationTypeSettings>;
}

export interface NotificationTypeSettings {
  enabled: boolean;
  sound?: string;
  duration?: number;
  priority?: NotificationPriority;
  desktopEnabled?: boolean;
  showInCenter?: boolean;
}

export interface NotificationSound {
  id: string;
  name: string;
  url: string;
  volume: number;
  duration: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  actions?: Omit<NotificationAction, 'action'>[];
  variables?: string[];
}

export interface NotificationHistory {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  lastUpdated: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

// Notification events
export interface NotificationEvent {
  type: NotificationEventType;
  notification: Notification;
  timestamp: Date;
}

export type NotificationEventType = 
  | 'created'
  | 'updated'
  | 'dismissed'
  | 'read'
  | 'archived'
  | 'action_clicked'
  | 'expired';

// Toast notification specific types
export interface ToastNotification extends Omit<Notification, 'archived' | 'category' | 'tags'> {
  position?: NotificationPosition;
  pauseOnHover?: boolean;
  closeOnClick?: boolean;
  progress?: boolean;
  transition?: 'slide' | 'fade' | 'bounce' | 'zoom';
}

// System notification types
export interface SystemNotification extends Notification {
  type: 'system';
  systemType: SystemNotificationType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component?: string;
  errorCode?: string;
  resolution?: string;
}

export type SystemNotificationType = 
  | 'startup'
  | 'shutdown'
  | 'error'
  | 'warning'
  | 'update_available'
  | 'update_installed'
  | 'plugin_installed'
  | 'plugin_updated'
  | 'plugin_error'
  | 'connection_lost'
  | 'connection_restored'
  | 'low_memory'
  | 'high_cpu'
  | 'disk_full'
  | 'backup_completed'
  | 'backup_failed';

// AI notification types
export interface AINotification extends Notification {
  type: 'ai';
  aiType: AINotificationType;
  model?: string;
  tokens?: number;
  cost?: number;
  confidence?: number;
}

export type AINotificationType = 
  | 'suggestion'
  | 'completion'
  | 'analysis'
  | 'error_detected'
  | 'optimization'
  | 'refactor_suggestion'
  | 'test_generated'
  | 'documentation_generated'
  | 'code_review'
  | 'security_issue'
  | 'performance_issue';

// Git notification types
export interface GitNotification extends Notification {
  type: 'git';
  gitType: GitNotificationType;
  repository?: string;
  branch?: string;
  commit?: string;
  author?: string;
  files?: string[];
}

export type GitNotificationType = 
  | 'commit'
  | 'push'
  | 'pull'
  | 'merge'
  | 'conflict'
  | 'branch_created'
  | 'branch_deleted'
  | 'tag_created'
  | 'pr_created'
  | 'pr_merged'
  | 'pr_closed'
  | 'review_requested'
  | 'review_completed'
  | 'ci_success'
  | 'ci_failed'
  | 'deployment_success'
  | 'deployment_failed';

// Plugin notification types
export interface PluginNotification extends Notification {
  type: 'plugin';
  pluginType: PluginNotificationType;
  pluginId: string;
  pluginName: string;
  version?: string;
  author?: string;
}

export type PluginNotificationType = 
  | 'installed'
  | 'updated'
  | 'removed'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'deprecated'
  | 'security_update'
  | 'breaking_change'
  | 'new_feature';

// Update notification types
export interface UpdateNotification extends Notification {
  type: 'update';
  updateType: UpdateNotificationType;
  currentVersion: string;
  newVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
  size?: number;
  critical?: boolean;
}

export type UpdateNotificationType = 
  | 'app_update'
  | 'plugin_update'
  | 'dependency_update'
  | 'security_update'
  | 'feature_update'
  | 'bug_fix';

// Notification context for React
export interface NotificationContextValue {
  notifications: Notification[];
  groups: NotificationGroup[];
  settings: NotificationSettings;
  stats: NotificationStats;
  
  // Actions
  show: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  showToast: (toast: Omit<ToastNotification, 'id' | 'timestamp' | 'read'>) => string;
  showSystem: (system: Omit<SystemNotification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  showAI: (ai: Omit<AINotification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  showGit: (git: Omit<GitNotification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  showPlugin: (plugin: Omit<PluginNotification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  showUpdate: (update: Omit<UpdateNotification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  
  dismiss: (id: string) => void;
  dismissAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archive: (id: string) => void;
  archiveAll: () => void;
  remove: (id: string) => void;
  removeAll: () => void;
  
  filter: (filter: NotificationFilter) => Notification[];
  group: (notifications: Notification[]) => NotificationGroup[];
  
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  playSound: (sound: string) => void;
  
  // Event handlers
  onNotificationEvent: (handler: (event: NotificationEvent) => void) => () => void;
}

// Notification hook return type
export interface UseNotifications {
  notifications: Notification[];
  unreadCount: number;
  show: NotificationContextValue['show'];
  showToast: NotificationContextValue['showToast'];
  showSystem: NotificationContextValue['showSystem'];
  showAI: NotificationContextValue['showAI'];
  showGit: NotificationContextValue['showGit'];
  showPlugin: NotificationContextValue['showPlugin'];
  showUpdate: NotificationContextValue['showUpdate'];
  dismiss: NotificationContextValue['dismiss'];
  markAsRead: NotificationContextValue['markAsRead'];
  clear: () => void;
}

// Notification manager interface
export interface NotificationManager {
  notifications: Map<string, Notification>;
  groups: Map<string, NotificationGroup>;
  settings: NotificationSettings;
  
  add: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => string;
  update: (id: string, updates: Partial<Notification>) => void;
  remove: (id: string) => void;
  clear: () => void;
  
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archive: (id: string) => void;
  archiveAll: () => void;
  
  filter: (filter: NotificationFilter) => Notification[];
  search: (query: string) => Notification[];
  
  getStats: () => NotificationStats;
  getHistory: (limit?: number) => NotificationHistory;
  
  subscribe: (callback: (event: NotificationEvent) => void) => () => void;
  
  playSound: (sound: string) => Promise<void>;
  showDesktopNotification: (notification: Notification) => Promise<void>;
  
  export: () => string;
  import: (data: string) => void;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  position: 'top-right',
  maxVisible: 5,
  defaultDuration: 5000,
  soundEnabled: true,
  soundVolume: 0.5,
  desktopEnabled: true,
  groupSimilar: true,
  showPreview: true,
  animationEnabled: true,
  typeSettings: {
    info: { enabled: true, duration: 5000, priority: 'low' },
    success: { enabled: true, duration: 3000, priority: 'medium' },
    warning: { enabled: true, duration: 7000, priority: 'medium' },
    error: { enabled: true, duration: 0, priority: 'high' },
    loading: { enabled: true, duration: 0, priority: 'low' },
    ai: { enabled: true, duration: 5000, priority: 'medium' },
    git: { enabled: true, duration: 4000, priority: 'medium' },
    system: { enabled: true, duration: 6000, priority: 'high' },
    plugin: { enabled: true, duration: 4000, priority: 'low' },
    update: { enabled: true, duration: 0, priority: 'high' }
  }
};

// Notification sounds
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  {
    id: 'default',
    name: 'Default',
    url: '/sounds/notification-default.mp3',
    volume: 0.5,
    duration: 1000
  },
  {
    id: 'success',
    name: 'Success',
    url: '/sounds/notification-success.mp3',
    volume: 0.6,
    duration: 800
  },
  {
    id: 'error',
    name: 'Error',
    url: '/sounds/notification-error.mp3',
    volume: 0.7,
    duration: 1200
  },
  {
    id: 'warning',
    name: 'Warning',
    url: '/sounds/notification-warning.mp3',
    volume: 0.6,
    duration: 1000
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    url: '/sounds/notification-ai.mp3',
    volume: 0.4,
    duration: 900
  }
];