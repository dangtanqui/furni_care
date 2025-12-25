/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { getMe } from '../../src/api/auth';

// Mock API
vi.mock('../../src/api/auth');

const mockGetMe = vi.mocked(getMe);

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide auth context to children', () => {
      const TestComponent = () => {
        const { token } = useAuth();
        return <div>{token ? 'Authenticated' : 'Not authenticated'}</div>;
      };

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByText('Not authenticated')).toBeInTheDocument();
    });

    it('should initialize with no token when localStorage is empty', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isCS).toBe(false);
      expect(result.current.isTechnician).toBe(false);
      expect(result.current.isLeader).toBe(false);
    });

    it('should load token from localStorage if valid', async () => {
      const futureTime = Date.now() + 1000000; // Future time
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('token_expiration', futureTime.toString());

      mockGetMe.mockResolvedValue({
        data: {
          user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.token).toBe('valid-token');
      });

      await waitFor(() => {
        expect(mockGetMe).toHaveBeenCalled();
        expect(result.current.user).toEqual({
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'cs',
        });
      });
    });

    it('should remove expired token from localStorage', () => {
      const pastTime = Date.now() - 1000000; // Past time
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('token_expiration', pastTime.toString());

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token_expiration')).toBeNull();
    });

    it('should load user data when token is set', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('new-token', mockUser);
      });

      await waitFor(() => {
        expect(mockGetMe).toHaveBeenCalled();
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('new-token');
      });
    });

    it('should logout when getMe fails', async () => {
      mockGetMe.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };

      await act(async () => {
        result.current.login('invalid-token', mockUser);
      });

      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
      });
    });
  });

  describe('login', () => {
    it('should store token with 1 day expiration when rememberMe is false', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser, false);
      });

      const expiration = localStorage.getItem('token_expiration');
      expect(expiration).toBeTruthy();
      const expirationTime = parseInt(expiration!, 10);
      const expectedExpiration = Date.now() + 1 * 24 * 60 * 60 * 1000;
      expect(expirationTime).toBeGreaterThan(expectedExpiration - 1000);
      expect(expirationTime).toBeLessThan(expectedExpiration + 1000);
    });

    it('should store token with 30 days expiration when rememberMe is true', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser, true);
      });

      const expiration = localStorage.getItem('token_expiration');
      expect(expiration).toBeTruthy();
      const expirationTime = parseInt(expiration!, 10);
      const expectedExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
      expect(expirationTime).toBeGreaterThan(expectedExpiration - 1000);
      expect(expirationTime).toBeLessThan(expectedExpiration + 1000);
    });

    it('should set user immediately on login', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('should clear token and user', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser);
      });

      await waitFor(() => {
        expect(result.current.token).toBe('test-token');
      });

      await act(async () => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token_expiration')).toBeNull();
    });
  });

  describe('Role checks', () => {
    it('should return isCS true when user role is cs', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser);
      });

      await waitFor(() => {
        expect(result.current.isCS).toBe(true);
        expect(result.current.isTechnician).toBe(false);
        expect(result.current.isLeader).toBe(false);
      });
    });

    it('should return isTechnician true when user role is technician', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'technician' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser);
      });

      await waitFor(() => {
        expect(result.current.isCS).toBe(false);
        expect(result.current.isTechnician).toBe(true);
        expect(result.current.isLeader).toBe(false);
      });
    });

    it('should return isLeader true when user role is leader', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'leader' };
      mockGetMe.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login('test-token', mockUser);
      });

      await waitFor(() => {
        expect(result.current.isCS).toBe(false);
        expect(result.current.isTechnician).toBe(false);
        expect(result.current.isLeader).toBe(true);
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return context when used within provider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('token');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('isCS');
      expect(result.current).toHaveProperty('isTechnician');
      expect(result.current).toHaveProperty('isLeader');
    });
  });
});

