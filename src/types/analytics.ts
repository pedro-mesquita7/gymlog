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

// Weekly comparison data (CHART-04)
export interface WeeklyComparison {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  weekStart: string;      // ISO date string
  maxWeight: number;
  max1rm: number;
  totalVolume: number;
  setCount: number;
  prevMaxWeight: number | null;
  prevVolume: number | null;
  weightChangePct: number | null;
  volumeChangePct: number | null;
}

// Hook return types
export interface UseExerciseProgressReturn {
  data: ProgressPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseWeeklyComparisonReturn {
  data: WeeklyComparison[];
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

// Volume threshold configuration (VOL-02)
export interface VolumeThresholds {
  low: number;       // Below this = under-training (default: 10)
  optimal: number;   // Above low, at or below this = optimal (default: 20)
  // Above optimal = over-training
}

// Per-muscle-group threshold overrides
export interface MuscleGroupThresholds {
  [muscleGroup: string]: VolumeThresholds;
}

// Hook return types
export interface UseVolumeAnalyticsReturn {
  volumeData: VolumeByMuscleGroup[];
  heatMapData: MuscleHeatMapData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseVolumeThresholdsReturn {
  thresholds: MuscleGroupThresholds;
  defaultThresholds: VolumeThresholds;
  setThreshold: (muscleGroup: string, thresholds: VolumeThresholds) => void;
  resetThreshold: (muscleGroup: string) => void;
  getThreshold: (muscleGroup: string) => VolumeThresholds;
}
