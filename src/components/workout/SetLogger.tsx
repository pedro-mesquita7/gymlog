import { useState } from 'react';
import { NumberStepper } from '../ui/NumberStepper';

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
  const [showRir, setShowRir] = useState(true);  // RIR always visible per CONTEXT.md

  const handleSubmit = () => {
    if (weight <= 0 || reps <= 0) return;

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
      {/* Last session reference */}
      {(lastWeight || lastReps) && (
        <div className="text-center text-sm text-zinc-500">
          Last: {lastWeight ? `${lastWeight}kg` : '?'}
          {' x '}
          {lastReps ?? '?'} reps
        </div>
      )}

      {/* Target rep range */}
      <div className="text-center text-sm text-zinc-400">
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
          <NumberStepper
            value={rir ?? 0}
            onChange={(v) => setRir(v === 0 ? null : v)}
            step={1}
            min={0}
            max={10}
            label="RIR"
            size="lg"
          />
        )}
      </div>

      {/* Log button */}
      <button
        onClick={handleSubmit}
        disabled={!canLog}
        className="w-full py-4 bg-accent hover:bg-accent/90 text-black font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Log Set
      </button>
    </div>
  );
}
