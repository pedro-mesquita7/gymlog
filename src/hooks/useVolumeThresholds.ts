import { VOLUME_ZONE_DEFAULTS, type VolumeZoneThresholds } from '../types/analytics';

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
