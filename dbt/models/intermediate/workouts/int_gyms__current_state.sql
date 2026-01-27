-- Intermediate model: deduplicate gym events to get current state

WITH all_gym_events AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        gym_id,
        name,
        location
    FROM {{ ref('stg_events__gym_created') }}

    UNION ALL

    SELECT
        _event_id,
        _created_at,
        event_type,
        gym_id,
        name,
        location
    FROM {{ ref('stg_events__gym_updated') }}

    UNION ALL

    SELECT
        _event_id,
        _created_at,
        event_type,
        gym_id,
        NULL AS name,
        NULL AS location
    FROM {{ ref('stg_events__gym_deleted') }}
),

deduplicated AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY gym_id
            ORDER BY _created_at DESC
        ) AS _rn
    FROM all_gym_events
)

SELECT
    _event_id,
    _created_at,
    event_type,
    gym_id,
    name,
    location
FROM deduplicated
WHERE _rn = 1
