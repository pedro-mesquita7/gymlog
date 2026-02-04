import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useWarmupData } from '../../hooks/useWarmupData';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { calculateWarmupSets } from '../../utils/warmup';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURATION = prefersReducedMotion ? 0 : 0.2;

interface WarmupHintProps {
  originalExerciseId: string;
}

export function WarmupHint({ originalExerciseId }: WarmupHintProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { maxWeight, isLoading } = useWarmupData(originalExerciseId);
  const warmupTiers = useWorkoutStore((state) => state.warmupTiers);

  // Don't render while loading
  if (isLoading) return null;

  // Bodyweight exercises (0kg) skip warmup entirely
  if (maxWeight === 0) return null;

  const noHistory = maxWeight === null;
  const warmupSets = noHistory ? null : calculateWarmupSets(maxWeight, warmupTiers);

  return (
    <div>
      {/* Toggle button */}
      <button
        type="button"
        data-testid="warmup-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="text-xs text-text-muted hover:text-accent transition-colors px-1 py-0.5"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Hide warmup' : 'Show warmup'}
      >
        Warmup
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div data-testid="warmup-content" className="text-xs text-text-secondary py-1 px-1">
              {noHistory ? (
                'Log your first session to see warmup suggestions'
              ) : (
                <>
                  Warmup: {warmupSets!.map(
                    (set) => `${set.reps}\u00D7${set.weight}kg (${set.percentage}%)`
                  ).join(' \u2192 ')}
                </>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
