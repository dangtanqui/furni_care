import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../../src/hooks/useFormValidation';
import { ValidationRules } from '../../src/utils/validation';

describe('useFormValidation', () => {
  const initialValues = {
    name: '',
    email: '',
    age: '',
  };

  it('should initialize with initial values', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        rules: {},
      })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it('should validate on change when validateOnChange is true', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        rules: {
          name: [ValidationRules.required()],
        },
        validateOnChange: true,
      })
    );

    act(() => {
      result.current.setValue('name', '');
    });

    expect(result.current.errors.name).toBeDefined();
    expect(result.current.isValid).toBe(false);
  });

  it('should validate on blur when validateOnBlur is true', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        rules: {
          name: [ValidationRules.required()],
        },
        validateOnBlur: true,
      })
    );

    act(() => {
      result.current.setFieldTouched('name', true);
    });

    expect(result.current.errors.name).toBeDefined();
  });

  it('should clear error when field is valid', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        rules: {
          name: [ValidationRules.required()],
        },
        validateOnChange: true,
      })
    );

    act(() => {
      result.current.setValue('name', '');
    });

    expect(result.current.errors.name).toBeDefined();

    act(() => {
      result.current.setValue('name', 'John');
    });

    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.isValid).toBe(true);
  });

  it('should validate entire form', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        rules: {
          name: [ValidationRules.required()],
          email: [ValidationRules.required(), ValidationRules.email()],
        },
      })
    );

    act(() => {
      const validationResult = result.current.validateForm();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.name).toBeDefined();
      expect(validationResult.errors.email).toBeDefined();
    });
  });

  it('should reset form', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        rules: {
          name: [ValidationRules.required()],
        },
      })
    );

    act(() => {
      result.current.setValue('name', 'John');
      result.current.setFieldTouched('name', true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});

