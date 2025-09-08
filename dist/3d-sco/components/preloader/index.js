"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePreloader = exports.preloaderContext = void 0;
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const loader_1 = __importDefault(require("./loader"));
const gsap_1 = __importDefault(require("gsap"));
const INITIAL = {
    isLoading: true,
    loadingPercent: 0,
    bypassLoading: () => { },
};
exports.preloaderContext = (0, react_1.createContext)(INITIAL);
const usePreloader = () => {
    const context = (0, react_1.useContext)(exports.preloaderContext);
    if (!context) {
        throw new Error("usePreloader must be used within a PreloaderProvider");
    }
    return context;
};
exports.usePreloader = usePreloader;
const LOADING_TIME = 2.5;
function Preloader({ children, disabled = false }) {
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [loadingPercent, setLoadingPercent] = (0, react_1.useState)(0);
    const loadingTween = (0, react_1.useRef)();
    const bypassLoading = () => {
        loadingTween.current?.progress(0.99).kill();
        setLoadingPercent(100);
        setIsLoading(false);
        // console.log("killed", loadingTween.current);
    };
    const loadingPercentRef = (0, react_1.useRef)({ value: 0 });
    (0, react_1.useEffect)(() => {
        loadingTween.current = gsap_1.default.to(loadingPercentRef.current, {
            value: 100,
            duration: LOADING_TIME,
            ease: "slow(0.7,0.7,false)",
            onUpdate: () => {
                setLoadingPercent(loadingPercentRef.current.value);
            },
            onComplete: () => {
                setIsLoading(false);
                // observe: this change has not been observed for errors.
                // window.scrollTo(0, 0);
            },
        });
    }, []);
    return (React.createElement(exports.preloaderContext.Provider, { value: { isLoading, bypassLoading, loadingPercent } },
        React.createElement(framer_motion_1.AnimatePresence, { mode: "wait" }, isLoading && React.createElement(loader_1.default, null)),
        children));
}
exports.default = Preloader;
