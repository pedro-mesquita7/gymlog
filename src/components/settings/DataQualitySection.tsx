import { useDataQuality } from '../../hooks/useDataQuality';

export function DataQualitySection() {
  const { results, isRunning, lastRunAt, anomalyCount, runChecks } = useDataQuality();

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <span className="text-success">✓</span>;
      case 'fail':
        return <span className="text-error">✗</span>;
      case 'error':
        return <span className="text-warning">⚠</span>;
      default:
        return <span className="text-text-muted">—</span>;
    }
  };

  // Group results by category
  const customTests = results.filter((r) => r.category === 'custom');
  const schemaTests = results.filter((r) => r.category === 'schema');
  const anomalyTests = results.filter((r) => r.category === 'anomaly');

  // Check if we have no data (all tests errored with "No data")
  const hasNoData = results.every((r) => r.status === 'error' && r.errorMessage === 'No data');

  // Calculate summary stats
  const totalTests = results.filter((r) => r.category !== 'anomaly').length;
  const passingTests = results.filter((r) => r.status === 'pass' && r.category !== 'anomaly').length;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-text-primary">Data Quality</h2>

      <div className="bg-bg-secondary rounded-2xl p-4 space-y-4">
        {/* Run button */}
        <button
          onClick={runChecks}
          disabled={isRunning}
          className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-bg-tertiary rounded-xl font-medium transition-colors text-black disabled:text-text-muted"
        >
          {isRunning ? 'Running Checks...' : 'Run Data Quality Checks'}
        </button>

        {/* Last run timestamp */}
        {lastRunAt && (
          <div className="text-xs text-text-secondary">
            Last run: {formatTimeAgo(lastRunAt)}
          </div>
        )}

        {/* No data state */}
        {hasNoData && lastRunAt && (
          <div className="text-sm text-text-muted text-center py-4">
            Load some workout data first to run quality checks.
          </div>
        )}

        {/* Results - only show if we have run checks and have data */}
        {!hasNoData && lastRunAt && (
          <div className="space-y-4">
            {/* Custom Tests */}
            {customTests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Custom Tests</h3>
                <div className="space-y-1">
                  {customTests.map((result) => (
                    <div
                      key={result.name}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="text-text-primary">{result.name}</span>
                        {result.status === 'fail' && (
                          <span className="text-error text-xs">
                            ({result.failureCount} failure{result.failureCount === 1 ? '' : 's'})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted uppercase text-xs">
                          {result.status}
                        </span>
                        <span className="text-text-muted text-xs w-12 text-right">
                          {result.durationMs}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schema Tests */}
            {schemaTests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Schema Tests</h3>
                <div className="space-y-1">
                  {schemaTests.map((result) => (
                    <div
                      key={result.name}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="text-text-primary">{result.name}</span>
                        {result.status === 'fail' && (
                          <span className="text-error text-xs">
                            ({result.failureCount} failure{result.failureCount === 1 ? '' : 's'})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted uppercase text-xs">
                          {result.status}
                        </span>
                        <span className="text-text-muted text-xs w-12 text-right">
                          {result.durationMs}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anomaly Detection */}
            {anomalyTests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Anomaly Detection</h3>
                <div className="space-y-1">
                  {anomalyTests.map((result) => (
                    <div key={result.name} className="text-sm py-1">
                      {result.status === 'error' ? (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="text-text-muted">{result.errorMessage}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={anomalyCount > 0 ? 'text-warning' : 'text-success'}>
                            {anomalyCount > 0 ? '⚠' : '✓'}
                          </span>
                          <span className="text-text-primary">
                            {anomalyCount === 0
                              ? 'No anomalies detected'
                              : `${anomalyCount} anomal${anomalyCount === 1 ? 'y' : 'ies'} detected in set data`}
                          </span>
                          <span className="text-text-muted text-xs ml-auto">
                            {result.durationMs}ms
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary line */}
            <div className="pt-2 border-t border-border-primary text-sm">
              <span className="text-text-primary font-medium">Summary: </span>
              <span className={passingTests === totalTests ? 'text-success' : 'text-warning'}>
                {passingTests}/{totalTests} tests passing
              </span>
              {anomalyCount > 0 && (
                <>
                  <span className="text-text-muted"> | </span>
                  <span className="text-warning">{anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
