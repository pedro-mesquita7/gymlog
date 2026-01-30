import Body, { type ExtendedBodyPart, type Slug } from 'react-muscle-highlighter';
import type { MuscleHeatMapData, UseVolumeThresholdsReturn } from '../../types/analytics';

interface MuscleHeatMapProps {
  data: MuscleHeatMapData[];
  thresholds: UseVolumeThresholdsReturn;
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
 * Calculate color for muscle group based on training volume relative to thresholds.
 * Returns HSL color with opacity for visual heat map effect.
 */
function getColorForVolume(totalSets: number, low: number, optimal: number): string {
  if (totalSets === 0) {
    // No training - neutral gray
    return 'rgba(100, 100, 100, 0.3)';
  }

  if (totalSets < low) {
    // Under-training - red tint, opacity based on how close to low threshold
    const ratio = totalSets / low;
    const opacity = 0.3 + ratio * 0.5; // 0.3 to 0.8
    return `hsla(0, 70%, 50%, ${opacity})`;
  }

  if (totalSets <= optimal) {
    // Optimal zone - green tint, full opacity
    const ratio = (totalSets - low) / (optimal - low);
    const opacity = 0.5 + ratio * 0.4; // 0.5 to 0.9
    return `hsla(142, 70%, 45%, ${opacity})`;
  }

  // Over-training - yellow/orange tint
  const excessRatio = Math.min((totalSets - optimal) / optimal, 1);
  const opacity = 0.6 + excessRatio * 0.3; // 0.6 to 0.9
  return `hsla(45, 80%, 50%, ${opacity})`;
}

export function MuscleHeatMap({ data, thresholds }: MuscleHeatMapProps) {
  // Build heat map data by mapping our muscle groups to package slugs
  const bodyData: ExtendedBodyPart[] = [];

  data.forEach((muscleData) => {
    const slugs = MUSCLE_GROUP_SLUGS[muscleData.muscleGroup];
    if (!slugs) {
      console.warn(`Unknown muscle group: ${muscleData.muscleGroup}`);
      return;
    }

    const groupThreshold = thresholds.getThreshold(muscleData.muscleGroup);
    const color = getColorForVolume(
      muscleData.totalSets,
      groupThreshold.low,
      groupThreshold.optimal
    );

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
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Front</h3>
          <div className="bg-zinc-900 rounded-lg p-4">
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
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Back</h3>
          <div className="bg-zinc-900 rounded-lg p-4">
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
      <div className="bg-zinc-900 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Training Volume (Last 28 Days)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.map((muscleData) => {
            const groupThreshold = thresholds.getThreshold(muscleData.muscleGroup);
            const color = getColorForVolume(
              muscleData.totalSets,
              groupThreshold.low,
              groupThreshold.optimal
            );

            let zoneLabel = '';
            if (muscleData.totalSets === 0) zoneLabel = 'No data';
            else if (muscleData.totalSets < groupThreshold.low) zoneLabel = 'Under';
            else if (muscleData.totalSets <= groupThreshold.optimal) zoneLabel = 'Optimal';
            else zoneLabel = 'High';

            return (
              <div key={muscleData.muscleGroup} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-300 font-medium">
                    {muscleData.muscleGroup}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {muscleData.totalSets} sets · {zoneLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zone explanation */}
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsla(0, 70%, 50%, 0.7)' }} />
              <span>Under-training (&lt; {thresholds.defaultThresholds.low} sets/week)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsla(142, 70%, 45%, 0.7)' }} />
              <span>Optimal ({thresholds.defaultThresholds.low}-{thresholds.defaultThresholds.optimal} sets/week)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsla(45, 80%, 50%, 0.7)' }} />
              <span>High volume (&gt; {thresholds.defaultThresholds.optimal} sets/week)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
