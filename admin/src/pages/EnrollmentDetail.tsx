import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import BackLink from '@/components/BackLink';
import { formatCurrency, formatDateTime } from '@shared/formatters';

type PendingEnrollment = {
  _id: string;
  parentId?: { _id?: string; name?: string; phone?: string; email?: string };
  teacherId?: { _id?: string; name?: string; batches?: unknown[] };
  batchIndex?: number;
  subject?: string;
  board?: string;
  classLevel?: string;
  slots?: { day: string; startTime: string; endTime: string }[];
  feePerMonth?: number;
  duration?: string;
  discount?: number;
  totalAmount?: number;
  paymentStatus?: string;
  studentDetails?: { name?: string; classLevel?: string; schoolName?: string; photoUrl?: string; idProofUrl?: string; aiVerified?: boolean };
  termsAccepted?: boolean;
  teacherChangeCount?: number;
  convertedToEnrollmentId?: string;
  createdAt?: string;
};

type CompletedEnrollment = {
  _id: string;
  studentId?: { _id?: string; name?: string; studentId?: string; classLevel?: string; schoolName?: string; board?: string };
  teacherId?: { _id?: string; name?: string; phone?: string };
  batchId?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  slots?: { day: string; startTime: string; endTime: string }[];
  feePerMonth?: number;
  duration?: string;
  discount?: number;
  totalAmount?: number;
  paymentStatus?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
};

function getId(ref: { _id?: string } | string | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return ref;
  return ref._id;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="w-40 shrink-0 font-medium text-accent-700">{label}:</span>
      <span className="text-accent-800">{value ?? '-'}</span>
    </div>
  );
}

export default function EnrollmentDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PendingEnrollment | CompletedEnrollment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(() => {
    if (!type || !id) return;
    setLoading(true);
    setError(null);
    const fetcher = type === 'pending' ? adminApi.enrollments.getPending : adminApi.enrollments.getCompleted;
    fetcher(id)
      .then((d) => setData(d as PendingEnrollment | CompletedEnrollment))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [type, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateLink = async () => {
    if (type !== 'pending' || !id) return;
    setActionLoading(true);
    try {
      const res = await adminApi.enrollmentsManage({ action: 'generate_payment_link', pendingId: id }) as { paymentLink: string };
      navigator.clipboard.writeText(res.paymentLink);
      toast.success('Payment link copied to clipboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (type !== 'pending' || !id) return;
    if (!confirm('Complete this pending enrollment? This will create the student (if needed) and enrollment.')) return;
    setActionLoading(true);
    try {
      await adminApi.enrollmentsManage({ action: 'complete_from_pending', pendingId: id });
      toast.success('Enrollment completed');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || '/enrollments?section=completed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!type || !id) {
    return (
      <div className="p-8">
        <p className="text-accent-600">Invalid enrollment</p>
      </div>
    );
  }

  const isPending = type === 'pending';
  const pending = isPending ? (data as PendingEnrollment) : null;
  const completed = !isPending ? (data as CompletedEnrollment) : null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <BackLink to="/enrollments" label={`Back to Enrollments`} />
      </div>

      <h1 className="mb-6 text-2xl font-bold text-accent-800">
        {isPending ? 'Pending Enrollment' : 'Enrollment'} Detail
      </h1>

      <DataState loading={loading} error={error} onRetry={fetchData}>
        {data && (
          <div className="space-y-8">
            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Details</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {isPending && pending && (
                  <>
                    <DetailRow label="Parent" value={
                      getId(pending.parentId) ? (
                        <Link to={`/parents/${getId(pending.parentId)}`} className="text-accent-600 hover:underline">
                          {(pending.parentId as { name?: string })?.name}
                        </Link>
                      ) : (pending.parentId as { name?: string })?.name
                    } />
                    <DetailRow label="Parent Phone" value={(pending.parentId as { phone?: string })?.phone} />
                    <DetailRow label="Teacher" value={
                      getId(pending.teacherId) ? (
                        <Link to={`/teachers/${getId(pending.teacherId)}`} className="text-accent-600 hover:underline">
                          {(pending.teacherId as { name?: string })?.name}
                        </Link>
                      ) : (pending.teacherId as { name?: string })?.name
                    } />
                    <DetailRow label="Subject" value={pending.subject} />
                    <DetailRow label="Board" value={pending.board} />
                    <DetailRow label="Class" value={pending.classLevel} />
                    <DetailRow label="Batch Index" value={pending.batchIndex} />
                    <DetailRow label="Fee/Month" value={pending.feePerMonth != null ? formatCurrency(pending.feePerMonth) : undefined} />
                    <DetailRow label="Duration" value={pending.duration} />
                    <DetailRow label="Discount" value={pending.discount != null ? `${pending.discount}%` : undefined} />
                    <DetailRow label="Total Amount" value={pending.totalAmount != null ? formatCurrency(pending.totalAmount) : undefined} />
                    <DetailRow label="Payment Status" value={pending.paymentStatus} />
                    <DetailRow label="Created" value={pending.createdAt ? formatDateTime(pending.createdAt) : undefined} />
                    {pending.studentDetails && (
                      <>
                        <DetailRow label="Student Name" value={pending.studentDetails.name} />
                        <DetailRow label="Student Class" value={pending.studentDetails.classLevel} />
                        <DetailRow label="School" value={pending.studentDetails.schoolName} />
                      </>
                    )}
                    {pending.slots && pending.slots.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium text-accent-700">Slots:</span>
                        <ul className="mt-1 list-inside list-disc text-accent-800">
                          {pending.slots.map((s, i) => (
                            <li key={i}>{s.day} {s.startTime}-{s.endTime}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {!isPending && completed && (
                  <>
                    <DetailRow label="Student" value={
                      getId(completed.studentId) ? (
                        <a href={`/students/${getId(completed.studentId)}`} className="text-accent-600 hover:underline">
                          {(completed.studentId as { name?: string })?.name}
                        </a>
                      ) : (completed.studentId as { name?: string })?.name
                    } />
                    <DetailRow label="Teacher" value={
                      getId(completed.teacherId) ? (
                        <Link to={`/teachers/${getId(completed.teacherId)}`} className="text-accent-600 hover:underline">
                          {(completed.teacherId as { name?: string })?.name}
                        </Link>
                      ) : (completed.teacherId as { name?: string })?.name
                    } />
                    <DetailRow label="Subject" value={completed.subject} />
                    <DetailRow label="Board" value={completed.board} />
                    <DetailRow label="Class" value={completed.classLevel} />
                    <DetailRow label="Batch" value={completed.batchId} />
                    <DetailRow label="Fee/Month" value={completed.feePerMonth != null ? formatCurrency(completed.feePerMonth) : undefined} />
                    <DetailRow label="Duration" value={completed.duration} />
                    <DetailRow label="Discount" value={completed.discount != null ? `${completed.discount}%` : undefined} />
                    <DetailRow label="Total Amount" value={completed.totalAmount != null ? formatCurrency(completed.totalAmount) : undefined} />
                    <DetailRow label="Payment Status" value={completed.paymentStatus} />
                    <DetailRow label="Status" value={completed.status} />
                    <DetailRow label="Start Date" value={completed.startDate ? new Date(completed.startDate).toLocaleDateString() : undefined} />
                    <DetailRow label="End Date" value={completed.endDate ? new Date(completed.endDate).toLocaleDateString() : undefined} />
                    <DetailRow label="Created" value={completed.createdAt ? formatDateTime(completed.createdAt) : undefined} />
                    {completed.slots && completed.slots.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium text-accent-700">Slots:</span>
                        <ul className="mt-1 list-inside list-disc text-accent-800">
                          {completed.slots.map((s, i) => (
                            <li key={i}>{s.day} {s.startTime}-{s.endTime}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {isPending && (
              <section className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={actionLoading}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50 disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'Generate Payment Link'}
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'Complete Enrollment'}
                </button>
              </section>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
