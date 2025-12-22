/**
 * Test data helpers for E2E tests
 * 
 * This file contains helper functions to create and manage test data
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'cs' | 'technician' | 'leader';
}

export interface TestClient {
  name: string;
  code: string;
}

export interface TestSite {
  name: string;
  city: string;
}

export interface TestContact {
  name: string;
  phone: string;
  email: string;
}

/**
 * Default test credentials
 */
export const DEFAULT_TEST_USER: TestUser = {
  email: 'cs@demo.com',
  password: 'password',
  name: 'Test CS User',
  role: 'cs'
};

/**
 * Generate unique test data
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateTestClient(): TestClient {
  return {
    name: `Test Client ${Date.now()}`,
    code: `TC${Date.now()}`
  };
}

export function generateTestSite(): TestSite {
  return {
    name: `Test Site ${Date.now()}`,
    city: 'Test City'
  };
}

export function generateTestContact(): TestContact {
  return {
    name: `Test Contact ${Date.now()}`,
    phone: `+84${Math.floor(Math.random() * 1000000000)}`,
    email: generateTestEmail()
  };
}

