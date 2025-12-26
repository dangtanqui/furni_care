import { describe, it, expect } from 'vitest';
import { ApiErrorHandler } from '../../src/utils/apiErrorHandler';
import type { ApiError, NetworkError, ValidationError } from '../../src/types/errors';
import { ErrorCategory } from '../../src/types/errors';

describe('ApiErrorHandler', () => {
  describe('extractError', () => {
    it('should extract error from axios error with response', () => {
      const mockAxiosError = {
        response: {
          status: 400,
          data: {
            error: 'Bad Request',
            errors: { field: ['is required'] },
          },
        },
        isAxiosError: true,
      };

      const error = ApiErrorHandler.extractError(mockAxiosError as any);
      expect('status' in error && error.status).toBe(400);
      expect('message' in error && error.message).toBe('Bad Request');
    });

    it('should extract network error', () => {
      const mockAxiosError = {
        request: {},
        isAxiosError: true,
      };

      const error = ApiErrorHandler.extractError(mockAxiosError as any);
      expect('code' in error && error.code).toBe('NETWORK_ERROR');
    });

    it('should extract error from Error object', () => {
      const error = new Error('Test error');
      const result = ApiErrorHandler.extractError(error);
      expect('message' in result && result.message).toBe('Test error');
    });
  });

  describe('categorizeError', () => {
    it('should categorize authentication error', () => {
      const error: ApiError = { message: 'Unauthorized', status: 401 };
      expect(ApiErrorHandler.categorizeError(error)).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('should categorize authorization error', () => {
      const error: ApiError = { message: 'Forbidden', status: 403 };
      expect(ApiErrorHandler.categorizeError(error)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize network error', () => {
      const error: NetworkError = { message: 'Network error', code: 'NETWORK_ERROR' };
      expect(ApiErrorHandler.categorizeError(error)).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize validation error', () => {
      const error: ValidationError = { field: 'name', message: 'is required' };
      expect(ApiErrorHandler.categorizeError(error)).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for network error', () => {
      const error: NetworkError = { message: 'Network error', code: 'NETWORK_ERROR' };
      const message = ApiErrorHandler.getUserFriendlyMessage(error);
      expect(message).toContain('Network error');
    });

    it('should return user-friendly message for authentication error', () => {
      const error: ApiError = { message: 'Unauthorized', status: 401 };
      const message = ApiErrorHandler.getUserFriendlyMessage(error);
      expect(message).toContain('session has expired');
    });
  });

  describe('normalizeValidationErrors', () => {
    it('should normalize array errors', () => {
      const errors = { field: ['is required', 'must be valid'] };
      const normalized = ApiErrorHandler.normalizeValidationErrors(errors);
      expect(normalized.field).toBe('is required must be valid');
    });

    it('should normalize string errors', () => {
      const errors = { field: 'is required' };
      const normalized = ApiErrorHandler.normalizeValidationErrors(errors);
      expect(normalized.field).toBe('is required');
    });
  });

  describe('isRetryable', () => {
    it('should return true for network errors', () => {
      const error: NetworkError = { message: 'Network error', code: 'NETWORK_ERROR' };
      expect(ApiErrorHandler.isRetryable(error)).toBe(true);
    });

    it('should return true for server errors', () => {
      const error: ApiError = { message: 'Server error', status: 500 };
      expect(ApiErrorHandler.isRetryable(error)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const error: ValidationError = { field: 'name', message: 'is required' };
      expect(ApiErrorHandler.isRetryable(error)).toBe(false);
    });
  });
});

