"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMouse = void 0;
const react_1 = require("react");
const useMouse = ({ allowPage, allowAngle, allowAcc, } = {}) => {
    const [x, setX] = (0, react_1.useState)(0);
    const [y, setY] = (0, react_1.useState)(0);
    const [angle, setAngle] = (0, react_1.useState)(0);
    const [acceleration, setAcceleration] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const handleMouseMove = (e) => {
            setX(allowPage ? e.pageX : e.clientX);
            setY(allowPage ? e.pageY : e.clientY);
            if (allowAcc) {
                const acc = Math.abs(e.movementX) + Math.abs(e.movementY);
                setAcceleration(acc);
            }
            if (allowAngle) {
                setAngle(Math.atan2(e.movementY, e.movementX));
            }
        };
        if (typeof window !== "undefined")
            window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    });
    return { x, y, angle, acceleration };
};
exports.useMouse = useMouse;
//# sourceMappingURL=use-mouse.js.map