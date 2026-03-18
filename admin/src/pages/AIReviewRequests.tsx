import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { BulkActionBar } from '@/components/BulkActionBar';
import { BulkCheckbox } from '@/components/BulkCheckbox';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { useBulkSelect } from '@/hooks/useBulkSelect';

const REVIEW_COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'raisedBy', label: 'Raised By' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created' },
  { key: 'action', label: 'Action' },
] as const;

type ReviewRequest = {
  _id: string;
  entityType: string;
  entityId: string;
  raisedBy?: { email?: string; phone?: string };
  raisedByRole: string;
  studentId?: { name?: string };
  remark: string;
  status: string;
  adminReply?: string;
  correctedScore?: number;
  createdAt: string;
  reviewedAt?: string;
};

export default function AIReviewRequests() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    requests: ReviewRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReviewRequest & { entityDetails?: Record<string, unknown> } | null>(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved_incorrect' as 'resolved_correct' | 'resolved_incorrect',
    adminReply: '',
    correctedScore: '',
  });
  const [resolving, setResolving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useTablePreferences('ai_review_requests', REVIEW_COLUMNS.map((c) => c.key));

  const fetchRequests = useCallback(() => {
    setLoading(true);
    adminApi.aiReviewRequests
      .list({ status: statusFilter || undefined, entityType: entityTypeFilter || undefined, sort: 'createdAt', order: 'desc', page, limit: 20 })
      .then((d) => setData(d as { requests: ReviewRequest[]; total: number; page: number; limit: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [statusFilter, entityTypeFilter, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    adminApi.aiReviewRequests
      .get(selectedId)
      .then((d) => setDetail(d as ReviewRequest & { entityDetails?: Record<string, unknown> }))
      .catch(() => setDetail(null));
  }, [selectedId]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setResolving(true);
    try {
      const payload: { status: 'resolved_correct' | 'resolved_incorrect'; adminReply?: string; correctedScore?: number } = {
        status: resolveForm.status,
        adminReply: resolveForm.adminReply.trim() || undefined,
      };
      if (detail?.entityType === 'exam' && resolveForm.correctedScore) {
        payload.correctedScore = parseFloat(resolveForm.correctedScore);
      }
      await adminApi.aiReviewRequests.resolve(selectedId, payload);
      setSelectedId(null);
      setResolveForm({ status: 'resolved_incorrect', adminReply: '', correctedScore: '' });
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  };

  const col = (key: string) => visibleColumns.includes(key) || visibleColumns.length === 0;
  const requests = data?.requests ?? [];
  const bulk = useBulkSelect(requests, {
    selectable: (r) => r.status === 'pending' || r.status === 'in_review',
  });

  const bulkResolve = (status: 'resolved_correct' | 'resolved_incorrect') => async (ids: string[]) => {
    const toResolve = ids.filter((id) => {
      const r = requests.find((x) => x._id === id);
      return r && (r.status === 'pending' || r.status === 'in_review');
    });
    try {
      for (const id of toResolve) {
        await adminApi.aiReviewRequests.resolve(id, { status });
      }
      toast.success(`${toResolve.length} review(s) resolved`);
      fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve');
    }
  };

  const statusBadge: Record<string, string> = {
    pending: 'bg-accent-100 text-accent-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved_correct: 'bg-green-100 text-green-800',
    resolved_incorrect: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">AI Review Requests</h1>
      <p className="mb-4 text-accent-700">
        Review and resolve human review requests for AI-evaluated exams and course material.
      </p>

      <FilterBar
        filters={[
          { key: 'status', label: 'Status', value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, options: [
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_review', label: 'In Review' },
            { value: 'resolved_correct', label: 'Resolved (Correct)' },
            { value: 'resolved_incorrect', label: 'Resolved (Corrected)' },
          ]},
          { key: 'entityType', label: 'Entity Type', value: entityTypeFilter, onChange: (v) => { setEntityTypeFilter(v); setPage(1); }, options: [
            { value: '', label: 'All' },
            { value: 'exam', label: 'Exam' },
            { value: 'course_material', label: 'Course Material' },
          ]},
        ]}
        extra={
          <ColumnSelector pageKey="ai_review_requests" columns={[...REVIEW_COLUMNS]} visibleColumns={visibleColumns.length ? visibleColumns : REVIEW_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumns} />
        }
      />

      <DataState loading={loading} error={error} onRetry={fetchRequests}>
        {data && (
          <div className="flex gap-6">
            <div className="flex-1 overflow-x-auto rounded-lg border border-accent-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-accent-50">
                  <tr>
                    {col('type') && <th className="px-4 py-2 text-left">Type</th>}
                    {col('raisedBy') && <th className="px-4 py-2 text-left">Raised By</th>}
                    {col('status') && <th className="px-4 py-2 text-left">Status</th>}
                    {col('created') && <th className="px-4 py-2 text-left">Created</th>}
                    {col('action') && <th className="px-4 py-2 text-left">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.requests.map((r) => (
                    <tr key={r._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                      <td className="w-10 px-2 py-2">
                        <BulkCheckbox
                          checked={bulk.isSelected(r._id)}
                          onChange={() => bulk.toggle(r._id)}
                          disabled={!bulk.isSelectable(r._id)}
                          aria-label={`Select request ${r.entityType}`}
                        />
                      </td>
                      {col('type') && <td className="px-4 py-2">{r.entityType}</td>}
                      {col('raisedBy') && <td className="px-4 py-2">
                        {(r.raisedBy as { email?: string })?.email || (r.raisedBy as { phone?: string })?.phone || '-'}
                        <span className="ml-1 text-xs text-gray-500">({r.raisedByRole})</span>
                      </td>}
                      {col('status') && <td className="px-4 py-2">
                        <span className={`rounded px-2 py-0.5 ${statusBadge[r.status] || 'bg-gray-100'}`}>
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>}
                      {col('created') && <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>}
                      {col('action') && <td className="px-4 py-2">
                        <button
                          onClick={() => setSelectedId(r._id)}
                          className="text-accent-600 hover:underline"
                        >
                          View / Resolve
                        </button>
                      </td>}
                    </tr>
                  ))}
                  {data.requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No review requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {selectedId && detail && (
              <div className="w-[400px] shrink-0 rounded-lg border border-accent-200 bg-white p-6">
                <h2 className="mb-4 font-semibold text-accent-800">Review Details</h2>
                <div className="mb-4 space-y-2 text-sm">
                  <p><strong>Type:</strong> {detail.entityType}</p>
                  <p><strong>Raised by:</strong> {(detail.raisedBy as { email?: string })?.email || (detail.raisedBy as { phone?: string })?.phone} ({detail.raisedByRole})</p>
                  <p><strong>Remark:</strong> {detail.remark}</p>
                  <p><strong>Status:</strong> {detail.status}</p>
                  {detail.entityType === 'exam' && detail.entityDetails && (
                    <div className="mt-2 rounded border border-accent-100 p-2">
                      <p><strong>Exam:</strong> {(detail.entityDetails as { subject?: string }).subject} – Score: {(detail.entityDetails as { score?: number }).score}/{(detail.entityDetails as { totalMarks?: number }).totalMarks}</p>
                      {(detail.entityDetails as { aiFeedback?: { lowSentimentWarning?: boolean } })?.aiFeedback?.lowSentimentWarning && (
                        <p className="mt-1 text-amber-700 text-sm">⚠️ Some answer content was masked for inappropriate language.</p>
                      )}
                    </div>
                  )}
                </div>

                {detail.status === 'pending' || detail.status === 'in_review' ? (
                  <form onSubmit={handleResolve} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Resolution</label>
                      <select
                        value={resolveForm.status}
                        onChange={(e) => setResolveForm((f) => ({ ...f, status: e.target.value as 'resolved_correct' | 'resolved_incorrect' }))}
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      >
                        <option value="resolved_correct">AI was correct (no change)</option>
                        <option value="resolved_incorrect">AI was incorrect (fix applied)</option>
                      </select>
                    </div>
                    {detail.entityType === 'exam' && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Corrected score (if fixing)</label>
                        <input
                          type="number"
                          value={resolveForm.correctedScore}
                          onChange={(e) => setResolveForm((f) => ({ ...f, correctedScore: e.target.value }))}
                          placeholder="e.g. 85"
                          className="w-full rounded border border-gray-300 px-3 py-2"
                        />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Admin reply (shown to user)</label>
                      <textarea
                        value={resolveForm.adminReply}
                        onChange={(e) => setResolveForm((f) => ({ ...f, adminReply: e.target.value }))}
                        rows={3}
                        placeholder="Brief explanation for the user..."
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resolving}
                        className="rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700 disabled:opacity-50"
                      >
                        {resolving ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-lg bg-accent-50 p-3 text-sm">
                    {detail.adminReply && <p><strong>Your reply:</strong> {detail.adminReply}</p>}
                    {detail.correctedScore !== undefined && <p><strong>Corrected score:</strong> {detail.correctedScore}</p>}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="mt-2 text-accent-600 hover:underline"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
