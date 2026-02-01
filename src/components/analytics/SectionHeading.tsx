interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="border-t border-border-primary pt-6 mt-2">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {subtitle && (
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
