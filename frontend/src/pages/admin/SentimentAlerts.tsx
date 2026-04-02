import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';

interface AIAlert {
  _id: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  userId: string;
  userRole: string;
  acknowledged: boolean;
  createdAt: string;
}

export default function SentimentAlerts() {
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const data = await apiJson<{ alerts: AIAlert[] }>('/api/admin/ai-alerts');
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Failed to fetch AI alerts', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (id: string, current: boolean) => {
    try {
      await apiJson('/api/admin/ai-alerts', {
        method: 'PATCH',
        body: JSON.stringify({ alertId: id, acknowledged: !current })
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to toggle alert state', err);
    }
  };

  if (loading && alerts.length === 0) return <div className="p-8 text-center text-brand-600">Monitoring Student Wellbeing...</div>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Proactive Student Sentiment Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">AI-detected alerts for students who may be frustrated, struggling, or showing negative sentiment.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 font-medium text-gray-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Alert Details</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No active sentiment alerts found. All students seem healthy! ✨
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id} className={`${alert.acknowledged ? 'bg-gray-50/50' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-medium ${alert.acknowledged ? 'text-gray-500' : 'text-gray-900'}`}>
                        {alert.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {alert.userId}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleAcknowledge(alert._id, alert.acknowledged)}
                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                          alert.acknowledged 
                            ? 'bg-gray-100 text-gray-500' 
                            : 'bg-brand-50 text-brand-700 hover:bg-brand-100 shadow-sm'
                        }`}
                      >
                        {alert.acknowledged ? 'Done' : 'Mark Reviewed'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-brand-50/50 p-6 border border-brand-100">
        <h4 className="font-bold text-brand-800 flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How it works
        </h4>
        <p className="text-sm text-brand-700 leading-relaxed">
          The AI Sentiment Monitoring job runs periodically to analyze interactions from the last 24 hours. 
          If a student consistently shows low sentiment scores (less than 0.4 average) or triggers content safety flags, a proactive alert is generated here. 
          This allows counselors and admins to intervene early if a student is experiencing high levels of frustration or burnout.
        </p>
      </div>
    </div>
  );
}
