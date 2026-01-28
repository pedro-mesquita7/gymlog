-- Intermediate model: detect anomalies in logged sets
-- Flags sets where weight changes 50%+ from previous session

WITH sets_with_prs AS (
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
        estimated_1rm_kg,
        previous_max_weight_kg,
        is_pr
    FROM {{ ref('int_sets__with_prs') }}
),

with_previous_weight AS (
    SELECT
        *,
        -- Get weight from previous set for this exercise
        LAG(weight_kg) OVER (
            PARTITION BY original_exercise_id
            ORDER BY logged_at
        ) AS previous_weight_kg
    FROM sets_with_prs
),

with_anomaly_flag AS (
    SELECT
        *,
        -- Detect anomaly if weight changed 50%+ from previous session
        {{ detect_anomaly('weight_kg', 'previous_weight_kg', 0.50) }} AS is_anomaly
    FROM with_previous_weight
)

SELECT * FROM with_anomaly_flag
