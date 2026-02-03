import { useState, useEffect } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { DEFAULT_WARMUP_TIERS } from '../../utils/warmup';
import type { WarmupTier } from '../../utils/warmup';
import { Input } from '../ui/Input';

export function WarmupTierEditor() {
  const warmupTiers = useWorkoutStore((state) => state.warmupTiers);
  const setWarmupTiers = useWorkoutStore((state) => state.setWarmupTiers);
  const resetWarmupTiers = useWorkoutStore((state) => state.resetWarmupTiers);

  // Local state to avoid store thrashing on every keystroke
  const [localTiers, setLocalTiers] = useState<[WarmupTier, WarmupTier]>(warmupTiers);

  // Sync local state when store changes (e.g., after reset)
  useEffect(() => {
    setLocalTiers(warmupTiers);
  }, [warmupTiers]);

  const isDefault =
    localTiers[0].percentage === DEFAULT_WARMUP_TIERS[0].percentage &&
    localTiers[0].reps === DEFAULT_WARMUP_TIERS[0].reps &&
    localTiers[1].percentage === DEFAULT_WARMUP_TIERS[1].percentage &&
    localTiers[1].reps === DEFAULT_WARMUP_TIERS[1].reps;

  const handlePercentageChange = (tierIndex: 0 | 1, value: string) => {
    const updated: [WarmupTier, WarmupTier] = [{ ...localTiers[0] }, { ...localTiers[1] }];
    updated[tierIndex] = { ...updated[tierIndex], percentage: Number(value) || 0 };
    setLocalTiers(updated);
  };

  const handleRepsChange = (tierIndex: 0 | 1, value: string) => {
    const updated: [WarmupTier, WarmupTier] = [{ ...localTiers[0] }, { ...localTiers[1] }];
    updated[tierIndex] = { ...updated[tierIndex], reps: Number(value) || 0 };
    setLocalTiers(updated);
  };

  const handleBlur = () => {
    // Clamp values and persist
    const clamped: [WarmupTier, WarmupTier] = [
      {
        percentage: Math.min(95, Math.max(10, localTiers[0].percentage)),
        reps: Math.min(20, Math.max(1, localTiers[0].reps)),
      },
      {
        percentage: Math.min(95, Math.max(10, localTiers[1].percentage)),
        reps: Math.min(20, Math.max(1, localTiers[1].reps)),
      },
    ];
    setLocalTiers(clamped);
    setWarmupTiers(clamped);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-text-primary">Warmup Tiers</label>
        {!isDefault && (
          <button
            type="button"
            onClick={resetWarmupTiers}
            className="text-xs text-accent hover:text-accent/80 transition-colors"
          >
            Reset to defaults
          </button>
        )}
      </div>

      {localTiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-10">Tier {i + 1}</span>
          <div className="w-14">
            <Input
              type="number"
              min={10}
              max={95}
              step={5}
              value={tier.percentage}
              onChange={(e) => handlePercentageChange(i as 0 | 1, e.target.value)}
              onBlur={handleBlur}
              className="text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-xs text-text-muted">% x</span>
          <div className="w-14">
            <Input
              type="number"
              min={1}
              max={20}
              step={1}
              value={tier.reps}
              onChange={(e) => handleRepsChange(i as 0 | 1, e.target.value)}
              onBlur={handleBlur}
              className="text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-xs text-text-muted">reps</span>
        </div>
      ))}
    </div>
  );
}
