import { usePRList } from '../../hooks/useHistory';

interface PRListProps {
  exerciseId: string;
  exerciseName: string;
}

/**
 * Display list of all PRs for an exercise
 */
export function PRList({ exerciseId, exerciseName }: PRListProps) {
  const { data: prs, isLoading } = usePRList(exerciseId);

  if (isLoading) {
    return (
      <div className="text-center text-zinc-500 py-8">
        Loading PR history...
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-8">
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
        return 'bg-accent text-black';
      case 'weight':
        return 'bg-blue-500 text-white';
      case '1rm':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-zinc-600 text-white';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-300">
        PR History - {exerciseName}
      </h3>
      <div className="space-y-2">
        {prs.map((pr) => (
          <div
            key={pr.set_id}
            className="bg-zinc-800/50 rounded-lg px-4 py-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-zinc-200">
                  {pr.weight_kg}kg × {pr.reps}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getPRTypeColor(pr.pr_type)}`}
                >
                  {getPRTypeLabel(pr.pr_type)}
                </span>
              </div>
              <span className="text-sm text-zinc-400">
                {formatDate(pr.logged_at)}
              </span>
            </div>
            <div className="text-sm text-zinc-500">
              Est 1RM: {pr.estimated_1rm.toFixed(1)}kg
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
