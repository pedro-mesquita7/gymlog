-- 4-week aggregate volume for heat map visualization (VOL-03)
-- Total sets per muscle group over last 4 weeks
{{
    config(
        materialized='view'
    )
}}

SELECT
    e.muscle_group,
    COUNT(*) AS total_sets,
    MIN(fs.logged_at) AS first_logged_at,
    MAX(fs.logged_at) AS last_logged_at
FROM {{ ref('fact_sets') }} fs
INNER JOIN {{ ref('dim_exercise') }} e
    ON fs.original_exercise_id = e.exercise_id
WHERE fs.logged_at >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY e.muscle_group
ORDER BY total_sets DESC
