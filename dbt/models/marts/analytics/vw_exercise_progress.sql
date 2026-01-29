-- Progress data for exercise charts (CHART-01, CHART-02, CHART-03)
-- Daily aggregated metrics for last 28 days with exercise context
{{
    config(
        materialized='view'
    )
}}

WITH daily_aggregates AS (
    SELECT
        original_exercise_id AS exercise_id,
        DATE_TRUNC('day', CAST(logged_at AS TIMESTAMP))::DATE AS date,
        MAX(weight_kg) AS max_weight,
        MAX(estimated_1rm) AS max_1rm,
        SUM(weight_kg * reps) AS total_volume,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }}
    WHERE CAST(logged_at AS TIMESTAMP) >= CURRENT_DATE - INTERVAL '28 days'
    GROUP BY original_exercise_id, DATE_TRUNC('day', CAST(logged_at AS TIMESTAMP))::DATE
)

SELECT
    d.exercise_id,
    d.date,
    d.max_weight,
    d.max_1rm,
    d.total_volume,
    d.set_count,
    e.name AS exercise_name,
    e.muscle_group
FROM daily_aggregates d
INNER JOIN {{ ref('dim_exercise') }} e ON d.exercise_id = e.exercise_id
ORDER BY exercise_id, date
