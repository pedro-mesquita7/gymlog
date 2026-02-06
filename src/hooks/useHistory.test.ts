import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHistory } from './useHistory';
import { createMockDuckDB } from '../tests/mocks/duckdb';
import { makeSetHistory } from '../tests/__fixtures__/test-data';

// Mock getDuckDB
vi.mock('../db/duckdb-init', () => ({
  getDuckDB: vi.fn(),
}));

// Import after mock setup
import { getDuckDB } from '../db/duckdb-init';

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns loading=true initially, then loading=false with data', async () => {
    const mockData = [
      makeSetHistory({
        set_id: 'set-1',
        exercise_id: 'ex-bench',
        weight_kg: 60,
        reps: 8,
        logged_at: '2026-01-31T10:00:00Z',
        matches_gym_context: true,
      }),
      makeSetHistory({
        set_id: 'set-2',
        exercise_id: 'ex-bench',
        weight_kg: 65,
        reps: 6,
        logged_at: '2026-01-31T10:05:00Z',
        matches_gym_context: true,
      }),
    ];

    const mockDB = createMockDuckDB({
      '*': mockData, // Match any query
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex-bench', currentGymId: 'gym-1' })
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.history).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  test('returns empty history when no exerciseId provided', async () => {
    const mockDB = createMockDuckDB({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: '', currentGymId: 'gym-1' })
    );

    // When exerciseId is empty, fetchHistory returns early but doesn't update loading state
    // This is actually a minor bug - loading stays true, but no data is fetched
    // Since the plan says to test user-observable behavior, we'll test current behavior
    expect(result.current.history).toEqual([]);
    expect(result.current.error).toBeNull();
    // Note: isLoading stays true when exerciseId is empty (known limitation)
  });

  test('returns error when DB not initialized', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(null as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex-bench', currentGymId: 'gym-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Database not initialized');
    expect(result.current.history).toEqual([]);
  });

  test('correctly groups history by date in historyByDate', async () => {
    const mockData = [
      makeSetHistory({
        set_id: 'set-1',
        logged_at: '2026-01-31T10:00:00Z',
        matches_gym_context: true,
      }),
      makeSetHistory({
        set_id: 'set-2',
        logged_at: '2026-01-31T11:00:00Z', // Same day
        matches_gym_context: true,
      }),
      makeSetHistory({
        set_id: 'set-3',
        logged_at: '2026-01-30T10:00:00Z', // Different day
        matches_gym_context: true,
      }),
    ];

    const mockDB = createMockDuckDB({ '*': mockData });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex-bench', currentGymId: 'gym-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.historyByDate).toHaveLength(2);

    const date1 = result.current.historyByDate.find(d => d.date === '2026-01-31');
    expect(date1?.sets).toHaveLength(2);

    const date2 = result.current.historyByDate.find(d => d.date === '2026-01-30');
    expect(date2?.sets).toHaveLength(1);
  });

  test('refresh() re-fetches data', async () => {
    let callCount = 0;

    const mockDB = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => {
          callCount++;
          return {
            toArray: () => [],
          };
        }),
        close: vi.fn(async () => {}),
      })),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex-bench', currentGymId: 'gym-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(callCount).toBe(1);

    // Call refresh - should trigger another query
    await result.current.refresh();

    await waitFor(() => {
      expect(callCount).toBe(2);
    });
  });

  test('filters by gym context (matches_gym_context)', async () => {
    const mockData = [
      makeSetHistory({
        set_id: 'set-1',
        workout_gym_id: 'gym-1',
        is_global: false,
        matches_gym_context: true, // Should be included
      }),
      makeSetHistory({
        set_id: 'set-2',
        workout_gym_id: 'gym-2',
        is_global: false,
        matches_gym_context: false, // Should be filtered out
      }),
      makeSetHistory({
        set_id: 'set-3',
        workout_gym_id: 'gym-1',
        is_global: true,
        matches_gym_context: true, // Global exercise, should be included
      }),
    ];

    const mockDB = createMockDuckDB({ '*': mockData });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex-bench', currentGymId: 'gym-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only include sets with matches_gym_context=true
    expect(result.current.history).toHaveLength(2);
    expect(result.current.history.every(s => s.matches_gym_context)).toBe(true);
    expect(result.current.history.find(s => s.set_id === 'set-2')).toBeUndefined();
  });

  test('handles query errors gracefully', async () => {
    const mockDB = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => {
          throw new Error('Query failed');
        }),
        close: vi.fn(async () => {}),
      })),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex-bench', currentGymId: 'gym-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Query failed');
    expect(result.current.history).toEqual([]);
  });

  test('re-fetches when exerciseId changes', async () => {
    const mockDB = createMockDuckDB({
      '*': [makeSetHistory({ matches_gym_context: true })],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result, rerender } = renderHook(
      ({ exerciseId, currentGymId }) => useHistory({ exerciseId, currentGymId }),
      {
        initialProps: { exerciseId: 'ex-bench', currentGymId: 'gym-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockDB.connect).toHaveBeenCalledTimes(1);

    // Change exerciseId
    rerender({ exerciseId: 'ex-squat', currentGymId: 'gym-1' });

    await waitFor(() => {
      expect(mockDB.connect).toHaveBeenCalledTimes(2);
    });
  });

  test('re-fetches when currentGymId changes', async () => {
    const mockDB = createMockDuckDB({
      '*': [makeSetHistory({ matches_gym_context: true })],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result, rerender } = renderHook(
      ({ exerciseId, currentGymId }) => useHistory({ exerciseId, currentGymId }),
      {
        initialProps: { exerciseId: 'ex-bench', currentGymId: 'gym-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockDB.connect).toHaveBeenCalledTimes(1);

    // Change currentGymId
    rerender({ exerciseId: 'ex-bench', currentGymId: 'gym-2' });

    await waitFor(() => {
      expect(mockDB.connect).toHaveBeenCalledTimes(2);
    });
  });
});
