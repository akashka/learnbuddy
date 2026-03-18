import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';

interface Performance {
  _id: string;
  student?: { name?: string };
  subject?: string;
  type?: string;
  score?: number;
  totalMarks?: number;
  date?: string;
}

export default function ParentPerformances() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<{ performances: Performance[] }>('/api/parent/performances')
      .then((d) => setPerformances(d.performances || []))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Children&apos;s Exam Performances</h1>
      <div className="space-y-4">
        {performances.map((p) => (
          <Link
            key={p._id}
            to={`/parent/exam/${p._id}`}
            className="block rounded-xl border border-brand-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-brand-800">
              {p.student?.name || 'Student'} – {p.subject || 'Exam'}
            </h3>
            <p className="text-sm text-gray-600">
              Score: {p.score ?? '-'}/{p.totalMarks ?? '-'} • {formatDate(p.date)}
            </p>
          </Link>
        ))}
      </div>
      {performances.length === 0 && <p className="text-gray-600">No exam performances yet.</p>}
    </div>
  );
}
