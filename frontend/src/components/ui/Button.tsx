/**
 * Button Component
 * 
 * A reusable button component with various styles and states.
 */

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center rounded-md font-medium',
      'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    ];

    const variants = {
      primary: [
        'bg-blue-600 hover:bg-blue-700 text-white',
        'focus:ring-blue-500 shadow-sm',
      ],
      secondary: [
        'bg-gray-600 hover:bg-gray-700 text-white',
        'focus:ring-gray-500 shadow-sm',
      ],
      outline: [
        'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
        'focus:ring-blue-500 shadow-sm',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
      ],
      ghost: [
        'hover:bg-gray-100 text-gray-700',
        'focus:ring-gray-500',
        'dark:hover:bg-gray-800 dark:text-gray-300',
      ],
      danger: [
        'bg-red-600 hover:bg-red-700 text-white',
        'focus:ring-red-500 shadow-sm',
      ],
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };