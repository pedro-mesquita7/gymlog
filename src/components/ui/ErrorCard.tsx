import { useState } from 'react';

interface ErrorCardProps {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  context?: string;
}

export function ErrorCard({ error, resetErrorBoundary, title, context }: ErrorCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border border-error bg-secondary rounded-xl p-6 space-y-4 shadow-card">
      {/* Error header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">
          {title || 'Something went wrong'}
        </h3>
        <p className="text-sm text-muted">
          An error occurred while rendering this section.
        </p>
      </div>

      {/* Expandable details */}
      <div className="space-y-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showDetails ? 'Hide details' : 'Show details'}
        </button>

        {showDetails && (
          <div className="bg-primary/50 rounded p-4 space-y-2">
            <div>
              <div className="text-xs text-muted font-mono mb-1">Error Name</div>
              <div className="text-sm text-primary font-mono">{error.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted font-mono mb-1">Message</div>
              <div className="text-sm text-primary font-mono break-words">{error.message}</div>
            </div>
            {context && (
              <div>
                <div className="text-xs text-muted font-mono mb-1">Context</div>
                <div className="text-sm text-primary font-mono">{context}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retry button */}
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl transition-colors text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
