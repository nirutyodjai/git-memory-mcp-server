"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOutsideClick = void 0;
const react_1 = require("react");
const useOutsideClick = (ref, callback) => {
    (0, react_1.useEffect)(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
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
