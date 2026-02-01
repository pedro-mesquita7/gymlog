#!/bin/bash
# Bundle size budget checker
# Runs after `npm run build` to verify JS chunk sizes stay within budget.
# Sizes are uncompressed (gzip typically reduces by ~70%).

set -e

DIST_DIR="${1:-dist}"

# Budget limits (KB, uncompressed)
# Set ~15% above current actual sizes to allow organic growth.
# Current sizes as of 2026-02-01:
#   index-*.js      ~576KB
#   AnalyticsPage   ~522KB
#   duckdb-*.js     ~187KB
#   Total JS        ~1286KB
MAX_MAIN_KB=660        # index-*.js (React, Zustand, UI components)
MAX_ANALYTICS_KB=600   # AnalyticsPage-*.js (Recharts, chart components)
MAX_DUCKDB_KB=215      # duckdb-*.js (DuckDB-WASM wrapper)
MAX_TOTAL_JS_KB=1480   # All JS combined

FAIL=0
REPORT=""

check_chunk() {
  local pattern="$1"
  local limit_kb="$2"
  local label="$3"

  local file
  file=$(find "$DIST_DIR/assets" -name "${pattern}*.js" 2>/dev/null | head -1)

  if [ -n "$file" ]; then
    local size_bytes
    size_bytes=$(stat -c%s "$file")
    local size_kb=$(( size_bytes / 1024 ))

    if [ "$size_kb" -gt "$limit_kb" ]; then
      REPORT+="  FAIL  $label: ${size_kb}KB (limit: ${limit_kb}KB) - $file\n"
      FAIL=1
    else
      REPORT+="  OK    $label: ${size_kb}KB (limit: ${limit_kb}KB)\n"
    fi
  else
    REPORT+="  SKIP  No file matching ${pattern}*.js found\n"
  fi
}

check_chunk "index-" "$MAX_MAIN_KB" "Main bundle"
check_chunk "AnalyticsPage-" "$MAX_ANALYTICS_KB" "Analytics chunk"
check_chunk "duckdb-" "$MAX_DUCKDB_KB" "DuckDB chunk"

# Total JS size
TOTAL_KB=0
for f in "$DIST_DIR"/assets/*.js; do
  if [ -f "$f" ]; then
    s=$(stat -c%s "$f")
    TOTAL_KB=$(( TOTAL_KB + s ))
  fi
done
TOTAL_KB=$(( TOTAL_KB / 1024 ))

if [ "$TOTAL_KB" -gt "$MAX_TOTAL_JS_KB" ]; then
  REPORT+="  FAIL  Total JS: ${TOTAL_KB}KB (limit: ${MAX_TOTAL_JS_KB}KB)\n"
  FAIL=1
else
  REPORT+="  OK    Total JS: ${TOTAL_KB}KB (limit: ${MAX_TOTAL_JS_KB}KB)\n"
fi

echo ""
echo "=== Bundle Size Report ==="
echo -e "$REPORT"
echo "=========================="
echo ""

if [ "$FAIL" -eq 1 ]; then
  echo "Bundle size budget EXCEEDED. Review chunks above."
  exit 1
else
  echo "All chunks within budget."
  exit 0
fi
