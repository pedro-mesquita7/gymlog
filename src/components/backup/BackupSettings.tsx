import { useRef } from 'react';
import { useBackupExport } from '../../hooks/useBackupExport';
import { useBackupImport } from '../../hooks/useBackupImport';
import { useBackupStore } from '../../stores/useBackupStore';
import { useDuckDB } from '../../hooks/useDuckDB';

export function BackupSettings() {
  const { exportBackup, isExporting, error: exportError } = useBackupExport();
  const { importBackup, isImporting, lastResult } = useBackupImport();
  const lastBackupDate = useBackupStore((state) => state.lastBackupDate);
  const { eventCount } = useDuckDB();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importBackup(file);
      // Clear file input to allow re-selecting the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4">Data Backup</h2>

        {/* Last backup info */}
        <div className="text-sm text-text-secondary mb-4">
          {lastBackupDate
            ? `Last backup: ${new Date(lastBackupDate).toLocaleDateString()}`
            : 'No backups yet'}
          {' · '}{eventCount} events
        </div>

        {/* Export button */}
        <button
          onClick={exportBackup}
          disabled={isExporting}
          className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-bg-tertiary rounded-lg font-medium transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export Backup'}
        </button>

        {exportError && (
          <p className="mt-2 text-sm text-error">{exportError}</p>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Restore from Backup</h3>

        {/* File input */}
        <input
          type="file"
          accept=".parquet"
          onChange={handleFileSelect}
          ref={fileInputRef}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-full py-3 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 disabled:bg-bg-tertiary/50 rounded-lg font-medium transition-colors"
        >
          {isImporting ? 'Importing...' : 'Import Backup'}
        </button>

        {/* Import result feedback */}
        {lastResult && (
          <div className={`mt-4 p-3 rounded-lg ${lastResult.success ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {lastResult.success
              ? `Imported ${lastResult.eventsImported} events (${lastResult.eventsSkipped} duplicates skipped)`
              : lastResult.error}
          </div>
        )}
      </section>
    </div>
  );
}
