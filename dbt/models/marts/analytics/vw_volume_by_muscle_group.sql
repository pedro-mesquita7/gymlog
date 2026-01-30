-- Weekly volume aggregation by muscle group (VOL-01, VOL-02)
-- Sets per week grouped by muscle group for last 4 weeks
{{
    config(
        materialized='view'
    )
}}

WITH weekly_sets AS (
    SELECT
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMP))::DATE AS week_start,
        e.muscle_group,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('dim_exercise') }} e
        ON fs.original_exercise_id = e.exercise_id
    WHERE fs.logged_at >= CURRENT_DATE - INTERVAL '28 days'
    GROUP BY
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMP))::DATE,
        e.muscle_group
)

SELECT
    week_start,
    muscle_group,
    set_count
FROM weekly_sets
ORDER BY week_start DESC, muscle_group
