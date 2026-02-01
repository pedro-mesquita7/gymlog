import { formatDistanceToNow } from 'date-fns';

interface ProgressionStatusCardProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  status: 'progressing' | 'plateau' | 'regressing' | 'unknown';
  lastPrDate: string | null;
  sessionCount4wk: number;
  weightDropPct: number | null;
  volumeDropPct: number | null;
}

/**
 * Individual exercise status card displaying progression status
 * Shows exercise name, muscle group, status badge, last PR date, session count
 * For regressing status, shows weight/volume drop percentages
 */
export function ProgressionStatusCard({
  exerciseName,
  muscleGroup,
  status,
  lastPrDate,
  sessionCount4wk,
  weightDropPct,
  volumeDropPct,
}: ProgressionStatusCardProps) {
  const statusConfig = {
    progressing: {
      icon: '↗',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      textColor: 'text-success',
      badge: 'Progressing',
    },
    plateau: {
      icon: '→',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      textColor: 'text-warning',
      badge: 'Plateau',
    },
    regressing: {
      icon: '↘',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/30',
      textColor: 'text-error',
      badge: 'Regressing',
    },
    unknown: {
      icon: '?',
      bgColor: 'bg-bg-tertiary/20',
      borderColor: 'border-border-primary/30',
      textColor: 'text-text-secondary',
      badge: 'Unknown',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary">{exerciseName}</h3>
            <span className="text-xs text-text-muted">({muscleGroup})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl" role="img" aria-label={config.badge}>
              {config.icon}
            </span>
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.badge}
            </span>
          </div>
          <div className="mt-2 text-xs text-text-secondary space-y-1">
            {lastPrDate ? (
              <div>
                Last PR: {formatDistanceToNow(new Date(lastPrDate), { addSuffix: true })}
              </div>
            ) : (
              <div>No PRs recorded yet</div>
            )}
            <div>{sessionCount4wk} sessions in last 4 weeks</div>
            {status === 'regressing' && (
              <div className="text-error">
                {weightDropPct && weightDropPct > 0 && `Weight: -${weightDropPct.toFixed(1)}%`}
                {weightDropPct && weightDropPct > 0 && volumeDropPct && volumeDropPct > 0 && ' / '}
                {volumeDropPct && volumeDropPct > 0 && `Volume: -${volumeDropPct.toFixed(1)}%`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
