-- Progression status detection per exercise (progressing/plateau/regressing)
-- Dual-criteria plateau: no PR in 4+ weeks AND weight change < 5%
-- Regression: 10%+ weight drop OR 20%+ volume drop from 8-week baseline
-- Gym-aware partitioning for gym-specific exercises
{{
    config(
        materialized='view'
    )
}}

WITH exercise_sessions AS (
    SELECT
        fs.original_exercise_id,
        fw.gym_id,
        fw.workout_id,
        fw.logged_at AS session_date,
        MAX(fs.weight_kg) AS max_weight_session,
        AVG(fs.weight_kg) AS avg_weight_session,
        SUM(fs.weight_kg * fs.reps) AS volume_session
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('fact_workouts') }} fw ON fs.workout_id = fw.workout_id
    WHERE fw.logged_at >= CURRENT_DATE - INTERVAL '9 weeks'
    GROUP BY fs.original_exercise_id, fw.gym_id, fw.workout_id, fw.logged_at
),

session_counts AS (
    SELECT
        original_exercise_id,
        gym_id,
        COUNT(DISTINCT workout_id) AS session_count_4wk
    FROM exercise_sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '4 weeks'
    GROUP BY original_exercise_id, gym_id
    HAVING COUNT(DISTINCT workout_id) >= 2  -- Minimum data requirement
),

last_pr_per_exercise AS (
    SELECT
        original_exercise_id,
        MAX(logged_at) AS last_pr_date
    FROM {{ ref('fact_prs') }}
    GROUP BY original_exercise_id
),

recent_weight_stats AS (
    SELECT
        es.original_exercise_id,
        es.gym_id,
        AVG(es.max_weight_session) AS avg_weight_4wk,
        MIN(es.max_weight_session) AS min_weight_4wk,
        MAX(es.max_weight_session) AS max_weight_4wk
    FROM exercise_sessions es
    INNER JOIN session_counts sc
        ON es.original_exercise_id = sc.original_exercise_id
        AND es.gym_id = sc.gym_id
    WHERE es.session_date >= CURRENT_DATE - INTERVAL '4 weeks'
    GROUP BY es.original_exercise_id, es.gym_id
),

weekly_aggregates AS (
    SELECT
        original_exercise_id,
        gym_id,
        DATE_TRUNC('week', CAST(session_date AS TIMESTAMP))::DATE AS week_start,
        AVG(avg_weight_session) AS avg_weight_week,
        SUM(volume_session) AS total_volume_week
    FROM exercise_sessions
    GROUP BY original_exercise_id, gym_id, DATE_TRUNC('week', CAST(session_date AS TIMESTAMP))::DATE
),

baseline_metrics AS (
    SELECT
        original_exercise_id,
        gym_id,
        week_start,
        avg_weight_week,
        total_volume_week,
        AVG(avg_weight_week) OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start
            ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
        ) AS baseline_avg_weight_8wk,
        AVG(total_volume_week) OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start
            ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
        ) AS baseline_avg_volume_8wk,
        RANK() OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start DESC
        ) AS week_recency_rank
    FROM weekly_aggregates
),

current_week_metrics AS (
    SELECT
        original_exercise_id,
        gym_id,
        avg_weight_week AS current_avg_weight,
        total_volume_week AS current_volume,
        baseline_avg_weight_8wk,
        baseline_avg_volume_8wk,
        CASE
            WHEN baseline_avg_weight_8wk > 0 THEN
                ROUND(((baseline_avg_weight_8wk - avg_weight_week) / baseline_avg_weight_8wk) * 100, 1)
            ELSE NULL
        END AS weight_drop_pct,
        CASE
            WHEN baseline_avg_volume_8wk > 0 THEN
                ROUND(((baseline_avg_volume_8wk - total_volume_week) / baseline_avg_volume_8wk) * 100, 1)
            ELSE NULL
        END AS volume_drop_pct
    FROM baseline_metrics
    WHERE week_recency_rank = 1
),

plateau_detection AS (
    SELECT
        rws.original_exercise_id,
        rws.gym_id,
        sc.session_count_4wk,
        lpr.last_pr_date,
        CASE
            WHEN lpr.last_pr_date IS NULL THEN true
            WHEN lpr.last_pr_date < CURRENT_DATE - INTERVAL '4 weeks' THEN true
            ELSE false
        END AS no_pr_4wk,
        CASE
            WHEN rws.avg_weight_4wk > 0 THEN
                ((rws.max_weight_4wk - rws.min_weight_4wk) / rws.avg_weight_4wk) < 0.05
            ELSE false
        END AS weight_flat
    FROM recent_weight_stats rws
    INNER JOIN session_counts sc
        ON rws.original_exercise_id = sc.original_exercise_id
        AND rws.gym_id = sc.gym_id
    LEFT JOIN last_pr_per_exercise lpr
        ON rws.original_exercise_id = lpr.original_exercise_id
),

regression_detection AS (
    SELECT
        original_exercise_id,
        gym_id,
        weight_drop_pct,
        volume_drop_pct,
        (weight_drop_pct >= 10.0 OR volume_drop_pct >= 20.0) AS is_regressing
    FROM current_week_metrics
),

combined_status AS (
    SELECT
        pd.original_exercise_id,
        pd.gym_id,
        pd.session_count_4wk,
        pd.last_pr_date,
        COALESCE(rd.weight_drop_pct, 0) AS weight_drop_pct,
        COALESCE(rd.volume_drop_pct, 0) AS volume_drop_pct,
        CASE
            -- Priority 1: Regression (most urgent)
            WHEN rd.is_regressing THEN 'regressing'
            -- Priority 2: Plateau (both criteria met)
            WHEN pd.no_pr_4wk AND pd.weight_flat THEN 'plateau'
            -- Priority 3: Progressing (had PR recently or trending up)
            WHEN NOT pd.no_pr_4wk THEN 'progressing'
            -- Default: Unknown (not enough data or ambiguous)
            ELSE 'unknown'
        END AS status
    FROM plateau_detection pd
    LEFT JOIN regression_detection rd
        ON pd.original_exercise_id = rd.original_exercise_id
        AND pd.gym_id = rd.gym_id
)

SELECT
    original_exercise_id,
    gym_id,
    status,
    session_count_4wk,
    last_pr_date,
    weight_drop_pct,
    volume_drop_pct
FROM combined_status
ORDER BY original_exercise_id, gym_id
