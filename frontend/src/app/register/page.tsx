'use client';

/**
 * User Registration Page
 * 
 * Complete registration form with validation, password strength indicator,
 * and integration with the backend API.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { authApi, type ApiErrorResponse } from '@/lib/api';
import {
  registrationSchema,
  type RegistrationFormData,
  registrationFields,
  SubmissionState,
} from '@/types/registration';

export default function RegisterPage() {
  const router = useRouter();
  const [submissionState, setSubmissionState] = useState<SubmissionState>(SubmissionState.IDLE);
  const [apiError, setApiError] = useState<string>('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setSubmissionState(SubmissionState.SUBMITTING);
      setApiError('');

      const response = await authApi.register(data);
      
      setSubmissionState(SubmissionState.SUCCESS);
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);

    } catch (error: any) {
      setSubmissionState(SubmissionState.ERROR);
      
      if (error.status === 400 && error.error) {
        // Handle specific backend validation errors
        switch (error.error) {
          case 'username_exists':
            setError('username', { message: 'This username is already taken' });
            break;
          case 'email_exists':
            setError('email', { message: 'This email is already registered' });
            break;
          case 'validation_error':
            if (error.details) {
              // Map backend field errors to form fields
              Object.entries(error.details).forEach(([field, messages]) => {
                if (Array.isArray(messages) && messages.length > 0) {
                  setError(field as keyof RegistrationFormData, {
                    message: messages[0],
                  });
                }
              });
            }
            break;
          default:
            setApiError(error.message || 'Registration failed. Please try again.');
        }
      } else {
        setApiError(error.message || 'Registration failed. Please check your connection and try again.');
      }
    }
  };

  const handleRetry = () => {
    setSubmissionState(SubmissionState.IDLE);
    setApiError('');
    reset();
  };

  // Success state
  if (submissionState === SubmissionState.SUCCESS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Registration Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your account has been created successfully. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Global Error Message */}
          {apiError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{apiError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {registrationFields.map((field) => (
              <div key={field.name}>
                <Input
                  {...register(field.name)}
                  type={field.type}
                  label={field.label}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  description={field.description}
                  error={errors[field.name]?.message}
                  isLoading={submissionState === SubmissionState.SUBMITTING}
                  required
                  onFocus={() => {
                    if (field.name === 'password') {
                      setShowPasswordStrength(true);
                    }
                  }}
                />

                {/* Password Strength Indicator */}
                {field.name === 'password' && (
                  <div className="mt-2">
                    <PasswordStrengthIndicator
                      password={watchedPassword}
                      show={showPasswordStrength}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="space-y-4">
            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={submissionState === SubmissionState.SUBMITTING}
              disabled={submissionState === SubmissionState.SUBMITTING}
            >
              {submissionState === SubmissionState.SUBMITTING
                ? 'Creating account...'
                : 'Create account'}
            </Button>

            {/* Retry Button (shown on error) */}
            {submissionState === SubmissionState.ERROR && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleRetry}
              >
                Try again
              </Button>
            )}
          </div>

          {/* Terms and Privacy */}
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Privacy Policy
            </Link>
            .
          </div>
        </form>
      </div>
    </div>
  );
}