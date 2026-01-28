-- Mart model: Fact table for logged sets (DATA-01)
{{
    config(
        materialized='table'
    )
}}

SELECT
    set_id,
    workout_id,
    exercise_id,
    original_exercise_id,
    weight_kg,
    reps,
    rir,
    estimated_1rm_kg AS estimated_1rm,
    is_weight_pr,
    is_1rm_pr,
    is_pr,
    is_anomaly,
    CASE
        WHEN previous_weight_kg IS NOT NULL THEN
            ROUND(((weight_kg - previous_weight_kg) / previous_weight_kg) * 100, 1)
        ELSE NULL
    END AS weight_change_pct,
    previous_weight_kg AS previous_weight,
    previous_max_weight_kg AS previous_max_weight,
    logged_at,
    _event_id,
    _created_at
FROM {{ ref('int_sets__with_anomalies') }}
