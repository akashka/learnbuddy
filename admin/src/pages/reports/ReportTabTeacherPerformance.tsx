import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@shared/formatters';

const CHART_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportTabTeacherPerformance() {
  const [sortBy, setSortBy] = useState('revenue');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.teacherPerformance>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.teacherPerformance({ limit: 50, sort: sortBy, order }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, [sortBy, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadCsv = () => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
    fetch(`${base}/api/admin/reports/teacher-performance/export`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher-performance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { teachers, summary } = data;
  const topByRevenue = teachers.slice(0, 10);
  const ratingDistribution = [
    { name: '4.5+ stars', value: teachers.filter((t) => (t.avgRating ?? 0) >= 4.5).length, color: CHART_COLORS[2] },
    { name: '4.0-4.5', value: teachers.filter((t) => (t.avgRating ?? 0) >= 4 && (t.avgRating ?? 0) < 4.5).length, color: CHART_COLORS[1] },
    { name: '3.5-4.0', value: teachers.filter((t) => (t.avgRating ?? 0) >= 3.5 && (t.avgRating ?? 0) < 4).length, color: CHART_COLORS[0] },
    { name: '< 3.5', value: teachers.filter((t) => (t.avgRating ?? 0) < 3.5 && t.avgRating != null).length, color: CHART_COLORS[3] },
    { name: 'No rating', value: teachers.filter((t) => t.avgRating == null).length, color: CHART_COLORS[4] },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-accent-300 px-3 py-2 text-sm">
            <option value="revenue">Sort by Revenue</option>
            <option value="rating">Sort by Rating</option>
            <option value="completion">Sort by Completion</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')} className="rounded-lg border border-accent-300 px-3 py-2 text-sm">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <button type="button" onClick={downloadCsv} className="rounded-lg border-2 border-accent-300 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Download CSV</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Teachers', value: summary.totalTeachers, icon: '👩‍🏫' },
          { label: 'Avg Rating', value: summary.avgRating ?? 'N/A', icon: '⭐' },
          { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), icon: '💰' },
          { label: 'Avg Completion', value: summary.avgCompletionRate != null ? `${summary.avgCompletionRate}%` : 'N/A', icon: '📅' },
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
          <h3 className="mb-4 font-semibold text-accent-800">Top 10 Teachers by Revenue</h3>
          <div className="h-64">
            {topByRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByRevenue.map((t) => ({ name: t.teacherName.slice(0, 15), revenue: t.revenue }))} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-accent-500">No data</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">Rating Distribution</h3>
          <div className="h-64">
            {ratingDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ratingDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {ratingDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-accent-500">No rating data</div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border-2 border-accent-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-accent-200">
            <thead className="bg-accent-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-accent-600">Teacher</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Rating</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Reviews</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Completion %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Classes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent-100">
              {teachers.map((t) => (
                <tr key={t.teacherId} className="hover:bg-accent-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-accent-900">{t.teacherName}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{t.avgRating ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{t.reviewCount}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{t.completionRate != null ? `${t.completionRate}%` : '—'}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{t.completedClasses}/{t.scheduledClasses}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-emerald-700">{formatCurrency(t.revenue)}</td>
                  <td className="px-4 py-3 text-right text-sm text-accent-700">{t.activeEnrollments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
