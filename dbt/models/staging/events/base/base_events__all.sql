-- Base model reading from raw events source
-- All other staging models build on this

SELECT
    _event_id,
    _created_at,
    event_type,
    payload
FROM {{ source('raw', 'events') }}
