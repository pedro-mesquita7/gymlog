import { useState, useEffect, useCallback } from 'react';
import type { MuscleGroupThresholds, VolumeThresholds, UseVolumeThresholdsReturn } from '../types/analytics';

const STORAGE_KEY = 'gymlog-volume-thresholds';
const DEFAULT_THRESHOLDS: VolumeThresholds = {
  low: 10,
  optimal: 20,
};

/**
 * Hook for managing volume threshold configuration (VOL-02)
 * Persists per-muscle-group thresholds in localStorage
 * Falls back to default thresholds (low: 10, optimal: 20)
 */
export function useVolumeThresholds(): UseVolumeThresholdsReturn {
  const [thresholds, setThresholds] = useState<MuscleGroupThresholds>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as MuscleGroupThresholds;
      }
    } catch (err) {
      console.warn('Failed to load volume thresholds from localStorage:', err);
    }
    return {};
  });

  // Persist to localStorage whenever thresholds change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
    } catch (err) {
      console.warn('Failed to save volume thresholds to localStorage:', err);
    }
  }, [thresholds]);

  const setThreshold = useCallback((muscleGroup: string, newThresholds: VolumeThresholds) => {
    setThresholds(prev => ({
      ...prev,
      [muscleGroup]: newThresholds,
    }));
  }, []);

  const resetThreshold = useCallback((muscleGroup: string) => {
    setThresholds(prev => {
      const updated = { ...prev };
      delete updated[muscleGroup];
      return updated;
    });
  }, []);

  const getThreshold = useCallback((muscleGroup: string): VolumeThresholds => {
    return thresholds[muscleGroup] || DEFAULT_THRESHOLDS;
  }, [thresholds]);

  return {
    thresholds,
    defaultThresholds: DEFAULT_THRESHOLDS,
    setThreshold,
    resetThreshold,
    getThreshold,
  };
}
