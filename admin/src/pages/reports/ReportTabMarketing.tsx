import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function ReportTabMarketing() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.reports.marketing>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.reports.marketing({ days }).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" /></div>;
  if (error && !data) return <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p><button type="button" onClick={fetchData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button></div>;
  if (!data) return null;

  const { funnel, discountUsage, funnelByDay } = data;

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
          { label: 'New Teachers', value: funnel.newTeachers, icon: '👩‍🏫' },
          { label: 'New Parents', value: funnel.newParents, icon: '👨‍👩‍👧' },
          { label: 'New Students', value: funnel.newStudents, icon: '👦' },
          { label: 'New Enrollments', value: funnel.newEnrollments, icon: '📚' },
          { label: 'Conversion Rate', value: `${funnel.conversionRate}%`, icon: '📈' },
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
        <h3 className="mb-4 font-semibold text-accent-800">Acquisition Funnel Over Time</h3>
        <div className="h-64">
          {funnelByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="teachers" name="Teachers" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="parents" name="Parents" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enrollments" name="Enrollments" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-accent-500">No data</div>
          )}
        </div>
      </div>
      {discountUsage.length > 0 && (
        <div className="rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-accent-800">Discount Code Usage</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-accent-200">
              <thead className="bg-accent-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-accent-600">Code</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Redemptions</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-accent-600">Total Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-100">
                {discountUsage.map((d) => (
                  <tr key={d.code} className="hover:bg-accent-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-accent-900">{d.code}</td>
                    <td className="px-4 py-3 text-right text-sm text-accent-700">{d.redemptions}</td>
                    <td className="px-4 py-3 text-right text-sm text-accent-700">{formatCurrency(d.totalDiscount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
