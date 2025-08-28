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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinPerspective = exports.PinContainer = void 0;
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const utils_1 = require("@/lib/utils");
const link_1 = __importDefault(require("next/link"));
const PinContainer = ({ children, title, href, className, containerClassName, }) => {
    const [transform, setTransform] = (0, react_1.useState)("translate(-50%,-50%) rotateX(0deg)");
    const onMouseEnter = () => {
        setTransform("translate(-50%,-50%) rotateX(40deg) scale(0.8)");
    };
    const onMouseLeave = () => {
        setTransform("translate(-50%,-50%) rotateX(0deg) scale(1)");
    };
    return (<link_1.default className={(0, utils_1.cn)("relative group/pin z-50  cursor-pointer", containerClassName)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} href={href || "/"}>
      <div style={{
            perspective: "1000px",
            transform: "rotateX(70deg) translateZ(0deg)",
        }} className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2">
        <div style={{
            transform: transform,
        }} className="absolute left-1/2 p-4 top-1/2  flex justify-start items-start  rounded-2xl  shadow-[0_8px_16px_rgb(0_0_0/0.4)] bg-black border border-white/[0.1] group-hover/pin:border-white/[0.2] transition duration-700 overflow-hidden">
          <div className={(0, utils_1.cn)(" relative z-50 ", className)}>{children}</div>
        </div>
      </div>
      <exports.PinPerspective title={title} href={href}/>
    </link_1.default>);
};
exports.PinContainer = PinContainer;
const PinPerspective = ({ title, href, }) => {
    return (<framer_motion_1.motion.div className="pointer-events-none  w-96 h-80 flex items-center justify-center opacity-0 group-hover/pin:opacity-100 z-[60] transition duration-500">
      <div className=" w-full h-full -mt-7 flex-none  inset-0">
        <div className="absolute top-0 inset-x-0  flex justify-center">
          <a href={href} target={"_blank"} className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 ">
            <span className="relative z-20 text-white text-xs font-bold inline-block py-0.5">
              {title}
            </span>

            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover/btn:opacity-40"></span>
          </a>
        </div>

        <div style={{
            perspective: "1000px",
            transform: "rotateX(70deg) translateZ(0)",
        }} className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2">
          <>
            <framer_motion_1.motion.div initial={{
            opacity: 0,
            scale: 0,
            x: "-50%",
            y: "-50%",
        }} animate={{
            opacity: [0, 1, 0.5, 0],
            scale: 1,
            z: 0,
        }} transition={{
            duration: 6,
            repeat: Infinity,
            delay: 0,
        }} className="absolute left-1/2 top-1/2  h-[11.25rem] w-[11.25rem] rounded-[50%] bg-sky-500/[0.08] shadow-[0_8px_16px_rgb(0_0_0/0.4)]"></framer_motion_1.motion.div>
            <framer_motion_1.motion.div initial={{
            opacity: 0,
            scale: 0,
            x: "-50%",
            y: "-50%",
        }} animate={{
            opacity: [0, 1, 0.5, 0],
            scale: 1,
            z: 0,
        }} transition={{
            duration: 6,
            repeat: Infinity,
            delay: 2,
        }} className="absolute left-1/2 top-1/2  h-[11.25rem] w-[11.25rem] rounded-[50%] bg-sky-500/[0.08] shadow-[0_8px_16px_rgb(0_0_0/0.4)]"></framer_motion_1.motion.div>
            <framer_motion_1.motion.div initial={{
            opacity: 0,
            scale: 0,
            x: "-50%",
            y: "-50%",
        }} animate={{
            opacity: [0, 1, 0.5, 0],
            scale: 1,
            z: 0,
        }} transition={{
            duration: 6,
            repeat: Infinity,
            delay: 4,
        }} className="absolute left-1/2 top-1/2  h-[11.25rem] w-[11.25rem] rounded-[50%] bg-sky-500/[0.08] shadow-[0_8px_16px_rgb(0_0_0/0.4)]"></framer_motion_1.motion.div>
          </>
        </div>

        <>
          <framer_motion_1.motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-cyan-500 translate-y-[14px] w-px h-20 group-hover/pin:h-40 blur-[2px]"/>
          <framer_motion_1.motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-cyan-500 translate-y-[14px] w-px h-20 group-hover/pin:h-40  "/>
          <framer_motion_1.motion.div className="absolute right-1/2 translate-x-[1.5px] bottom-1/2 bg-cyan-600 translate-y-[14px] w-[4px] h-[4px] rounded-full z-40 blur-[3px]"/>
          <framer_motion_1.motion.div className="absolute right-1/2 translate-x-[0.5px] bottom-1/2 bg-cyan-300 translate-y-[14px] w-[2px] h-[2px] rounded-full z-40 "/>
        </>
      </div>
    </framer_motion_1.motion.div>);
};
exports.PinPerspective = PinPerspective;
//# sourceMappingURL=3d-pin.js.map