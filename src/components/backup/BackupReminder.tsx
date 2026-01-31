import { useBackupStore } from '../../stores/useBackupStore';
import { useBackupExport } from '../../hooks/useBackupExport';

export function BackupReminder() {
  const workoutsSinceBackup = useBackupStore((state) => state.workoutsSinceBackup);
  const dismissReminder = useBackupStore((state) => state.dismissReminder);
  const { exportBackup, isExporting } = useBackupExport();

  const handleExport = async () => {
    await exportBackup();
  };

  return (
    <div role="alert" className="bg-warning/10 border-b border-warning/30">
      <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Warning icon */}
          <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-warning">
            {workoutsSinceBackup} workouts since last backup.
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="underline ml-1 hover:text-warning/80 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Back up now'}
            </button>
          </p>
        </div>
        <button
          onClick={dismissReminder}
          aria-label="Dismiss reminder"
          className="text-warning hover:text-warning/80 p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
