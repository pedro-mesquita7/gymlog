{% macro calculate_1rm(weight_kg, reps) %}
{#
    Calculate estimated 1 Rep Max using Epley formula

    Formula: 1RM = weight × (1 + reps/30)

    Parameters:
        weight_kg: Weight lifted in kilograms (DECIMAL)
        reps: Number of repetitions completed (INTEGER)

    Returns:
        Estimated 1RM in kilograms (DECIMAL)

    Example:
        {{ calculate_1rm('weight_kg', 'reps') }}
        -- For 100kg × 8 reps = 100 × (1 + 8/30) = 126.67kg

    Note: Epley formula is most accurate for 1-10 reps.
    For sets with >10 reps, accuracy decreases.
#}
    {{ weight_kg }} * (1 + {{ reps }} / 30.0)
{% endmacro %}
