/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component for the NEXUS IDE.
 * Provides various sizes and styles for different loading states.
 * 
 * Features:
 * - Multiple sizes (small, medium, large)
 * - Customizable colors and styles
 * - Accessible with proper ARIA labels
 * - Smooth animations
 * - Optional text labels
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeClasses = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-gray-600 dark:text-gray-400',
  accent: 'text-purple-600 dark:text-purple-400',
  muted: 'text-gray-400 dark:text-gray-600'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className,
  color = 'primary',
  text,
  fullScreen = false,
  overlay = false
}) => {
  const spinnerElement = (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <svg
          className={cn(
            'animate-spin',
            sizeClasses[size],
            colorClasses[color]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="status"
          aria-label={text || 'Loading'}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && (
          <span className={cn(
            'text-sm font-medium',
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        overlay ? 'bg-background/80 backdrop-blur-sm' : 'bg-background'
      )}>
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

// Alternative dot-based spinner
export const DotSpinner: React.FC<Omit<LoadingSpinnerProps, 'size'>> = ({
  className,
  color = 'primary',
  text
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                colorClasses[color]
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {text && (
          <span className={cn(
            'text-sm font-medium',
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

// Pulse spinner for skeleton loading
export const PulseSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className,
  color = 'muted'
}) => {
  return (
    <div className={cn(
      'animate-pulse rounded-md bg-current opacity-20',
      sizeClasses[size],
      colorClasses[color],
      className
    )} />
  );
};

// Progress spinner with percentage
export interface ProgressSpinnerProps extends Omit<LoadingSpinnerProps, 'text'> {
  progress: number; // 0-100
  showPercentage?: boolean;
}

export const ProgressSpinner: React.FC<ProgressSpinnerProps> = ({
  size = 'medium',
  className,
  color = 'primary',
  progress,
  showPercentage = true
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative">
        <svg
          className={cn(sizeClasses[size], colorClasses[color])}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'text-xs font-medium',
              colorClasses[color]
            )}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;