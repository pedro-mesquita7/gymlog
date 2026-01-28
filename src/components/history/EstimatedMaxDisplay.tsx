interface EstimatedMaxDisplayProps {
  maxWeight: number | null;
  max1RM: number | null;
}

/**
 * Display current max weight and estimated 1RM for an exercise
 */
export function EstimatedMaxDisplay({ maxWeight, max1RM }: EstimatedMaxDisplayProps) {
  if (!maxWeight && !max1RM) {
    return null;
  }

  return (
    <div className="flex gap-4 justify-center text-sm text-zinc-400">
      {maxWeight && (
        <div>
          <span className="text-zinc-500">Max:</span>{' '}
          <span className="text-zinc-300 font-medium">{maxWeight.toFixed(1)}kg</span>
        </div>
      )}
      {max1RM && (
        <div>
          <span className="text-zinc-500">Est 1RM:</span>{' '}
          <span className="text-zinc-300 font-medium">{max1RM.toFixed(1)}kg</span>
        </div>
      )}
    </div>
  );
}
