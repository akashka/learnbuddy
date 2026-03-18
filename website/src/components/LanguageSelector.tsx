import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Locale } from '@/lib/translations';

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  bn: 'বাংলা',
  te: 'తెలుగు',
  mr: 'मराठी',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
};

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50 hover:border-brand-300"
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className="text-base" aria-hidden>🌐</span>
        <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] min-w-[140px] overflow-y-auto rounded-xl border border-brand-100 bg-white py-2 shadow-lg">
          {(Object.keys(LOCALE_NAMES) as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocale(loc);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                loc === locale ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-700 hover:bg-brand-50/50'
              }`}
            >
              {LOCALE_NAMES[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
