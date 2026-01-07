import { useState, useCallback, useEffect } from 'react';

/**
 * Generic form state management hook
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [form, setForm] = useState<T>(initialState);

  const updateField = useCallback((field: keyof T, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setForm(initialState);
  }, [initialState]);

  // Sync with external state changes
  useEffect(() => {
    setForm(initialState);
  }, [initialState]);

  return {
    form,
    setForm,
    updateField,
    updateFields,
    reset,
  };
}
