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
        ) AS previous_max_weight_kg,
        -- Get maximum 1RM for this exercise up to the previous set
        MAX(estimated_1rm_kg) OVER (
            PARTITION BY original_exercise_id
            ORDER BY logged_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_max_1rm_kg
    FROM sets_with_1rm
),

with_pr_flags AS (
    SELECT
        *,
        -- Weight PR if current weight exceeds previous max (or first time logging)
        CASE
            WHEN previous_max_weight_kg IS NULL THEN true
            WHEN weight_kg > previous_max_weight_kg THEN true
            ELSE false
        END AS is_weight_pr,
        -- 1RM PR if current estimated 1RM exceeds previous max
        CASE
            WHEN previous_max_1rm_kg IS NULL AND estimated_1rm_kg IS NOT NULL THEN true
            WHEN estimated_1rm_kg IS NOT NULL AND estimated_1rm_kg > previous_max_1rm_kg THEN true
            ELSE false
        END AS is_1rm_pr
    FROM with_previous_max
),

with_combined_pr AS (
    SELECT
        *,
        -- Combined PR flag if either weight or 1RM is a PR
        (is_weight_pr OR is_1rm_pr) AS is_pr
    FROM with_pr_flags
)

SELECT * FROM with_combined_pr
