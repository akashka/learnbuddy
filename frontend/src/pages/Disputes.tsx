import { useEffect, useState, useCallback } from 'react';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { Modal } from '@/components/Modal';

interface Dispute {
  _id: string;
  subject: string;
  description: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function Disputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '' });

  const fetchDisputes = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<{ disputes: Dispute[] }>('/api/disputes')
      .then((d) => setDisputes(d.disputes || []))
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'parent' && user.role !== 'teacher')) return;
    fetchDisputes();
  }, [user, fetchDisputes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiJson('/api/disputes', {
        method: 'POST',
        body: JSON.stringify({
          subject: form.subject.trim(),
          description: form.description.trim(),
        }),
      });
      setForm({ subject: '', description: '' });
      setShowForm(false);
      fetchDisputes();
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (user.role !== 'parent' && user.role !== 'teacher')) {
    return null;
  }

  if (loading && disputes.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading...</p>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    open: 'bg-amber-100 text-amber-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="⚖️"
        title="Payment Disputes"
        subtitle="Raise or track disputes about payments and accounts"
        action={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
          >
            + Raise dispute
          </button>
        }
      />

      <div className="space-y-6">
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-accent-100 text-2xl shadow-md">
                📋
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-800">Your disputes</h2>
                <p className="text-sm text-gray-600">
                  Track status of disputes you&apos;ve raised. Admin will review and respond.
                </p>
              </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{String(error)}</p>}

            {disputes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/30 py-12 text-center">
                <p className="text-4xl">📭</p>
                <p className="mt-2 font-medium text-brand-700">No disputes yet</p>
                <p className="mt-1 text-sm text-gray-600">
                  Raise a dispute if you have concerns about a payment or account.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
                >
                  Raise dispute
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div
                    key={d._id}
                    className="rounded-xl border-2 border-brand-100 bg-white p-4 transition hover:border-brand-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-brand-800">{d.subject}</p>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{d.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Raised {formatDate(d.createdAt)}
                          {d.resolvedAt && ` • Resolved ${formatDate(d.resolvedAt)}`}
                        </p>
                        {d.adminNotes && (
                          <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-700">
                            <strong>Admin response:</strong> {d.adminNotes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          statusColor[d.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContentCard>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
          <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50 to-violet-50 px-6 py-4">
            <h3 className="text-lg font-bold text-brand-800">Raise a dispute</h3>
            <p className="text-sm text-gray-600">
              Describe your concern. Our team will review and respond.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Incorrect deduction in March payment"
                className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Provide details about the issue..."
                rows={4}
                className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{String(error)}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
