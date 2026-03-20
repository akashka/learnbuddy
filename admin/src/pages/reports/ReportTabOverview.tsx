import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '@shared/formatters';

export default function ReportTabOverview() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.overview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.overview().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadCsv = () => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
    fetch(`${base}/api/admin/reports/overview`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        const m = d.metrics || {};
        const rows = [['Metric', 'Value'], ['Teachers', m.teachers], ['Parents', m.parents], ['Students', m.students], ['Enrollments', m.enrollments], ['Active Enrollments', m.activeEnrollments], ['Total Revenue (₹)', m.totalRevenue], ['Revenue Last 30 Days (₹)', m.revenueLast30Days], ['Revenue Growth %', m.revenueGrowthPercent], ['New Teachers (30d)', m.newTeachersLast30], ['New Parents (30d)', m.newParentsLast30], ['New Students (30d)', m.newStudentsLast30], ['New Enrollments (30d)', m.newEnrollmentsLast30], ['Class Completion %', m.classCompletionRate], ['Avg Teacher Rating', m.avgTeacherRating ?? ''], ['Total Reviews', m.totalReviews]];
        const csv = rows.map((r) => r.map((v) => `"${String(v)}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `executive-overview-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
  };

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { metrics, enrollmentsByDay } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><button type="button" onClick={downloadCsv} className="rounded-lg border-2 border-accent-300 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Download CSV</button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue), sub: `+${metrics.revenueGrowthPercent}% vs prev 30d`, highlight: true },
          { label: 'Active Enrollments', value: formatNumber(metrics.activeEnrollments), sub: `${formatNumber(metrics.enrollments)} total` },
          { label: 'Teachers', value: formatNumber(metrics.teachers), sub: `+${metrics.newTeachersLast30} new (30d)` },
          { label: 'Students', value: formatNumber(metrics.students), sub: `+${metrics.newStudentsLast30} new (30d)` },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border-2 border-accent-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-accent-600">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.highlight ? 'text-emerald-700' : 'text-accent-900'}`}>{card.value}</p>
            <p className="mt-0.5 text-xs text-accent-500">{card.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Class Completion Rate', value: `${metrics.classCompletionRate}%`, icon: '📅' },
          { label: 'Avg Teacher Rating', value: metrics.avgTeacherRating ?? 'N/A', icon: '⭐' },
          { label: 'Total Reviews', value: formatNumber(metrics.totalReviews), icon: '💬' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-accent-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div><p className="text-sm text-accent-600">{m.label}</p><p className="text-lg font-semibold text-accent-900">{m.value}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Enrollments (Last 30 Days)</h3>
        <div className="h-64">
          {enrollmentsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentsByDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs><linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#overviewGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No enrollment data</div>
          )}
        </div>
      </div>
    </div>
  );
}
