import { useEffect, useState } from 'react';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useAudioNotification, useVibration } from '../../hooks/useAudioNotification';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

interface RestTimerProps {
  restSeconds?: number | null;  // Override from template exercise
  autoStartTrigger: number;      // Increment to trigger auto-start
  onComplete?: () => void;
}

export function RestTimer({ restSeconds, autoStartTrigger, onComplete }: RestTimerProps) {
  const defaultRestSeconds = useWorkoutStore(state => state.defaultRestSeconds);
  const [isActive, setIsActive] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

  const targetSeconds = restSeconds ?? defaultRestSeconds;
  const { seconds, isRunning, start, pause, resume, extend, skip } = useRestTimer(targetSeconds);
  const { play } = useAudioNotification();
  const { vibrate } = useVibration();

  // Auto-start timer when trigger increments
  useEffect(() => {
    if (autoStartTrigger > 0) {
      setIsActive(true);
      setHasNotified(false);
      setShowCompleteMessage(false);
      start(targetSeconds);
    }
  }, [autoStartTrigger, targetSeconds, start]);

  // Notify when timer reaches 0
  useEffect(() => {
    if (seconds === 0 && !hasNotified && isActive) {
      play();
      vibrate([200, 100, 200, 100, 200]);  // Triple vibration pattern
      setHasNotified(true);
      setShowCompleteMessage(true);
      onComplete?.();

      // Auto-hide "Rest Complete!" message after 3 seconds
      const timeout = setTimeout(() => {
        setShowCompleteMessage(false);
        setIsActive(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [seconds, hasNotified, isActive, play, vibrate, onComplete]);

  const handleExtend = (additionalSeconds: number) => {
    extend(additionalSeconds);
    setHasNotified(false);
    setShowCompleteMessage(false);
  };

  const handleSkip = () => {
    skip();
    setIsActive(false);
    setShowCompleteMessage(false);
  };

  // Format seconds as M:SS
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Not active - render nothing
  if (!isActive) {
    return null;
  }

  // Timer complete - show message briefly
  if (showCompleteMessage) {
    return (
      <div className="sticky top-0 z-10 bg-success text-text-primary px-4 py-3 rounded-b-lg flex items-center justify-between">
        <span className="font-bold">Rest Complete!</span>
        <button
          onClick={handleSkip}
          className="text-text-primary/80 hover:text-text-primary text-sm"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Timer running - persistent banner
  return (
    <div className="sticky top-0 z-10 bg-accent text-black px-4 py-3 rounded-b-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-lg">{formatTime(seconds)}</span>
        <span className="text-sm opacity-80">Rest Time</span>
      </div>
      <div className="flex gap-2">
        {isRunning ? (
          <button
            onClick={pause}
            className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded text-sm transition-colors"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={resume}
            className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded text-sm transition-colors"
          >
            Resume
          </button>
        )}
        <button
          onClick={() => handleExtend(30)}
          className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded text-sm transition-colors"
        >
          +30s
        </button>
        <button
          onClick={handleSkip}
          className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded text-sm transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
