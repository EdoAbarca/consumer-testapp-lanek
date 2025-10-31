/**
 * Password Strength Indicator Component
 * 
 * Visual indicator for password strength with requirements checklist.
 */

import React from 'react';
import { calculatePasswordStrength, PasswordStrength } from '@/types/registration';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  show = true,
}) => {
  if (!show || !password) {
    return null;
  }

  const strength = calculatePasswordStrength(password);

  const getStrengthBarColor = () => {
    switch (strength.level) {
      case PasswordStrength.WEAK:
        return 'bg-red-500';
      case PasswordStrength.FAIR:
        return 'bg-orange-500';
      case PasswordStrength.GOOD:
        return 'bg-yellow-500';
      case PasswordStrength.STRONG:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthPercentage = () => {
    const total = 5; // Total requirements
    const met = total - strength.requirements.length;
    return Math.max((met / total) * 100, 10); // Minimum 10% for visual feedback
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
      {/* Strength Label and Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Strength
          </span>
          <span className={cn('text-sm font-medium', strength.color)}>
            {strength.label}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              getStrengthBarColor()
            )}
            style={{ width: `${getStrengthPercentage()}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {strength.requirements.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Missing requirements:
          </span>
          <ul className="space-y-1">
            {strength.requirements.map((requirement, index) => (
              <li
                key={index}
                className="flex items-center text-xs text-gray-600 dark:text-gray-400"
              >
                <svg
                  className="w-3 h-3 mr-2 text-red-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {strength.requirements.length === 0 && (
        <div className="flex items-center text-xs text-green-600 dark:text-green-400">
          <svg
            className="w-3 h-3 mr-2 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          All requirements met! Strong password.
        </div>
      )}
    </div>
  );
};