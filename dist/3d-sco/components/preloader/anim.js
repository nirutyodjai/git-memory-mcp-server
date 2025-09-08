"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slideUp = exports.opacity = void 0;
exports.opacity = {
    initial: {
        opacity: 0
    },
    enter: {
        opacity: 0.75,
        transition: { duration: 1, delay: 0.2 }
    }
};
exports.slideUp = {
    initial: {
        top: 0
    },
    exit: {
        top: '-100dvh',
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }
    }
};
