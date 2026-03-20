import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Modal } from '@/components/Modal';

const PROFILE_PATH_BY_ROLE: Record<string, string> = {
  teacher: '/teacher/profile',
  parent: '/parent/profile',
  student: '/student/dashboard',
};

// Extra menu items by role (moved from header for easier management)
const EXTRA_LINKS_BY_ROLE: Record<string, { label: string; path: string; icon: string }[]> = {
  parent: [
    { label: 'Performances', path: '/parent/performances', icon: '📊' },
    { label: 'Review Requests', path: '/parent/review-requests', icon: '✏️' },
    { label: 'Disputes', path: '/disputes', icon: '⚖️' },
    { label: 'Privacy & Data', path: '/parent/privacy', icon: '🔒' },
    { label: 'Settings', path: '/parent/settings', icon: '⚙️' },
  ],
  teacher: [
    { label: 'Review Requests', path: '/teacher/review-requests', icon: '✏️' },
    { label: 'Disputes', path: '/disputes', icon: '⚖️' },
    { label: 'Privacy & Data', path: '/teacher/privacy', icon: '🔒' },
    { label: 'Settings', path: '/teacher/settings', icon: '⚙️' },
  ],
  student: [
    { label: 'Review Requests', path: '/student/review-requests', icon: '✏️' },
  ],
};

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const local = (email || '').split('@')[0];
  return local ? local.slice(0, 2).toUpperCase() : '?';
}

interface ProfileDropdownProps {
  onLinkClick?: () => void;
}

export default function ProfileDropdown({ onLinkClick }: ProfileDropdownProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; photoUrl?: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const path = user.role === 'teacher' ? '/api/teacher/profile' : user.role === 'parent' ? '/api/parent/profile' : user.role === 'student' ? '/api/student/profile' : null;
    if (path) {
      apiJson<{ name?: string; photoUrl?: string }>(path).then(setProfile).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? 'User';
  const photoUrl = profile?.photoUrl;
  const profilePath = PROFILE_PATH_BY_ROLE[user.role];
  const extraLinks = EXTRA_LINKS_BY_ROLE[user.role] || [];

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    window.location.href = '/';
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2 rounded-xl p-0.5 ring-2 transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            open
              ? 'ring-brand-300 bg-gradient-to-br from-brand-50 to-violet-50 shadow-md'
              : 'ring-transparent hover:ring-brand-200 hover:bg-gradient-to-br hover:from-brand-50/50 hover:to-violet-50/50 hover:shadow-sm'
          }`}
          aria-label="Profile menu"
          aria-expanded={open}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-medium text-white shadow-md">
              {getInitials(profile?.name ?? null, user.email ?? '')}
            </div>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in">
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-4 py-4">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-violet-400/20 blur-lg" />
              <div className="relative flex items-center gap-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/50 shadow" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white backdrop-blur-sm">
                    {getInitials(profile?.name ?? null, user.email ?? '')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{displayName}</p>
                  <p className="truncate text-xs text-white/80 capitalize">{user.role}</p>
                </div>
              </div>
            </div>

            <div className="py-1 bg-gradient-to-b from-white to-brand-50/30">
              {profilePath && (
                <Link
                  to={profilePath}
                  onClick={() => { setOpen(false); onLinkClick?.(); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-brand-100/50"
                >
                  <span>👤</span>
                  View profile
                </Link>
              )}
              {extraLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { setOpen(false); onLinkClick?.(); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-brand-100/50"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <span>🚪</span>
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        overlayClassName="bg-black/50 backdrop-blur-sm"
        maxWidth="max-w-md"
      >
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-2xl">🚪</div>
              <div>
                <h3 className="text-lg font-semibold text-brand-800">Logout</h3>
                <p className="text-sm text-brand-600">Are you sure you want to logout?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border-2 border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('logout')}
              </button>
            </div>
        </div>
      </Modal>
    </>
  );
}
