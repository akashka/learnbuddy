import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'learnbuddy-cookie-consent';

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up border-t border-brand-200 bg-white/98 p-4 shadow-[0_-4px_20px_rgba(79,70,229,0.1)] backdrop-blur-md sm:p-6"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex-1">
          <p className="text-sm text-gray-700 sm:text-base">
            {t('cookie.message')}{' '}
            <Link to="/privacy-policy" className="font-medium text-brand-600 underline hover:text-brand-700">
              {t('common.privacyPolicy')}
            </Link>{' '}
            and{' '}
            <Link to="/terms-conditions" className="font-medium text-brand-600 underline hover:text-brand-700">
              {t('common.termsConditions')}
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={accept}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 hover:shadow-lg"
          >
            {t('cookie.acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
