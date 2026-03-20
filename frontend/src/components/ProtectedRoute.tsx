import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="text-brand-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role as UserRole)) {
    const redirectByRole: Record<string, string> = {
      parent: '/parent/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      admin: '/admin',
    };
    const redirect = redirectByRole[user.role] || '/';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
