'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Search, 
  Hash, 
  Lock,
  Settings,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  isActive?: boolean;
}

interface ChatRoomListProps {
  onRoomSelect: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

// Mock data for demonstration
const MOCK_ROOMS: ChatRoom[] = [
  {
    id: 'general',
    name: 'ทั่วไป',
    description: 'ห้องสนทนาทั่วไป',
    isPrivate: false,
    memberCount: 156,
    lastMessage: {
      content: 'สวัสดีครับทุกคน!',
      author: 'ผู้ใช้ A',
      timestamp: new Date(Date.now() - 300000)
    },
    unreadCount: 3
  },
  {
    id: 'development',
    name: 'การพัฒนา',
    description: 'พูดคุยเกี่ยวกับการพัฒนาโปรแกรม',
    isPrivate: false,
    memberCount: 89,
    lastMessage: {
      content: 'มีใครใช้ Next.js 14 บ้างครับ?',
      author: 'นักพัฒนา B',
      timestamp: new Date(Date.now() - 600000)
    },
    unreadCount: 1
  },
  {
    id: 'design',
    name: 'ดีไซน์',
    description: 'แชร์ไอเดียและผลงานดีไซน์',
    isPrivate: false,
    memberCount: 67,
    lastMessage: {
      content: 'ชอบสีนี้มากเลย 🎨',
      author: 'ดีไซเนอร์ C',
      timestamp: new Date(Date.now() - 1200000)
    },
    unreadCount: 0
  },
  {
    id: 'private-team',
    name: 'ทีมงาน',
    description: 'ห้องส่วนตัวสำหรับทีมงาน',
    isPrivate: true,
    memberCount: 12,
    lastMessage: {
      content: 'ประชุมพรุ่งนี้ 10:00 น.',
      author: 'หัวหน้าทีม',
      timestamp: new Date(Date.now() - 1800000)
    },
    unreadCount: 5
  }
];

export default function ChatRoomList({ onRoomSelect, selectedRoomId }: ChatRoomListProps) {
  const { data: session } = useSession();
  const { isConnected, onlineUsers } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<ChatRoom[]>(MOCK_ROOMS);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // Filter rooms based on search query
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomClick = (room: ChatRoom) => {
    onRoomSelect(room);
    // Mark room as read
    setRooms(prev => prev.map(r => 
      r.id === room.id ? { ...r, unreadCount: 0 } : r
    ));
  };

  const getLastMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: th 
    });
  };

  const getTotalUnreadCount = () => {
    return rooms.reduce((total, room) => total + room.unreadCount, 0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              แชท
            </h2>
            {getTotalUnreadCount() > 0 && (
              <Badge variant="destructive" className="ml-2">
                {getTotalUnreadCount()}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateRoom(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ค้นหาห้องแชท..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-gray-600 dark:text-gray-400">
              {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {onlineUsers.count} ออนไลน์
            </span>
          </div>
        </div>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'ไม่พบห้องแชทที่ค้นหา' : 'ยังไม่มีห้องแชท'}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoomId === room.id
                    ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Room Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    room.isPrivate
                      ? 'bg-gray-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {room.isPrivate ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Hash className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {room.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {room.unreadCount}
                        </Badge>
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
                          {' '}{room.lastMessage.content}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {getLastMessageTime(room.lastMessage.timestamp)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{room.memberCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create Room Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={() => setShowCreateRoom(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          สร้างห้องแชทใหม่
        </Button>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session.user.image || ''} />
              <AvatarFallback>
                {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ออนไลน์
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}