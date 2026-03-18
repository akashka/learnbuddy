import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { DeleteAccountSection } from '@/components/DeleteAccountSection';

interface DataCategory {
  category: string;
  items: string[];
}

interface ConsentRecord {
  consentType: string;
  version: string;
  grantedAt: string;
  studentName?: string;
}

export default function Privacy() {
  const [dataSummary, setDataSummary] = useState<DataCategory[]>([]);
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const profilePath = user?.role === 'parent' ? '/parent/profile' : '/teacher/profile';

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<{ dataSummary: DataCategory[]; consentHistory: ConsentRecord[] }>('/api/privacy/dashboard')
      .then((d) => {
        setDataSummary(d.dataSummary || []);
        setConsentHistory(d.consentHistory || []);
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'parent' && user.role !== 'teacher')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, fetchData, navigate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = await apiJson<Record<string, unknown>>('/api/privacy/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learnbuddy-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err : 'Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-brand-600">Loading...</div>
      </div>
    );
  }

  if (error && dataSummary.length === 0) {
    return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;
  }

  const consentTypeLabel: Record<string, string> = {
    child_data_collection: 'Child data collection',
    ai_monitoring: 'AI monitoring',
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link to={profilePath} className="text-sm text-brand-600 hover:underline">
          ← Back to Profile
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-brand-800">Privacy & Data</h1>
        <p className="mt-1 text-gray-600">
          Manage your personal data, view consent history, and control your privacy.
        </p>
      </div>

      <div className="space-y-6">
        {/* Data we hold */}
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-800">Data we hold</h2>
              <p className="text-sm text-gray-500">Categories of data we collect and store</p>
            </div>
          </div>
          <div className="space-y-3">
            {dataSummary.map((cat) => (
              <div key={cat.category} className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium text-gray-800">{cat.category}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {cat.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-white px-3 py-1 text-sm text-gray-600 shadow-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Consent history - parent only */}
        {user?.role === 'parent' && (
          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-800">Consent history</h2>
                <p className="text-sm text-gray-500">Your recorded consents for child data and AI monitoring</p>
              </div>
            </div>
            {consentHistory.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Child</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentHistory.map((c, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-2">{consentTypeLabel[c.consentType] || c.consentType}</td>
                        <td className="px-4 py-2">{c.studentName || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {c.grantedAt ? new Date(c.grantedAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                No consent records yet. Consents are logged when you add or update a child.
              </p>
            )}
          </section>
        )}

        {/* Actions */}
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-800">Your choices</h2>
              <p className="text-sm text-gray-500">Correct, download, or delete your data</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to={profilePath}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-brand-600">✎</span>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Correct your data</p>
                  <p className="text-sm text-gray-500">Update your profile and details</p>
                </div>
              </div>
              <span className="text-brand-600">→</span>
            </Link>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-brand-600">↓</span>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Download your data</p>
                  <p className="text-sm text-gray-500">Export all your data as JSON</p>
                </div>
              </div>
              {downloading ? (
                <span className="text-sm text-gray-500">Preparing...</span>
              ) : (
                <span className="text-brand-600">→</span>
              )}
            </button>
          </div>
        </section>

        {/* Delete data */}
        <section className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
          <DeleteAccountSection role={user?.role as 'parent' | 'teacher'} onDeleted={logout} />
        </section>
      </div>
    </div>
  );
}
