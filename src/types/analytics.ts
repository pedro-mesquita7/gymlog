// Analytics types for Phase 3: History & Analytics

export interface SetHistory {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  rir: number | null;
  estimated_1rm: number | null;
  is_pr: boolean;
  is_anomaly: boolean;
  logged_at: string;
  workout_gym_id: string;
  is_global: boolean;
  matches_gym_context: boolean;
}

export interface PRRecord {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number | null;
  pr_type: 'weight' | '1rm' | 'weight_and_1rm';
  logged_at: string;
}

export interface ExerciseMax {
  max_weight: number | null;
  max_1rm: number | null;
}

// For grouping history by date
export interface HistoryByDate {
  date: string;  // YYYY-MM-DD
  sets: SetHistory[];
}

// Progress chart data point (CHART-01, CHART-02, CHART-03)
export interface ProgressPoint {
  date: string;           // ISO date string (YYYY-MM-DD)
  maxWeight: number;      // Max weight lifted that day
  max1rm: number;         // Max estimated 1RM that day
  totalVolume: number;    // Sum of (weight * reps) for day
  setCount: number;       // Number of sets
}

// Hook return types
export interface UseExerciseProgressReturn {
  data: ProgressPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Volume by muscle group (VOL-01, VOL-02)
export interface VolumeByMuscleGroup {
  muscleGroup: string;
  weekStart: string;  // ISO date string
  setCount: number;
}

// Muscle heat map data (VOL-03)
export interface MuscleHeatMapData {
  muscleGroup: string;
  totalSets: number;
}

// Hook return types
export interface UseVolumeAnalyticsReturn {
  volumeData: VolumeByMuscleGroup[];
  volumeAvgData: VolumeByMuscleGroupAvg[];
  heatMapData: MuscleHeatMapData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Progression status per exercise (Phase 7)
export interface ProgressionStatus {
  exerciseId: string;
  gymId: string;
  status: 'progressing' | 'plateau' | 'regressing' | 'unknown';
  lastPrDate: string | null;
  sessionCount4wk: number;
  weightDropPct: number | null;
  volumeDropPct: number | null;
}

// Hook return types for progression
export interface UseExerciseProgressionReturn {
  data: ProgressionStatus | null;
  isLoading: boolean;
  error: string | null;
}

// Phase 15: Analytics Redesign — Time Range

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': null,
};

// Phase 15: 5-Zone Volume Threshold System (replaces 2-zone VolumeThresholds)

export interface VolumeZoneThresholds {
  mev: number;       // Minimum Effective Volume
  mavLow: number;    // MAV range start
  mavHigh: number;   // MAV range end
  mrv: number;       // Maximum Recoverable Volume
}

export const VOLUME_ZONE_DEFAULTS: Record<string, VolumeZoneThresholds> = {
  Chest:     { mev: 10, mavLow: 12, mavHigh: 20, mrv: 22 },
  Back:      { mev: 10, mavLow: 14, mavHigh: 22, mrv: 25 },
  Shoulders: { mev: 8,  mavLow: 16, mavHigh: 22, mrv: 26 },
  Legs:      { mev: 8,  mavLow: 12, mavHigh: 18, mrv: 20 },
  Arms:      { mev: 6,  mavLow: 10, mavHigh: 16, mrv: 20 },
  Core:      { mev: 0,  mavLow: 16, mavHigh: 20, mrv: 25 },
};

// Phase 15: Volume Zone Classification

export type VolumeZone = 'under' | 'minimum' | 'optimal' | 'high' | 'over';

export function getVolumeZone(sets: number, thresholds: VolumeZoneThresholds): VolumeZone {
  if (sets < thresholds.mev) return 'under';
  if (sets < thresholds.mavLow) return 'minimum';
  if (sets <= thresholds.mavHigh) return 'optimal';
  if (sets <= thresholds.mrv) return 'high';
  return 'over';
}

// Phase 15: Summary Stats

export interface SummaryStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalPrs: number;
}

// Phase 15: Volume by Muscle Group (averaged)

export interface VolumeByMuscleGroupAvg {
  muscleGroup: string;
  avgWeeklySets: number;
}

