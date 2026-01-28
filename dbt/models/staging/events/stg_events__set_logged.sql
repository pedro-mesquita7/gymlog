-- Staging model for set_logged events
-- Extracts set performance data from workout sessions

WITH source AS (
    SELECT * FROM {{ ref('base_events__all') }}
    WHERE event_type = 'set_logged'
),

extracted AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        JSON_EXTRACT_STRING(payload, '$.set_id') AS set_id,
        JSON_EXTRACT_STRING(payload, '$.workout_id') AS workout_id,
        JSON_EXTRACT_STRING(payload, '$.exercise_id') AS exercise_id,
        JSON_EXTRACT_STRING(payload, '$.original_exercise_id') AS original_exercise_id,
        CAST(JSON_EXTRACT_STRING(payload, '$.weight_kg') AS DECIMAL) AS weight_kg,
        CAST(JSON_EXTRACT_STRING(payload, '$.reps') AS INTEGER) AS reps,
        CAST(NULLIF(JSON_EXTRACT_STRING(payload, '$.rir'), 'null') AS INTEGER) AS rir,
        COALESCE(
            JSON_EXTRACT_STRING(payload, '$.logged_at'),
            _created_at
        ) AS logged_at
    FROM source
)

SELECT * FROM extracted
