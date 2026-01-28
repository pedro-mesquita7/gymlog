-- Mart model: Personal records history with improvement tracking (HIST-05)
{{
    config(
        materialized='table'
    )
}}

WITH pr_sets AS (
    SELECT
        set_id,
        workout_id,
        exercise_id,
        original_exercise_id,
        weight_kg,
        reps,
        rir,
        estimated_1rm_kg,
        is_weight_pr,
        is_1rm_pr,
        is_pr,
        previous_max_weight_kg,
        logged_at,
        _event_id,
        _created_at
    FROM {{ ref('int_sets__with_anomalies') }}
    WHERE is_pr = true
),

with_improvements AS (
    SELECT
        set_id,
        workout_id,
        exercise_id,
        original_exercise_id,
        weight_kg,
        reps,
        rir,
        estimated_1rm_kg AS estimated_1rm,
        CASE
            WHEN is_weight_pr AND is_1rm_pr THEN 'weight_and_1rm'
            WHEN is_weight_pr THEN 'weight'
            WHEN is_1rm_pr THEN '1rm'
        END AS pr_type,
        CASE
            WHEN previous_max_weight_kg IS NULL THEN 'first'
            ELSE 'improvement'
        END AS achievement_type,
        previous_max_weight_kg AS previous_max_weight,
        CASE
            WHEN previous_max_weight_kg IS NOT NULL THEN
                weight_kg - previous_max_weight_kg
            ELSE NULL
        END AS weight_improvement_kg,
        CASE
            WHEN previous_max_weight_kg IS NOT NULL AND previous_max_weight_kg > 0 THEN
                ROUND(((weight_kg - previous_max_weight_kg) / previous_max_weight_kg) * 100, 1)
            ELSE NULL
        END AS weight_improvement_pct,
        logged_at,
        _event_id,
        _created_at
    FROM pr_sets
)

SELECT * FROM with_improvements
ORDER BY original_exercise_id, logged_at
