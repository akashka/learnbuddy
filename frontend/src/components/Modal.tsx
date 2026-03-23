import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Backdrop click closes modal (default: false — use explicit Close/Cancel) */
  closeOnBackdrop?: boolean;
  /** Escape key closes modal (default: false — use explicit Close/Cancel) */
  closeOnEscape?: boolean;
  /** Optional - custom class for the overlay */
  overlayClassName?: string;
  /** Optional - max width class, default max-w-lg */
  maxWidth?: string;
}

/**
 * Centered modal that renders at document.body level.
 * Ensures proper viewport centering regardless of parent transforms/overflow.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = false,
  closeOnEscape = false,
  overlayClassName = 'bg-black/60 backdrop-blur-sm',
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose();
    };
    if (isOpen) {
      if (closeOnEscape) document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const content = (
    <div
      className={`fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 my-auto w-full ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
