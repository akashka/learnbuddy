import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';

interface UsageStats {
  summary: {
    totalCost: number;
    totalTokens: number;
    totalCalls: number;
    successRate: number;
  };
  byProvider: { _id: string; cost: number; calls: number }[];
  byOperation: { _id: string; cost: number; calls: number }[];
  dailyTrend: { _id: string; cost: number; calls: number }[];
}

export default function AIUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await apiJson<UsageStats>(`/api/admin/ai-usage?days=${days}`);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch AI stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [days]);

  if (loading && !stats) return <div className="p-8 text-center text-brand-600">Loading AI Consumption Data...</div>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Usage & Cost Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Track token consumption and expenses across all AI providers.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Period:</span>
          <select 
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border-gray-300 py-1.5 text-sm focus:ring-brand-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Total AI Cost</p>
              <p className="mt-2 text-3xl font-bold text-brand-700">${stats.summary.totalCost.toFixed(4)}</p>
              <p className="mt-1 text-xs text-gray-400">USD (Estimated)</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Total Tokens</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{(stats.summary.totalTokens / 1000).toFixed(1)}k</p>
              <p className="mt-1 text-xs text-gray-400">Total Combined</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">API Calls</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.summary.totalCalls}</p>
              <p className="mt-1 text-xs text-gray-400">Total Invocations</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{(stats.summary.successRate * 100).toFixed(1)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                <div 
                  className="h-full rounded-full bg-green-500" 
                  style={{ width: `${stats.summary.successRate * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Costs by Operation */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="font-semibold text-gray-900">Costs by AI Operation</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.byOperation.map((op) => (
                    <div key={op._id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 capitalize">{op._id.replace(/_/g, ' ')}</span>
                        <span className="text-gray-900">${op.cost.toFixed(4)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div 
                          className="h-full rounded-full bg-brand-500" 
                          style={{ width: `${(op.cost / stats.summary.totalCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider Breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="font-semibold text-gray-900">Provider Distribution</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-6">
                  {stats.byProvider.map((p) => (
                    <div key={p._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white ${p._id === 'local_gemini' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                          {p._id === 'local_gemini' ? 'G' : 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p._id === 'local_gemini' ? 'Google Gemini' : 'AI Service Integration'}</p>
                          <p className="text-xs text-gray-500">{p.calls} calls</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${p.cost.toFixed(4)}</p>
                        <p className="text-xs text-gray-500">{((p.cost / stats.summary.totalCost) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Trend (Simple CSS Bar Chart) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="font-semibold text-gray-900">Daily Spending Trend</h3>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-1 h-48">
                  {stats.dailyTrend.map((d) => (
                    <div 
                      key={d._id} 
                      className="group relative flex-1"
                    >
                      <div 
                        className="w-full bg-brand-200 rounded-t transition-all group-hover:bg-brand-500"
                        style={{ height: `${(d.cost / Math.max(...stats.dailyTrend.map(x => x.cost), 0.01)) * 100}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap">
                          {d._id}: ${d.cost.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                  <span>{stats.dailyTrend[0]?._id}</span>
                  <span>{stats.dailyTrend[Math.floor(stats.dailyTrend.length/2)]?._id}</span>
                  <span>{stats.dailyTrend[stats.dailyTrend.length-1]?._id}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
