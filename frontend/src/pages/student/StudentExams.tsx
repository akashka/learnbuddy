import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading exams...</p>
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div className="w-full animate-fade-in">
      <PageHeader icon="📝" title={t('exams')} subtitle={`${exams.length} exam${exams.length !== 1 ? 's' : ''}`} />
      {exams.length === 0 ? (
        <EmptyState icon="📝" title="No exams yet" description="Your exam attempts will appear here." />
      ) : (
        <div className="space-y-5">
          {exams.map((e, idx) => (
            <Link
              key={e._id}
              to={`/student/exams/${e._id}`}
              className="card-funky animate-slide-up relative block overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg transition-all duration-300 hover:border-brand-300 hover:shadow-xl"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-xl">📝</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-brand-800">{e.subject || e.topic || 'Exam'}</h3>
                  <p className="text-sm text-gray-600">
                    {e.score != null && e.totalMarks != null ? `Score: ${e.score}/${e.totalMarks}` : ''}
                    {e.status && ` • ${e.status}`}
                  </p>
                  <p className="text-sm text-gray-500">Attempted: {formatDate(e.attemptedAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
