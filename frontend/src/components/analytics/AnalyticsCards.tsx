'use client';

import React from 'react';
import type { ConsumptionAnalytics } from '@/types/consumption';

interface AnalyticsCardsProps {
  analytics: ConsumptionAnalytics;
}

export default function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  // Calculate percentage change from last month to current month
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const monthlyChange = calculatePercentageChange(
    analytics.current_month_total,
    analytics.last_month_total
  );

  const isIncreased = monthlyChange > 0;
  const isDecreased = monthlyChange < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Consumption Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Consumption
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.total_consumption.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Across all records
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Average Monthly Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Average Monthly
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.average_monthly.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Per month
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Current Month Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current Month
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.current_month_total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center mt-1">
              {isIncreased && (
                <span className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 10H7" />
                  </svg>
                  {monthlyChange.toFixed(1)}%
                </span>
              )}
              {isDecreased && (
                <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0-10h10" />
                  </svg>
                  {Math.abs(monthlyChange).toFixed(1)}%
                </span>
              )}
              {monthlyChange === 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  No change
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Total Records Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Records
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.total_records}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Consumption entries
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Consumption by Type Cards */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Consumption by Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Electricity */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Electricity
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {analytics.consumption_by_type.electricity.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Water */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l9-9 3 3L5 22l3-8z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  Water
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {analytics.consumption_by_type.water.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Gas */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  Gas
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {analytics.consumption_by_type.gas.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}