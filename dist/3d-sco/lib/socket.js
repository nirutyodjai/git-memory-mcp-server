"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.initializeSocket = initializeSocket;
exports.getOnlineUsersCount = getOnlineUsersCount;
exports.getOnlineUsers = getOnlineUsers;
exports.getRoomUsers = getRoomUsers;
exports.broadcastToRoom = broadcastToRoom;
exports.broadcastToUser = broadcastToUser;
const socket_io_1 = require("socket.io");
const db_1 = require("./db");
// Online users tracking
const onlineUsers = new Map();
// Chat rooms
const chatRooms = new Map();
exports.config = {
    api: {
        bodyParser: false,
    },
};
function initializeSocket(server) {
    if (!server.io) {
        console.log('Initializing Socket.IO server...');
        const io = new socket_io_1.Server(server, {
            path: '/api/socket/io',
            addTrailingSlash: false,
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? process.env.NEXTAUTH_URL
                    : 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);
            // Handle user joining
            socket.on('user:join', async (userData) => {
                try {
                    // Add user to online users
                    onlineUsers.set(socket.id, {
                        ...userData,
                        joinedAt: new Date(),
                    });
                    // Broadcast updated online users count
                    io.emit('users:online', {
                        count: onlineUsers.size,
                        users: Array.from(onlineUsers.values()),
                    });
                    // Track user analytics
                    await db_1.prisma.userAnalytics.create({
                        data: {
                            userId: userData.id,
                            event: 'user_online',
                            metadata: {
                                socketId: socket.id,
                                timestamp: new Date().toISOString(),
                            },
                        },
                    });
                    console.log(`User ${userData.username} joined. Online users: ${onlineUsers.size}`);
                }
                catch (error) {
                    console.error('Error handling user join:', error);
                }
            });
            // Handle joining chat rooms
            socket.on('room:join', (roomId) => {
                socket.join(roomId);
                if (!chatRooms.has(roomId)) {
                    chatRooms.set(roomId, new Set());
                }
                chatRooms.get(roomId)?.add(socket.id);
                socket.to(roomId).emit('user:joined-room', {
                    socketId: socket.id,
                    roomId,
                    timestamp: new Date(),
                });
                console.log(`Socket ${socket.id} joined room ${roomId}`);
            });
            // Handle leaving chat rooms
            socket.on('room:leave', (roomId) => {
                socket.leave(roomId);
                chatRooms.get(roomId)?.delete(socket.id);
                socket.to(roomId).emit('user:left-room', {
                    socketId: socket.id,
                    roomId,
                    timestamp: new Date(),
                });
                console.log(`Socket ${socket.id} left room ${roomId}`);
            });
            // Handle chat messages
            socket.on('message:send', async (data) => {
                try {
                    // Save message to database
                    const savedMessage = await db_1.prisma.comment.create({
                        data: {
                            content: data.message,
                            authorId: data.userId,
                            postId: data.roomId, // Using postId as roomId for simplicity
                            metadata: {
                                type: 'chat_message',
                                socketId: socket.id,
                                timestamp: new Date().toISOString(),
                            },
                        },
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    });
                    // Broadcast message to room
                    const messageData = {
                        id: savedMessage.id,
                        content: savedMessage.content,
                        author: savedMessage.author,
                        timestamp: savedMessage.createdAt,
                        roomId: data.roomId,
                    };
                    io.to(data.roomId).emit('message:received', messageData);
                    console.log(`Message sent in room ${data.roomId} by ${data.username}`);
                }
                catch (error) {
                    console.error('Error handling message send:', error);
                    socket.emit('message:error', {
                        error: 'Failed to send message',
                        timestamp: new Date(),
                    });
                }
            });
            // Handle typing indicators
            socket.on('typing:start', (data) => {
                socket.to(data.roomId).emit('typing:user-started', {
                    socketId: socket.id,
                    username: data.username,
                    timestamp: new Date(),
                });
            });
            socket.on('typing:stop', (data) => {
                socket.to(data.roomId).emit('typing:user-stopped', {
                    socketId: socket.id,
                    username: data.username,
                    timestamp: new Date(),
                });
            });
            // Handle real-time notifications
            socket.on('notification:send', (data) => {
                // Send notification to specific user
                const targetUser = Array.from(onlineUsers.entries())
                    .find(([_, user]) => user.id === data.userId);
                if (targetUser) {
                    io.to(targetUser[0]).emit('notification:received', {
                        ...data,
                        timestamp: new Date(),
                    });
                }
            });
            // Handle disconnection
            socket.on('disconnect', async () => {
                try {
                    const user = onlineUsers.get(socket.id);
                    if (user) {
                        // Remove from online users
                        onlineUsers.delete(socket.id);
                        // Remove from all chat rooms
                        chatRooms.forEach((users, roomId) => {
                            if (users.has(socket.id)) {
                                users.delete(socket.id);
                                socket.to(roomId).emit('user:left-room', {
                                    socketId: socket.id,
                                    roomId,
                                    timestamp: new Date(),
                                });
                            }
                        });
                        // Broadcast updated online users count
                        io.emit('users:online', {
                            count: onlineUsers.size,
                            users: Array.from(onlineUsers.values()),
                        });
                        // Track user analytics
                        await db_1.prisma.userAnalytics.create({
                            data: {
                                userId: user.id,
                                event: 'user_offline',
                                metadata: {
                                    socketId: socket.id,
                                    sessionDuration: Date.now() - user.joinedAt.getTime(),
                                    timestamp: new Date().toISOString(),
                                },
                            },
                        });
                        console.log(`User ${user.username} disconnected. Online users: ${onlineUsers.size}`);
                    }
                }
                catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            });
        });
        server.io = io;
        console.log('Socket.IO server initialized successfully');
    }
    else {
        console.log('Socket.IO server already running');
    }
    return server.io;
}
// Helper functions
function getOnlineUsersCount() {
    return onlineUsers.size;
}
function getOnlineUsers() {
    return Array.from(onlineUsers.values());
}
function getRoomUsers(roomId) {
    return Array.from(chatRooms.get(roomId) || []);
}
function broadcastToRoom(io, roomId, event, data) {
    io.to(roomId).emit(event, data);
}
function broadcastToUser(io, userId, event, data) {
    const targetUser = Array.from(onlineUsers.entries())
        .find(([_, user]) => user.id === userId);
    if (targetUser) {
        io.to(targetUser[0]).emit(event, data);
    }
}
