# Phase 3: History & Analytics - Research

**Researched:** 2026-01-28
**Domain:** Analytical queries, data quality, and metrics calculation for workout history
**Confidence:** HIGH

## Summary

Phase 3 implements workout history viewing, personal record (PR) detection, estimated 1RM calculations, and data quality validation using SQL analytics and dbt testing. This phase leverages DuckDB window functions for analytical queries, dbt's testing framework for data quality, and dbt semantic models for metrics definitions.

The technical approach uses window functions (LAG, MAX, RANK) for PR detection and anomaly identification, dbt generic and custom tests for data validation, and dbt's documentation generation for data lineage. For UI, React components display time-series workout data with interactive history views.

Key capabilities include: detecting new PRs automatically during workout logging by comparing current performance to historical max, calculating estimated 1RM using the Epley formula (Weight × (1 + Reps/30)), validating data quality with dbt tests (unique, not_null, relationships, custom range checks), and flagging anomalies when weight changes exceed 50% between sessions.

**Primary recommendation:** Use DuckDB window functions for all analytical queries (PR detection, 1RM calculation, anomaly detection), implement dbt tests for data quality at every layer (staging, intermediate, marts), define metrics as dbt semantic models or reusable SQL macros, and display workout history with React components showing last 2 weeks of sets with gym-specific filtering.

## Standard Stack

The established libraries/tools for workout analytics and data quality:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dbt-core | 1.8.x+ | Data transformation and testing | Industry standard for analytics engineering, provides testing/docs/lineage out-of-box |
| dbt-duckdb | 1.8.x+ | DuckDB adapter for dbt | Official adapter, enables dbt features with DuckDB analytical engine |
| DuckDB window functions | Built-in | Analytical SQL operations | Native to DuckDB, optimized for time-series analytics, PR detection, anomaly detection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dbt-utils | 1.3.0+ | Extended test library | Custom data quality tests beyond built-in (recency, expression_is_true, etc.) |
| React Timeline/Charts | Varies | History visualization | Material UI Timeline, Recharts, or custom components for workout history views |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dbt tests | Manual validation | dbt provides centralized testing, auto-generated documentation, CI integration |
| Window functions | Application-level logic | SQL window functions are 10-100x faster, leverage database optimization |
| dbt semantic models | Metrics in application | Semantic models provide single source of truth, reusable across tools |

**Installation:**
```bash
# Already installed in Phase 1
# dbt-core and dbt-duckdb via pip

# Optional: Extended test library
pip install dbt-utils

# React visualization (if using Material UI)
npm install @mui/material @mui/lab
```

## Architecture Patterns

### Recommended Project Structure
```
dbt/
├── models/
│   ├── staging/
│   │   └── events/
│   │       ├── stg_events__set_logged.sql         # New
│   │       ├── stg_events__workout_started.sql    # New
│   │       └── stg_events__workout_completed.sql  # New
│   ├── intermediate/
│   │   ├── workouts/
│   │   │   ├── int_sets__with_1rm.sql             # New: Epley formula
│   │   │   ├── int_sets__with_prs.sql             # New: PR detection
│   │   │   └── int_sets__with_anomalies.sql       # New: Anomaly flags
│   └── marts/
│       ├── core/
│       │   ├── fact_sets.sql                      # New: Central fact table
│       │   └── fact_prs.sql                       # New: PR history
│       └── analytics/
│           └── vw_exercise_history.sql            # New: 2-week view
├── tests/
│   └── custom/
│       ├── test_weight_positive.sql               # Custom test
│       ├── test_reps_reasonable.sql               # Custom test
│       └── test_no_future_dates.sql               # Custom test
├── macros/
│   ├── calculate_1rm.sql                          # Reusable Epley formula
│   ├── detect_anomaly.sql                         # Anomaly detection logic
│   └── metrics/
│       └── workout_metrics.yml                    # Semantic models (optional)
└── schema.yml                                      # Model documentation + tests

src/
└── components/
    ├── history/
    │   ├── ExerciseHistory.tsx                    # 2-week history view
    │   ├── PRIndicator.tsx                        # PR badge/notification
    │   └── EstimatedMaxDisplay.tsx                # 1RM calculation display
    └── analytics/
        └── AnomalyWarning.tsx                     # Data quality alerts
```

### Pattern 1: Window Function PR Detection
**What:** Use SQL window functions to detect personal records by comparing current set to historical maximum
**When to use:** During workout logging and in history views
**Example:**
```sql
-- Source: https://duckdb.org/docs/stable/sql/functions/window_functions
WITH set_history AS (
    SELECT
        set_id,
        exercise_id,
        user_id,
        weight,
        reps,
        logged_at,
        -- Calculate max weight achieved for this exercise
        MAX(weight) OVER (
            PARTITION BY exercise_id, user_id
            ORDER BY logged_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_max_weight
    FROM {{ ref('stg_events__set_logged') }}
),

pr_detection AS (
    SELECT
        *,
        CASE
            WHEN weight > previous_max_weight THEN true
            WHEN previous_max_weight IS NULL THEN true  -- First set
            ELSE false
        END AS is_pr
    FROM set_history
)

SELECT * FROM pr_detection
```

### Pattern 2: Epley Formula for 1RM Estimation
**What:** Calculate estimated one-rep max using the Epley formula as a reusable dbt macro
**When to use:** In intermediate models and metrics layer
**Example:**
```sql
-- Source: https://en.wikipedia.org/wiki/One-repetition_maximum
-- macros/calculate_1rm.sql
{% macro calculate_1rm(weight_column, reps_column) %}
    {{ weight_column }} * (1 + ({{ reps_column }} / 30.0))
{% endmacro %}

-- models/intermediate/workouts/int_sets__with_1rm.sql
SELECT
    set_id,
    exercise_id,
    weight,
    reps,
    {{ calculate_1rm('weight', 'reps') }} AS estimated_1rm,
    logged_at
FROM {{ ref('stg_events__set_logged') }}
WHERE reps BETWEEN 1 AND 15  -- Formula accurate for 1-15 reps
```

### Pattern 3: Anomaly Detection with Percent Change
**What:** Flag unusual values using window functions to calculate percent change from previous session
**When to use:** Data quality monitoring and user warnings
**Example:**
```sql
-- Source: https://hakibenita.com/sql-anomaly-detection
WITH session_weights AS (
    SELECT
        set_id,
        exercise_id,
        weight,
        logged_at,
        LAG(weight) OVER (
            PARTITION BY exercise_id, user_id
            ORDER BY logged_at
        ) AS previous_weight
    FROM {{ ref('stg_events__set_logged') }}
),

anomaly_flags AS (
    SELECT
        *,
        CASE
            WHEN previous_weight IS NULL THEN false
            WHEN ABS((weight - previous_weight) / previous_weight) > 0.50
                THEN true
            ELSE false
        END AS is_anomaly,
        (weight - previous_weight) / previous_weight AS percent_change
    FROM session_weights
)

SELECT * FROM anomaly_flags
```

### Pattern 4: dbt Generic Tests for Data Quality
**What:** Use dbt's built-in tests plus custom tests to validate data at multiple layers
**When to use:** All models, especially staging and marts
**Example:**
```yaml
# Source: https://docs.getdbt.com/docs/build/data-tests
# models/staging/events/_events__schema.yml
version: 2

models:
  - name: stg_events__set_logged
    description: "Logged workout sets from set_logged events"
    columns:
      - name: set_id
        description: "Unique identifier for each set"
        tests:
          - unique
          - not_null
      - name: weight
        description: "Weight lifted in kg"
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
              config:
                where: "weight IS NOT NULL"
      - name: reps
        description: "Number of repetitions completed"
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 1
              max_value: 100
              inclusive: true
      - name: exercise_id
        description: "Foreign key to dim_exercise"
        tests:
          - not_null
          - relationships:
              to: ref('dim_exercise')
              field: exercise_id
```

### Pattern 5: Custom dbt Tests for Domain Rules
**What:** Write custom SQL tests for business-specific validation rules
**When to use:** Domain-specific validation that built-in tests don't cover
**Example:**
```sql
-- Source: https://docs.getdbt.com/best-practices/writing-custom-generic-tests
-- tests/custom/test_no_future_dates.sql
-- Returns rows that fail the test (future dates)
SELECT
    set_id,
    logged_at,
    CURRENT_TIMESTAMP AS now
FROM {{ ref('fact_sets') }}
WHERE logged_at > CURRENT_TIMESTAMP
```

### Pattern 6: Gym-Specific History Filtering
**What:** Filter history views based on exercise scope (global vs gym-specific)
**When to use:** Exercise history queries, respecting gym-specific data isolation
**Example:**
```sql
-- Source: Phase requirements HIST-02
-- models/marts/analytics/vw_exercise_history.sql
{{
    config(
        materialized='view'
    )
}}

WITH recent_sets AS (
    SELECT
        s.set_id,
        s.exercise_id,
        s.weight,
        s.reps,
        s.logged_at,
        s.workout_id,
        e.name AS exercise_name,
        e.is_global,
        e.gym_id AS exercise_gym_id,
        w.gym_id AS workout_gym_id
    FROM {{ ref('fact_sets') }} s
    JOIN {{ ref('dim_exercise') }} e ON s.exercise_id = e.exercise_id
    LEFT JOIN {{ ref('fact_workouts') }} w ON s.workout_id = w.workout_id
    WHERE s.logged_at >= CURRENT_DATE - INTERVAL '14 days'
),

filtered_history AS (
    SELECT
        set_id,
        exercise_id,
        weight,
        reps,
        logged_at,
        exercise_name,
        CASE
            -- Global exercises: show all history regardless of gym
            WHEN is_global = true THEN true
            -- Gym-specific exercises: only show if same gym
            WHEN is_global = false AND exercise_gym_id = workout_gym_id THEN true
            ELSE false
        END AS should_display
    FROM recent_sets
)

SELECT *
FROM filtered_history
WHERE should_display = true
```

### Pattern 7: React History Component with Virtualization
**What:** Display paginated/virtualized workout history to handle large datasets
**When to use:** History view components showing many sets
**Example:**
```typescript
// Source: React best practices 2026
// src/components/history/ExerciseHistory.tsx
import { useEffect, useState } from 'react';
import { useDuckDb } from '@duckdb/react-duckdb';

interface SetHistory {
  set_id: string;
  weight: number;
  reps: number;
  logged_at: string;
  is_pr: boolean;
  estimated_1rm: number;
}

export function ExerciseHistory({ exerciseId }: { exerciseId: string }) {
  const db = useDuckDb();
  const [history, setHistory] = useState<SetHistory[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const conn = await db.connect();

      // Query compiled dbt view
      const result = await conn.query(`
        SELECT *
        FROM vw_exercise_history
        WHERE exercise_id = '${exerciseId}'
        ORDER BY logged_at DESC
      `);

      setHistory(result.toArray());
      await conn.close();
    }

    loadHistory();
  }, [exerciseId, db]);

  return (
    <div>
      <h3>Last 2 Weeks</h3>
      {history.map((set) => (
        <div key={set.set_id}>
          <span>{set.weight}kg × {set.reps}</span>
          {set.is_pr && <span className="pr-badge">PR!</span>}
          <span>Est. 1RM: {set.estimated_1rm.toFixed(1)}kg</span>
        </div>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Don't calculate analytics in React**: Window functions and aggregations belong in SQL/dbt, not application code
- **Don't skip data quality tests**: Every model should have at minimum unique and not_null tests on primary keys
- **Don't hard-code metrics formulas in multiple places**: Use dbt macros or semantic models for single source of truth
- **Don't ignore anomalies silently**: Surface data quality warnings to users when appropriate
- **Don't query raw events for history**: Use mart views that pre-compute analytics for performance

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PR detection | JavaScript array sorting/filtering | DuckDB window functions (MAX OVER) | SQL optimized for set-based operations, 10-100x faster, handles millions of rows |
| 1RM calculation | Inline formula in React | dbt macro or semantic model | Single source of truth, testable, documented, reusable across queries |
| Data validation | Try/catch in application | dbt tests (generic + custom) | Centralized validation, fails fast, generates documentation, CI integration |
| Anomaly detection | Manual comparisons in code | SQL window functions (LAG, percent change) | Declarative logic, database-optimized, scales to large datasets |
| Metric definitions | Application constants | dbt semantic models or macros | MetricFlow provides governance, lineage, consistent definitions across tools |
| Time-based filtering | JavaScript date math | SQL INTERVAL and date functions | Database handles timezones, DST, date arithmetic correctly and efficiently |

**Key insight:** Analytics and data quality belong in the data layer (SQL/dbt), not the application layer. DuckDB's analytical query performance combined with dbt's testing/documentation framework provides production-grade analytics without custom code.

## Common Pitfalls

### Pitfall 1: Window Frame Misunderstanding
**What goes wrong:** Window functions return incorrect results because frame boundaries aren't specified correctly (e.g., including current row in MAX when detecting PRs)
**Why it happens:** Default window frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` when ORDER BY is present, which includes the current row
**How to avoid:**
- Explicitly specify frame: `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING` to exclude current row
- Test with known data: Insert test data with known PRs, verify detection logic
- Use DuckDB window function documentation for frame semantics
- Add dbt tests that verify PR detection on sample data
**Warning signs:** Every set flagged as PR, PRs detected incorrectly, counts don't match manual verification

### Pitfall 2: Testing Only at Mart Layer
**What goes wrong:** Data quality issues propagate through staging and intermediate layers, only caught at final marts, making debugging difficult
**Why it happens:** Assumption that testing end result is sufficient, or laziness in test coverage
**How to avoid:**
- Test at every layer: staging (source validation), intermediate (transformation logic), marts (business rules)
- Minimum tests for all models: unique and not_null on primary keys
- Add relationship tests between layers to verify joins
- Use `dbt test` in CI pipeline to catch issues before merge
**Warning signs:** Production data issues, no clear source of bad data, time spent debugging data lineage

### Pitfall 3: Incorrect Epley Formula Domain
**What goes wrong:** Estimated 1RM values are wildly inaccurate for high-rep sets (20+ reps)
**Why it happens:** Epley formula is accurate for 1-15 reps, extrapolation beyond breaks down
**How to avoid:**
- Filter 1RM calculations to reasonable rep ranges: `WHERE reps BETWEEN 1 AND 15`
- Display disclaimer for high-rep sets: "1RM estimation not available for 15+ reps"
- Consider alternative formulas for different rep ranges (Brzycki, etc.)
- Add dbt test to warn when 1RM calculated outside valid range
**Warning signs:** User confusion about 1RM values, complaints about inaccurate estimates, 1RM shown for bodyweight sets with 50+ reps

### Pitfall 4: Naive Anomaly Thresholds
**What goes wrong:** Anomaly detection flags too many false positives (new exercises, intentional deload) or misses real issues (gradual drift)
**Why it happens:** Single global threshold (50% change) doesn't account for exercise variation, user progression patterns, or intentional changes
**How to avoid:**
- Make thresholds configurable per exercise or muscle group
- Consider time context: 50% jump in 1 day is anomalous, 50% over 6 months is progression
- Use multiple signals: absolute change + percent change + session-to-session variance
- Provide user feedback mechanism: "Was this intentional?" to tune detection
- Start conservative (fewer false positives) and tune based on feedback
**Warning signs:** Users ignore anomaly warnings, alert fatigue, real data quality issues missed

### Pitfall 5: Ignoring Late-Arriving Events
**What goes wrong:** PRs and history views don't update when user logs workout from previous day or edits past data
**Why it happens:** Queries assume events arrive in chronological order, don't account for backdated entries
**How to avoid:**
- Use incremental models with lookback window: `WHERE logged_at >= (SELECT MAX(logged_at) - INTERVAL '7 days' FROM {{this}})`
- Sort by event timestamp, not insertion order: `ORDER BY logged_at` not `ORDER BY _created_at`
- Test with backdated events: Insert event with past timestamp, verify it appears in history and triggers PR recalculation
- Consider event_time configuration for dbt microbatch strategy
**Warning signs:** History missing recent manually-entered workouts, PRs not detected when logging old workouts, user confusion

### Pitfall 6: Performance Degradation with Large Windows
**What goes wrong:** Window functions become slow as dataset grows, especially with UNBOUNDED PRECEDING frames
**Why it happens:** Window functions are blocking operators that buffer entire input, can be memory-intensive
**How to avoid:**
- Partition wisely: `PARTITION BY exercise_id, user_id` reduces partition size vs. no partitioning
- Limit window scope when possible: `ROWS BETWEEN 100 PRECEDING AND CURRENT ROW` vs. UNBOUNDED
- Use named windows with `WINDOW` clause to share computation across functions
- Materialize intermediate results: Don't recalculate windows repeatedly in nested queries
- Monitor query performance with DuckDB profiling
**Warning signs:** Queries slow down over time, memory usage spikes, DuckDB worker timeouts in browser

### Pitfall 7: Inconsistent Gym-Specific Filtering
**What goes wrong:** Global exercises sometimes show gym-specific data or vice versa, user sees inconsistent history
**Why it happens:** Filtering logic duplicated across queries with subtle differences, edge cases not considered
**How to avoid:**
- Centralize filtering logic in one place: dedicated intermediate model or dbt macro
- Document the rule clearly: "Global exercises show all gyms, gym-specific shows only current gym"
- Add dbt tests that verify filtering: test with global exercise + multiple gyms, verify correct isolation
- Consider adding is_global flag to all fact tables for easy filtering
**Warning signs:** User reports seeing other gym's data, history appears/disappears when switching gyms, test failures

## Code Examples

Verified patterns from official sources:

### dbt Test for Reasonable Rep Range
```sql
-- Source: https://docs.getdbt.com/best-practices/writing-custom-generic-tests
-- tests/custom/test_reps_reasonable.sql
SELECT
    set_id,
    reps
FROM {{ ref('fact_sets') }}
WHERE reps < 1 OR reps > 100
```

### dbt Macro for Consistent Filtering
```sql
-- Source: dbt macro patterns
-- macros/filter_exercise_by_gym.sql
{% macro filter_exercise_by_gym(exercise_table_alias='e', workout_table_alias='w') %}
    CASE
        WHEN {{ exercise_table_alias }}.is_global = true THEN true
        WHEN {{ exercise_table_alias }}.is_global = false
            AND {{ exercise_table_alias }}.gym_id = {{ workout_table_alias }}.gym_id
            THEN true
        ELSE false
    END
{% endmacro %}

-- Usage in model:
SELECT *
FROM fact_sets s
JOIN dim_exercise e ON s.exercise_id = e.exercise_id
JOIN fact_workouts w ON s.workout_id = w.workout_id
WHERE {{ filter_exercise_by_gym() }}
```

### Incremental Model for Fact Sets
```sql
-- Source: https://docs.getdbt.com/docs/build/incremental-models
-- models/marts/core/fact_sets.sql
{{
    config(
        materialized='incremental',
        unique_key='set_id',
        on_schema_change='sync_all_columns'
    )
}}

SELECT
    set_id,
    workout_id,
    exercise_id,
    weight,
    reps,
    {{ calculate_1rm('weight', 'reps') }} AS estimated_1rm,
    logged_at,
    _created_at,
    _event_id
FROM {{ ref('stg_events__set_logged') }}

{% if is_incremental() %}
    -- Only process events from last 7 days to catch late-arriving data
    WHERE logged_at >= (SELECT MAX(logged_at) - INTERVAL '7 days' FROM {{ this }})
{% endif %}
```

### dbt Documentation Generation
```bash
# Source: https://docs.getdbt.com/reference/commands/cmd-docs
# Generate documentation with tests and lineage
dbt docs generate

# Serve locally for review
dbt docs serve --port 8080

# In CI/CD pipeline
dbt docs generate --target production
# Upload catalog.json and manifest.json to docs hosting
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Application-level analytics | SQL window functions + dbt models | 2020+ (dbt adoption) | 10-100x performance, centralized logic, testable transformations |
| Manual data validation | dbt tests (generic + custom) | 2019+ (dbt 0.14.0) | Automated validation, documentation, CI integration, faster debugging |
| Hard-coded metrics | dbt semantic models (MetricFlow) | 2023 (MetricFlow release) | Single source of truth, governance, consistent definitions across tools |
| Full-refresh models | Incremental models with microbatch | 2024+ (dbt 1.8.0) | Efficient processing of time-series data, handles late-arriving events |
| Multiple metric formulas | Reusable dbt macros | 2018+ (dbt best practice) | DRY principle, consistent calculations, easier to test and maintain |

**Deprecated/outdated:**
- **dbt Metrics v1**: Replaced by MetricFlow in dbt 1.6+, old metrics.yml syntax no longer supported
- **Manual deduplication**: Use `unique_key` in incremental models instead of custom ROW_NUMBER logic
- **Application-level 1RM calculation**: Move to dbt macro or semantic model for single source of truth

## Open Questions

Things that couldn't be fully resolved:

1. **MetricFlow vs. dbt Macros for Metrics Layer**
   - What we know: MetricFlow (dbt Semantic Layer) requires dbt Cloud account (Starter tier+), provides advanced features like metric governance and cross-tool consistency
   - What's unclear: Whether MetricFlow works with dbt-duckdb browser execution, or if it requires server-side dbt Cloud
   - Recommendation: Start with dbt macros for metrics (calculate_1rm, volume, etc.) which work with build-time compilation. Investigate MetricFlow if server-side dbt is added later.

2. **Optimal Anomaly Detection Thresholds**
   - What we know: 50% weight change is a reasonable starting point, but false positive rate is unknown
   - What's unclear: Best threshold values per exercise type, whether to use absolute vs. relative thresholds, how to handle new exercises
   - Recommendation: Start with conservative 50% threshold, log anomaly detections to analytics, tune based on user feedback and false positive rates

3. **Window Function Performance at Scale**
   - What we know: Window functions are blocking operators, can be memory-intensive with large datasets
   - What's unclear: DuckDB-WASM performance with window functions on 100k+ sets, optimal partitioning strategy
   - Recommendation: Start with simple partitioning (exercise_id, user_id), monitor performance, consider limiting window scope (e.g., last 1000 sets) if needed

4. **Late-Arriving Event Handling**
   - What we know: Incremental models with lookback windows can handle late events, dbt microbatch strategy exists for time-series
   - What's unclear: Whether dbt microbatch works with DuckDB adapter, optimal lookback window duration
   - Recommendation: Use incremental models with 7-day lookback for now, test with backdated events, investigate microbatch if performance issues arise

5. **1RM Formula Variations**
   - What we know: Epley formula is accurate for 1-15 reps, other formulas exist (Brzycki, Lander, etc.)
   - What's unclear: Which formula is most accurate for different rep ranges and user populations
   - Recommendation: Start with Epley (standard, simple), document limitations, consider adding formula selection in future phase

## Sources

### Primary (HIGH confidence)
- [dbt Data Tests](https://docs.getdbt.com/docs/build/data-tests) - Official dbt testing documentation
- [dbt Incremental Models](https://docs.getdbt.com/docs/build/incremental-models) - Official incremental strategy docs
- [DuckDB Window Functions](https://duckdb.org/docs/stable/sql/functions/window_functions) - Official DuckDB window function reference
- [dbt Best Practice Workflows](https://docs.getdbt.com/best-practices/best-practice-workflows) - Project structure and naming conventions
- [dbt Documentation](https://docs.getdbt.com/docs/build/documentation) - Documentation generation best practices
- [dbt Semantic Layer](https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl) - MetricFlow and metrics definition
- [Epley Formula - Wikipedia](https://en.wikipedia.org/wiki/One-repetition_maximum) - 1RM calculation formula

### Secondary (MEDIUM confidence)
- [dbt Incremental Models In-Depth](https://docs.getdbt.com/best-practices/materializations/4-incremental-models) - Advanced incremental patterns
- [Writing Custom Generic Tests](https://docs.getdbt.com/best-practices/writing-custom-generic-tests) - Custom test patterns
- [Simple Anomaly Detection with SQL](https://hakibenita.com/sql-anomaly-detection) - Anomaly detection patterns verified
- [dbt Documentation Best Practices (Blog)](https://blog.pmunhoz.com/dbt/dbt-documentation-best-practices) - Community best practices
- [React Design Patterns 2026](https://www.patterns.dev/react/react-2026/) - React component patterns
- [Workout Tracking App UX Patterns](https://stormotion.io/blog/fitness-app-ux/) - History view UX patterns
- [DuckDB Windowing Performance](https://duckdb.org/2021/10/13/windowing) - Window function optimization

### Tertiary (LOW confidence)
- [State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - React state patterns
- [Fitness App Chart Design](https://getfitoapp.com/en/best-workout-data-insight-and-charts-design-app/) - Data visualization patterns
- [SQL Pattern Matching](https://modern-sql.com/feature/match_recognize) - Advanced SQL patterns (not DuckDB-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - dbt and DuckDB officially documented, window functions are SQL standard
- Architecture: HIGH - Patterns verified from official dbt and DuckDB documentation
- Pitfalls: MEDIUM - Based on dbt community best practices and DuckDB performance docs, some extrapolated to browser context
- UX patterns: MEDIUM - Verified from multiple fitness app case studies, not specific to this tech stack

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable ecosystem, dbt best practices mature)
