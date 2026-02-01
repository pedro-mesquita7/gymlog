import { useState, useMemo } from 'react';
import { NumberStepper } from '../ui/NumberStepper';
import { PRIndicator } from '../history/PRIndicator';
import { EstimatedMaxDisplay } from '../history/EstimatedMaxDisplay';
import { useExerciseMax } from '../../hooks/useHistory';
import { ProgressionAlert } from './ProgressionAlert';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { Button } from '../ui/Button';

interface SetLoggerProps {
  exerciseId: string;
  originalExerciseId: string;
  targetRepsMin: number;
  targetRepsMax: number;
  lastWeight?: number;  // Reference from previous session (Phase 3)
  lastReps?: number;
  onLogSet: (data: { weight_kg: number; reps: number; rir: number | null }) => void;
}

export function SetLogger({
  exerciseId,
  originalExerciseId,
  targetRepsMin,
  targetRepsMax,
  lastWeight,
  lastReps,
  onLogSet,
}: SetLoggerProps) {
  // Start empty per CONTEXT.md decision (show last values as reference, not pre-filled)
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rir, setRir] = useState<number | null>(null);
  const [showRir] = useState(true);  // RIR always visible per CONTEXT.md
  const [showPR, setShowPR] = useState(false);
  const [prType, setPrType] = useState<'weight' | '1rm' | 'weight_and_1rm'>('weight_and_1rm');

  // Get current gym context for progression alert
  const currentGymId = useWorkoutStore((state) => state.session?.gym_id || '');

  // Get current max weight and 1RM for PR detection
  const maxData = useExerciseMax(originalExerciseId);

  // Calculate estimated 1RM for current inputs (Epley formula)
  const currentEstimated1RM = useMemo(() => {
    if (weight <= 0 || reps <= 0) return null;
    return weight * (1 + reps / 30.0);
  }, [weight, reps]);

  // Detect if current set would be a PR
  const isPR = useMemo(() => {
    if (!maxData || weight <= 0 || reps <= 0) return false;

    const isWeightPR = maxData.max_weight === null || weight > maxData.max_weight;
    const is1RMPR = currentEstimated1RM !== null &&
                    (maxData.max_1rm === null || currentEstimated1RM > maxData.max_1rm);

    if (isWeightPR && is1RMPR) {
      setPrType('weight_and_1rm');
      return true;
    } else if (isWeightPR) {
      setPrType('weight');
      return true;
    } else if (is1RMPR) {
      setPrType('1rm');
      return true;
    }
    return false;
  }, [weight, reps, currentEstimated1RM, maxData]);

  const handleSubmit = () => {
    if (weight <= 0 || reps <= 0) return;

    // Show PR notification if this is a PR
    if (isPR) {
      // Reset first to ensure state change triggers animation
      setShowPR(false);
      // Use setTimeout to ensure state updates in sequence
      setTimeout(() => setShowPR(true), 0);
    }

    onLogSet({
      weight_kg: weight,
      reps,
      rir: showRir ? rir : null,
    });

    // Auto-advance: reset reps (keep weight for convenience)
    setReps(0);
    setRir(null);
  };

  const canLog = weight > 0 && reps > 0;

  return (
    <div className="space-y-6">
      {/* Progression Alert */}
      <ProgressionAlert
        exerciseId={exerciseId}
        originalExerciseId={originalExerciseId}
        currentGymId={currentGymId}
      />

      {/* PR Indicator */}
      <PRIndicator isPR={showPR} prType={prType} />

      {/* Current max display */}
      {maxData && (
        <EstimatedMaxDisplay
          maxWeight={maxData.max_weight}
          max1RM={maxData.max_1rm}
        />
      )}

      {/* Last session reference */}
      {(lastWeight || lastReps) && (
        <div className="text-center text-sm text-text-muted">
          Last: {lastWeight ? `${lastWeight}kg` : '?'}
          {' x '}
          {lastReps ?? '?'} reps
        </div>
      )}

      {/* Target rep range */}
      <div className="text-center text-sm text-text-secondary">
        Target: {targetRepsMin}-{targetRepsMax} reps
      </div>

      {/* Main inputs */}
      <div className="flex justify-center items-start gap-6">
        <NumberStepper
          value={weight}
          onChange={setWeight}
          step={2.5}
          min={0}
          label="Weight"
          unit="kg"
          size="lg"
        />

        <NumberStepper
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          max={100}
          label="Reps"
          size="lg"
        />

        {showRir && (
          <div className="flex flex-col items-center">
            <label className="text-xs text-text-muted mb-1">RIR</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRir(prev => prev === null ? 0 : Math.max(0, prev - 1))}
                className="w-12 h-12 bg-bg-elevated hover:bg-bg-elevated/80 rounded-xl font-bold text-2xl transition-colors flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={rir ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setRir(null);
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setRir(Math.min(10, Math.max(0, num)));
                  }
                }}
                placeholder="-"
                min={0}
                max={10}
                className="w-24 bg-bg-tertiary border border-border-primary rounded-xl text-center text-lg font-medium py-3 focus:outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setRir(prev => prev === null ? 0 : Math.min(10, prev + 1))}
                className="w-12 h-12 bg-bg-elevated hover:bg-bg-elevated/80 rounded-xl font-bold text-2xl transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
            <span className="text-xs text-text-muted mt-1">0 = failure</span>
          </div>
        )}
      </div>

      {/* Log button */}
      <Button
        onClick={handleSubmit}
        disabled={!canLog}
        variant="primary"
        size="lg"
      >
        Log Set
      </Button>
    </div>
  );
}
