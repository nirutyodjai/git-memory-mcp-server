"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useViewport = void 0;
const react_1 = require("react");
const useViewport = () => {
    const [width, setWidth] = (0, react_1.useState)(0);
    const [height, setHeight] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        };
        if (typeof window !== "undefined")
            window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    });
    return { width, height };
};
exports.useViewport = useViewport;
