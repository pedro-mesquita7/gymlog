import type { ComparisonStats } from '../../types/analytics';

interface ComparisonStatCardProps {
  stat: ComparisonStats;
}

const statusConfig = {
  progressing: {
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    label: 'Progressing',
  },
  plateau: {
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
    label: 'Plateau',
  },
  regressing: {
    bgColor: 'bg-error/10',
    textColor: 'text-error',
    label: 'Regressing',
  },
  unknown: {
    bgColor: 'bg-bg-tertiary/20',
    textColor: 'text-text-muted',
    label: 'Unknown',
  },
};

function formatVolume(volume: number): string {
  if (volume === 0) return 'No data';
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
  return `${Math.round(volume)}kg`;
}

/**
 * Stat card for a single exercise in the comparison grid.
 * Shows PR, volume, frequency, and progression status.
 */
export function ComparisonStatCard({ stat }: ComparisonStatCardProps) {
  const config = statusConfig[stat.progressionStatus];

  return (
    <div
      data-testid="comparison-stat-card"
      className="bg-bg-secondary border border-border-primary rounded-2xl p-4 space-y-3"
    >
      {/* Header */}
      <div>
        <h3 className="font-semibold text-sm text-text-primary truncate">{stat.exerciseName}</h3>
        <p className="text-xs text-text-muted">{stat.muscleGroup}</p>
      </div>

      {/* PR */}
      <div>
        <p className="text-xs text-text-muted">PR</p>
        <p className="text-lg font-bold text-text-primary">
          {stat.maxWeight > 0 ? `${stat.maxWeight}kg` : '---'}
        </p>
        <p className="text-xs text-text-secondary">
          {stat.maxEstimated1rm > 0 ? `Est 1RM: ${stat.maxEstimated1rm.toFixed(1)}kg` : '---'}
        </p>
      </div>

      {/* Volume */}
      <div>
        <p className="text-xs text-text-muted">Volume</p>
        <p className="text-lg font-bold text-text-primary">{formatVolume(stat.totalVolume)}</p>
        <p className="text-xs text-text-secondary">{stat.totalSets} sets</p>
      </div>

      {/* Frequency */}
      <div>
        <p className="text-xs text-text-muted">Frequency</p>
        <p className="text-lg font-bold text-text-primary">{stat.sessionsPerWeek.toFixed(1)}/wk</p>
        <p className="text-xs text-text-secondary">{stat.sessionCount} sessions</p>
      </div>

      {/* Progression status badge */}
      <div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
