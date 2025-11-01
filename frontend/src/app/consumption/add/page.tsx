/**
 * Add Consumption Page
 * 
 * Page for creating new consumption records.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ConsumptionForm from '@/components/ConsumptionForm';
import { useAuth } from '@/context/AuthContext';

export default function AddConsumptionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/consumption/add');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add Consumption Record
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your electricity, water, or gas consumption
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Consumption Form */}
        <ConsumptionForm 
          onSuccess={() => {
            // Redirect to dashboard after successful creation
            router.push('/dashboard?success=consumption-created');
          }}
          onCancel={() => router.push('/dashboard')}
        />
      </div>
    </div>
  );
}