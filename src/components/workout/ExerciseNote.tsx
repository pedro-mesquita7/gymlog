import { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useExerciseNotes } from '../../hooks/useExerciseNotes';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURATION = prefersReducedMotion ? 0 : 0.2;
const MAX_LENGTH = 70;
const COUNTER_THRESHOLD = 55;
const DEBOUNCE_MS = 500;

interface ExerciseNoteProps {
  originalExerciseId: string;
  currentNote: string;
  onNoteChange: (note: string) => void;
}

export function ExerciseNote({
  originalExerciseId,
  currentNote,
  onNoteChange,
}: ExerciseNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localText, setLocalText] = useState(currentNote);
  const [showHistory, setShowHistory] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { notes, isLoading } = useExerciseNotes(originalExerciseId);

  // Sync local text when currentNote changes externally
  useEffect(() => {
    setLocalText(currentNote);
  }, [currentNote]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const flushNote = useCallback(
    (text: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      onNoteChange(text);
    },
    [onNoteChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalText(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onNoteChange(text);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
  };

  const handleBlur = () => {
    flushNote(localText);
  };

  const remaining = MAX_LENGTH - localText.length;
  const showCounter = localText.length >= COUNTER_THRESHOLD;
  const hasContent = currentNote.length > 0;

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <button
        type="button"
        data-testid="exercise-note-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors px-1 py-1"
        aria-label={isExpanded ? 'Collapse note' : 'Add note'}
        aria-expanded={isExpanded}
      >
        {/* Pencil icon - filled when has content, outline when empty */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={hasContent ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          {!hasContent && <path d="m15 5 4 4" />}
        </svg>
        <span className="text-xs">
          {hasContent ? 'Note' : 'Add note'}
        </span>
      </button>

      {/* Expandable note area */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-3">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  data-testid="exercise-note-input"
                  rows={2}
                  maxLength={MAX_LENGTH}
                  placeholder="Quick note..."
                  value={localText}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="bg-bg-elevated border border-border-primary rounded-lg p-2 text-sm text-text-primary placeholder:text-text-muted w-full resize-none focus:outline-none focus:border-accent"
                />
                {/* Character counter */}
                {showCounter && (
                  <span
                    className={`absolute bottom-2 right-2 text-xs ${
                      remaining <= 0
                        ? 'text-error'
                        : 'text-warning'
                    }`}
                  >
                    {remaining}
                  </span>
                )}
              </div>

              {/* Previous notes section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                  aria-expanded={showHistory}
                >
                  <m.span
                    animate={{ rotate: showHistory ? 90 : 0 }}
                    transition={{ duration: DURATION, ease: 'easeInOut' }}
                    className="text-[10px] leading-none"
                    aria-hidden="true"
                  >
                    &#9654;
                  </m.span>
                  Previous notes
                </button>

                <AnimatePresence initial={false}>
                  {showHistory && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: DURATION, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div data-testid="exercise-note-history" className="pt-2 space-y-1.5">
                        {isLoading ? (
                          <p className="text-xs text-text-muted">Loading...</p>
                        ) : notes.length === 0 ? (
                          <p className="text-xs text-text-muted">No previous notes</p>
                        ) : (
                          notes.map((entry, i) => (
                            <div key={i} data-testid="exercise-note-entry" className="flex gap-2 text-xs">
                              <span className="text-text-muted shrink-0">
                                {formatSessionDate(entry.session_date)}
                              </span>
                              <span className="text-text-secondary">
                                {entry.note}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatSessionDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}
