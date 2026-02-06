import { useState, useEffect, useCallback } from 'react';
import type { LoggedSet } from '../../types/workout-session';
import { useLastSessionData } from '../../hooks/useLastSessionData';
import { useExerciseMax } from '../../hooks/useHistory';
import { SetRow } from './SetRow';
import { Button } from '../ui/Button';

interface SetData {
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
}

interface SetGridProps {
  exerciseId: string;
  originalExerciseId: string;
  planSetCount: number;
  gymId: string;
  sets: LoggedSet[];
  onSaveSet: (data: SetData, index: number) => void;
  onRemoveRow: (index: number) => void;
}

export function SetGrid({
  exerciseId: _exerciseId, // eslint-disable-line @typescript-eslint/no-unused-vars
  originalExerciseId,
  planSetCount,
  gymId,
  sets,
  onSaveSet,
  onRemoveRow,
}: SetGridProps) {
  // Fetch ghost data using original exercise ID (before any substitution)
  const { data: ghostData, previousData, isLoading } = useLastSessionData(
    originalExerciseId,
    gymId
  );

  // Get historical max for inline PR detection
  const maxData = useExerciseMax(originalExerciseId);

  // Initialize rows state based on plan set count
  const [rows, setRows] = useState<SetData[]>([]);

  // Initialize rows when component mounts or dependencies change
  useEffect(() => {
    const initialRows: SetData[] = [];

    for (let i = 0; i < planSetCount; i++) {
      // Check if we have a logged set for this row index
      const loggedSet = sets[i];
      if (loggedSet) {
        initialRows.push({
          weight_kg: loggedSet.weight_kg,
          reps: loggedSet.reps,
          rir: loggedSet.rir,
        });
      } else {
        // Empty row
        initialRows.push({
          weight_kg: null,
          reps: null,
          rir: null,
        });
      }
    }

    setRows(initialRows); // eslint-disable-line react-hooks/set-state-in-effect
  }, [planSetCount, sets]);

  const handleRowChange = useCallback((data: SetData, index: number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  }, []);

  const handleRowBlur = (index: number) => {
    // Auto-save on blur
    onSaveSet(rows[index], index);
  };

  const handleAddSet = () => {
    setRows((prev) => [
      ...prev,
      { weight_kg: null, reps: null, rir: null },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    onRemoveRow(index);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div data-testid="loading-ghost-data" className="text-text-secondary text-sm">Loading last session...</div>
      </div>
    );
  }

  // First-time hint
  const showFirstTimeHint = !ghostData && sets.length === 0;

  return (
    <div className="space-y-4">
      {showFirstTimeHint && (
        <div data-testid="first-time-hint" className="text-text-muted text-sm italic text-center py-2">
          First time - no previous data
        </div>
      )}

      {/* Set rows */}
      <div className="space-y-2">
        {rows.map((row, index) => {
          // Get ghost data for this row index (1-indexed in data, 0-indexed in array)
          const setGhostData = ghostData?.[index] ?? null;
          // Get same set index from previous session for delta comparison
          const previousSetGhostData = previousData?.[index] ?? null;

          return (
            <SetRow
              key={index}
              setNumber={index + 1}
              ghostData={setGhostData}
              previousGhostData={previousSetGhostData}
              initialData={row}
              maxData={maxData}
              rowIndex={index}
              onChange={handleRowChange}
              onBlur={() => handleRowBlur(index)}
              onRemove={() => handleRemoveRow(index)}
            />
          );
        })}
      </div>

      {/* Add Set button */}
      <Button
        data-testid="btn-add-set"
        variant="secondary"
        size="md"
        onClick={handleAddSet}
        className="w-full"
      >
        + Add Set
      </Button>
    </div>
  );
}
