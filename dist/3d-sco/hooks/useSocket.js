"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSocket = useSocket;
exports.useChatRoom = useChatRoom;
exports.useNotifications = useNotifications;
const react_1 = require("react");
const socket_io_client_1 = require("socket.io-client");
function useSocket(serverPath) {
    const [socket, setSocket] = (0, react_1.useState)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [onlineUsers, setOnlineUsers] = (0, react_1.useState)({ count: 0, users: [] });
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [typingUsers, setTypingUsers] = (0, react_1.useState)([]);
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [connectionError, setConnectionError] = (0, react_1.useState)(null);
    const socketRef = (0, react_1.useRef)(null);
    const typingTimeoutRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const socketInstance = (0, socket_io_client_1.io)(serverPath || process.env.NODE_ENV === 'production'
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
        socketInstance.on('users:online', (data) => {
            setOnlineUsers(data);
        });
        // Message events
        socketInstance.on('message:received', (message) => {
            setMessages(prev => [...prev, message]);
        });
        socketInstance.on('message:error', (error) => {
            console.error('Message error:', error);
            // You can add toast notification here
        });
        // Typing events
        socketInstance.on('typing:user-started', (data) => {
            setTypingUsers(prev => {
                const filtered = prev.filter(user => user.socketId !== data.socketId);
                return [...filtered, data];
            });
        });
        socketInstance.on('typing:user-stopped', (data) => {
            setTypingUsers(prev => prev.filter(user => user.socketId !== data.socketId));
        });
        // Notification events
        socketInstance.on('notification:received', (notification) => {
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
    const joinAsUser = (0, react_1.useCallback)((userData) => {
        if (socketRef.current) {
            socketRef.current.emit('user:join', userData);
        }
    }, []);
    // Join room
    const joinRoom = (0, react_1.useCallback)((roomId) => {
        if (socketRef.current) {
            socketRef.current.emit('room:join', roomId);
        }
    }, []);
    // Leave room
    const leaveRoom = (0, react_1.useCallback)((roomId) => {
        if (socketRef.current) {
            socketRef.current.emit('room:leave', roomId);
        }
    }, []);
    // Send message
    const sendMessage = (0, react_1.useCallback)((data) => {
        if (socketRef.current && data.message.trim()) {
            socketRef.current.emit('message:send', data);
        }
    }, []);
    // Start typing
    const startTyping = (0, react_1.useCallback)((data) => {
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
    const stopTyping = (0, react_1.useCallback)((data) => {
        if (socketRef.current) {
            socketRef.current.emit('typing:stop', data);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
    }, []);
    // Auto-stop typing after delay
    const handleTyping = (0, react_1.useCallback)((data) => {
        startTyping(data);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(data);
        }, 3000); // Stop typing after 3 seconds of inactivity
    }, [startTyping, stopTyping]);
    // Send notification
    const sendNotification = (0, react_1.useCallback)((data) => {
        if (socketRef.current) {
            socketRef.current.emit('notification:send', data);
        }
    }, []);
    // Clear messages for a room
    const clearMessages = (0, react_1.useCallback)((roomId) => {
        if (roomId) {
            setMessages(prev => prev.filter(msg => msg.roomId !== roomId));
        }
        else {
            setMessages([]);
        }
    }, []);
    // Clear notifications
    const clearNotifications = (0, react_1.useCallback)(() => {
        setNotifications([]);
    }, []);
    // Remove specific notification
    const removeNotification = (0, react_1.useCallback)((index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);
    // Get room messages
    const getRoomMessages = (0, react_1.useCallback)((roomId) => {
        return messages.filter(message => message.roomId === roomId);
    }, [messages]);
    // Get typing users for room
    const getRoomTypingUsers = (0, react_1.useCallback)((roomId) => {
        return typingUsers.filter(user => 
        // Note: We'd need to track room association for typing users
        // This is a simplified version
        true);
    }, [typingUsers]);
    // Mark notification as read
    const markNotificationAsRead = (0, react_1.useCallback)((index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);
    // Reconnect function
    const reconnect = (0, react_1.useCallback)(() => {
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
function useChatRoom(roomId, user) {
    const { socket, isConnected, messages, typingUsers, sendMessage, handleTyping, joinRoom, leaveRoom, clearMessages, } = useSocket();
    const [roomMessages, setRoomMessages] = (0, react_1.useState)([]);
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    // Filter messages for this room
    (0, react_1.useEffect)(() => {
        setRoomMessages(messages.filter(msg => msg.roomId === roomId));
    }, [messages, roomId]);
    // Join room on mount
    (0, react_1.useEffect)(() => {
        if (isConnected && roomId) {
            joinRoom(roomId);
            return () => {
                leaveRoom(roomId);
            };
        }
    }, [isConnected, roomId, joinRoom, leaveRoom]);
    // Send message for this room
    const sendRoomMessage = (0, react_1.useCallback)((message) => {
        sendMessage({
            roomId,
            message,
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
        });
    }, [sendMessage, roomId, user]);
    // Handle typing for this room
    const handleRoomTyping = (0, react_1.useCallback)(() => {
        handleTyping({
            roomId,
            username: user.username,
        });
    }, [handleTyping, roomId, user.username]);
    // Get typing users for this room (excluding current user)
    const roomTypingUsers = typingUsers.filter(typingUser => typingUser.username !== user.username);
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
function useNotifications(userId) {
    const { notifications, sendNotification, clearNotifications, markNotificationAsRead, } = useSocket();
    const [unreadCount, setUnreadCount] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        setUnreadCount(notifications.length);
    }, [notifications]);
    const sendToUser = (0, react_1.useCallback)((targetUserId, data) => {
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
