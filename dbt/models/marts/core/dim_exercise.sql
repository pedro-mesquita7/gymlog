-- Mart model: Exercise dimension table (DATA-01)
{{
    config(
        materialized='table'
    )
}}

WITH latest_exercises AS (
    SELECT * FROM {{ ref('int_exercises__deduplicated') }}
),

active_exercises AS (
    SELECT
        exercise_id,
        name,
        muscle_group,
        is_global,
        gym_id,
        _created_at AS first_created_at,
        _created_at AS last_updated_at
    FROM latest_exercises
    WHERE event_type != 'exercise_deleted'
)

SELECT * FROM active_exercises
