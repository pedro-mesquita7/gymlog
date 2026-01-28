import { useState, useCallback } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { getDuckDB } from '../db/duckdb-init';

export interface ImportResult {
  success: boolean;
  eventsImported: number;
  eventsSkipped: number;  // duplicates
  error?: string;
}

interface UseBackupImport {
  importBackup: (file: File) => Promise<ImportResult>;
  isImporting: boolean;
  lastResult: ImportResult | null;
}

export function useBackupImport(): UseBackupImport {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const importBackup = useCallback(async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    const db = getDuckDB();

    if (!db) {
      const result: ImportResult = {
        success: false,
        eventsImported: 0,
        eventsSkipped: 0,
        error: 'Database not initialized',
      };
      setLastResult(result);
      setIsImporting(false);
      return result;
    }

    try {
      // Pre-validation: Check file extension
      if (!file.name.toLowerCase().endsWith('.parquet')) {
        const result: ImportResult = {
          success: false,
          eventsImported: 0,
          eventsSkipped: 0,
          error: 'Please select a Parquet backup file (.parquet)',
        };
        setLastResult(result);
        return result;
      }

      // Register file with DuckDB
      await db.registerFileHandle(
        'import.parquet',
        file,
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
        true  // directIO
      );

      const conn = await db.connect();

      try {
        // Schema validation
        const schemaResult = await conn.query(`
          SELECT column_name FROM (DESCRIBE SELECT * FROM 'import.parquet')
        `);
        const columns = schemaResult.toArray().map(row => row.column_name as string);

        const requiredColumns = ['_event_id', '_created_at', 'event_type', 'payload'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));

        if (missingColumns.length > 0) {
          const result: ImportResult = {
            success: false,
            eventsImported: 0,
            eventsSkipped: 0,
            error: `Invalid backup file: missing required columns (${missingColumns.join(', ')})`,
          };
          setLastResult(result);
          return result;
        }

        // Count total events in import file
        const countResult = await conn.query(`
          SELECT COUNT(*) as total FROM 'import.parquet'
        `);
        const totalInFile = Number(countResult.toArray()[0].total);

        // Get count before import
        const beforeResult = await conn.query(`
          SELECT COUNT(*) as count FROM events
        `);
        const beforeCount = Number(beforeResult.toArray()[0].count);

        // Import with duplicate skip
        await conn.query(`
          INSERT INTO events (_event_id, _created_at, event_type, payload)
          SELECT _event_id, _created_at, event_type, payload
          FROM 'import.parquet'
          WHERE _event_id NOT IN (SELECT _event_id FROM events)
        `);

        // Get count after import
        const afterResult = await conn.query(`
          SELECT COUNT(*) as count FROM events
        `);
        const afterCount = Number(afterResult.toArray()[0].count);

        const eventsImported = afterCount - beforeCount;
        const eventsSkipped = totalInFile - eventsImported;

        const result: ImportResult = {
          success: true,
          eventsImported,
          eventsSkipped,
        };
        setLastResult(result);
        return result;
      } finally {
        await conn.close();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      const result: ImportResult = {
        success: false,
        eventsImported: 0,
        eventsSkipped: 0,
        error: errorMessage.includes('Parquet') || errorMessage.includes('parquet')
          ? 'Not a valid Parquet file'
          : errorMessage,
      };
      setLastResult(result);
      return result;
    } finally {
      // Cleanup: Drop the registered file
      try {
        await db.dropFile('import.parquet');
      } catch {
        // Ignore cleanup errors
      }
      setIsImporting(false);
    }
  }, []);

  return {
    importBackup,
    isImporting,
    lastResult,
  };
}
