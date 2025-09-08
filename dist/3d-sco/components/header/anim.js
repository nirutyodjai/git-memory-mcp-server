"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate = exports.blur = exports.background = exports.height = exports.opacity = void 0;
const transition = { duration: 1, ease: [0.76, 0, 0.24, 1] };
exports.opacity = {
    initial: {
        opacity: 0
    },
    open: {
        opacity: 1,
        transition: { duration: 0.35 }
    },
    closed: {
        opacity: 0,
        transition: { duration: 0.35 }
    }
};
exports.height = {
    initial: {
        height: 0
    },
    enter: {
        height: 'auto',
        transition
    },
    exit: {
        height: 0,
        transition
    }
};
exports.background = {
    initial: {
        height: 0
    },
    open: {
        height: '100dvh',
        transition
    },
    closed: {
        height: 0,
        transition
    }
};
exports.blur = {
    initial: {
        filter: 'blur(0px)',
        opacity: 1
    },
    open: {
        filter: 'blur(4px)',
        opacity: 0.6,
        transition: { duration: 0.3 }
    },
    closed: {
        filter: 'blur(0px)',
        opacity: 1,
        transition: { duration: 0.3 }
    }
};
exports.translate = {
    initial: {
        y: '100%',
        opacity: 0
    },
    enter: (i) => ({
        y: 0,
        opacity: 1,
        transition: { duration: 1, ease: [0.76, 0, 0.24, 1], delay: i[0] }
    }),
    exit: (i) => ({
        y: '100%',
        opacity: 0,
        transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: i[1] }
    })
};
