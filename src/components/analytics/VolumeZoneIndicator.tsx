import type { VolumeThresholds } from '../../types/analytics';

interface VolumeZoneIndicatorProps {
  thresholds: VolumeThresholds;
  onThresholdsChange?: (thresholds: VolumeThresholds) => void;
}

/**
 * Color-coded zone legend for volume chart (VOL-02)
 * With optional inline threshold editing
 */
export function VolumeZoneIndicator({
  thresholds,
  onThresholdsChange
}: VolumeZoneIndicatorProps) {
  const { low, optimal } = thresholds;

  const handleLowChange = (value: number) => {
    if (onThresholdsChange && value > 0 && value < optimal) {
      onThresholdsChange({ ...thresholds, low: value });
    }
  };

  const handleOptimalChange = (value: number) => {
    if (onThresholdsChange && value > low) {
      onThresholdsChange({ ...thresholds, optimal: value });
    }
  };

  return (
    <div className="flex items-center gap-6 text-sm">
      {/* Under zone */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-chart-zone-under" />
        <span className="text-text-secondary">
          Under-training (&lt;
          {onThresholdsChange ? (
            <input
              type="number"
              value={low}
              onChange={(e) => handleLowChange(Number(e.target.value))}
              className="w-12 mx-1 px-1 bg-bg-tertiary border border-border-primary rounded text-text-primary text-center"
              min="1"
              max={optimal - 1}
            />
          ) : (
            <span className="mx-1">{low}</span>
          )}
          sets)
        </span>
      </div>

      {/* Optimal zone */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-chart-zone-optimal" />
        <span className="text-text-secondary">
          Optimal (
          {onThresholdsChange ? (
            <input
              type="number"
              value={low}
              onChange={(e) => handleLowChange(Number(e.target.value))}
              className="w-12 mx-1 px-1 bg-bg-tertiary border border-border-primary rounded text-text-primary text-center"
              min="1"
              max={optimal - 1}
            />
          ) : (
            <span>{low}</span>
          )}
          -
          {onThresholdsChange ? (
            <input
              type="number"
              value={optimal}
              onChange={(e) => handleOptimalChange(Number(e.target.value))}
              className="w-12 mx-1 px-1 bg-bg-tertiary border border-border-primary rounded text-text-primary text-center"
              min={low + 1}
            />
          ) : (
            <span>{optimal}</span>
          )}
          sets)
        </span>
      </div>

      {/* High zone */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-chart-zone-high" />
        <span className="text-text-secondary">
          High-volume (&gt;
          {onThresholdsChange ? (
            <input
              type="number"
              value={optimal}
              onChange={(e) => handleOptimalChange(Number(e.target.value))}
              className="w-12 mx-1 px-1 bg-bg-tertiary border border-border-primary rounded text-text-primary text-center"
              min={low + 1}
            />
          ) : (
            <span className="mx-1">{optimal}</span>
          )}
          sets)
        </span>
      </div>
    </div>
  );
}
