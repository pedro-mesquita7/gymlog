{% macro filter_exercise_by_gym(exercise_table, gym_id_column) %}
{#
    Filter exercises by gym context - centralizes global vs gym-specific logic

    Returns WHERE clause condition to filter exercises for a specific gym.
    Includes both global exercises and exercises specific to that gym.

    Parameters:
        exercise_table: Alias of the exercise table in the query
        gym_id_column: Column name containing the gym_id to filter by

    Returns:
        SQL WHERE clause condition (no "WHERE" keyword)

    Example:
        WHERE {{ filter_exercise_by_gym('e', 'w.gym_id') }}
        -- Returns: (e.is_global = true OR e.gym_id = w.gym_id)

    Use case: When joining exercises to workout data, ensure only relevant
    exercises are included (global exercises + gym-specific exercises).
#}
    ({{ exercise_table }}.is_global = true OR {{ exercise_table }}.gym_id = {{ gym_id_column }})
{% endmacro %}
