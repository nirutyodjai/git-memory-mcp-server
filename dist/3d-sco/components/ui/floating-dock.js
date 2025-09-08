"use strict";
/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloatingDock = void 0;
const utils_1 = require("@/lib/utils");
// import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
const framer_motion_1 = require("framer-motion");
const react_1 = require("react");
const FloatingDock = ({ items, desktopClassName, mobileClassName, }) => {
    return (React.createElement(React.Fragment, null,
        React.createElement(FloatingDockDesktop, { items: items, className: desktopClassName })));
};
exports.FloatingDock = FloatingDock;
const FloatingDockMobile = ({ items, className, }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    return (React.createElement("div", { className: (0, utils_1.cn)("relative block md:hidden", className) },
        React.createElement(framer_motion_1.AnimatePresence, null, open && (React.createElement(framer_motion_1.motion.div, { layoutId: "nav", className: "absolute bottom-full mb-2 inset-x-0 flex flex-col gap-2" }, items.map((item, idx) => (React.createElement(framer_motion_1.motion.div, { key: item.title, initial: { opacity: 0, y: 10 }, animate: {
                opacity: 1,
                y: 0,
            }, exit: {
                opacity: 0,
                y: 10,
                transition: {
                    delay: idx * 0.05,
                },
            }, transition: { delay: (items.length - 1 - idx) * 0.05 } },
            React.createElement("div", { key: item.title, className: "h-10 w-10 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center" },
                React.createElement("div", { className: "h-4 w-4" }, item.icon))))))))));
};
const FloatingDockDesktop = ({ items, className, }) => {
    let mouseX = (0, framer_motion_1.useMotionValue)(Infinity);
    const [showHint, setShowHint] = (0, react_1.useState)(true);
    const timer = (0, react_1.useRef)();
    const controls = (0, framer_motion_1.useAnimation)();
    (0, react_1.useEffect)(() => {
        if (showHint) {
            controls.start({
                opacity: [0, 1, 1, 0],
                x: [-50, -50, 50, 50],
                transition: {
                    duration: 2,
                    repeatDelay: 2,
                    delay: 2,
                    times: [0, 0.2, 0.8, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                },
            });
        }
        else {
            controls.stop();
        }
        return () => {
            controls.stop();
            clearInterval(timer.current);
        };
    }, [showHint]);
    return (React.createElement("div", { className: "relative h-fit flex items-center justify-center" },
        React.createElement(framer_motion_1.motion.div, { onMouseMove: (e) => {
                mouseX.set(e.pageX);
                setShowHint(false);
            }, onMouseLeave: () => mouseX.set(Infinity), className: (0, utils_1.cn)(
            // "hidden md:flex",
            "flex gap-2 md:gap-4", "mx-auto h-16 items-end  rounded-2xl bg-gray-50 dark:bg-neutral-900 px-4 pb-3", 
            // "blur-sm brightness-50",
            className) }, items.map((item) => (React.createElement(IconContainer, { mouseX: mouseX, key: item.title, ...item })))),
        showHint && (React.createElement("div", { className: "z-10 absolute t-0 w-full h-full pointer-events-none", onMouseEnter: () => setShowHint(false) },
            React.createElement("div", { className: (0, utils_1.cn)("relative w-full h-full flex items-center justify-center"
                // "backdrop-blur-md"
                ) },
                React.createElement(framer_motion_1.motion.div, { className: (0, utils_1.cn)("w-5 h-5 border-2 left-[50%] top-0 border-black dark:border-white rounded-full", "translate-x-[-50px]"), initial: { opacity: 0, x: -50 }, animate: controls }))))));
};
function IconContainer({ mouseX, title, icon, }) {
    let ref = (0, react_1.useRef)(null);
    let distance = (0, framer_motion_1.useTransform)(mouseX, (val) => {
        let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });
    let widthTransform = (0, framer_motion_1.useTransform)(distance, [-150, 0, 150], [40, 80, 40]);
    let heightTransform = (0, framer_motion_1.useTransform)(distance, [-150, 0, 150], [40, 80, 40]);
    let widthTransformIcon = (0, framer_motion_1.useTransform)(distance, [-150, 0, 150], [20, 40, 20]);
    let heightTransformIcon = (0, framer_motion_1.useTransform)(distance, [-150, 0, 150], [20, 40, 20]);
    let width = (0, framer_motion_1.useSpring)(widthTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });
    let height = (0, framer_motion_1.useSpring)(heightTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });
    let widthIcon = (0, framer_motion_1.useSpring)(widthTransformIcon, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });
    let heightIcon = (0, framer_motion_1.useSpring)(heightTransformIcon, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });
    const [hovered, setHovered] = (0, react_1.useState)(false);
    return (React.createElement(framer_motion_1.motion.div, { ref: ref, style: { width, height }, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), className: "aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center relative" },
        React.createElement(framer_motion_1.AnimatePresence, null, hovered && (React.createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: 10, x: "-50%" }, animate: { opacity: 1, y: 0, x: "-50%" }, exit: { opacity: 0, y: 2, x: "-50%" }, className: "px-2 py-0.5 whitespace-pre rounded-md bg-gray-100 border dark:bg-neutral-800 dark:border-neutral-900 dark:text-white border-gray-200 text-neutral-700 absolute left-1/2 -translate-x-1/2 -top-8 w-fit text-xs" }, title))),
        React.createElement(framer_motion_1.motion.div, { style: { width: widthIcon, height: heightIcon }, className: "flex items-center justify-center" }, icon)));
}
