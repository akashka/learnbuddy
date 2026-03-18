import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';

const SERVICE_LABELS: Record<string, { label: string; icon: string }> = {
  backend: { label: 'Backend API', icon: '🖥️' },
  mongodb: { label: 'MongoDB', icon: '🗄️' },
  redis: { label: 'Redis', icon: '⚡' },
  aiService: { label: 'AI Service', icon: '🤖' },
};

export default function ReportTabSystemStatus() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.systemStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports
      .systemStatus()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data)
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" />
      </div>
    );
  if (error && !data)
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  if (!data) return null;

  const { timestamp, overall, services } = data;

  const statusColor = (status: string) => {
    if (status === 'up') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'down') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-accent-100 text-accent-700 border-accent-300';
  };

  const overallColor =
    overall === 'healthy'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
      : overall === 'degraded'
        ? 'bg-amber-100 text-amber-800 border-amber-400'
        : 'bg-accent-100 text-accent-700 border-accent-400';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${overallColor}`}
          >
            {overall === 'healthy' ? '✓ All Systems Operational' : overall === 'degraded' ? '⚠ Degraded' : '? Unknown'}
          </span>
          <span className="text-sm text-accent-500">
            Last checked: {new Date(timestamp).toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="rounded-lg border-2 border-accent-300 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(services).map(([key, s]) => {
          const meta = SERVICE_LABELS[key] || { label: key, icon: '📦' };
          return (
            <div
              key={key}
              className="rounded-xl border-2 border-accent-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <p className="font-medium text-accent-900">{meta.label}</p>
                    <p className="text-xs text-accent-500">{s.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(s.status)}`}
                  >
                    {s.status}
                  </span>
                  {s.latencyMs != null && s.latencyMs > 0 && (
                    <span className="text-xs text-accent-600">{s.latencyMs} ms</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Status Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-accent-700">Up</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-accent-700">Down</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-accent-400" />
            <span className="text-sm text-accent-700">Unknown / Not configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
