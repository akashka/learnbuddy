import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'Profile',
  users: 'Users',
  masters: 'Masters',
  'cms-pages': 'CMS Pages',
  'ai-data': 'AI Data',
  drafts: 'Drafts',
  teachers: 'Teachers',
  parents: 'Parents',
  students: 'Students',
  enrollments: 'Enrollments',
  pending: 'Pending',
  completed: 'Completed',
  classes: 'Classes',
  'ai-usage-logs': 'AI Usage Logs',
  'ai-review-requests': 'AI Review Requests',
  'security-incidents': 'Security Incidents',
  'audit-logs': 'Audit Log',
  'wishlist-activity': 'Wishlist Updates',
  'teacher-changes': 'Teacher Changes',
  'teacher-payments': 'Teacher Payments',
  'job-positions': 'Job Positions',
  'website-settings': 'Website Settings',
  'contact-submissions': 'Contact Submissions',
  'notification-templates': 'Notification Templates',
  documents: 'Documents',
};

function formatSegment(segment: string): string {
  if (segment in ROUTE_LABELS) return ROUTE_LABELS[segment];
  if (segment.length === 24 && /^[a-f0-9]+$/i.test(segment)) return 'Detail';
  return segment
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

/** Custom path for list crumb when on a detail sub-route (preserves filters) */
function getListPath(segments: string[], index: number): string | null {
  if (segments[0] === 'enrollments' && (segments[1] === 'pending' || segments[1] === 'completed') && index < 2) {
    return `/enrollments?section=${segments[1]}`;
  }
  if (segments[0] === 'classes' && segments.length > 1 && index === 0) return '/classes';
  if (segments[0] === 'security-incidents' && segments.length > 1 && index === 0) return '/security-incidents';
  if (segments[0] === 'ai-usage-logs' && segments.length > 1 && index === 0) return '/ai-usage-logs';
  if (segments[0] === 'audit-logs' && segments.length > 1 && index === 0) return '/audit-logs';
  if (segments[0] === 'ai-data' && segments.length > 1 && index === 0) return '/ai-data';
  if (segments[0] === 'job-positions' && segments.length > 1 && index === 0) return '/job-positions';
  if (segments[0] === 'notification-templates' && segments.length > 1 && index === 0) return '/notification-templates';
  return null;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname.replace(/^\/+/, '');
  const segments = pathname ? pathname.split('/').filter(Boolean) : [];

  if (segments.length === 0) return null;
  if (segments.length === 1 && segments[0] === 'dashboard') return null;

  const crumbs: { path: string; label: string; isLast: boolean }[] =
    segments[0] === 'dashboard' && segments.length === 1
      ? [{ path: '/dashboard', label: 'Dashboard', isLast: true }]
      : [
          { path: '/dashboard', label: 'Dashboard', isLast: false },
          ...segments
            .filter((s) => s !== 'dashboard')
            .map((segment, i) => {
              const segs = segments.filter((s) => s !== 'dashboard');
              const defaultPath = '/' + segs.slice(0, i + 1).join('/');
              const customPath = getListPath(segs, i);
              const path = customPath ?? defaultPath;
              const label = formatSegment(segment);
              const isLast = i === segs.length - 1;
              return { path, label, isLast };
            }),
        ];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-accent-600 sm:text-sm">
      {crumbs.map((crumb, i) => (
        <span key={`${crumb.path}-${i}`} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-accent-400" aria-hidden>
              /
            </span>
          )}
          {crumb.isLast ? (
            <span className="font-medium text-accent-800">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-accent-600 hover:text-accent-800 hover:underline">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
