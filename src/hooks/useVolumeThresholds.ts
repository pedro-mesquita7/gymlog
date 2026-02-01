import { useState, useEffect, useCallback } from 'react';
import { VOLUME_ZONE_DEFAULTS, type VolumeZoneThresholds } from '../types/analytics';
import type { MuscleGroupThresholds, VolumeThresholds, UseVolumeThresholdsReturn } from '../types/analytics';

const STORAGE_KEY = 'gymlog-volume-thresholds';
const DEFAULT_THRESHOLDS: VolumeThresholds = {
  low: 10,
  optimal: 20,
};

/**
 * Hook for managing volume threshold configuration (VOL-02) — LEGACY
 * Persists per-muscle-group thresholds in localStorage
 * Falls back to default thresholds (low: 10, optimal: 20)
 * @deprecated Use useVolumeZoneThresholds for the 5-zone system
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

/**
 * Hook for 5-zone volume thresholds (Phase 15 redesign)
 * Uses research-backed VOLUME_ZONE_DEFAULTS constants
 * Returns getThresholds function and defaults record
 */
export function useVolumeZoneThresholds() {
  const getThresholds = (muscleGroup: string): VolumeZoneThresholds => {
    return VOLUME_ZONE_DEFAULTS[muscleGroup] || VOLUME_ZONE_DEFAULTS['Chest']; // fallback
  };

  return { getThresholds, defaults: VOLUME_ZONE_DEFAULTS };
}
