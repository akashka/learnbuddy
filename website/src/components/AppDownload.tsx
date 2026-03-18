import { useWebsiteSettings } from '@/contexts/WebsiteSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrustBadges } from './TrustBadges';

const STAR_COUNT = 60;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  left: (i * 17 + 13) % 100,
  top: (i * 23 + 7) % 100,
  size: (i % 3) + 1,
  delay: (i % 8) * 0.3,
  duration: 1.5 + (i % 4) * 0.5,
}));

export function AppDownload({ variant = 'default' }: { variant?: 'default' | 'compact' | 'cardWithStars' }) {
  const { playStoreUrl, appStoreUrl } = useWebsiteSettings();
  const { t } = useLanguage();
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 btn-funky rounded-xl bg-gray-900 px-5 py-3 text-white hover:bg-gray-800"
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.636z" />
          </svg>
          <span className="text-sm font-medium">Google Play</span>
        </a>
        <a
          href={appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 btn-funky rounded-xl bg-gray-900 px-5 py-3 text-white hover:bg-gray-800"
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span className="text-sm font-medium">App Store</span>
        </a>
      </div>
    );
  }

  const content = (
    <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {t('appDownload.title')}
        </h2>
        <p className="mt-4 text-lg text-brand-100 sm:text-xl">
          {t('appDownload.subtitle')}
        </p>
        <TrustBadges variant="compact" className="mt-6" />
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-funky inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 text-white shadow-lg hover:bg-gray-800 hover:shadow-xl"
          >
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.636z" />
            </svg>
            <div className="text-left">
              <span className="block text-xs">{t('appDownload.getItOn')}</span>
              <span className="font-semibold">Google Play</span>
            </div>
          </a>
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-funky inline-flex items-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 text-white shadow-lg hover:bg-gray-800 hover:shadow-xl"
          >
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <span className="block text-xs">{t('appDownload.downloadOn')}</span>
              <span className="font-semibold">App Store</span>
            </div>
          </a>
        </div>
      </div>
  );

  if (variant === 'cardWithStars') {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16 md:px-16 md:py-20">
        {/* Twinkling stars on card */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {stars.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animation: `twinkle ${s.duration}s ease-in-out infinite`,
                animationDelay: `${s.delay}s`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(255,255,255,0.06)_0%,_transparent_50%)]" />
        {content}
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16 md:px-16 md:py-20">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      {content}
    </section>
  );
}
