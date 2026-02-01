import Body, { type ExtendedBodyPart, type Slug } from 'react-muscle-highlighter';
import { getVolumeZone, type MuscleHeatMapData, type VolumeZoneThresholds } from '../../types/analytics';

interface MuscleHeatMapProps {
  data: MuscleHeatMapData[];
  getThresholds: (muscleGroup: string) => VolumeZoneThresholds;
}

// Map our 6 standard muscle groups to react-muscle-highlighter slugs
const MUSCLE_GROUP_SLUGS: Record<string, Slug[]> = {
  Chest: ['chest'],
  Back: ['upper-back', 'lower-back', 'trapezius'],
  Shoulders: ['deltoids'],
  Legs: ['quadriceps', 'hamstring', 'gluteal', 'calves'],
  Arms: ['biceps', 'triceps', 'forearm'],
  Core: ['abs', 'obliques'],
};

/**
 * Calculate color for muscle group based on 5-zone volume thresholds.
 * Uses direct OKLCH values for SVG compatibility (CSS variables may not work in SVG fill).
 */
function getColorForVolume(totalSets: number, thresholds: VolumeZoneThresholds): string {
  if (totalSets === 0) return 'rgba(100, 100, 100, 0.3)'; // No data - neutral gray

  const zone = getVolumeZone(totalSets, thresholds);
  const colors = {
    under:   'oklch(63% 0.22 25 / 0.7)',    // red
    minimum: 'oklch(75% 0.15 85 / 0.7)',    // yellow
    optimal: 'oklch(65% 0.17 145 / 0.8)',   // green
    high:    'oklch(70% 0.15 65 / 0.7)',    // orange
    over:    'oklch(63% 0.22 25 / 0.8)',    // red
  };
  return colors[zone];
}

// Zone legend colors matching the body diagram
const ZONE_LEGEND = [
  { zone: 'under', label: 'Under MEV', color: 'oklch(63% 0.22 25 / 0.7)' },
  { zone: 'minimum', label: 'MEV-MAV (Minimum)', color: 'oklch(75% 0.15 85 / 0.7)' },
  { zone: 'optimal', label: 'MAV Range (Optimal)', color: 'oklch(65% 0.17 145 / 0.8)' },
  { zone: 'high', label: 'MAV-MRV (High)', color: 'oklch(70% 0.15 65 / 0.7)' },
  { zone: 'over', label: 'Over MRV', color: 'oklch(63% 0.22 25 / 0.8)' },
];

export function MuscleHeatMap({ data, getThresholds }: MuscleHeatMapProps) {
  // Build heat map data by mapping our muscle groups to package slugs
  const bodyData: ExtendedBodyPart[] = [];

  data.forEach((muscleData) => {
    const slugs = MUSCLE_GROUP_SLUGS[muscleData.muscleGroup];
    if (!slugs) {
      console.warn(`Unknown muscle group: ${muscleData.muscleGroup}`);
      return;
    }

    const thresholds = getThresholds(muscleData.muscleGroup);
    const color = getColorForVolume(muscleData.totalSets, thresholds);

    // Apply color to all slugs for this muscle group
    slugs.forEach((slug) => {
      bodyData.push({ slug, color });
    });
  });

  return (
    <div className="space-y-4">
      {/* Body diagrams */}
      <div className="flex flex-col sm:flex-row gap-8 justify-center items-start">
        {/* Front view */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Front</h3>
          <div className="bg-bg-secondary rounded-lg p-4">
            <Body
              data={bodyData}
              side="front"
              gender="male"
              scale={1.2}
              border="none"
              defaultFill="#3f3f3f"
            />
          </div>
        </div>

        {/* Back view */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Back</h3>
          <div className="bg-bg-secondary rounded-lg p-4">
            <Body
              data={bodyData}
              side="back"
              gender="male"
              scale={1.2}
              border="none"
              defaultFill="#3f3f3f"
            />
          </div>
        </div>
      </div>

      {/* Legend with muscle group totals */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">Training Volume</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.map((muscleData) => {
            const thresholds = getThresholds(muscleData.muscleGroup);
            const color = getColorForVolume(muscleData.totalSets, thresholds);
            const zone = muscleData.totalSets === 0
              ? 'No data'
              : getVolumeZone(muscleData.totalSets, thresholds).replace(/^\w/, c => c.toUpperCase());

            return (
              <div key={muscleData.muscleGroup} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary font-medium">
                    {muscleData.muscleGroup}
                  </div>
                  <div className="text-xs text-text-muted">
                    {muscleData.totalSets} sets · {zone}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zone explanation — 5-zone legend */}
        <div className="mt-4 pt-4 border-t border-border-primary">
          <div className="text-xs text-text-muted space-y-1">
            {ZONE_LEGEND.map(({ zone, label, color }) => (
              <div key={zone} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
