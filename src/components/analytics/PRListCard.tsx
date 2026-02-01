import { PRList } from '../history/PRList';

interface PRListCardProps {
  exerciseId: string;
  exerciseName: string;
}

/**
 * Card wrapper for PRList component in Analytics context (PR-01)
 */
export function PRListCard({ exerciseId, exerciseName }: PRListCardProps) {
  return (
    <div className="bg-bg-tertiary/50 rounded-lg p-4">
      <PRList exerciseId={exerciseId} exerciseName={exerciseName} />
    </div>
  );
}
