'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatRoom } from '@/hooks/useSocket';
import { Send, Users, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface ChatRoomProps {
  roomId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  className?: string;
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

export default function ChatRoom({ roomId, user, className = '' }: ChatRoomProps) {
  const {
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    handleTyping,
  } = useChatRoom(roomId, user);

  const [messageInput, setMessageInput] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected) {
      sendMessage(messageInput.trim());
      setMessageInput('');
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: th,
    });
  };

  // Get user avatar or initials
  const getUserAvatar = (username: string, avatar?: string) => {
    if (avatar) {
      return (
        <img
          src={avatar}
          alt={username}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    
    const initials = username.slice(0, 2).toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
        {initials}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              ห้องแชท {roomId}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Users className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isConnected && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2" />
              กำลังเชื่อมต่อ...
            </div>
          </div>
        )}

        {messages.length === 0 && isConnected && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">💬</div>
            <p>ยังไม่มีข้อความในห้องแชทนี้</p>
            <p className="text-sm">เริ่มต้นการสนทนาได้เลย!</p>
          </div>
        )}

        {messages.map((message) => {
          const isOwnMessage = message.author.id === user.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${
                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {!isOwnMessage && (
                  <div className="flex-shrink-0 mr-3">
                    {getUserAvatar(message.author.username)}
                  </div>
                )}
                
                <div className={`flex flex-col ${
                  isOwnMessage ? 'items-end' : 'items-start'
                }`}>
                  {!isOwnMessage && (
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {message.author.username}
                    </div>
                  )}
                  
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  
                  <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                    isOwnMessage ? 'text-right' : 'text-left'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {typingUsers.map(user => user.username).join(', ')} กำลังพิมพ์...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="พิมพ์ข้อความ..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white max-h-32"
              rows={1}
              disabled={!isConnected}
              style={{
                minHeight: '40px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <button
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={!isConnected}
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <button
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={!isConnected}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {!isConnected && (
          <div className="text-center mt-2">
            <span className="text-sm text-red-500 dark:text-red-400">
              ไม่สามารถเชื่อมต่อได้ กำลังพยายามเชื่อมต่อใหม่...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}