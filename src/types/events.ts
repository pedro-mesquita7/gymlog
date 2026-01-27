// Base event type with required audit columns (DATA-07)
export interface BaseEvent {
  _event_id: string;      // UUID v7, timestamp-sortable
  _created_at: string;    // ISO 8601 timestamp
  event_type: string;     // Discriminator for event types
}

// Exercise events (EXER-01, EXER-02, EXER-03)
export interface ExerciseCreatedEvent extends BaseEvent {
  event_type: 'exercise_created';
  exercise_id: string;
  name: string;
  muscle_group: string;
  is_global: boolean;
  gym_id: string | null;  // null if is_global is true
}

export interface ExerciseUpdatedEvent extends BaseEvent {
  event_type: 'exercise_updated';
  exercise_id: string;
  name: string;
  muscle_group: string;
  is_global: boolean;
  gym_id: string | null;
}

export interface ExerciseDeletedEvent extends BaseEvent {
  event_type: 'exercise_deleted';
  exercise_id: string;
}

// Gym events (GYM-01, GYM-02, GYM-03)
export interface GymCreatedEvent extends BaseEvent {
  event_type: 'gym_created';
  gym_id: string;
  name: string;
  location: string | null;
}

export interface GymUpdatedEvent extends BaseEvent {
  event_type: 'gym_updated';
  gym_id: string;
  name: string;
  location: string | null;
}

export interface GymDeletedEvent extends BaseEvent {
  event_type: 'gym_deleted';
  gym_id: string;
}

// Union type for all events
export type GymLogEvent =
  | ExerciseCreatedEvent
  | ExerciseUpdatedEvent
  | ExerciseDeletedEvent
  | GymCreatedEvent
  | GymUpdatedEvent
  | GymDeletedEvent;

// Muscle groups as defined in PROJECT.md
export const MUSCLE_GROUPS = [
  'Chest', 'Upper Back', 'Lats', 'Front Delts', 'Side Delts', 'Rear Delts',
  'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];
