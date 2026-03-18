import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BrandLogo } from './BrandLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const roleLinks: Record<string, { label: string; path: string }[]> = {
    parent: [
      { label: t('dashboard'), path: '/parent/dashboard' },
      { label: t('marketplace'), path: '/parent/marketplace' },
      { label: t('myKids'), path: '/parent/students' },
      { label: t('myClasses'), path: '/parent/classes' },
      { label: 'Performances', path: '/parent/performances' },
      { label: 'Review Requests', path: '/parent/review-requests' },
      { label: 'Profile', path: '/parent/profile' },
    ],
    teacher: [
      { label: t('dashboard'), path: '/teacher/dashboard' },
      { label: 'Batches', path: '/teacher/batches' },
      { label: t('myClasses'), path: '/teacher/classes' },
      { label: 'Exams', path: '/teacher/exams' },
      { label: 'Study Materials', path: '/teacher/study' },
      { label: 'Review Requests', path: '/teacher/review-requests' },
      { label: 'Agreements', path: '/teacher/agreements' },
      { label: 'Profile', path: '/teacher/profile' },
    ],
    student: [
      { label: t('dashboard'), path: '/student/dashboard' },
      { label: 'Courses', path: '/student/courses' },
      { label: t('myClasses'), path: '/student/classes' },
      { label: t('exams'), path: '/student/exams' },
      { label: 'Study Materials', path: '/student/study' },
      { label: 'Review Requests', path: '/student/review-requests' },
    ],
  };

  const links = user ? roleLinks[user.role] || [] : [];
  const staticLinks = [
    { label: 'About', path: '/about-us' },
    { label: 'Contact', path: '/contact-us' },
    { label: 'FAQ', path: '/faq' },
  ];

  const linkClass = 'text-brand-600 transition hover:text-brand-700 hover:underline lg:inline-block lg:py-0 py-2.5 px-1 rounded-lg hover:bg-brand-50 lg:hover:bg-transparent';
  const NavLinks = () => (
    <>
      {links.map((l) => (
        <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)} className={linkClass}>
          {l.label}
        </Link>
      ))}
      {staticLinks.map((l) => (
        <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)} className={linkClass}>
          {l.label}
        </Link>
      ))}
      {user ? (
        <button onClick={handleLogout} className={`text-left ${linkClass}`}>
          {t('logout')}
        </button>
      ) : (
        <>
          <Link to="/login" onClick={() => setMobileOpen(false)} className={linkClass}>
            {t('login')}
          </Link>
          <Link to="/register" onClick={() => setMobileOpen(false)} className={linkClass}>
            {t('register')}
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-brand-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <BrandLogo
          to={user ? (roleLinks[user.role]?.[0]?.path ?? '/login') : '/login'}
          iconSize={36}
          showTagline
          compact
        />
        {/* Desktop nav */}
        <div className="hidden items-center gap-4 lg:flex">
          <NavLinks />
        </div>
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-brand-50 hover:text-brand-600 lg:hidden"
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
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-brand-100 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            <NavLinks />
          </div>
        </div>
      )}
    </nav>
  );
}
