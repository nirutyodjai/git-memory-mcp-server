'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  avatar?: string;
  joinedAt: Date;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  timestamp: Date;
  roomId: string;
}

interface OnlineUsersData {
  count: number;
  users: User[];
}

interface TypingUser {
  socketId: string;
  username: string;
  timestamp: Date;
}

interface Notification {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  timestamp: Date;
}

export function useSocket(serverPath?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUsersData>({ count: 0, users: [] });
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socketInstance = io(serverPath || process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || '' 
      : 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      upgrade: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Online users events
    socketInstance.on('users:online', (data: OnlineUsersData) => {
      setOnlineUsers(data);
    });

    // Message events
    socketInstance.on('message:received', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketInstance.on('message:error', (error: { error: string; timestamp: Date }) => {
      console.error('Message error:', error);
      // You can add toast notification here
    });

    // Typing events
    socketInstance.on('typing:user-started', (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.socketId !== data.socketId);
        return [...filtered, data];
      });
    });

    socketInstance.on('typing:user-stopped', (data: TypingUser) => {
      setTypingUsers(prev => prev.filter(user => user.socketId !== data.socketId));
    });

    // Notification events
    socketInstance.on('notification:received', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Room events
    socketInstance.on('user:joined-room', (data) => {
      console.log('User joined room:', data);
    });

    socketInstance.on('user:left-room', (data) => {
      console.log('User left room:', data);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [serverPath]);

  // Join as user
  const joinAsUser = useCallback((userData: {
    id: string;
    username: string;
    avatar?: string;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('user:join', userData);
    }
  }, []);

  // Join room
  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('room:join', roomId);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave', roomId);
    }
  }, []);

  // Send message
  const sendMessage = useCallback((data: {
    roomId: string;
    message: string;
    userId: string;
    username: string;
    avatar?: string;
  }) => {
    if (socketRef.current && data.message.trim()) {
      socketRef.current.emit('message:send', data);
    }
  }, []);

  // Start typing
  const startTyping = useCallback((data: {
    roomId: string;
    username: string;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('typing:start', data);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(data);
      }, 3000);
    }
  }, []);

  // Stop typing
  const stopTyping = useCallback((data: {
    roomId: string;
    username: string;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('typing:stop', data);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, []);

  // Auto-stop typing after delay
  const handleTyping = useCallback((data: { roomId: string; username: string }) => {
    startTyping(data);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(data);
    }, 3000); // Stop typing after 3 seconds of inactivity
  }, [startTyping, stopTyping]);

  // Send notification
  const sendNotification = useCallback((data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('notification:send', data);
    }
  }, []);

  // Clear messages for a room
  const clearMessages = useCallback((roomId?: string) => {
    if (roomId) {
      setMessages(prev => prev.filter(msg => msg.roomId !== roomId));
    } else {
      setMessages([]);
    }
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Get room messages
  const getRoomMessages = useCallback((roomId: string) => {
    return messages.filter(message => message.roomId === roomId);
  }, [messages]);

  // Get typing users for room
  const getRoomTypingUsers = useCallback((roomId: string) => {
    return typingUsers.filter(user => 
      // Note: We'd need to track room association for typing users
      // This is a simplified version
      true
    );
  }, [typingUsers]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    onlineUsers,
    messages,
    typingUsers,
    notifications,
    
    // Actions
    joinAsUser,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    handleTyping,
    sendNotification,
    clearMessages,
    clearNotifications,
    removeNotification,
    markNotificationAsRead,
    reconnect,
    
    // Getters
    getRoomMessages,
    getRoomTypingUsers,
  };
}

// Hook for chat room functionality
export function useChatRoom(roomId: string, user: {
  id: string;
  username: string;
  avatar?: string;
}) {
  const {
    socket,
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    handleTyping,
    joinRoom,
    leaveRoom,
    clearMessages,
  } = useSocket();

  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Filter messages for this room
  useEffect(() => {
    setRoomMessages(messages.filter(msg => msg.roomId === roomId));
  }, [messages, roomId]);

  // Join room on mount
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  // Send message for this room
  const sendRoomMessage = useCallback((message: string) => {
    sendMessage({
      roomId,
      message,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });
  }, [sendMessage, roomId, user]);

  // Handle typing for this room
  const handleRoomTyping = useCallback(() => {
    handleTyping({
      roomId,
      username: user.username,
    });
  }, [handleTyping, roomId, user.username]);

  // Get typing users for this room (excluding current user)
  const roomTypingUsers = typingUsers.filter(typingUser => 
    typingUser.username !== user.username
  );

  return {
    socket,
    isConnected,
    messages: roomMessages,
    typingUsers: roomTypingUsers,
    isTyping,
    sendMessage: sendRoomMessage,
    handleTyping: handleRoomTyping,
    clearMessages: () => clearMessages(roomId),
  };
}

// Hook for notifications
export function useNotifications(userId: string) {
  const {
    notifications,
    sendNotification,
    clearNotifications,
    markNotificationAsRead,
  } = useSocket();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const sendToUser = useCallback((targetUserId: string, data: {
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) => {
    sendNotification({
      userId: targetUserId,
      ...data,
    });
  }, [sendNotification]);

  return {
    notifications,
    unreadCount,
    sendToUser,
    clearAll: clearNotifications,
    markAsRead: markNotificationAsRead,
  };
}