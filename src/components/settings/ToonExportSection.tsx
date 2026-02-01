import { useState, useCallback, useRef, useEffect } from 'react';
import { useRotationStore } from '../../stores/useRotationStore';
import {
  exportLastWorkoutToon,
  exportRotationCycleToon,
  exportTimeRangeToon,
} from '../../services/toon-export';

type ExportScope = 'last_workout' | 'rotation_cycle' | 'time_range';
type TimeRangeDays = 30 | 90 | 180 | 365 | null;

export function ToonExportSection() {
  const [scope, setScope] = useState<ExportScope>('last_workout');
  const [rotationCount, setRotationCount] = useState(1);
  const [timeRangeDays, setTimeRangeDays] = useState<TimeRangeDays>(90);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Read rotation state at render time
  const rotations = useRotationStore((s) => s.rotations);
  const activeRotationId = useRotationStore((s) => s.activeRotationId);
  const activeRotation = rotations.find(
    (r) => r.rotation_id === activeRotationId
  );
  const hasActiveRotation =
    !!activeRotation && activeRotation.template_ids.length > 0;

  // Capture rotation data for async use
  const rotationTemplateIds = activeRotation?.template_ids ?? [];
  const rotationCurrentPosition = activeRotation?.current_position ?? 0;

  const handleExport = useCallback(async (): Promise<string> => {
    switch (scope) {
      case 'last_workout':
        return exportLastWorkoutToon();
      case 'rotation_cycle':
        return exportRotationCycleToon(
          rotationCount,
          rotationTemplateIds,
          rotationCurrentPosition
        );
      case 'time_range':
        return exportTimeRangeToon(timeRangeDays);
    }
  }, [scope, rotationCount, rotationTemplateIds, rotationCurrentPosition, timeRangeDays]);

  const handleCopy = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setCopySuccess(false);

    try {
      const result = await handleExport();
      if (!result) {
        setError('No data available for this scope');
        return;
      }

      await navigator.clipboard.writeText(result);
      setCopySuccess(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to copy to clipboard'
      );
    } finally {
      setIsExporting(false);
    }
  }, [handleExport]);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const result = await handleExport();
      if (!result) {
        setError('No data available for this scope');
        return;
      }

      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const filename = `gymlog-${scope}-${date}.toon`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to download file'
      );
    } finally {
      setIsExporting(false);
    }
  }, [handleExport, scope]);

  const handleScopeChange = (newScope: ExportScope) => {
    if (newScope === 'rotation_cycle' && !hasActiveRotation) return;
    setScope(newScope);
    setError(null);
  };

  const scopeOptions: { value: ExportScope; label: string }[] = [
    { value: 'last_workout', label: 'Last Workout' },
    { value: 'rotation_cycle', label: 'Rotation' },
    { value: 'time_range', label: 'Time Range' },
  ];

  const rotationCountOptions = [1, 2, 3] as const;

  const timeRangeOptions: { value: TimeRangeDays; label: string }[] = [
    { value: 30, label: '1M' },
    { value: 90, label: '3M' },
    { value: 180, label: '6M' },
    { value: 365, label: '1Y' },
    { value: null, label: 'All' },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-text-primary">
        Export TOON
      </h2>

      <div className="bg-bg-secondary rounded-2xl p-4">
        <p className="text-sm text-text-secondary mb-3">
          Export workout data in LLM-optimized format for AI analysis
        </p>

        {/* Scope picker */}
        <div className="flex rounded-xl overflow-hidden mb-4">
          {scopeOptions.map((opt) => {
            const isActive = scope === opt.value;
            const isDisabled =
              opt.value === 'rotation_cycle' && !hasActiveRotation;

            return (
              <button
                key={opt.value}
                onClick={() => handleScopeChange(opt.value)}
                disabled={isDisabled}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-black'
                    : 'bg-bg-tertiary text-text-secondary'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Scope-specific options */}
        {scope === 'rotation_cycle' && hasActiveRotation && (
          <div className="mb-4">
            <label className="text-xs text-text-secondary mb-1.5 block">
              Cycles
            </label>
            <div className="flex rounded-xl overflow-hidden w-fit">
              {rotationCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => setRotationCount(count)}
                  className={`px-4 py-1 text-sm font-medium transition-colors ${
                    rotationCount === count
                      ? 'bg-accent text-black'
                      : 'bg-bg-tertiary text-text-secondary'
                  }`}
                >
                  {count}x
                </button>
              ))}
            </div>
          </div>
        )}

        {scope === 'time_range' && (
          <div className="mb-4">
            <label className="text-xs text-text-secondary mb-1.5 block">
              Range
            </label>
            <div className="flex rounded-xl overflow-hidden w-fit">
              {timeRangeOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setTimeRangeDays(opt.value)}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    timeRangeDays === opt.value
                      ? 'bg-accent text-black'
                      : 'bg-bg-tertiary text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={isExporting}
            className="flex-1 py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:bg-bg-tertiary disabled:text-text-muted rounded-xl font-medium text-sm transition-colors"
          >
            {copySuccess ? '\u2713 Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 py-2.5 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 disabled:bg-bg-tertiary/50 disabled:text-text-muted rounded-xl font-medium text-sm text-text-primary transition-colors"
          >
            {isExporting ? 'Exporting...' : 'Download .toon'}
          </button>
        </div>

        {/* Error display */}
        {error && <p className="text-sm text-error mt-2">{error}</p>}
      </div>
    </section>
  );
}
