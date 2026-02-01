import { useState, useMemo, useEffect } from 'react';
import { useExercises } from '../../hooks/useExercises';
import { useExerciseProgress, useWeeklyComparison } from '../../hooks/useAnalytics';
import { useVolumeAnalytics } from '../../hooks/useVolumeAnalytics';
import { useVolumeZoneThresholds } from '../../hooks/useVolumeThresholds';
import { useSummaryStats } from '../../hooks/useSummaryStats';
import { useProgressionStatus } from '../../hooks/useProgressionStatus';
import { TimeRangePicker } from './TimeRangePicker';
import { SummaryStatsCards } from './SummaryStatsCards';
import { SectionHeading } from './SectionHeading';
import { VolumeLegend } from './VolumeLegend';
import { VolumeBarChart } from './VolumeBarChart';
import { MuscleHeatMap } from './MuscleHeatMap';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { WeekComparisonCard } from './WeekComparisonCard';
import { PRListCard } from './PRListCard';
import { ProgressionDashboard } from './ProgressionDashboard';
import { ComparisonSection } from './ComparisonSection';
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary';
import type { TimeRange } from '../../types/analytics';
import { TIME_RANGE_DAYS } from '../../types/analytics';

const STORAGE_KEY = 'gymlog-analytics-timerange';

/**
 * Main Analytics page — single scrollable dashboard
 * Global time range state drives all hooks and charts
 * Layout: time range pills -> summary stats -> volume overview + legend -> heat map -> exercise detail -> progression
 */
export function AnalyticsPage() {
  // Time range state - persisted in localStorage
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['1M', '3M', '6M', '1Y', 'ALL'].includes(stored)) {
        return stored as TimeRange;
      }
    } catch {}
    return '3M'; // default
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, timeRange); } catch {}
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
  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError } = useWeeklyComparison();

  // Progression data for comparison section (DuckDB cache makes this cheap alongside ProgressionDashboard's internal call)
  const { data: progressionStatusData } = useProgressionStatus(days);

  // Derived data
  const selectedExercise = useMemo(
    () => exercises.find(e => e.exercise_id === selectedExerciseId),
    [exercises, selectedExerciseId]
  );
  const currentWeekComparison = useMemo(() => {
    const filtered = weeklyData.filter(w => w.exerciseId === selectedExerciseId);
    return filtered.length > 0 ? filtered[0] : null;
  }, [weeklyData, selectedExerciseId]);

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

      {/* SECTION 1: Summary Stats */}
      <FeatureErrorBoundary feature="Summary Stats">
        <SummaryStatsCards stats={summaryStats} isLoading={summaryLoading} />
      </FeatureErrorBoundary>

      {/* SECTION 2: Volume Overview */}
      <SectionHeading title="Volume Overview" subtitle="Average weekly sets per muscle group" />

      {volumeError ? (
        <div className="text-center py-8 text-error">Error: {volumeError}</div>
      ) : volumeLoading ? (
        <div className="text-center py-8 text-text-muted">Loading volume data...</div>
      ) : (
        <div className="space-y-4">
          <FeatureErrorBoundary feature="Volume Chart">
            <div className="bg-bg-tertiary/30 rounded-2xl p-4">
              <VolumeBarChart data={volumeAvgData} />
            </div>
          </FeatureErrorBoundary>
          <FeatureErrorBoundary feature="Volume Legend">
            <VolumeLegend />
          </FeatureErrorBoundary>
        </div>
      )}

      {/* SECTION 3: Training Balance Heat Map */}
      <SectionHeading title="Training Balance" />

      {volumeError ? (
        <div className="text-center py-8 text-error">Error: {volumeError}</div>
      ) : volumeLoading ? (
        <div className="text-center py-8 text-text-muted">Loading heat map...</div>
      ) : (
        <FeatureErrorBoundary feature="Muscle Heat Map">
          <div className="bg-bg-tertiary/30 rounded-2xl p-4">
            <MuscleHeatMap data={heatMapData} getThresholds={getThresholds} />
          </div>
        </FeatureErrorBoundary>
      )}

      {/* SECTION 4: Exercise Detail */}
      <SectionHeading title="Exercise Detail" subtitle="Select an exercise to view progress" />

      {/* Exercise Selector - scoped to this section */}
      <div>
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
      </div>

      {/* Exercise Progress Chart */}
      {progressError ? (
        <div className="text-center py-8 text-error">Error: {progressError}</div>
      ) : progressLoading ? (
        <div className="text-center py-8 text-text-muted">Loading chart...</div>
      ) : (
        <FeatureErrorBoundary feature="Exercise Progress Chart">
          <div className="bg-bg-tertiary/30 rounded-2xl p-4">
            <ExerciseProgressChart
              data={progressData}
              exerciseName={selectedExercise?.name || 'Exercise'}
              showVolume={true}
            />
          </div>
        </FeatureErrorBoundary>
      )}

      {/* Week Comparison */}
      {weeklyError ? (
        <div className="text-center py-8 text-error">Error: {weeklyError}</div>
      ) : weeklyLoading ? (
        <div className="text-center py-8 text-text-muted">Loading comparison...</div>
      ) : currentWeekComparison ? (
        <FeatureErrorBoundary feature="Week Comparison">
          <WeekComparisonCard data={currentWeekComparison} />
        </FeatureErrorBoundary>
      ) : (
        <div className="text-center py-8 text-text-muted">
          No data yet for this week. Log a workout to see comparison.
        </div>
      )}

      {/* PR List */}
      {selectedExercise && (
        <FeatureErrorBoundary feature="Personal Records">
          <PRListCard
            exerciseId={selectedExercise.exercise_id}
            exerciseName={selectedExercise.name}
          />
        </FeatureErrorBoundary>
      )}

      {/* SECTION 5: Progression Intelligence */}
      <SectionHeading title="Progression Intelligence" subtitle="Exercise-level progression detection" />

      <FeatureErrorBoundary feature="Progression Dashboard">
        <ProgressionDashboard days={days} />
      </FeatureErrorBoundary>

      {/* SECTION 6: Exercise Comparison */}
      <SectionHeading title="Exercise Comparison" subtitle="Select 2-4 exercises to compare side-by-side" />

      <FeatureErrorBoundary feature="Exercise Comparison">
        <ComparisonSection days={days} exercises={exercises} progressionData={progressionStatusData} />
      </FeatureErrorBoundary>
    </div>
  );
}
