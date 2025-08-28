"use strict";
/**
 * Disclaimer: This component is not entirely my own
 */
"use client";
/**
 * Disclaimer: This component is not entirely my own
 */
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
const gsap_1 = require("gsap");
const utils_1 = require("@/lib/utils");
const use_mouse_1 = require("@/hooks/use-mouse");
const preloader_1 = require("../preloader");
const use_media_query_1 = require("@/hooks/use-media-query");
// Gsap Ticker Function
function useTicker(callback, paused) {
    (0, react_1.useEffect)(() => {
        if (!paused && callback) {
            gsap_1.gsap.ticker.add(callback);
        }
        return () => {
            gsap_1.gsap.ticker.remove(callback);
        };
    }, [callback, paused]);
}
const EMPTY = {};
function useInstance(value = {}) {
    const ref = (0, react_1.useRef)(EMPTY);
    if (ref.current === EMPTY) {
        ref.current = typeof value === "function" ? value() : value;
    }
    return ref.current;
}
// Function for Mouse Move Scale Change
function getScale(diffX, diffY) {
    const distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    return Math.min(distance / 735, 0.35);
}
// Function For Mouse Movement Angle in Degrees
function getAngle(diffX, diffY) {
    return (Math.atan2(diffY, diffX) * 180) / Math.PI;
}
function getRekt(el) {
    if (el.classList.contains("cursor-can-hover"))
        return el.getBoundingClientRect();
    else if (el.parentElement?.classList.contains("cursor-can-hover"))
        return el.parentElement.getBoundingClientRect();
    else if (el.parentElement?.parentElement?.classList.contains("cursor-can-hover"))
        return el.parentElement.parentElement.getBoundingClientRect();
    return null;
}
const CURSOR_DIAMETER = 50;
function ElasticCursor() {
    const { loadingPercent, isLoading } = (0, preloader_1.usePreloader)();
    const isMobile = (0, use_media_query_1.useMediaQuery)("(max-width: 768px)");
    // React Refs for Jelly Blob and Text
    const jellyRef = (0, react_1.useRef)(null);
    const [isHovering, setIsHovering] = (0, react_1.useState)(false);
    const { x, y } = (0, use_mouse_1.useMouse)();
    // Save pos and velocity Objects
    const pos = useInstance(() => ({ x: 0, y: 0 }));
    const vel = useInstance(() => ({ x: 0, y: 0 }));
    const set = useInstance();
    // Set GSAP quick setter Values on useLayoutEffect Update
    (0, react_1.useLayoutEffect)(() => {
        set.x = gsap_1.gsap.quickSetter(jellyRef.current, "x", "px");
        set.y = gsap_1.gsap.quickSetter(jellyRef.current, "y", "px");
        set.r = gsap_1.gsap.quickSetter(jellyRef.current, "rotate", "deg");
        set.sx = gsap_1.gsap.quickSetter(jellyRef.current, "scaleX");
        set.sy = gsap_1.gsap.quickSetter(jellyRef.current, "scaleY");
        set.width = gsap_1.gsap.quickSetter(jellyRef.current, "width", "px");
    }, []);
    // Start Animation loop
    const loop = (0, react_1.useCallback)(() => {
        if (!set.width || !set.sx || !set.sy || !set.r)
            return;
        // Calculate angle and scale based on velocity
        var rotation = getAngle(+vel.x, +vel.y); // Mouse Move Angle
        var scale = getScale(+vel.x, +vel.y); // Blob Squeeze Amount
        // Set GSAP quick setter Values on Loop Function
        if (!isHovering && !isLoading) {
            set.x(pos.x);
            set.y(pos.y);
            set.width(50 + scale * 300);
            set.r(rotation);
            set.sx(1 + scale);
            set.sy(1 - scale * 2);
        }
        else {
            set.r(0);
        }
    }, [isHovering, isLoading]);
    const [cursorMoved, setCursorMoved] = (0, react_1.useState)(false);
    // Run on Mouse Move
    (0, react_1.useLayoutEffect)(() => {
        if (isMobile)
            return;
        // Caluclate Everything Function
        const setFromEvent = (e) => {
            if (!jellyRef.current)
                return;
            if (!cursorMoved) {
                setCursorMoved(true);
            }
            const el = e.target;
            const hoverElemRect = getRekt(el);
            if (hoverElemRect) {
                const rect = el.getBoundingClientRect();
                setIsHovering(true);
                gsap_1.gsap.to(jellyRef.current, {
                    rotate: 0,
                    duration: 0,
                });
                gsap_1.gsap.to(jellyRef.current, {
                    width: el.offsetWidth + 20,
                    height: el.offsetHeight + 20,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    borderRadius: 10,
                    duration: 1.5,
                    ease: "elastic.out(1, 0.3)",
                });
                // return;
            }
            else {
                gsap_1.gsap.to(jellyRef.current, {
                    borderRadius: 50,
                    width: CURSOR_DIAMETER,
                    height: CURSOR_DIAMETER,
                });
                setIsHovering(false);
            }
            // Mouse X and Y
            const x = e.clientX;
            const y = e.clientY;
            // Animate Position and calculate Velocity with GSAP
            gsap_1.gsap.to(pos, {
                x: x,
                y: y,
                duration: 1.5,
                ease: "elastic.out(1, 0.5)",
                onUpdate: () => {
                    // @ts-ignore
                    vel.x = (x - pos.x) * 1.2;
                    // @ts-ignore
                    vel.y = (y - pos.y) * 1.2;
                },
            });
            loop();
        };
        if (!isLoading)
            window.addEventListener("mousemove", setFromEvent);
        return () => {
            if (!isLoading)
                window.removeEventListener("mousemove", setFromEvent);
        };
    }, [isLoading]);
    (0, react_1.useEffect)(() => {
        if (!jellyRef.current)
            return;
        jellyRef.current.style.height = "2rem"; // "8rem";
        jellyRef.current.style.borderRadius = "1rem";
        jellyRef.current.style.width = loadingPercent * 2 + "vw";
    }, [loadingPercent]);
    useTicker(loop, isLoading || !cursorMoved || isMobile);
    if (isMobile)
        return null;
    // Return UI
    return (<>
      <div ref={jellyRef} id={"jelly-id"} className={(0, utils_1.cn)(`w-[${CURSOR_DIAMETER}px] h-[${CURSOR_DIAMETER}px] border-2 border-black dark:border-white`, "jelly-blob fixed left-0 top-0 rounded-lg z-[999] pointer-events-none will-change-transform", "translate-x-[-50%] translate-y-[-50%]")} style={{
            zIndex: 100,
            backdropFilter: "invert(100%)",
        }}></div>
      <div className="w-3 h-3 rounded-full fixed translate-x-[-50%] translate-y-[-50%] pointer-events-none transition-none duration-300" style={{
            top: y,
            left: x,
            backdropFilter: "invert(100%)",
        }}></div>
    </>);
}
exports.default = ElasticCursor;
//# sourceMappingURL=ElasticCursor.js.map