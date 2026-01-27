-- Staging model for exercise_updated events

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'exercise_updated'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.exercise_id') AS exercise_id,
        JSON_EXTRACT_STRING(payload, '$.name') AS name,
        JSON_EXTRACT_STRING(payload, '$.muscle_group') AS muscle_group,
        CAST(JSON_EXTRACT_STRING(payload, '$.is_global') AS BOOLEAN) AS is_global,
        NULLIF(JSON_EXTRACT_STRING(payload, '$.gym_id'), 'null') AS gym_id
    FROM source
)

SELECT * FROM extracted
