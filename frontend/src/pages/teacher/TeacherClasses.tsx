import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

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

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('myClasses')}</h1>
      <h2 className="mb-2 font-semibold text-brand-700">Upcoming</h2>
      <div className="mb-6 space-y-2">
        {(data?.upcoming || []).map((s) => (
          <div key={s._id} className="rounded-lg border border-brand-100 bg-white p-3">
            {s.subject} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
          </div>
        ))}
        {(!data?.upcoming || data.upcoming.length === 0) && <p className="text-gray-600">No upcoming classes</p>}
      </div>
      <h2 className="mb-2 font-semibold text-brand-700">Past</h2>
      <div className="space-y-2">
        {(data?.past || []).map((s) => (
          <div key={s._id} className="rounded-lg border border-brand-100 bg-white p-3">
            {s.subject} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
          </div>
        ))}
        {(!data?.past || data.past.length === 0) && <p className="text-gray-600">No past classes</p>}
      </div>
    </div>
  );
}
