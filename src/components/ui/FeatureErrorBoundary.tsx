import { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorCard } from './ErrorCard';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  feature: string;
}

interface ErrorLogEntry {
  timestamp: string;
  feature: string;
  errorName: string;
  errorMessage: string;
}

const MAX_ERROR_LOG_ENTRIES = 20;

function logError(feature: string, error: Error) {
  // Log to console
  console.error(`[${feature}] Error:`, error);

  // Store in localStorage for future observability
  try {
    const logKey = 'gymlog-error-log';
    const existingLog = localStorage.getItem(logKey);
    const errorLog: ErrorLogEntry[] = existingLog ? JSON.parse(existingLog) : [];

    // Add new entry
    errorLog.push({
      timestamp: new Date().toISOString(),
      feature,
      errorName: error.name,
      errorMessage: error.message,
    });

    // Keep only last N entries
    const trimmedLog = errorLog.slice(-MAX_ERROR_LOG_ENTRIES);

    localStorage.setItem(logKey, JSON.stringify(trimmedLog));
  } catch (storageError) {
    // If localStorage fails, just log to console
    console.error('Failed to store error log:', storageError);
  }
}

export function FeatureErrorBoundary({ children, feature }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorCard
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          title={`${feature} Error`}
          context={feature}
        />
      )}
      onError={(error) => logError(feature, error)}
    >
      {children}
    </ErrorBoundary>
  );
}
