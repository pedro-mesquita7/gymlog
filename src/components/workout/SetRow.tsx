import { useState, useEffect, useMemo } from 'react';
import { Input } from '../ui/Input';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import type { ExerciseMax } from '../../types/analytics';

interface GhostData {
  weight_kg: number;
  reps: number;
  rir: number | null;
}

interface SetData {
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
}

interface SetRowProps {
  setNumber: number;
  ghostData: GhostData | null;
  previousGhostData: GhostData | null;
  maxData: ExerciseMax | null;
  rowIndex: number;
  onChange: (data: SetData, index: number) => void;
  onBlur: () => void;
  onRemove: () => void;
  initialData?: SetData;
}

export function SetRow({
  setNumber,
  ghostData,
  previousGhostData,
  maxData,
  rowIndex,
  onChange,
  onBlur,
  onRemove,
  initialData,
}: SetRowProps) {
  const weightUnit = useWorkoutStore((state) => state.weightUnit);

  const [weightKg, setWeightKg] = useState<string>(
    initialData?.weight_kg?.toString() ?? ''
  );
  const [reps, setReps] = useState<string>(
    initialData?.reps?.toString() ?? ''
  );
  const [rir, setRir] = useState<string>(
    initialData?.rir?.toString() ?? ''
  );

  // Update parent on every change (exclude onChange from deps to prevent infinite loop)
  useEffect(() => {
    onChange({
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      reps: reps ? parseInt(reps, 10) : null,
      rir: rir ? parseInt(rir, 10) : null,
    }, rowIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightKg, reps, rir, rowIndex]);

  const handleBlur = () => {
    onBlur();
  };

  // Inline PR detection: compare current values against historical max
  const prStatus = useMemo(() => {
    const w = weightKg ? parseFloat(weightKg) : 0;
    const r = reps ? parseInt(reps, 10) : 0;
    if (w <= 0 || r <= 0) return null;

    const estimated1rm = w * (1 + r / 30.0);
    const isWeightPR = maxData?.max_weight === null || maxData?.max_weight === undefined || w > maxData.max_weight;
    const is1rmPR = maxData?.max_1rm === null || maxData?.max_1rm === undefined || estimated1rm > maxData.max_1rm;

    if (isWeightPR || is1rmPR) return { isWeightPR, is1rmPR };
    return null;
  }, [weightKg, reps, maxData]);

  // Calculate delta: last session (ghost) vs second-to-last session (previousGhost)
  const getDelta = (
    field: 'weight_kg' | 'reps' | 'rir'
  ): 'up' | 'down' | null => {
    if (!ghostData || !previousGhostData) return null;
    const current = ghostData[field];
    const previous = previousGhostData[field];
    if (current === null || previous === null) return null;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return null;
  };

  const weightDelta = getDelta('weight_kg');
  const repsDelta = getDelta('reps');
  const rirDelta = getDelta('rir');

  return (
    <div className="bg-bg-secondary rounded-xl p-2.5">
      {/* Single-line compact layout: set number + inputs + remove */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-medium text-text-primary flex-shrink-0">
          {setNumber}
        </div>

        {/* Input grid: 3 columns */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          {/* Weight */}
          <div className="relative">
            <Input
              data-testid={`set-${setNumber}-weight`}
              type="number"
              step="0.1"
              placeholder={ghostData ? (weightUnit === 'lbs' ? (ghostData.weight_kg * 2.20462).toFixed(1) : ghostData.weight_kg.toFixed(1)) : ''}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={handleBlur}
              className="py-2 px-2.5 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {weightDelta && (
              <span
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-xs ${
                  weightDelta === 'up' ? 'text-success' : 'text-text-muted'
                }`}
              >
                {weightDelta === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>

          {/* Reps */}
          <div className="relative">
            <Input
              data-testid={`set-${setNumber}-reps`}
              type="number"
              step="1"
              placeholder={ghostData ? ghostData.reps.toString() : ''}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={handleBlur}
              className="py-2 px-2.5 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {repsDelta && (
              <span
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-xs ${
                  repsDelta === 'up' ? 'text-success' : 'text-text-muted'
                }`}
              >
                {repsDelta === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>

          {/* RIR */}
          <div className="relative">
            <Input
              data-testid={`set-${setNumber}-rir`}
              type="number"
              step="1"
              min="0"
              max="5"
              placeholder={
                ghostData && ghostData.rir !== null
                  ? ghostData.rir.toString()
                  : ''
              }
              value={rir}
              onChange={(e) => setRir(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={handleBlur}
              className="py-2 px-2.5 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {rirDelta && ghostData && ghostData.rir !== null && (
              <span
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-xs ${
                  rirDelta === 'up' ? 'text-success' : 'text-text-muted'
                }`}
              >
                {rirDelta === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>

        <button
          data-testid={`set-${setNumber}-remove`}
          onClick={onRemove}
          className="text-text-muted hover:text-error transition-colors text-xs p-1 flex-shrink-0"
          aria-label="Remove set"
        >
          ✕
        </button>
      </div>

      {/* PR badge below the row */}
      {prStatus && (
        <div className="ml-8 mt-1">
          <span data-testid={`set-${setNumber}-pr`} className="bg-warning text-black text-xs px-2 py-0.5 rounded-full font-medium">
            {prStatus.isWeightPR && prStatus.is1rmPR ? 'PR!' : prStatus.isWeightPR ? 'Weight PR' : '1RM PR'}
          </span>
        </div>
      )}
    </div>
  );
}
