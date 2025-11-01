/**
 * Consumption Form Component
 * 
 * A form component for creating new consumption records.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { consumptionApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type {
  ConsumptionCreateRequest,
} from '@/types/consumption';
import { getConsumptionTypeOptions } from '@/types/consumption';

// Zod validation schema for consumption form
const consumptionSchema = z.object({
  date: z.string()
    .min(1, 'Date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return selectedDate <= today;
    }, 'Consumption date cannot be in the future'),
  value: z.string()
    .min(1, 'Value is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 
      'Value must be a positive number'),
  type: z.enum(['electricity', 'water', 'gas']).refine(
    (val) => ['electricity', 'water', 'gas'].includes(val),
    'Please select a valid consumption type'
  ),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type ConsumptionFormData = z.infer<typeof consumptionSchema>;

interface ConsumptionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ConsumptionForm({ onSuccess, onCancel }: ConsumptionFormProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [submitError, setSubmitError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form handling with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ConsumptionFormData>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date
      value: '',
      type: undefined,
      notes: '',
    },
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ConsumptionFormData) => {
    setSubmitError('');

    if (!accessToken) {
      setSubmitError('You must be logged in to create consumption records');
      return;
    }

    try {
      // Convert form data to API format
      const consumptionData: ConsumptionCreateRequest = {
        date: new Date(data.date).toISOString(),
        value: Number(data.value),
        type: data.type,
        notes: data.notes || undefined,
      };

      await consumptionApi.create(consumptionData, accessToken);
      
      setIsSuccess(true);
      reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior: redirect to dashboard or show success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error: unknown) {
      const apiError = error as { error?: string; details?: Record<string, string>; message?: string };
      console.error('Consumption creation error:', error);

      // Handle validation errors
      if (apiError.error === 'validation_error' && apiError.details) {
        Object.entries(apiError.details).forEach(([field, message]) => {
          setError(field as keyof ConsumptionFormData, {
            type: 'server',
            message: message as string,
          });
        });
      } else {
        // Handle general errors
        setSubmitError(apiError.message || 'Failed to create consumption record');
      }
    }
  };

  // Get consumption type options
  const typeOptions = getConsumptionTypeOptions();

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Consumption Record Created!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your consumption data has been saved successfully.
          </p>
          <Button onClick={() => setIsSuccess(false)}>
            Add Another Record
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Add Consumption Record
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date Input */}
        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          required
          {...register('date')}
        />

        {/* Value Input */}
        <Input
          label="Consumption Value"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Enter consumption value"
          error={errors.value?.message}
          required
          {...register('value')}
        />

        {/* Type Selection */}
        <div className="space-y-2">
          <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type-select"
            {...register('type')}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select consumption type</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <label htmlFor="notes-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (Optional)
          </label>
          <textarea
            id="notes-input"
            {...register('notes')}
            rows={3}
            placeholder="Add any notes about this consumption record..."
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          {errors.notes && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.notes.message}
            </p>
          )}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'Creating...' : 'Create Record'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}