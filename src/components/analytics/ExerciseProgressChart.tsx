import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { ChartContainer } from './ChartContainer';
import type { ProgressPoint } from '../../types/analytics';

interface ExerciseProgressChartProps {
  data: ProgressPoint[];
  exerciseName: string;
  showVolume?: boolean;
}

/**
 * Line chart showing exercise progress over time (CHART-01, CHART-02, CHART-03)
 * Displays max weight (solid line) and estimated 1RM (dashed line)
 */
export function ExerciseProgressChart({
  data,
  exerciseName,
  showVolume = false
}: ExerciseProgressChartProps) {
  // Memoize chart data to prevent re-renders (Pitfall 2)
  const chartData = useMemo(() => data, [data]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No data yet. Log workouts to see your {exerciseName} progress.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-400">{exerciseName} Progress</h3>
      <ChartContainer height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--chart-muted) / 0.3)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            stroke="hsl(var(--chart-muted))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
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
            labelFormatter={(date) => format(new Date(date), 'PPP')}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} kg`,
              name === 'maxWeight' ? 'Max Weight' :
              name === 'max1rm' ? 'Est. 1RM' : 'Volume'
            ]}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            name="maxWeight"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={{ r: 3, fill: 'hsl(var(--accent))' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="max1rm"
            name="max1rm"
            stroke="hsl(var(--chart-success))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          {showVolume && (
            <>
              <YAxis
                yAxisId="volume"
                orientation="right"
                stroke="hsl(var(--chart-primary))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Line
                type="monotone"
                dataKey="totalVolume"
                name="totalVolume"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={1}
                dot={false}
                yAxisId="volume"
              />
            </>
          )}
        </LineChart>
      </ChartContainer>
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-accent rounded" />
          Max Weight
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: 'hsl(var(--chart-success))' }} />
          Est. 1RM
        </span>
      </div>
    </div>
  );
}
