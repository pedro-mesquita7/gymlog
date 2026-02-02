import { useHistory } from '../../hooks/useHistory';

interface ExerciseHistoryProps {
  exerciseId: string;
  exerciseName: string;
  currentGymId: string;
  onClose?: () => void;
}

export function ExerciseHistory({
  exerciseId,
  exerciseName,
  currentGymId,
  onClose,
}: ExerciseHistoryProps) {
  const { historyByDate, isLoading, error } = useHistory({
    exerciseId,
    currentGymId,
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center text-text-secondary">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-error">
        Error: {error}
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-bg-secondary rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <h3 className="text-lg font-semibold">{exerciseName}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            Close
          </button>
        )}
      </div>

      {/* History content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {historyByDate.length === 0 ? (
          <p className="text-center text-text-muted py-8">
            No history in the last 2 weeks
          </p>
        ) : (
          <div className="space-y-4">
            {historyByDate.map(({ date, sets }) => (
              <div key={date}>
                <h4 className="text-sm font-medium text-text-secondary mb-2">
                  {formatDate(date)}
                </h4>
                <div className="space-y-2">
                  {sets.map((set, idx) => (
                    <div
                      key={set.set_id}
                      className="flex items-center justify-between py-2 px-3 bg-bg-tertiary rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted text-sm w-6">
                          #{idx + 1}
                        </span>
                        <span className="font-medium">
                          {set.weight_kg}kg x {set.reps}
                        </span>
                        {set.rir !== null && (
                          <span className="text-sm text-text-muted">
                            RIR {set.rir}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {set.estimated_1rm && (
                          <span className="text-xs text-text-muted">
                            ~{set.estimated_1rm.toFixed(1)}kg 1RM
                          </span>
                        )}
                        {set.is_pr && (
                          <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-medium rounded">
                            PR
                          </span>
                        )}
                        {set.is_anomaly && (
                          <span className="px-2 py-0.5 bg-error/20 text-error text-xs font-medium rounded">
                            !
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {historyByDate.length > 0 && (
        <div className="p-4 border-t border-border-primary text-sm text-text-secondary">
          Last 2 weeks: {historyByDate.reduce((sum, d) => sum + d.sets.length, 0)} sets
        </div>
      )}
    </div>
  );
}
