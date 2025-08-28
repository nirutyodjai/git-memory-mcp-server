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
        return (<card_1.Card className={(0, utils_1.cn)("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <lucide_react_1.MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 mb-4">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</p>
          <button_1.Button onClick={() => window.location.href = '/auth/signin'}>
            เข้าสู่ระบบ
          </button_1.Button>
        </div>
      </card_1.Card>);
    }
    if (isMinimized) {
        return (<div className="fixed bottom-4 right-4 z-50">
        <button_1.Button onClick={() => setIsMinimized(false)} className="rounded-full w-14 h-14 shadow-lg" size="lg">
          <lucide_react_1.MessageCircle className="w-6 h-6"/>
        </button_1.Button>
      </div>);
    }
    return (<div className={(0, utils_1.cn)("flex h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden", className)}>
      {/* Mobile Room List Overlay */}
      {isMobileRoomListOpen && (<div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileRoomListOpen(false)}/>
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">ห้องแชท</h2>
              <button_1.Button variant="ghost" size="sm" onClick={() => setIsMobileRoomListOpen(false)}>
                <lucide_react_1.X className="w-4 h-4"/>
              </button_1.Button>
            </div>
            <ChatRoomList_1.default onRoomSelect={handleRoomSelect} selectedRoomId={selectedRoom?.id}/>
          </div>
        </div>)}

      {/* Desktop Room List */}
      {showRoomList && (<div className="hidden lg:block w-80 border-r border-gray-200 dark:border-gray-700">
          <ChatRoomList_1.default onRoomSelect={handleRoomSelect} selectedRoomId={selectedRoom?.id}/>
        </div>)}

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (<>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {showRoomList && (<button_1.Button variant="ghost" size="sm" onClick={() => setIsMobileRoomListOpen(true)}>
                    <lucide_react_1.Menu className="w-4 h-4"/>
                  </button_1.Button>)}
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">
                    {selectedRoom.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRoom.memberCount} สมาชิก
                  </p>
                </div>
              </div>
              <button_1.Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
                <lucide_react_1.X className="w-4 h-4"/>
              </button_1.Button>
            </div>

            {/* Chat Interface */}
            <ChatInterface_1.default roomId={selectedRoom.id} roomName={selectedRoom.name} isPrivate={selectedRoom.isPrivate}/>
          </>) : (
        /* No Room Selected */
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <lucide_react_1.MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                เลือกห้องแชทเพื่อเริ่มสนทนา
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                เลือกห้องแชทจากรายการด้านซ้าย หรือสร้างห้องใหม่
              </p>
              {!showRoomList && (<button_1.Button onClick={() => setIsMobileRoomListOpen(true)} variant="outline">
                  <lucide_react_1.Menu className="w-4 h-4 mr-2"/>
                  เลือกห้องแชท
                </button_1.Button>)}
            </div>
          </div>)}
      </div>

      {/* Connection Status Indicator */}
      {!isConnected && (<div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
          ไม่ได้เชื่อมต่อ
        </div>)}
    </div>);
}
//# sourceMappingURL=ChatLayout.js.map