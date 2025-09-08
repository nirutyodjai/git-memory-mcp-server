/**
 * Input Component for NEXUS IDE
 * 
 * A versatile input component with multiple variants, sizes, and states.
 * Supports icons, validation, and accessibility features.
 */

import React, { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Input variants using class-variance-authority
const inputVariants = cva(
  // Base styles
  [
    'flex w-full rounded-md border bg-transparent px-3 py-2 text-sm',
    'transition-all duration-200 ease-in-out',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'read-only:cursor-default read-only:focus-visible:ring-0',
  ],
  {
    variants: {
      variant: {
        // Default input
        default: [
          'border-gray-300 bg-white text-gray-900',
          'focus-visible:border-blue-500 focus-visible:ring-blue-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
          'dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400',
        ],
        // Success state
        success: [
          'border-green-500 bg-green-50 text-green-900',
          'focus-visible:border-green-600 focus-visible:ring-green-500',
          'dark:border-green-400 dark:bg-green-900/20 dark:text-green-100',
          'dark:focus-visible:border-green-300 dark:focus-visible:ring-green-400',
        ],
        // Error state
        error: [
          'border-red-500 bg-red-50 text-red-900',
          'focus-visible:border-red-600 focus-visible:ring-red-500',
          'dark:border-red-400 dark:bg-red-900/20 dark:text-red-100',
          'dark:focus-visible:border-red-300 dark:focus-visible:ring-red-400',
        ],
        // Warning state
        warning: [
          'border-yellow-500 bg-yellow-50 text-yellow-900',
          'focus-visible:border-yellow-600 focus-visible:ring-yellow-500',
          'dark:border-yellow-400 dark:bg-yellow-900/20 dark:text-yellow-100',
          'dark:focus-visible:border-yellow-300 dark:focus-visible:ring-yellow-400',
        ],
        // Ghost variant
        ghost: [
          'border-transparent bg-transparent',
          'focus-visible:border-gray-300 focus-visible:ring-gray-500',
          'dark:focus-visible:border-gray-600 dark:focus-visible:ring-gray-400',
        ],
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
        xl: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Input props interface
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label for the input */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Warning message */
  warning?: string;
  /** Icon to display before input */
  leftIcon?: ReactNode;
  /** Icon to display after input */
  rightIcon?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Custom class name */
  className?: string;
  /** Container class name */
  containerClassName?: string;
  /** Label class name */
  labelClassName?: string;
  /** Helper text class name */
  helperClassName?: string;
  /** Show character count */
  showCount?: boolean;
  /** Maximum character count */
  maxCount?: number;
  /** Clear button */
  clearable?: boolean;
  /** Password toggle */
  passwordToggle?: boolean;
}

// Loading spinner component
const LoadingSpinner = () => (
  <svg
    className="h-4 w-4 animate-spin text-gray-400"
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

// Eye icon for password toggle
const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    {open ? (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </>
    ) : (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
        />
      </>
    )}
  </svg>
);

// Clear icon
const ClearIcon = () => (
  <svg
    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// Input component
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      variant,
      size,
      label,
      helperText,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      loading = false,
      showCount = false,
      maxCount,
      clearable = false,
      passwordToggle = false,
      type = 'text',
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || '');
    
    // Determine the actual variant based on state
    const actualVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // Determine the actual type
    const actualType = passwordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password') 
      : type;
    
    // Handle value changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
    };
    
    // Handle clear
    const handleClear = () => {
      const event = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      setInternalValue('');
      onChange?.(event);
    };
    
    // Handle password toggle
    const handlePasswordToggle = () => {
      setShowPassword(!showPassword);
    };
    
    // Get current value for character count
    const currentValue = value !== undefined ? String(value) : String(internalValue);
    const characterCount = currentValue.length;
    
    // Status message
    const statusMessage = error || success || warning;
    const statusColor = error 
      ? 'text-red-600 dark:text-red-400' 
      : success 
      ? 'text-green-600 dark:text-green-400'
      : warning
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-gray-600 dark:text-gray-400';
    
    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              labelClassName
            )}
            htmlFor={props.id}
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-400" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}
          
          {/* Input */}
          <input
            type={actualType}
            className={cn(
              inputVariants({ variant: actualVariant, size }),
              leftIcon && 'pl-10',
              (rightIcon || loading || clearable || passwordToggle) && 'pr-10',
              className
            )}
            ref={ref}
            value={value !== undefined ? value : internalValue}
            onChange={handleChange}
            maxLength={maxCount}
            aria-invalid={!!error}
            aria-describedby={cn(
              statusMessage && `${props.id}-status`,
              helperText && `${props.id}-helper`,
              showCount && `${props.id}-count`
            )}
            {...props}
          />
          
          {/* Right icons */}
          {(rightIcon || loading || clearable || passwordToggle) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
              {/* Loading spinner */}
              {loading && <LoadingSpinner />}
              
              {/* Clear button */}
              {clearable && !loading && currentValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 transition-colors"
                  aria-label="Clear input"
                >
                  <ClearIcon />
                </button>
              )}
              
              {/* Password toggle */}
              {passwordToggle && type === 'password' && !loading && (
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              )}
              
              {/* Right icon */}
              {rightIcon && !loading && (
                <span className="text-gray-400" aria-hidden="true">
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Helper text and character count */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Status message */}
            {statusMessage && (
              <p
                id={`${props.id}-status`}
                className={cn('text-xs', statusColor)}
                role={error ? 'alert' : 'status'}
              >
                {statusMessage}
              </p>
            )}
            
            {/* Helper text */}
            {helperText && !statusMessage && (
              <p
                id={`${props.id}-helper`}
                className={cn(
                  'text-xs text-gray-600 dark:text-gray-400',
                  helperClassName
                )}
              >
                {helperText}
              </p>
            )}
          </div>
          
          {/* Character count */}
          {showCount && maxCount && (
            <p
              id={`${props.id}-count`}
              className={cn(
                'text-xs ml-2 flex-shrink-0',
                characterCount > maxCount
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
              aria-live="polite"
            >
              {characterCount}/{maxCount}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<InputProps, 'type' | 'leftIcon' | 'rightIcon' | 'passwordToggle'> {
  /** Auto-resize textarea */
  autoResize?: boolean;
  /** Minimum rows */
  minRows?: number;
  /** Maximum rows */
  maxRows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      variant,
      size,
      label,
      helperText,
      error,
      success,
      warning,
      loading = false,
      showCount = false,
      maxCount,
      clearable = false,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      value,
      onChange,
      rows = minRows,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);
    
    // Determine the actual variant based on state
    const actualVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // Handle value changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
      
      // Auto-resize
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * maxRows;
        const minHeight = lineHeight * minRows;
        
        textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
      }
    };
    
    // Handle clear
    const handleClear = () => {
      const event = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      setInternalValue('');
      onChange?.(event);
      
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    };
    
    // Get current value for character count
    const currentValue = value !== undefined ? String(value) : String(internalValue);
    const characterCount = currentValue.length;
    
    // Status message
    const statusMessage = error || success || warning;
    const statusColor = error 
      ? 'text-red-600 dark:text-red-400' 
      : success 
      ? 'text-green-600 dark:text-green-400'
      : warning
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-gray-600 dark:text-gray-400';
    
    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              labelClassName
            )}
            htmlFor={props.id}
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Textarea container */}
        <div className="relative">
          <textarea
            className={cn(
              inputVariants({ variant: actualVariant, size }),
              'min-h-[80px] resize-none',
              autoResize && 'resize-none overflow-hidden',
              clearable && 'pr-10',
              className
            )}
            ref={textareaRef}
            value={value !== undefined ? value : internalValue}
            onChange={handleChange}
            maxLength={maxCount}
            rows={autoResize ? undefined : rows}
            aria-invalid={!!error}
            aria-describedby={cn(
              statusMessage && `${props.id}-status`,
              helperText && `${props.id}-helper`,
              showCount && `${props.id}-count`
            )}
            {...props}
          />
          
          {/* Clear button */}
          {clearable && currentValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
              aria-label="Clear textarea"
            >
              <ClearIcon />
            </button>
          )}
        </div>
        
        {/* Helper text and character count */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Status message */}
            {statusMessage && (
              <p
                id={`${props.id}-status`}
                className={cn('text-xs', statusColor)}
                role={error ? 'alert' : 'status'}
              >
                {statusMessage}
              </p>
            )}
            
            {/* Helper text */}
            {helperText && !statusMessage && (
              <p
                id={`${props.id}-helper`}
                className={cn(
                  'text-xs text-gray-600 dark:text-gray-400',
                  helperClassName
                )}
              >
                {helperText}
              </p>
            )}
          </div>
          
          {/* Character count */}
          {showCount && maxCount && (
            <p
              id={`${props.id}-count`}
              className={cn(
                'text-xs ml-2 flex-shrink-0',
                characterCount > maxCount
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
              aria-live="polite"
            >
              {characterCount}/{maxCount}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Export input variants for external use
export { inputVariants };

// Export types
export type InputVariant = NonNullable<VariantProps<typeof inputVariants>['variant']>;
export type InputSize = NonNullable<VariantProps<typeof inputVariants>['size']>;