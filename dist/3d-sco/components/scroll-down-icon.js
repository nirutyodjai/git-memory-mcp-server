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
const framer_motion_1 = require("framer-motion");
const ScrollDownIcon = () => {
    const [show, setShow] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        window.addEventListener("scroll", () => {
            if (window.scrollY > 10) {
                setShow(false);
            }
            else {
                setShow(true);
            }
        });
    });
    return (react_1.default.createElement(framer_motion_1.AnimatePresence, null, show && (react_1.default.createElement(framer_motion_1.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] }, className: "w-fit min-h-[50px] p-1 border-2 rounded-full border-gray-500 dark:border-white " },
        react_1.default.createElement(framer_motion_1.motion.div, { initial: { y: 0 }, animate: { y: [0, 25], opacity: [1, 0] }, transition: {
                duration: 1,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 1,
            }, className: "w-3 h-3 rounded-full bg-gray-500 dark:bg-white" })))));
};
exports.default = ScrollDownIcon;
