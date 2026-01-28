-- Custom test: Validate that reps are in reasonable range (DATA-05)
-- Catches data entry errors where reps are unrealistic
-- Reasonable range: 1-100 reps (covers everything from 1RM tests to endurance sets)

SELECT
    set_id,
    exercise_id,
    reps,
    logged_at
FROM {{ ref('fact_sets') }}
WHERE reps < 1 OR reps > 100
