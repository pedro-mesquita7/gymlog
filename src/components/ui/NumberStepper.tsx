interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NumberStepper({
  value,
  onChange,
  step = 1,
  min,
  max,
  label,
  unit,
  size = 'md',
}: NumberStepperProps) {
  const increment = () => {
    const next = value + step;
    if (max === undefined || next <= max) {
      // Round to avoid floating point issues (e.g., 2.5 + 2.5 = 5.0, not 4.999...)
      onChange(Math.round(next * 100) / 100);
    }
  };

  const decrement = () => {
    const prev = value - step;
    if (min === undefined || prev >= min) {
      onChange(Math.round(prev * 100) / 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      if (min !== undefined && val < min) onChange(min);
      else if (max !== undefined && val > max) onChange(max);
      else onChange(val);
    }
  };

  const sizeClasses = {
    sm: { button: 'w-8 h-8 text-lg', input: 'w-16 text-sm py-1', container: 'gap-1' },
    md: { button: 'w-10 h-10 text-xl', input: 'w-20 text-base py-2', container: 'gap-2' },
    lg: { button: 'w-12 h-12 text-2xl', input: 'w-24 text-lg py-3', container: 'gap-2' },
  }[size];

  return (
    <div className="flex flex-col items-center">
      {label && (
        <label className="text-xs text-text-muted mb-1">{label}</label>
      )}
      <div className={`flex items-center ${sizeClasses.container}`}>
        <button
          type="button"
          onClick={decrement}
          disabled={min !== undefined && value <= min}
          className={`${sizeClasses.button} bg-bg-elevated hover:bg-border-secondary rounded-xl font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          -
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          className={`${sizeClasses.input} bg-bg-tertiary border border-border-secondary rounded-xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <button
          type="button"
          onClick={increment}
          disabled={max !== undefined && value >= max}
          className={`${sizeClasses.button} bg-bg-elevated hover:bg-border-secondary rounded-xl font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          +
        </button>
      </div>
      {unit && (
        <span className="text-xs text-text-muted mt-1">{unit}</span>
      )}
    </div>
  );
}
