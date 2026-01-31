import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';

export interface ObservabilityMetrics {
  storageUsageBytes: number;
  storageQuotaBytes: number;
  storageUsagePct: number;
  totalEvents: number;
  eventsByType: { event_type: string; count: number }[];
  queryTimeMs: number;
  isLoading: boolean;
  error: string | null;
}

export function useObservability(): ObservabilityMetrics & { refresh: () => void } {
  const [metrics, setMetrics] = useState<ObservabilityMetrics>({
    storageUsageBytes: 0,
    storageQuotaBytes: 0,
    storageUsagePct: 0,
    totalEvents: 0,
    eventsByType: [],
    queryTimeMs: 0,
    isLoading: true,
    error: null,
  });

  const loadMetrics = useCallback(async () => {
    let mounted = true;

    setMetrics((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryStartTime = performance.now();

      // Storage API metrics
      let storageUsageBytes = 0;
      let storageQuotaBytes = 0;
      let storageUsagePct = 0;

      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          storageUsageBytes = estimate.usage || 0;
          storageQuotaBytes = estimate.quota || 0;
          storageUsagePct = storageQuotaBytes > 0
            ? (storageUsageBytes / storageQuotaBytes) * 100
            : 0;
        } catch (storageErr) {
          console.warn('Storage API not available:', storageErr);
        }
      }

      // DuckDB metrics
      const db = getDuckDB();
      if (!db) {
        throw new Error('Database not initialized');
      }

      const conn = await db.connect();

      try {
        // Total event count
        const totalResult = await conn.query('SELECT COUNT(*) as cnt FROM events');
        const totalEvents = Number(totalResult.toArray()[0].cnt);

        // Events by type
        const typeResult = await conn.query(`
          SELECT event_type, COUNT(*) as cnt
          FROM events
          GROUP BY event_type
          ORDER BY cnt DESC
        `);
        const eventsByType = typeResult.toArray().map(row => ({
          event_type: row.event_type as string,
          count: Number(row.cnt),
        }));

        const queryTimeMs = performance.now() - queryStartTime;

        if (mounted) {
          setMetrics({
            storageUsageBytes,
            storageQuotaBytes,
            storageUsagePct,
            totalEvents,
            eventsByType,
            queryTimeMs,
            isLoading: false,
            error: null,
          });
        }
      } finally {
        await conn.close();
      }
    } catch (error) {
      if (mounted) {
        setMetrics((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return { ...metrics, refresh: loadMetrics };
}
