import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExerciseProgress } from './useAnalytics';
import { createMockDuckDB } from '../tests/mocks/duckdb';
import { makeProgressPoint } from '../tests/__fixtures__/test-data';

// Mock getDuckDB
vi.mock('../db/duckdb-init', () => ({
  getDuckDB: vi.fn(),
}));

// Import after mock setup
import { getDuckDB } from '../db/duckdb-init';

describe('useExerciseProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns loading=true then data on success', async () => {
    const mockData = [
      makeProgressPoint({
        date: '2026-01-31',
        maxWeight: 100,
        max1rm: 112.5,
        totalVolume: 1500,
        setCount: 3,
      }),
      makeProgressPoint({
        date: '2026-01-30',
        maxWeight: 95,
        max1rm: 107.5,
        totalVolume: 1425,
        setCount: 3,
      }),
    ];

    const mockDB = createMockDuckDB({
      '*': mockData.map(p => ({
        date: p.date,
        max_weight: p.maxWeight,
        max_1rm: p.max1rm,
        total_volume: p.totalVolume,
        set_count: p.setCount,
      })),
    });

    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  test('returns empty array when no exerciseId', async () => {
    const mockDB = createMockDuckDB({});
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: '' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('returns error state when DB query fails', async () => {
    const mockDB = {
      connect: vi.fn(async () => ({
        query: vi.fn(async () => {
          throw new Error('Database query failed');
        }),
        close: vi.fn(async () => {}),
      })),
    };

    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Database query failed');
    expect(result.current.data).toEqual([]);
  });

  test('correctly maps row data to ProgressPoint type', async () => {
    // Test date conversion: DuckDB returns dates as millisecond epochs (numbers)
    const mockData = [
      {
        date: 1769817600000, // 2026-01-31T00:00:00.000Z as milliseconds
        max_weight: 100.5,
        max_1rm: 112.75,
        total_volume: 1500,
        set_count: 3,
      },
    ];

    const mockDB = createMockDuckDB({ '*': mockData });
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    const point = result.current.data[0];

    // Verify date conversion (millisecond epoch -> YYYY-MM-DD string)
    expect(point.date).toBe('2026-01-31');

    // Verify number conversion
    expect(point.maxWeight).toBe(100.5);
    expect(point.max1rm).toBe(112.75);
    expect(point.totalVolume).toBe(1500);
    expect(point.setCount).toBe(3);
  });

  test('handles date as BigInt (from DuckDB-WASM)', async () => {
    const mockData = [
      {
        date: BigInt(1769817600000), // BigInt variant
        max_weight: 100,
        max_1rm: 112.5,
        total_volume: 1500,
        set_count: 3,
      },
    ];

    const mockDB = createMockDuckDB({ '*': mockData });
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0].date).toBe('2026-01-31');
  });

  test('handles null max_1rm correctly', async () => {
    const mockData = [
      {
        date: 1769817600000,
        max_weight: 100,
        max_1rm: null, // No 1RM estimate for this day
        total_volume: 1500,
        set_count: 3,
      },
    ];

    const mockDB = createMockDuckDB({ '*': mockData });
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // When max_1rm is null, it should map to 0
    expect(result.current.data[0].max1rm).toBe(0);
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

    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
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

  test('returns error when DB not initialized', async () => {
    vi.mocked(getDuckDB).mockReturnValue(null as any);

    const { result } = renderHook(() =>
      useExerciseProgress({ exerciseId: 'ex-bench' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Database not initialized');
    expect(result.current.data).toEqual([]);
  });

  test('re-fetches when exerciseId changes', async () => {
    const mockDB = createMockDuckDB({ '*': [] });
    vi.mocked(getDuckDB).mockReturnValue(mockDB as any);

    const { result, rerender } = renderHook(
      ({ exerciseId }) => useExerciseProgress({ exerciseId }),
      {
        initialProps: { exerciseId: 'ex-bench' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockDB.connect).toHaveBeenCalledTimes(1);

    // Change exerciseId
    rerender({ exerciseId: 'ex-squat' });

    await waitFor(() => {
      expect(mockDB.connect).toHaveBeenCalledTimes(2);
    });
  });
});
