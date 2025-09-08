/**
 * Advanced Collaboration Hook for NEXUS IDE
 * Provides comprehensive real-time collaboration features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAI } from './useAI';
import { WebRTCService } from '../services/WebRTCService';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'guest';
  status: 'online' | 'away' | 'busy' | 'offline';
  cursor?: {
    line: number;
    column: number;
    fileId: string;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    fileId: string;
  };
  lastActivity: Date;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canManageUsers: boolean;
  };
}

export interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  owner: CollaborationUser;
  users: CollaborationUser[];
  isActive: boolean;
  isRecording: boolean;
  startTime: Date;
  endTime?: Date;
  projectId: string;
  settings: {
    allowGuests: boolean;
    requireApproval: boolean;
    maxUsers: number;
    recordSession: boolean;
    enableVoiceChat: boolean;
    enableVideoChat: boolean;
    enableScreenShare: boolean;
  };
}

export interface CollaborationComment {
  id: string;
  author: CollaborationUser;
  content: string;
  fileId: string;
  line: number;
  column: number;
  timestamp: Date;
  isResolved: boolean;
  replies: CollaborationComment[];
  reactions: {
    emoji: string;
    users: CollaborationUser[];
  }[];
  mentions: string[];
}

export interface CollaborationChange {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  fileId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  content: string;
  author: CollaborationUser;
  timestamp: Date;
  isApplied: boolean;
}

export interface CollaborationChatMessage {
  id: string;
  author: CollaborationUser;
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'file' | 'system';
  metadata?: {
    language?: string;
    fileName?: string;
    fileSize?: number;
  };
  reactions: {
    emoji: string;
    users: CollaborationUser[];
  }[];
  mentions: string[];
  isEdited: boolean;
  editedAt?: Date;
}

export interface CollaborationState {
  currentSession: CollaborationSession | null;
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  comments: CollaborationComment[];
  chatMessages: CollaborationChatMessage[];
  pendingChanges: CollaborationChange[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  voiceChat: {
    isEnabled: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    participants: CollaborationUser[];
  };
  videoChat: {
    isEnabled: boolean;
    isVideoOff: boolean;
    participants: CollaborationUser[];
    layout: 'grid' | 'speaker' | 'sidebar';
  };
  screenShare: {
    isSharing: boolean;
    isViewing: boolean;
    sharer: CollaborationUser | null;
    quality: 'low' | 'medium' | 'high';
  };
}

export interface CollaborationActions {
  // Session Management
  createSession: (name: string, description?: string) => Promise<string>;
  joinSession: (sessionId: string, password?: string) => Promise<void>;
  leaveSession: () => void;
  inviteUser: (email: string, role?: CollaborationUser['role']) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: CollaborationUser['role']) => Promise<void>;
  updateSessionSettings: (settings: Partial<CollaborationSession['settings']>) => Promise<void>;
  
  // Real-time Editing
  sendChange: (change: Omit<CollaborationChange, 'id' | 'author' | 'timestamp' | 'isApplied'>) => void;
  applyChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  updateCursor: (fileId: string, line: number, column: number) => void;
  updateSelection: (fileId: string, startLine: number, startColumn: number, endLine: number, endColumn: number) => void;
  
  // Comments
  addComment: (fileId: string, line: number, column: number, content: string, mentions?: string[]) => Promise<string>;
  replyToComment: (commentId: string, content: string, mentions?: string[]) => Promise<string>;
  resolveComment: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addReaction: (commentId: string, emoji: string) => Promise<void>;
  removeReaction: (commentId: string, emoji: string) => Promise<void>;
  
  // Chat
  sendChatMessage: (content: string, type?: CollaborationChatMessage['type'], metadata?: CollaborationChatMessage['metadata']) => Promise<string>;
  editChatMessage: (messageId: string, content: string) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  addChatReaction: (messageId: string, emoji: string) => Promise<void>;
  removeChatReaction: (messageId: string, emoji: string) => Promise<void>;
  
  // Voice Chat
  enableVoiceChat: () => Promise<void>;
  disableVoiceChat: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  
  // Video Chat
  enableVideoChat: () => Promise<void>;
  disableVideoChat: () => void;
  toggleVideo: () => void;
  changeVideoLayout: (layout: CollaborationState['videoChat']['layout']) => void;
  
  // Screen Share
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  changeScreenShareQuality: (quality: CollaborationState['screenShare']['quality']) => void;
  
  // AI Assistant
  askAIAssistant: (question: string, context?: string) => Promise<string>;
  generateMeetingSummary: () => Promise<string>;
  generateActionItems: () => Promise<string[]>;
  transcribeVoiceChat: (enable: boolean) => void;
}

const WEBSOCKET_URL = 'ws://localhost:3001/collaboration';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useCollaboration(): CollaborationState & CollaborationActions {
  const [state, setState] = useState<CollaborationState>({
    currentSession: null,
    users: [],
    currentUser: null,
    comments: [],
    chatMessages: [],
    pendingChanges: [],
    isConnected: false,
    isConnecting: false,
    error: null,
    voiceChat: {
      isEnabled: false,
      isMuted: false,
      isDeafened: false,
      participants: []
    },
    videoChat: {
      isEnabled: false,
      isVideoOff: false,
      participants: [],
      layout: 'grid'
    },
    screenShare: {
      isSharing: false,
      isViewing: false,
      sharer: null,
      quality: 'medium'
    }
  });

  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const { generateCode, explainCode } = useAI();

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    const ws = new WebSocket(WEBSOCKET_URL);
    
    ws.onopen = () => {
      console.log('Collaboration WebSocket connected');
      setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Collaboration WebSocket disconnected');
      setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
      
      // Attempt to reconnect
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, RECONNECT_INTERVAL);
      } else {
        setState(prev => ({ ...prev, error: 'Failed to connect to collaboration server' }));
      }
    };

    ws.onerror = (error) => {
      console.error('Collaboration WebSocket error:', error);
      setState(prev => ({ ...prev, error: 'Connection error' }));
    };

    websocketRef.current = ws;
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'session_joined':
        setState(prev => ({
          ...prev,
          currentSession: data.session,
          users: data.session.users,
          currentUser: data.currentUser
        }));
        break;

      case 'user_joined':
        setState(prev => ({
          ...prev,
          users: [...prev.users, data.user],
          chatMessages: [
            ...prev.chatMessages,
            {
              id: Date.now().toString(),
              author: { ...data.user, name: 'System' } as CollaborationUser,
              content: `${data.user.name} joined the session`,
              timestamp: new Date(),
              type: 'system',
              reactions: [],
              mentions: [],
              isEdited: false
            }
          ]
        }));
        break;

      case 'user_left':
        setState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.id !== data.userId),
          chatMessages: [
            ...prev.chatMessages,
            {
              id: Date.now().toString(),
              author: { id: 'system', name: 'System' } as CollaborationUser,
              content: `${data.userName} left the session`,
              timestamp: new Date(),
              type: 'system',
              reactions: [],
              mentions: [],
              isEdited: false
            }
          ]
        }));
        break;

      case 'cursor_update':
        setState(prev => ({
          ...prev,
          users: prev.users.map(user => 
            user.id === data.userId
              ? { ...user, cursor: data.cursor }
              : user
          )
        }));
        break;

      case 'selection_update':
        setState(prev => ({
          ...prev,
          users: prev.users.map(user => 
            user.id === data.userId
              ? { ...user, selection: data.selection }
              : user
          )
        }));
        break;

      case 'change_received':
        setState(prev => ({
          ...prev,
          pendingChanges: [...prev.pendingChanges, data.change]
        }));
        break;

      case 'comment_added':
        setState(prev => ({
          ...prev,
          comments: [...prev.comments, data.comment]
        }));
        break;

      case 'chat_message':
        setState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, data.message]
        }));
        break;

      case 'voice_chat_update':
        setState(prev => ({
          ...prev,
          voiceChat: { ...prev.voiceChat, ...data.voiceChat }
        }));
        break;

      case 'video_chat_update':
        setState(prev => ({
          ...prev,
          videoChat: { ...prev.videoChat, ...data.videoChat }
        }));
        break;

      case 'screen_share_update':
        setState(prev => ({
          ...prev,
          screenShare: { ...prev.screenShare, ...data.screenShare }
        }));
        break;

      case 'error':
        setState(prev => ({ ...prev, error: data.message }));
        break;
    }
  }, []);

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Initialize WebRTC service
  useEffect(() => {
    webrtcServiceRef.current = WebRTCService.getInstance();
  }, []);

  // Send WebSocket message
  const sendMessage = useCallback((message: any) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  // Create collaboration session
  const createSession = useCallback(async (name: string, description = ''): Promise<string> => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    sendMessage({
      type: 'create_session',
      sessionId,
      name,
      description,
      settings: {
        allowGuests: true,
        requireApproval: false,
        maxUsers: 10,
        recordSession: false,
        enableVoiceChat: true,
        enableVideoChat: true,
        enableScreenShare: true
      }
    });

    return sessionId;
  }, [sendMessage]);

  // Join collaboration session
  const joinSession = useCallback(async (sessionId: string, password?: string): Promise<void> => {
    sendMessage({
      type: 'join_session',
      sessionId,
      password
    });
  }, [sendMessage]);

  // Leave collaboration session
  const leaveSession = useCallback(() => {
    sendMessage({ type: 'leave_session' });
    setState(prev => ({
      ...prev,
      currentSession: null,
      users: [],
      currentUser: null,
      comments: [],
      chatMessages: [],
      pendingChanges: []
    }));
  }, [sendMessage]);

  // Send real-time change
  const sendChange = useCallback((change: Omit<CollaborationChange, 'id' | 'author' | 'timestamp' | 'isApplied'>) => {
    const fullChange: CollaborationChange = {
      ...change,
      id: Date.now().toString(),
      author: state.currentUser!,
      timestamp: new Date(),
      isApplied: false
    };

    sendMessage({
      type: 'send_change',
      change: fullChange
    });
  }, [sendMessage, state.currentUser]);

  // Update cursor position
  const updateCursor = useCallback((fileId: string, line: number, column: number) => {
    sendMessage({
      type: 'update_cursor',
      cursor: { fileId, line, column }
    });
  }, [sendMessage]);

  // Add comment
  const addComment = useCallback(async (fileId: string, line: number, column: number, content: string, mentions: string[] = []): Promise<string> => {
    const commentId = Date.now().toString();
    
    sendMessage({
      type: 'add_comment',
      comment: {
        id: commentId,
        fileId,
        line,
        column,
        content,
        mentions,
        timestamp: new Date()
      }
    });

    return commentId;
  }, [sendMessage]);

  // Send chat message
  const sendChatMessage = useCallback(async (content: string, type: CollaborationChatMessage['type'] = 'text', metadata?: CollaborationChatMessage['metadata']): Promise<string> => {
    const messageId = Date.now().toString();
    
    sendMessage({
      type: 'send_chat_message',
      message: {
        id: messageId,
        content,
        type,
        metadata,
        timestamp: new Date()
      }
    });

    return messageId;
  }, [sendMessage]);

  // Enable voice chat
  const enableVoiceChat = useCallback(async (): Promise<void> => {
    try {
      await webrtcServiceRef.current?.initializeAudio();
      setState(prev => ({
        ...prev,
        voiceChat: { ...prev.voiceChat, isEnabled: true }
      }));
      
      sendMessage({ type: 'enable_voice_chat' });
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to enable voice chat' }));
    }
  }, [sendMessage]);

  // Enable video chat
  const enableVideoChat = useCallback(async (): Promise<void> => {
    try {
      await webrtcServiceRef.current?.initializeVideo();
      setState(prev => ({
        ...prev,
        videoChat: { ...prev.videoChat, isEnabled: true }
      }));
      
      sendMessage({ type: 'enable_video_chat' });
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to enable video chat' }));
    }
  }, [sendMessage]);

  // Start screen share
  const startScreenShare = useCallback(async (): Promise<void> => {
    try {
      await webrtcServiceRef.current?.startScreenShare();
      setState(prev => ({
        ...prev,
        screenShare: { ...prev.screenShare, isSharing: true }
      }));
      
      sendMessage({ type: 'start_screen_share' });
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to start screen share' }));
    }
  }, [sendMessage]);

  // Ask AI assistant
  const askAIAssistant = useCallback(async (question: string, context?: string): Promise<string> => {
    try {
      const prompt = `${context ? `Context: ${context}\n\n` : ''}Question: ${question}`;
      const response = await generateCode(prompt, 'text');
      return response || 'Sorry, I could not generate a response.';
    } catch (error) {
      throw new Error('Failed to get AI response');
    }
  }, [generateCode]);

  // Generate meeting summary
  const generateMeetingSummary = useCallback(async (): Promise<string> => {
    try {
      const chatHistory = state.chatMessages
        .filter(msg => msg.type !== 'system')
        .map(msg => `${msg.author.name}: ${msg.content}`)
        .join('\n');
      
      const prompt = `Generate a meeting summary based on this chat history:\n\n${chatHistory}`;
      const summary = await generateCode(prompt, 'text');
      return summary || 'No summary available.';
    } catch (error) {
      throw new Error('Failed to generate meeting summary');
    }
  }, [generateCode, state.chatMessages]);

  return {
    ...state,
    createSession,
    joinSession,
    leaveSession,
    inviteUser: async () => {},
    removeUser: async () => {},
    updateUserRole: async () => {},
    updateSessionSettings: async () => {},
    sendChange,
    applyChange: () => {},
    rejectChange: () => {},
    updateCursor,
    updateSelection: () => {},
    addComment,
    replyToComment: async () => '',
    resolveComment: async () => {},
    deleteComment: async () => {},
    addReaction: async () => {},
    removeReaction: async () => {},
    sendChatMessage,
    editChatMessage: async () => {},
    deleteChatMessage: async () => {},
    addChatReaction: async () => {},
    removeChatReaction: async () => {},
    enableVoiceChat,
    disableVoiceChat: () => {},
    toggleMute: () => {},
    toggleDeafen: () => {},
    enableVideoChat,
    disableVideoChat: () => {},
    toggleVideo: () => {},
    changeVideoLayout: () => {},
    startScreenShare,
    stopScreenShare: () => {},
    changeScreenShareQuality: () => {},
    askAIAssistant,
    generateMeetingSummary,
    generateActionItems: async () => [],
    transcribeVoiceChat: () => {}
  };
}

export default useCollaboration;