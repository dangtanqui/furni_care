import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClients, getSites, getContacts, getTechnicians } from '../../src/api/data';

const { mockGet } = vi.hoisted(() => {
  return {
    mockGet: vi.fn(),
  };
});

vi.mock('../../src/api/client', () => ({
  default: {
    get: mockGet,
  },
}));

const mockApi = { get: mockGet };

describe('data API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClients', () => {
    it('should call api.get with correct endpoint', () => {
      const mockResponse = { data: [{ id: 1, name: 'Client 1', code: 'C001' }] };
      mockGet.mockResolvedValue(mockResponse as any);

      getClients();

      expect(mockGet).toHaveBeenCalledWith('/clients');
    });
  });

  describe('getSites', () => {
    it('should call api.get with correct endpoint and clientId', () => {
      const mockResponse = { data: [{ id: 1, name: 'Site 1', city: 'City 1' }] };
      mockGet.mockResolvedValue(mockResponse as any);

      getSites(123);

      expect(mockGet).toHaveBeenCalledWith('/clients/123/sites');
    });
  });

  describe('getContacts', () => {
    it('should call api.get with correct endpoint and siteId', () => {
      const mockResponse = { data: [{ id: 1, name: 'Contact 1', phone: '123', email: 'test@example.com' }] };
      mockGet.mockResolvedValue(mockResponse as any);

      getContacts(456);

      expect(mockGet).toHaveBeenCalledWith('/sites/456/contacts');
    });
  });

  describe('getTechnicians', () => {
    it('should call api.get with correct endpoint', () => {
      const mockResponse = { data: [{ id: 1, name: 'Tech 1' }] };
      mockGet.mockResolvedValue(mockResponse as any);

      getTechnicians();

      expect(mockGet).toHaveBeenCalledWith('/users/technicians');
    });
  });
});

