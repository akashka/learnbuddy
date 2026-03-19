import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

interface Agreement {
  type: string;
  label: string;
  content: string;
  signed?: { version: string; signedAt: string };
}

export default function TeacherAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [signing, setSigning] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAgreements = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ agreements: Agreement[]; commissionPercent: number }>('/api/teacher/agreements');
      setAgreements(data.agreements || []);
      setCommissionPercent(data.commissionPercent ?? 10);
    } catch (e) {
      setError(e instanceof Error ? e : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleSign = async (type: string) => {
    setSigning(type);
    setError(null);
    try {
      await apiJson('/api/teacher/agreements/sign', {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      await fetchAgreements();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign');
    } finally {
      setSigning(null);
    }
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error && agreements.length === 0) return <InlineErrorDisplay error={error} onRetry={fetchAgreements} fullPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Agreements & Policies</h1>
      <p className="mb-6 text-gray-600">
        Please read and sign the following agreements to continue as a teacher on LearnBuddy. Your current commission rate is <strong>{commissionPercent}%</strong>.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error instanceof Error ? error.message : error}
        </div>
      )}

      <div className="space-y-4">
        {agreements.map((a) => (
          <div
            key={a.type}
            className="rounded-xl border border-brand-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-semibold text-brand-800">{a.label}</h2>
              {a.signed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                  ✓ Signed on {new Date(a.signed.signedAt).toLocaleDateString()}
                </span>
              ) : (
                <button
                  onClick={() => handleSign(a.type)}
                  disabled={!!signing}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {signing === a.type ? 'Signing...' : 'Sign & Approve'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(expanded === a.type ? null : a.type)}
              className="mt-2 text-sm text-brand-600 hover:underline"
            >
              {expanded === a.type ? 'Hide document' : 'View full document'}
            </button>
            {expanded === a.type && a.content && (
              <div
                className="prose prose-sm mt-4 max-h-96 overflow-y-auto border-t border-brand-100 pt-4"
                dangerouslySetInnerHTML={{ __html: a.content }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
