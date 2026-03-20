import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';

interface Session {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  student?: { name?: string };
  subject?: string;
}

interface Response {
  past: Session[];
  upcoming: Session[];
}

export default function TeacherClasses() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

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
      <PageHeader
        icon="📅"
        title={t('myClasses')}
        subtitle={`${upcoming.length} upcoming · ${past.length} past`}
      />
      <div className="relative mb-6 overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
        <h2 className="relative mb-4 font-semibold text-brand-700">Upcoming</h2>
        <div className="relative space-y-3">
          {upcoming.map((s, idx) => (
            <div
              key={s._id}
              className="animate-slide-up rounded-xl border-2 border-brand-100 bg-white/80 p-4 shadow-sm"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {s.subject} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-gray-600">No upcoming classes</p>}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg">
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
        <h2 className="relative mb-4 font-semibold text-brand-700">Past</h2>
        <div className="relative space-y-3">
          {past.map((s, idx) => (
            <div
              key={s._id}
              className="animate-slide-up rounded-xl border-2 border-brand-100 bg-white/80 p-4 shadow-sm"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {s.subject} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
            </div>
          ))}
          {past.length === 0 && <p className="text-gray-600">No past classes</p>}
        </div>
      </div>
    </div>
  );
}
