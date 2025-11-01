/**
 * Form Input Component
 * 
 * A reusable form input component with validation styling and error handling.
 */

import React, { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  isLoading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, isLoading, className, type = 'text', ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type={type}
            id={inputId}
            disabled={isLoading}
            className={cn(
              // Base styles
              'block w-full px-3 py-2 border rounded-md shadow-sm text-sm',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'transition-colors duration-200',
              
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              
              // Default state
              'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'focus:border-blue-500 focus:ring-blue-500',
              
              // Error state
              error && [
                'border-red-300 dark:border-red-600',
                'focus:border-red-500 focus:ring-red-500',
                'bg-red-50 dark:bg-red-900/20',
              ],
              
              // Disabled state
              'disabled:bg-gray-100 dark:disabled:bg-gray-700',
              'disabled:text-gray-500 dark:disabled:text-gray-400',
              'disabled:cursor-not-allowed',
              
              className
            )}
            {...props}
          />
          
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {description && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };