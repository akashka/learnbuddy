import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';

interface Profile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

type PaymentFailedItem = {
  _id: string;
  subject?: string;
  classLevel?: string;
  teacherName?: string;
  totalAmount?: number;
};

type UpcomingItem = {
  _id: string;
  subject?: string;
  totalAmount?: number;
  endDate?: string;
  student?: { name?: string };
  teacher?: { name?: string };
};

type DisputeSummary = { _id: string; subject: string; status: string }[];

const PARENT_MENU = [
  { href: '/parent/students', icon: '👦', title: 'Student Details', desc: 'See kids details, update them' },
  { href: '/parent/marketplace', icon: '👩‍🏫', title: 'Teachers', desc: 'Browse marketplace, book for existing or new student' },
  { href: '/parent/performances', icon: '📊', title: 'Performances', desc: 'Kids exam & class performance' },
  { href: '/parent/classes', icon: '📅', title: 'Classes', desc: 'Old class videos, upcoming schedules' },
  { href: '/parent/payments', icon: '💰', title: 'Payments', desc: 'History, upcoming renewals' },
  { href: '/parent/profile', icon: '👤', title: 'Profile', desc: 'View & edit your profile' },
  { href: '/parent/settings', icon: '⚙️', title: 'Settings', desc: 'Language, notifications & preferences' },
];

export default function ParentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [paymentFailed, setPaymentFailed] = useState<PaymentFailedItem[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeSummary>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      apiJson<Profile>('/api/parent/profile'),
      apiJson<{ checklist: ChecklistItem[] }>('/api/parent/onboarding-status').catch(() => ({ checklist: [] })),
      apiJson<{ paymentFailed: PaymentFailedItem[] }>('/api/parent/pending-mappings').catch(() => ({
        paymentFailed: [],
      })),
      apiJson<{ upcoming: UpcomingItem[] }>('/api/parent/payments').catch(() => ({ upcoming: [] })),
      apiJson<{ disputes: DisputeSummary }>('/api/disputes').catch(() => ({ disputes: [] })),
    ])
      .then(([p, onboarding, pm, pay, disp]) => {
        setProfile(p);
        setChecklist(onboarding.checklist || []);
        setPaymentFailed(pm.paymentFailed || []);
        setUpcoming(pay.upcoming || []);
        setDisputes(disp.disputes || []);
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👨‍👩‍👧‍👦"
        title={`${t('welcome')}, ${profile?.name || t('parent')}!`}
        subtitle="Manage your kids' learning"
      />

      {paymentFailed.length > 0 && (
        <div className="mb-6 w-full rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-600 to-rose-600 p-4 text-white shadow-lg sm:mb-8 sm:p-5">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="text-2xl shrink-0" aria-hidden>
                💳
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white">
                  {paymentFailed.length === 1 ? 'Payment failed — retry to keep your seat' : `${paymentFailed.length} payments need retry`}
                </p>
                <p className="text-sm text-red-100">
                  Complete payment from the link below so your booking isn’t lost.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
              {paymentFailed.map((p) => (
                <Link
                  key={p._id}
                  to={`/parent/payment?pendingId=${p._id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-700 shadow-md transition hover:bg-red-50 sm:flex-none"
                >
                  Retry{p.subject ? `: ${p.subject}` : ''}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {checklist.length > 0 && !checklist.every((i) => i.done) && (
        <div className="mb-6 w-full max-w-4xl sm:mb-8">
          <div className="relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
            <h2 className="relative mb-4 flex items-center gap-2 text-lg font-bold text-brand-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-xl">📋</span>
              Getting Started
            </h2>
            <ul className="relative space-y-3">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white/80 p-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      item.done ? 'bg-green-100 text-green-700' : 'bg-brand-100 text-brand-600'
                    }`}
                  >
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className="flex-1 font-medium text-brand-800">{item.label}</span>
                  <Link
                    to={item.href}
                    className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-200"
                  >
                    {item.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(upcoming.length > 0 || disputes.some((d) => d.status === 'open' || d.status === 'in_review')) && (
        <div className="mb-6 w-full max-w-4xl space-y-6 sm:mb-8">
          {upcoming.length > 0 && (
            <Link
              to="/parent/payments"
              className="block overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-6 shadow-lg transition hover:border-amber-300 hover:shadow-xl"
            >
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-900">
                <span className="text-2xl">📅</span> Upcoming renewals
              </h2>
              <p className="mb-4 text-amber-800">
                {upcoming.length} enrollment{upcoming.length !== 1 ? 's' : ''} ending soon. Plan your renewals.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                View payments <span aria-hidden>→</span>
              </span>
            </Link>
          )}
          {disputes.some((d) => d.status === 'open' || d.status === 'in_review') && (
            <Link
              to="/disputes"
              className="block overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet-50/50 p-6 shadow-lg transition hover:border-brand-300 hover:shadow-xl"
            >
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-brand-900">
                <span className="text-2xl">⚖️</span> Your disputes
              </h2>
              <p className="mb-4 text-brand-800">
                {disputes.filter((d) => d.status === 'open' || d.status === 'in_review').length} open dispute
                {disputes.filter((d) => d.status === 'open' || d.status === 'in_review').length !== 1 ? 's' : ''}. Track status and admin response.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                View disputes <span aria-hidden>→</span>
              </span>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {PARENT_MENU.map((item, idx) => (
          <Link
            key={item.href}
            to={item.href}
            className="card-funky animate-slide-up relative overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg transition-all duration-300 hover:border-brand-300 hover:shadow-xl"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-200/20 blur-xl" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-brand-200/15 blur-lg" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 via-violet-100 to-brand-200 text-2xl shadow-md">
                {item.icon}
              </div>
              <div>
                <h2 className="font-bold text-brand-800">{item.title}</h2>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
