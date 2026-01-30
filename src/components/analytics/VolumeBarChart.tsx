import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartContainer } from './ChartContainer';
import type { VolumeByMuscleGroup, UseVolumeThresholdsReturn } from '../../types/analytics';

interface VolumeBarChartProps {
  data: VolumeByMuscleGroup[];
  thresholds: UseVolumeThresholdsReturn;
}

// Transform flat volume data into Recharts-friendly grouped format
function transformVolumeData(data: VolumeByMuscleGroup[]) {
  // Group by muscle group
  const byMuscle = new Map<string, Record<string, number>>();
  const weeks = new Set<string>();

  data.forEach(({ muscleGroup, weekStart, setCount }) => {
    if (!byMuscle.has(muscleGroup)) {
      byMuscle.set(muscleGroup, {});
    }
    const weekLabel = format(parseISO(weekStart), 'MMM d');
    byMuscle.get(muscleGroup)![weekLabel] = setCount;
    weeks.add(weekLabel);
  });

  // Convert to array of objects for Recharts
  return {
    chartData: Array.from(byMuscle.entries()).map(([muscleGroup, weekData]) => ({
      muscleGroup,
      ...weekData
    })),
    weekLabels: Array.from(weeks).sort()
  };
}

/**
 * Grouped bar chart showing sets per week by muscle group (VOL-01)
 * With color-coded background zones for training volume (VOL-02)
 */
export function VolumeBarChart({ data, thresholds }: VolumeBarChartProps) {
  // Memoize transformed data to prevent unnecessary re-renders
  const { chartData, weekLabels } = useMemo(() => transformVolumeData(data), [data]);

  // Get default thresholds for zone backgrounds
  const { low, optimal } = thresholds.defaultThresholds;

  // Calculate max value for yellow zone upper bound
  const maxValue = Math.max(
    ...chartData.flatMap(row =>
      weekLabels.map(week => ((row as any)[week] as number) || 0)
    ),
    optimal + 5
  );

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No volume data yet. Log workouts to see muscle group training volume.
      </div>
    );
  }

  // Color palette for weeks (using CSS variables pattern from ExerciseProgressChart)
  const weekColors = [
    'hsl(var(--chart-1, 173 80% 40%))',     // cyan-ish
    'hsl(var(--chart-2, 197 71% 73%))',     // blue-ish
    'hsl(var(--chart-3, 43 74% 66%))',      // yellow-ish
    'hsl(var(--chart-4, 27 87% 67%))'       // orange-ish
  ];

  return (
    <ChartContainer height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
      >
        {/* Background zones (render first so bars appear on top) */}
        <ReferenceArea
          y1={0}
          y2={low}
          fill="var(--color-danger, #ef4444)"
          fillOpacity={0.08}
          ifOverflow="extendDomain"
        />
        <ReferenceArea
          y1={low}
          y2={optimal}
          fill="var(--color-success, #22c55e)"
          fillOpacity={0.08}
          ifOverflow="extendDomain"
        />
        <ReferenceArea
          y1={optimal}
          y2={maxValue}
          fill="var(--color-warning, #eab308)"
          fillOpacity={0.08}
          ifOverflow="extendDomain"
        />

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--chart-muted) / 0.3)"
        />
        <XAxis
          dataKey="muscleGroup"
          stroke="hsl(var(--chart-muted))"
          fontSize={12}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          label={{ value: 'Sets', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--chart-muted))' } }}
          stroke="hsl(var(--chart-muted))"
          fontSize={12}
          width={45}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(240 6% 10%)',
            border: '1px solid hsl(240 4% 16%)',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined) => [`${value || 0} sets`, '']}
        />
        <Legend
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="rect"
        />

        {/* One Bar per week */}
        {weekLabels.map((week, idx) => (
          <Bar
            key={week}
            dataKey={week}
            fill={weekColors[idx % weekColors.length]}
            minPointSize={3}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
