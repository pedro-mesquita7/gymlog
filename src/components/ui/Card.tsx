import { type ComponentPropsWithoutRef } from 'react';

type CardVariant = 'default' | 'interactive';

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  variant?: CardVariant;
}

export function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl p-4 shadow-card';

  const variantStyles: Record<CardVariant, string> = {
    default: '',
    interactive: 'hover:bg-bg-tertiary hover:shadow-card-hover cursor-pointer transition-all',
  };

  const classes = [baseStyles, variantStyles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ background: 'var(--gradient-card-surface)' }}
      {...props}
    >
      {children}
    </div>
  );
}
