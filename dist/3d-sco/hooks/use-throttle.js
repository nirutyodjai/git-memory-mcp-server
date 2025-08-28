"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThrottle = void 0;
const react_1 = require("react");
const useThrottle = (func, limit) => {
    const lastFunc = (0, react_1.useRef)();
    const lastRan = (0, react_1.useRef)(0);
    return (0, react_1.useCallback)((...args) => {
        if (!lastRan.current) {
            func(...args);
            lastRan.current = Date.now();
        }
        else {
            clearTimeout(lastFunc.current);
            lastFunc.current = setTimeout(() => {
                if (Date.now() - lastRan.current >= limit) {
                    func(...args);
                    lastRan.current = Date.now();
                }
            }, limit - (Date.now() - lastRan.current));
        }
    }, [func, limit]);
};
exports.useThrottle = useThrottle;
//# sourceMappingURL=use-throttle.js.map