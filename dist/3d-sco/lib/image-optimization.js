"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN_CONFIG = void 0;
exports.cloudinaryLoader = cloudinaryLoader;
exports.imagekitLoader = imagekitLoader;
exports.customCdnLoader = customCdnLoader;
exports.generateResponsiveSizes = generateResponsiveSizes;
exports.getSupportedFormat = getSupportedFormat;
exports.preloadImage = preloadImage;
exports.createLazyLoadObserver = createLazyLoadObserver;
exports.compressImage = compressImage;
exports.generateBlurPlaceholder = generateBlurPlaceholder;
exports.extractImageMetadata = extractImageMetadata;
// CDN Configuration
exports.CDN_CONFIG = {
    cloudinary: {
        baseUrl: process.env.NEXT_PUBLIC_CLOUDINARY_URL || '',
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    },
    imagekit: {
        baseUrl: process.env.NEXT_PUBLIC_IMAGEKIT_URL || '',
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    },
    custom: {
        baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
    }
};
// Cloudinary image loader
function cloudinaryLoader({ src, width, quality }) {
    if (!exports.CDN_CONFIG.cloudinary.baseUrl) {
        return src;
    }
    const params = [`w_${width}`, `q_${quality || 75}`, 'f_auto'];
    return `${exports.CDN_CONFIG.cloudinary.baseUrl}/image/fetch/${params.join(',')}/${encodeURIComponent(src)}`;
}
// ImageKit loader
function imagekitLoader({ src, width, quality }) {
    if (!exports.CDN_CONFIG.imagekit.baseUrl) {
        return src;
    }
    const params = new URLSearchParams({
        'tr': `w-${width},q-${quality || 75}`,
        'src': src
    });
    return `${exports.CDN_CONFIG.imagekit.baseUrl}?${params.toString()}`;
}
// Custom CDN loader
function customCdnLoader({ src, width, quality }) {
    if (!exports.CDN_CONFIG.custom.baseUrl) {
        return src;
    }
    const params = new URLSearchParams({
        w: width.toString(),
        q: (quality || 75).toString(),
        url: src
    });
    return `${exports.CDN_CONFIG.custom.baseUrl}/optimize?${params.toString()}`;
}
// Generate responsive image sizes
function generateResponsiveSizes(breakpoints = [640, 768, 1024, 1280, 1536]) {
    return breakpoints
        .map((bp, index) => {
        if (index === breakpoints.length - 1) {
            return `${bp}px`;
        }
        return `(max-width: ${bp}px) ${Math.round(bp * 0.9)}px`;
    })
        .join(', ');
}
// Image format detection
function getSupportedFormat() {
    if (typeof window === 'undefined')
        return 'jpeg';
    // Check for AVIF support
    const avifCanvas = document.createElement('canvas');
    avifCanvas.width = 1;
    avifCanvas.height = 1;
    if (avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
        return 'avif';
    }
    // Check for WebP support
    const webpCanvas = document.createElement('canvas');
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    if (webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
        return 'webp';
    }
    return 'jpeg';
}
// Image preloader
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
}
// Lazy loading intersection observer
function createLazyLoadObserver(callback, options = {}) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return null;
    }
    return new IntersectionObserver(callback, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
    });
}
// Image compression utility
function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            }
            else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}
// Generate blur placeholder
function generateBlurPlaceholder(width = 8, height = 8) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    if (ctx) {
        // Create a simple gradient placeholder
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f3f4f6');
        gradient.addColorStop(1, '#e5e7eb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL('image/jpeg', 0.1);
}
// Image metadata extractor
function extractImageMetadata(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                size: file.size,
                type: file.type,
                aspectRatio: img.naturalWidth / img.naturalHeight
            });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}
