-- Staging model for gym_created events

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'gym_created'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.gym_id') AS gym_id,
        JSON_EXTRACT_STRING(payload, '$.name') AS name,
        NULLIF(JSON_EXTRACT_STRING(payload, '$.location'), 'null') AS location
    FROM source
)

SELECT * FROM extracted
