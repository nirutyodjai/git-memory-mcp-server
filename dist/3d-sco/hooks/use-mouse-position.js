"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMousePosition = void 0;
const react_1 = require("react");
const useMousePosition = () => {
    const [mousePosition, setMousePosition] = (0, react_1.useState)({ x: 0, y: 0 });
    (0, react_1.useEffect)(() => {
        const handleMouseMove = (event) => {
            setMousePosition({ x: event.clientX, y: event.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);
    return mousePosition;
};
exports.useMousePosition = useMousePosition;
//# sourceMappingURL=use-mouse-position.js.map