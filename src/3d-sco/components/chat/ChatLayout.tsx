'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import ChatRoomList from './ChatRoomList';
import ChatInterface from './ChatInterface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ChatLayoutProps {
  className?: string;
  defaultRoomId?: string;
  showRoomList?: boolean;
}

export default function ChatLayout({ 
  className, 
  defaultRoomId,
  showRoomList = true 
}: ChatLayoutProps) {
  const { data: session } = useSession();
  const { isConnected, joinRoom, leaveRoom } = useSocket();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isMobileRoomListOpen, setIsMobileRoomListOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    // Leave current room if any
    if (selectedRoom) {
      leaveRoom(selectedRoom.id);
    }
    
    // Join new room
    setSelectedRoom(room);
    joinRoom(room.id);
    
    // Close mobile room list
    setIsMobileRoomListOpen(false);
  };

  // Auto-select default room on mount
  useEffect(() => {
    if (defaultRoomId && !selectedRoom) {
      // This would typically fetch room data from API
      const defaultRoom: ChatRoom = {
        id: defaultRoomId,
        name: 'ทั่วไป',
        description: 'ห้องสนทนาทั่วไป',
        isPrivate: false,
        memberCount: 0,
        unreadCount: 0
      };
      handleRoomSelect(defaultRoom);
    }
  }, [defaultRoomId, selectedRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedRoom) {
        leaveRoom(selectedRoom.id);
      }
    };
  }, [selectedRoom, leaveRoom]);

  if (!session) {
    return (
      <Card className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            เข้าสู่ระบบ
          </Button>
        </div>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 shadow-lg"
          size="lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden",
      className
    )}>
      {/* Mobile Room List Overlay */}
      {isMobileRoomListOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsMobileRoomListOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">ห้องแชท</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileRoomListOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ChatRoomList
              onRoomSelect={handleRoomSelect}
              selectedRoomId={selectedRoom?.id}
            />
          </div>
        </div>
      )}

      {/* Desktop Room List */}
      {showRoomList && (
        <div className="hidden lg:block w-80 border-r border-gray-200 dark:border-gray-700">
          <ChatRoomList
            onRoomSelect={handleRoomSelect}
            selectedRoomId={selectedRoom?.id}
          />
        </div>
      )}

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {showRoomList && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileRoomListOpen(true)}
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                )}
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">
                    {selectedRoom.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRoom.memberCount} สมาชิก
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Chat Interface */}
            <ChatInterface
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              isPrivate={selectedRoom.isPrivate}
            />
          </>
        ) : (
          /* No Room Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                เลือกห้องแชทเพื่อเริ่มสนทนา
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                เลือกห้องแชทจากรายการด้านซ้าย หรือสร้างห้องใหม่
              </p>
              {!showRoomList && (
                <Button
                  onClick={() => setIsMobileRoomListOpen(true)}
                  variant="outline"
                >
                  <Menu className="w-4 h-4 mr-2" />
                  เลือกห้องแชท
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
          ไม่ได้เชื่อมต่อ
        </div>
      )}
    </div>
  );
}

// Export types for use in other components
export type { ChatRoom };