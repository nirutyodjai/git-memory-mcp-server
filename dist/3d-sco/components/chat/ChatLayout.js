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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatLayout;
const react_1 = __importStar(require("react"));
const useSocket_1 = require("@/hooks/useSocket");
const react_2 = require("next-auth/react");
const ChatRoomList_1 = __importDefault(require("./ChatRoomList"));
const ChatInterface_1 = __importDefault(require("./ChatInterface"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function ChatLayout({ className, defaultRoomId, showRoomList = true }) {
    const { data: session } = (0, react_2.useSession)();
    const { isConnected, joinRoom, leaveRoom } = (0, useSocket_1.useSocket)();
    const [selectedRoom, setSelectedRoom] = (0, react_1.useState)(null);
    const [isMobileRoomListOpen, setIsMobileRoomListOpen] = (0, react_1.useState)(false);
    const [isMinimized, setIsMinimized] = (0, react_1.useState)(false);
    // Handle room selection
    const handleRoomSelect = (room) => {
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
    (0, react_1.useEffect)(() => {
        if (defaultRoomId && !selectedRoom) {
            // This would typically fetch room data from API
            const defaultRoom = {
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
    (0, react_1.useEffect)(() => {
        return () => {
            if (selectedRoom) {
                leaveRoom(selectedRoom.id);
            }
        };
    }, [selectedRoom, leaveRoom]);
    if (!session) {
        return (react_1.default.createElement(card_1.Card, { className: (0, utils_1.cn)("flex items-center justify-center h-96", className) },
            react_1.default.createElement("div", { className: "text-center" },
                react_1.default.createElement(lucide_react_1.MessageCircle, { className: "w-12 h-12 text-gray-300 mx-auto mb-4" }),
                react_1.default.createElement("p", { className: "text-gray-500 mb-4" }, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E0A\u0E17"),
                react_1.default.createElement(button_1.Button, { onClick: () => window.location.href = '/auth/signin' }, "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A"))));
    }
    if (isMinimized) {
        return (react_1.default.createElement("div", { className: "fixed bottom-4 right-4 z-50" },
            react_1.default.createElement(button_1.Button, { onClick: () => setIsMinimized(false), className: "rounded-full w-14 h-14 shadow-lg", size: "lg" },
                react_1.default.createElement(lucide_react_1.MessageCircle, { className: "w-6 h-6" }))));
    }
    return (react_1.default.createElement("div", { className: (0, utils_1.cn)("flex h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden", className) },
        isMobileRoomListOpen && (react_1.default.createElement("div", { className: "fixed inset-0 z-50 lg:hidden" },
            react_1.default.createElement("div", { className: "absolute inset-0 bg-black/50", onClick: () => setIsMobileRoomListOpen(false) }),
            react_1.default.createElement("div", { className: "absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900" },
                react_1.default.createElement("div", { className: "flex items-center justify-between p-4 border-b" },
                    react_1.default.createElement("h2", { className: "text-lg font-semibold" }, "\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17"),
                    react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setIsMobileRoomListOpen(false) },
                        react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" }))),
                react_1.default.createElement(ChatRoomList_1.default, { onRoomSelect: handleRoomSelect, selectedRoomId: selectedRoom?.id })))),
        showRoomList && (react_1.default.createElement("div", { className: "hidden lg:block w-80 border-r border-gray-200 dark:border-gray-700" },
            react_1.default.createElement(ChatRoomList_1.default, { onRoomSelect: handleRoomSelect, selectedRoomId: selectedRoom?.id }))),
        react_1.default.createElement("div", { className: "flex-1 flex flex-col" }, selectedRoom ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700" },
                react_1.default.createElement("div", { className: "flex items-center space-x-3" },
                    showRoomList && (react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setIsMobileRoomListOpen(true) },
                        react_1.default.createElement(lucide_react_1.Menu, { className: "w-4 h-4" }))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h1", { className: "font-semibold text-gray-900 dark:text-white" }, selectedRoom.name),
                        react_1.default.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" },
                            selectedRoom.memberCount,
                            " \u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"))),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setIsMinimized(true) },
                    react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" }))),
            react_1.default.createElement(ChatInterface_1.default, { roomId: selectedRoom.id, roomName: selectedRoom.name, isPrivate: selectedRoom.isPrivate }))) : (
        /* No Room Selected */
        react_1.default.createElement("div", { className: "flex-1 flex items-center justify-center" },
            react_1.default.createElement("div", { className: "text-center" },
                react_1.default.createElement(lucide_react_1.MessageCircle, { className: "w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" }),
                react_1.default.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2" }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2A\u0E19\u0E17\u0E19\u0E32"),
                react_1.default.createElement("p", { className: "text-gray-500 dark:text-gray-400 mb-4" }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E14\u0E49\u0E32\u0E19\u0E0B\u0E49\u0E32\u0E22 \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48"),
                !showRoomList && (react_1.default.createElement(button_1.Button, { onClick: () => setIsMobileRoomListOpen(true), variant: "outline" },
                    react_1.default.createElement(lucide_react_1.Menu, { className: "w-4 h-4 mr-2" }),
                    "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07\u0E41\u0E0A\u0E17")))))),
        !isConnected && (react_1.default.createElement("div", { className: "absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm" }, "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D"))));
}
