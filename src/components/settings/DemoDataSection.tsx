import { useState } from 'react';
import { loadDemoData } from '../../db/demo-data';
import { clearAllData } from '../../utils/clearAllData';
import { getDuckDB, checkpoint } from '../../db/duckdb-init';

interface DemoDataSectionProps {
  eventCount: number;
}

export function DemoDataSection({ eventCount }: DemoDataSectionProps) {
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleLoadDemoData = async () => {
    // Warn if there's existing data
    if (eventCount > 0) {
      const confirmed = window.confirm(
        'This will replace all existing data. Continue?'
      );
      if (!confirmed) return;
    }

    setIsLoadingDemo(true);

    try {
      // Clear existing data (but don't reload yet)
      const db = getDuckDB();
      if (db) {
        const conn = await db.connect();
        try {
          await conn.query('DROP TABLE IF EXISTS events');
        } finally {
          await conn.close();
        }
      }

      // Clear OPFS files
      try {
        const root = await navigator.storage.getDirectory();
        for (const name of ['gymlog.db', 'gymlog.db.wal']) {
          try {
            await root.removeEntry(name);
          } catch {
            // File may not exist, ignore
          }
        }
      } catch (err) {
        console.warn('Failed to clear OPFS:', err);
      }

      // Clear localStorage
      const keysToRemove = [
        'gymlog-workout',
        'gymlog-rotations',
        'gymlog-backup',
        'gymlog-progression-alerts',
        'gymlog-volume-thresholds',
      ];

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }

      // Re-initialize database
      const { initDuckDB } = await import('../../db/duckdb-init');
      await initDuckDB();

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

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure? This cannot be undone.'
    );
    if (!confirmed) return;

    await clearAllData();
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-text-primary">Demo & Data Management</h2>

      <div className="space-y-4">
        {/* Load Demo Data */}
        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-medium text-text-primary mb-1">Load Demo Data</h3>
          <p className="text-sm text-text-secondary mb-3">
            Load 6 weeks of sample workouts to explore all features
          </p>
          <button
            onClick={handleLoadDemoData}
            disabled={isLoadingDemo}
            className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-bg-tertiary rounded-lg font-medium transition-colors"
          >
            {isLoadingDemo ? 'Loading demo data...' : 'Load Demo Data'}
          </button>
        </div>

        {/* Clear All Data */}
        <div className="bg-error/10 border border-error/30 rounded-lg p-4">
          <h3 className="font-medium text-error mb-1">Clear All Data</h3>
          <p className="text-sm text-error/80 mb-3">
            Remove all workouts, exercises, gyms, and settings
          </p>
          <button
            onClick={handleClearAllData}
            className="w-full py-3 px-4 bg-error/20 hover:bg-error/30 text-error border border-error/30 rounded-lg font-medium transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </section>
  );
}
