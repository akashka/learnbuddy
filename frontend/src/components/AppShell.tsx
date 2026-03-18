import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from './ErrorBoundary';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
