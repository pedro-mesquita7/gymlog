-- Intermediate model: add estimated 1RM calculation to logged sets
-- Uses Epley formula for strength estimation

WITH base_sets AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        set_id,
        workout_id,
        exercise_id,
        original_exercise_id,
        weight_kg,
        reps,
        rir,
        logged_at
    FROM {{ ref('stg_events__set_logged') }}
),

with_1rm AS (
    SELECT
        *,
        {{ calculate_1rm('weight_kg', 'reps') }} AS estimated_1rm_kg
    FROM base_sets
)

SELECT * FROM with_1rm
