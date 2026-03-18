import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type PlatformStats } from '@/lib/adminApi';
import { useStaffProfile } from '@/contexts/StaffProfileContext';

export default function ActionItemsDropdown() {
  const { canAccess } = useStaffProfile();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingEnrollments = stats?.counts?.pendingEnrollments ?? 0;
  const pendingAiReviews = stats?.counts?.pendingAiReviews ?? 0;
  const openIncidents = stats?.counts?.openSecurityIncidents ?? 0;
  const total = pendingEnrollments + pendingAiReviews + openIncidents;

  const items: { label: string; count: number; to: string; show: boolean }[] = [
    { label: 'Pending enrollments', count: pendingEnrollments, to: '/enrollments', show: canAccess('/enrollments') },
    { label: 'AI reviews pending', count: pendingAiReviews, to: '/ai-review-requests', show: canAccess('/ai-review-requests') },
    { label: 'Open security incidents', count: openIncidents, to: '/security-incidents', show: canAccess('/security-incidents') },
  ].filter((i) => i.show && i.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-accent-600 hover:bg-accent-100"
        aria-label={`${total} action items`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {total}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-accent-200 bg-white py-2 shadow-lg">
          <div className="px-3 py-2 text-xs font-medium text-accent-500">Action items</div>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm text-accent-800 hover:bg-accent-50"
            >
              <span>{item.label}</span>
              <span className="rounded-full bg-accent-200 px-2 py-0.5 text-xs font-medium text-accent-800">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
