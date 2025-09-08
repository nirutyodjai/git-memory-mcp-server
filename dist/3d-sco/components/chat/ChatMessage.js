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
        return (react_1.default.createElement("div", { className: (0, utils_1.cn)("flex justify-center my-4", className) },
            react_1.default.createElement("div", { className: "bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-400" }, message.content)));
    }
    return (react_1.default.createElement("div", { className: (0, utils_1.cn)("group relative flex gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", isGrouped && "mt-1", !isGrouped && "mt-4", className), onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) },
        react_1.default.createElement("div", { className: "flex-shrink-0" }, showAvatar && !isGrouped ? (react_1.default.createElement(avatar_1.Avatar, { className: "w-10 h-10" },
            react_1.default.createElement(avatar_1.AvatarImage, { src: message.author.avatar }),
            react_1.default.createElement(avatar_1.AvatarFallback, { className: "text-sm" }, message.author.name.charAt(0).toUpperCase()))) : (react_1.default.createElement("div", { className: "w-10 h-10 flex items-center justify-center" }, isHovered && (react_1.default.createElement("span", { className: "text-xs text-gray-400" }, new Date(message.timestamp).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        })))))),
        react_1.default.createElement("div", { className: "flex-1 min-w-0" },
            !isGrouped && (react_1.default.createElement("div", { className: "flex items-center gap-2 mb-1" },
                react_1.default.createElement("span", { className: "font-semibold text-gray-900 dark:text-white" }, message.author.name),
                message.author.role && message.author.role !== 'member' && (react_1.default.createElement(badge_1.Badge, { variant: "secondary", className: (0, utils_1.cn)("text-xs", getRoleColor(message.author.role)) }, message.author.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ช่วยดูแล')),
                message.isPinned && (react_1.default.createElement(lucide_react_1.Pin, { className: "w-4 h-4 text-yellow-500" })),
                react_1.default.createElement("span", { className: "text-xs text-gray-500 dark:text-gray-400" }, formatTime(message.timestamp)),
                message.edited && (react_1.default.createElement("span", { className: "text-xs text-gray-400 italic" }, "(\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27)")))),
            message.replyTo && (react_1.default.createElement("div", { className: "mb-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600" },
                react_1.default.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-400" },
                    react_1.default.createElement("span", { className: "font-medium" }, message.replyTo.author),
                    react_1.default.createElement("p", { className: "truncate" }, message.replyTo.content)))),
            react_1.default.createElement("div", { className: "text-gray-900 dark:text-gray-100 break-words" }, message.content),
            message.attachments && message.attachments.length > 0 && (react_1.default.createElement("div", { className: "mt-2 space-y-2" }, message.attachments.map((attachment) => (react_1.default.createElement("div", { key: attachment.id, className: "flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg" },
                react_1.default.createElement("div", { className: "flex-1" },
                    react_1.default.createElement("p", { className: "text-sm font-medium text-gray-900 dark:text-white" }, attachment.name),
                    attachment.size && (react_1.default.createElement("p", { className: "text-xs text-gray-500" },
                        (attachment.size / 1024 / 1024).toFixed(2),
                        " MB"))),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm" },
                    react_1.default.createElement(lucide_react_1.ExternalLink, { className: "w-4 h-4" }))))))),
            message.reactions && message.reactions.length > 0 && (react_1.default.createElement("div", { className: "flex flex-wrap gap-1 mt-2" }, message.reactions.map((reaction, index) => (react_1.default.createElement("button", { key: index, onClick: () => handleReaction(reaction.emoji), className: "flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm transition-colors" },
                react_1.default.createElement("span", null, reaction.emoji),
                react_1.default.createElement("span", { className: "text-xs text-gray-600 dark:text-gray-400" }, reaction.count))))))),
        (isHovered || showReactions) && (react_1.default.createElement("div", { className: "absolute top-2 right-4 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1" },
            react_1.default.createElement("div", { className: "flex items-center gap-1" }, commonReactions.slice(0, 3).map((emoji) => (react_1.default.createElement(button_1.Button, { key: emoji, variant: "ghost", size: "sm", className: "w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800", onClick: () => handleReaction(emoji) }, emoji)))),
            react_1.default.createElement("div", { className: "flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-1" },
                onReply && (react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "w-8 h-8 p-0", onClick: () => onReply(message) },
                    react_1.default.createElement(lucide_react_1.Reply, { className: "w-4 h-4" }))),
                react_1.default.createElement(dropdown_menu_1.DropdownMenu, null,
                    react_1.default.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                        react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "w-8 h-8 p-0" },
                            react_1.default.createElement(lucide_react_1.MoreVertical, { className: "w-4 h-4" }))),
                    react_1.default.createElement(dropdown_menu_1.DropdownMenuContent, { align: "end" },
                        react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleCopyMessage },
                            react_1.default.createElement(lucide_react_1.Copy, { className: "w-4 h-4 mr-2" }),
                            "\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21"),
                        onPin && (react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => onPin(message.id) },
                            react_1.default.createElement(lucide_react_1.Pin, { className: "w-4 h-4 mr-2" }),
                            message.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดข้อความ')),
                        react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, null,
                            react_1.default.createElement(lucide_react_1.Flag, { className: "w-4 h-4 mr-2" }),
                            "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21"),
                        isOwn && (react_1.default.createElement(react_1.default.Fragment, null,
                            react_1.default.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
                            onEdit && (react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => onEdit(message.id, message.content) },
                                react_1.default.createElement(lucide_react_1.Edit, { className: "w-4 h-4 mr-2" }),
                                "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21")),
                            onDelete && (react_1.default.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: () => onDelete(message.id), className: "text-red-600 dark:text-red-400" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4 mr-2" }),
                                "\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21")))))))))));
}
