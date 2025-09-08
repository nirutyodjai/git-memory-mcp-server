"use strict";
"use client";
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
const react_1 = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const popover_1 = require("@/components/ui/popover");
const framer_motion_1 = require("framer-motion");
const socketio_1 = require("@/contexts/socketio");
const tabs_1 = require("../ui/tabs");
const input_1 = require("../ui/input");
const scroll_area_1 = require("../ui/scroll-area");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const OnlineUsers = () => {
    const { socket, users: _users, msgs } = (0, react_1.useContext)(socketio_1.SocketContext);
    const inputRef = (0, react_1.useRef)(null);
    const chatContainer = (0, react_1.useRef)(null);
    const users = Array.from(_users.values());
    // i know i know this code sucks, WILL FIX LATER
    const containerScrollBottom = () => {
        const t = setTimeout(() => {
            if (chatContainer.current) {
                chatContainer.current.scrollTop = chatContainer.current.scrollHeight;
            }
            clearTimeout(t);
        }, 1);
    };
    (0, react_1.useEffect)(containerScrollBottom, [msgs]);
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.04,
            },
        },
    };
    const sendMessage = () => {
        if (!inputRef.current?.value)
            return;
        const msg = inputRef.current.value;
        inputRef.current.value = "";
        if (msg.trim() === "")
            return;
        socket?.emit("msg-send", {
            content: msg,
        });
    };
    const updateUsername = (newName) => {
        socket?.emit("username-change", {
            username: newName,
        });
        localStorage.setItem("username", newName);
    };
    return (react_1.default.createElement(popover_1.Popover, null,
        react_1.default.createElement(popover_1.PopoverTrigger, { asChild: true },
            react_1.default.createElement(button_1.Button, { variant: "ghost", className: (0, utils_1.cn)("p-0 m-0 mr-4 h-fit w-fit transition-opacity duration-150", users.length <= 1 ? "opacity-0" : "opacity-100") },
                react_1.default.createElement("div", { className: "relative flex flex-col gap-2" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2 h-fit" },
                        react_1.default.createElement("div", { className: "w-2 h-2 animate-pulse rounded-full bg-green-400" }),
                        users.length,
                        " online"),
                    react_1.default.createElement("div", { className: "absolute bottom-0 right-0 h-2 text-[.13rem]" })))),
        react_1.default.createElement(popover_1.PopoverContent, { className: "w-80" },
            react_1.default.createElement(tabs_1.Tabs, { defaultValue: "account", className: "w-full h-[30rem] flex flex-col items-center no-hover-zone", onValueChange: (activeTab) => {
                    if (activeTab === "chat")
                        containerScrollBottom();
                } },
                react_1.default.createElement(tabs_1.TabsList, { className: "w-full h-8" },
                    react_1.default.createElement(tabs_1.TabsTrigger, { className: "w-1/2 h-full", value: "users" }, "Users"),
                    react_1.default.createElement(tabs_1.TabsTrigger, { className: "w-1/2 h-full", value: "chat" }, "Chat")),
                react_1.default.createElement(tabs_1.TabsContent, { value: "users", className: "w-full h-full overflow-auto" },
                    react_1.default.createElement(scroll_area_1.ScrollArea, { className: "w-full h-full modall" },
                        react_1.default.createElement(framer_motion_1.motion.div, null,
                            react_1.default.createElement("div", { className: "space-y-2 mb-8" },
                                react_1.default.createElement("p", { className: "text-sm text-muted-foreground text-center" },
                                    "There ",
                                    users.length === 1 ? "is" : "are",
                                    " ",
                                    users.length,
                                    " ",
                                    "user",
                                    users.length === 1 ? "" : "s",
                                    " online here!"),
                                users.length <= 1 && (react_1.default.createElement("p", { className: "text-xs font-mono text-muted-foreground text-center text-yellow-600" },
                                    "(This is a feature not a bug",
                                    react_1.default.createElement("br", null),
                                    " invite some friends!)"))),
                            react_1.default.createElement(framer_motion_1.motion.ul, { className: "grid gap-4", variants: container, initial: "hidden", animate: "show" }, users.map((user, i) => (react_1.default.createElement(UserItem, { key: i, user: user, socket: socket, updateUsername: updateUsername }))))))),
                react_1.default.createElement(tabs_1.TabsContent, { value: "chat", className: "w-full flex-1 overflow-auto flex flex-col" },
                    react_1.default.createElement("div", { className: "w-full h-full modall overflow-auto", ref: chatContainer }, msgs.map((msg, i) => (react_1.default.createElement("div", { key: i },
                        react_1.default.createElement("span", null,
                            react_1.default.createElement("span", { style: {
                                    color: users.find((u) => u.socketId === msg.socketId)
                                        ?.color || "#777",
                                }, className: "mr-2" },
                                msg.username,
                                " ",
                                msg.socketId === socket?.id && "(you)",
                                ":"),
                            react_1.default.createElement("span", { className: "font-mono" }, msg.content)))))),
                    react_1.default.createElement("div", { className: "w-full h-20 flex items-center gap-2" },
                        react_1.default.createElement(input_1.Input, { className: "flex-1", ref: inputRef, placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21", onKeyDown: (e) => e.key === "Enter" && sendMessage() }),
                        react_1.default.createElement(button_1.Button, { onClick: sendMessage }, "\u0E2A\u0E48\u0E07")))))));
};
exports.default = OnlineUsers;
const UserItem = ({ user, socket, updateUsername, }) => {
    const inputRef = (0, react_1.useRef)(null);
    const [isEditingName, setIsEditingName] = react_1.default.useState(false);
    const [newUsername, setNewUsername] = react_1.default.useState(user.name);
    const item = {
        hidden: { opacity: 0 },
        show: { opacity: 1 },
    };
    (0, react_1.useEffect)(() => {
        if (inputRef.current && isEditingName)
            inputRef.current.focus();
    }, [isEditingName]);
    const cancelEditing = () => {
        setNewUsername(user.name);
        setIsEditingName(false);
    };
    const saveEdit = () => {
        updateUsername(newUsername);
        setIsEditingName(false);
    };
    return (react_1.default.createElement(framer_motion_1.motion.li, { key: user.socketId, className: "flex items-center justify-between", variants: item },
        react_1.default.createElement("div", { className: "flex items-center gap-2" },
            react_1.default.createElement("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: user.color } }),
            isEditingName ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(input_1.Input, { value: newUsername, ref: inputRef, onChange: (e) => setNewUsername(e.target.value), className: "w-40", onKeyDown: (e) => e.key === "Enter" && saveEdit() }),
                react_1.default.createElement(button_1.Button, { variant: "ghost", onClick: cancelEditing },
                    react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })),
                react_1.default.createElement(button_1.Button, { variant: "ghost", onClick: saveEdit },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4" })))) : (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("span", { className: "text-sm" },
                    user.name,
                    " ",
                    user.socketId === socket?.id && "(you)"),
                user.socketId === socket?.id && (react_1.default.createElement(button_1.Button, { className: "py-0 my-0", variant: "ghost", onClick: () => setIsEditingName(true) },
                    react_1.default.createElement(lucide_react_1.Edit, { className: "w-4 h-4" }))))))));
};
