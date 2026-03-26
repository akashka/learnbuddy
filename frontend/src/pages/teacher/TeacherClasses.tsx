import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { useNavigate } from 'react-router-dom';
import ClassReplayViewer from '@/components/classroom/ClassReplayViewer';

interface Session {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  student?: { name?: string };
  subject?: string;
  recordingUrl?: string;
  aiMonitoringAlerts?: { type: string; severity: string; message: string; timestamp: string }[];
  warningCounts?: { teacher: number; student: number };
}

interface Response {
  past: Session[];
  upcoming: Session[];
}

export default function TeacherClasses() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [replaySessionId, setReplaySessionId] = useState<string | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    apiJson<Response>('/api/teacher/classes')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading classes...</p>
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');
  const upcoming = data?.upcoming || [];
  const past = data?.past || [];

  return (
    <div className="w-full animate-fade-in">
      {replaySessionId && (
        <ClassReplayViewer sessionId={replaySessionId} onClose={() => setReplaySessionId(null)} />
      )}

      <PageHeader
        icon="📅"
        title={t('myClasses')}
        subtitle={`${upcoming.length} upcoming · ${past.length} past`}
      />
      <div className="relative mb-6 overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
        <h2 className="relative mb-4 font-semibold text-brand-700">Upcoming</h2>
        <div className="relative space-y-3">
          {upcoming.map((s, idx) => {
            const scheduledAt = s.scheduledAt ? new Date(s.scheduledAt).getTime() : 0;
            const windowStart = scheduledAt - 5 * 60 * 1000;
            const canJoin = now >= windowStart && s.status !== 'completed';
            const diffMs = windowStart - now;
            const diffMin = Math.ceil(diffMs / 60000);

            return (
              <div
                key={s._id}
                className="animate-slide-up flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white/80 p-4 shadow-sm"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div>
                  <p className="font-semibold">{s.subject}</p>
                  <p className="text-sm text-gray-600">
                    {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
                  </p>
                </div>
                {s.status === 'in_progress' || canJoin ? (
                  <button
                    onClick={() => navigate(`/classroom/pre-join/${s._id}`)}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                  >
                    {s.status === 'in_progress' ? 'Rejoin Class' : 'Prepare to Join'}
                  </button>
                ) : (
                  <button disabled className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500">
                    Opens in {diffMin > 60 ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m` : `${diffMin}m`}
                  </button>
                )}
              </div>
            );
          })}
          {upcoming.length === 0 && <p className="text-gray-600">No upcoming classes</p>}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg">
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
        <h2 className="relative mb-4 font-semibold text-brand-700">Past</h2>
        <div className="relative space-y-3">
          {past.map((s, idx) => {
            const violationCount = (s.warningCounts?.teacher ?? 0) + (s.warningCounts?.student ?? 0);
            return (
              <div
                key={s._id}
                className="animate-slide-up flex items-center justify-between gap-4 rounded-xl border-2 border-brand-100 bg-white/80 p-4 shadow-sm"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{s.subject}</p>
                    {s.status === 'completed' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">✅ Completed</span>
                    )}
                    {s.status === 'cancelled' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">❌ Cancelled</span>
                    )}
                    {violationCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        ⚠️ {violationCount} violation{violationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {s.student?.name} · {formatDate(s.scheduledAt)}
                  </p>
                </div>
                {s.status === 'completed' && (
                  <button
                    onClick={() => setReplaySessionId(s._id)}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 hover:border-brand-400"
                  >
                    ▶ View
                  </button>
                )}
              </div>
            );
          })}
          {past.length === 0 && <p className="text-gray-600">No past classes</p>}
        </div>
      </div>
    </div>
  );
}
