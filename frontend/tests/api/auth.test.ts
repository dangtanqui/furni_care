import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, getMe } from '../../src/api/auth';

const { mockPost, mockGet } = vi.hoisted(() => {
  return {
    mockPost: vi.fn(),
    mockGet: vi.fn(),
  };
});

vi.mock('../../src/api/client', () => ({
  default: {
    post: mockPost,
    get: mockGet,
  },
}));

const mockApi = { post: mockPost, get: mockGet };

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call api.post with correct parameters', () => {
      const mockResponse = { data: { token: 'test-token' } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      login('test@example.com', 'password123', true);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        remember_me: true,
      });
    });

    it('should default rememberMe to false', () => {
      const mockResponse = { data: { token: 'test-token' } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      login('test@example.com', 'password123');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        remember_me: false,
      });
    });
  });

  describe('register', () => {
    it('should call api.post with correct parameters', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'cs',
      };

      register(registerData);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', registerData);
    });
  });

  describe('getMe', () => {
    it('should call api.get with correct endpoint', () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com' } };
      mockApi.get.mockResolvedValue(mockResponse as any);

      getMe();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
    });
  });
});

