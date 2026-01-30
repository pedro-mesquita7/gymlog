import { useMemo } from 'react';
import { useProgressionStatus } from '../../hooks/useProgressionStatus';
import { useExercises } from '../../hooks/useExercises';
import { ProgressionStatusCard } from './ProgressionStatusCard';

/**
 * Progression Intelligence Dashboard
 * Shows summary counts (progressing/plateaued/regressing) and status cards per exercise
 * Cards sorted problems-first: regressing > plateau > progressing > unknown, then alphabetical
 */
export function ProgressionDashboard() {
  const { data: progressionData, isLoading, error } = useProgressionStatus();
  const { exercises } = useExercises();

  // Calculate summary counts
  const summary = useMemo(() => {
    if (!progressionData) return { progressing: 0, plateau: 0, regressing: 0 };

    return progressionData.reduce(
      (acc, p) => {
        if (p.status === 'progressing') acc.progressing++;
        else if (p.status === 'plateau') acc.plateau++;
        else if (p.status === 'regressing') acc.regressing++;
        return acc;
      },
      { progressing: 0, plateau: 0, regressing: 0 }
    );
  }, [progressionData]);

  // Join progression data with exercise names
  const statusWithNames = useMemo(() => {
    if (!progressionData || !exercises) return [];

    return progressionData.map((p) => {
      const exercise = exercises.find((e) => e.exercise_id === p.exerciseId);
      return {
        ...p,
        exerciseName: exercise?.name || 'Unknown',
        muscleGroup: exercise?.muscle_group || '',
      };
    });
  }, [progressionData, exercises]);

  // Sort: problems first (regressing > plateau > progressing > unknown), then alphabetical
  const sortedStatus = useMemo(() => {
    return [...statusWithNames].sort((a, b) => {
      const order = { regressing: 0, plateau: 1, progressing: 2, unknown: 3 };
      const statusDiff = order[a.status] - order[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.exerciseName.localeCompare(b.exerciseName);
    });
  }, [statusWithNames]);

  if (isLoading) {
    return <div className="text-center py-8 text-zinc-500">Loading progression data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">Error: {error}</div>;
  }

  if (!progressionData || progressionData.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        Not enough workout data yet. Log 2+ sessions per exercise to see progression analysis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{summary.progressing}</div>
          <div className="text-sm text-green-200 mt-1">Progressing</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{summary.plateau}</div>
          <div className="text-sm text-yellow-200 mt-1">Plateaued</div>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{summary.regressing}</div>
          <div className="text-sm text-red-200 mt-1">Regressing</div>
        </div>
      </div>

      {/* Status cards */}
      <div className="space-y-3">
        {sortedStatus.map((item) => (
          <ProgressionStatusCard
            key={`${item.exerciseId}-${item.gymId}`}
            exerciseId={item.exerciseId}
            exerciseName={item.exerciseName}
            muscleGroup={item.muscleGroup}
            status={item.status}
            lastPrDate={item.lastPrDate}
            sessionCount4wk={item.sessionCount4wk}
            weightDropPct={item.weightDropPct}
            volumeDropPct={item.volumeDropPct}
          />
        ))}
      </div>
    </div>
  );
}
