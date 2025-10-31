/**
 * Consumption Type Definitions
 * 
 * This module contains TypeScript interfaces and types for consumption data
 * management functionality.
 */

/**
 * Consumption Types Enum
 */
export type ConsumptionType = 'electricity' | 'water' | 'gas';

/**
 * Consumption Creation Request Interface
 */
export interface ConsumptionCreateRequest {
  date: string; // ISO date string
  value: number;
  type: ConsumptionType;
  notes?: string;
}

/**
 * Consumption Record Interface
 */
export interface ConsumptionRecord {
  id: number;
  user_id: number;
  date: string; // ISO date string
  value: number;
  type: ConsumptionType;
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Consumption Creation Response Interface
 */
export interface ConsumptionCreateResponse {
  consumption: ConsumptionRecord;
  message: string;
}

/**
 * Consumption Validation Error Interface
 */
export interface ConsumptionValidationError {
  error: string;
  message: string;
  details: Record<string, string>;
}

/**
 * Consumption Form Data Interface (for form state management)
 */
export interface ConsumptionFormData {
  date: string;
  value: string; // String for form input, converted to number on submit
  type: ConsumptionType | '';
  notes: string;
}

/**
 * Consumption Form Errors Interface
 */
export interface ConsumptionFormErrors {
  date?: string;
  value?: string;
  type?: string;
  notes?: string;
  general?: string;
}

/**
 * Type guard to check if a string is a valid consumption type
 */
export function isValidConsumptionType(type: string): type is ConsumptionType {
  return ['electricity', 'water', 'gas'].includes(type);
}

/**
 * Get display label for consumption type
 */
export function getConsumptionTypeLabel(type: ConsumptionType): string {
  const labels: Record<ConsumptionType, string> = {
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
  };
  return labels[type];
}

/**
 * Get all consumption types with labels
 */
export function getConsumptionTypeOptions(): Array<{ value: ConsumptionType; label: string }> {
  return [
    { value: 'electricity', label: 'Electricity' },
    { value: 'water', label: 'Water' },
    { value: 'gas', label: 'Gas' },
  ];
}