import { useObservability } from '../../hooks/useObservability';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ObservabilitySection() {
  const {
    storageUsageBytes,
    storageQuotaBytes,
    storageUsagePct,
    totalEvents,
    eventsByType,
    queryTimeMs,
    isLoading,
    error,
    refresh
  } = useObservability();

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-4 text-text-primary">System Observability</h2>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-sm text-text-muted">Loading metrics...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-4 text-text-primary">System Observability</h2>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-text-primary">System Observability</h2>

      <div className="bg-bg-secondary rounded-xl p-4 space-y-5">
        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-text-primary">Storage Usage</label>
            <span className="text-sm text-text-muted">
              {formatBytes(storageUsageBytes)} / {formatBytes(storageQuotaBytes)} ({storageUsagePct.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${Math.min(100, storageUsagePct)}%` }}
            />
          </div>
        </div>

        {/* Total Events */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-primary">Total Events</label>
          <span className="text-sm font-medium text-text-primary">
            {totalEvents.toLocaleString()}
          </span>
        </div>

        {/* Events by Type */}
        {eventsByType.length > 0 && (
          <div>
            <label className="text-sm text-text-primary mb-2 block">Events by Type</label>
            <div className="grid grid-cols-2 gap-2">
              {eventsByType.map(({ event_type, count }) => (
                <div key={event_type} className="flex items-center justify-between text-xs">
                  <span className="text-text-muted truncate">{event_type}</span>
                  <span className="text-text-primary font-medium ml-2">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query Time */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-primary">Query Time</label>
          <span className="text-sm text-text-muted">
            {queryTimeMs.toFixed(1)}ms
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          className="w-full py-2 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 rounded-xl text-sm font-medium transition-colors"
        >
          Refresh Metrics
        </button>
      </div>
    </section>
  );
}
