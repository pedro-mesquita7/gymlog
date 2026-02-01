import { useState } from 'react';
import { useComparisonStats } from '../../hooks/useComparisonStats';
import { ExerciseMultiSelect } from './ExerciseMultiSelect';
import { ComparisonStatCard } from './ComparisonStatCard';
import type { Exercise } from '../../types/database';
import type { ProgressionStatus } from '../../types/analytics';

interface ComparisonSectionProps {
  days: number | null;
  exercises: Exercise[];
  progressionData: ProgressionStatus[];
}

/**
 * Orchestrator component for exercise comparison feature.
 * Wires multi-select picker, useComparisonStats hook, and stat card grid.
 */
export function ComparisonSection({ days, exercises, progressionData }: ComparisonSectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error } = useComparisonStats(
    selectedIds.length >= 2 ? selectedIds : [],
    days,
    progressionData
  );

  return (
    <div data-testid="comparison-section" className="space-y-4">
      <ExerciseMultiSelect
        exercises={exercises}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
      />

      {selectedIds.length < 2 && (
        <p className="text-sm text-text-muted text-center py-4">
          Select at least 2 exercises to compare
        </p>
      )}

      {selectedIds.length >= 2 && isLoading && (
        <p className="text-center py-8 text-text-muted">Loading comparison...</p>
      )}

      {selectedIds.length >= 2 && error && (
        <p className="text-center py-8 text-error">{error}</p>
      )}

      {selectedIds.length >= 2 && !isLoading && !error && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {data.map(stat => (
            <ComparisonStatCard key={stat.exerciseId} stat={stat} />
          ))}
        </div>
      )}
    </div>
  );
}
