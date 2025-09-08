"use client";
import React, { Suspense, useState, useEffect } from "react";
import { Application } from "@splinetool/runtime";
const Spline = React.lazy(() => import("@splinetool/react-spline"));

interface SplineWrapperProps {
  scene: string;
  onLoad?: (app: Application) => void;
  onError?: (error: any) => void;
  style?: React.CSSProperties;
  className?: string;
  fallback?: React.ReactNode;
}

const SplineWrapper = React.forwardRef<any, SplineWrapperProps>((
  {
    scene,
    onLoad,
    onError,
    style,
    className,
    fallback
  },
  ref
) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = (app: Application) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(app);
  };

  const handleError = (error: any) => {
    console.error('Spline loading error:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  // Check if the scene file exists
  useEffect(() => {
    const checkSceneFile = async () => {
      try {
        const response = await fetch(scene, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Scene file not found: ${scene}`);
        }
      } catch (error) {
        console.error('Scene file check failed:', error);
        handleError(error);
      }
    };

    checkSceneFile();
  }, [scene]);

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className || ''}`}
        style={style}
      >
        {fallback || (
          <div className="text-center p-8">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              3D model unavailable
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div 
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${className || ''}`}
        style={style}
      >
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading 3D model...</p>
        </div>
      </div>
    }>
      <Spline
        ref={ref}
        scene={scene}
        onLoad={handleLoad}
        onError={handleError}
        style={style}
        className={className}
      />
    </Suspense>
  );
});

SplineWrapper.displayName = 'SplineWrapper';

export default SplineWrapper;