export interface DatabaseStatus {
  isInitialized: boolean;
  isConnected: boolean;
  isPersistent: boolean;  // true if OPFS, false if memory-only
  error: string | null;
}

// Entity types derived from events (for UI display)
export interface Exercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  is_global: boolean;  // false = track weight per-gym
}

export interface Gym {
  gym_id: string;
  name: string;
  location: string | null;
  exercise_count: number;  // Count of gym-specific exercises
}
