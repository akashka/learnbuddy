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
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

type DisputeSummary = { _id: string; subject: string; status: string }[];

const TEACHER_MENU = [
  { href: '/teacher/batches', icon: '📦', title: 'Batches', desc: 'Manage your batches & students' },
  { href: '/teacher/students', icon: '👥', title: 'Students', desc: 'View enrolled students, progress & details' },
  { href: '/teacher/classes', icon: '📅', title: 'Classes', desc: 'Upcoming classes, start class, recordings' },
  { href: '/teacher/payments', icon: '💰', title: 'Payments', desc: 'Bank details, passbook & payment history' },
  { href: '/teacher/study', icon: '📚', title: 'Study Materials', desc: 'Share resources with students' },
  { href: '/teacher/agreements', icon: '📋', title: 'Agreements', desc: 'View agreements & terms' },
  { href: '/teacher/profile', icon: '👤', title: 'Profile', desc: 'View & edit profile' },
];

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<{ amount: number; periodStart?: string; periodEnd?: string }[]>([]);
  const [nextPaymentLabel, setNextPaymentLabel] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<DisputeSummary>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      apiJson<Profile>('/api/teacher/profile'),
      apiJson<{ checklist: ChecklistItem[] }>('/api/teacher/onboarding-status').catch(() => ({ checklist: [] })),
      apiJson<{ payments: { status: string; amount: number; periodStart?: string; periodEnd?: string }[] }>('/api/teacher/payments').catch(() => ({ payments: [] })),
      apiJson<{ nextPaymentMonth?: { label: string }; message?: string }>('/api/teacher/payments/schedule').catch(() => ({})),
      apiJson<{ disputes: DisputeSummary }>('/api/disputes').catch(() => ({ disputes: [] })),
    ])
      .then(([p, o, pay, sched, disp]) => {
        setProfile(p);
        setChecklist(o.checklist || []);
        setPendingPayments((pay.payments || []).filter((x) => x.status === 'pending'));
        setNextPaymentLabel(sched.nextPaymentMonth?.label ?? null);
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

  const doneItems = checklist.filter((i) => i.done);
  const pendingItems = checklist.filter((i) => !i.done);

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👩‍🏫"
        title={`${t('welcome')}, ${profile?.name || profile?.email || t('teacher')}!`}
        subtitle="Manage your teaching dashboard"
      />

      {checklist.length > 0 && (
        <div className="relative mb-6 overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg sm:mb-8 sm:p-6">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
          <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
          <h2 className="relative mb-3 flex items-center gap-2 font-bold text-amber-900">
            <span className="text-2xl">🚀</span> Getting Started
          </h2>
          <ul className="space-y-2">
            {doneItems.map((item) => {
              const profileHref = item.href.includes('/teacher/profile');
              const to = profileHref ? '/teacher/profile' : item.href;
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 rounded-lg bg-green-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-green-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white" aria-hidden>✓</span>
                    {item.label}
                  </span>
                  <Link
                    to={to}
                    className="text-sm font-medium text-green-700 underline hover:text-green-800"
                  >
                    View
                  </Link>
                </li>
              );
            })}
            {pendingItems.map((item) => {
              const profileHref = item.href.includes('/teacher/profile');
              const to = profileHref ? '/teacher/profile?edit=1' : item.href;
              return (
                <li key={item.id} className="flex items-center justify-between gap-4">
                  <span>{item.label}</span>
                  <Link
                    to={to}
                    className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-amber-600"
                  >
                    {item.cta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(pendingPayments.length > 0 || nextPaymentLabel || disputes.some((d) => d.status === 'open' || d.status === 'in_review')) && (
        <div className="mb-6 w-full max-w-4xl space-y-6 sm:mb-8">
          {(pendingPayments.length > 0 || nextPaymentLabel) && (
            <Link
              to="/teacher/payments"
              className="block overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-6 shadow-lg transition hover:border-amber-300 hover:shadow-xl"
            >
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-900">
                <span className="text-2xl">💰</span> Upcoming payments
              </h2>
              <p className="mb-4 text-amber-800">
                {pendingPayments.length > 0
                  ? `${pendingPayments.length} pending payment${pendingPayments.length !== 1 ? 's' : ''} (₹${pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')})`
                  : nextPaymentLabel
                    ? `Next period: ${nextPaymentLabel}`
                    : 'View your payment schedule and history.'}
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

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {TEACHER_MENU.map((item, idx) => (
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
