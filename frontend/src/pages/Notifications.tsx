import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@shared/formatters';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { FilterSidebar } from '@/components/FilterSidebar';
import { formatTimeAgo } from '@shared/formatters';

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

const TYPE_ICONS: Record<string, string> = {
  course_purchased: '🎉',
  reschedule_request: '📅',
  reschedule_confirmed: '✅',
  reschedule_rejected: '😔',
  class_cancelled: '🚫',
  exam_completed: '📝',
  ai_content_generated: '🤖',
  class_reminder_15min: '⏰',
  batch_start_reminder: '📚',
  payment_reminder: '💰',
  ai_review_requested: '✏️',
  ai_review_resolved: '🌟',
  dispute_updated: '⚖️',
};

const TYPE_LABELS: Record<string, string> = {
  course_purchased: 'Course',
  reschedule_request: 'Reschedule',
  reschedule_confirmed: 'Confirmed',
  reschedule_rejected: 'Rejected',
  class_cancelled: 'Cancelled',
  exam_completed: 'Exam',
  ai_content_generated: 'AI Content',
  class_reminder_15min: 'Reminder',
  batch_start_reminder: 'Batch',
  payment_reminder: 'Payment',
  ai_review_requested: 'Review',
  ai_review_resolved: 'Resolved',
  dispute_updated: 'Dispute',
};

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] ?? '🔔';
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

type FilterStatus = 'all' | 'unread' | 'read';
type SortBy = 'newest' | 'oldest' | 'unread_first';

type PaymentRetryItem = {
  _id: string;
  subject?: string;
  classLevel?: string;
  teacherName?: string;
  totalAmount?: number;
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paymentRetry, setPaymentRetry] = useState<PaymentRetryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchNotifications = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<{ notifications: Notification[] }>('/api/notifications?limit=100')
      .then((r) => setNotifications(r.notifications || []))
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (user?.role !== 'parent') {
      setPaymentRetry([]);
      return;
    }
    apiJson<{ paymentFailed: PaymentRetryItem[] }>('/api/parent/pending-mappings')
      .then((r) => setPaymentRetry(r.paymentFailed || []))
      .catch(() => setPaymentRetry([]));
  }, [user?.role]);

  const markAsRead = (id: string) => {
    apiJson('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds: [id] }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    });
  };

  const markAllRead = () => {
    apiJson('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ markAll: true }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...notifications];
    if (filterStatus === 'unread') list = list.filter((n) => !n.read);
    else if (filterStatus === 'read') list = list.filter((n) => n.read);
    if (filterType !== 'all') list = list.filter((n) => n.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === 'unread_first') {
      list.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return list;
  }, [notifications, filterStatus, filterType, sortBy, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const uniqueTypes = useMemo(() => [...new Set(notifications.map((n) => n.type))].sort(), [notifications]);

  useAutoSelectSingleOption(filterType, setFilterType, uniqueTypes, (v) => v === 'all' || v === '');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm font-medium text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchNotifications} fullPage />;

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="🔔"
        title="Notification Center"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
              >
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={fetchNotifications}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-lg transition hover:bg-white/95"
            >
              Refresh
            </button>
          </div>
        }
      />

      {paymentRetry.length > 0 && (
        <div className="mb-6 w-full rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-md sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-red-900">
            <span aria-hidden>💳</span> Retry payment
          </h2>
          <p className="mt-1 text-sm text-red-800">
            These bookings didn’t complete payment. Open the payment page to try again.
          </p>
          <ul className="mt-4 space-y-3">
            {paymentRetry.map((p) => (
              <li key={p._id}>
                <Link
                  to={`/parent/payment?pendingId=${p._id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm transition hover:border-red-300 hover:shadow"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {p.subject ?? 'Course'} · Class {p.classLevel ?? '—'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {p.teacherName ?? 'Teacher'}
                      {typeof p.totalAmount === 'number' && (
                        <span className="ml-2 font-medium text-red-700">· {formatCurrency(p.totalAmount)}</span>
                      )}
                    </p>
                  </div>
                  <span className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Retry payment →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Layout: Filters + Content */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {notifications.length > 0 && (
          <FilterSidebar
            title="Filter & Sort"
            className={`${filtersOpen ? 'block' : 'hidden lg:block'}`}
            footer={<p className="text-sm font-medium text-gray-600">{filteredAndSorted.length} notifications</p>}
          >
            <>
                <div>
                  <label htmlFor="notif-search" className="mb-1.5 block text-xs font-medium text-gray-600">Search</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      id="notif-search"
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
                  <div className="flex gap-2">
                    {(['all', 'unread', 'read'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilterStatus(s)}
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          filterStatus === s
                            ? 'bg-brand-600 text-white'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {s === 'all' ? 'All' : s === 'unread' ? 'Unread' : 'Read'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="filter-type" className="mb-1.5 block text-xs font-medium text-gray-600">Notification Type</label>
                  <select
                    id="filter-type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="all">All types</option>
                    {uniqueTypes.map((t) => (
                      <option key={t} value={t}>
                        {getTypeIcon(t)} {getTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sort-by" className="mb-1.5 block text-xs font-medium text-gray-600">Sort by</label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="unread_first">Unread first</option>
                  </select>
                </div>
            </>
          </FilterSidebar>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {notifications.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-white p-16 text-center shadow-sm">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/20 blur-xl" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-3xl">
                🔔
              </div>
              <h2 className="relative mt-6 text-xl font-semibold text-gray-900">No notifications</h2>
              <p className="relative mt-2 mx-auto max-w-sm text-sm text-gray-500">
                When you receive notifications about classes, exams, or updates, they will appear here.
              </p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white via-brand-50/20 to-accent-50 p-12 text-center shadow-lg">
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-200/25 blur-xl" />
              <p className="relative text-sm font-medium text-gray-600">No notifications match your filters</p>
              <button
                type="button"
                onClick={() => { setFilterStatus('all'); setFilterType('all'); setSearchQuery(''); }}
                className="relative mt-4 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="space-y-5">
              {filteredAndSorted.map((n, idx) => (
                <li key={n._id}>
                  {n.ctaUrl ? (
                    <Link
                      to={n.ctaUrl}
                      onClick={() => !n.read && markAsRead(n._id)}
                      className={`card-funky animate-slide-up group relative block overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 ${
                        n.read
                          ? 'border-gray-200/80 bg-gradient-to-br from-gray-50 via-white to-gray-50/80 hover:border-gray-300 hover:shadow-xl'
                          : 'border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 hover:border-brand-300 hover:shadow-xl'
                      }`}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/20 blur-xl" />
                      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/15 blur-lg" />
                      <div className="relative flex gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-md ${
                          n.read ? 'bg-gray-100' : 'bg-gradient-to-br from-brand-100 to-violet-100'
                        }`}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className={`font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-xs text-gray-500">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-gray-600">{n.message}</p>
                          {n.ctaLabel && (
                            <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 transition group-hover:border-brand-300 group-hover:bg-brand-50">
                              {n.ctaLabel}
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                        {!n.read && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !n.read && markAsRead(n._id)}
                      onKeyDown={(e) => e.key === 'Enter' && !n.read && markAsRead(n._id)}
                      className={`card-funky animate-slide-up group relative block overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 cursor-pointer ${
                        n.read
                          ? 'border-gray-200/80 bg-gradient-to-br from-gray-50 via-white to-gray-50/80 hover:border-gray-300 hover:shadow-xl'
                          : 'border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 hover:border-brand-300 hover:shadow-xl'
                      }`}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/20 blur-xl" />
                      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/15 blur-lg" />
                      <div className="relative flex gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-md ${
                          n.read ? 'bg-gray-100' : 'bg-gradient-to-br from-brand-100 to-violet-100'
                        }`}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className={`font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-xs text-gray-500">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-gray-600">{n.message}</p>
                        </div>
                        {!n.read && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
