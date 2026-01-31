import { ComponentPropsWithoutRef } from 'react';

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
  const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent';

  // Variant styles
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-accent hover:bg-accent/90 text-black',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
    ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-100',
    danger: 'bg-transparent text-red-400 hover:bg-zinc-800',
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
