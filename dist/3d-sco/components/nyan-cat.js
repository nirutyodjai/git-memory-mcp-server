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
const utils_1 = require("@/lib/utils");
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const getRandomHeight = () => {
    return `${Math.random() * 100}vh`;
};
const NyanCat = () => {
    const [divs, setDivs] = (0, react_1.useState)([]);
    const spawnDiv = () => {
        const newDiv = {
            id: (Math.random() * 100000).toFixed(),
        };
        setDivs((prevDivs) => [...prevDivs, newDiv]);
    };
    (0, react_1.useEffect)(() => {
        const handleKeyDown = (e) => {
            if (e.key === "n")
                spawnDiv();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });
    return (react_1.default.createElement("div", { className: "fixed left-0 top-0 w-screen h-screen overflow-hidden z-[-1]" },
        react_1.default.createElement(framer_motion_1.AnimatePresence, null, divs.length > 0 && (react_1.default.createElement("div", { className: "fixed w-screen flex left-0 top-16" }, divs.length))),
        divs &&
            divs.map((div) => (react_1.default.createElement(AnimatedDiv, { key: div.id, id: div.id, onClick: () => console.log("clicked"), onCompleted: () => {
                    setDivs(divs.filter((d) => d.id !== div.id));
                } })))));
};
const AnimatedDiv = ({ id, onClick, onCompleted, }) => {
    const randY = getRandomHeight();
    const controls = (0, framer_motion_1.useAnimationControls)();
    react_1.default.useEffect(() => {
        controls.start({
            x: "100vw",
            y: randY,
            transition: { duration: 5, ease: "linear" },
        });
    }, [controls]);
    const handlePause = () => {
        onClick();
    };
    return (react_1.default.createElement(framer_motion_1.motion.div, { key: id, initial: { x: "-20vw", y: randY }, animate: controls, onAnimationComplete: onCompleted, onClick: handlePause },
        react_1.default.createElement("img", { src: "/assets/nyan-cat.gif", className: (0, utils_1.cn)("fixed z-10 h-40 w-auto"), alt: "Nyan Cat" })));
};
exports.default = NyanCat;
