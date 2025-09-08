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
exports.default = ChatList;
const react_1 = __importStar(require("react"));
const useSocket_1 = require("@/hooks/useSocket");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
function ChatList({ onRoomSelect, selectedRoomId, user, className = '' }) {
    const { isConnected, onlineUsers } = (0, useSocket_1.useSocket)(user);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [showCreateRoom, setShowCreateRoom] = (0, react_1.useState)(false);
    const [newRoomName, setNewRoomName] = (0, react_1.useState)('');
    const [newRoomDescription, setNewRoomDescription] = (0, react_1.useState)('');
    const [isPrivateRoom, setIsPrivateRoom] = (0, react_1.useState)(false);
    // Mock chat rooms data - in real app, this would come from API
    const [chatRooms, setChatRooms] = (0, react_1.useState)([
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
    const filteredRooms = chatRooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    // Handle room creation
    const handleCreateRoom = () => {
        if (newRoomName.trim()) {
            const newRoom = {
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
    const formatLastMessageTime = (timestamp) => {
        return (0, date_fns_1.formatDistanceToNow)(new Date(timestamp), {
            addSuffix: true,
            locale: locale_1.th,
        });
    };
    // Truncate message content
    const truncateMessage = (content, maxLength = 40) => {
        return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
    };
    return (react_1.default.createElement("div", { className: `flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}` },
        react_1.default.createElement("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700" },
            react_1.default.createElement("div", { className: "flex items-center justify-between mb-4" },
                react_1.default.createElement("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center" },
                    react_1.default.createElement(lucide_react_1.MessageCircle, { className: "w-5 h-5 mr-2" }),
                    "\u0E41\u0E0A\u0E17"),
                react_1.default.createElement("button", { onClick: () => setShowCreateRoom(true), className: "p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", title: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17\u0E43\u0E2B\u0E21\u0E48" },
                    react_1.default.createElement(lucide_react_1.Plus, { className: "w-5 h-5" }))),
            react_1.default.createElement("div", { className: "flex items-center space-x-2 mb-4" },
                react_1.default.createElement("div", { className: `w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}` }),
                react_1.default.createElement("span", { className: "text-sm text-gray-600 dark:text-gray-400" }, isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'),
                react_1.default.createElement("span", { className: "text-sm text-gray-500 dark:text-gray-500" }, "\u2022"),
                react_1.default.createElement("span", { className: "text-sm text-gray-600 dark:text-gray-400" },
                    onlineUsers.length,
                    " \u0E04\u0E19\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C")),
            react_1.default.createElement("div", { className: "relative" },
                react_1.default.createElement(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }),
                react_1.default.createElement("input", { type: "text", placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm" }))),
        react_1.default.createElement("div", { className: "flex-1 overflow-y-auto" }, filteredRooms.length === 0 ? (react_1.default.createElement("div", { className: "p-4 text-center text-gray-500 dark:text-gray-400" }, searchQuery ? 'ไม่พบห้องแชทที่ค้นหา' : 'ยังไม่มีห้องแชท')) : (react_1.default.createElement("div", { className: "space-y-1 p-2" }, filteredRooms.map((room) => (react_1.default.createElement("button", { key: room.id, onClick: () => onRoomSelect(room.id), className: `w-full p-3 rounded-lg text-left transition-colors ${selectedRoomId === room.id
                ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}` },
            react_1.default.createElement("div", { className: "flex items-start justify-between" },
                react_1.default.createElement("div", { className: "flex-1 min-w-0" },
                    react_1.default.createElement("div", { className: "flex items-center space-x-2 mb-1" },
                        room.isPrivate ? (react_1.default.createElement(lucide_react_1.Lock, { className: "w-4 h-4 text-gray-500" })) : (react_1.default.createElement(lucide_react_1.Hash, { className: "w-4 h-4 text-gray-500" })),
                        react_1.default.createElement("h3", { className: "font-medium text-gray-900 dark:text-white truncate" }, room.name),
                        room.unreadCount > 0 && (react_1.default.createElement("span", { className: "bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center" }, room.unreadCount > 99 ? '99+' : room.unreadCount))),
                    room.description && (react_1.default.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1 truncate" }, room.description)),
                    room.lastMessage && (react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300 truncate flex-1" },
                            react_1.default.createElement("span", { className: "font-medium" },
                                room.lastMessage.author,
                                ":"),
                            ' ',
                            truncateMessage(room.lastMessage.content))))),
                react_1.default.createElement("div", { className: "flex flex-col items-end space-y-1 ml-2" },
                    react_1.default.createElement("div", { className: "flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400" },
                        react_1.default.createElement(lucide_react_1.Users, { className: "w-3 h-3" }),
                        react_1.default.createElement("span", null, room.memberCount)),
                    room.lastMessage && (react_1.default.createElement("span", { className: "text-xs text-gray-400 dark:text-gray-500" }, formatLastMessageTime(room.lastMessage.timestamp))))))))))),
        showCreateRoom && (react_1.default.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" },
            react_1.default.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4" },
                react_1.default.createElement("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4" }, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17\u0E43\u0E2B\u0E21\u0E48"),
                react_1.default.createElement("div", { className: "space-y-4" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E49\u0E2D\u0E07 *"),
                        react_1.default.createElement("input", { type: "text", value: newRoomName, onChange: (e) => setNewRoomName(e.target.value), placeholder: "\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white", maxLength: 50 })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22"),
                        react_1.default.createElement("textarea", { value: newRoomDescription, onChange: (e) => setNewRoomDescription(e.target.value), placeholder: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none", rows: 3, maxLength: 200 })),
                    react_1.default.createElement("div", { className: "flex items-center" },
                        react_1.default.createElement("input", { type: "checkbox", id: "private-room", checked: isPrivateRoom, onChange: (e) => setIsPrivateRoom(e.target.checked), className: "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" }),
                        react_1.default.createElement("label", { htmlFor: "private-room", className: "ml-2 text-sm text-gray-700 dark:text-gray-300" }, "\u0E2B\u0E49\u0E2D\u0E07\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E0A\u0E34\u0E0D)"))),
                react_1.default.createElement("div", { className: "flex justify-end space-x-3 mt-6" },
                    react_1.default.createElement("button", { onClick: () => {
                            setShowCreateRoom(false);
                            setNewRoomName('');
                            setNewRoomDescription('');
                            setIsPrivateRoom(false);
                        }, className: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"),
                    react_1.default.createElement("button", { onClick: handleCreateRoom, disabled: !newRoomName.trim(), className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" }, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07")))))));
}
