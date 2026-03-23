import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { LearnerFilterChips } from '@/components/LearnerFilterChips';
import { useParentLearnerOptions } from '@/hooks/useParentLearnerOptions';

interface Performance {
  _id: string;
  student?: { name?: string };
  studentMongoId?: string;
  subject?: string;
  type?: string;
  score?: number;
  totalMarks?: number;
  date?: string;
}

export default function ParentPerformances() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStudentId = searchParams.get('studentId') || '';
  const { options: learnerOptions } = useParentLearnerOptions();

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<{ performances: Performance[] }>('/api/parent/performances')
      .then((d) => setPerformances(d.performances || []))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filterStudentId) return performances;
    return performances.filter((p) => p.studentMongoId === filterStudentId);
  }, [performances, filterStudentId]);

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
      <h1 className="mb-4 text-2xl font-bold text-brand-800">Children&apos;s Exam Performances</h1>
      {learnerOptions.length > 0 && (
        <LearnerFilterChips
          className="mb-6"
          options={learnerOptions}
          selectedId={filterStudentId}
          onChange={setStudentFilter}
        />
      )}
      <div className="space-y-4">
        {filtered.map((p) => (
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
      {filtered.length === 0 && (
        <p className="text-gray-600">
          {filterStudentId ? 'No exam performances for this learner yet.' : 'No exam performances yet.'}
        </p>
      )}
    </div>
  );
}
