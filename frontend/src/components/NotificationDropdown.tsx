import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { formatTimeAgo, formatCurrency } from '@shared/formatters';
import { useAuth } from '@/contexts/AuthContext';

type PaymentRetryItem = {
  _id: string;
  subject?: string;
  classLevel?: string;
  teacherName?: string;
  totalAmount?: number;
};

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  createdAt: string;
}

interface NotificationDropdownProps {
  onLinkClick?: () => void;
}

export default function NotificationDropdown({ onLinkClick }: NotificationDropdownProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paymentRetry, setPaymentRetry] = useState<PaymentRetryItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = () => {
    apiJson<{ count: number }>('/api/notifications/unread-count')
      .then((r) => setUnreadCount(r.count))
      .catch(() => setUnreadCount(0));
  };

  const fetchNotifications = () => {
    setLoading(true);
    const notifReq = apiJson<{ notifications: Notification[] }>('/api/notifications?limit=10').then((r) =>
      setNotifications(r.notifications || [])
    );
    const retryReq =
      user?.role === 'parent'
        ? apiJson<{ paymentFailed: PaymentRetryItem[] }>('/api/parent/pending-mappings')
            .then((r) => setPaymentRetry(r.paymentFailed || []))
            .catch(() => setPaymentRetry([]))
        : Promise.resolve().then(() => setPaymentRetry([]));
    Promise.all([notifReq, retryReq]).catch(() => {
      setNotifications([]);
      setPaymentRetry([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [open, user?.role]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const markAsRead = (id: string) => {
    apiJson('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds: [id] }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const markAllRead = () => {
    apiJson('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ markAll: true }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-xl p-2.5 transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          open
            ? 'bg-gradient-to-br from-brand-100 to-violet-100 text-brand-600 shadow-md'
            : 'text-gray-600 hover:bg-gradient-to-br hover:from-brand-50 hover:to-violet-50 hover:text-brand-600 hover:shadow-sm'
        }`}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            aria-label={`${unreadCount > 99 ? '99+' : unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
          >
            <span aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[400px] overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in"
          role="region"
          aria-label="Notifications panel"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-4 py-3">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
            <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-violet-400/20 blur-lg" aria-hidden="true" />
            <div className="relative flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-white/90 transition hover:bg-white/20 hover:text-white"
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="relative max-h-[280px] overflow-y-auto bg-gradient-to-b from-white to-brand-50/30">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
              </div>
            ) : notifications.length === 0 && paymentRetry.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="text-3xl">🔔</span>
                <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-brand-100/80">
                {paymentRetry.map((p) => (
                  <li key={`pay-retry-${p._id}`}>
                    <Link
                      to={`/parent/payment?pendingId=${p._id}`}
                      onClick={() => {
                        setOpen(false);
                        onLinkClick?.();
                      }}
                      className="block bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 transition hover:from-red-100 hover:to-rose-100"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-bold text-red-900">Payment failed — retry</p>
                        <span className="text-lg" aria-hidden>
                          💳
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-red-800">
                        {p.subject ?? 'Course'} · Class {p.classLevel ?? '—'} · {p.teacherName ?? 'Teacher'}
                        {typeof p.totalAmount === 'number' && ` · ${formatCurrency(p.totalAmount)}`}
                      </p>
                      <span className="mt-1 inline-block text-xs font-semibold text-red-700">Retry payment →</span>
                    </Link>
                  </li>
                ))}
                {notifications.map((n) => (
                  <li key={n._id}>
                    <Link
                      to={n.ctaUrl || '/notifications'}
                      onClick={() => {
                        if (!n.read) markAsRead(n._id);
                        setOpen(false);
                        onLinkClick?.();
                      }}
                      className={`block px-4 py-3 transition hover:bg-brand-100/50 ${!n.read ? 'bg-brand-50/60' : ''}`}
                    >
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <span className="shrink-0 text-xs text-gray-500">{formatTimeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{n.message}</p>
                      {n.ctaLabel && n.ctaUrl && (
                        <span className="mt-1 inline-block text-xs font-medium text-brand-600">{n.ctaLabel} →</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-brand-100 bg-gradient-to-r from-brand-50/80 to-violet-50/60 px-4 py-2.5">
            <Link
              to="/notifications"
              onClick={() => {
                setOpen(false);
                onLinkClick?.();
              }}
              className="block rounded-lg py-1.5 text-center text-sm font-medium text-brand-700 transition hover:bg-white/60 hover:text-brand-800"
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
