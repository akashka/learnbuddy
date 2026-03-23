import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { formatCurrency, formatDate } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { LearnerFilterChips } from '@/components/LearnerFilterChips';
import { useParentLearnerOptions } from '@/hooks/useParentLearnerOptions';
import { downloadPaymentHistoryReceipt } from '@/lib/paymentReceipt';

interface StudentRef {
  _id?: string;
  name?: string;
  studentId?: string;
}

interface PaymentItem {
  _id: string;
  totalAmount?: number;
  paymentStatus?: string;
  paymentId?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: StudentRef;
  teacher?: { name?: string };
  batchId?: string;
  board?: string;
  classLevel?: string;
  duration?: string;
  feePerMonth?: number;
  discount?: number;
  discountCode?: string;
  discountCodeAmount?: number;
  slots?: { day: string; startTime: string; endTime: string }[];
}

interface UpcomingItem {
  _id: string;
  totalAmount?: number;
  subject?: string;
  endDate?: string;
  student?: StudentRef;
  teacher?: { name?: string };
  teacherId: string;
  batchIndex: number;
  duration?: string;
  board?: string;
  classLevel?: string;
  batchId?: string;
}

interface DisputeItem {
  _id: string;
  subject: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function ParentPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStudentId = searchParams.get('studentId') || '';

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { options: learnerOptions } = useParentLearnerOptions();

  const setStudentFilter = (studentId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (studentId) next.set('studentId', studentId);
      else next.delete('studentId');
      return next;
    });
  };

  const filteredUpcoming = useMemo(() => {
    if (!filterStudentId) return upcoming;
    return upcoming.filter((u) => String(u.student?._id) === filterStudentId);
  }, [upcoming, filterStudentId]);

  const filteredPayments = useMemo(() => {
    if (!filterStudentId) return payments;
    return payments.filter((p) => String(p.student?._id) === filterStudentId);
  }, [payments, filterStudentId]);

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      apiJson<{ payments: PaymentItem[]; upcoming: UpcomingItem[] }>('/api/parent/payments'),
      apiJson<{ disputes: DisputeItem[] }>('/api/disputes').catch(() => ({ disputes: [] })),
    ])
      .then(([d, disp]) => {
        setPayments(d.payments || []);
        setUpcoming(d.upcoming || []);
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
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading payments...</p>
      </div>
    );
  }

  if (error) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="💰"
        title="Payments"
        subtitle="Payment history, receipts, and upcoming renewals"
      />

      {learnerOptions.length > 0 && (
        <LearnerFilterChips
          className="mb-6"
          options={learnerOptions}
          selectedId={filterStudentId}
          onChange={setStudentFilter}
        />
      )}

      <div className="space-y-6">
        {filteredUpcoming.length > 0 && (
          <ContentCard className="stagger-1">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-accent-100 text-2xl shadow-md">
                  📅
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Upcoming renewals</h2>
                  <p className="text-sm text-gray-600">Renew before the period ends — pay to continue</p>
                </div>
              </div>
              <div className="space-y-3">
                {filteredUpcoming.map((u) => {
                  const checkoutHref = `/parent/checkout?renewalEnrollmentId=${encodeURIComponent(String(u._id))}`;
                  return (
                    <div
                      key={u._id}
                      className="flex flex-col gap-4 rounded-xl border-2 border-amber-100 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-800">{u.subject}</p>
                        <p className="text-sm text-gray-600">
                          {(u.student as StudentRef)?.name} • {(u.teacher as { name?: string })?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Current period ends {u.endDate ? formatDate(u.endDate) : '—'}
                          {u.board && u.classLevel && (
                            <span className="ml-2">
                              · {u.board} · Class {u.classLevel}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                        <p className="text-right font-semibold text-brand-800">
                          {formatCurrency(u.totalAmount ?? 0)}
                          <span className="text-sm font-normal text-gray-600">/mo</span>
                        </p>
                        <Link
                          to={checkoutHref}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
                        >
                          Pay now
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ContentCard>
        )}

        <ContentCard className="stagger-2">
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 text-2xl shadow-md">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-800">Payment history</h2>
                <p className="text-sm text-gray-600">Completed payments — download a receipt anytime</p>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/30 py-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="mt-2 font-medium text-brand-700">
                  {filterStudentId ? 'No payments for this learner yet.' : 'No payments yet'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Your payment history will appear here when you enroll your child.
                </p>
                <Link
                  to="/parent/marketplace"
                  className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
                >
                  Browse Teachers
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((p) => (
                  <div
                    key={p._id}
                    className="flex flex-col gap-3 rounded-xl border-2 border-brand-100 bg-white p-4 transition hover:border-brand-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-800">{p.subject}</p>
                      <p className="text-sm text-gray-600">
                        {(p.student as StudentRef)?.name} • {(p.teacher as { name?: string })?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.startDate && p.endDate
                          ? `${formatDate(p.startDate)} – ${formatDate(p.endDate)}`
                          : p.createdAt
                            ? formatDate(p.createdAt)
                            : '—'}
                        {p.paymentId && (
                          <span className="ml-2 font-mono text-[11px] text-gray-400">· {p.paymentId}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <p className="font-bold text-green-700 sm:text-right">{formatCurrency(p.totalAmount ?? 0)}</p>
                      <button
                        type="button"
                        onClick={() => downloadPaymentHistoryReceipt(p)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"
                      >
                        <span aria-hidden>⬇</span>
                        Download receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContentCard>

        <ContentCard className="stagger-3">
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-accent-100 text-2xl shadow-md">
                ⚖️
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-800">Disputes</h2>
                <p className="text-sm text-gray-600">
                  Raise or track disputes about payments and accounts
                </p>
              </div>
            </div>
            {disputes.length > 0 ? (
              <div className="mb-4 space-y-3">
                {disputes.slice(0, 3).map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white p-4 transition hover:border-brand-200"
                  >
                    <div>
                      <p className="font-semibold text-brand-800">{d.subject}</p>
                      <p className="text-xs text-gray-500">
                        {d.status.replace('_', ' ')} • Raised {formatDate(d.createdAt)}
                      </p>
                      {d.adminNotes && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                          Admin: {d.adminNotes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        d.status === 'resolved' ? 'bg-green-100 text-green-800' : d.status === 'rejected' ? 'bg-red-100 text-red-800' : d.status === 'in_review' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-600">No disputes yet.</p>
            )}
            <Link
              to="/disputes"
              className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline"
            >
              {disputes.length > 0 ? 'View all disputes' : 'Raise a dispute'}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </ContentCard>
      </div>
    </div>
  );
}
