import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Locale } from '@/lib/translations';

type TranslationKeys = keyof (typeof translations)['en'] | string;

function getNested(obj: object, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && translations[saved]) setLocaleState(saved);
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted) localStorage.setItem('locale', newLocale);
  };

  const t = (key: TranslationKeys): string => {
    const keyStr = String(key);
    if (keyStr.includes('.')) {
      const val = getNested(translations[locale] as object, keyStr);
      if (val) return val;
      const enVal = getNested(translations.en as object, keyStr);
      return enVal ?? keyStr;
    }
    const flat = translations[locale][key as keyof (typeof translations)['en']];
    if (typeof flat === 'string') return flat;
    const enFlat = translations.en[key as keyof (typeof translations)['en']];
    return (typeof enFlat === 'string' ? enFlat : null) ?? keyStr;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
