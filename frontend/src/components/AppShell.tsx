import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import ErrorBoundary from './ErrorBoundary';
import { Footer } from './Footer';
import { AppBackground } from './AppBackground';

export default function AppShell() {
  const { user } = useAuth();
  const showHeader = !!user;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AppBackground />
      {showHeader && <Navbar />}
      <main className="relative z-0 flex-1 w-full min-w-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
}
