import type { TimeRange } from '../../types/analytics';

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: TimeRange[] = ['1M', '3M', '6M', '1Y', 'ALL'];

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Time range">
      {OPTIONS.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            value === option
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
