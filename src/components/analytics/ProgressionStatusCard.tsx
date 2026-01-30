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
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700/30',
      textColor: 'text-green-400',
      badge: 'Progressing',
    },
    plateau: {
      icon: '→',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-700/30',
      textColor: 'text-yellow-400',
      badge: 'Plateau',
    },
    regressing: {
      icon: '↘',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700/30',
      textColor: 'text-red-400',
      badge: 'Regressing',
    },
    unknown: {
      icon: '?',
      bgColor: 'bg-zinc-800/20',
      borderColor: 'border-zinc-700/30',
      textColor: 'text-zinc-400',
      badge: 'Unknown',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100">{exerciseName}</h3>
            <span className="text-xs text-zinc-500">({muscleGroup})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl" role="img" aria-label={config.badge}>
              {config.icon}
            </span>
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.badge}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-400 space-y-1">
            {lastPrDate ? (
              <div>
                Last PR: {formatDistanceToNow(new Date(lastPrDate), { addSuffix: true })}
              </div>
            ) : (
              <div>No PRs recorded yet</div>
            )}
            <div>{sessionCount4wk} sessions in last 4 weeks</div>
            {status === 'regressing' && (
              <div className="text-red-300">
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
