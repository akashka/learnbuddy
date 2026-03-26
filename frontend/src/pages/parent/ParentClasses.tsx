import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { LearnerFilterChips } from '@/components/LearnerFilterChips';
import { useParentLearnerOptions } from '@/hooks/useParentLearnerOptions';
import { useLanguage } from '@/contexts/LanguageContext';
import ClassReplayViewer from '@/components/classroom/ClassReplayViewer';

interface Session {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  student?: { name?: string };
  studentMongoIds?: string[];
  teacher?: { name?: string };
  subject?: string;
  recordingUrl?: string;
  warningCounts?: { teacher: number; student: number };
}

interface Response {
  past: Session[];
  upcoming: Session[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Live Now!', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function ParentClasses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStudentId = searchParams.get('studentId') || '';
  const { options: learnerOptions } = useParentLearnerOptions();

  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replaySessionId, setReplaySessionId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<Response>('/api/parent/classes')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = useMemo(() => {
    const list = data?.upcoming || [];
    if (!filterStudentId) return list;
    return list.filter((s) => (s.studentMongoIds || []).includes(filterStudentId));
  }, [data?.upcoming, filterStudentId]);

  const past = useMemo(() => {
    const list = data?.past || [];
    if (!filterStudentId) return list;
    return list.filter((s) => (s.studentMongoIds || []).includes(filterStudentId));
  }, [data?.past, filterStudentId]);

  const setStudentFilter = (studentId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (studentId) next.set('studentId', studentId);
      else next.delete('studentId');
      return next;
    });
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div className="space-y-6">
      {replaySessionId && (
        <ClassReplayViewer sessionId={replaySessionId} onClose={() => setReplaySessionId(null)} />
      )}

      <h1 className="mb-4 text-2xl font-bold text-brand-800">{t('myClasses')}</h1>
      {learnerOptions.length > 0 && (
        <LearnerFilterChips
          className="mb-6"
          options={learnerOptions}
          selectedId={filterStudentId}
          onChange={setStudentFilter}
        />
      )}

      {/* Upcoming */}
      <div>
        <h2 className="mb-3 font-semibold text-brand-700">Upcoming</h2>
        <div className="space-y-2">
          {upcoming.map((s) => {
            const statusInfo = STATUS_LABEL[s.status || ''] || { label: s.status || '', color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={s._id} className="flex items-center justify-between gap-4 rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{s.subject || '-'}</p>
                  <p className="text-sm text-gray-500">
                    👩‍🏫 {s.teacher?.name || '-'} · 👦 {s.student?.name || '-'} · {formatDate(s.scheduledAt)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
          {upcoming.length === 0 && (
            <p className="text-gray-600">{filterStudentId ? 'No upcoming classes for this learner.' : 'No upcoming classes'}</p>
          )}
        </div>
      </div>

      {/* Past */}
      <div>
        <h2 className="mb-3 font-semibold text-brand-700">Past</h2>
        <div className="space-y-2">
          {past.map((s) => {
            const statusInfo = STATUS_LABEL[s.status || ''] || { label: s.status || '', color: 'bg-gray-100 text-gray-600' };
            const violationCount = (s.warningCounts?.teacher ?? 0) + (s.warningCounts?.student ?? 0);
            return (
              <div key={s._id} className="flex items-center justify-between gap-4 rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-sm hover:border-brand-300 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{s.subject || '-'}</p>
                    {violationCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                        ⚠️ {violationCount} violation{violationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    👩‍🏫 {s.teacher?.name || '-'} · 👦 {s.student?.name || '-'} · {formatDate(s.scheduledAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {s.status === 'completed' && (
                    <button
                      onClick={() => setReplaySessionId(s._id)}
                      className="flex items-center gap-1.5 rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 hover:border-brand-400"
                    >
                      ▶ View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {past.length === 0 && (
            <p className="text-gray-600">{filterStudentId ? 'No past classes for this learner.' : 'No past classes'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
