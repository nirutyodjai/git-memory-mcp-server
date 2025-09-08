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
const react_1 = __importStar(require("react"));
const Spline = react_1.default.lazy(() => Promise.resolve().then(() => __importStar(require("@splinetool/react-spline"))));
const SplineWrapper = react_1.default.forwardRef(({ scene, onLoad, onError, style, className, fallback }, ref) => {
    const [hasError, setHasError] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const handleLoad = (app) => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.(app);
    };
    const handleError = (error) => {
        console.error('Spline loading error:', error);
        setIsLoading(false);
        setHasError(true);
        onError?.(error);
    };
    // Check if the scene file exists
    (0, react_1.useEffect)(() => {
        const checkSceneFile = async () => {
            try {
                const response = await fetch(scene, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`Scene file not found: ${scene}`);
                }
            }
            catch (error) {
                console.error('Scene file check failed:', error);
                handleError(error);
            }
        };
        checkSceneFile();
    }, [scene]);
    if (hasError) {
        return (react_1.default.createElement("div", { className: `flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className || ''}`, style: style }, fallback || (react_1.default.createElement("div", { className: "text-center p-8" },
            react_1.default.createElement("div", { className: "text-gray-500 dark:text-gray-400 mb-2" },
                react_1.default.createElement("svg", { className: "w-16 h-16 mx-auto mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }))),
            react_1.default.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300" }, "3D model unavailable")))));
    }
    return (react_1.default.createElement(react_1.Suspense, { fallback: react_1.default.createElement("div", { className: `flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${className || ''}`, style: style },
            react_1.default.createElement("div", { className: "text-center p-8" },
                react_1.default.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" }),
                react_1.default.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300" }, "Loading 3D model..."))) },
        react_1.default.createElement(Spline, { ref: ref, scene: scene, onLoad: handleLoad, onError: handleError, style: style, className: className })));
});
SplineWrapper.displayName = 'SplineWrapper';
exports.default = SplineWrapper;
