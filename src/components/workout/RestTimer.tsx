import { useEffect, useState } from 'react';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useAudioNotification, useVibration } from '../../hooks/useAudioNotification';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

interface RestTimerProps {
  restSeconds?: number | null;  // Override from template exercise
  onComplete?: () => void;
}

export function RestTimer({ restSeconds, onComplete }: RestTimerProps) {
  const defaultRestSeconds = useWorkoutStore(state => state.defaultRestSeconds);
  const [showTimer, setShowTimer] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  const targetSeconds = restSeconds ?? defaultRestSeconds;
  const { seconds, isRunning, start, pause, resume, extend, skip } = useRestTimer(targetSeconds);
  const { play } = useAudioNotification();
  const { vibrate } = useVibration();

  // Notify when timer reaches 0
  useEffect(() => {
    if (seconds === 0 && !hasNotified && showTimer) {
      play();
      vibrate([200, 100, 200, 100, 200]);  // Triple vibration pattern
      setHasNotified(true);
      onComplete?.();
    }
  }, [seconds, hasNotified, showTimer, play, vibrate, onComplete]);

  const handleStart = () => {
    setShowTimer(true);
    setHasNotified(false);
    start(targetSeconds);
  };

  const handleExtend = (additionalSeconds: number) => {
    extend(additionalSeconds);
    setHasNotified(false);
  };

  const handleSkip = () => {
    skip();
    setShowTimer(false);
  };

  const handleDismiss = () => {
    setShowTimer(false);
    setHasNotified(false);
  };

  // Format seconds as M:SS
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Not started yet - show start button
  if (!showTimer) {
    return (
      <button
        onClick={handleStart}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
      >
        Start Rest ({formatTime(targetSeconds)})
      </button>
    );
  }

  // Timer complete
  if (seconds === 0) {
    return (
      <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 text-center">
        <div className="text-green-400 font-bold mb-2">Rest Complete!</div>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Timer running
  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      {/* Timer display */}
      <div className="text-center mb-4">
        <div className="text-4xl font-mono font-bold">{formatTime(seconds)}</div>
        <div className="text-sm text-zinc-500 mt-1">Rest Time</div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {isRunning ? (
          <button
            onClick={pause}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={resume}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
          >
            Resume
          </button>
        )}
        <button
          onClick={() => handleExtend(30)}
          className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
        >
          +30s
        </button>
        <button
          onClick={() => handleExtend(60)}
          className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
        >
          +1m
        </button>
        <button
          onClick={handleSkip}
          className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-zinc-400 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
