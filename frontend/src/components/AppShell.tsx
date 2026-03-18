import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from './ErrorBoundary';
import { Footer } from './Footer';

const AUTH_PATHS = [
  '/login',
  '/register',
  '/parent/register',
  '/parent/register/form',
  '/teacher/register',
  '/verify-email',
];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function AppShell() {
  const { pathname } = useLocation();
  const showHeader = !isAuthPath(pathname);

  return (
    <div
      className={`flex min-h-screen flex-col ${showHeader ? 'bg-surface' : 'bg-gradient-to-br from-brand-50 via-surface to-brand-100'}`}
    >
      {showHeader && <Navbar />}
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      {showHeader ? (
        <Footer variant="full" />
      ) : (
        <Footer variant="auth" />
      )}
    </div>
  );
}
