import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Exam {
  _id: string;
  subject?: string;
  topic?: string;
  score?: number;
  totalMarks?: number;
  status?: string;
  attemptedAt?: string;
}

interface Response {
  exams?: Exam[];
}

export default function StudentExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<Exam[] | Response>('/api/student/exams')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as Response).exams || [];
        setExams(list);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('exams')}</h1>
      <div className="space-y-4">
        {exams.map((e) => (
          <Link
            key={e._id}
            to={`/student/exams/${e._id}`}
            className="block rounded-xl border border-brand-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-brand-800">{e.subject || e.topic || 'Exam'}</h3>
            <p className="text-sm text-gray-600">
              {e.score != null && e.totalMarks != null
                ? `Score: ${e.score}/${e.totalMarks}`
                : ''}
              {e.status && ` • ${e.status}`}
            </p>
            <p className="text-sm">Attempted: {formatDate(e.attemptedAt)}</p>
          </Link>
        ))}
      </div>
      {exams.length === 0 && <p className="text-gray-600">No exams yet.</p>}
    </div>
  );
}
