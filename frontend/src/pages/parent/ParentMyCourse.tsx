import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency } from '@shared/formatters';

type Course = {
  _id: string;
  batchId?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  feePerMonth?: number;
  slots?: { day: string; startTime: string; endTime: string }[];
  startDate?: string;
  endDate?: string;
  student?: { _id: string; name?: string; studentId?: string } | null;
  teacher?: { _id: string; name?: string; photoUrl?: string; profileUrl: string } | null;
};

function formatSlots(slots?: { day: string; startTime: string; endTime: string }[]): string {
  if (!slots?.length) return '—';
  return slots
    .map((s) => `${s.day} ${s.startTime}-${s.endTime}`)
    .join(', ');
}

function formatDate(d?: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ParentMyCourse() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    setError(null);
    apiJson<{ courses: Course[] }>('/api/parent/my-course')
      .then((d) => setCourses(d.courses || []))
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading && courses.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading your courses...</p>
      </div>
    );
  }

  if (error && courses.length === 0) {
    return <InlineErrorDisplay error={error} onRetry={fetchCourses} fullPage />;
  }

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="📚"
        title="My Course"
        subtitle="All batches you've purchased — students and teachers"
      />

      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-8 text-center">
          <p className="mb-4 text-brand-700">You haven't purchased any courses yet.</p>
          <Link
            to="/parent/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700"
          >
            Browse Teachers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => (
            <div
              key={c._id}
              className="rounded-2xl border-2 border-brand-200/80 bg-white p-6 shadow-lg transition hover:border-brand-300"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-brand-800">
                    {c.subject} • Class {c.classLevel}
                  </h3>
                  <p className="text-sm text-gray-600">{c.board}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Batch:</span> {c.batchId || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Schedule:</span> {formatSlots(c.slots)}
                    </p>
                    <p>
                      <span className="font-medium">Fee:</span> {formatCurrency(c.feePerMonth)}/month
                    </p>
                    <p>
                      <span className="font-medium">Period:</span> {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  {c.student && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Student</p>
                      <Link
                        to="/parent/students"
                        className="text-brand-600 font-medium hover:underline"
                      >
                        {c.student.name || c.student.studentId || 'Student'}
                      </Link>
                    </div>
                  )}
                  {c.teacher && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Teacher</p>
                      <Link
                        to={c.teacher.profileUrl}
                        className="flex items-center gap-2 text-brand-600 font-medium hover:underline"
                      >
                        {c.teacher.photoUrl ? (
                          <img
                            src={c.teacher.photoUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm">
                            {c.teacher.name?.[0] || 'T'}
                          </span>
                        )}
                        {c.teacher.name || 'Teacher'}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
