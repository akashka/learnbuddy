import { useState } from 'react';

interface AccordionSectionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccordionSection({ title, icon, defaultOpen = false, children, className = '' }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-white/90 shadow-lg backdrop-blur-sm ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-brand-50/50"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 font-bold text-brand-800">
          {icon && <span className="text-xl">{icon}</span>}
          {title}
        </span>
        <svg
          className={`h-6 w-6 shrink-0 text-brand-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-brand-100 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
