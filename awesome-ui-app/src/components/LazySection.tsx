import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  animationDelay?: number;
}

const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  animationDelay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const currentRef = sectionRef.current;
    
    if (currentRef) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            observerRef.current?.disconnect();
          }
        },
        {
          threshold,
          rootMargin
        }
      );
      
      observerRef.current.observe(currentRef);
    }
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, hasLoaded]);

  const defaultFallback = (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-600 dark:text-gray-400 text-sm"
        >
          Loading content...
        </motion.div>
      </div>
    </div>
  );

  return (
    <div ref={sectionRef} className={className}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: animationDelay,
            ease: 'easeOut'
          }}
        >
          <Suspense fallback={fallback || defaultFallback}>
            {children}
          </Suspense>
        </motion.div>
      ) : (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

// Higher-order component for lazy loading components
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <LazySection fallback={fallback}>
      <Component {...props} ref={ref} />
    </LazySection>
  ));
};

// Hook for lazy loading with intersection observer
export const useLazyLoad = (options?: {
  threshold?: number;
  rootMargin?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const currentRef = elementRef.current;
    
    if (currentRef) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            observer.disconnect();
          }
        },
        {
          threshold: options?.threshold || 0.1,
          rootMargin: options?.rootMargin || '100px'
        }
      );
      
      observer.observe(currentRef);
      
      return () => observer.disconnect();
    }
  }, [hasLoaded, options?.threshold, options?.rootMargin]);

  return { elementRef, isVisible, hasLoaded };
};

export default LazySection;