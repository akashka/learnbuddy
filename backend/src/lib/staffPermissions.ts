/**
 * Permission matrix for admin staff roles.
 * Admin has full access. Other roles are restricted to specific features.
 */
export type StaffRole = 'admin' | 'sales' | 'marketing' | 'hr' | 'finance';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  sales: 'Sales',
  marketing: 'Marketing',
  hr: 'HR',
  finance: 'Finance',
};

/** Routes/features each role can access. Admin can access all. */
export const STAFF_PERMISSIONS: Record<StaffRole, string[]> = {
  admin: ['*'],
  sales: ['dashboard', 'teachers', 'parents', 'students', 'enrollments', 'classes', 'drafts', 'stats'],
  marketing: ['dashboard', 'cms-pages', 'ai-data', 'drafts', 'stats'],
  hr: ['dashboard', 'teachers', 'parents', 'students', 'enrollments', 'classes', 'ai-review-requests'],
  finance: ['dashboard', 'enrollments', 'classes', 'teacher-payments', 'stats', 'security-incidents'],
};

export function canAccess(staffRole: StaffRole, feature: string): boolean {
  const perms = STAFF_PERMISSIONS[staffRole];
  if (perms.includes('*')) return true;
  return perms.includes(feature);
}
