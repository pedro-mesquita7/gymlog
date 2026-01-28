-- Mart model: Fact table for workouts with aggregated metrics
{{
    config(
        materialized='table'
    )
}}

WITH started AS (
    SELECT
        workout_id,
        template_id,
        gym_id,
        started_at,
        _event_id,
        _created_at
    FROM {{ ref('stg_events__workout_started') }}
),

completed AS (
    SELECT
        workout_id,
        completed_at
    FROM {{ ref('stg_events__workout_completed') }}
),

set_metrics AS (
    SELECT
        workout_id,
        COUNT(*) AS total_sets,
        COUNT(DISTINCT exercise_id) AS total_exercises,
        SUM(weight_kg * reps) AS total_volume_kg,
        SUM(CASE WHEN is_pr THEN 1 ELSE 0 END) AS pr_count,
        MIN(logged_at) AS first_set_logged_at,
        MAX(logged_at) AS last_set_logged_at
    FROM {{ ref('fact_sets') }}
    GROUP BY workout_id
)

SELECT
    s.workout_id,
    s.template_id,
    s.gym_id,
    s.started_at,
    c.completed_at,
    CASE
        WHEN c.completed_at IS NOT NULL THEN 'completed'
        ELSE 'in_progress'
    END AS status,
    COALESCE(m.total_sets, 0) AS total_sets,
    COALESCE(m.total_exercises, 0) AS total_exercises,
    COALESCE(m.total_volume_kg, 0) AS total_volume_kg,
    COALESCE(m.pr_count, 0) AS pr_count,
    m.first_set_logged_at,
    m.last_set_logged_at,
    CASE
        WHEN c.completed_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (CAST(c.completed_at AS TIMESTAMP) - CAST(s.started_at AS TIMESTAMP))) / 60.0
        ELSE NULL
    END AS duration_minutes,
    s._event_id,
    s._created_at
FROM started s
LEFT JOIN completed c ON s.workout_id = c.workout_id
LEFT JOIN set_metrics m ON s.workout_id = m.workout_id
