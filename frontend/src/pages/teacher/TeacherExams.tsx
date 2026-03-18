import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';

interface Exam {
  _id: string;
  subject?: string;
  topic?: string;
  score?: number;
  totalMarks?: number;
  status?: string;
  attemptedAt?: string;
  studentId?: { name?: string; studentId?: string };
}

export default function TeacherExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<{ exams: Exam[] }>('/api/teacher/exams')
      .then((d) => setExams(d.exams || []))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Student Exams</h1>
      <div className="space-y-4">
        {exams.map((e) => (
          <Link
            key={e._id}
            to={`/teacher/exam/${e._id}`}
            className="block rounded-xl border border-brand-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-brand-800">
              {e.studentId && typeof e.studentId === 'object' && 'name' in e.studentId
                ? (e.studentId as { name?: string }).name
                : 'Student'}{' '}
              – {e.subject || e.topic || 'Exam'}
            </h3>
            <p className="text-sm text-gray-600">
              Score: {e.score ?? '-'}/{e.totalMarks ?? '-'} • {formatDate(e.attemptedAt)}
            </p>
          </Link>
        ))}
      </div>
      {exams.length === 0 && <p className="text-gray-600">No completed exams yet.</p>}
    </div>
  );
}
