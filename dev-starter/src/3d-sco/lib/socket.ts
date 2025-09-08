import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { prisma } from './db';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

// Online users tracking
const onlineUsers = new Map<string, {
  id: string;
  username: string;
  avatar?: string;
  joinedAt: Date;
}>();

// Chat rooms
const chatRooms = new Map<string, Set<string>>();

export const config = {
  api: {
    bodyParser: false,
  },
};

export function initializeSocket(server: NetServer) {
  if (!server.io) {
    console.log('Initializing Socket.IO server...');
    
    const io = new ServerIO(server, {
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
      socket.on('user:join', async (userData: {
        id: string;
        username: string;
        avatar?: string;
      }) => {
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
          await prisma.userAnalytics.create({
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
        } catch (error) {
          console.error('Error handling user join:', error);
        }
      });

      // Handle joining chat rooms
      socket.on('room:join', (roomId: string) => {
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
      socket.on('room:leave', (roomId: string) => {
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
      socket.on('message:send', async (data: {
        roomId: string;
        message: string;
        userId: string;
        username: string;
        avatar?: string;
      }) => {
        try {
          // Save message to database
          const savedMessage = await prisma.comment.create({
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
        } catch (error) {
          console.error('Error handling message send:', error);
          socket.emit('message:error', {
            error: 'Failed to send message',
            timestamp: new Date(),
          });
        }
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { roomId: string; username: string }) => {
        socket.to(data.roomId).emit('typing:user-started', {
          socketId: socket.id,
          username: data.username,
          timestamp: new Date(),
        });
      });

      socket.on('typing:stop', (data: { roomId: string; username: string }) => {
        socket.to(data.roomId).emit('typing:user-stopped', {
          socketId: socket.id,
          username: data.username,
          timestamp: new Date(),
        });
      });

      // Handle real-time notifications
      socket.on('notification:send', (data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        metadata?: any;
      }) => {
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
            await prisma.userAnalytics.create({
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
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });

    server.io = io;
    console.log('Socket.IO server initialized successfully');
  } else {
    console.log('Socket.IO server already running');
  }
  
  return server.io;
}

// Helper functions
export function getOnlineUsersCount(): number {
  return onlineUsers.size;
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.values());
}

export function getRoomUsers(roomId: string): string[] {
  return Array.from(chatRooms.get(roomId) || []);
}

export function broadcastToRoom(io: ServerIO, roomId: string, event: string, data: any) {
  io.to(roomId).emit(event, data);
}

export function broadcastToUser(io: ServerIO, userId: string, event: string, data: any) {
  const targetUser = Array.from(onlineUsers.entries())
    .find(([_, user]) => user.id === userId);
  
  if (targetUser) {
    io.to(targetUser[0]).emit(event, data);
  }
}