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
exports.default = ChatMessage;
const react_1 = __importStar(require("react"));
const avatar_1 = require("@/components/ui/avatar");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const utils_1 = require("@/lib/utils");
function ChatMessage({ message, currentUserId, isOwn = false, showAvatar = true, isGrouped = false, onReply, onEdit, onDelete, onReact, onPin, className }) {
    const [isHovered, setIsHovered] = (0, react_1.useState)(false);
    const [showReactions, setShowReactions] = (0, react_1.useState)(false);
    const formatTime = (timestamp) => {
        return (0, date_fns_1.formatDistanceToNow)(new Date(timestamp), {
            addSuffix: true,
            locale: locale_1.th
        });
    };
    const getRoleColor = (role) => {
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
    const handleReaction = (emoji) => {
        onReact?.(message.id, emoji);
        setShowReactions(false);
    };
    const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    if (message.isSystem) {
        return (<div className={(0, utils_1.cn)("flex justify-center my-4", className)}>
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-400">
          {message.content}
        </div>
      </div>);
    }
    return (<div className={(0, utils_1.cn)("group relative flex gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", isGrouped && "mt-1", !isGrouped && "mt-4", className)} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && !isGrouped ? (<avatar_1.Avatar className="w-10 h-10">
            <avatar_1.AvatarImage src={message.author.avatar}/>
            <avatar_1.AvatarFallback className="text-sm">
              {message.author.name.charAt(0).toUpperCase()}
            </avatar_1.AvatarFallback>
          </avatar_1.Avatar>) : (<div className="w-10 h-10 flex items-center justify-center">
            {isHovered && (<span className="text-xs text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
              </span>)}
          </div>)}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        {!isGrouped && (<div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">
              {message.author.name}
            </span>
            
            {message.author.role && message.author.role !== 'member' && (<badge_1.Badge variant="secondary" className={(0, utils_1.cn)("text-xs", getRoleColor(message.author.role))}>
                {message.author.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ช่วยดูแล'}
              </badge_1.Badge>)}
            
            {message.isPinned && (<lucide_react_1.Pin className="w-4 h-4 text-yellow-500"/>)}
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.timestamp)}
            </span>
            
            {message.edited && (<span className="text-xs text-gray-400 italic">
                (แก้ไขแล้ว)
              </span>)}
          </div>)}

        {/* Reply Reference */}
        {message.replyTo && (<div className="mb-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{message.replyTo.author}</span>
              <p className="truncate">{message.replyTo.content}</p>
            </div>
          </div>)}

        {/* Message Text */}
        <div className="text-gray-900 dark:text-gray-100 break-words">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (<div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (<div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {attachment.name}
                  </p>
                  {attachment.size && (<p className="text-xs text-gray-500">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>)}
                </div>
                <button_1.Button variant="ghost" size="sm">
                  <lucide_react_1.ExternalLink className="w-4 h-4"/>
                </button_1.Button>
              </div>))}
          </div>)}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (<button key={index} onClick={() => handleReaction(reaction.emoji)} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm transition-colors">
                <span>{reaction.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {reaction.count}
                </span>
              </button>))}
          </div>)}
      </div>

      {/* Message Actions */}
      {(isHovered || showReactions) && (<div className="absolute top-2 right-4 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1">
          {/* Quick Reactions */}
          <div className="flex items-center gap-1">
            {commonReactions.slice(0, 3).map((emoji) => (<button_1.Button key={emoji} variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleReaction(emoji)}>
                {emoji}
              </button_1.Button>))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-1">
            {onReply && (<button_1.Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => onReply(message)}>
                <lucide_react_1.Reply className="w-4 h-4"/>
              </button_1.Button>)}
            
            <dropdown_menu_1.DropdownMenu>
              <dropdown_menu_1.DropdownMenuTrigger asChild>
                <button_1.Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <lucide_react_1.MoreVertical className="w-4 h-4"/>
                </button_1.Button>
              </dropdown_menu_1.DropdownMenuTrigger>
              <dropdown_menu_1.DropdownMenuContent align="end">
                <dropdown_menu_1.DropdownMenuItem onClick={handleCopyMessage}>
                  <lucide_react_1.Copy className="w-4 h-4 mr-2"/>
                  คัดลอกข้อความ
                </dropdown_menu_1.DropdownMenuItem>
                
                {onPin && (<dropdown_menu_1.DropdownMenuItem onClick={() => onPin(message.id)}>
                    <lucide_react_1.Pin className="w-4 h-4 mr-2"/>
                    {message.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดข้อความ'}
                  </dropdown_menu_1.DropdownMenuItem>)}
                
                <dropdown_menu_1.DropdownMenuItem>
                  <lucide_react_1.Flag className="w-4 h-4 mr-2"/>
                  รายงานข้อความ
                </dropdown_menu_1.DropdownMenuItem>
                
                {isOwn && (<>
                    <dropdown_menu_1.DropdownMenuSeparator />
                    {onEdit && (<dropdown_menu_1.DropdownMenuItem onClick={() => onEdit(message.id, message.content)}>
                        <lucide_react_1.Edit className="w-4 h-4 mr-2"/>
                        แก้ไขข้อความ
                      </dropdown_menu_1.DropdownMenuItem>)}
                    {onDelete && (<dropdown_menu_1.DropdownMenuItem onClick={() => onDelete(message.id)} className="text-red-600 dark:text-red-400">
                        <lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>
                        ลบข้อความ
                      </dropdown_menu_1.DropdownMenuItem>)}
                  </>)}
              </dropdown_menu_1.DropdownMenuContent>
            </dropdown_menu_1.DropdownMenu>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=ChatMessage.js.map