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
      <div className="p-4 text-center text-zinc-400">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
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
    <div className="bg-zinc-900 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold">{exerciseName}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            Close
          </button>
        )}
      </div>

      {/* History content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {historyByDate.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">
            No history in the last 2 weeks
          </p>
        ) : (
          <div className="space-y-4">
            {historyByDate.map(({ date, sets }) => (
              <div key={date}>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">
                  {formatDate(date)}
                </h4>
                <div className="space-y-2">
                  {sets.map((set, idx) => (
                    <div
                      key={set.set_id}
                      className="flex items-center justify-between py-2 px-3 bg-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-sm w-6">
                          #{idx + 1}
                        </span>
                        <span className="font-medium">
                          {set.weight_kg}kg x {set.reps}
                        </span>
                        {set.rir !== null && (
                          <span className="text-sm text-zinc-500">
                            RIR {set.rir}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {set.estimated_1rm && (
                          <span className="text-xs text-zinc-500">
                            ~{set.estimated_1rm.toFixed(1)}kg 1RM
                          </span>
                        )}
                        {set.is_pr && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                            PR
                          </span>
                        )}
                        {set.is_anomaly && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
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
        <div className="p-4 border-t border-zinc-800 text-sm text-zinc-400">
          Last 2 weeks: {historyByDate.reduce((sum, d) => sum + d.sets.length, 0)} sets
        </div>
      )}
    </div>
  );
}
