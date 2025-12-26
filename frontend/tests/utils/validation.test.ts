import { describe, it, expect } from 'vitest';
import {
  required,
  validateNumber,
  validatePositiveNumber,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validateCost,
  validateForm,
  ValidationRules,
} from '../../src/utils/validation';

describe('validation utilities', () => {
  describe('required', () => {
    it('should return false for null', () => {
      expect(required(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(required(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(required('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(required('   ')).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(required('test')).toBe(true);
    });

    it('should return true for number', () => {
      expect(required(0)).toBe(true);
      expect(required(123)).toBe(true);
    });

    it('should return true for non-empty array', () => {
      expect(required([1, 2, 3])).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(required([])).toBe(false);
    });
  });

  describe('validateNumber', () => {
    it('should return true for valid numbers', () => {
      expect(validateNumber(0)).toBe(true);
      expect(validateNumber(123)).toBe(true);
      expect(validateNumber('0')).toBe(true);
      expect(validateNumber('123')).toBe(true);
      expect(validateNumber('123.45')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(validateNumber('')).toBe(false);
      expect(validateNumber('abc')).toBe(false);
      expect(validateNumber(null)).toBe(false);
      expect(validateNumber(undefined)).toBe(false);
    });
  });

  describe('validateCost', () => {
    it('should return true for valid costs', () => {
      expect(validateCost(0)).toBe(true);
      expect(validateCost(123)).toBe(true);
      expect(validateCost('0')).toBe(true);
      expect(validateCost('123')).toBe(true);
      expect(validateCost('123.45')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(validateCost('')).toBe(false);
      expect(validateCost('abc')).toBe(false);
      expect(validateCost(null)).toBe(false);
      expect(validateCost(undefined)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('validateForm', () => {
    it('should return valid result when all fields pass', () => {
      const form = { name: 'John', email: 'john@example.com' };
      const rules = {
        name: [ValidationRules.required()],
        email: [ValidationRules.required(), ValidationRules.email()],
      };

      const result = validateForm(form, rules);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should return errors when validation fails', () => {
      const form = { name: '', email: 'invalid' };
      const rules = {
        name: [ValidationRules.required()],
        email: [ValidationRules.required(), ValidationRules.email()],
      };

      const result = validateForm(form, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });
  });
});

