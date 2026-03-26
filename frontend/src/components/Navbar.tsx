import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BrandLogo } from './BrandLogo';
import ProfileDropdown from './ProfileDropdown';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLinks: Record<string, { label: string; path: string }[]> = {
    parent: [
      { label: t('home'), path: '/parent/dashboard' },
      { label: t('marketplace'), path: '/parent/marketplace' },
      { label: t('myKids'), path: '/parent/students' },
      { label: t('myClasses'), path: '/parent/classes' },
      { label: 'Payments', path: '/parent/payments' },
    ],
    teacher: [
      { label: t('home'), path: '/teacher/dashboard' },
      { label: 'Batches', path: '/teacher/batches' },
      { label: 'Students', path: '/teacher/students' },
      { label: t('myClasses'), path: '/teacher/classes' },
      { label: 'Payments', path: '/teacher/payments' },
      { label: 'Study Materials', path: '/teacher/study' },
    ],
    student: [
      { label: t('home'), path: '/student/dashboard' },
      { label: t('myClasses'), path: '/student/classes' },
      { label: 'Study Materials', path: '/student/study' },
      { label: t('exams'), path: '/student/exams' },
      { label: '🏆 Performance', path: '/student/performance' },
    ],
  };

  const links = user ? roleLinks[user.role] || [] : [];
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const navLinkBase =
    'inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98] lg:inline-flex w-full lg:w-auto justify-center lg:justify-start';
  const navLinkInactive = 'text-gray-600 hover:bg-white hover:text-brand-600 hover:shadow-sm';
  const navLinkActive = 'bg-white text-brand-700 shadow-sm ring-1 ring-gray-200/80';

  const NavLinks = () => (
    <>
      {links.map((l) => {
        const active = isActive(l.path);
        return (
          <Link
            key={l.path}
            to={l.path}
            onClick={() => setMobileOpen(false)}
            className={`${navLinkBase} ${active ? navLinkActive : navLinkInactive}`}
          >
            {l.label}
          </Link>
        );
      })}
      {!user && (
        <>
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`${navLinkBase} ${isActive('/') ? navLinkActive : navLinkInactive}`}
          >
            {t('login')}
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] lg:inline-flex"
          >
            {t('register')}
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/98 shadow-sm backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center">
          <BrandLogo
            to={user ? (roleLinks[user.role]?.[0]?.path ?? '/') : '/'}
            iconSize={36}
            showTagline
            compact
          />
        </div>
        {/* Desktop nav - centered */}
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100/90 p-1.5">
            <NavLinks />
          </div>
        </div>
        {/* Right: notification + profile */}
        <div className="hidden items-center gap-1 lg:flex">
          {user && (
            <div className="flex items-center gap-1 rounded-xl bg-gray-100/90 p-1.5">
              <NotificationDropdown onLinkClick={() => setMobileOpen(false)} />
              <div className="h-6 w-px bg-gray-200" />
              <ProfileDropdown onLinkClick={() => setMobileOpen(false)} />
            </div>
          )}
        </div>
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 active:scale-95 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-0.5">
            <NavLinks />
            {user && (
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
                <NotificationDropdown onLinkClick={() => setMobileOpen(false)} />
                <ProfileDropdown onLinkClick={() => setMobileOpen(false)} />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
