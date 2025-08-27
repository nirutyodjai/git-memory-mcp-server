'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { Send, Smile, Paperclip, MoreVertical, Users, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  timestamp: Date;
  roomId: string;
  type?: 'text' | 'image' | 'file' | 'system';
}

interface ChatInterfaceProps {
  roomId: string;
  roomName: string;
  isPrivate?: boolean;
  memberCount?: number;
}

export default function ChatInterface({ 
  roomId, 
  roomName, 
  isPrivate = false, 
  memberCount = 0 
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const { 
    socket, 
    isConnected, 
    messages, 
    onlineUsers, 
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping
  } = useSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter messages for current room
  const roomMessages = messages.filter(msg => msg.roomId === roomId);
  
  // Filter typing users for current room (excluding current user)
  const roomTypingUsers = typingUsers.filter(user => 
    user.socketId !== socket?.id
  );

  useEffect(() => {
    if (socket && session?.user && roomId) {
      joinRoom(roomId);
      
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [socket, session, roomId, joinRoom, leaveRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !session?.user) return;
    
    sendMessage({
      roomId,
      message: messageInput.trim(),
      userId: session.user.id || '',
      username: session.user.name || session.user.email || 'Anonymous',
      avatar: session.user.image
    });
    
    setMessageInput('');
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && session?.user) {
      setIsTyping(true);
      startTyping({
        roomId,
        username: session.user.name || session.user.email || 'Anonymous'
      });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping && session?.user) {
      setIsTyping(false);
      stopTyping({
        roomId,
        username: session.user.name || session.user.email || 'Anonymous'
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: th 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.author.id === session?.user?.id;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isPrivate ? (
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">#</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {roomName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {memberCount} สมาชิก • {onlineUsers.count} ออนไลน์
              </p>
            </div>
          </div>
          {!isConnected && (
            <Badge variant="destructive" className="ml-2">
              ไม่ได้เชื่อมต่อ
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {roomMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ยินดีต้อนรับสู่ {roomName}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                เริ่มต้นการสนทนาด้วยการส่งข้อความแรก
              </p>
            </div>
          ) : (
            roomMessages.map((message, index) => {
              const isOwn = isOwnMessage(message);
              const showAvatar = index === 0 || 
                roomMessages[index - 1]?.author.id !== message.author.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-end space-x-2 ${
                    isOwn ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {showAvatar && !isOwn && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.author.avatar} />
                      <AvatarFallback>
                        {message.author.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${
                    isOwn ? 'items-end' : 'items-start'
                  } ${!showAvatar && !isOwn ? 'ml-10' : ''}`}>
                    {showAvatar && (
                      <div className={`flex items-center space-x-2 mb-1 ${
                        isOwn ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.author.username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getMessageTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing Indicator */}
          {roomTypingUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {roomTypingUsers.length === 1
                  ? `${roomTypingUsers[0].username} กำลังพิมพ์...`
                  : `${roomTypingUsers.length} คน กำลังพิมพ์...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="พิมพ์ข้อความ..."
              className="pr-12"
              disabled={!isConnected || !session}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected || !session}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!session && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            กรุณาเข้าสู่ระบบเพื่อส่งข้อความ
          </p>
        )}
      </div>
    </div>
  );
}