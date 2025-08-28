import React from 'react';
import { ImageProps } from 'next/image';
interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
    src: string;
    alt: string;
    fallbackSrc?: string;
    enableLazyLoading?: boolean;
    enablePreload?: boolean;
    showLoadingSpinner?: boolean;
    errorFallback?: React.ReactNode;
    onLoadStart?: () => void;
    onLoadComplete?: () => void;
    onError?: (error: Error) => void;
    aspectRatio?: number;
    containerClassName?: string;
}
export declare function OptimizedImage({ src, alt, fallbackSrc, enableLazyLoading, enablePreload, showLoadingSpinner, errorFallback, onLoadStart, onLoadComplete, onError, aspectRatio, containerClassName, className, ...props }: OptimizedImageProps): any;
export declare function ProgressiveImage({ src, alt, blurDataURL, ...props }: OptimizedImageProps & {
    blurDataURL?: string;
}): any;
export declare function GalleryImage({ src, alt, thumbnail, onClick, ...props }: OptimizedImageProps & {
    thumbnail?: string;
    onClick?: () => void;
}): any;
export default OptimizedImage;
//# sourceMappingURL=optimized-image.d.ts.map