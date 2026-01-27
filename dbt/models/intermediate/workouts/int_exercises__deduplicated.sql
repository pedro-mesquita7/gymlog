-- Intermediate model: deduplicate exercise events to get current state
-- Implements idempotent event processing (DATA-08)

WITH all_exercise_events AS (
    -- Union all exercise event types
    SELECT
        _event_id,
        _created_at,
        event_type,
        exercise_id,
        name,
        muscle_group,
        is_global,
        gym_id
    FROM {{ ref('stg_events__exercise_created') }}

    UNION ALL

    SELECT
        _event_id,
        _created_at,
        event_type,
        exercise_id,
        name,
        muscle_group,
        is_global,
        gym_id
    FROM {{ ref('stg_events__exercise_updated') }}

    UNION ALL

    SELECT
        _event_id,
        _created_at,
        event_type,
        exercise_id,
        NULL AS name,
        NULL AS muscle_group,
        NULL AS is_global,
        NULL AS gym_id
    FROM {{ ref('stg_events__exercise_deleted') }}
),

deduplicated AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY exercise_id
            ORDER BY _created_at DESC
        ) AS _rn
    FROM all_exercise_events
)

SELECT
    _event_id,
    _created_at,
    event_type,
    exercise_id,
    name,
    muscle_group,
    is_global,
    gym_id
FROM deduplicated
WHERE _rn = 1
