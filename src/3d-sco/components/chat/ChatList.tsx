'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle, Users, Plus, Search, Hash, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  lastMessage?: {
    content: string;
    author: string;
    timestamp: Date;
  };
  unreadCount: number;
}

interface ChatListProps {
  onRoomSelect: (roomId: string) => void;
  selectedRoomId?: string;
  user: {
    id: string;
    username: string;
  };
  className?: string;
}

export default function ChatList({ onRoomSelect, selectedRoomId, user, className = '' }: ChatListProps) {
  const { isConnected, onlineUsers } = useSocket(user);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  
  // Mock chat rooms data - in real app, this would come from API
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: 'general',
      name: 'ทั่วไป',
      description: 'ห้องแชทสำหรับการสนทนาทั่วไป',
      isPrivate: false,
      memberCount: 24,
      lastMessage: {
        content: 'สวัสดีครับทุกคน!',
        author: 'john_doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      },
      unreadCount: 2,
    },
    {
      id: 'engineering',
      name: 'วิศวกรรม',
      description: 'ห้องสำหรับหารือเรื่องงานวิศวกรรม',
      isPrivate: false,
      memberCount: 12,
      lastMessage: {
        content: 'มีใครเคยใช้ Prisma กับ PostgreSQL บ้างครับ?',
        author: 'engineer_mike',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      unreadCount: 0,
    },
    {
      id: 'project-alpha',
      name: 'โปรเจกต์ Alpha',
      description: 'ห้องสำหรับทีมโปรเจกต์ Alpha',
      isPrivate: true,
      memberCount: 5,
      lastMessage: {
        content: 'การประชุมวันพรุ่งนี้เลื่อนเป็น 14:00 นะครับ',
        author: 'project_manager',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      unreadCount: 1,
    },
  ]);

  // Filter rooms based on search query
  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle room creation
  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      const newRoom: ChatRoom = {
        id: `room-${Date.now()}`,
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || undefined,
        isPrivate: isPrivateRoom,
        memberCount: 1,
        unreadCount: 0,
      };
      
      setChatRooms(prev => [newRoom, ...prev]);
      setNewRoomName('');
      setNewRoomDescription('');
      setIsPrivateRoom(false);
      setShowCreateRoom(false);
      onRoomSelect(newRoom.id);
    }
  };

  // Format last message time
  const formatLastMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: th,
    });
  };

  // Truncate message content
  const truncateMessage = (content: string, maxLength: number = 40) => {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            แชท
          </h2>
          
          <button
            onClick={() => setShowCreateRoom(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="สร้างห้องแชทใหม่"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-500">•</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {onlineUsers.length} คนออนไลน์
          </span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาห้องแชท..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'ไม่พบห้องแชทที่ค้นหา' : 'ยังไม่มีห้องแชท'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedRoomId === room.id
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {room.isPrivate ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Hash className="w-4 h-4 text-gray-500" />
                      )}
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {room.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    {room.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        {room.description}
                      </p>
                    )}
                    
                    {room.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                          <span className="font-medium">{room.lastMessage.author}:</span>
                          {' '}
                          {truncateMessage(room.lastMessage.content)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{room.memberCount}</span>
                    </div>
                    
                    {room.lastMessage && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatLastMessageTime(room.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              สร้างห้องแชทใหม่
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อห้อง *
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="ใส่ชื่อห้องแชท"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="คำอธิบายห้องแชท (ไม่บังคับ)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="private-room"
                  checked={isPrivateRoom}
                  onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="private-room" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  ห้องส่วนตัว (เฉพาะคนที่ได้รับเชิญ)
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoomName('');
                  setNewRoomDescription('');
                  setIsPrivateRoom(false);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                สร้างห้อง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}