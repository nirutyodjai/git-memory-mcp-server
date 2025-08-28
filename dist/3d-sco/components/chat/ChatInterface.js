"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatInterface;
const react_1 = __importStar(require("react"));
const useSocket_1 = require("@/hooks/useSocket");
const react_2 = require("next-auth/react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const scroll_area_1 = require("@/components/ui/scroll-area");
const avatar_1 = require("@/components/ui/avatar");
const badge_1 = require("@/components/ui/badge");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
function ChatInterface({ roomId, roomName, isPrivate = false, memberCount = 0 }) {
    const { data: session } = (0, react_2.useSession)();
    const { socket, isConnected, messages, onlineUsers, typingUsers, joinRoom, leaveRoom, sendMessage, startTyping, stopTyping } = (0, useSocket_1.useSocket)();
    const [messageInput, setMessageInput] = (0, react_1.useState)('');
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    const messagesEndRef = (0, react_1.useRef)(null);
    const typingTimeoutRef = (0, react_1.useRef)(null);
    // Filter messages for current room
    const roomMessages = messages.filter(msg => msg.roomId === roomId);
    // Filter typing users for current room (excluding current user)
    const roomTypingUsers = typingUsers.filter(user => user.socketId !== socket?.id);
    (0, react_1.useEffect)(() => {
        if (socket && session?.user && roomId) {
            joinRoom(roomId);
            return () => {
                leaveRoom(roomId);
            };
        }
    }, [socket, session, roomId, joinRoom, leaveRoom]);
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [roomMessages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleSendMessage = () => {
        if (!messageInput.trim() || !session?.user)
            return;
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
    const handleInputChange = (e) => {
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
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const getMessageTime = (timestamp) => {
        return (0, date_fns_1.formatDistanceToNow)(new Date(timestamp), {
            addSuffix: true,
            locale: locale_1.th
        });
    };
    const isOwnMessage = (message) => {
        return message.author.id === session?.user?.id;
    };
    return (<div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isPrivate ? (<div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <lucide_react_1.Users className="w-4 h-4 text-white"/>
              </div>) : (<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">#</span>
              </div>)}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {roomName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {memberCount} สมาชิก • {onlineUsers.count} ออนไลน์
              </p>
            </div>
          </div>
          {!isConnected && (<badge_1.Badge variant="destructive" className="ml-2">
              ไม่ได้เชื่อมต่อ
            </badge_1.Badge>)}
        </div>
        
        <div className="flex items-center space-x-2">
          <button_1.Button variant="ghost" size="sm">
            <lucide_react_1.Phone className="w-4 h-4"/>
          </button_1.Button>
          <button_1.Button variant="ghost" size="sm">
            <lucide_react_1.Video className="w-4 h-4"/>
          </button_1.Button>
          <button_1.Button variant="ghost" size="sm">
            <lucide_react_1.MoreVertical className="w-4 h-4"/>
          </button_1.Button>
        </div>
      </div>

      {/* Messages Area */}
      <scroll_area_1.ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {roomMessages.length === 0 ? (<div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide_react_1.Users className="w-8 h-8 text-gray-400"/>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ยินดีต้อนรับสู่ {roomName}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                เริ่มต้นการสนทนาด้วยการส่งข้อความแรก
              </p>
            </div>) : (roomMessages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showAvatar = index === 0 ||
                roomMessages[index - 1]?.author.id !== message.author.id;
            return (<div key={message.id} className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {showAvatar && !isOwn && (<avatar_1.Avatar className="w-8 h-8">
                      <avatar_1.AvatarImage src={message.author.avatar}/>
                      <avatar_1.AvatarFallback>
                        {message.author.username.charAt(0).toUpperCase()}
                      </avatar_1.AvatarFallback>
                    </avatar_1.Avatar>)}
                  
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${!showAvatar && !isOwn ? 'ml-10' : ''}`}>
                    {showAvatar && (<div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.author.username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getMessageTime(message.timestamp)}
                        </span>
                      </div>)}
                    
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>);
        }))}
          
          {/* Typing Indicator */}
          {roomTypingUsers.length > 0 && (<div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {roomTypingUsers.length === 1
                ? `${roomTypingUsers[0].username} กำลังพิมพ์...`
                : `${roomTypingUsers.length} คน กำลังพิมพ์...`}
              </span>
            </div>)}
          
          <div ref={messagesEndRef}/>
        </div>
      </scroll_area_1.ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button_1.Button variant="ghost" size="sm">
            <lucide_react_1.Paperclip className="w-4 h-4"/>
          </button_1.Button>
          
          <div className="flex-1 relative">
            <input_1.Input value={messageInput} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="พิมพ์ข้อความ..." className="pr-12" disabled={!isConnected || !session}/>
            <button_1.Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <lucide_react_1.Smile className="w-4 h-4"/>
            </button_1.Button>
          </div>
          
          <button_1.Button onClick={handleSendMessage} disabled={!messageInput.trim() || !isConnected || !session} size="sm">
            <lucide_react_1.Send className="w-4 h-4"/>
          </button_1.Button>
        </div>
        
        {!session && (<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            กรุณาเข้าสู่ระบบเพื่อส่งข้อความ
          </p>)}
      </div>
    </div>);
}
//# sourceMappingURL=ChatInterface.js.map