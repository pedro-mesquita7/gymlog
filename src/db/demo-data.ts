import { uuidv7 } from 'uuidv7';
import { subDays, addHours, addMinutes } from 'date-fns';
import { getDuckDB, checkpoint } from './duckdb-init';

/**
 * Progressive overload schedule for 6 weeks of demo workouts
 */
const DEMO_SCHEDULE = [
  { week: 1, pattern: 'baseline', multiplier: 1.0 },
  { week: 2, pattern: 'progression', multiplier: 1.05 },
  { week: 3, pattern: 'progression', multiplier: 1.10 },
  { week: 4, pattern: 'plateau', multiplier: 1.10 },
  { week: 5, pattern: 'deload', multiplier: 0.90 },
  { week: 6, pattern: 'resume', multiplier: 1.15 },
];

/**
 * Base weights (kg) for each exercise
 */
const BASE_WEIGHTS: Record<string, number> = {
  'Bench Press': 60,
  'Overhead Press': 40,
  'Barbell Row': 55,
  'Lat Pulldown': 50,
  'Dumbbell Curl': 15,
  'Squat': 80,
  'Romanian Deadlift': 70,
  'Leg Press': 120,
  'Leg Curl': 30,
  'Calf Raise': 40,
};

/**
 * Round weight to nearest 2.5kg
 */
function roundWeight(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}

/**
 * Generate realistic rep count with variation
 */
function generateReps(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate RIR (Reps In Reserve) - first sets have more, last set has less
 */
function generateRIR(setIndex: number, totalSets: number): number {
  if (setIndex < totalSets - 1) {
    return 2; // First sets: 2 RIR
  }
  return Math.random() < 0.5 ? 0 : 1; // Last set: 0-1 RIR
}

/**
 * Insert event directly to DuckDB with custom timestamp
 */
async function insertEvent(
  conn: any,
  eventType: string,
  payload: any,
  timestamp: Date
): Promise<void> {
  const eventId = uuidv7();
  const timestampStr = timestamp.toISOString();
  const fullPayload = {
    event_type: eventType,
    _event_id: eventId,
    _created_at: timestampStr,
    ...payload,
  };
  const payloadJson = JSON.stringify(fullPayload).replace(/'/g, "''");

  await conn.query(`
    INSERT INTO events (_event_id, _created_at, event_type, payload)
    VALUES ('${eventId}', '${timestampStr}', '${eventType}', '${payloadJson}')
  `);
}

/**
 * Load 6 weeks of realistic demo workout data
 */
export async function loadDemoData(): Promise<void> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const now = new Date();
    let currentTimestamp = subDays(now, 43); // Start 43 days ago

    // === SETUP: Gyms, Exercises, Plans ===

    // 1. Create gym
    const gymId = uuidv7();
    await insertEvent(
      conn,
      'gym_created',
      {
        gym_id: gymId,
        name: 'Iron Works Gym',
        location: 'Downtown',
      },
      currentTimestamp
    );
    currentTimestamp = addMinutes(currentTimestamp, 1);

    // 2. Create exercises
    const exercises = [
      { name: 'Bench Press', muscle_group: 'Chest' },
      { name: 'Overhead Press', muscle_group: 'Front Delts' },
      { name: 'Barbell Row', muscle_group: 'Upper Back' },
      { name: 'Lat Pulldown', muscle_group: 'Lats' },
      { name: 'Dumbbell Curl', muscle_group: 'Biceps' },
      { name: 'Squat', muscle_group: 'Quads' },
      { name: 'Romanian Deadlift', muscle_group: 'Hamstrings' },
      { name: 'Leg Press', muscle_group: 'Quads' },
      { name: 'Leg Curl', muscle_group: 'Hamstrings' },
      { name: 'Calf Raise', muscle_group: 'Calves' },
    ];

    const exerciseMap: Record<string, string> = {};
    for (const exercise of exercises) {
      const exerciseId = uuidv7();
      exerciseMap[exercise.name] = exerciseId;
      await insertEvent(
        conn,
        'exercise_created',
        {
          exercise_id: exerciseId,
          name: exercise.name,
          muscle_group: exercise.muscle_group,
          is_global: true,
        },
        currentTimestamp
      );
      currentTimestamp = addMinutes(currentTimestamp, 1);
    }

    // 3. Create plans
    const plans = [
      {
        name: 'Upper A',
        exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Dumbbell Curl'],
      },
      {
        name: 'Lower A',
        exercises: ['Squat', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise'],
      },
      {
        name: 'Upper B',
        exercises: ['Overhead Press', 'Lat Pulldown', 'Bench Press', 'Dumbbell Curl'],
      },
      {
        name: 'Lower B',
        exercises: ['Leg Press', 'Romanian Deadlift', 'Squat', 'Calf Raise'],
      },
    ];

    const planIds: string[] = [];
    for (const plan of plans) {
      const planId = uuidv7();
      planIds.push(planId);

      const planExercises = plan.exercises.map((exerciseName, index) => ({
        exercise_id: exerciseMap[exerciseName],
        sort_order: index,
        target_sets: 3,
        target_reps: 10,
      }));

      await insertEvent(
        conn,
        'template_created',
        {
          template_id: planId,
          name: plan.name,
          exercises: planExercises,
        },
        currentTimestamp
      );
      currentTimestamp = addMinutes(currentTimestamp, 1);
    }

    // === WORKOUT GENERATION: 6 weeks, 4 sessions/week ===

    const workoutHours = [7, 18, 10, 19]; // 7am, 6pm, 10am, 7pm
    let planIndex = 0;

    for (const scheduleWeek of DEMO_SCHEDULE) {
      const weekMultiplier = scheduleWeek.multiplier;

      // 4 workouts per week: Mon, Wed, Fri, Sun (days 0, 2, 4, 6)
      const workoutDays = [0, 2, 4, 6];

      for (let dayIndex = 0; dayIndex < workoutDays.length; dayIndex++) {
        const dayOfWeek = workoutDays[dayIndex];
        const workoutDate = subDays(now, 43 - ((scheduleWeek.week - 1) * 7 + dayOfWeek));
        const workoutHour = workoutHours[dayIndex % workoutHours.length];
        let workoutTimestamp = addHours(workoutDate, workoutHour);

        // Get plan for this workout
        const planId = planIds[planIndex % planIds.length];
        const planExercises = plans[planIndex % plans.length].exercises;
        planIndex++;

        // Start workout
        const workoutId = uuidv7();
        await insertEvent(
          conn,
          'workout_started',
          {
            workout_id: workoutId,
            template_id: planId,
            gym_id: gymId,
            started_at: workoutTimestamp.toISOString(),
          },
          workoutTimestamp
        );
        workoutTimestamp = addMinutes(workoutTimestamp, 2);

        // Log sets for each exercise
        for (const exerciseName of planExercises) {
          const exerciseId = exerciseMap[exerciseName];
          const baseWeight = BASE_WEIGHTS[exerciseName];
          const weight = roundWeight(baseWeight * weekMultiplier);

          // 3-4 sets per exercise
          const numSets = Math.random() < 0.5 ? 3 : 4;

          for (let setIndex = 0; setIndex < numSets; setIndex++) {
            const setId = uuidv7();
            const reps = generateReps(8, 12);
            const rir = generateRIR(setIndex, numSets);

            await insertEvent(
              conn,
              'set_logged',
              {
                workout_id: workoutId,
                set_id: setId,
                exercise_id: exerciseId,
                original_exercise_id: exerciseId,
                weight_kg: weight,
                reps,
                rir,
              },
              workoutTimestamp
            );
            workoutTimestamp = addMinutes(workoutTimestamp, 3); // ~3 min per set
          }
        }

        // Complete workout
        await insertEvent(
          conn,
          'workout_completed',
          {
            workout_id: workoutId,
            completed_at: workoutTimestamp.toISOString(),
          },
          workoutTimestamp
        );
      }
    }

    // Flush to OPFS
    await checkpoint();

    // === SETUP ROTATION IN LOCALSTORAGE ===
    const rotationId = uuidv7();
    const rotationState = {
      state: {
        rotations: [
          {
            rotation_id: rotationId,
            name: 'Upper Lower 4x',
            template_ids: planIds,
            current_position: 2, // Start at Upper B (position 2)
          },
        ],
        activeRotationId: rotationId,
        defaultGymId: gymId,
      },
      version: 0,
    };

    localStorage.setItem('gymlog-rotations', JSON.stringify(rotationState));

    console.log('Demo data loaded successfully');
  } finally {
    await conn.close();
  }
}
