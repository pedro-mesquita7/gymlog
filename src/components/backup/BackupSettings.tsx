import { useRef, useState } from 'react';
import { useBackupExport } from '../../hooks/useBackupExport';
import { useBackupImport } from '../../hooks/useBackupImport';
import { useBackupStore } from '../../stores/useBackupStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRotationStore } from '../../stores/useRotationStore';
import { useDuckDB } from '../../hooks/useDuckDB';
import { useGyms } from '../../hooks/useGyms';
import { Input } from '../ui/Input';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { RotationSection } from '../settings/RotationSection';
import { DemoDataSection } from '../settings/DemoDataSection';
import { ObservabilitySection } from '../settings/ObservabilitySection';
import { DataQualitySection } from '../settings/DataQualitySection';
import { ToonExportSection } from '../settings/ToonExportSection';

export function BackupSettings() {
  const { exportBackup, isExporting, error: exportError } = useBackupExport();
  const { importBackup, isImporting, lastResult } = useBackupImport();
  const lastBackupDate = useBackupStore((state) => state.lastBackupDate);
  const { eventCount } = useDuckDB();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Gym (extracted from RotationSection)
  const defaultGymId = useRotationStore((state) => state.defaultGymId);
  const setDefaultGym = useRotationStore((state) => state.setDefaultGym);
  const { gyms } = useGyms();

  // Workout preferences from store
  const weightUnit = useWorkoutStore((state) => state.weightUnit);
  const setWeightUnit = useWorkoutStore((state) => state.setWeightUnit);
  const defaultRestSeconds = useWorkoutStore((state) => state.defaultRestSeconds);
  const setDefaultRestSeconds = useWorkoutStore((state) => state.setDefaultRestSeconds);
  const soundEnabled = useWorkoutStore((state) => state.soundEnabled);
  const setSoundEnabled = useWorkoutStore((state) => state.setSoundEnabled);

  const [restInput, setRestInput] = useState((defaultRestSeconds / 60).toString());

  const handleRestBlur = () => {
    const minutes = parseFloat(restInput) || 2;
    const clamped = Math.min(10, Math.max(0.5, minutes));
    const seconds = Math.round(clamped * 60);
    setRestInput((seconds / 60).toString());
    setDefaultRestSeconds(seconds);
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
      {/* === Always Visible: Top Settings === */}

      {/* 1. Workout Rotations */}
      <RotationSection />

      {/* 2. Default Gym */}
      {gyms.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Default Gym</h2>
          <div className="bg-bg-secondary rounded-2xl p-4">
            <select
              id="default-gym"
              value={defaultGymId || ''}
              onChange={(e) => setDefaultGym(e.target.value || null)}
              className="w-full px-3 py-2 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">No default gym</option>
              {gyms.map((gym) => (
                <option key={gym.gym_id} value={gym.gym_id}>
                  {gym.name} {gym.location ? `(${gym.location})` : ''}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* 3. TOON Export */}
      <ToonExportSection />

      {/* === Collapsible: Less-used Settings === */}
      <hr className="border-border-primary" />

      {/* 4. Workout Preferences */}
      <CollapsibleSection title="Workout Preferences">
        <div className="bg-bg-secondary rounded-2xl p-4 space-y-5">
          {/* Weight Unit */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">Weight Unit</label>
            <div className="flex rounded-xl overflow-hidden">
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
              <p className="text-xs text-text-secondary mt-0.5">{Math.round(defaultRestSeconds / 60 * 10) / 10} min</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16">
                <Input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={restInput}
                  onChange={(e) => setRestInput(e.target.value)}
                  onBlur={handleRestBlur}
                  className="text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-xs text-text-muted">min</span>
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
      </CollapsibleSection>

      {/* 5. Data Backup */}
      <CollapsibleSection title="Data Backup">
        <section>
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
            className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-bg-tertiary rounded-xl font-medium transition-colors"
          >
            {isExporting ? 'Exporting...' : 'Export Backup'}
          </button>

          {exportError && (
            <p className="mt-2 text-sm text-error">{exportError}</p>
          )}
        </section>
      </CollapsibleSection>

      {/* 6. Restore from Backup */}
      <CollapsibleSection title="Restore from Backup">
        <section>
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
            className="w-full py-3 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 disabled:bg-bg-tertiary/50 rounded-xl font-medium transition-colors"
          >
            {isImporting ? 'Importing...' : 'Import Backup'}
          </button>

          {/* Import result feedback */}
          {lastResult && (
            <div data-testid="import-result" className={`mt-4 p-3 rounded-xl ${lastResult.success ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
              {lastResult.success
                ? `Imported ${lastResult.eventsImported} events (${lastResult.eventsSkipped} duplicates skipped)`
                : lastResult.error}
            </div>
          )}
        </section>
      </CollapsibleSection>

      {/* 7. Demo Data & Reset */}
      <CollapsibleSection title="Demo Data & Reset">
        <DemoDataSection eventCount={eventCount} />
      </CollapsibleSection>

      {/* 8. System Observability */}
      <CollapsibleSection title="System Observability">
        <ObservabilitySection />
      </CollapsibleSection>

      {/* 9. Data Quality */}
      <CollapsibleSection title="Data Quality">
        <DataQualitySection />
      </CollapsibleSection>
    </div>
  );
}
