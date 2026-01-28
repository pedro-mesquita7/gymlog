-- Custom test: Validate that all logged weights are positive (DATA-05)
-- Catches data entry errors where weight_kg is zero or negative

SELECT
    set_id,
    exercise_id,
    weight_kg,
    logged_at
FROM {{ ref('fact_sets') }}
WHERE weight_kg <= 0
