import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';
import { TRUST_BADGES } from './TrustBadges';
import { FooterSocialLinks } from './FooterSocialLinks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const footerLinkClass = 'text-sm text-gray-600 transition hover:text-brand-600';

  const copyrightAndBadges = (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm text-gray-500 sm:text-left">
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

  const linksRow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
        {footerLinks.map(({ to, label }) => (
          <Link key={to} to={to} className={footerLinkClass}>
            {label}
          </Link>
        ))}
      </div>
      <div className="flex justify-center sm:justify-end">
        <FooterSocialLinks />
      </div>
    </div>
  );

  if (user) {
    return (
      <footer className={`relative z-0 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white ${className}`}>
        <div className="mx-auto w-full max-w-[1400px] px-6 py-6 sm:px-8 lg:px-10">
          {linksRow}
          <div className="border-t border-gray-200 pt-8">
            {copyrightAndBadges}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`relative z-0 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white ${className}`}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-6 sm:px-8 lg:px-10">
        {linksRow}
        <div className="border-t border-gray-200 pt-8">
          {copyrightAndBadges}
        </div>
      </div>
    </footer>
  );
}
