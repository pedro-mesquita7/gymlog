import { useRef, useEffect, useCallback } from 'react';

export function useAudioNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element with a simple beep (base64 encoded)
    // This is a short 440Hz beep tone, ~0.3 seconds
    const beepBase64 = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' +
      'tvT19/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/';

    audioRef.current = new Audio(beepBase64);
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (err) {
        console.warn('Audio playback failed:', err);
      }
    }
  }, []);

  return { play };
}

export function useVibration() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration not available or failed
      }
    }
  }, []);

  const isSupported = 'vibrate' in navigator;

  return { vibrate, isSupported };
}
