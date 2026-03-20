import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@shared/formatters';

interface Course {
  _id: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  teacher?: string;
  feePerMonth?: number;
  slots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
}

interface Response {
  courses: Course[];
}

export default function StudentCourses() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<Response>('/api/student/courses')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const courses = data?.courses || [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Courses</h1>
      <div className="space-y-4">
        {courses.map((c) => (
          <div key={c._id} className="rounded-xl border border-brand-200 bg-white p-4">
            <h3 className="font-semibold text-brand-800">{c.subject || 'Course'}</h3>
            <p className="text-sm text-gray-600">
              {c.board} • {c.classLevel} • Teacher: {c.teacher || '-'}
            </p>
            <p className="text-sm">{t('fee')}: {formatCurrency(c.feePerMonth ?? 0)}/month</p>
            {c.slots && c.slots.length > 0 && (
              <p className="text-sm">
                Slots: {c.slots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}
              </p>
            )}
            <Link
              to={`/student/exam/take?subject=${encodeURIComponent(c.subject || '')}&board=${encodeURIComponent(c.board || '')}&classLevel=${encodeURIComponent(c.classLevel || '')}`}
              className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              {t('takeExam') || 'Take Exam'}
            </Link>
          </div>
        ))}
      </div>
      {courses.length === 0 && <p className="text-gray-600">No courses enrolled.</p>}
    </div>
  );
}
