import { type ComponentPropsWithoutRef } from 'react';

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  className?: string;
}

interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  className?: string;
}

const inputBaseStyles = 'w-full p-3 bg-bg-tertiary border border-border-primary rounded-xl text-text-primary focus:outline-none focus:border-accent';

export function Input({ className = '', ...props }: InputProps) {
  const classes = [inputBaseStyles, className].filter(Boolean).join(' ');

  return <input className={classes} {...props} />;
}

export function Select({ className = '', ...props }: SelectProps) {
  const classes = [inputBaseStyles, className].filter(Boolean).join(' ');

  return <select className={classes} {...props} />;
}
