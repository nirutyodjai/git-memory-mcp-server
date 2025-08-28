"use strict";
'use client';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedImage = OptimizedImage;
exports.ProgressiveImage = ProgressiveImage;
exports.GalleryImage = GalleryImage;
const react_1 = __importStar(require("react"));
const image_1 = __importDefault(require("next/image"));
const utils_1 = require("@/lib/utils");
const image_optimization_1 = require("@/lib/image-optimization");
function OptimizedImage({ src, alt, fallbackSrc, enableLazyLoading = true, enablePreload = false, showLoadingSpinner = true, errorFallback, onLoadStart, onLoadComplete, onError, aspectRatio, containerClassName, className, ...props }) {
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [hasError, setHasError] = (0, react_1.useState)(false);
    const [currentSrc, setCurrentSrc] = (0, react_1.useState)(src);
    const [isInView, setIsInView] = (0, react_1.useState)(!enableLazyLoading);
    const imgRef = (0, react_1.useRef)(null);
    const observerRef = (0, react_1.useRef)(null);
    // Lazy loading setup
    (0, react_1.useEffect)(() => {
        if (!enableLazyLoading || isInView)
            return;
        observerRef.current = (0, image_optimization_1.createLazyLoadObserver)((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observerRef.current?.disconnect();
                }
            });
        });
        if (imgRef.current && observerRef.current) {
            observerRef.current.observe(imgRef.current);
        }
        return () => {
            observerRef.current?.disconnect();
        };
    }, [enableLazyLoading, isInView]);
    // Preload image
    (0, react_1.useEffect)(() => {
        if (enablePreload && src) {
            (0, image_optimization_1.preloadImage)(src).catch(() => {
                // Preload failed, but we'll still try to load normally
            });
        }
    }, [src, enablePreload]);
    // Handle image load start
    const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
        onLoadStart?.();
    };
    // Handle image load complete
    const handleLoadComplete = () => {
        setIsLoading(false);
        onLoadComplete?.();
    };
    // Handle image error
    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setHasError(false);
            setIsLoading(true);
        }
        else {
            onError?.(new Error(`Failed to load image: ${currentSrc}`));
        }
    };
    // Generate responsive sizes
    const responsiveSizes = (0, image_optimization_1.generateResponsiveSizes)();
    // Container styles with aspect ratio
    const containerStyle = aspectRatio
        ? { aspectRatio: aspectRatio.toString() }
        : {};
    if (!isInView) {
        return (<div ref={imgRef} className={(0, utils_1.cn)('bg-gray-200 animate-pulse flex items-center justify-center', containerClassName)} style={containerStyle}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>);
    }
    if (hasError && errorFallback) {
        return (<div className={(0, utils_1.cn)('flex items-center justify-center', containerClassName)} style={containerStyle}>
        {errorFallback}
      </div>);
    }
    return (<div ref={imgRef} className={(0, utils_1.cn)('relative overflow-hidden', containerClassName)} style={containerStyle}>
      {isLoading && showLoadingSpinner && (<div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>)}
      
      <image_1.default src={currentSrc} alt={alt} className={(0, utils_1.cn)('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100', className)} sizes={responsiveSizes} onLoadingComplete={handleLoadComplete} onLoad={handleLoadStart} onError={handleError} {...props}/>
    </div>);
}
// Progressive image component with blur placeholder
function ProgressiveImage({ src, alt, blurDataURL, ...props }) {
    const [placeholder, setPlaceholder] = (0, react_1.useState)();
    (0, react_1.useEffect)(() => {
        if (!blurDataURL && typeof window !== 'undefined') {
            setPlaceholder((0, image_optimization_1.generateBlurPlaceholder)());
        }
    }, [blurDataURL]);
    return (<OptimizedImage src={src} alt={alt} placeholder="blur" blurDataURL={blurDataURL || placeholder} {...props}/>);
}
// Gallery optimized image component
function GalleryImage({ src, alt, thumbnail, onClick, ...props }) {
    const [showFullSize, setShowFullSize] = (0, react_1.useState)(false);
    const handleClick = () => {
        setShowFullSize(true);
        onClick?.();
    };
    return (<>
      <OptimizedImage src={thumbnail || src} alt={alt} className={(0, utils_1.cn)('cursor-pointer hover:opacity-90 transition-opacity', props.className)} onClick={handleClick} {...props}/>
      
      {showFullSize && (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowFullSize(false)}>
          <div className="max-w-4xl max-h-4xl p-4">
            <OptimizedImage src={src} alt={alt} fill className="object-contain" enablePreload/>
          </div>
        </div>)}
    </>);
}
exports.default = OptimizedImage;
//# sourceMappingURL=optimized-image.js.map