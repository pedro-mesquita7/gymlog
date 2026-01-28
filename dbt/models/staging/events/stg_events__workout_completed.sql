-- Staging model for workout_completed events
-- Extracts workout session completion information

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'workout_completed'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.workout_id') AS workout_id,
        COALESCE(
            JSON_EXTRACT_STRING(payload, '$.completed_at'),
            _created_at
        ) AS completed_at
    FROM source
)

SELECT * FROM extracted
