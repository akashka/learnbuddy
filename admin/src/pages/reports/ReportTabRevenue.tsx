import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@shared/formatters';

const CHART_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ReportTabRevenue() {
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.revenueBreakdown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.revenueBreakdown({ months }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, [months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadCsv = () => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
    fetch(`${base}/api/admin/reports/revenue-breakdown/export?months=${months}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-breakdown-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { byBoard, byClass, bySubject, revenueByMonth, totalRevenue } = data;
  const boardPieData = byBoard.slice(0, 6).map((b, i) => ({ name: b.name, value: b.revenue, color: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select value={months} onChange={(e) => setMonths(parseInt(e.target.value, 10))} className="rounded-lg border border-accent-300 px-3 py-2 text-sm">
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
          <option value={24}>24 months</option>
        </select>
        <button type="button" onClick={downloadCsv} className="rounded-lg border-2 border-accent-300 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Download CSV</button>
      </div>
      <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <p className="text-sm font-medium text-emerald-700">Total Revenue (period)</p>
        <p className="text-3xl font-bold text-emerald-800">{formatCurrency(totalRevenue)}</p>
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Revenue Over Time</h3>
        <div className="h-72">
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs><linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 10000}L`} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No revenue data</div>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">Revenue by Board</h3>
          <div className="h-64">
            {boardPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={boardPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ₹${(value / 1000).toFixed(0)}k`}>
                    {boardPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-accent-500">No data</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">Revenue by Class</h3>
          <div className="h-64">
            {byClass.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byClass} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-accent-500">No data</div>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Revenue by Subject</h3>
        <div className="h-64">
          {bySubject.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No data</div>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: 'By Board', data: byBoard },
          { title: 'By Class', data: byClass },
          { title: 'By Subject', data: bySubject },
        ].map(({ title, data: rows }) => (
          <div key={title} className="overflow-hidden rounded-xl border-2 border-accent-200 bg-white shadow-sm">
            <h3 className="border-b border-accent-200 bg-accent-50 px-4 py-3 font-semibold text-accent-800">{title}</h3>
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full">
                <tbody className="divide-y divide-accent-100">
                  {rows.slice(0, 10).map((r) => (
                    <tr key={r.name} className="hover:bg-accent-50/50">
                      <td className="px-4 py-2 text-sm font-medium text-accent-900">{r.name}</td>
                      <td className="px-4 py-2 text-right text-sm text-accent-700">{formatCurrency(r.revenue)}</td>
                      <td className="px-4 py-2 text-right text-xs text-accent-500">{r.count} enrollments</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
