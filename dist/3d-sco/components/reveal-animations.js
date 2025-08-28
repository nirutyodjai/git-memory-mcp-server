"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxReveal = exports.BlurIn = void 0;
const framer_motion_1 = require("framer-motion");
const utils_1 = require("@/lib/utils");
const react_1 = require("react");
const BlurIn = ({ children, className, variant, delay = 0, duration = 1, }) => {
    const defaultVariants = {
        hidden: { filter: "blur(10px)", opacity: 0 },
        visible: { filter: "blur(0px)", opacity: 1 },
    };
    const combinedVariants = variant || defaultVariants;
    return (<framer_motion_1.motion.h1 initial="hidden" animate="visible" transition={{ duration, delay }} variants={combinedVariants} className={(0, utils_1.cn)(className
        // "font-display text-center text-4xl font-bold tracking-[-0.02em] drop-shadow-sm md:text-7xl md:leading-[5rem]"
        )}>
      {children}
    </framer_motion_1.motion.h1>);
};
exports.BlurIn = BlurIn;
const BoxReveal = ({ children, width = "fit-content", boxColor, duration, delay, once = true, }) => {
    const mainControls = (0, framer_motion_1.useAnimation)();
    const slideControls = (0, framer_motion_1.useAnimation)();
    const ref = (0, react_1.useRef)(null);
    const isInView = (0, framer_motion_1.useInView)(ref, { once });
    (0, react_1.useEffect)(() => {
        if (isInView) {
            slideControls.start("visible");
            mainControls.start("visible");
        }
        else {
            slideControls.start("hidden");
            mainControls.start("hidden");
        }
    }, [isInView, mainControls, slideControls]);
    return (<div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <framer_motion_1.motion.div variants={{
            hidden: { opacity: 0, y: 75 },
            visible: { opacity: 1, y: 0 },
        }} initial="hidden" animate={mainControls} transition={{ duration: duration ? duration : 0.5, delay }}>
        {children}
      </framer_motion_1.motion.div>

      <framer_motion_1.motion.div variants={{
            hidden: { left: 0 },
            visible: { left: "100%" },
        }} initial="hidden" animate={slideControls} transition={{
            duration: duration ? duration : 0.5,
            ease: "easeIn",
            delay,
        }} style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 0,
            right: 0,
            zIndex: 20,
            background: boxColor ? boxColor : "#ffffff00",
        }}/>
    </div>);
};
exports.BoxReveal = BoxReveal;
//# sourceMappingURL=reveal-animations.js.map