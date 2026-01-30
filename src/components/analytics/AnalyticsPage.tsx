import { useState, useMemo } from 'react';
import { useExercises } from '../../hooks/useExercises';
import { useExerciseProgress, useWeeklyComparison } from '../../hooks/useAnalytics';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { WeekComparisonCard } from './WeekComparisonCard';
import { PRListCard } from './PRListCard';

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
      <div className="text-center py-12 text-zinc-500">
        Loading exercises...
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-zinc-500">No exercises yet.</p>
        <p className="text-sm text-zinc-600">
          Create exercises and log workouts to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Exercise Selector */}
      <div>
        <label htmlFor="exercise-select" className="block text-sm font-medium text-zinc-400 mb-2">
          Select Exercise
        </label>
        <select
          id="exercise-select"
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {exercises.map((exercise) => (
            <option key={exercise.exercise_id} value={exercise.exercise_id}>
              {exercise.name} ({exercise.muscle_group})
            </option>
          ))}
        </select>
      </div>

      {/* Progress Chart Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">
          Progress (Last 4 Weeks)
        </h2>
        {progressError ? (
          <div className="text-center py-8 text-red-400">Error: {progressError}</div>
        ) : progressLoading ? (
          <div className="text-center py-8 text-zinc-500">Loading chart...</div>
        ) : (
          <div className="bg-zinc-800/30 rounded-lg p-4">
            <ExerciseProgressChart
              data={progressData}
              exerciseName={selectedExercise?.name || 'Exercise'}
              showVolume={true}
            />
          </div>
        )}
      </section>

      {/* Week Comparison Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">
          This Week vs Last Week
        </h2>
        {weeklyError ? (
          <div className="text-center py-8 text-red-400">Error: {weeklyError}</div>
        ) : weeklyLoading ? (
          <div className="text-center py-8 text-zinc-500">Loading comparison...</div>
        ) : currentWeekComparison ? (
          <WeekComparisonCard data={currentWeekComparison} />
        ) : (
          <div className="text-center py-8 text-zinc-500">
            No data yet for this week. Log a workout to see comparison.
          </div>
        )}
      </section>

      {/* PR List Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">
          All-Time PRs
        </h2>
        {selectedExercise && (
          <PRListCard
            exerciseId={selectedExercise.exercise_id}
            exerciseName={selectedExercise.name}
          />
        )}
      </section>
    </div>
  );
}
