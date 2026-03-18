import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportTabOperations() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.operations>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.operations({ days }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { metrics, sessionsByDay, bySubject } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="rounded-lg border border-accent-300 px-3 py-2 text-sm">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Scheduled Classes', value: metrics.scheduledClasses, icon: '📅' },
          { label: 'Completed', value: metrics.completedClasses, icon: '✅' },
          { label: 'Completion Rate', value: `${metrics.completionRate}%`, icon: '📊' },
          { label: 'Pending Enrollments', value: metrics.pendingEnrollments, icon: '⏳' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border-2 border-accent-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div><p className="text-sm text-accent-600">{m.label}</p><p className="text-xl font-bold text-accent-900">{m.value}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Sessions: Scheduled vs Completed</h3>
        <div className="h-64">
          {sessionsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionsByDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="opsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#f59e0b" fill="#fef3c7" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="url(#opsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No session data</div>
          )}
        </div>
      </div>
      <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-accent-800">Completed Classes by Subject</h3>
        <div className="h-64">
          {bySubject.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
