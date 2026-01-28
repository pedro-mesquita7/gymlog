-- Intermediate model: detect personal records (PRs) in logged sets
-- Uses window functions to compare current weight to historical max

WITH sets_with_1rm AS (
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
        logged_at,
        estimated_1rm_kg
    FROM {{ ref('int_sets__with_1rm') }}
),

with_previous_max AS (
    SELECT
        *,
        -- Get maximum weight for this exercise up to the previous set
        MAX(weight_kg) OVER (
            PARTITION BY original_exercise_id
            ORDER BY logged_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_max_weight_kg
    FROM sets_with_1rm
),

with_pr_flag AS (
    SELECT
        *,
        -- PR if current weight exceeds previous max (or first time logging)
        CASE
            WHEN previous_max_weight_kg IS NULL THEN true
            WHEN weight_kg > previous_max_weight_kg THEN true
            ELSE false
        END AS is_pr
    FROM with_previous_max
)

SELECT * FROM with_pr_flag
