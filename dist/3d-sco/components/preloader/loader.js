"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Index;
const style_module_scss_1 = __importDefault(require("./style.module.scss"));
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const anim_1 = require("./anim");
const _1 = require(".");
const steps = [
    "10%",
    "20%",
    "30%",
    "40%",
    "50%",
    "60%",
    "70%",
    "80%",
    "90%",
    "100%",
];
function Index() {
    const { isLoading, loadingPercent } = (0, _1.usePreloader)();
    const [index, setIndex] = (0, react_1.useState)(0);
    const [dimension, setDimension] = (0, react_1.useState)({ width: 0, height: 0 });
    (0, react_1.useEffect)(() => {
        setDimension({ width: window.innerWidth, height: window.innerHeight });
    }, []);
    (0, react_1.useEffect)(() => {
        if (index == steps.length - 1)
            return;
        setTimeout(() => {
            setIndex(index + 1);
        }, index == 0 ? 1000 : 150);
    }, [index]);
    const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height}  L0 0`;
    const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height}  L0 0`;
    const curve = {
        initial: {
            d: initialPath,
            transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
        },
        exit: {
            d: targetPath,
            transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.3 },
        },
    };
    return (React.createElement(framer_motion_1.motion.div, { variants: anim_1.slideUp, initial: "initial", exit: "exit", className: style_module_scss_1.default.introduction }, dimension.width > 0 && (React.createElement(React.Fragment, null,
        React.createElement(framer_motion_1.motion.p, { variants: anim_1.opacity, initial: "initial", animate: "enter" },
            (loadingPercent - (loadingPercent % 5)).toFixed(0),
            " %"),
        React.createElement("svg", null,
            React.createElement(framer_motion_1.motion.path, { variants: curve, initial: "initial", exit: "exit" }))))));
}
