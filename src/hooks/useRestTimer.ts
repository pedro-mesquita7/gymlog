import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRestTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  extend: (additionalSeconds: number) => void;
  skip: () => void;
}

export function useRestTimer(initialSeconds: number = 90): UseRestTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Clear interval on unmount (CRITICAL: prevents memory leak)
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (seconds <= 0 && isRunning) {
        setIsRunning(false);
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setIsRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, seconds]);

  const start = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (seconds > 0) {
      setIsRunning(true);
    }
  }, [seconds]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  const extend = useCallback((additionalSeconds: number) => {
    setSeconds(s => s + additionalSeconds);
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  const skip = useCallback(() => {
    setSeconds(0);
    setIsRunning(false);
  }, []);

  return { seconds, isRunning, start, pause, resume, reset, extend, skip };
}
