import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { getVolumeZone, VOLUME_ZONE_DEFAULTS, type VolumeByMuscleGroupAvg, type VolumeZone } from '../../types/analytics';

interface VolumeBarChartProps {
  data: VolumeByMuscleGroupAvg[];
}

const ZONE_COLORS: Record<VolumeZone, string> = {
  under: 'var(--color-chart-zone-under)',
  minimum: 'var(--color-chart-zone-minimum)',
  optimal: 'var(--color-chart-zone-optimal)',
  high: 'var(--color-chart-zone-high)',
  over: 'var(--color-chart-zone-over)',
};

function getBarColor(muscleGroup: string, avgWeeklySets: number): string {
  const thresholds = VOLUME_ZONE_DEFAULTS[muscleGroup] || VOLUME_ZONE_DEFAULTS['Chest'];
  const zone = getVolumeZone(avgWeeklySets, thresholds);
  return ZONE_COLORS[zone];
}

/**
 * Bar chart showing average weekly sets per muscle group with per-bar 5-zone coloring.
 * Each bar is colored based on its muscle group's specific volume zone thresholds.
 */
export function VolumeBarChart({ data }: VolumeBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No volume data yet. Log workouts to see muscle group training volume.
      </div>
    );
  }

  return (
    <ChartContainer height={350}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-muted)" strokeOpacity={0.3} />
        <XAxis
          dataKey="muscleGroup"
          stroke="var(--color-chart-muted)"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          label={{ value: 'Avg Sets/Week', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-chart-muted)' } }}
          stroke="var(--color-chart-muted)"
          fontSize={12}
          width={55}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-chart-tooltip-bg)',
            border: '1px solid var(--color-chart-tooltip-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0} sets/week`, 'Avg Weekly Volume']}
          cursor={{ fill: 'var(--color-bg-elevated)', fillOpacity: 0.3 }}
        />
        <Bar dataKey="avgWeeklySets" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.muscleGroup, entry.avgWeeklySets)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
