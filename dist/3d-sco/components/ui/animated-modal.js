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
exports.useOutsideClick = exports.ModalFooter = exports.ModalContent = exports.ModalBody = exports.ModalTrigger = exports.useModal = exports.ModalProvider = void 0;
exports.Modal = Modal;
const utils_1 = require("@/lib/utils");
const framer_motion_1 = require("framer-motion");
const react_1 = __importStar(require("react"));
const scroll_area_1 = require("./scroll-area");
const ModalContext = (0, react_1.createContext)(undefined);
const ModalProvider = ({ children }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    return (<ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>);
};
exports.ModalProvider = ModalProvider;
const useModal = () => {
    const context = (0, react_1.useContext)(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
exports.useModal = useModal;
function Modal({ children }) {
    return <exports.ModalProvider>{children}</exports.ModalProvider>;
}
const ModalTrigger = ({ children, className, }) => {
    const { setOpen } = (0, exports.useModal)();
    return (<button className={(0, utils_1.cn)("px-4 py-2 rounded-md text-black dark:text-white text-center relative overflow-hidden", className)} onClick={() => setOpen(true)}>
      {children}
    </button>);
};
exports.ModalTrigger = ModalTrigger;
const ModalBody = ({ children, className, }) => {
    const { open } = (0, exports.useModal)();
    (0, react_1.useEffect)(() => {
        if (typeof window !== "undefined") {
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape")
                    setOpen(false);
            });
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        }
        else {
            document.body.style.overflow = "auto";
        }
    }, [open]);
    const modalRef = (0, react_1.useRef)(null);
    const { setOpen } = (0, exports.useModal)();
    (0, exports.useOutsideClick)(modalRef, () => setOpen(false));
    return (<framer_motion_1.AnimatePresence>
      {open && (<framer_motion_1.motion.div initial={{
                opacity: 0,
            }} animate={{
                opacity: 1,
                backdropFilter: "blur(10px)",
            }} exit={{
                opacity: 0,
                backdropFilter: "blur(0px)",
            }} className="modall fixed [perspective:800px] [transform-style:preserve-3d] inset-0 h-full w-full  flex items-center justify-center z-50">
          <Overlay />

          <framer_motion_1.motion.div ref={modalRef} className={(0, utils_1.cn)("min-h-[50%] max-h-[90%] md:max-w-[40%] bg-white dark:bg-neutral-950 border border-transparent dark:border-neutral-800 md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-hidden", className)} initial={{
                opacity: 0,
                scale: 0.5,
                rotateX: 40,
                y: 40,
            }} animate={{
                opacity: 1,
                scale: 1,
                rotateX: 0,
                y: 0,
            }} exit={{
                opacity: 0,
                scale: 0.8,
                rotateX: 10,
            }} transition={{
                type: "spring",
                stiffness: 260,
                damping: 15,
            }}>
            <CloseIcon />
            <scroll_area_1.ScrollArea className="h-[80dvh] w-full rounded-md border">
              {children}
            </scroll_area_1.ScrollArea>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
};
exports.ModalBody = ModalBody;
const ModalContent = ({ children, className, }) => {
    return (<div className={(0, utils_1.cn)("flex flex-col flex-1 p-3 md:p-10", className)}>
      {children}
    </div>);
};
exports.ModalContent = ModalContent;
const ModalFooter = ({ children, className, }) => {
    return (<div className={(0, utils_1.cn)("flex justify-end p-4 bg-gray-100 dark:bg-neutral-900", className)}>
      {children}
    </div>);
};
exports.ModalFooter = ModalFooter;
const Overlay = ({ className }) => {
    const { setOpen } = (0, exports.useModal)();
    return (<framer_motion_1.motion.div initial={{
            opacity: 0,
        }} animate={{
            opacity: 1,
            backdropFilter: "blur(10px)",
        }} exit={{
            opacity: 0,
            backdropFilter: "blur(0px)",
        }} className={`modal-overlay fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 ${className}`} onClick={() => setOpen(false)}></framer_motion_1.motion.div>);
};
const CloseIcon = () => {
    const { setOpen } = (0, exports.useModal)();
    return (<button onClick={() => setOpen(false)} className="absolute top-4 right-4 group z-[9999]">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-white h-4 w-4 group-hover:scale-125 group-hover:rotate-3 transition duration-200">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M18 6l-12 12"/>
        <path d="M6 6l12 12"/>
      </svg>
    </button>);
};
// Hook to detect clicks outside of a component.
// Add it in a separate file, I've added here for simplicity
const useOutsideClick = (ref, callback) => {
    (0, react_1.useEffect)(() => {
        const listener = (event
        //  React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
        ) => {
            // DO NOTHING if the element being clicked is the target element or their children
            if (!ref.current ||
                ref.current.contains(event.target) ||
                !event.target.classList.contains("no-click-outside")) {
                return;
            }
            callback(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, callback]);
};
exports.useOutsideClick = useOutsideClick;
//# sourceMappingURL=animated-modal.js.map