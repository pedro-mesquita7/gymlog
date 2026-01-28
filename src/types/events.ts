import type { TemplateExercise } from './template';

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
  is_global: boolean;  // false = track weight per-gym
}

export interface ExerciseUpdatedEvent extends BaseEvent {
  event_type: 'exercise_updated';
  exercise_id: string;
  name: string;
  muscle_group: string;
  is_global: boolean;
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

// Template events (TMPL-01 through TMPL-07)
export interface TemplateCreatedEvent extends BaseEvent {
  event_type: 'template_created';
  template_id: string;
  name: string;
  exercises: TemplateExercise[];
}

export interface TemplateUpdatedEvent extends BaseEvent {
  event_type: 'template_updated';
  template_id: string;
  name: string;
  exercises: TemplateExercise[];
}

export interface TemplateDeletedEvent extends BaseEvent {
  event_type: 'template_deleted';
  template_id: string;
}

export interface TemplateArchivedEvent extends BaseEvent {
  event_type: 'template_archived';
  template_id: string;
  is_archived: boolean;  // true = archive, false = restore
}

// Workout events (LOG-01 through LOG-09)
export interface WorkoutStartedEvent extends BaseEvent {
  event_type: 'workout_started';
  workout_id: string;
  template_id: string;
  gym_id: string;
  started_at: string;
}

export interface SetLoggedEvent extends BaseEvent {
  event_type: 'set_logged';
  workout_id: string;
  set_id: string;
  exercise_id: string;           // Actual exercise used (may be substitution)
  original_exercise_id: string;  // Template's exercise
  weight_kg: number;
  reps: number;
  rir: number | null;
}

export interface WorkoutCompletedEvent extends BaseEvent {
  event_type: 'workout_completed';
  workout_id: string;
  completed_at: string;
}

export interface WorkoutCancelledEvent extends BaseEvent {
  event_type: 'workout_cancelled';
  workout_id: string;
  cancelled_at: string;
}

// Union type for all events
export type GymLogEvent =
  | ExerciseCreatedEvent
  | ExerciseUpdatedEvent
  | ExerciseDeletedEvent
  | GymCreatedEvent
  | GymUpdatedEvent
  | GymDeletedEvent
  | TemplateCreatedEvent
  | TemplateUpdatedEvent
  | TemplateDeletedEvent
  | TemplateArchivedEvent
  | WorkoutStartedEvent
  | SetLoggedEvent
  | WorkoutCompletedEvent
  | WorkoutCancelledEvent;

// Muscle groups as defined in PROJECT.md
export const MUSCLE_GROUPS = [
  'Chest', 'Upper Back', 'Lats', 'Front Delts', 'Side Delts', 'Rear Delts',
  'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];
