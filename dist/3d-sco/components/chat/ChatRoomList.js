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
exports.default = ChatRoomList;
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
// Mock data for demonstration
const MOCK_ROOMS = [
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
function ChatRoomList({ onRoomSelect, selectedRoomId }) {
    const { data: session } = (0, react_2.useSession)();
    const { isConnected, onlineUsers } = (0, useSocket_1.useSocket)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [rooms, setRooms] = (0, react_1.useState)(MOCK_ROOMS);
    const [showCreateRoom, setShowCreateRoom] = (0, react_1.useState)(false);
    // Filter rooms based on search query
    const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const handleRoomClick = (room) => {
        onRoomSelect(room);
        // Mark room as read
        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));
    };
    const getLastMessageTime = (timestamp) => {
        return (0, date_fns_1.formatDistanceToNow)(new Date(timestamp), {
            addSuffix: true,
            locale: locale_1.th
        });
    };
    const getTotalUnreadCount = () => {
        return rooms.reduce((total, room) => total + room.unreadCount, 0);
    };
    return (<div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <lucide_react_1.MessageCircle className="w-6 h-6 text-blue-500"/>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              แชท
            </h2>
            {getTotalUnreadCount() > 0 && (<badge_1.Badge variant="destructive" className="ml-2">
                {getTotalUnreadCount()}
              </badge_1.Badge>)}
          </div>
          
          <div className="flex items-center space-x-2">
            <button_1.Button variant="ghost" size="sm" onClick={() => setShowCreateRoom(true)}>
              <lucide_react_1.Plus className="w-4 h-4"/>
            </button_1.Button>
            <button_1.Button variant="ghost" size="sm">
              <lucide_react_1.Settings className="w-4 h-4"/>
            </button_1.Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input_1.Input placeholder="ค้นหาห้องแชท..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}/>
            <span className="text-gray-600 dark:text-gray-400">
              {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <lucide_react_1.Users className="w-4 h-4 text-gray-400"/>
            <span className="text-gray-600 dark:text-gray-400">
              {onlineUsers.count} ออนไลน์
            </span>
          </div>
        </div>
      </div>

      {/* Room List */}
      <scroll_area_1.ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredRooms.length === 0 ? (<div className="text-center py-8">
              <lucide_react_1.MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'ไม่พบห้องแชทที่ค้นหา' : 'ยังไม่มีห้องแชท'}
              </p>
            </div>) : (filteredRooms.map((room) => (<div key={room.id} onClick={() => handleRoomClick(room)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRoomId === room.id
                ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <div className="flex items-start space-x-3">
                  {/* Room Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${room.isPrivate
                ? 'bg-gray-500 text-white'
                : 'bg-blue-500 text-white'}`}>
                    {room.isPrivate ? (<lucide_react_1.Lock className="w-5 h-5"/>) : (<lucide_react_1.Hash className="w-5 h-5"/>)}
                  </div>
                  
                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {room.unreadCount > 0 && (<badge_1.Badge variant="destructive" className="ml-2 text-xs">
                          {room.unreadCount}
                        </badge_1.Badge>)}
                    </div>
                    
                    {room.description && (<p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        {room.description}
                      </p>)}
                    
                    {room.lastMessage && (<div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                          <span className="font-medium">{room.lastMessage.author}:</span>
                          {' '}{room.lastMessage.content}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {getLastMessageTime(room.lastMessage.timestamp)}
                        </span>
                      </div>)}
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <lucide_react_1.Users className="w-3 h-3"/>
                        <span>{room.memberCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)))}
        </div>
      </scroll_area_1.ScrollArea>

      {/* Create Room Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button_1.Button onClick={() => setShowCreateRoom(true)} className="w-full" variant="outline">
          <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
          สร้างห้องแชทใหม่
        </button_1.Button>
      </div>

      {/* User Info */}
      {session?.user && (<div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <avatar_1.Avatar className="w-8 h-8">
              <avatar_1.AvatarImage src={session.user.image || ''}/>
              <avatar_1.AvatarFallback>
                {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
              </avatar_1.AvatarFallback>
            </avatar_1.Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ออนไลน์
              </p>
            </div>
            <button_1.Button variant="ghost" size="sm">
              <lucide_react_1.MoreVertical className="w-4 h-4"/>
            </button_1.Button>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=ChatRoomList.js.map