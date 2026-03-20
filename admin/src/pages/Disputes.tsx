import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { formatDateTime } from '@shared/formatters';

type Dispute = {
  _id: string;
  raisedBy: 'parent' | 'teacher';
  referenceType: string;
  referenceId?: string;
  subject: string;
  description: string;
  status: string;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId?: { email?: string };
};

const STATUS_OPTIONS = ['open', 'in_review', 'resolved', 'rejected'] as const;
const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800',
};
const RAISED_BY_LABELS: Record<string, string> = {
  parent: 'Parent',
  teacher: 'Teacher',
};

export default function Disputes({ embedded }: { embedded?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    disputes: Dispute[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusEdit, setStatusEdit] = useState<Record<string, string>>({});
  const [notesEdit, setNotesEdit] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') ?? '';
  const raisedByFilter = searchParams.get('raisedBy') ?? '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = Math.max(1, pageParam);

  const fetchDisputes = useCallback(() => {
    setLoading(true);
    adminApi.disputes
      .list({
        status: statusFilter || undefined,
        raisedBy: raisedByFilter || undefined,
        page,
        limit: 20,
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [statusFilter, raisedByFilter, page]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    if (data?.disputes) {
      setStatusEdit((prev) => {
        const next = { ...prev };
        data.disputes.forEach((d) => {
          if (next[d._id] === undefined) next[d._id] = d.status;
        });
        return next;
      });
      setNotesEdit((prev) => {
        const next = { ...prev };
        data.disputes.forEach((d) => {
          if (next[d._id] === undefined) next[d._id] = d.adminNotes ?? '';
        });
        return next;
      });
    }
  }, [data?.disputes]);

  const updateParams = (updates: { status?: string; raisedBy?: string; page?: number }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === 1) {
        if (k === 'page' && v === 1) next.delete('page');
        else if (k !== 'page') next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    if (updates.page !== undefined && updates.page === 1) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const handleUpdate = async (id: string) => {
    const status = statusEdit[id];
    const adminNotes = notesEdit[id];
    if (!status) return;
    setSavingId(id);
    try {
      await adminApi.disputes.update(id, { status, adminNotes: adminNotes || undefined });
      toast.success('Dispute updated');
      fetchDisputes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingId(null);
    }
  };

  const HeaderTag = embedded ? 'h2' : 'h1';
  return (
    <div className={embedded ? '' : 'p-8'}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <HeaderTag className={embedded ? 'mb-2 text-lg font-semibold text-accent-800' : 'text-2xl font-bold text-accent-800'}>
            Payment Disputes
          </HeaderTag>
          <p className="mt-1 text-sm text-accent-700">
            View and resolve payment disputes raised by parents or teachers. Update status and add admin notes.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-accent-700">Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value || undefined, page: 1 })}
          className="rounded-lg border border-accent-200 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-sm font-medium text-accent-700">Raised by:</span>
        <select
          value={raisedByFilter}
          onChange={(e) => updateParams({ raisedBy: e.target.value || undefined, page: 1 })}
          className="rounded-lg border border-accent-200 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="parent">Parent</option>
          <option value="teacher">Teacher</option>
        </select>
      </div>

      <DataState loading={loading} error={error}>
        {data && data.disputes.length > 0 ? (
          <div className="space-y-3">
            {data.disputes.map((d) => (
              <div
                key={d._id}
                className="rounded-lg border border-accent-200 bg-white shadow-sm"
              >
                <div
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-4 transition hover:bg-accent-50/50"
                  onClick={() => setExpandedId((prev) => (prev === d._id ? null : d._id))}
                >
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                    <span className="rounded bg-accent-100 px-2 py-0.5 text-xs text-accent-700">
                      {RAISED_BY_LABELS[d.raisedBy] ?? d.raisedBy}
                    </span>
                    <span className="font-medium text-accent-800">{d.subject}</span>
                    <span className="text-sm text-accent-600">
                      {(d.userId as { email?: string })?.email ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-accent-600">
                      {formatDateTime(d.createdAt)}
                    </span>
                    <span className="text-accent-500">{expandedId === d._id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedId === d._id && (
                  <div className="border-t border-accent-100 bg-accent-50/30 p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-accent-700">Description</p>
                        <p className="mt-1 whitespace-pre-wrap rounded bg-white p-3 text-sm text-accent-800">
                          {d.description}
                        </p>
                      </div>
                      {d.referenceType && (
                        <p className="text-sm">
                          <span className="font-medium text-accent-700">Reference:</span> {d.referenceType}
                          {d.referenceId && ` - ${d.referenceId}`}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <label className="block text-sm font-medium text-accent-700">Status</label>
                          <select
                            value={statusEdit[d._id] ?? d.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              setStatusEdit((prev) => ({ ...prev, [d._id]: e.target.value }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 rounded border border-accent-200 px-3 py-2 text-sm"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{STATUS_LABELS[opt]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="min-w-[200px] flex-1">
                          <label className="block text-sm font-medium text-accent-700">Admin notes</label>
                          <input
                            type="text"
                            value={notesEdit[d._id] ?? d.adminNotes ?? ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              setNotesEdit((prev) => ({ ...prev, [d._id]: e.target.value }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Internal notes or resolution..."
                            className="mt-1 w-full rounded border border-accent-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdate(d._id);
                            }}
                            disabled={savingId === d._id}
                            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-60"
                          >
                            {savingId === d._id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-accent-600">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={data.page <= 1}
                    onClick={() => updateParams({ page: data.page - 1 })}
                    className="rounded border border-accent-200 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={data.page >= data.totalPages}
                    onClick={() => updateParams({ page: data.page + 1 })}
                    className="rounded border border-accent-200 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-accent-600">No payment disputes yet.</p>
        )}
      </DataState>
    </div>
  );
}
