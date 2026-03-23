import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { formatCurrency } from '@shared/formatters';
import { type PaymentReceipt, formatEnrollmentDuration, downloadReceiptFile } from '@/lib/paymentReceipt';

interface Pending {
  _id: string;
  subject?: string;
  totalAmount?: number;
  paymentStatus?: string;
  paymentId?: string;
  enrollmentId?: string;
  studentMongoId?: string;
  studentDisplayId?: string;
  teacherName?: string;
  batchName?: string;
  batchEnrolledCount?: number;
  batchMaxStudents?: number;
  board?: string;
  classLevel?: string;
  duration?: string;
  feePerMonth?: number;
  discount?: number;
  discountCode?: string;
  discountCodeAmount?: number;
  slots?: { day: string; startTime: string; endTime: string }[];
  createdAt?: string;
  updatedAt?: string;
}

type CompleteResponse = { success: boolean; receipt?: PaymentReceipt };

/** Map GET /pending fields to receipt when user opens page after pay */
function buildReceiptFromPending(p: Pending): PaymentReceipt | null {
  if (p.paymentStatus !== 'completed' || !p.paymentId) return null;
  return {
    paymentId: p.paymentId,
    paidAt: p.updatedAt ?? new Date().toISOString(),
    pendingEnrollmentId: p._id,
    enrollmentId: p.enrollmentId,
    studentMongoId: p.studentMongoId,
    studentDisplayId: p.studentDisplayId,
    subject: p.subject,
    teacherName: p.teacherName,
    batchName: p.batchName,
    board: p.board,
    classLevel: p.classLevel,
    duration: p.duration,
    feePerMonth: p.feePerMonth,
    discount: p.discount,
    discountCode: p.discountCode,
    discountCodeAmount: p.discountCodeAmount,
    totalAmount: p.totalAmount,
    slots: p.slots,
  };
}

export default function ParentPayment() {
  const [searchParams] = useSearchParams();
  const pendingId = searchParams.get('pendingId');
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [failing, setFailing] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  /** When false and status failed, show failure hero; when true, show pay form */
  const [showPayForm, setShowPayForm] = useState(true);

  const loadPending = useCallback(async () => {
    if (!pendingId) return;
    const p = await apiJson<Pending>(`/api/parent/pending/${pendingId}`);
    setPending(p);
    if (p.paymentStatus === 'completed' && p.paymentId) {
      setReceipt(buildReceiptFromPending(p));
      setShowPayForm(false);
    } else if (p.paymentStatus === 'failed') {
      setReceipt(null);
      setShowPayForm(false);
    } else {
      setReceipt(null);
      setShowPayForm(true);
    }
  }, [pendingId]);

  useEffect(() => {
    if (!pendingId) {
      setError('Missing pending enrollment. Open checkout from the teacher page again.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    loadPending()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [pendingId, loadPending]);

  const handleComplete = async () => {
    if (!pendingId) return;
    setCompleting(true);
    setError(null);
    try {
      const res = await apiJson<CompleteResponse>('/api/parent/payment/complete', {
        method: 'POST',
        body: JSON.stringify({ pendingId }),
      });
      if (res.receipt) setReceipt(res.receipt);
      setShowPayForm(false);
      await loadPending();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment could not be completed');
    } finally {
      setCompleting(false);
    }
  };

  const handleSimulateFail = async () => {
    if (!pendingId) return;
    setFailing(true);
    setError(null);
    try {
      await apiJson('/api/parent/payment/fail', {
        method: 'POST',
        body: JSON.stringify({ pendingId }),
      });
      setReceipt(null);
      setShowPayForm(false);
      await loadPending();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record failure');
    } finally {
      setFailing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading payment…</p>
      </div>
    );
  }

  if (error && !pending) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center shadow-lg">
        <p className="text-4xl">😕</p>
        <h1 className="mt-4 text-xl font-bold text-red-900">Something went wrong</h1>
        <p className="mt-2 text-red-800">{error}</p>
        <Link
          to="/parent"
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
        Pending enrollment not found.
      </div>
    );
  }

  const isCompleted = pending.paymentStatus === 'completed';
  const isFailed = pending.paymentStatus === 'failed';
  const displayReceipt = receipt ?? (isCompleted ? buildReceiptFromPending(pending) : null);

  if (isCompleted && !displayReceipt) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
        <p className="text-sm text-gray-600">Loading payment confirmation…</p>
      </div>
    );
  }

  /* ——— Success screen ——— */
  if (isCompleted && displayReceipt) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 p-8 shadow-xl sm:p-10">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="relative text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-4xl shadow-lg">
              ✓
            </div>
            <h1 className="mt-6 text-2xl font-bold text-emerald-900 sm:text-3xl">Payment successful</h1>
            <p className="mt-2 text-emerald-800/90">
              Your learner is enrolled for this course. You can open classes and materials from My courses.
            </p>
          </div>

          <div className="relative mt-8 rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-inner">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Receipt summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Payment ID</dt>
                <dd className="font-mono text-xs text-gray-900">{displayReceipt.paymentId}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Paid on</dt>
                <dd className="text-gray-900">{new Date(displayReceipt.paidAt).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Course</dt>
                <dd className="text-right font-medium text-gray-900">{displayReceipt.subject ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Teacher</dt>
                <dd className="text-right text-gray-900">{displayReceipt.teacherName ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Batch</dt>
                <dd className="text-right text-gray-900">
                  <span className="block font-medium">{displayReceipt.batchName ?? '—'}</span>
                  {typeof pending.batchMaxStudents === 'number' && (
                    <span className="mt-0.5 block text-xs font-semibold text-emerald-800">
                      {pending.batchEnrolledCount ?? 0} of {pending.batchMaxStudents} students enrolled
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Plan</dt>
                <dd className="text-right text-gray-900">{formatEnrollmentDuration(displayReceipt.duration)}</dd>
              </div>
              <div className="flex justify-between gap-4 pt-1">
                <dt className="text-lg font-semibold text-gray-800">Total paid</dt>
                <dd className="text-lg font-bold text-emerald-700">{formatCurrency(displayReceipt.totalAmount ?? 0)}</dd>
              </div>
            </dl>
          </div>

          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={() => downloadReceiptFile(displayReceipt)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-300 bg-white px-5 py-3 font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              ⬇ Download receipt
            </button>
            {displayReceipt.studentMongoId && (
              <Link
                to={`/parent/my-course?studentId=${encodeURIComponent(displayReceipt.studentMongoId)}`}
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-amber-600"
              >
                View my courses →
              </Link>
            )}
            <Link
              to="/parent/students"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700"
            >
              My kids
            </Link>
            <Link
              to="/parent/payments"
              className="inline-flex items-center justify-center rounded-xl border-2 border-brand-200 bg-white px-5 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Payments
            </Link>
            <Link
              to="/parent"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ——— Failure screen ——— */
  if (isFailed && !showPayForm) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50 via-white to-orange-50/60 p-8 shadow-xl sm:p-10">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-red-200/40 blur-2xl" />
          <div className="relative text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-600 text-4xl text-white shadow-lg">
              ✕
            </div>
            <h1 className="mt-6 text-2xl font-bold text-red-900 sm:text-3xl">Payment didn’t go through</h1>
            <p className="mt-3 max-w-md mx-auto text-red-800/90">
              No money was charged. Your spot isn’t confirmed yet—retry when you’re ready. If you were testing, use the
              buttons below to try again.
            </p>
          </div>

          <div className="relative mt-8 rounded-2xl border border-red-100 bg-white/95 p-6 text-left shadow-inner">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Attempt details</p>
            <ul className="mt-3 space-y-2 text-gray-800">
              <li>
                <span className="text-gray-500">Course:</span> {pending.subject ?? '—'}
              </li>
              <li>
                <span className="text-gray-500">Teacher:</span> {pending.teacherName ?? '—'}
              </li>
              <li>
                <span className="text-gray-500">Amount:</span> {formatCurrency(pending.totalAmount ?? 0)}
              </li>
              {typeof pending.batchMaxStudents === 'number' && (
                <li>
                  <span className="text-gray-500">Batch seats:</span>{' '}
                  {pending.batchEnrolledCount ?? 0} of {pending.batchMaxStudents} students enrolled
                </li>
              )}
            </ul>
          </div>

          {error && (
            <p className="relative mt-4 rounded-xl bg-red-100 px-4 py-2 text-center text-sm text-red-800">{error}</p>
          )}

          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowPayForm(true);
              }}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              Retry payment
            </button>
            <Link
              to="/parent"
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to dashboard
            </Link>
            <Link
              to="/parent/marketplace"
              className="inline-flex items-center justify-center rounded-xl border-2 border-brand-200 bg-white px-6 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Browse teachers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ——— Pay form (pending or retry after fail) ——— */
  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-brand-800 sm:text-3xl">Complete payment</h1>
      <p className="mb-6 text-gray-600">Review your course and pay securely. In production this step connects to your payment gateway.</p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet-50/50 p-6 shadow-lg sm:p-8">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-200/25 blur-xl" />
        <div className="relative space-y-4">
          <div>
            <p className="text-sm text-gray-500">Course</p>
            <p className="text-lg font-semibold text-brand-900">{pending.subject ?? '—'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Teacher</p>
              <p className="font-medium text-gray-900">{pending.teacherName ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batch</p>
              <p className="font-medium text-gray-900">{pending.batchName ?? '—'}</p>
              {typeof pending.batchMaxStudents === 'number' && (
                <p className="mt-1 text-sm font-semibold text-brand-800">
                  {pending.batchEnrolledCount ?? 0} of {pending.batchMaxStudents} students enrolled
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Class / board</p>
              <p className="font-medium text-gray-900">
                {pending.classLevel ?? '—'} · {pending.board ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium text-gray-900">{formatEnrollmentDuration(pending.duration)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-brand-100 bg-white/80 px-4 py-3">
            <p className="text-sm text-gray-500">Total due</p>
            <p className="text-2xl font-bold text-brand-800">{formatCurrency(pending.totalAmount ?? 0)}</p>
          </div>
        </div>

        <div className="relative mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing || isCompleted}
            className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 py-3.5 text-lg font-semibold text-white shadow-md transition hover:from-brand-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completing ? 'Processing…' : isCompleted ? 'Already paid' : 'Pay now'}
          </button>
          <button
            type="button"
            onClick={handleSimulateFail}
            disabled={failing || isCompleted}
            className="w-full rounded-xl border-2 border-amber-300 bg-amber-50 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {failing ? 'Recording…' : 'Simulate failed payment (testing)'}
          </button>
          <p className="text-center text-xs text-gray-500">
            Use “Simulate failed payment” to preview the failure screen and retry flow—same as a declined card from a
            gateway.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link to="/parent" className="font-medium text-brand-700 hover:underline">
          ← Dashboard
        </Link>
        <Link to="/parent/marketplace" className="font-medium text-brand-700 hover:underline">
          Marketplace
        </Link>
      </div>
    </div>
  );
}
