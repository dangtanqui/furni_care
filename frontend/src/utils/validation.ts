/**
 * Validation utility functions
 */

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate required field
 */
export function required(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate number (must be a valid number >= 0)
 */
export function validateNumber(value: string | number): boolean {
  if (value === null || value === undefined || value === '') return false;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numValue) && numValue >= 0;
}

/**
 * Validate positive number (must be > 0)
 */
export function validatePositiveNumber(value: string | number): boolean {
  if (value === null || value === undefined || value === '') return false;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number): boolean {
  if (!value) return false;
  return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  if (!value) return true; // Optional field
  return value.trim().length <= maxLength;
}

/**
 * Validate cost field (for estimated_cost, final_cost)
 * Must be a valid number >= 0, allow 0 as valid value
 */
export function validateCost(cost: string | number | null | undefined): boolean {
  if (cost === null || cost === undefined || cost === '') return false;
  const costValue = typeof cost === 'string' ? cost.trim() : String(cost);
  if (costValue === '0') return true; // Allow 0 as valid value
  const numValue = parseFloat(costValue);
  return !isNaN(numValue) && numValue >= 0;
}

/**
 * Validate form fields with rules
 */
export function validateForm<T extends Record<string, any>>(
  form: T,
  rules: Record<keyof T, ValidationRule[]>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = form[field as keyof T];
    
    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
}

/**
 * Create a validation rule
 */
export function createRule<T>(
  validate: (value: T) => boolean,
  message: string
): ValidationRule<T> {
  return { validate, message };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (message = 'is required') => createRule(required, message),
  number: (message = 'must be a valid number') => createRule(validateNumber, message),
  positiveNumber: (message = 'must be a positive number') =>
    createRule(validatePositiveNumber, message),
  email: (message = 'must be a valid email') => createRule(validateEmail, message),
  minLength: (min: number, message?: string) =>
    createRule(
      (value: string) => validateMinLength(value, min),
      message || `must be at least ${min} characters`
    ),
  maxLength: (max: number, message?: string) =>
    createRule(
      (value: string) => validateMaxLength(value, max),
      message || `must be at most ${max} characters`
    ),
  cost: (message = 'is required') => createRule(validateCost, message),
};

