import { useState, useEffect, useCallback } from 'react';
import { initDuckDB } from '../db/duckdb-init';
import { getEventCount } from '../db/queries';
import type { DatabaseStatus } from '../types/database';

export function useDuckDB() {
  const [status, setStatus] = useState<DatabaseStatus>({
    isInitialized: false,
    isConnected: false,
    isPersistent: false,
    error: null,
  });
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { isPersistent } = await initDuckDB();

        if (mounted) {
          setStatus({
            isInitialized: true,
            isConnected: true,
            isPersistent,
            error: null,
          });

          // Get initial event count
          const count = await getEventCount();
          setEventCount(count);
        }
      } catch (error) {
        if (mounted) {
          setStatus({
            isInitialized: false,
            isConnected: false,
            isPersistent: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshEventCount = useCallback(async () => {
    try {
      const count = await getEventCount();
      setEventCount(count);
    } catch (error) {
      console.error('Failed to refresh event count:', error);
    }
  }, []);

  return { status, eventCount, refreshEventCount };
}
