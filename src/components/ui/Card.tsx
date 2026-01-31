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
  const baseStyles = 'bg-zinc-800/50 rounded-lg p-4';

  const variantStyles: Record<CardVariant, string> = {
    default: '',
    interactive: 'hover:bg-zinc-800/70 cursor-pointer transition-colors',
  };

  const classes = [baseStyles, variantStyles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
