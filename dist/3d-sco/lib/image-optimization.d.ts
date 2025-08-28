import { ImageLoaderProps } from 'next/image';
export declare const CDN_CONFIG: {
    cloudinary: {
        baseUrl: string;
        cloudName: string;
    };
    imagekit: {
        baseUrl: string;
        publicKey: string;
    };
    custom: {
        baseUrl: string;
    };
};
export interface ImageOptimizationParams {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    gravity?: 'center' | 'north' | 'south' | 'east' | 'west';
}
export declare function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string;
export declare function imagekitLoader({ src, width, quality }: ImageLoaderProps): string;
export declare function customCdnLoader({ src, width, quality }: ImageLoaderProps): string;
export declare function generateResponsiveSizes(breakpoints?: number[]): string;
export declare function getSupportedFormat(): 'avif' | 'webp' | 'jpeg';
export declare function preloadImage(src: string): Promise<void>;
export declare function createLazyLoadObserver(callback: (entries: IntersectionObserverEntry[]) => void, options?: IntersectionObserverInit): IntersectionObserver | null;
export declare function compressImage(file: File, maxWidth?: number, maxHeight?: number, quality?: number): Promise<Blob>;
export declare function generateBlurPlaceholder(width?: number, height?: number): string;
export declare function extractImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
    aspectRatio: number;
}>;
//# sourceMappingURL=image-optimization.d.ts.map