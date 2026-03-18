import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { CookieConsent } from './CookieConsent';
import { PageFooterCta } from './PageFooterCta';
import { BrandLogo } from './BrandLogo';
import { SocialLinks } from './SocialLinks';
import { TRUST_BADGES } from './TrustBadges';
import { LanguageSelector } from './LanguageSelector';
import { useWebsiteSettings } from '@/contexts/WebsiteSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND } from '@shared/brand';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3007';

const isForYouPath = (path: string) =>
  path === '/for-you' || path === '/for-parents' || path === '/for-students' || path === '/for-teachers';

const SCROLL_THRESHOLD = 60;

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const websiteSettings = useWebsiteSettings();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [forYouOpen, setForYouOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setForYouOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let rafId: number | undefined;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < SCROLL_THRESHOLD) {
          setIsCompact(false);
        } else if (y > lastScrollY.current) {
          setIsCompact(true);
        } else if (y < lastScrollY.current) {
          setIsCompact(false);
        }
        lastScrollY.current = y;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (typeof rafId === 'number') cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <header
        className={`sticky top-0 z-50 border-b border-brand-100/50 bg-surface-elevated/95 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ease-out ${
          isCompact ? 'shadow-sm' : ''
        }`}
      >
        <nav
          className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-10"
          style={{
            paddingTop: isCompact ? 8 : 16,
            paddingBottom: isCompact ? 8 : 16,
            transition: 'padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              transform: isCompact ? 'scale(0.9)' : 'scale(1)',
              transformOrigin: 'left center',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <BrandLogo to="/" iconSize={44} showTagline compact />
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 lg:flex">
            <Link
              to="/about-us"
              className={`text-base font-medium transition ${location.pathname === '/about-us' ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}
            >
              {t('nav.aboutUs')}
            </Link>
            <Link
              to="/contact-us"
              className={`text-base font-medium transition ${location.pathname === '/contact-us' ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}
            >
              {t('nav.contactUs')}
            </Link>
            <Link
              to="/how-it-works"
              className={`text-base font-medium transition ${location.pathname === '/how-it-works' ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}
            >
              {t('nav.howItWorks')}
            </Link>
            <Link
              to="/features"
              className={`text-base font-medium transition ${location.pathname === '/features' ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}
            >
              {t('nav.features')}
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setForYouOpen(!forYouOpen)}
                className={`flex items-center gap-1 text-base font-medium transition ${
                  isForYouPath(location.pathname) ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'
                }`}
              >
                {t('nav.forYou')}
                <svg className={`h-4 w-4 transition-transform ${forYouOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {forYouOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-brand-100 bg-white py-2 shadow-lg">
                  <Link to="/for-parents" onClick={() => setForYouOpen(false)} className={`block px-4 py-2 text-base ${location.pathname === '/for-parents' ? 'font-medium text-brand-600' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600'}`}>{t('nav.forParents')}</Link>
                  <Link to="/for-students" onClick={() => setForYouOpen(false)} className={`block px-4 py-2 text-base ${location.pathname === '/for-students' ? 'font-medium text-brand-600' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600'}`}>{t('nav.forStudents')}</Link>
                  <Link to="/for-teachers" onClick={() => setForYouOpen(false)} className={`block px-4 py-2 text-base ${location.pathname === '/for-teachers' ? 'font-medium text-brand-600' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600'}`}>{t('nav.forTeachers')}</Link>
                </div>
              )}
            </div>
            <LanguageSelector />
            <a
              href={`${APP_URL}/login`}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-700 hover:shadow-lg"
            >
              {t('nav.login')}
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-brand-50 hover:text-brand-600 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-brand-100 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              <Link to="/about-us" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-brand-50">{t('nav.aboutUs')}</Link>
              <Link to="/contact-us" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-brand-50">{t('nav.contactUs')}</Link>
              <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-brand-50">{t('nav.howItWorks')}</Link>
              <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-brand-50">{t('nav.features')}</Link>
              <Link to="/for-you" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-brand-50">{t('nav.forYou')}</Link>
              <div className="border-t border-brand-100 pt-2 mt-2">
                <Link to="/for-parents" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-base text-gray-600 hover:bg-brand-50">{t('nav.forParents')}</Link>
                <Link to="/for-students" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-base text-gray-600 hover:bg-brand-50">{t('nav.forStudents')}</Link>
                <Link to="/for-teachers" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-base text-gray-600 hover:bg-brand-50">{t('nav.forTeachers')}</Link>
              </div>
              <div className="py-2">
                <LanguageSelector />
              </div>
              <a href={`${APP_URL}/login`} className="mt-2 rounded-xl bg-brand-600 px-4 py-3 text-center text-base font-semibold text-white">
                {t('nav.login')}
              </a>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <PageFooterCta />

      <footer className="border-t border-brand-100 bg-white">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[6fr_2fr_2fr_2fr]">
            <div>
              <BrandLogo to="/" iconSize={40} showTagline />
              <p className="mt-3 max-w-md text-base leading-relaxed text-gray-600">
                {BRAND.name} {t('common.footerDesc')}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <a href={`${APP_URL}/login`} className="inline-flex w-fit rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white shadow transition hover:bg-brand-700">
                  Login
                </a>
                <SocialLinks settings={websiteSettings} />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{t('footer.forYou')}</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/for-parents" className="text-base text-gray-600 hover:text-brand-600">{t('nav.forParents')}</Link></li>
                <li><Link to="/for-students" className="text-base text-gray-600 hover:text-brand-600">{t('nav.forStudents')}</Link></li>
                <li><Link to="/for-teachers" className="text-base text-gray-600 hover:text-brand-600">{t('nav.forTeachers')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{t('footer.company')}</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/about-us" className="text-base text-gray-600 hover:text-brand-600">{t('common.aboutUs')}</Link></li>
                <li><Link to="/our-team" className="text-base text-gray-600 hover:text-brand-600">{t('common.ourTeam')}</Link></li>
                <li><Link to="/how-it-works" className="text-base text-gray-600 hover:text-brand-600">{t('common.howItWorks')}</Link></li>
                <li><Link to="/features" className="text-base text-gray-600 hover:text-brand-600">{t('common.features')}</Link></li>
                <li><Link to="/faq" className="text-base text-gray-600 hover:text-brand-600">{t('common.faq')}</Link></li>
                <li><Link to="/careers" className="text-base text-gray-600 hover:text-brand-600">{t('common.careers')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{t('footer.legal')}</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/contact-us" className="text-base text-gray-600 hover:text-brand-600">{t('common.contactUs')}</Link></li>
                <li><Link to="/privacy-policy" className="text-base text-gray-600 hover:text-brand-600">{t('common.privacyPolicy')}</Link></li>
                <li><Link to="/terms-conditions" className="text-base text-gray-600 hover:text-brand-600">{t('common.termsConditions')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-brand-100 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-base text-gray-500">
                <span>© {new Date().getFullYear()} {BRAND.name}. {t('common.allRightsReserved')}</span>
                <span className="mx-2">|</span>
                <span>{BRAND.name} {t('common.registeredTrademark')}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                {TRUST_BADGES.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-white/80 px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm sm:px-3 sm:py-1.5 sm:text-sm"
                    title={b.title}
                  >
                    <span className="text-sm sm:text-base">{b.icon}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}
