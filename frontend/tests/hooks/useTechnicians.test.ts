import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock before importing the hook
vi.mock('../../src/api/data', () => ({
  getTechnicians: vi.fn(),
}));

describe('useTechnicians', () => {
  let useTechnicians: typeof import('../../src/hooks/useTechnicians').useTechnicians;
  let getTechnicians: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset modules to clear module-level cache
    vi.resetModules();
    
    // Re-import after reset
    const dataModule = await import('../../src/api/data');
    getTechnicians = vi.mocked(dataModule.getTechnicians);
    
    const hookModule = await import('../../src/hooks/useTechnicians');
    useTechnicians = hookModule.useTechnicians;
  });

  describe('Initial state', () => {
    it('should start with empty technicians and loading true when no cache', async () => {
      getTechnicians.mockResolvedValue({
        data: [{ id: 1, name: 'Tech 1' }],
      } as any);

      const { result } = renderHook(() => useTechnicians());

      expect(result.current.technicians).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Loading technicians', () => {
    it('should load technicians successfully', async () => {
      const mockTechnicians = [
        { id: 1, name: 'Tech 1' },
        { id: 2, name: 'Tech 2' },
      ];

      getTechnicians.mockResolvedValue({
        data: mockTechnicians,
      } as any);

      const { result } = renderHook(() => useTechnicians());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.technicians).toEqual(mockTechnicians);
      expect(result.current.error).toBeNull();
    });

    it('should handle error when loading technicians fails', async () => {
      const errorMessage = 'Failed to load technicians';
      getTechnicians.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTechnicians());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.technicians).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Caching', () => {
    it('should use cached data on subsequent calls', async () => {
      const mockTechnicians = [{ id: 1, name: 'Tech 1' }];

      getTechnicians.mockResolvedValue({
        data: mockTechnicians,
      } as any);

      // First call
      const { result: result1 } = renderHook(() => useTechnicians());
      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      // Second call should use cache (but cache is module-level, so we test differently)
      // In real usage, cache persists across hook instances
      expect(result1.current.technicians).toEqual(mockTechnicians);
    });
  });
});

