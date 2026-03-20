import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { formatDateTime } from '@shared/formatters';

type Provider = {
  id: string;
  name: string;
  models: string[];
  capabilities: string[];
  knownLimit: string;
  configured: boolean;
  status: 'healthy' | 'degraded' | 'unknown' | 'not_configured';
  lastCheck: string | null;
  latencyMs: number | null;
  successCount: number;
  failureCount: number;
  lastError: string | null;
};

type AIModelsData = {
  providers: Provider[];
  fallbackOrder: string[];
  usage: {
    today: number;
    last7Days: number;
    successRateToday: number;
    successRateWeek: number;
  };
};

export default function AIModels() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AIModelsData | null>(null);

  const fetchData = () => {
    setLoading(true);
    adminApi
      .aiModels()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statusBadge = (p: Provider) => {
    if (p.status === 'not_configured') {
      return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Not configured</span>;
    }
    if (p.status === 'healthy') {
      return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Healthy</span>;
    }
    if (p.status === 'degraded') {
      return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Degraded</span>;
    }
    return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">Unknown</span>;
  };

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-accent-800">AI Models & Providers</h1>
      <p className="mb-6 text-accent-700">
        Real-time status and usage. Data refreshes every 30 seconds.
      </p>

      <DataState loading={loading} error={error}>
        {data && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-accent-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-accent-600">Usage today</p>
                <p className="text-2xl font-bold text-accent-800">{data.usage.today}</p>
                <p className="text-xs text-accent-500">requests</p>
              </div>
              <div className="rounded-lg border border-accent-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-accent-600">Last 7 days</p>
                <p className="text-2xl font-bold text-accent-800">{data.usage.last7Days}</p>
                <p className="text-xs text-accent-500">requests</p>
              </div>
              <div className="rounded-lg border border-accent-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-accent-600">Success rate (today)</p>
                <p className="text-2xl font-bold text-green-600">{data.usage.successRateToday}%</p>
              </div>
              <div className="rounded-lg border border-accent-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-accent-600">Success rate (7d)</p>
                <p className="text-2xl font-bold text-green-600">{data.usage.successRateWeek}%</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-accent-200 bg-accent-50/50 p-3">
              <p className="text-sm text-accent-600">
                <strong>Fallback order:</strong> {data.fallbackOrder.join(' → ')}
              </p>
            </div>

            <div className="space-y-4">
              {data.providers.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border-2 p-4 ${
                    p.configured && p.status === 'healthy'
                      ? 'border-green-200 bg-green-50/20'
                      : p.configured && p.status === 'degraded'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-accent-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {p.id === 'gemini' && '🔷'}
                        {p.id === 'groq' && '⚡'}
                        {p.id === 'huggingface' && '🤗'}
                        {p.id === 'openrouter' && '🔀'}
                        {p.id === 'cloudflare' && '☁️'}
                        {p.id === 'together' && '🤝'}
                        {p.id === 'openai' && '🟢'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-accent-800">{p.name}</h3>
                          {statusBadge(p)}
                        </div>
                        <p className="text-sm text-accent-600">
                          {p.models.join(', ')} • {p.capabilities.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-accent-500">Known limit</p>
                      <p className="text-sm text-accent-700">{p.knownLimit}</p>
                    </div>
                    {p.configured && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-accent-500">Last check</p>
                          <p className="text-sm text-accent-700">
                            {p.lastCheck ? formatDateTime(p.lastCheck) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-accent-500">Latency</p>
                          <p className="text-sm text-accent-700">
                            {p.latencyMs != null ? `${p.latencyMs} ms` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-accent-500">Success / Fail (probes)</p>
                          <p className="text-sm text-accent-700">
                            <span className="text-green-600">{p.successCount}</span>
                            {' / '}
                            <span className="text-red-600">{p.failureCount}</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {p.lastError && (
                    <div className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
                      {p.lastError.slice(0, 200)}{p.lastError.length > 200 ? '…' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
