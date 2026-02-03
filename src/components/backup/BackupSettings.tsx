import { useRef, useState, useEffect, useCallback } from 'react';
import { useBackupExport } from '../../hooks/useBackupExport';
import { useBackupImport } from '../../hooks/useBackupImport';
import { useBackupStore } from '../../stores/useBackupStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRotationStore } from '../../stores/useRotationStore';
import { useDuckDB } from '../../hooks/useDuckDB';
import { useGyms } from '../../hooks/useGyms';
import { exportLastWorkoutToon } from '../../services/toon-export';
import { Input } from '../ui/Input';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { RotationSection } from '../settings/RotationSection';
import { WarmupTierEditor } from '../settings/WarmupTierEditor';
import { DemoDataSection } from '../settings/DemoDataSection';
import { ObservabilitySection } from '../settings/ObservabilitySection';
import { DataQualitySection } from '../settings/DataQualitySection';

export function BackupSettings() {
  const { exportBackup, isExporting, error: exportError } = useBackupExport();
  const { importBackup, isImporting, lastResult } = useBackupImport();
  const lastBackupDate = useBackupStore((state) => state.lastBackupDate);
  const { eventCount } = useDuckDB();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Gym
  const defaultGymId = useRotationStore((state) => state.defaultGymId);
  const setDefaultGym = useRotationStore((state) => state.setDefaultGym);
  const { gyms } = useGyms();

  // Active Rotation
  const rotations = useRotationStore((state) => state.rotations);
  const activeRotationId = useRotationStore((state) => state.activeRotationId);
  const setActiveRotation = useRotationStore((state) => state.setActiveRotation);

  // Developer Mode
  const developerMode = useRotationStore((state) => state.developerMode);
  const setDeveloperMode = useRotationStore((state) => state.setDeveloperMode);

  // Workout preferences from store
  const weightUnit = useWorkoutStore((state) => state.weightUnit);
  const setWeightUnit = useWorkoutStore((state) => state.setWeightUnit);
  const defaultRestSeconds = useWorkoutStore((state) => state.defaultRestSeconds);
  const setDefaultRestSeconds = useWorkoutStore((state) => state.setDefaultRestSeconds);
  const soundEnabled = useWorkoutStore((state) => state.soundEnabled);
  const setSoundEnabled = useWorkoutStore((state) => state.setSoundEnabled);

  const [restInput, setRestInput] = useState((defaultRestSeconds / 60).toString());

  // Export Data state
  const [exportStatus, setExportStatus] = useState<'idle' | 'copied' | 'no-data'>('idle');
  const [isExportingToon, setIsExportingToon] = useState(false);
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current);
    };
  }, []);

  const handleExportLastWorkout = useCallback(async () => {
    setIsExportingToon(true);
    try {
      const result = await exportLastWorkoutToon();
      if (!result) {
        setExportStatus('no-data');
        if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current);
        exportTimeoutRef.current = setTimeout(() => setExportStatus('idle'), 2000);
        return;
      }
      await navigator.clipboard.writeText(result);
      setExportStatus('copied');
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current);
      exportTimeoutRef.current = setTimeout(() => setExportStatus('idle'), 2000);
    } catch {
      setExportStatus('no-data');
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current);
      exportTimeoutRef.current = setTimeout(() => setExportStatus('idle'), 2000);
    } finally {
      setIsExportingToon(false);
    }
  }, []);

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

  // Find active rotation for position display
  const activeRotation = rotations.find((r) => r.rotation_id === activeRotationId);

  const exportButtonText = exportStatus === 'copied'
    ? 'Copied!'
    : exportStatus === 'no-data'
      ? 'No data'
      : 'Export Last Workout';

  return (
    <div className="space-y-8">
      {/* === Top Level: Daily-use Settings === */}

      {/* 1. Default Gym */}
      {gyms.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Default Gym</h2>
          <div className="bg-bg-secondary rounded-xl p-4">
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

      {/* 2. Active Rotation */}
      {rotations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Active Rotation</h2>
          <div className="bg-bg-secondary rounded-xl p-4">
            <select
              id="active-rotation"
              value={activeRotationId || ''}
              onChange={(e) => setActiveRotation(e.target.value || null)}
              className="w-full px-3 py-2 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">No active rotation</option>
              {rotations.map((rotation) => (
                <option key={rotation.rotation_id} value={rotation.rotation_id}>
                  {rotation.name}
                </option>
              ))}
            </select>
            {activeRotation && activeRotation.template_ids.length > 0 && (
              <p className="text-xs text-text-secondary mt-2">
                Position {activeRotation.current_position + 1}/{activeRotation.template_ids.length} plans
              </p>
            )}
          </div>
        </section>
      )}

      {/* 3. Export Data */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-text-primary">Export Data</h2>
        <button
          onClick={handleExportLastWorkout}
          disabled={isExportingToon}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            exportStatus === 'copied'
              ? 'bg-success text-white'
              : exportStatus === 'no-data'
                ? 'bg-bg-tertiary text-text-muted'
                : 'bg-accent hover:bg-accent/90 disabled:bg-bg-tertiary'
          }`}
        >
          {exportButtonText}
        </button>
        <p className="text-xs text-text-secondary mt-2">
          Copy last workout in TOON format for AI analysis
        </p>
      </section>

      {/* === Collapsible: Less-used Settings === */}
      <hr className="border-border-primary" />

      {/* 4. Workout Preferences */}
      <CollapsibleSection title="Workout Preferences">
        <div className="bg-bg-secondary rounded-xl p-4 space-y-5">
          {/* Weight Unit */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">Weight Unit</label>
            <div className="flex rounded-xl overflow-hidden">
              <button
                onClick={() => setWeightUnit('kg')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  weightUnit === 'kg'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setWeightUnit('lbs')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  weightUnit === 'lbs'
                    ? 'bg-accent text-white'
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

          <hr className="border-border-primary/30" />

          {/* Warmup Tiers */}
          <WarmupTierEditor />
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

      {/* 7. Manage Rotations */}
      <CollapsibleSection title="Manage Rotations">
        <RotationSection />
      </CollapsibleSection>

      {/* === Developer Mode === */}
      <hr className="border-border-primary" />

      {/* 8. Developer Mode Toggle */}
      <div className="flex items-center justify-between px-1">
        <label className="text-sm text-text-primary">Developer Mode</label>
        <button
          onClick={() => setDeveloperMode(!developerMode)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            developerMode ? 'bg-accent' : 'bg-bg-tertiary'
          }`}
          aria-label="Toggle developer mode"
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              developerMode ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* 9-11. Debug Sections (visible only in Developer Mode) */}
      {developerMode && (
        <>
          <CollapsibleSection title="System Observability">
            <ObservabilitySection />
          </CollapsibleSection>

          <CollapsibleSection title="Data Quality">
            <DataQualitySection />
          </CollapsibleSection>

          <CollapsibleSection title="Demo Data & Reset">
            <DemoDataSection eventCount={eventCount} />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}
