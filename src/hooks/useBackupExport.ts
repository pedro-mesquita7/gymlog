import { useState } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { useBackupStore } from '../stores/useBackupStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';

interface UseBackupExport {
  exportBackup: () => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

export function useBackupExport(): UseBackupExport {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetBackupCount = useBackupStore((state) => state.resetBackupCount);
  const session = useWorkoutStore((state) => state.session);

  const exportBackup = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Warn if there's an active workout
      if (session) {
        console.warn('Exporting backup while workout is active. Active workout data will be included.');
      }

      const db = getDuckDB();
      if (!db) {
        throw new Error('DuckDB not initialized');
      }

      const conn = await db.connect();

      try {
        // Export all events to Parquet with zstd compression
        await conn.query(`
          COPY (SELECT * FROM events ORDER BY _created_at)
          TO 'backup.parquet'
          (FORMAT parquet, COMPRESSION zstd, COMPRESSION_LEVEL 3)
        `);

        // Extract the file from DuckDB's virtual filesystem
        const buffer = await db.copyFileToBuffer('backup.parquet');

        // Create a downloadable blob
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        // Trigger download with timestamped filename
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const link = document.createElement('a');
        link.href = url;
        link.download = `gymlog-backup-${timestamp}.parquet`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL to prevent memory leak
        URL.revokeObjectURL(url);

        // Clean up the file from DuckDB
        await db.dropFile('backup.parquet');

        // Reset backup counter on success
        resetBackupCount();
      } finally {
        await conn.close();
      }
    } catch (err) {
      console.error('Failed to export backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportBackup, isExporting, error };
}
