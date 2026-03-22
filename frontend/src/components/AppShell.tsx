import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import ErrorBoundary from './ErrorBoundary';
import { Footer } from './Footer';
import { AppBackground } from './AppBackground';

/** Routes where main content uses full width (no 1400px cap). */
function useFullWidthMainContent(): boolean {
  const { pathname } = useLocation();
  return pathname === '/parent/marketplace' || pathname.startsWith('/parent/teacher/');
}

export default function AppShell() {
  const { user } = useAuth();
  const showHeader = !!user;
  const { pathname } = useLocation();
  const fullWidthMain = useFullWidthMainContent();
  const isMarketplace = pathname === '/parent/marketplace';

  return (
    <div className="relative flex min-h-screen flex-col">
      <AppBackground />
      {showHeader && <Navbar />}
      <main className="relative z-0 flex-1 w-full min-w-0">
        <div
          className={`mx-auto w-full ${isMarketplace ? 'py-0 sm:py-0 lg:py-0' : 'py-6 sm:py-8 lg:py-10'} ${fullWidthMain ? 'max-w-none px-0 sm:px-0 lg:px-0' : 'max-w-[1400px] px-4 sm:px-6 lg:px-8'}`}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
}
