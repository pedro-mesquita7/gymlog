import { useState, useRef, type ReactNode } from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURATION = prefersReducedMotion ? 0 : 0.2;

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary rounded-xl transition-colors cursor-pointer"
      >
        <span className="flex items-baseline gap-1.5">
          <span className="text-base font-semibold text-text-primary">{title}</span>
          {count != null && (
            <span className="text-sm text-text-muted">({count})</span>
          )}
        </span>
        <m.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: DURATION, ease: 'easeInOut' }}
          className="text-text-muted text-xs leading-none"
          aria-hidden="true"
        >
          &#9654;
        </m.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            ref={contentRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            onAnimationComplete={(definition) => {
              // After expand animation, allow overflow for forms/dropdowns inside
              if (
                contentRef.current &&
                typeof definition === 'object' &&
                'height' in definition &&
                definition.height === 'auto'
              ) {
                contentRef.current.style.overflow = 'visible';
              }
            }}
            onAnimationStart={() => {
              // Before any animation starts, reset overflow to hidden for clean clip
              if (contentRef.current) {
                contentRef.current.style.overflow = 'hidden';
              }
            }}
          >
            <div className="pt-3">
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
