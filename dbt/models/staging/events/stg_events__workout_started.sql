-- Staging model for workout_started events
-- Extracts workout session start information

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'workout_started'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.workout_id') AS workout_id,
        NULLIF(JSON_EXTRACT_STRING(payload, '$.template_id'), 'null') AS template_id,
        NULLIF(JSON_EXTRACT_STRING(payload, '$.gym_id'), 'null') AS gym_id,
        COALESCE(
            JSON_EXTRACT_STRING(payload, '$.started_at'),
            _created_at
        ) AS started_at
    FROM source
)

SELECT * FROM extracted
