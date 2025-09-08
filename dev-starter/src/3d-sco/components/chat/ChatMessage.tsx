'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Reply, 
  Heart, 
  Copy, 
  Edit, 
  Trash2,
  Pin,
  Flag,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: 'admin' | 'moderator' | 'member';
  };
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'file' | 'video';
    size?: number;
  }[];
  isPinned?: boolean;
  isSystem?: boolean;
}

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId?: string;
  isOwn?: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
  className?: string;
}

export default function ChatMessage({
  message,
  currentUserId,
  isOwn = false,
  showAvatar = true,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  className
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: th 
    });
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  if (message.isSystem) {
    return (
      <div className={cn("flex justify-center my-4", className)}>
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
        isGrouped && "mt-1",
        !isGrouped && "mt-4",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && !isGrouped ? (
          <Avatar className="w-10 h-10">
            <AvatarImage src={message.author.avatar} />
            <AvatarFallback className="text-sm">
              {message.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center">
            {isHovered && (
              <span className="text-xs text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">
              {message.author.name}
            </span>
            
            {message.author.role && message.author.role !== 'member' && (
              <Badge variant="secondary" className={cn("text-xs", getRoleColor(message.author.role))}>
                {message.author.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ช่วยดูแล'}
              </Badge>
            )}
            
            {message.isPinned && (
              <Pin className="w-4 h-4 text-yellow-500" />
            )}
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.timestamp)}
            </span>
            
            {message.edited && (
              <span className="text-xs text-gray-400 italic">
                (แก้ไขแล้ว)
              </span>
            )}
          </div>
        )}

        {/* Reply Reference */}
        {message.replyTo && (
          <div className="mb-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{message.replyTo.author}</span>
              <p className="truncate">{message.replyTo.content}</p>
            </div>
          </div>
        )}

        {/* Message Text */}
        <div className="text-gray-900 dark:text-gray-100 break-words">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {attachment.name}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-gray-500">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => handleReaction(reaction.emoji)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm transition-colors"
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Actions */}
      {(isHovered || showReactions) && (
        <div className="absolute top-2 right-4 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1">
          {/* Quick Reactions */}
          <div className="flex items-center gap-1">
            {commonReactions.slice(0, 3).map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-1">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onReply(message)}
              >
                <Reply className="w-4 h-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyMessage}>
                  <Copy className="w-4 h-4 mr-2" />
                  คัดลอกข้อความ
                </DropdownMenuItem>
                
                {onPin && (
                  <DropdownMenuItem onClick={() => onPin(message.id)}>
                    <Pin className="w-4 h-4 mr-2" />
                    {message.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดข้อความ'}
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  รายงานข้อความ
                </DropdownMenuItem>
                
                {isOwn && (
                  <>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(message.id, message.content)}>
                        <Edit className="w-4 h-4 mr-2" />
                        แก้ไขข้อความ
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(message.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        ลบข้อความ
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}