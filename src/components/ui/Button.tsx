import { type ComponentPropsWithoutRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  // Base styles
  const baseStyles = 'rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent';

  // Variant styles
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-accent hover:bg-accent-hover text-black',
    secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated',
    ghost: 'bg-transparent hover:bg-bg-tertiary text-text-primary',
    danger: 'bg-transparent text-error hover:bg-bg-tertiary',
  };

  // Size styles
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-2.5 px-4',
    lg: 'py-4 text-lg font-bold w-full',
  };

  // Disabled styles
  const disabledStyles = 'opacity-50 cursor-not-allowed';

  const classes = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabled ? disabledStyles : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
