import { useState, useMemo, useEffect } from 'react';
import { useExercises } from '../../hooks/useExercises';
import { useExerciseProgress } from '../../hooks/useAnalytics';
import { useVolumeAnalytics } from '../../hooks/useVolumeAnalytics';
import { useVolumeZoneThresholds } from '../../hooks/useVolumeThresholds';
import { useSummaryStats } from '../../hooks/useSummaryStats';
import { useWeekComparisonSubtitle } from '../../hooks/useWeekComparisonSubtitle';
import { TimeRangePicker } from './TimeRangePicker';
import { SummaryStatsCards } from './SummaryStatsCards';
import { CollapsibleSection } from './CollapsibleSection';
import { VolumeLegend } from './VolumeLegend';
import { VolumeBarChart } from './VolumeBarChart';
import { MuscleHeatMap } from './MuscleHeatMap';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { PRListCard } from './PRListCard';
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary';
import type { TimeRange } from '../../types/analytics';
import { TIME_RANGE_DAYS } from '../../types/analytics';

const STORAGE_KEY = 'gymlog-analytics-timerange';

/**
 * Main Analytics page — single scrollable dashboard
 * Global time range state drives all hooks and charts
 * Section order: Summary Stats -> Exercise Progress -> PRs -> Volume Overview -> Training Balance
 */
export function AnalyticsPage() {
  // Time range state - persisted in localStorage
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['1M', '3M', '6M', '1Y', 'ALL'].includes(stored)) {
        return stored as TimeRange;
      }
    } catch { /* ignored */ }
    return '3M'; // default
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, timeRange); } catch { /* ignored */ }
  }, [timeRange]);

  const days = TIME_RANGE_DAYS[timeRange];

  const { exercises, isLoading: exercisesLoading } = useExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // Summary stats
  const { data: summaryStats, isLoading: summaryLoading } = useSummaryStats(days);

  // Volume analytics (averaged data for bar chart + heat map)
  const { volumeAvgData, heatMapData, isLoading: volumeLoading, error: volumeError } = useVolumeAnalytics(days);
  const { getThresholds } = useVolumeZoneThresholds();

  // Exercise-specific data
  const { data: progressData, isLoading: progressLoading, error: progressError } = useExerciseProgress({
    exerciseId: selectedExerciseId,
    days,
  });

  // Week-over-week comparison subtitle (always last 2 weeks, independent of time range)
  const { subtitle: weekSubtitle, isLoading: subtitleLoading, data: weekData } = useWeekComparisonSubtitle({
    exerciseId: selectedExerciseId,
  });

  // Derived data
  const selectedExercise = useMemo(
    () => exercises.find(e => e.exercise_id === selectedExerciseId),
    [exercises, selectedExerciseId]
  );

  // Auto-select first exercise when loaded
  if (!selectedExerciseId && exercises.length > 0 && !exercisesLoading) {
    setSelectedExerciseId(exercises[0].exercise_id);
  }

  if (exercisesLoading) {
    return <div className="text-center py-12 text-text-muted">Loading exercises...</div>;
  }

  if (exercises.length === 0) {
    return (
      <div data-testid="analytics-empty" className="text-center py-12 space-y-4">
        <p className="text-text-muted">No exercises yet.</p>
        <p className="text-sm text-text-muted">Create exercises and log workouts to see analytics.</p>
      </div>
    );
  }

  return (
    <div data-testid="analytics-charts" className="space-y-6">
      {/* Time Range Picker - sticky at top */}
      <div className="sticky top-0 z-10 bg-bg-primary py-3 -mx-4 px-4">
        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary Stats — always visible, not collapsible */}
      <FeatureErrorBoundary feature="Summary Stats">
        <SummaryStatsCards stats={summaryStats} isLoading={summaryLoading} />
      </FeatureErrorBoundary>

      {/* Exercise Progress */}
      <CollapsibleSection title="Exercise Progress">
        <div className="space-y-4">
          <select
            data-testid="analytics-exercise-select"
            id="exercise-select"
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-bg-tertiary border border-border-primary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Select exercise"
          >
            {exercises.map((exercise) => (
              <option key={exercise.exercise_id} value={exercise.exercise_id}>
                {exercise.name} ({exercise.muscle_group})
              </option>
            ))}
          </select>

          {/* Week-over-week comparison subtitle */}
          {!subtitleLoading && weekSubtitle && (
            <p className="text-sm text-text-secondary">
              {weekData?.hasPreviousWeek ? (
                <>
                  {weekData.weightChangePct !== null && (
                    <span className={weekData.weightChangePct >= 0 ? 'text-success' : 'text-error'}>
                      {weekData.weightChangePct > 0 ? '+' : ''}{weekData.weightChangePct}% weight
                    </span>
                  )}
                  {weekData.volumeChangePct !== null && (
                    <>
                      <span className="text-text-muted">, </span>
                      <span className={weekData.volumeChangePct >= 0 ? 'text-success' : 'text-error'}>
                        {weekData.volumeChangePct > 0 ? '+' : ''}{weekData.volumeChangePct}% volume
                      </span>
                    </>
                  )}
                  <span className="text-text-muted"> vs last week</span>
                </>
              ) : (
                <span className="text-text-muted">{weekSubtitle}</span>
              )}
            </p>
          )}

          {progressError ? (
            <div className="text-center py-8 text-error">Error: {progressError}</div>
          ) : progressLoading ? (
            <div className="text-center py-8 text-text-muted">Loading chart...</div>
          ) : (
            <FeatureErrorBoundary feature="Exercise Progress Chart">
              <div className="bg-bg-tertiary/30 rounded-xl p-4">
                <ExerciseProgressChart
                  data={progressData}
                  exerciseName={selectedExercise?.name || 'Exercise'}
                  showVolume={true}
                />
              </div>
            </FeatureErrorBoundary>
          )}
        </div>
      </CollapsibleSection>

      {/* Personal Records */}
      <CollapsibleSection title="Personal Records">
        {selectedExercise ? (
          <FeatureErrorBoundary feature="Personal Records">
            <PRListCard
              exerciseId={selectedExercise.exercise_id}
              exerciseName={selectedExercise.name}
            />
          </FeatureErrorBoundary>
        ) : (
          <div className="text-center py-8 text-text-muted">Select an exercise to view PRs.</div>
        )}
      </CollapsibleSection>

      {/* Volume Overview */}
      <CollapsibleSection title="Volume Overview">
        {volumeError ? (
          <div className="text-center py-8 text-error">Error: {volumeError}</div>
        ) : volumeLoading ? (
          <div className="text-center py-8 text-text-muted">Loading volume data...</div>
        ) : (
          <div className="space-y-4">
            <FeatureErrorBoundary feature="Volume Chart">
              <div className="bg-bg-tertiary/30 rounded-xl p-4">
                <VolumeBarChart data={volumeAvgData} />
              </div>
            </FeatureErrorBoundary>
            <FeatureErrorBoundary feature="Volume Legend">
              <VolumeLegend />
            </FeatureErrorBoundary>
          </div>
        )}
      </CollapsibleSection>

      {/* Training Balance */}
      <CollapsibleSection title="Training Balance">
        {volumeError ? (
          <div className="text-center py-8 text-error">Error: {volumeError}</div>
        ) : volumeLoading ? (
          <div className="text-center py-8 text-text-muted">Loading heat map...</div>
        ) : (
          <FeatureErrorBoundary feature="Muscle Heat Map">
            <div className="bg-bg-tertiary/30 rounded-xl p-4">
              <MuscleHeatMap data={heatMapData} getThresholds={getThresholds} />
            </div>
          </FeatureErrorBoundary>
        )}
      </CollapsibleSection>
    </div>
  );
}
