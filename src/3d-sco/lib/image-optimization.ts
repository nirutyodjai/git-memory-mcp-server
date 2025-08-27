import { ImageLoaderProps } from 'next/image'

// CDN Configuration
export const CDN_CONFIG = {
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
}

// Image optimization parameters
export interface ImageOptimizationParams {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  blur?: number
  brightness?: number
  contrast?: number
  saturation?: number
  crop?: 'fill' | 'fit' | 'scale' | 'crop'
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west'
}

// Cloudinary image loader
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!CDN_CONFIG.cloudinary.baseUrl) {
    return src
  }

  const params = [`w_${width}`, `q_${quality || 75}`, 'f_auto']
  return `${CDN_CONFIG.cloudinary.baseUrl}/image/fetch/${params.join(',')}/${encodeURIComponent(src)}`
}

// ImageKit loader
export function imagekitLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!CDN_CONFIG.imagekit.baseUrl) {
    return src
  }

  const params = new URLSearchParams({
    'tr': `w-${width},q-${quality || 75}`,
    'src': src
  })

  return `${CDN_CONFIG.imagekit.baseUrl}?${params.toString()}`
}

// Custom CDN loader
export function customCdnLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!CDN_CONFIG.custom.baseUrl) {
    return src
  }

  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || 75).toString(),
    url: src
  })

  return `${CDN_CONFIG.custom.baseUrl}/optimize?${params.toString()}`
}

// Generate responsive image sizes
export function generateResponsiveSizes(breakpoints: number[] = [640, 768, 1024, 1280, 1536]): string {
  return breakpoints
    .map((bp, index) => {
      if (index === breakpoints.length - 1) {
        return `${bp}px`
      }
      return `(max-width: ${bp}px) ${Math.round(bp * 0.9)}px`
    })
    .join(', ')
}

// Image format detection
export function getSupportedFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'jpeg'

  // Check for AVIF support
  const avifCanvas = document.createElement('canvas')
  avifCanvas.width = 1
  avifCanvas.height = 1
  if (avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif'
  }

  // Check for WebP support
  const webpCanvas = document.createElement('canvas')
  webpCanvas.width = 1
  webpCanvas.height = 1
  if (webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp'
  }

  return 'jpeg'
}

// Image preloader
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Lazy loading intersection observer
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
}

// Image compression utility
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Generate blur placeholder
export function generateBlurPlaceholder(width: number = 8, height: number = 8): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.width = width
  canvas.height = height
  
  if (ctx) {
    // Create a simple gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

// Image metadata extractor
export function extractImageMetadata(file: File): Promise<{
  width: number
  height: number
  size: number
  type: string
  aspectRatio: number
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        aspectRatio: img.naturalWidth / img.naturalHeight
      })
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}