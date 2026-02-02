import { usePRList } from '../../hooks/useHistory';

interface PRListProps {
  exerciseId: string;
  exerciseName: string;
}

/**
 * Display list of all PRs for an exercise
 */
export function PRList({ exerciseId, exerciseName }: PRListProps) {
  const { prs, isLoading, error } = usePRList(exerciseId);

  if (isLoading) {
    return (
      <div className="text-center text-text-muted py-8">
        Loading PR history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error py-8">
        Error loading PRs: {error}
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="text-center text-text-muted py-8">
        No PRs yet for {exerciseName}
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPRTypeLabel = (prType: string) => {
    switch (prType) {
      case 'weight_and_1rm':
        return 'Weight & 1RM PR';
      case 'weight':
        return 'Weight PR';
      case '1rm':
        return '1RM PR';
      default:
        return 'PR';
    }
  };

  const getPRTypeColor = (prType: string) => {
    switch (prType) {
      case 'weight_and_1rm':
        return 'bg-accent text-white';
      case 'weight':
        return 'bg-chart-primary text-white';
      case '1rm':
        return 'bg-chart-success text-white';
      default:
        return 'bg-bg-elevated text-text-primary';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text-primary">
        PR History - {exerciseName}
      </h3>
      <div className="space-y-2">
        {prs.map((pr) => (
          <div
            key={pr.set_id}
            className="bg-bg-tertiary/50 rounded-xl px-4 py-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-text-primary">
                  {pr.weight_kg}kg × {pr.reps}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getPRTypeColor(pr.pr_type)}`}
                >
                  {getPRTypeLabel(pr.pr_type)}
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {formatDate(pr.logged_at)}
              </span>
            </div>
            {pr.estimated_1rm && (
              <div className="text-sm text-text-muted">
                Est 1RM: {pr.estimated_1rm.toFixed(1)}kg
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
