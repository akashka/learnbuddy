import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { LearnerFilterChips } from '@/components/LearnerFilterChips';
import { useParentLearnerOptions } from '@/hooks/useParentLearnerOptions';
import { useLanguage } from '@/contexts/LanguageContext';

interface Session {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  student?: { name?: string };
  studentMongoIds?: string[];
  teacher?: { name?: string };
  subject?: string;
}

interface Response {
  past: Session[];
  upcoming: Session[];
}

export default function ParentClasses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStudentId = searchParams.get('studentId') || '';
  const { options: learnerOptions } = useParentLearnerOptions();

  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-800">{t('myClasses')}</h1>
      {learnerOptions.length > 0 && (
        <LearnerFilterChips
          className="mb-6"
          options={learnerOptions}
          selectedId={filterStudentId}
          onChange={setStudentFilter}
        />
      )}
      <h2 className="mb-2 font-semibold text-brand-700">Upcoming</h2>
      <div className="mb-6 space-y-2">
        {upcoming.map((s) => (
          <div key={s._id} className="rounded-lg border border-brand-100 bg-white p-3">
            {s.subject} • {s.teacher?.name} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
          </div>
        ))}
        {upcoming.length === 0 && (
          <p className="text-gray-600">{filterStudentId ? 'No upcoming classes for this learner.' : 'No upcoming classes'}</p>
        )}
      </div>
      <h2 className="mb-2 font-semibold text-brand-700">Past</h2>
      <div className="space-y-2">
        {past.map((s) => (
          <div key={s._id} className="rounded-lg border border-brand-100 bg-white p-3">
            {s.subject} • {s.teacher?.name} • {s.student?.name} • {formatDate(s.scheduledAt)} ({s.status})
          </div>
        ))}
        {past.length === 0 && (
          <p className="text-gray-600">{filterStudentId ? 'No past classes for this learner.' : 'No past classes'}</p>
        )}
      </div>
    </div>
  );
}
