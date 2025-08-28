"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDevToolsOpen = void 0;
const react_1 = require("react");
const devtools_detector_1 = require("devtools-detector");
const useDevToolsOpen = () => {
    const [isDevToolsOpen, setIsDevToolsOpen] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        (0, devtools_detector_1.addListener)((isOpen) => {
            if (isOpen) {
                setIsDevToolsOpen(true);
                (0, devtools_detector_1.stop)();
            }
        });
        (0, devtools_detector_1.launch)();
        return () => {
            (0, devtools_detector_1.stop)();
        };
    }, []);
    return { isDevToolsOpen };
};
exports.useDevToolsOpen = useDevToolsOpen;
//# sourceMappingURL=use-devtools-open.js.map