-- Analytical view: Exercise history for last 2 weeks with gym filtering
-- Provides recent performance trends for exercise progression analysis (HIST-01)
{{
    config(
        materialized='view'
    )
}}

WITH recent_sets AS (
    SELECT
        set_id,
        workout_id,
        exercise_id,
        original_exercise_id,
        weight_kg,
        reps,
        rir,
        estimated_1rm,
        is_pr,
        is_anomaly,
        weight_change_pct,
        logged_at,
        _created_at
    FROM {{ ref('fact_sets') }}
    WHERE logged_at >= CURRENT_DATE - INTERVAL '14 days'
),

with_workout_context AS (
    SELECT
        s.*,
        w.gym_id,
        w.template_id,
        w.started_at AS workout_started_at,
        w.completed_at AS workout_completed_at
    FROM recent_sets s
    INNER JOIN {{ ref('fact_workouts') }} w ON s.workout_id = w.workout_id
),

with_exercise_details AS (
    SELECT
        wc.*,
        e.name AS exercise_name,
        e.muscle_group,
        e.is_global,
        e.gym_id AS exercise_gym_id
    FROM with_workout_context wc
    INNER JOIN {{ ref('dim_exercise') }} e ON wc.exercise_id = e.exercise_id
)

SELECT
    set_id,
    workout_id,
    exercise_id,
    original_exercise_id,
    exercise_name,
    muscle_group,
    is_global,
    weight_kg,
    reps,
    rir,
    estimated_1rm,
    is_pr,
    is_anomaly,
    weight_change_pct,
    logged_at,
    workout_started_at,
    workout_completed_at,
    gym_id,
    exercise_gym_id,
    template_id,
    _created_at
FROM with_exercise_details
ORDER BY logged_at DESC
