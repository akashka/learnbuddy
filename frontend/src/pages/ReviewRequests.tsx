import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

interface ReviewRequest {
  _id: string;
  entityType: 'exam' | 'course_material';
  entityId: string;
  raisedByRole: string;
  remark: string;
  status: string;
  adminReply?: string;
  correctedScore?: number;
  createdAt: string;
  reviewedAt?: string;
}

export default function ReviewRequests() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const url = statusFilter ? `/api/ai-review?status=${statusFilter}` : '/api/ai-review';
    apiJson<{ requests: ReviewRequest[] }>(url)
      .then((d) => setRequests(d.requests || []))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved_correct: 'bg-green-100 text-green-800',
    resolved_incorrect: 'bg-emerald-100 text-emerald-800',
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">My Review Requests</h1>
      <p className="mb-4 text-gray-600">
        Track the status of your AI review requests and view admin feedback.
      </p>

      <div className="mb-4">
        <label className="mr-2 text-sm text-gray-600">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="resolved_correct">Resolved (Correct)</option>
          <option value="resolved_incorrect">Resolved (Corrected)</option>
        </select>
      </div>

      <div className="space-y-4">
        {requests.map((r) => (
          <div
            key={r._id}
            className="rounded-xl border border-brand-200 bg-white p-4"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-brand-800">
                {r.entityType === 'exam' ? 'Exam' : 'Course Material'}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-sm ${
                  statusBadge[r.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {r.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              <strong>Your remark:</strong> {r.remark}
            </p>
            <p className="mb-2 text-xs text-gray-500">
              Submitted: {formatDate(r.createdAt)}
            </p>
            {r.status.startsWith('resolved') && (
              <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-3">
                <p className="text-sm font-medium text-brand-800">Admin response:</p>
                {r.adminReply && (
                  <p className="mt-1 text-sm text-gray-700">{r.adminReply}</p>
                )}
                {r.correctedScore !== undefined && r.entityType === 'exam' && (
                  <p className="mt-1 text-sm text-gray-700">
                    Corrected score: {r.correctedScore}
                  </p>
                )}
                {r.reviewedAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    Resolved: {formatDate(r.reviewedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <p className="text-gray-600">
          No review requests yet. Use &quot;Request human review&quot; on exam results or study
          materials to submit one.
        </p>
      )}
    </div>
  );
}
