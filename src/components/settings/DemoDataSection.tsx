import { useState } from 'react';
import { loadDemoData } from '../../db/demo-data';
import { clearHistoricalData } from '../../utils/clearAllData';
import { getDuckDB, checkpoint } from '../../db/duckdb-init';
import { Dialog } from '../ui/Dialog';

interface DemoDataSectionProps {
  eventCount: number;
}

export function DemoDataSection({ eventCount }: DemoDataSectionProps) {
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const executeImportDemoData = async () => {
    setShowImportDialog(false);
    setIsLoadingDemo(true);

    try {
      // Clear existing events (keep table structure intact)
      const db = getDuckDB();
      if (db) {
        const conn = await db.connect();
        try {
          await conn.query('DELETE FROM events');
        } finally {
          await conn.close();
        }
      }

      // Clear localStorage
      const keysToRemove = [
        'gymlog-workout',
        'gymlog-rotations',
        'gymlog-backup',
        'gymlog-progression-alerts',
        'gymlog-volume-thresholds',
        'gymlog-analytics-timerange',
      ];

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }

      // Load demo data
      await loadDemoData();

      // Checkpoint
      await checkpoint();

      // Reload page to show new data
      window.location.reload();
    } catch (err) {
      console.error('Failed to load demo data:', err);
      alert('Failed to load demo data. Please try again.');
      setIsLoadingDemo(false);
    }
  };

  const handleLoadDemoData = () => {
    if (eventCount > 0) {
      setShowImportDialog(true);
    } else {
      executeImportDemoData();
    }
  };

  const handleClearHistoricalData = async () => {
    setShowClearDialog(false);
    await clearHistoricalData();
  };

  return (
    <div className="space-y-4">
        {/* Load Demo Data */}
        <div className="bg-bg-secondary rounded-xl p-4">
          <h3 className="font-medium text-text-primary mb-1">Load Demo Data</h3>
          <p className="text-sm text-text-secondary mb-3">
            Load 6 weeks of sample workouts to explore all features
          </p>
          <button
            data-testid="btn-load-demo"
            onClick={handleLoadDemoData}
            disabled={isLoadingDemo}
            className="w-full py-3 px-4 bg-gradient-to-r from-[oklch(0.65_0.12_60)] to-[oklch(0.60_0.10_45)] hover:opacity-90 disabled:bg-bg-tertiary disabled:bg-none text-white rounded-xl font-medium transition-all"
          >
            {isLoadingDemo ? 'Loading demo data...' : 'Import Demo Data'}
          </button>
        </div>

        {/* Clear Historical Data */}
        <div className="bg-error/10 border border-error/30 rounded-xl p-4">
          <h3 className="font-medium text-error mb-1">Clear Historical Data</h3>
          <p className="text-sm text-error/80 mb-3">
            Remove all workout logs and plans. Exercises and gyms will be kept.
          </p>
          <button
            data-testid="btn-clear-data"
            onClick={() => setShowClearDialog(true)}
            className="w-full py-3 px-4 bg-error/20 hover:bg-error/30 text-error border border-error/30 rounded-xl font-medium transition-colors"
          >
            Clear Historical Data
          </button>
        </div>
      </div>

      {/* Import confirmation dialog */}
      <Dialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        title="Replace All Data?"
      >
        <p>This will replace all your data with demo data. This cannot be undone.</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowImportDialog(false)}
            className="flex-1 py-2.5 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={executeImportDemoData}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[oklch(0.65_0.12_60)] to-[oklch(0.60_0.10_45)] hover:opacity-90 text-white rounded-xl font-medium transition-all"
          >
            Confirm
          </button>
        </div>
      </Dialog>

      {/* Clear confirmation dialog */}
      <Dialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        title="Clear Historical Data?"
      >
        <p>This will delete all workout data. Exercises and gyms will be kept. Cannot be undone.</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowClearDialog(false)}
            className="flex-1 py-2.5 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClearHistoricalData}
            className="flex-1 py-2.5 px-4 bg-error hover:bg-error/90 text-white rounded-xl font-medium transition-colors"
          >
            Clear Data
          </button>
        </div>
      </Dialog>
    </div>
  );
}
