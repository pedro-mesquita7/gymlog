import { useState, useMemo } from 'react';
import { useExercises } from '../../hooks/useExercises';
import { useExerciseProgress, useWeeklyComparison } from '../../hooks/useAnalytics';
import { useVolumeAnalytics } from '../../hooks/useVolumeAnalytics';
import { useVolumeThresholds } from '../../hooks/useVolumeThresholds';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { WeekComparisonCard } from './WeekComparisonCard';
import { PRListCard } from './PRListCard';
import { VolumeBarChart } from './VolumeBarChart';
import { VolumeZoneIndicator } from './VolumeZoneIndicator';
import { MuscleHeatMap } from './MuscleHeatMap';
import { CollapsibleSection } from './CollapsibleSection';
import { ProgressionDashboard } from './ProgressionDashboard';
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary';

/**
 * Main Analytics page container
 * Provides exercise selector and displays progress charts, comparisons, and PRs
 */
export function AnalyticsPage() {
  const { exercises, isLoading: exercisesLoading } = useExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // Find selected exercise
  const selectedExercise = useMemo(
    () => exercises.find(e => e.exercise_id === selectedExerciseId),
    [exercises, selectedExerciseId]
  );

  // Fetch progress data for selected exercise
  const { data: progressData, isLoading: progressLoading, error: progressError } = useExerciseProgress({
    exerciseId: selectedExerciseId
  });

  // Fetch weekly comparison data
  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError } = useWeeklyComparison();

  // Fetch volume analytics data
  const { volumeData, heatMapData, isLoading: volumeLoading, error: volumeError } = useVolumeAnalytics();
  const volumeThresholds = useVolumeThresholds();

  // Filter weekly data for selected exercise
  const selectedWeeklyData = useMemo(
    () => weeklyData.filter(w => w.exerciseId === selectedExerciseId),
    [weeklyData, selectedExerciseId]
  );

  // Get current week comparison for selected exercise
  const currentWeekComparison = useMemo(() => {
    if (selectedWeeklyData.length === 0) return null;
    // First item is most recent week
    return selectedWeeklyData[0];
  }, [selectedWeeklyData]);

  // Auto-select first exercise when loaded
  if (!selectedExerciseId && exercises.length > 0 && !exercisesLoading) {
    setSelectedExerciseId(exercises[0].exercise_id);
  }

  if (exercisesLoading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Loading exercises...
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div data-testid="analytics-empty" className="text-center py-12 space-y-4">
        <p className="text-text-muted">No exercises yet.</p>
        <p className="text-sm text-text-muted">
          Create exercises and log workouts to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="analytics-charts" className="space-y-8">
      {/* Exercise Selector */}
      <div>
        <label htmlFor="exercise-select" className="block text-sm font-medium text-text-secondary mb-2">
          Select Exercise
        </label>
        <select
          data-testid="analytics-exercise-select"
          id="exercise-select"
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {exercises.map((exercise) => (
            <option key={exercise.exercise_id} value={exercise.exercise_id}>
              {exercise.name} ({exercise.muscle_group})
            </option>
          ))}
        </select>
      </div>

      {/* Progress Chart Section */}
      <CollapsibleSection title="Progress (Last 4 Weeks)" defaultOpen={true}>
        {progressError ? (
          <div className="text-center py-8 text-error">Error: {progressError}</div>
        ) : progressLoading ? (
          <div className="text-center py-8 text-text-muted">Loading chart...</div>
        ) : (
          <FeatureErrorBoundary feature="Exercise Progress Chart">
            <div className="bg-bg-tertiary/30 rounded-lg p-4">
              <ExerciseProgressChart
                data={progressData}
                exerciseName={selectedExercise?.name || 'Exercise'}
                showVolume={true}
              />
            </div>
          </FeatureErrorBoundary>
        )}
      </CollapsibleSection>

      {/* Week Comparison Section */}
      <CollapsibleSection title="This Week vs Last Week" defaultOpen={true}>
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
      </CollapsibleSection>

      {/* PR List Section */}
      <CollapsibleSection title="All-Time PRs" defaultOpen={true}>
        {selectedExercise && (
          <FeatureErrorBoundary feature="Personal Records">
            <PRListCard
              exerciseId={selectedExercise.exercise_id}
              exerciseName={selectedExercise.name}
            />
          </FeatureErrorBoundary>
        )}
      </CollapsibleSection>

      {/* Visual Divider between exercise-specific and muscle-group sections */}
      <div className="border-t-2 border-border-primary pt-8 mt-8">
        <h2 className="text-xl font-bold text-text-primary mb-6">Volume Analytics</h2>
      </div>

      {/* Weekly Volume by Muscle Group Section */}
      <CollapsibleSection title="Weekly Volume by Muscle Group" defaultOpen={true}>
        {volumeError ? (
          <div className="text-center py-8 text-error">Error: {volumeError}</div>
        ) : volumeLoading ? (
          <div className="text-center py-8 text-text-muted">Loading volume data...</div>
        ) : (
          <div className="space-y-4">
            <FeatureErrorBoundary feature="Volume Zones">
              <VolumeZoneIndicator thresholds={volumeThresholds.defaultThresholds} />
            </FeatureErrorBoundary>
            <FeatureErrorBoundary feature="Volume Chart">
              <div className="bg-bg-tertiary/30 rounded-lg p-4">
                <VolumeBarChart data={volumeData} thresholds={volumeThresholds} />
              </div>
            </FeatureErrorBoundary>
          </div>
        )}
      </CollapsibleSection>

      {/* Training Balance Heat Map Section */}
      <CollapsibleSection title="Training Balance Heat Map" defaultOpen={true}>
        {volumeError ? (
          <div className="text-center py-8 text-error">Error: {volumeError}</div>
        ) : volumeLoading ? (
          <div className="text-center py-8 text-text-muted">Loading heat map...</div>
        ) : (
          <FeatureErrorBoundary feature="Muscle Heat Map">
            <div className="bg-bg-tertiary/30 rounded-lg p-4">
              <MuscleHeatMap data={heatMapData} thresholds={volumeThresholds} />
            </div>
          </FeatureErrorBoundary>
        )}
      </CollapsibleSection>

      {/* Visual Divider between volume and progression sections */}
      <div className="border-t-2 border-border-primary pt-8 mt-8">
        <h2 className="text-xl font-bold text-text-primary mb-6">Progression Intelligence</h2>
      </div>

      <CollapsibleSection title="Exercise Progression Status" defaultOpen={true}>
        <FeatureErrorBoundary feature="Progression Dashboard">
          <ProgressionDashboard />
        </FeatureErrorBoundary>
      </CollapsibleSection>
    </div>
  );
}
