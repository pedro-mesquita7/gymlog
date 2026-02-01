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

  const baseStyles = 'bg-bg-secondary rounded-2xl max-w-md w-full p-6 shadow-dialog backdrop:bg-black/50';
  const classes = [baseStyles, className].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className={classes}
      {...props}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <div className="text-text-secondary">{children}</div>
      </div>
    </dialog>
  );
}
