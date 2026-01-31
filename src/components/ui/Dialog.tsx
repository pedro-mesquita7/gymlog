import { useRef, useEffect, type ComponentPropsWithoutRef, type ReactNode } from 'react';

interface DialogProps extends ComponentPropsWithoutRef<'dialog'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  ...props
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const baseStyles = 'bg-zinc-900 rounded-lg max-w-md w-full p-6 backdrop:bg-black/50';
  const classes = [baseStyles, className].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className={classes}
      {...props}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        <div className="text-zinc-300">{children}</div>
      </div>
    </dialog>
  );
}
