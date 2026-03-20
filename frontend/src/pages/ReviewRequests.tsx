import { useEffect, useState, useCallback } from 'react';
import { apiJson } from '@/lib/api';
import { formatDateTime, formatTimeAgo } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { FilterSidebar } from '@/components/FilterSidebar';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
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

const ENTITY_ICONS: Record<string, string> = {
  exam: '📝',
  course_material: '📚',
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; className: string }> = {
  pending: { label: 'Pending', icon: '⏳', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_review: { label: 'In Review', icon: '🔍', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  resolved_correct: { label: 'Resolved (Correct)', icon: '✅', className: 'bg-green-100 text-green-800 border-green-200' },
  resolved_incorrect: { label: 'Resolved (Corrected)', icon: '✏️', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), icon: '📋', className: 'bg-gray-100 text-gray-800 border-gray-200' };
}

export default function ReviewRequests() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchRequests = useCallback(() => {
    setError(null);
    setLoading(true);
    const url = statusFilter ? `/api/ai-review?status=${statusFilter}` : '/api/ai-review';
    apiJson<{ requests: ReviewRequest[] }>(url)
      .then((d) => setRequests(d.requests || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendingCount = requests.filter((r) => r.status === 'pending' || r.status === 'in_review').length;

  if (loading && requests.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading your review requests...</p>
      </div>
    );
  }

  if (error && requests.length === 0) {
    return <InlineErrorDisplay error={error} onRetry={fetchRequests} fullPage />;
  }

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="✏️"
        title="Review Requests"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} awaiting review`
            : requests.length > 0
              ? 'All caught up'
              : 'Track AI review requests'
        }
        action={
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-lg transition hover:bg-white/95 disabled:opacity-50"
          >
            Refresh
          </button>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {(requests.length > 0 || statusFilter) && (
          <FilterSidebar
            title="Filter"
            className={`${filtersOpen ? 'block' : 'hidden lg:block'}`}
            footer={<p className="text-sm font-medium text-gray-600">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>}
          >
            <>
              <div>
                <label htmlFor="review-status" className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
                <select
                  id="review-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">All statuses</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="in_review">🔍 In Review</option>
                  <option value="resolved_correct">✅ Resolved (Correct)</option>
                  <option value="resolved_incorrect">✏️ Resolved (Corrected)</option>
                </select>
              </div>
            </>
          </FilterSidebar>
        )}

        <main className="min-w-0 flex-1">
          {(requests.length > 0 || statusFilter) && (
            <div className="mb-4 flex justify-end lg:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </button>
            </div>
          )}

          {requests.length === 0 && !statusFilter ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-white p-16 text-center shadow-sm">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/20 blur-xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/15 blur-lg" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-5xl shadow-md">
                ✏️
              </div>
              <h2 className="relative mt-6 text-xl font-semibold text-gray-900">No review requests yet</h2>
              <p className="relative mx-auto mt-2 max-w-sm text-sm text-gray-500">
                Use &quot;Request human review&quot; on exam results or study materials when you believe the AI needs a second look.
              </p>
              <div className="relative mt-6 flex flex-wrap justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
                  📝 Exams
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
                  📚 Study Materials
                </span>
              </div>
            </div>
          ) : requests.length === 0 && statusFilter ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white via-brand-50/20 to-accent-50 p-12 text-center shadow-lg">
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-200/25 blur-xl" />
              <p className="relative text-sm font-medium text-gray-600">No requests match your filter</p>
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className="relative mt-4 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <ul className="space-y-5">
              {requests.map((r, idx) => {
                const statusCfg = getStatusConfig(r.status);
                const entityIcon = ENTITY_ICONS[r.entityType] ?? '📋';
                const isResolved = r.status.startsWith('resolved');
                const isCorrect = r.status === 'resolved_correct';
                return (
                  <li key={r._id}>
                    <div
                      className={`card-funky animate-slide-up group relative block overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 ${
                        isResolved
                          ? isCorrect
                            ? 'border-green-200/80 bg-gradient-to-br from-green-50/90 via-white to-emerald-50/80 hover:border-green-300 hover:shadow-xl'
                            : 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 hover:border-emerald-300 hover:shadow-xl'
                          : 'border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 hover:border-brand-300 hover:shadow-xl'
                      }`}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-xl ${isResolved ? (isCorrect ? 'bg-green-200/25' : 'bg-emerald-200/25') : 'bg-accent-200/20'}`} />
                      <div className={`absolute -bottom-6 -left-6 h-20 w-20 rounded-full blur-lg ${isResolved ? (isCorrect ? 'bg-green-200/20' : 'bg-emerald-200/20') : 'bg-brand-200/15'}`} />
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        <div className="flex min-w-0 flex-1 gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-md ${
                              isResolved
                                ? isCorrect
                                  ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                                  : 'bg-gradient-to-br from-emerald-100 to-teal-100'
                                : 'bg-gradient-to-br from-brand-100 to-violet-100'
                            }`}
                          >
                            {entityIcon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {r.entityType === 'exam' ? 'Exam' : 'Course Material'}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}
                              >
                                {statusCfg.icon} {statusCfg.label}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              <strong className="text-gray-700">Your remark:</strong> {r.remark}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              Submitted {formatTimeAgo(r.createdAt)}
                            </p>
                          </div>
                        </div>
                        {r.status.startsWith('resolved') && (
                          <div
                            className={`flex w-full shrink-0 flex-col rounded-xl border-l-4 p-4 sm:w-80 ${
                              isCorrect
                                ? 'border-l-green-500 bg-green-50/60'
                                : 'border-l-emerald-500 bg-emerald-50/60'
                            }`}
                          >
                            <p className={`text-xs font-semibold uppercase tracking-wider ${isCorrect ? 'text-green-700' : 'text-emerald-700'}`}>
                              Admin response
                            </p>
                            {r.adminReply && (
                              <p className="mt-2 text-sm text-gray-700 line-clamp-3">{r.adminReply}</p>
                            )}
                            {r.correctedScore !== undefined && r.entityType === 'exam' && (
                              <p className="mt-2 text-sm font-medium text-gray-800">
                                Corrected score: {r.correctedScore}
                              </p>
                            )}
                            {r.reviewedAt && (
                              <p className="mt-2 text-xs text-gray-500">
                                Resolved {formatDateTime(r.reviewedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
