import type { WeeklyComparison } from '../../types/analytics';

interface WeekComparisonCardProps {
  data: WeeklyComparison;
}

/**
 * Card showing this week vs last week performance (CHART-04)
 */
export function WeekComparisonCard({ data }: WeekComparisonCardProps) {
  const formatChange = (pct: number | null) => {
    if (pct === null) return 'N/A';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const getChangeColor = (pct: number | null) => {
    if (pct === null) return 'text-zinc-500';
    if (pct > 0) return 'text-green-400';
    if (pct < 0) return 'text-red-400';
    return 'text-zinc-400';
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-zinc-200">{data.exerciseName}</h4>
        <span className="text-xs text-zinc-500">{data.muscleGroup}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Max Weight</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-zinc-200">
              {data.maxWeight.toFixed(1)} kg
            </span>
            <span className={`text-sm ${getChangeColor(data.weightChangePct)}`}>
              {formatChange(data.weightChangePct)}
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 mb-1">Volume</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-zinc-200">
              {data.totalVolume.toLocaleString()} kg
            </span>
            <span className={`text-sm ${getChangeColor(data.volumeChangePct)}`}>
              {formatChange(data.volumeChangePct)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        {data.setCount} sets this week
        {data.prevMaxWeight !== null && (
          <span> (vs {data.prevMaxWeight.toFixed(1)} kg last week)</span>
        )}
      </div>
    </div>
  );
}
