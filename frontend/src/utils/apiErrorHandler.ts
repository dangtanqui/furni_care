import axios from 'axios';
import type { ApiError, AppError, ErrorCategory } from '../types/errors';
import { ErrorCategory as EC } from '../types/errors';

/**
 * Centralized API error handler
 */
export class ApiErrorHandler {
  /**
   * Extract error message from axios error
   */
  static extractError(error: unknown): AppError {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      
      if (response) {
        // Server responded with error status
        const apiError: ApiError = {
          message: response.data?.error || response.data?.message || error.message || 'An error occurred',
          status: response.status,
          errors: response.data?.errors,
          code: response.data?.code,
          retry_after: response.data?.retry_after,
          retry_after_minutes: response.data?.retry_after_minutes,
        };
        return apiError;
      } else if (error.request) {
        // Request was made but no response received
        return {
          message: 'Network error. Please check your connection and try again.',
          code: 'NETWORK_ERROR',
        };
      }
    }

    // Unknown error
    if (error instanceof Error) {
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }

    return {
      message: 'An unexpected error occurred',
    };
  }

  /**
   * Categorize error
   */
  static categorizeError(error: AppError): ErrorCategory {
    if ('status' in error && error.status !== undefined) {
      const status = error.status;
      if (status === 401) return EC.AUTHENTICATION;
      if (status === 403) return EC.AUTHORIZATION;
      if (status === 404) return EC.NOT_FOUND;
      if (status === 429) return EC.RATE_LIMIT;
      if (status >= 400 && status < 500) return EC.VALIDATION;
      if (status >= 500) return EC.SERVER;
    }

    if ('code' in error && error.code === 'NETWORK_ERROR') {
      return EC.NETWORK;
    }

    if ('field' in error) {
      return EC.VALIDATION;
    }

    return EC.UNKNOWN;
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: AppError): string {
    const category = this.categorizeError(error);

    // Handle rate limit specifically
    if (category === EC.RATE_LIMIT) {
      const retryAfter = (error as any).retry_after_minutes || 
                         Math.ceil(((error as any).retry_after || 1200) / 60);
      return `Too many requests. Please try again in ${retryAfter} minute${retryAfter !== 1 ? 's' : ''}.`;
    }

    switch (category) {
      case EC.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case EC.AUTHENTICATION:
        return 'Your session has expired. Please log in again.';
      case EC.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case EC.NOT_FOUND:
        return 'The requested resource was not found.';
      case EC.SERVER:
        return 'Server error. Please try again later.';
      case EC.VALIDATION:
        return error.message || 'Validation error. Please check your input.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Normalize validation errors from API response
   */
  static normalizeValidationErrors(
    errors: Record<string, string[]> | Record<string, string> | undefined
  ): Record<string, string> {
    if (!errors) return {};

    return Object.entries(errors).reduce<Record<string, string>>((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value.join(' ');
      } else {
        acc[key] = String(value);
      }
      return acc;
    }, {});
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    const category = this.categorizeError(error);
    
    // Network errors and server errors (5xx) are retryable
    if (category === EC.NETWORK) return true;
    if (category === EC.SERVER) return true;
    
    // Rate limit errors (429) are retryable
    if ('status' in error && error.status === 429) return true;
    
    return false;
  }

  /**
   * Get retry delay in milliseconds
   */
  static getRetryDelay(error: AppError, attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // If rate limited, use Retry-After header if available
    if ('status' in error && error.status !== undefined && error.status === 429) {
      // Could extract from response headers, but for now use calculated delay
      return delay;
    }
    
    return delay;
  }
}
