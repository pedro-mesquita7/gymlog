{% macro detect_anomaly(current_value, previous_value, threshold=0.50) %}
{#
    Detect anomalies based on percent change from previous value

    Calculates percent change and flags as anomaly if exceeds threshold.
    Used to identify unusual jumps/drops in performance metrics.

    Parameters:
        current_value: Current measurement (e.g., 1RM, volume)
        previous_value: Previous measurement to compare against
        threshold: Percent change threshold (default 0.50 = 50%)

    Returns:
        BOOLEAN - true if absolute percent change exceeds threshold

    Example:
        {{ detect_anomaly('current_1rm', 'previous_1rm', 0.30) }}
        -- Flags if 1RM increased or decreased by more than 30%

    Note: Returns false if previous_value is null or zero (no baseline).
#}
    CASE
        WHEN {{ previous_value }} IS NULL OR {{ previous_value }} = 0 THEN false
        WHEN ABS(({{ current_value }} - {{ previous_value }}) / {{ previous_value }}) > {{ threshold }} THEN true
        ELSE false
    END
{% endmacro %}
