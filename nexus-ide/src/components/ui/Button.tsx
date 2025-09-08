/**
 * Button Component for NEXUS IDE
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Supports icons, loading states, and accessibility features.
 */

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98] active:transition-transform active:duration-75',
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Primary button - main actions
        primary: [
          'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
          'focus-visible:ring-blue-500',
          'dark:bg-blue-500 dark:hover:bg-blue-600',
        ],
        // Secondary button - secondary actions
        secondary: [
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
          'focus-visible:ring-gray-500',
          'dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
        ],
        // Destructive button - dangerous actions
        destructive: [
          'bg-red-600 text-white shadow-sm hover:bg-red-700',
          'focus-visible:ring-red-500',
          'dark:bg-red-500 dark:hover:bg-red-600',
        ],
        // Outline button - subtle actions
        outline: [
          'border border-gray-300 bg-transparent text-gray-700 shadow-sm hover:bg-gray-50',
          'focus-visible:ring-gray-500',
          'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
        ],
        // Ghost button - minimal actions
        ghost: [
          'bg-transparent text-gray-700 hover:bg-gray-100',
          'focus-visible:ring-gray-500',
          'dark:text-gray-300 dark:hover:bg-gray-800',
        ],
        // Link button - text-like actions
        link: [
          'bg-transparent text-blue-600 underline-offset-4 hover:underline',
          'focus-visible:ring-blue-500',
          'dark:text-blue-400',
        ],
        // Success button - positive actions
        success: [
          'bg-green-600 text-white shadow-sm hover:bg-green-700',
          'focus-visible:ring-green-500',
          'dark:bg-green-500 dark:hover:bg-green-600',
        ],
        // Warning button - cautionary actions
        warning: [
          'bg-yellow-600 text-white shadow-sm hover:bg-yellow-700',
          'focus-visible:ring-yellow-500',
          'dark:bg-yellow-500 dark:hover:bg-yellow-600',
        ],
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
        icon: 'h-9 w-9 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

// Button props interface
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Button content */
  children?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: ReactNode;
  /** Icon to display after text */
  rightIcon?: ReactNode;
  /** Tooltip text */
  tooltip?: string;
  /** Custom class name */
  className?: string;
  /** Full width button */
  fullWidth?: boolean;
}

// Loading spinner component
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );
};

// Button component
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      loading = false,
      leftIcon,
      rightIcon,
      tooltip,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const spinnerSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md';

    const buttonContent = (
      <>
        {loading && <LoadingSpinner size={spinnerSize} />}
        {!loading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children && (
          <span className={cn(loading && 'opacity-0')}>
            {children}
          </span>
        )}
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );

    const button = (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={loading ? 'Loading...' : props['aria-label']}
        {...props}
      >
        {buttonContent}
      </button>
    );

    // Wrap with tooltip if provided
    if (tooltip) {
      return (
        <div className="group relative inline-block">
          {button}
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
            <div className="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
            </div>
          </div>
        </div>
      );
    }

    return button;
  }
);

Button.displayName = 'Button';

// Button group component for related actions
export interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const ButtonGroup = ({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'sm',
}: ButtonGroupProps) => {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  const orientationClasses = {
    horizontal: 'flex flex-row items-center',
    vertical: 'flex flex-col items-stretch',
  };

  return (
    <div
      className={cn(
        orientationClasses[orientation],
        spacingClasses[spacing],
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';

// Icon button component for icon-only buttons
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'icon', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn('flex-shrink-0', className)}
        {...props}
      >
        <span className="flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Export button variants for external use
export { buttonVariants };

// Export types
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;