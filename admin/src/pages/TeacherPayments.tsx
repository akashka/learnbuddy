import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { ExportButton } from '@/components/ExportButton';
import { formatCurrency, formatDateTime } from '@shared/formatters';
import Disputes from '@/pages/Disputes';

type Teacher = { _id: string; name?: string };
type BreakdownItem = { studentId: string; studentName: string; batchId: string; subject: string; classesCount: number; feePerMonth: number; amount: number };
type CalcResult = {
  teacherId: string;
  teacherName: string;
  periodStart: string;
  periodEnd: string;
  year: number;
  month: number;
  breakdown: BreakdownItem[];
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  netAmount: number;
  totalClasses: number;
};
type Payment = {
  _id: string;
  teacherId: { _id: string; name?: string };
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  paidAt?: string;
  grossAmount?: number;
  commissionAmount?: number;
  commissionPercent?: number;
  tdsAmount?: number;
  tdsPercent?: number;
  breakdown?: BreakdownItem[];
  createdAt: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TeacherPayments() {
  const toast = useToast();
  const [tab, setTab] = useState<'make' | 'history' | 'reminders' | 'disputes' | 'requests'>('make');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ payments: Payment[]; total: number; page: number; totalPages: number } | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTeacherId, setHistoryTeacherId] = useState('');
  const [historyYear, setHistoryYear] = useState('');
  const [historyMonth, setHistoryMonth] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');

  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reminders, setReminders] = useState<{ teacherId: string; teacherName: string; year: number; month: number }[]>([]);

  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requests, setRequests] = useState<{ requests: { _id: string; teacherId: { _id: string; name: string }; amount: number; reason: string; status: string; adminNotes?: string; createdAt: string }[]; pagination: { total: number; page: number; totalPages: number } } | null>(null);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsStatus, setRequestsStatus] = useState('pending');

  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    adminApi.teachers.list({ limit: 500 }).then((r) => setTeachers((r as { teachers: Teacher[] }).teachers));
  }, []);

  const teacherIds = teachers.map((t) => t._id);
  useAutoSelectSingleOption(teacherId, setTeacherId, teacherIds);
  useAutoSelectSingleOption(historyTeacherId, setHistoryTeacherId, teacherIds, (v) => v === '');

  useEffect(() => {
    if (tab !== 'history') return;
    setHistoryLoading(true);
    adminApi.teacherPayments
      .list({
        teacherId: historyTeacherId || undefined,
        year: historyYear || undefined,
        month: historyMonth || undefined,
        status: historyStatus || undefined,
        page: historyPage,
        limit: 20,
      })
      .then((d) => setHistory(d as { payments: Payment[]; total: number; page: number; totalPages: number }))
      .catch((e) => setHistoryError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setHistoryLoading(false));
  }, [tab, historyPage, historyTeacherId, historyYear, historyMonth, historyStatus]);

  useEffect(() => {
    if (!receiptId) {
      setReceipt(null);
      return;
    }
    adminApi.teacherPayments.get(receiptId).then((p) => setReceipt(p as Payment)).catch(() => setReceipt(null));
  }, [receiptId]);

  useEffect(() => {
    if (tab !== 'reminders') return;
    setRemindersLoading(true);
    adminApi.teacherPayments
      .reminders()
      .then((r) => setReminders(r.reminders ?? []))
      .catch(() => setReminders([]))
      .finally(() => setRemindersLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'requests') return;
    setRequestsLoading(true);
    adminApi.paymentRequests
      .list({ status: requestsStatus || undefined, page: requestsPage, limit: 20 })
      .then((d) => setRequests(d as any))
      .catch(() => setRequests(null))
      .finally(() => setRequestsLoading(false));
  }, [tab, requestsPage, requestsStatus]);

  const handleResolveRequest = (id: string, status: 'accepted' | 'rejected') => {
    const notes = prompt(`Enter optional admin notes for ${status}ing this request:`, '');
    if (notes === null) return; // User cancelled prompt
    
    adminApi.paymentRequests.resolve(id, { status, adminNotes: notes })
      .then(() => {
        toast.success(`Request ${status} successfully`);
        // Refresh requests log
        setRequestsLoading(true);
        adminApi.paymentRequests.list({ status: requestsStatus || undefined, page: requestsPage, limit: 20 })
          .then((d) => setRequests(d as any))
          .finally(() => setRequestsLoading(false));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : `Failed to ${status} request`));
  };

  const handleCalculate = () => {
    if (!teacherId) return;
    setCalcError(null);
    setCalcLoading(true);
    adminApi.teacherPayments
      .calculate({ teacherId, year, month })
      .then((r) => setCalcResult(r as CalcResult))
      .catch((e) => {
        setCalcError(e instanceof Error ? e.message : 'Failed to calculate');
        setCalcResult(null);
      })
      .finally(() => setCalcLoading(false));
  };

  const handleProcessPayment = () => {
    if (!calcResult) return;
    setPayError(null);
    setPayLoading(true);
    adminApi.teacherPayments
      .create({
        teacherId: calcResult.teacherId,
        amount: calcResult.netAmount,
        periodStart: calcResult.periodStart,
        periodEnd: calcResult.periodEnd,
        grossAmount: calcResult.grossAmount,
        commissionAmount: calcResult.commissionAmount,
        commissionPercent: calcResult.commissionPercent,
        tdsAmount: calcResult.tdsAmount,
        tdsPercent: calcResult.tdsPercent,
        breakdown: calcResult.breakdown,
      })
      .then(() => {
        setCalcResult(null);
        setTab('history');
        setHistoryPage(1);
        toast.success('Payment processed successfully');
        setHistoryLoading(true);
        adminApi.teacherPayments.list({ page: 1, limit: 20 }).then((d) => setHistory(d as { payments: Payment[]; total: number; page: number; totalPages: number })).finally(() => setHistoryLoading(false));
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to process';
        setPayError(msg);
        toast.error(msg);
      })
      .finally(() => setPayLoading(false));
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Teacher Payments</h1>
      <p className="mb-6 text-sm text-accent-700">
        Calculate and process payments to teachers based on completed classes. Deductions: platform commission (per teacher) and TDS (10%).
      </p>

      <div className="mb-6 flex gap-2 border-b border-accent-200">
        <button
          type="button"
          onClick={() => setTab('make')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'make' ? 'border-accent-600 text-accent-800' : 'border-transparent text-accent-600 hover:text-accent-800'}`}
        >
          Make Payment
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'history' ? 'border-accent-600 text-accent-800' : 'border-transparent text-accent-600 hover:text-accent-800'}`}
        >
          Payment History
        </button>
        <button
          type="button"
          onClick={() => setTab('reminders')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'reminders' ? 'border-accent-600 text-accent-800' : 'border-transparent text-accent-600 hover:text-accent-800'}`}
        >
          Reminders
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'requests' ? 'border-accent-600 text-accent-800' : 'border-transparent text-accent-600 hover:text-accent-800'}`}
        >
          Requests
        </button>
        <button
          type="button"
          onClick={() => setTab('disputes')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'disputes' ? 'border-accent-600 text-accent-800' : 'border-transparent text-accent-600 hover:text-accent-800'}`}
        >
          Disputes
        </button>
      </div>

      {tab === 'make' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-accent-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Calculate Payment</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="rounded-lg border border-accent-200 px-3 py-2 min-w-[200px]"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.name ?? t._id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Month</label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="rounded-lg border border-accent-200 px-3 py-2">
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Year</label>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="rounded-lg border border-accent-200 px-3 py-2">
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={!teacherId || calcLoading}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {calcLoading ? 'Calculating...' : 'Calculate'}
                </button>
              </div>
            </div>
            {calcError && <p className="mt-2 text-sm text-red-600">{calcError}</p>}
          </div>

          {calcResult && (
            <div className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Payment Summary – {calcResult.teacherName} ({MONTHS[calcResult.month - 1]} {calcResult.year})</h2>

              <div className="mb-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Batch</th>
                      <th className="px-4 py-2 text-left">Subject</th>
                      <th className="px-4 py-2 text-right">Classes</th>
                      <th className="px-4 py-2 text-right">Fee/mo</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcResult.breakdown.map((b, i) => (
                      <tr key={i} className="border-t border-accent-100">
                        <td className="px-4 py-2">{b.studentName}</td>
                        <td className="px-4 py-2">{b.batchId}</td>
                        <td className="px-4 py-2">{b.subject}</td>
                        <td className="px-4 py-2 text-right">{b.classesCount}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(b.feePerMonth)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(b.amount, 2)}</td>
                      </tr>
                    ))}
                    {calcResult.breakdown.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No completed classes in this period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-accent-200 pt-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Gross earnings</span>
                    <span>₹{calcResult.grossAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Platform commission ({calcResult.commissionPercent}%)</span>
                    <span>- {formatCurrency(calcResult.commissionAmount, 2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>TDS ({calcResult.tdsPercent}%)</span>
                    <span>- {formatCurrency(calcResult.tdsAmount, 2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-accent-200 pt-2 font-semibold">
                    <span>Net amount to pay</span>
                    <span>{formatCurrency(calcResult.netAmount, 2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={payLoading || calcResult.netAmount <= 0}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {payLoading ? 'Processing...' : 'Process Payment'}
                </button>
                <button type="button" onClick={() => setCalcResult(null)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">
                  Clear
                </button>
              </div>
              {payError && <p className="mt-2 text-sm text-red-600">{payError}</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'reminders' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-accent-800">Payment reminders</h2>
            <p className="text-sm text-accent-700">
              Teachers who had completed classes in the current or previous month but have not received payment yet.
            </p>
          </div>
          <DataState loading={remindersLoading} error={null}>
            {reminders.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Teacher</th>
                      <th className="px-4 py-2 text-left">Period</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((r, i) => (
                      <tr key={i} className="border-t border-accent-100">
                        <td className="px-4 py-2">
                          <Link to={`/teachers/${r.teacherId}`} className="text-accent-600 hover:underline">
                            {r.teacherName}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          {MONTHS[r.month - 1]} {r.year}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={async () => {
                              setTeacherId(r.teacherId);
                              setYear(r.year);
                              setMonth(r.month);
                              setTab('make');
                              setCalcError(null);
                              setCalcLoading(true);
                              try {
                                const res = await adminApi.teacherPayments.calculate({
                                  teacherId: r.teacherId,
                                  year: r.year,
                                  month: r.month,
                                });
                                setCalcResult(res as CalcResult);
                              } catch (e) {
                                setCalcError(e instanceof Error ? e.message : 'Failed to calculate');
                                setCalcResult(null);
                              } finally {
                                setCalcLoading(false);
                              }
                            }}
                            className="rounded-lg bg-accent-600 px-3 py-1 text-sm text-white hover:bg-accent-700"
                          >
                            Calculate & pay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-accent-600">No pending payment reminders.</p>
            )}
          </DataState>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-accent-600">Status</label>
              <select value={requestsStatus} onChange={(e) => { setRequestsStatus(e.target.value); setRequestsPage(1); }} className="rounded-lg border border-accent-200 px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <DataState loading={requestsLoading} error={null}>
            {requests && (
              <>
                <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Teacher</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Reason</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Notes</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.requests.map((r) => (
                        <tr key={r._id} className="border-t border-accent-100">
                          <td className="px-4 py-2">
                            <Link to={`/teachers/${r.teacherId._id}`} className="text-accent-600 hover:underline">
                              {r.teacherId.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">₹{r.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 max-w-sm truncate" title={r.reason}>{r.reason}</td>
                          <td className="px-4 py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded px-2 py-0.5 ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs">{r.adminNotes || '-'}</td>
                          <td className="px-4 py-2">
                            {r.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResolveRequest(r._id, 'accepted')}
                                  className="rounded text-green-600 hover:underline"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveRequest(r._id, 'rejected')}
                                  className="rounded text-red-600 hover:underline"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {r.status === 'accepted' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTeacherId(r.teacherId._id);
                                  setYear(new Date().getFullYear());
                                  setMonth(new Date().getMonth() + 1);
                                  setTab('make');
                                }}
                                className="rounded text-accent-600 hover:underline"
                              >
                                Make Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {requests.requests.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No payment requests</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {requests.pagination.totalPages > 1 && (
                  <div className="mt-4 flex gap-2">
                    <button disabled={requestsPage <= 1} onClick={() => setRequestsPage((p) => p - 1)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                    >Previous</button>
                    <span className="py-2 text-sm">Page {requestsPage} of {requests.pagination.totalPages} ({requests.pagination.total} total)</span>
                    <button disabled={requestsPage >= requests.pagination.totalPages} onClick={() => setRequestsPage((p) => p + 1)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                    >Next</button>
                  </div>
                )}
              </>
            )}
          </DataState>
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-4">
          <Disputes embedded />
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-accent-600">Teacher</label>
              <select value={historyTeacherId} onChange={(e) => { setHistoryTeacherId(e.target.value); setHistoryPage(1); }} className="rounded-lg border border-accent-200 px-3 py-2 text-sm">
                <option value="">All</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name ?? t._id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-accent-600">Year</label>
              <select value={historyYear} onChange={(e) => { setHistoryYear(e.target.value); setHistoryPage(1); }} className="rounded-lg border border-accent-200 px-3 py-2 text-sm">
                <option value="">All</option>
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-accent-600">Month</label>
              <select value={historyMonth} onChange={(e) => { setHistoryMonth(e.target.value); setHistoryPage(1); }} className="rounded-lg border border-accent-200 px-3 py-2 text-sm">
                <option value="">All</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-accent-600">Status</label>
              <select value={historyStatus} onChange={(e) => { setHistoryStatus(e.target.value); setHistoryPage(1); }} className="rounded-lg border border-accent-200 px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <ExportButton
              entity="teacher-payments"
              fields={[
                { key: 'teacherName', label: 'Teacher' },
                { key: 'periodStart', label: 'Period Start' },
                { key: 'periodEnd', label: 'Period End' },
                { key: 'grossAmount', label: 'Gross' },
                { key: 'commissionAmount', label: 'Commission' },
                { key: 'netAmount', label: 'Net' },
                { key: 'status', label: 'Status' },
                { key: 'paidAt', label: 'Paid At' },
                { key: 'createdAt', label: 'Created' },
              ]}
              params={{
                ...(historyTeacherId && { teacherId: historyTeacherId }),
                ...(historyYear && { year: historyYear }),
                ...(historyMonth && { month: historyMonth }),
                ...(historyStatus && { status: historyStatus }),
              }}
            />
          </div>

          <DataState loading={historyLoading} error={historyError}>
            {history && (
              <>
                <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Teacher</th>
                        <th className="px-4 py-2 text-left">Period</th>
                        <th className="px-4 py-2 text-right">Gross</th>
                        <th className="px-4 py-2 text-right">Deductions</th>
                        <th className="px-4 py-2 text-right">Net</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Paid</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.payments.map((p) => (
                        <tr key={p._id} className="border-t border-accent-100">
                          <td className="px-4 py-2">
                            <Link to={`/teachers/${(p.teacherId as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                              {(p.teacherId as { name?: string })?.name ?? '-'}
                            </Link>
                          </td>
                          <td className="px-4 py-2">
                            {p.periodStart ? new Date(p.periodStart).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'} – {p.periodEnd ? new Date(p.periodEnd).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right">₹{(p.grossAmount ?? p.amount).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">
                            {p.commissionAmount != null && p.tdsAmount != null ? formatCurrency(p.commissionAmount + p.tdsAmount, 2) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">₹{p.amount.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded px-2 py-0.5 ${p.status === 'paid' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">{p.paidAt ? formatDateTime(p.paidAt) : '-'}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => setReceiptId(p._id)}
                              className="text-accent-600 hover:underline"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                      {history.payments.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No payments yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {history.totalPages > 1 && (
                  <div className="mt-4 flex gap-2">
                    <button disabled={historyPage <= 1} onClick={() => setHistoryPage((p) => p - 1)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                    >Previous</button>
                    <span className="py-2 text-sm">Page {historyPage} of {history.totalPages} ({history.total} total)</span>
                    <button disabled={historyPage >= history.totalPages} onClick={() => setHistoryPage((p) => p + 1)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                    >Next</button>
                  </div>
                )}
              </>
            )}
          </DataState>
        </div>
      )}

      {receiptId && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReceiptId(null)}>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-accent-800">Payment Receipt</h2>
              <button type="button" onClick={() => window.print()} className="rounded-lg border border-accent-200 px-3 py-1 text-sm hover:bg-accent-50">
                Print
              </button>
            </div>
            <div className="space-y-4 print:block">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Teacher:</strong> {(receipt.teacherId as { name?: string })?.name ?? '-'}</p>
                <p><strong>Period:</strong> {new Date(receipt.periodStart).toLocaleDateString()} – {new Date(receipt.periodEnd).toLocaleDateString()}</p>
                <p><strong>Paid at:</strong> {receipt.paidAt ? formatDateTime(receipt.paidAt) : '-'}</p>
                <p><strong>Status:</strong> {receipt.status}</p>
              </div>

              {receipt.breakdown && receipt.breakdown.length > 0 && (
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Batch</th>
                      <th className="px-4 py-2 text-left">Subject</th>
                      <th className="px-4 py-2 text-right">Classes</th>
                      <th className="px-4 py-2 text-right">Fee/mo</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.breakdown.map((b, i) => (
                      <tr key={i} className="border-t border-accent-100">
                        <td className="px-4 py-2">{b.studentName}</td>
                        <td className="px-4 py-2">{b.batchId}</td>
                        <td className="px-4 py-2">{b.subject}</td>
                        <td className="px-4 py-2 text-right">{b.classesCount}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(b.feePerMonth)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(b.amount, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="border-t border-accent-200 pt-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Gross earnings</span>
                    <span>{formatCurrency(receipt.grossAmount ?? receipt.amount, 2)}</span>
                  </div>
                  {receipt.commissionAmount != null && (
                    <div className="flex justify-between text-amber-700">
                      <span>Platform commission ({receipt.commissionPercent ?? 0}%)</span>
                      <span>- {formatCurrency(receipt.commissionAmount, 2)}</span>
                    </div>
                  )}
                  {receipt.tdsAmount != null && (
                    <div className="flex justify-between text-amber-700">
                      <span>TDS ({receipt.tdsPercent ?? 0}%)</span>
                      <span>- ₹{receipt.tdsAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-accent-200 pt-2 font-semibold">
                    <span>Net amount paid</span>
                    <span>{formatCurrency(receipt.amount, 2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button type="button" onClick={() => setReceiptId(null)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
