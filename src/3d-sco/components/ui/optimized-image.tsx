'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import {
  generateResponsiveSizes,
  getSupportedFormat,
  preloadImage,
  createLazyLoadObserver,
  generateBlurPlaceholder
} from '@/lib/image-optimization'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string
  alt: string
  fallbackSrc?: string
  enableLazyLoading?: boolean
  enablePreload?: boolean
  showLoadingSpinner?: boolean
  errorFallback?: React.ReactNode
  onLoadStart?: () => void
  onLoadComplete?: () => void
  onError?: (error: Error) => void
  aspectRatio?: number
  containerClassName?: string
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  enableLazyLoading = true,
  enablePreload = false,
  showLoadingSpinner = true,
  errorFallback,
  onLoadStart,
  onLoadComplete,
  onError,
  aspectRatio,
  containerClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isInView, setIsInView] = useState(!enableLazyLoading)
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Lazy loading setup
  useEffect(() => {
    if (!enableLazyLoading || isInView) return

    observerRef.current = createLazyLoadObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      }
    )

    if (imgRef.current && observerRef.current) {
      observerRef.current.observe(imgRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [enableLazyLoading, isInView])

  // Preload image
  useEffect(() => {
    if (enablePreload && src) {
      preloadImage(src).catch(() => {
        // Preload failed, but we'll still try to load normally
      })
    }
  }, [src, enablePreload])

  // Handle image load start
  const handleLoadStart = () => {
    setIsLoading(true)
    setHasError(false)
    onLoadStart?.()
  }

  // Handle image load complete
  const handleLoadComplete = () => {
    setIsLoading(false)
    onLoadComplete?.()
  }

  // Handle image error
  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
    } else {
      onError?.(new Error(`Failed to load image: ${currentSrc}`))
    }
  }

  // Generate responsive sizes
  const responsiveSizes = generateResponsiveSizes()

  // Container styles with aspect ratio
  const containerStyle = aspectRatio
    ? { aspectRatio: aspectRatio.toString() }
    : {}

  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'bg-gray-200 animate-pulse flex items-center justify-center',
          containerClassName
        )}
        style={containerStyle}
      >
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (hasError && errorFallback) {
    return (
      <div
        className={cn('flex items-center justify-center', containerClassName)}
        style={containerStyle}
      >
        {errorFallback}
      </div>
    )
  }

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={containerStyle}
    >
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <Image
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        sizes={responsiveSizes}
        onLoadingComplete={handleLoadComplete}
        onLoad={handleLoadStart}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

// Progressive image component with blur placeholder
export function ProgressiveImage({
  src,
  alt,
  blurDataURL,
  ...props
}: OptimizedImageProps & { blurDataURL?: string }) {
  const [placeholder, setPlaceholder] = useState<string>()

  useEffect(() => {
    if (!blurDataURL && typeof window !== 'undefined') {
      setPlaceholder(generateBlurPlaceholder())
    }
  }, [blurDataURL])

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL={blurDataURL || placeholder}
      {...props}
    />
  )
}

// Gallery optimized image component
export function GalleryImage({
  src,
  alt,
  thumbnail,
  onClick,
  ...props
}: OptimizedImageProps & {
  thumbnail?: string
  onClick?: () => void
}) {
  const [showFullSize, setShowFullSize] = useState(false)

  const handleClick = () => {
    setShowFullSize(true)
    onClick?.()
  }

  return (
    <>
      <OptimizedImage
        src={thumbnail || src}
        alt={alt}
        className={cn(
          'cursor-pointer hover:opacity-90 transition-opacity',
          props.className
        )}
        onClick={handleClick}
        {...props}
      />
      
      {showFullSize && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowFullSize(false)}
        >
          <div className="max-w-4xl max-h-4xl p-4">
            <OptimizedImage
              src={src}
              alt={alt}
              fill
              className="object-contain"
              enablePreload
            />
          </div>
        </div>
      )}
    </>
  )
}

export default OptimizedImage