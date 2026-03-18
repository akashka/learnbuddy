import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BrandLogo } from './BrandLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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

  return (
    <nav className="border-b border-brand-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <BrandLogo to="/" iconSize={36} showTagline compact />
        <div className="flex items-center gap-4">
          {links.map((l) => (
            <Link key={l.path} to={l.path} className="text-brand-600 hover:underline">
              {l.label}
            </Link>
          ))}
          <Link to="/about-us" className="text-brand-600 hover:underline">
            About
          </Link>
          <Link to="/contact-us" className="text-brand-600 hover:underline">
            Contact
          </Link>
          <Link to="/faq" className="text-brand-600 hover:underline">
            FAQ
          </Link>
          {user ? (
            <button onClick={handleLogout} className="text-brand-600 hover:underline">
              {t('logout')}
            </button>
          ) : (
            <>
              <Link to="/login" className="text-brand-600 hover:underline">
                {t('login')}
              </Link>
              <Link to="/register" className="text-brand-600 hover:underline">
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
