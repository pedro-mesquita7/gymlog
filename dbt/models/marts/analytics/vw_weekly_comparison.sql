-- Week-over-week comparison for exercise performance (CHART-04)
-- Compares current week vs previous week with percentage changes
{{
    config(
        materialized='view'
    )
}}

WITH weekly_metrics AS (
    SELECT
        original_exercise_id AS exercise_id,
        DATE_TRUNC('week', CAST(logged_at AS TIMESTAMP))::DATE AS week_start,
        MAX(weight_kg) AS max_weight,
        MAX(estimated_1rm) AS max_1rm,
        SUM(weight_kg * reps) AS total_volume,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }}
    WHERE CAST(logged_at AS TIMESTAMP) >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY original_exercise_id, DATE_TRUNC('week', CAST(logged_at AS TIMESTAMP))::DATE
),

with_comparison AS (
    SELECT
        exercise_id,
        week_start,
        max_weight,
        max_1rm,
        total_volume,
        set_count,
        LAG(max_weight) OVER (PARTITION BY exercise_id ORDER BY week_start) AS prev_max_weight,
        LAG(total_volume) OVER (PARTITION BY exercise_id ORDER BY week_start) AS prev_volume
    FROM weekly_metrics
)

SELECT
    w.exercise_id,
    w.week_start,
    w.max_weight,
    w.max_1rm,
    w.total_volume,
    w.set_count,
    w.prev_max_weight,
    w.prev_volume,
    e.name AS exercise_name,
    e.muscle_group,
    CASE
        WHEN w.prev_max_weight IS NOT NULL AND w.prev_max_weight > 0 THEN
            ROUND(((w.max_weight - w.prev_max_weight) / w.prev_max_weight) * 100, 1)
        ELSE NULL
    END AS weight_change_pct,
    CASE
        WHEN w.prev_volume IS NOT NULL AND w.prev_volume > 0 THEN
            ROUND(((w.total_volume - w.prev_volume) / w.prev_volume) * 100, 1)
        ELSE NULL
    END AS volume_change_pct
FROM with_comparison w
INNER JOIN {{ ref('dim_exercise') }} e ON w.exercise_id = e.exercise_id
ORDER BY week_start DESC, exercise_name
