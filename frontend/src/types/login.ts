/**
 * Login Form Types and Validation
 * 
 * This module provides TypeScript interfaces and Zod schemas
 * for login form validation on the client side.
 */

import { z } from 'zod';

/**
 * Zod schema for user login form validation
 * Matches the backend Pydantic validation rules
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be at most 100 characters long')
    .toLowerCase(),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be at most 128 characters long'),
});

/**
 * TypeScript type derived from the login schema
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login form field types for better type safety
 */
export interface LoginFormFields {
  email: string;
  password: string;
}

/**
 * Login form validation error types
 */
export interface LoginFormErrors {
  email?: string[];
  password?: string[];
  root?: string;
}

/**
 * Login form state interface
 */
export interface LoginFormState {
  data: LoginFormFields;
  errors: LoginFormErrors;
  isSubmitting: boolean;
  submitCount: number;
}

/**
 * Login form submission result
 */
export interface LoginResult {
  success: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
}

/**
 * Default login form state
 */
export const defaultLoginState: LoginFormState = {
  data: {
    email: '',
    password: '',
  },
  errors: {},
  isSubmitting: false,
  submitCount: 0,
};

/**
 * Login form validation helper
 */
export const validateLoginForm = (data: LoginFormFields): LoginFormErrors => {
  try {
    loginSchema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: LoginFormErrors = {};
      
      error.issues.forEach((err) => {
        const field = err.path[0] as keyof LoginFormFields;
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field]!.push(err.message);
      });
      
      return errors;
    }
    
    return { root: 'Validation error occurred' };
  }
};

/**
 * Helper to check if form has any errors
 */
export const hasLoginFormErrors = (errors: LoginFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Helper to get first error message for a field
 */
export const getLoginFieldError = (errors: LoginFormErrors, field: keyof LoginFormFields): string | undefined => {
  return errors[field]?.[0];
};