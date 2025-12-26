import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from '../../src/hooks/useLoadingState';

describe('useLoadingState', () => {
  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useLoadingState());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should set loading to true when startLoading is called', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.loading).toBe(true);
  });

  it('should set loading to false when stopLoading is called', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
      result.current.stopLoading();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle multiple loading operations', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading('op1');
      result.current.startLoading('op2');
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.isLoading('op1')).toBe(true);
    expect(result.current.isLoading('op2')).toBe(true);

    act(() => {
      result.current.stopLoading('op1');
    });

    expect(result.current.loading).toBe(true); // Still loading because op2 is active
    expect(result.current.isLoading('op1')).toBe(false);
    expect(result.current.isLoading('op2')).toBe(true);

    act(() => {
      result.current.stopLoading('op2');
    });

    expect(result.current.loading).toBe(false);
  });

  it('should set error and stop loading', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
    expect(result.current.loading).toBe(false);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setError('Test error');
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading('op1');
      result.current.setError('Test error');
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading('op1')).toBe(false);
  });

  it('should wrap async operation with loading', async () => {
    const { result } = renderHook(() => useLoadingState());

    const asyncOperation = vi.fn().mockResolvedValue('result');

    await act(async () => {
      const promise = result.current.withLoading(asyncOperation);
      expect(result.current.loading).toBe(true);
      const result = await promise;
      expect(result).toBe('result');
    });

    expect(result.current.loading).toBe(false);
  });
});

