import { useRef, useState } from 'react';
import { useBackupExport } from '../../hooks/useBackupExport';
import { useBackupImport } from '../../hooks/useBackupImport';
import { useBackupStore } from '../../stores/useBackupStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDuckDB } from '../../hooks/useDuckDB';
import { Input } from '../ui/Input';
import { RotationSection } from '../settings/RotationSection';
import { DemoDataSection } from '../settings/DemoDataSection';
import { ObservabilitySection } from '../settings/ObservabilitySection';
import { DataQualitySection } from '../settings/DataQualitySection';

export function BackupSettings() {
  const { exportBackup, isExporting, error: exportError } = useBackupExport();
  const { importBackup, isImporting, lastResult } = useBackupImport();
  const lastBackupDate = useBackupStore((state) => state.lastBackupDate);
  const { eventCount } = useDuckDB();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workout preferences from store
  const weightUnit = useWorkoutStore((state) => state.weightUnit);
  const setWeightUnit = useWorkoutStore((state) => state.setWeightUnit);
  const defaultRestSeconds = useWorkoutStore((state) => state.defaultRestSeconds);
  const setDefaultRestSeconds = useWorkoutStore((state) => state.setDefaultRestSeconds);
  const soundEnabled = useWorkoutStore((state) => state.soundEnabled);
  const setSoundEnabled = useWorkoutStore((state) => state.setSoundEnabled);

  const [restInput, setRestInput] = useState(defaultRestSeconds.toString());

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRestBlur = () => {
    const val = Math.min(600, Math.max(30, parseInt(restInput, 10) || 120));
    setRestInput(val.toString());
    setDefaultRestSeconds(val);
  };

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
      {/* Workout Rotations */}
      <RotationSection />

      <hr className="border-border-primary" />

      {/* Workout Preferences */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-text-primary">Workout Preferences</h2>

        <div className="bg-bg-secondary rounded-lg p-4 space-y-5">
          {/* Weight Unit */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">Weight Unit</label>
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => setWeightUnit('kg')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  weightUnit === 'kg'
                    ? 'bg-accent text-black'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setWeightUnit('lbs')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  weightUnit === 'lbs'
                    ? 'bg-accent text-black'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          {/* Default Rest Timer */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-text-primary">Default Rest Timer</label>
              <p className="text-xs text-text-secondary mt-0.5">{formatTime(parseInt(restInput, 10) || 120)}</p>
            </div>
            <div className="w-20">
              <Input
                type="number"
                min="30"
                max="600"
                step="15"
                value={restInput}
                onChange={(e) => setRestInput(e.target.value)}
                onBlur={handleRestBlur}
                className="text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">Sound on Timer Complete</label>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-accent' : 'bg-bg-tertiary'
              }`}
              aria-label="Toggle sound notifications"
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <hr className="border-border-primary" />

      {/* Data Backup */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Data Backup</h2>

        {/* Last backup info */}
        <div className="text-sm text-text-secondary mb-4">
          {lastBackupDate
            ? `Last backup: ${new Date(lastBackupDate).toLocaleDateString()}`
            : 'No backups yet'}
          {' · '}<span data-testid="event-count">{eventCount} events</span>
        </div>

        {/* Export button */}
        <button
          data-testid="btn-export-backup"
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
          data-testid="file-input-parquet"
          type="file"
          accept=".parquet"
          onChange={handleFileSelect}
          ref={fileInputRef}
          className="hidden"
        />

        <button
          data-testid="btn-import-backup"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-full py-3 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 disabled:bg-bg-tertiary/50 rounded-lg font-medium transition-colors"
        >
          {isImporting ? 'Importing...' : 'Import Backup'}
        </button>

        {/* Import result feedback */}
        {lastResult && (
          <div data-testid="import-result" className={`mt-4 p-3 rounded-lg ${lastResult.success ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {lastResult.success
              ? `Imported ${lastResult.eventsImported} events (${lastResult.eventsSkipped} duplicates skipped)`
              : lastResult.error}
          </div>
        )}
      </section>

      <hr className="border-border-primary" />

      {/* Demo Data & Clear All */}
      <DemoDataSection eventCount={eventCount} />

      <hr className="border-border-primary" />

      {/* System Observability */}
      <ObservabilitySection />

      <hr className="border-border-primary" />

      {/* Data Quality */}
      <DataQualitySection />
    </div>
  );
}
