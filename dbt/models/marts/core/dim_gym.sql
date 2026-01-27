-- Mart model: Gym dimension table (DATA-01)
{{
    config(
        materialized='table'
    )
}}

WITH latest_gyms AS (
    SELECT * FROM {{ ref('int_gyms__current_state') }}
),

active_gyms AS (
    SELECT
        gym_id,
        name,
        location,
        _created_at AS first_created_at,
        _created_at AS last_updated_at
    FROM latest_gyms
    WHERE event_type != 'gym_deleted'
)

SELECT * FROM active_gyms
