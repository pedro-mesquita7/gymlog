import { useRecentWorkout } from '../../hooks/useRecentWorkout';

/**
 * Compact summary card showing the most recent completed workout.
 * Renders nothing if no recent workout exists.
 */
export function RecentWorkoutCard() {
  const { data, isLoading } = useRecentWorkout();

  if (isLoading || !data) return null;

  const volumeStr =
    data.totalVolume >= 1000
      ? `${(data.totalVolume / 1000).toFixed(1)}t`
      : `${data.totalVolume} kg`;

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary truncate">
          Last: {data.templateName}
        </span>
        <span className="text-xs text-text-muted whitespace-nowrap">
          {data.date}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
        <span>{data.exerciseCount} exercises</span>
        <span className="text-text-muted">&middot;</span>
        <span>{data.totalSets} sets</span>
        <span className="text-text-muted">&middot;</span>
        <span>{volumeStr}</span>
        {data.durationMinutes > 0 && (
          <>
            <span className="text-text-muted">&middot;</span>
            <span>{data.durationMinutes}m</span>
          </>
        )}
      </div>
    </div>
  );
}
