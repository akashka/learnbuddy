import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';
import { TRUST_BADGES } from './TrustBadges';
import { FooterSocialLinks } from './FooterSocialLinks';
import { BrandLogo } from './BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.learnbuddy.com';

function websiteUrl(path: string) {
  const base = WEBSITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const footerLinkClass = 'text-sm text-gray-600 transition hover:text-brand-600';

  const copyrightAndBadges = (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        © {new Date().getFullYear()} {BRAND.name}. {t('common.allRightsReserved')}. {BRAND.name} {t('common.registeredTrademark')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
        {TRUST_BADGES.map((b) => (
          <span
            key={b.id}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:border-brand-200 hover:shadow"
            title={b.title}
          >
            <span className="text-base">{b.icon}</span>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );

  const footerLinks = [
    { to: '/about-us', label: t('common.aboutUs') },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact-us', label: t('common.contactUs') },
    { to: '/privacy-policy', label: t('common.privacyPolicy') },
    { to: '/terms-conditions', label: t('common.termsConditions') },
    { to: '/refund-policy', label: t('common.refundPolicy') },
    { to: '/course-ownership-rules', label: t('common.courseOwnershipRules') },
  ];

  if (user) {
    return (
      <footer className={`relative z-0 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white ${className}`}>
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={footerLinkClass}>
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            {copyrightAndBadges}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`relative z-0 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white ${className}`}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-16 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="text-center lg:text-left">
            <BrandLogo href={websiteUrl('/')} iconSize={44} showTagline />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-gray-600">
              {BRAND.name} {t('common.footerDesc')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                to="/login"
                className="inline-flex w-fit items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 hover:shadow-lg"
              >
                {t('login')}
              </Link>
              <FooterSocialLinks />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={footerLinkClass}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-14 border-t border-gray-200 pt-8">
          {copyrightAndBadges}
        </div>
      </div>
    </footer>
  );
}
