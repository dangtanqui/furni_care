import { useState, useCallback, useMemo } from 'react';
import type { ValidationResult, ValidationRule } from '../utils/validation';

interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T;
  rules?: Record<keyof T, ValidationRule[]>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Hook for form validation
 */
export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  rules = {} as Record<keyof T, ValidationRule[]>,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (field: keyof T, value: any): string | null => {
      const fieldRules = rules[field];
      if (!fieldRules || fieldRules.length === 0) return null;

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          return rule.message;
        }
      }

      return null;
    },
    [rules]
  );

  const validateForm = useCallback((): ValidationResult => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const field of Object.keys(rules) as Array<keyof T>) {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field as string] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return { isValid, errors: newErrors };
  }, [values, rules, validateField]);

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (validateOnChange) {
        const error = validateField(field, value);
        if (error) {
          setErrors((prev) => ({ ...prev, [field as string]: error }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
          });
        }
      }
    },
    [validateOnChange, validateField]
  );

  const setFieldTouched = useCallback(
    (field: keyof T, isTouched = true) => {
      setTouched((prev) => ({ ...prev, [field as string]: isTouched }));

      if (validateOnBlur && isTouched) {
        const error = validateField(field, values[field]);
        if (error) {
          setErrors((prev) => ({ ...prev, [field as string]: error }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
          });
        }
      }
    },
    [validateOnBlur, validateField, values]
  );

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const hasError = useCallback(
    (field: keyof T) => {
      return !!errors[field as string];
    },
    [errors]
  );

  const getError = useCallback(
    (field: keyof T) => {
      return errors[field as string] || null;
    },
    [errors]
  );

  const isFieldTouched = useCallback(
    (field: keyof T) => {
      return !!touched[field as string];
    },
    [touched]
  );

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setValues,
    setFieldTouched,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    reset,
    hasError,
    getError,
    isFieldTouched,
  };
}
