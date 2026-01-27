-- Staging model for gym_deleted events

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'gym_deleted'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.gym_id') AS gym_id
    FROM source
)

SELECT * FROM extracted
