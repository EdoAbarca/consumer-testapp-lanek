'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Registration Success Message */}
        {registered && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 mb-6">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Registration Successful!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Your account has been created successfully. You can now log in with your credentials.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Login Page</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Login functionality will be implemented in future user stories.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}