import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, type StaffProfile } from '@/lib/adminApi';

type StaffRole = 'admin' | 'sales' | 'marketing' | 'hr' | 'finance';

interface StaffProfileContextType {
  profile: StaffProfile | null;
  staffRole: StaffRole;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  canAccess: (path: string) => boolean;
}

const StaffProfileContext = createContext<StaffProfileContextType | undefined>(undefined);

/** Which nav items each staff role can access. admin = all. */
const ROLE_NAV: Record<StaffRole, string[]> = {
  admin: [
    'dashboard',
    'reports',
    'profile',
    'users',
    'masters',
    'discount-codes',
    'cms-pages',
    'website-settings',
    'ai-data',
    'drafts',
    'teachers',
    'parents',
    'students',
    'enrollments',
    'classes',
    'teacher-payments',
    'disputes', // redirects to teacher-payments
    'ai-models',
    'ai-usage-logs',
    'ai-review-requests',
    'security-incidents',
    'audit-logs',
    'job-positions',
    'documents',
    'contact-submissions',
    'notification-templates',
  ],
  sales: ['dashboard', 'reports', 'profile', 'teachers', 'parents', 'students', 'enrollments', 'discount-codes', 'classes', 'documents'],
  marketing: ['dashboard', 'reports', 'profile', 'teachers', 'parents', 'students', 'cms-pages', 'website-settings', 'contact-submissions', 'notification-templates', 'documents'],
  hr: ['dashboard', 'profile', 'teachers', 'parents', 'students', 'users', 'job-positions', 'documents'],
  finance: ['dashboard', 'reports', 'profile', 'teachers', 'teacher-payments', 'disputes', 'enrollments', 'discount-codes', 'documents'],
};

export function StaffProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user || user.role !== 'admin' || !token) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await adminApi.me.get();
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
      setProfile({ staffRole: 'admin', name: null, email: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id, token]);

  const staffRole = (profile?.staffRole ?? 'admin') as StaffRole;
  const allowedPaths = ROLE_NAV[staffRole] ?? ROLE_NAV.admin;

  const canAccess = (path: string) => {
    if (isLoading) return true;
    const pathKey = path.replace(/^\//, '').split('/')[0] || 'dashboard';
    return allowedPaths.includes(pathKey);
  };

  return (
    <StaffProfileContext.Provider
      value={{
        profile,
        staffRole,
        isLoading,
        error,
        refetch: fetchProfile,
        canAccess,
      }}
    >
      {children}
    </StaffProfileContext.Provider>
  );
}

export function useStaffProfile() {
  const ctx = useContext(StaffProfileContext);
  if (!ctx) throw new Error('useStaffProfile must be used within StaffProfileProvider');
  return ctx;
}

export function useCanAccess(path: string): boolean {
  const { canAccess } = useStaffProfile();
  return canAccess(path);
}
