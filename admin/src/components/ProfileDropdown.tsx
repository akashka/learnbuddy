import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffProfile } from '@/contexts/StaffProfileContext';

const LAST_LOGIN_KEY = 'admin_last_login';

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const local = email.split('@')[0];
  return local.slice(0, 2).toUpperCase();
}

function formatLastLogin(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { profile } = useStaffProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_LOGIN_KEY);
    if (stored) setLastLogin(stored);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? 'User';
  const displayEmail = profile?.email ?? user.email ?? '-';
  const displayRole = profile?.staffRole ?? user.role ?? '-';
  const displayPhone = profile?.phone ?? '-';
  const photoUrl = (profile as { photo?: string })?.photo;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-accent-200 focus:outline-none focus:ring-2 focus:ring-accent-400"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-sm font-medium text-white">
            {getInitials(profile?.name ?? null, user.email ?? '')}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-accent-200 bg-white py-2 shadow-lg">
          {/* User info */}
          <div className="border-b border-accent-100 px-4 py-3">
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-600 text-lg font-medium text-white">
                  {getInitials(profile?.name ?? null, user.email ?? '')}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-accent-800">{displayName}</p>
                <p className="truncate text-xs text-accent-600 capitalize">{displayRole}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 text-accent-500">Email</dt>
                <dd className="truncate text-accent-800">{displayEmail}</dd>
              </div>
              {displayPhone !== '-' && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-accent-500">Phone</dt>
                  <dd className="truncate text-accent-800">{displayPhone}</dd>
                </div>
              )}
              {lastLogin && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-accent-500">Last active</dt>
                  <dd className="text-accent-800">{formatLastLogin(lastLogin)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-accent-700 hover:bg-accent-50"
            >
              <span>✏️</span>
              Edit profile
            </Link>
            <Link
              to="/profile#change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-accent-700 hover:bg-accent-50"
            >
              <span>🔒</span>
              Change password
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
                window.location.href = '/';
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-accent-700 hover:bg-accent-50"
            >
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
