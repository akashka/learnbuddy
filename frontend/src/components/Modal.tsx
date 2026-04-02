import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Backdrop click closes modal (default: false) */
  closeOnBackdrop?: boolean;
  /** Escape key closes modal (default: true — WAI-ARIA dialog pattern) */
  closeOnEscape?: boolean;
  /** Optional - custom class for the overlay */
  overlayClassName?: string;
  /** Optional - max width class, default max-w-lg */
  maxWidth?: string;
  /** aria-labelledby: id of the heading element inside the modal */
  labelledBy?: string;
  /** aria-describedby: id of the description element inside the modal */
  describedBy?: string;
}

/** FOCUSABLE selectors used for focus-trapping */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Centered modal that renders at document.body level.
 * WAI-ARIA dialog pattern: focus trap, Escape to close, focus restoration.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = false,
  closeOnEscape = true,
  overlayClassName = 'bg-black/60 backdrop-blur-sm',
  maxWidth = 'max-w-lg',
  labelledBy,
  describedBy,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Store the element that was focused before the modal opened so we can restore it
  const previousFocusRef = useRef<Element | null>(null);

  /** Focus trap: keep Tab / Shift+Tab inside the dialog */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!dialogRef.current) return;
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      // Move focus into dialog on next frame
      requestAnimationFrame(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (!isOpen && previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={dialogRef}
      className={`fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
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
