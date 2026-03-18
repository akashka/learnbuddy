import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Locale } from '@/lib/translations';

type NestedValueOf<T> = T extends object
  ? { [K in keyof T]: T[K] extends object ? NestedValueOf<T[K]> | string : T[K] }[keyof T] extends infer V
    ? V
    : never
  : T;

type TranslationKey = string; // e.g. 'nav.aboutUs', 'home.heroTitle'

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('website-locale') as Locale | null;
    if (saved && saved in translations) setLocaleState(saved);
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted) localStorage.setItem('website-locale', newLocale);
    document.documentElement.lang = newLocale === 'en' ? 'en' : `${newLocale}-IN`;
  };

  useEffect(() => {
    if (mounted) document.documentElement.lang = locale === 'en' ? 'en' : `${locale}-IN`;
  }, [locale, mounted]);

  const t = (key: TranslationKey): string => {
    const val = getNested(translations[locale] as object, key);
    if (val) return val;
    const enVal = getNested(translations.en as object, key);
    return enVal ?? key;
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
