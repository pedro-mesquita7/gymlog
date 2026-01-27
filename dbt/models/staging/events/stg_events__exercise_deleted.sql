-- Staging model for exercise_deleted events

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'exercise_deleted'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.exercise_id') AS exercise_id
    FROM source
)

SELECT * FROM extracted
