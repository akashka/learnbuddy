import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ReportTabTechnology() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.technology>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.technology({ days }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { aiUsage, aiReviews, security } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="rounded-lg border border-accent-300 px-3 py-2 text-sm">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'AI Calls', value: aiUsage.totalCalls, icon: '🤖' },
          { label: 'AI Success Rate', value: `${aiUsage.successRate}%`, icon: '✅' },
          { label: 'AI Failed', value: aiUsage.failedCount, icon: '❌' },
          { label: 'Pending AI Reviews', value: aiReviews.pending, icon: '🔍' },
          { label: 'Open Security Incidents', value: security.openIncidents, icon: '🔒' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border-2 border-accent-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div><p className="text-sm text-accent-600">{m.label}</p><p className="text-xl font-bold text-accent-900">{m.value}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">AI Calls by Operation Type</h3>
          <div className="h-64">
            {aiUsage.byOperation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiUsage.byOperation.map((o) => ({ name: (o.operation || 'Unknown').replace(/_/g, ' ').slice(0, 20), count: o.count, success: o.success }))} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-accent-500">No AI usage data</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">AI Calls Over Time</h3>
          <div className="h-64">
            {aiUsage.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aiUsage.byDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="Total Calls" stroke="#8b5cf6" fill="url(#aiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-accent-500">No data</div>
            )}
          </div>
        </div>
      </div>
      {security.bySeverity.length > 0 && (
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">Security Incidents by Severity</h3>
          <div className="flex flex-wrap gap-4">
            {security.bySeverity.map((s) => (
              <div key={s.severity} className="rounded-lg border border-accent-200 px-4 py-2">
                <span className="text-sm text-accent-600">{s.severity}</span>
                <span className="ml-2 font-bold text-accent-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
