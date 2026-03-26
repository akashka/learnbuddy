import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { DeleteAccountSection } from '@/components/DeleteAccountSection';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { formatDateTime } from '@shared/formatters';

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
      a.download = `guruchakra-data-${new Date().toISOString().slice(0, 10)}.json`;
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
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading your privacy data...</p>
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
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="🔒"
        title="Privacy & Data"
        subtitle="Manage your personal data, view consent history, and control your privacy."
      />

      <div className="space-y-6">
        {/* Data we hold */}
        <ContentCard className="stagger-1">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-2xl shadow-md">
                📦
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-800">Data we hold</h2>
                <p className="text-sm text-gray-600">{'Categories of data we collect and store'}</p>
              </div>
            </div>
            <div className="space-y-4">
              {dataSummary.map((cat, idx) => (
                <div
                  key={cat.category}
                  className="animate-slide-up rounded-xl border-2 border-brand-100 bg-gradient-to-br from-white to-brand-50/30 p-5 transition hover:border-brand-200 hover:shadow-md"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <h3 className="mb-3 font-semibold text-brand-800">{cat.category}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm ring-1 ring-brand-100"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </ContentCard>

        {/* Consent history - parent only */}
        {user?.role === 'parent' && (
          <ContentCard className="stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 text-2xl shadow-md">
                  ✓
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Consent history</h2>
                  <p className="text-sm text-gray-600">
                    {'Your recorded consents for child data and AI monitoring'}
                  </p>
                </div>
              </div>
              {consentHistory.length > 0 ? (
                <div className="overflow-hidden rounded-xl border-2 border-brand-100 shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-brand-50 to-violet-50">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold text-brand-800">Type</th>
                        <th className="px-5 py-3 text-left font-semibold text-brand-800">Child</th>
                        <th className="px-5 py-3 text-left font-semibold text-brand-800">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consentHistory.map((c, i) => (
                        <tr
                          key={i}
                          className="border-t border-brand-100 bg-white/80 transition hover:bg-brand-50/50"
                        >
                          <td className="px-5 py-3 font-medium text-brand-800">
                            {consentTypeLabel[c.consentType] || c.consentType}
                          </td>
                          <td className="px-5 py-3 text-gray-700">{c.studentName || '-'}</td>
                          <td className="px-5 py-3 text-gray-600">
                            {c.grantedAt ? formatDateTime(c.grantedAt) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/30 p-8 text-center">
                  <p className="text-4xl">📋</p>
                  <p className="mt-2 font-medium text-brand-700">No consent records yet</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Consents are logged when you add or update a child.
                  </p>
                </div>
              )}
            </div>
          </ContentCard>
        )}

        {/* Actions */}
        <ContentCard className="stagger-3">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-100 to-amber-100 text-2xl shadow-md">
                ⚙️
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-800">Your choices</h2>
                <p className="text-sm text-gray-600">{'Correct, download, or delete your data'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                to={profilePath}
                className="group flex items-center justify-between rounded-xl border-2 border-brand-100 bg-gradient-to-r from-white to-brand-50/50 p-5 transition hover:border-brand-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl transition group-hover:scale-110">
                    ✎
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-brand-800">Correct your data</p>
                    <p className="text-sm text-gray-600">Update your profile and details</p>
                  </div>
                </div>
                <span className="text-2xl text-brand-400 transition group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="group flex w-full items-center justify-between rounded-xl border-2 border-brand-100 bg-gradient-to-r from-white to-brand-50/50 p-5 transition hover:border-brand-200 hover:shadow-lg disabled:opacity-60 disabled:hover:border-brand-100 disabled:hover:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl transition group-hover:scale-110">
                    ↓
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-brand-800">Download your data</p>
                    <p className="text-sm text-gray-600">Export all your data as JSON</p>
                  </div>
                </div>
                {downloading ? (
                  <span className="flex items-center gap-2 text-sm text-brand-600">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    Preparing...
                  </span>
                ) : (
                  <span className="text-2xl text-brand-400 transition group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>
            </div>
          </div>
        </ContentCard>

        {/* Delete data */}
        <div className="animate-slide-up stagger-4 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50/80 via-white to-orange-50/50 p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-2xl shadow-md">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800">Account & Data</h2>
              <p className="text-sm text-red-700/80">Permanently delete your account and data</p>
            </div>
          </div>
          <DeleteAccountSection role={user?.role as 'parent' | 'teacher'} onDeleted={logout} />
        </div>
      </div>
    </div>
  );
}
