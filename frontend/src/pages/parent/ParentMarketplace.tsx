import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { formatCurrency } from '@shared/formatters';

interface Teacher {
  _id: string;
  name?: string;
  board?: string[];
  classes?: string[];
  subjects?: string[];
  averageRating?: number | null;
  reviewCount?: number;
  feeStartsFrom?: number;
  batches?: { name?: string; subject?: string }[];
}

export default function ParentMarketplace() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchTeachers = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<Teacher[]>('/api/teachers/marketplace')
      .then(setTeachers)
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchTeachers} fullPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('marketplace')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <div key={teacher._id} className="rounded-xl border border-brand-200 bg-white p-4 shadow">
            <h3 className="font-semibold text-brand-800">{teacher.name || 'Teacher'}</h3>
            <p className="text-sm text-gray-600">
              {[teacher.board, teacher.classes, teacher.subjects].flat().filter(Boolean).join(' • ') || 'No details'}
            </p>
            {teacher.averageRating != null && (
              <p className="text-sm">Rating: {teacher.averageRating} ({teacher.reviewCount || 0} reviews)</p>
            )}
            {teacher.feeStartsFrom != null && (
              <p className="text-sm font-medium">{t('fee')}: {formatCurrency(teacher.feeStartsFrom ?? 0)}/month</p>
            )}
            <Link
              to={`/parent/checkout?teacherId=${teacher._id}&batchIndex=0&duration=3months`}
              className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              Enroll
            </Link>
          </div>
        ))}
      </div>
      {teachers.length === 0 && <p className="text-gray-600">No teachers found.</p>}
    </div>
  );
}
