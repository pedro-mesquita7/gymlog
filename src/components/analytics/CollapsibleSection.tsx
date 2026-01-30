import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Reusable collapsible section using native HTML details/summary
 * Provides accessible, zero-JS accordion functionality
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  children
}: CollapsibleSectionProps) {
  return (
    <details open={defaultOpen} className="space-y-4 border-b border-zinc-800 pb-6">
      <summary className="cursor-pointer text-lg font-semibold text-zinc-200 select-none hover:text-zinc-100 transition-colors list-none flex items-center gap-2">
        <span className="text-zinc-500 text-sm transition-transform inline-block [details[open]_&]:rotate-90">▶</span>
        {title}
      </summary>
      <div className="pt-2">
        {children}
      </div>
    </details>
  );
}
