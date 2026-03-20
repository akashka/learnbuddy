import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { formatCurrency } from '@shared/formatters';

export default function ReportTabCohorts() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.cohorts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.cohorts({ months }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, [months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadCsv = () => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
    fetch(`${base}/api/admin/reports/cohorts/export?months=${months}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cohort-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { cohortDetails, summary } = data;
  const retentionChartData = cohortDetails.map((c) => ({ month: c.cohortMonth, retention: c.retentionRate, churn: c.churnRate, enrolled: c.enrolled, revenue: c.totalRevenue }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select value={months} onChange={(e) => setMonths(parseInt(e.target.value, 10))} className="rounded-lg border border-accent-300 px-3 py-2 text-sm">
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
        </select>
        <button type="button" onClick={downloadCsv} className="rounded-lg border-2 border-accent-300 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Download CSV</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Cohorts', value: summary.totalCohorts, icon: '📊' },
          { label: 'Avg Retention', value: `${summary.avgRetention}%`, icon: '📈' },
          { label: 'Avg Churn', value: `${summary.avgChurn}%`, icon: '📉' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border-2 border-accent-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div><p className="text-sm text-accent-600">{m.label}</p><p className="text-2xl font-bold text-accent-900">{m.value}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Retention vs Churn by Cohort</h3>
        <div className="h-72">
          {retentionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? `${v}%` : String(v ?? ''))} />
                <Legend />
                <Bar dataKey="retention" name="Retention %" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churn" name="Churn %" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No cohort data</div>
          )}
        </div>
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Revenue by Cohort</h3>
        <div className="h-64">
          {retentionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No data</div>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border-2 border-accent-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-accent-200">
            <thead className="bg-accent-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-accent-600">Cohort</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Enrolled</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Active</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Retention %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Churn %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent-100">
              {cohortDetails.map((c) => (
                <tr key={c.cohortMonth} className="hover:bg-accent-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-accent-900">{c.cohortMonth}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{c.enrolled}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{c.stillActive}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">{c.retentionRate}%</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-red-600">{c.churnRate}%</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{formatCurrency(c.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
