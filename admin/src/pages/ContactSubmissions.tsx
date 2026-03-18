import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

type Submission = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = ['open', 'in_process', 'closed'] as const;
const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_process: 'In Process',
  closed: 'Closed',
};
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_process: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
};
const TYPE_LABELS: Record<string, string> = {
  concern: 'Concern',
  suggestion: 'Suggestion',
  feedback: 'Feedback',
  other: 'Other',
};

export default function ContactSubmissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    submissions: Submission[];
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
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = Math.max(1, pageParam);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    adminApi.contactSubmissions
      .list({ status: statusFilter || undefined, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (data?.submissions) {
      setStatusEdit((prev) => {
        const next = { ...prev };
        data.submissions.forEach((s) => {
          if (next[s.id] === undefined) next[s.id] = s.status;
        });
        return next;
      });
      setNotesEdit((prev) => {
        const next = { ...prev };
        data.submissions.forEach((s) => {
          if (next[s.id] === undefined) next[s.id] = s.adminNotes ?? '';
        });
        return next;
      });
    }
  }, [data?.submissions]);

  const updateParams = (updates: { status?: string; page?: number }) => {
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

  const handleUpdateStatus = async (id: string) => {
    const status = statusEdit[id];
    const adminNotes = notesEdit[id];
    if (!status) return;
    setSavingId(id);
    try {
      await adminApi.contactSubmissions.update(id, { status, adminNotes: adminNotes || undefined });
      toast.success('Submission updated');
      fetchSubmissions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Contact Submissions</h1>
          <p className="mt-1 text-sm text-accent-700">
            View and manage contact form submissions from the website. Update status and add notes.
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
      </div>

      <DataState loading={loading} error={error}>
        {data && data.submissions.length > 0 ? (
          <div className="space-y-3">
            {data.submissions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-accent-200 bg-white shadow-sm"
              >
                <div
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-4 transition hover:bg-accent-50/50"
                  onClick={() => setExpandedId((prev) => (prev === s.id ? null : s.id))}
                >
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="font-medium text-accent-800">{s.name}</span>
                    <span className="text-sm text-accent-600">{s.email}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    <span className="rounded bg-accent-100 px-2 py-0.5 text-xs text-accent-700">
                      {TYPE_LABELS[s.type] ?? s.type}
                    </span>
                    <span className="text-sm text-gray-600">{s.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-accent-600">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                    <span className="text-accent-500">{expandedId === s.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedId === s.id && (
                  <div className="border-t border-accent-100 bg-accent-50/30 p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-accent-700">Message</p>
                        <p className="mt-1 whitespace-pre-wrap rounded bg-white p-3 text-sm text-accent-800">
                          {s.message}
                        </p>
                      </div>
                      {s.phone && (
                        <p className="text-sm">
                          <span className="font-medium text-accent-700">Phone:</span> {s.phone}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <label className="block text-sm font-medium text-accent-700">Status</label>
                          <select
                            value={statusEdit[s.id] ?? s.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              setStatusEdit((prev) => ({ ...prev, [s.id]: e.target.value }));
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
                            value={notesEdit[s.id] ?? s.adminNotes ?? ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              setNotesEdit((prev) => ({ ...prev, [s.id]: e.target.value }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Internal notes..."
                            className="mt-1 w-full rounded border border-accent-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(s.id);
                            }}
                            disabled={savingId === s.id}
                            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-60"
                          >
                            {savingId === s.id ? 'Saving...' : 'Save'}
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
          <p className="text-accent-600">No contact submissions yet.</p>
        )}
      </DataState>
    </div>
  );
}
