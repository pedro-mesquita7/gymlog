import { ResponsiveContainer } from 'recharts';
import type { ReactElement } from 'react';

interface ChartContainerProps {
  children: ReactElement;
  height?: number;
}

/**
 * Wrapper for Recharts charts that provides fixed-height container
 * Required because ResponsiveContainer needs pixel-based height parent
 */
export function ChartContainer({ children, height = 300 }: ChartContainerProps) {
  return (
    <div style={{ width: '100%', height, minWidth: 0 }} className="relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
