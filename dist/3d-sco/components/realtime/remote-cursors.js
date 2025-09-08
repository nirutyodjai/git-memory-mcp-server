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
const socketio_1 = require("@/contexts/socketio");
const use_mouse_1 = require("@/hooks/use-mouse");
const use_throttle_1 = require("@/hooks/use-throttle");
const lucide_react_1 = require("lucide-react");
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const use_media_query_1 = require("@/hooks/use-media-query");
// TODO: add clicking animation
// TODO: listen to socket disconnect
const RemoteCursors = () => {
    const { socket, users: _users, setUsers } = (0, react_1.useContext)(socketio_1.SocketContext);
    const isMobile = (0, use_media_query_1.useMediaQuery)("(max-width: 768px)");
    const { x, y } = (0, use_mouse_1.useMouse)({ allowPage: true });
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined" || !socket || isMobile)
            return;
        socket.on("cursor-changed", (data) => {
            setUsers((prev) => {
                const newMap = new Map(prev);
                if (!prev.has(data.socketId)) {
                    newMap.set(data.socketId, {
                        ...data,
                    });
                }
                else {
                    newMap.set(data.socketId, { ...prev.get(data.socketId), ...data });
                }
                return newMap;
            });
        });
        socket.on("users-updated", (data) => {
            const newMap = new Map();
            data.forEach((user) => {
                newMap.set(user.socketId, { ...user });
            });
            setUsers(newMap);
        });
        return () => {
            socket.off("cursor-changed");
        };
    }, [socket, isMobile]);
    const handleMouseMove = (0, use_throttle_1.useThrottle)((x, y) => {
        socket?.emit("cursor-change", {
            pos: { x, y },
            socketId: socket.id,
        });
    }, 200);
    (0, react_1.useEffect)(() => {
        if (isMobile)
            return;
        handleMouseMove(x, y);
    }, [x, y, isMobile]);
    const users = Array.from(_users.values());
    return (react_1.default.createElement("div", { className: "h-0 z-10 relative" }, users
        .filter((user) => user.socketId !== socket?.id)
        .map((user) => (react_1.default.createElement(Cursor, { key: user.socketId, x: user.pos.x, y: user.pos.y, color: user.color, socketId: user.socketId, headerText: `${user.location} ${user.flag}` })))));
};
const Cursor = ({ color, x, y, headerText, socketId, }) => {
    const [showText, setShowText] = (0, react_1.useState)(false);
    const [msgText, setMsgText] = (0, react_1.useState)("");
    const { msgs } = (0, react_1.useContext)(socketio_1.SocketContext);
    (0, react_1.useEffect)(() => {
        setShowText(true);
        const fadeOutTimeout = setTimeout(() => {
            setShowText(false);
        }, 3000); // 1 second
        return () => {
            clearTimeout(fadeOutTimeout);
        };
    }, [x, y, msgText]);
    (0, react_1.useEffect)(() => {
        if (msgs.at(-1)?.socketId === socketId) {
            const lastMsgContent = msgs.at(-1)?.content || "";
            const textSlice = lastMsgContent.slice(0, 30) + (lastMsgContent.length > 30 ? "..." : "");
            const timeToRead = Math.min(4000, Math.max(textSlice.length * 100, 1000));
            setMsgText(textSlice);
            // setShowText(true);
            const t = setTimeout(() => {
                setMsgText("");
                clearTimeout(t);
                // setShowText(false);
            }, timeToRead);
        }
    }, [msgs]);
    return (react_1.default.createElement(framer_motion_1.motion.div, { animate: {
            x: x,
            y: y,
        }, className: "w-6 h-6", transition: {
            duration: 0.2, // Adjust duration for smoothness
            ease: "easeOut", // Choose an easing function
        }, onMouseEnter: () => setShowText(true), onMouseLeave: () => setShowText(false) },
        react_1.default.createElement(lucide_react_1.MousePointer2, { className: "w-6 h-6 z-[9999999]", style: { color: color }, strokeWidth: 7.2 }),
        react_1.default.createElement(framer_motion_1.AnimatePresence, null, showText && headerText && (react_1.default.createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: -7 }, exit: { opacity: 0, y: -20 }, className: "text-xs rounded-xl w-fit p-2 px-4 ml-4 cursor-can-hover cursor-can-hover cursor-can-hover cursor-can-hover", style: {
                backgroundColor: color + "f0",
            } },
            react_1.default.createElement("div", { className: "text-nowrap" }, headerText),
            msgText && react_1.default.createElement("div", { className: "font-mono w-44" }, msgText))))));
};
exports.default = RemoteCursors;
