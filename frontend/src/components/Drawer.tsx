import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** e.g. max-w-md, max-w-lg, max-w-xl */
  widthClassName?: string;
  /** Optional icon / emoji in header */
  headerIcon?: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Right-side drawer with backdrop. Closes via header close button or Escape key.
 * WAI-ARIA dialog pattern: focus trap + focus restoration.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClassName = 'max-w-lg',
  headerIcon,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!drawerRef.current) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => {
        const first = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
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
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-drawer-backdrop" aria-hidden="true" />
      <div
        ref={drawerRef}
        className={`relative z-10 flex h-full w-full flex-col bg-white shadow-2xl ${widthClassName} animate-drawer-panel`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-600 via-brand-600 to-violet-600 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {headerIcon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl shadow-inner" aria-hidden="true">
                {headerIcon}
              </span>
            )}
            <div className="min-w-0">
              <h2 id="drawer-title" className="text-lg font-bold leading-tight text-white sm:text-xl">
                {title}
              </h2>
              {subtitle && <p className="mt-1 text-sm text-white/90">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/90 transition hover:bg-white/20"
            aria-label="Close panel"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
