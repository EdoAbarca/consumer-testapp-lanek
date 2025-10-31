/**
 * Registration Form Types and Validation
 * 
 * This module provides TypeScript interfaces and Zod schemas
 * for form validation on the client side.
 */

import { z } from 'zod';

/**
 * Zod schema for user registration form validation
 * Matches the backend Pydantic validation rules
 */
export const registrationSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters long')
      .max(30, 'Username must be at most 30 characters long')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      ),
    
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
      .max(128, 'Password must be at most 128 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      ),
    
    confirm_password: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

/**
 * TypeScript type derived from the Zod schema
 */
export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Form field configuration for dynamic rendering
 */
export interface FormFieldConfig {
  name: keyof RegistrationFormData;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  autoComplete?: string;
  description?: string;
}

/**
 * Registration form field configurations
 */
export const registrationFields: FormFieldConfig[] = [
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Enter your username',
    autoComplete: 'username',
    description: '3-30 characters, letters, numbers, and underscores only',
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email address',
    autoComplete: 'email',
    description: 'We\'ll use this to contact you and for login',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    autoComplete: 'new-password',
    description: 'At least 8 characters with uppercase, lowercase, number, and special character',
  },
  {
    name: 'confirm_password',
    label: 'Confirm Password',
    type: 'password',
    placeholder: 'Confirm your password',
    autoComplete: 'new-password',
    description: 'Re-enter your password to confirm',
  },
];

/**
 * Form submission states
 */
export enum SubmissionState {
  IDLE = 'idle',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Registration form state interface
 */
export interface RegistrationFormState {
  submissionState: SubmissionState;
  errorMessage?: string;
  successMessage?: string;
}

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Password strength configuration
 */
export interface PasswordStrengthConfig {
  level: PasswordStrength;
  label: string;
  color: string;
  requirements: string[];
}

/**
 * Calculate password strength
 * @param password Password to evaluate
 * @returns Password strength configuration
 */
export const calculatePasswordStrength = (password: string): PasswordStrengthConfig => {
  const requirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[a-z]/, text: 'Lowercase letter' },
    { regex: /[A-Z]/, text: 'Uppercase letter' },
    { regex: /\d/, text: 'Number' },
    { regex: /[@$!%*?&]/, text: 'Special character' },
  ];

  const metRequirements = requirements.filter(req => req.regex.test(password));
  const unmetRequirements = requirements.filter(req => !req.regex.test(password));
  const score = metRequirements.length;

  if (score === 0 || password.length === 0) {
    return {
      level: PasswordStrength.WEAK,
      label: 'Very Weak',
      color: 'text-red-600',
      requirements: unmetRequirements.map(r => r.text),
    };
  } else if (score === 1) {
    return {
      level: PasswordStrength.WEAK,
      label: 'Weak',
      color: 'text-red-500',
      requirements: unmetRequirements.map(r => r.text),
    };
  } else if (score === 2) {
    return {
      level: PasswordStrength.FAIR,
      label: 'Fair',
      color: 'text-orange-500',
      requirements: unmetRequirements.map(r => r.text),
    };
  } else if (score === 3) {
    return {
      level: PasswordStrength.GOOD,
      label: 'Good',
      color: 'text-yellow-500',
      requirements: unmetRequirements.map(r => r.text),
    };
  } else if (score === 4) {
    return {
      level: PasswordStrength.GOOD,
      label: 'Good',
      color: 'text-blue-500',
      requirements: unmetRequirements.map(r => r.text),
    };
  } else {
    return {
      level: PasswordStrength.STRONG,
      label: 'Strong',
      color: 'text-green-600',
      requirements: [],
    };
  }
};