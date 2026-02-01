import { useEffect } from 'react';
import { useExerciseProgression } from '../../hooks/useExerciseProgression';
import { useProgressionAlertStore } from '../../stores/useProgressionAlertStore';

interface ProgressionAlertProps {
  exerciseId: string;  // Currently used exercise (may be substituted)
  originalExerciseId: string;  // Template exercise (used for progression lookup)
  currentGymId: string;
}

export function ProgressionAlert({
  // exerciseId is for potential future use (substitution tracking)
  originalExerciseId,
  currentGymId,
}: ProgressionAlertProps) {
  // Initialize session boundary detection on mount
  const initSession = useProgressionAlertStore((state) => state.initSession);
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Fetch progression data for this exercise
  const { data, isLoading } = useExerciseProgression({
    exerciseId: originalExerciseId,
    gymId: currentGymId,
  });

  // Get dismissal state
  const isAlertDismissed = useProgressionAlertStore((state) => state.isAlertDismissed);
  const dismissAlert = useProgressionAlertStore((state) => state.dismissAlert);

  // Don't render if loading, no data, or unknown status
  if (isLoading || !data || data.status === 'unknown') {
    return null;
  }

  // Check if this alert was dismissed in current session
  if (
    (data.status === 'plateau' || data.status === 'regressing') &&
    isAlertDismissed(originalExerciseId, data.status)
  ) {
    return null;
  }

  // Status config
  const statusConfig = {
    progressing: {
      icon: '↗',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      textColor: 'text-success',
      title: 'Progressing',
      message: 'Keep up the great work! You hit a PR recently.',
      dismissible: false,
    },
    plateau: {
      icon: '→',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      textColor: 'text-warning',
      title: 'Plateau Detected',
      message: 'No PR in 4+ weeks. Try varying rep ranges or increasing weight by 2.5kg.',
      dismissible: true,
    },
    regressing: {
      icon: '↘',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/30',
      textColor: 'text-error',
      title: 'Regression Alert',
      message: `Weight or volume down ${
        data.weightDropPct
          ? `${Math.round(data.weightDropPct)}%`
          : data.volumeDropPct
          ? `${Math.round(data.volumeDropPct)}%`
          : 'significantly'
      } from recent average. Check recovery and nutrition.`,
      dismissible: true,
    },
  };

  const config = statusConfig[data.status];

  const handleDismiss = () => {
    if (data.status === 'plateau' || data.status === 'regressing') {
      dismissAlert(originalExerciseId, data.status);
    }
  };

  return (
    <div
      className={`border rounded-2xl p-3 mb-4 ${config.bgColor} ${config.borderColor} ${config.textColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side: icon + text */}
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">
            {config.icon}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{config.title}</h3>
            <p className="text-xs mt-1 opacity-90">{config.message}</p>
          </div>
        </div>

        {/* Right side: dismiss button (only for plateau/regressing) */}
        {config.dismissible && (
          <button
            onClick={handleDismiss}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
