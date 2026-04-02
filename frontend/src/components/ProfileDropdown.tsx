import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Modal } from '@/components/Modal';

const PROFILE_PATH_BY_ROLE: Record<string, string> = {
  teacher: '/teacher/profile',
  parent: '/parent/profile',
  student: '/student/profile',
};

// Extra menu items by role (moved from header for easier management)
const EXTRA_LINKS_BY_ROLE: Record<string, { label: string; path: string; icon: string }[]> = {
  parent: [
    { label: 'My Course', path: '/parent/my-course', icon: '📚' },
    { label: 'My Teachers', path: '/parent/my-teachers', icon: '👩‍🏫' },
    { label: 'My Wishlist', path: '/parent/wishlist', icon: '❤️' },
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
    { label: 'My Courses', path: '/student/courses', icon: '📚' },
    { label: 'My Teachers', path: '/student/my-teachers', icon: '👩‍🏫' },
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

  /** Arrow-key / Escape keyboard navigation for the menu (WAI-ARIA menu pattern) */
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const items = Array.from(
        ref.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
      );
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    []
  );

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
          aria-label={`Profile menu for ${displayName}`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {photoUrl ? (
            <img src={photoUrl} alt={`${displayName}'s profile photo`} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-medium text-white shadow-md">
              {getInitials(profile?.name ?? null, user.email ?? '')}
            </div>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in"
            role="menu"
            aria-label="Profile options"
            onKeyDown={handleMenuKeyDown}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-4 py-4">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-violet-400/20 blur-lg" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/50 shadow" aria-hidden="true" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white backdrop-blur-sm" aria-hidden="true">
                    {getInitials(profile?.name ?? null, user.email ?? '')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{displayName}</p>
                  <p className="truncate text-xs text-white/90 capitalize">{user.role}</p>
                </div>
              </div>
            </div>

            <div className="py-1 bg-gradient-to-b from-white to-brand-50/30">
              {profilePath && (
                <Link
                  to={profilePath}
                  onClick={() => { setOpen(false); onLinkClick?.(); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-brand-100/50"
                  role="menuitem"
                >
                  <span aria-hidden="true">👤</span>
                  View profile
                </Link>
              )}
              {extraLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { setOpen(false); onLinkClick?.(); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-brand-100/50"
                  role="menuitem"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                role="menuitem"
              >
                <span aria-hidden="true">🚪</span>
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        overlayClassName="bg-black/60 backdrop-blur-md"
        maxWidth="max-w-sm"
        labelledBy="logout-modal-title"
      >
        <div className="overflow-hidden rounded-2xl shadow-2xl">
          {/* Gradient Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 pt-6 pb-8">
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-violet-400/20 blur-xl" />
            {/* User avatar row */}
            <div className="relative flex flex-col items-center gap-3 text-center">
              {/* Animated door icon */}
              <div className="relative mb-1">
                <div className="absolute inset-0 animate-ping rounded-full bg-white/20" style={{ animationDuration: '2s' }} />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl shadow-lg backdrop-blur-sm ring-2 ring-white/30">
                  🚪
                </div>
              </div>
              <div>
                <h3 id="logout-modal-title" className="text-xl font-bold text-white tracking-tight">Signing Out?</h3>
                <p className="mt-0.5 text-sm text-white/80">
                  Hi <span className="font-semibold">{displayName}</span>, you're about to log out.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              What will happen
            </p>
            <ul className="space-y-2.5">
              {[
                { icon: '🔐', text: 'Your current session will be securely ended.' },
                { icon: '📱', text: 'You\'ll be redirected to the login page.' },
                { icon: '🔔', text: 'Live class notifications will pause until you log back in.' },
                { icon: '💾', text: 'Your progress & data are safely saved in the cloud.' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm">
                    {icon}
                  </span>
                  <span className="text-sm text-gray-600 leading-snug">{text}</span>
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98]"
              >
                Stay Logged In
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-200 transition-all hover:from-red-600 hover:to-rose-700 hover:shadow-red-300 active:scale-[0.98]"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
