import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  parent: '/parent/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  admin: '/admin',
};

export function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    const dashboard = DASHBOARD_BY_ROLE[user.role] ?? '/parent/dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return <Login />;
}
