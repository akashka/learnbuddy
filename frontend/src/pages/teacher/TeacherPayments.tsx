import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, API_BASE } from '@/lib/api';
import { formatCurrency, formatDate } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { Modal } from '@/components/Modal';

interface BankDetails {
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
}

interface PaymentBreakdownItem {
  studentName?: string;
  batchId?: string;
  subject?: string;
  classesCount?: number;
  feePerMonth?: number;
  amount?: number;
}

interface Payment {
  _id: string;
  periodStart?: string;
  periodEnd?: string;
  grossAmount?: number;
  commissionAmount?: number;
  commissionPercent?: number;
  tdsAmount?: number;
  tdsPercent?: number;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  referenceId?: string;
  breakdown?: PaymentBreakdownItem[];
  createdAt?: string;
}

interface Profile {
  bankDetails?: BankDetails;
}

interface DisputeItem {
  _id: string;
  subject: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

function maskAccount(acc?: string): string {
  if (!acc || acc.length < 8) return acc || '—';
  return '••••' + acc.slice(-4);
}

interface PassbookTransaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

interface ProRataEarnings {
  teacherId: string;
  currentMonth: { year: number; month: number };
  commissionPercent: number;
  summary: {
    totalScheduledClasses: number;
    totalCompletedClasses: number;
    calculatedProRataGross: number;
    commissionAmount: number;
    netProRataEarning: number;
  };
  carryOver: number;
  deductions: number;
  payments: number;
  finalEstimatedEarning: number;
  breakdown: any[];
}

interface PaymentRequest {
  _id: string;
  amount: number;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

interface AiSuggestion {
  key: string;
  suggestion: string;
  impact_score: number;
  rationale: string;
  action_item: string;
}

export default function TeacherPayments() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [bankForm, setBankForm] = useState({ accountNumber: '', ifsc: '', bankName: '' });

  const [schedule, setSchedule] = useState<{
    batches: { batchId: string; subject: string; students: { name: string }[]; feePerMonth: number }[];
    nextPaymentMonth?: { year: number; month: number; label: string };
    message?: string;
  } | null>(null);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  
  const [passbook, setPassbook] = useState<PassbookTransaction[]>([]);
  const [proRata, setProRata] = useState<ProRataEarnings | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ amount: '', reason: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      apiJson<Profile>('/api/teacher/profile'),
      apiJson<{ payments: Payment[] }>('/api/teacher/payments'),
      apiJson<{ batches: { batchId: string; subject: string; students: { name: string }[]; feePerMonth: number }[]; nextPaymentMonth?: { year: number; month: number; label: string }; message?: string }>('/api/teacher/payments/schedule').catch(() => null),
      apiJson<{ disputes: DisputeItem[] }>('/api/disputes').catch(() => ({ disputes: [] })),
      apiJson<{ transactions: PassbookTransaction[] }>('/api/teacher/earnings/passbook').catch(() => ({ transactions: [] })),
      apiJson<{ data: ProRataEarnings }>('/api/teacher/earnings/pro-rata').catch(() => ({ data: null })),
      apiJson<{ requests: PaymentRequest[] }>('/api/teacher/payment-requests').catch(() => ({ requests: [] })),
      apiJson<{ data: { suggestions: AiSuggestion[] } }>('/api/teacher/ai-suggestions').catch(() => ({ data: { suggestions: [] } })),
    ])
      .then(([p, pay, sched, disp, pass, prData, reqs, aiData]) => {
        setProfile(p);
        setPayments(pay.payments || []);
        setSchedule(sched ?? null);
        setDisputes(disp?.disputes || []);
        setPassbook(pass?.transactions || []);
        setProRata(prData?.data || null);
        setPaymentRequests(reqs?.requests || []);
        setAiSuggestions(aiData?.data?.suggestions || []);
        
        const b = p.bankDetails;
        setBankForm({
          accountNumber: b?.accountNumber || '',
          ifsc: (b?.ifsc || '').toUpperCase(),
          bankName: b?.bankName || '',
        });
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setError(null);
    try {
      await apiJson('/api/teacher/profile', {
        method: 'PUT',
        body: JSON.stringify({
          bankDetails: {
            accountNumber: bankForm.accountNumber.trim() || undefined,
            ifsc: bankForm.ifsc.trim().toUpperCase() || undefined,
            bankName: bankForm.bankName.trim() || undefined,
          },
        }),
      });
      setEditingBank(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setSavingBank(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/teacher/payments/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guruchakra-payments-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.amount || !requestForm.reason) return;
    
    setRequestSubmitting(true);
    try {
      await apiJson('/api/teacher/payment-requests', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(requestForm.amount),
          reason: requestForm.reason
        })
      });
      setRequestModalOpen(false);
      setRequestForm({ amount: '', reason: '' });
      fetchData(); // Refresh list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request payment');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading payments...</p>
      </div>
    );
  }

  if (error && !profile) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;

  const bank = profile?.bankDetails;
  const hasBank = !!(bank?.accountNumber && bank?.ifsc && bank?.bankName);
  const pendingPayments = payments.filter((p) => p.status === 'pending');

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="💰"
        title="Payments"
        subtitle="Bank details, payment history, and passbook"
      />

      <div className="space-y-6">
        {/* Bank details */}
        <ContentCard className="stagger-1">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 text-2xl shadow-md">
                  🏦
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Bank details</h2>
                  <p className="text-sm text-gray-600">
                    {hasBank ? 'Payments are transferred to this account' : 'Add bank details to receive payments'}
                  </p>
                </div>
              </div>
              {!editingBank && (
                <button
                  type="button"
                  onClick={() => setEditingBank(true)}
                  className="rounded-xl bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-200"
                >
                  {hasBank ? 'Update' : 'Add'}
                </button>
              )}
            </div>

            {editingBank ? (
              <form onSubmit={handleSaveBank} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Account number</label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="Enter account number"
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">IFSC code</label>
                  <input
                    type="text"
                    value={bankForm.ifsc}
                    onChange={(e) => setBankForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SBIN0001234"
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bank name</label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                    placeholder="e.g. State Bank of India"
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{String(error)}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {savingBank ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBank(false);
                      setBankForm({
                        accountNumber: bank?.accountNumber || '',
                        ifsc: (bank?.ifsc || '').toUpperCase(),
                        bankName: bank?.bankName || '',
                      });
                    }}
                    className="rounded-xl border-2 border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border-2 border-brand-100 bg-gradient-to-br from-white to-brand-50/30 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account</p>
                    <p className="mt-1 font-mono font-medium text-brand-800">
                      {hasBank ? maskAccount(bank?.accountNumber) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">IFSC</p>
                    <p className="mt-1 font-mono font-medium text-brand-800">{bank?.ifsc || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Bank</p>
                    <p className="mt-1 font-medium text-brand-800">{bank?.bankName || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ContentCard>

        {/* Payment schedule - batches and next payment month */}
        {schedule && schedule.batches && schedule.batches.length > 0 && (
          <ContentCard className="stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-2xl shadow-md">
                  📆
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Payment schedule</h2>
                  <p className="text-sm text-gray-600">
                    {schedule.nextPaymentMonth?.label
                      ? `Next payment period: ${schedule.nextPaymentMonth.label}`
                      : schedule.message ?? 'Based on completed classes each month'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {schedule.batches.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-xl border-2 border-sky-100 bg-sky-50/50 p-4"
                  >
                    <p className="font-semibold text-brand-800">
                      {b.subject} – Batch {b.batchId}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {b.students.map((s) => s.name).join(', ')} • {formatCurrency(b.feePerMonth)}/mo
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ContentCard>
        )}

        {/* Next payment schedule */}
        {pendingPayments.length > 0 && (
          <ContentCard className="stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-accent-100 text-2xl shadow-md">
                  📅
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Upcoming payments</h2>
                  <p className="text-sm text-gray-600">Pending payments scheduled for transfer</p>
                </div>
              </div>
              <div className="space-y-3">
                {pendingPayments.slice(0, 5).map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between rounded-xl border-2 border-amber-100 bg-amber-50/50 p-4 transition hover:border-amber-200"
                  >
                    <div>
                      <p className="font-semibold text-brand-800">
                        {p.periodStart && p.periodEnd
                          ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
                          : 'Payment'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Net: {formatCurrency(p.amount)} • Status: Pending
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewPayment(p)}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
                    >
                      View details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ContentCard>
        )}

        {/* Pro-Rata Monthly Earnings */}
        {proRata && (
          <ContentCard className="stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 text-2xl shadow-md">
                    📊
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-brand-800">Current Month Earnings</h2>
                    <p className="text-sm text-gray-600">Estimated pro-rata earnings for {proRata.currentMonth.month}/{proRata.currentMonth.year}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(true)}
                  className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200"
                >
                  Emergency Request
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-brand-100 p-4">
                  <p className="text-sm text-gray-500">Classes</p>
                  <p className="mt-1 text-2xl font-bold text-brand-800">{proRata.summary.totalCompletedClasses} / {proRata.summary.totalScheduledClasses}</p>
                </div>
                <div className="rounded-xl border border-brand-100 p-4">
                  <p className="text-sm text-gray-500">Commission Rate</p>
                  <p className="mt-1 text-2xl font-bold text-brand-800">{proRata.commissionPercent}%</p>
                </div>
                <div className="rounded-xl border border-brand-100 p-4">
                  <p className="text-sm text-gray-500">Pro-Rata Base</p>
                  <p className="mt-1 text-2xl font-bold text-brand-800">₹{proRata.summary.netProRataEarning.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50/30 p-4">
                  <p className="text-sm font-medium text-emerald-800">Final Est. Earnings</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">₹{proRata.finalEstimatedEarning.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-emerald-600">Includes carry-overs & deductions</p>
                </div>
              </div>
            </div>
          </ContentCard>
        )}

        {/* Emergency Payout Requests */}
        {paymentRequests.length > 0 && (
          <ContentCard className="stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-2xl shadow-md">
                  🆘
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Emergency Requests</h2>
                  <p className="text-sm text-gray-600">Your recent payout requests</p>
                </div>
              </div>
              <div className="space-y-3">
                {paymentRequests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between rounded-xl border border-brand-100 p-4">
                    <div>
                      <p className="font-semibold text-brand-800">₹{req.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{req.reason}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${req.status === 'accepted' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {req.status.toUpperCase()}
                      </span>
                      {req.adminNotes && <p className="mt-2 text-xs text-gray-500 text-right">Note: {req.adminNotes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ContentCard>
        )}

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <ContentCard className="stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 text-2xl shadow-md">
                  ✨
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">AI Income Insights</h2>
                  <p className="text-sm text-gray-600">Strategic suggestions from GuruChakra AI to maximize your earnings</p>
                </div>
              </div>
              <div className="space-y-4">
                {aiSuggestions.map((sugo, i) => (
                  <div key={i} className="rounded-xl border border-purple-100 bg-purple-50/30 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-purple-900">{sugo.suggestion}</h3>
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 flex items-center gap-1 py-0.5 text-xs font-medium text-purple-700">
                        Impact: {sugo.impact_score}/10
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-purple-800/80">{sugo.rationale}</p>
                    <div className="mt-3 inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-medium text-purple-700 shadow-sm border border-purple-100">
                      🎯 Action: {sugo.action_item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ContentCard>
        )}

        {/* Passbook / Payment history */}
        <ContentCard className="stagger-3">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-brand-100 text-2xl shadow-md">
                  📒
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Passbook</h2>
                  <p className="text-sm text-gray-600">All your payment transactions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || payments.length === 0}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/30 py-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="mt-2 font-medium text-brand-700">No payments yet</p>
                <p className="mt-1 text-sm text-gray-600">
                  Payments will appear here once your classes are completed and processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {passbook.length > 0 ? (
                  passbook.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white p-4 transition hover:border-brand-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                            tx.type === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : tx.type === 'deduction'
                                ? 'bg-red-100 text-red-700'
                                : tx.type === 'payment'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.type === 'credit' ? 'C' : tx.type === 'deduction' ? 'D' : tx.type === 'payment' ? 'P' : 'R'}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-800">
                            {tx.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'deduction' || tx.type === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.type === 'deduction' || tx.type === 'payment' ? '-' : '+'}₹{tx.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 uppercase">{tx.type}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  payments.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white p-4 transition hover:border-brand-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                            p.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {p.status === 'paid' ? '✓' : p.status === 'pending' ? '⏳' : '✕'}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-800">
                            {p.periodStart && p.periodEnd
                              ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
                              : 'Payment'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(p.amount)} • {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            {p.paidAt && ` • Paid ${formatDate(p.paidAt)}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewPayment(p)}
                        className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-200"
                      >
                        Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ContentCard>

        {/* Disputes */}
        <ContentCard className="stagger-4">
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

        {/* How it works */}
        <ContentCard className="stagger-5" decorative={false}>
          <div className="p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-brand-800">How payments work</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex-1 rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 p-4">
                <p className="mb-2 font-semibold text-brand-800">1. Customer pays</p>
                <p className="text-sm text-gray-600">
                  Parents pay for 3, 6, or 12 months upfront. Example: ₹2,000/month × 3 = ₹6,000.
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-gradient-to-br from-amber-50 to-accent-50 p-4">
                <p className="mb-2 font-semibold text-brand-800">2. Monthly deductions</p>
                <p className="text-sm text-gray-600">
                  Each month we deduct commission (e.g. 10%) and TDS (e.g. 10%) from your fee.
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4">
                <p className="mb-2 font-semibold text-brand-800">3. Transfer to you</p>
                <p className="text-sm text-gray-600">
                  Net amount (e.g. ₹2,000 − ₹200 − ₹100 = ₹1,700) is transferred to your bank.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              <Link to="/teacher/profile" className="font-medium text-brand-600 hover:underline">
                Update profile
              </Link>
            </p>
          </div>
        </ContentCard>
      </div>

      {/* Payment detail modal */}
      {viewPayment && (
        <Modal isOpen onClose={() => setViewPayment(null)} maxWidth="max-w-lg">
          <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
            <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50 to-violet-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-800">Payment details</h3>
                <button
                  type="button"
                  onClick={() => setViewPayment(null)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-brand-100 hover:text-brand-700"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {viewPayment.periodStart && viewPayment.periodEnd
                  ? `${formatDate(viewPayment.periodStart)} – ${formatDate(viewPayment.periodEnd)}`
                  : ''}
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross amount</span>
                    <span className="font-semibold">{formatCurrency(viewPayment.grossAmount ?? viewPayment.amount)}</span>
                  </div>
                  {viewPayment.commissionAmount != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commission ({viewPayment.commissionPercent ?? 10}%)</span>
                      <span className="text-red-600">−{formatCurrency(viewPayment.commissionAmount)}</span>
                    </div>
                  )}
                  {viewPayment.tdsAmount != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TDS ({viewPayment.tdsPercent ?? 10}%)</span>
                      <span className="text-red-600">−{formatCurrency(viewPayment.tdsAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-semibold text-brand-800">Net amount</span>
                    <span className="font-bold text-green-700">{formatCurrency(viewPayment.amount)}</span>
                  </div>
                </div>
              </div>
              {viewPayment.breakdown && viewPayment.breakdown.length > 0 && (
                <div>
                  <p className="mb-2 font-semibold text-brand-800">Breakdown by student</p>
                  <ul className="space-y-2">
                    {viewPayment.breakdown.map((b, i) => (
                      <li
                        key={i}
                        className="flex justify-between rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm"
                      >
                        <span>{b.studentName} • {b.subject}</span>
                        <span className="font-medium">{formatCurrency(b.amount || 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {viewPayment.referenceId && (
                <p className="text-xs text-gray-500">Ref: {viewPayment.referenceId}</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Emergency Request Modal */}
      {requestModalOpen && (
        <Modal isOpen onClose={() => setRequestModalOpen(false)} maxWidth="max-w-md">
          <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
            <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
              <h3 className="text-lg font-bold text-brand-800">Emergency Payment Request</h3>
            </div>
            <form onSubmit={handleRequestPayment} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={proRata?.finalEstimatedEarning || 100000}
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                {proRata && (
                  <p className="mt-1 text-xs text-brand-600">Available pro-rata base: ₹{proRata.finalEstimatedEarning.toFixed(2)}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Please describe why you need an emergency payout"
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={requestSubmitting || !requestForm.amount || !requestForm.reason}
                  className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {requestSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

    </div>
  );
}
