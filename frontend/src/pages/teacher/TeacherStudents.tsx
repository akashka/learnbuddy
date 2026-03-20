import { useEffect, useState, useCallback } from 'react';
import { apiJson } from '@/lib/api';
import { formatDate, formatCurrency, formatDateTime } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

interface StudentData {
  enrollmentId: string;
  student: {
    _id: string;
    name?: string;
    studentId?: string;
    classLevel?: string;
    board?: string;
    schoolName?: string;
  } | null;
  parent: { name?: string; phone?: string; email?: string } | null;
  course: {
    subject: string;
    batchId?: string;
    board?: string;
    classLevel?: string;
    feePerMonth?: number;
    startDate?: string;
    endDate?: string;
    duration?: number;
  };
  stats: {
    examsCount: number;
    exams: { subject: string; score: number; totalMarks: number; attemptedAt: string }[];
    classesCompleted: number;
    studyMaterialsRead: number;
  };
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchStudents = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<{ students: StudentData[] }>('/api/teacher/students')
      .then((d) => setStudents(d.students || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filterOptions = {
    subjects: Array.from(new Set(students.map((s) => s.course.subject).filter(Boolean))).sort(),
  };

  const filtered = filterSubject
    ? students.filter((s) => s.course.subject === filterSubject)
    : students;

  if (loading && students.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading students...</p>
      </div>
    );
  }

  if (error && students.length === 0) {
    return <InlineErrorDisplay error={error} onRetry={fetchStudents} fullPage />;
  }

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👥"
        title="Students"
        subtitle={
          filtered.length > 0
            ? `${filtered.length} enrolled student${filtered.length !== 1 ? 's' : ''}`
            : 'View enrolled students, progress & details'
        }
        action={
          <div className="flex items-center gap-2">
            {filterOptions.subjects.length > 0 && (
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-lg transition hover:bg-white/95 lg:hidden"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </button>
            )}
            <button
              type="button"
              onClick={fetchStudents}
              disabled={loading}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-lg transition hover:bg-white/95 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {(students.length > 0 || filterSubject) && (
          <FilterSidebar
            title="Filter"
            className={`${filtersOpen ? 'block' : 'hidden lg:block'}`}
            footer={
              <p className="text-sm font-medium text-gray-600">
                {filtered.length} student{filtered.length !== 1 ? 's' : ''}
              </p>
            }
          >
            <div>
              <label htmlFor="filter-subject" className="mb-1.5 block text-xs font-medium text-gray-600">
                Subject
              </label>
              <select
                id="filter-subject"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">All subjects</option>
                {filterOptions.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </FilterSidebar>
        )}

        <main className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <ContentCard>
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-3xl">
                  👥
                </div>
                <h2 className="mt-6 text-xl font-semibold text-gray-900">No students yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                  Students will appear here once they enroll in your batches.
                </p>
              </div>
            </ContentCard>
          ) : (
            <div className="space-y-6">
              {filtered.map((s) => (
                <StudentCard key={s.enrollmentId} data={s} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StudentCard({ data }: { data: StudentData }) {
  const [expanded, setExpanded] = useState(false);
  const { student, parent, course, stats } = data;
  const name = student?.name || student?.studentId || 'Student';

  return (
    <ContentCard>
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{name}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {[student?.board, student?.classLevel, student?.schoolName].filter(Boolean).join(' • ') || '—'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                {course.subject}
              </span>
              {course.board && (
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {course.board}
                </span>
              )}
              {course.classLevel && (
                <span className="rounded-lg bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-800">
                  {course.classLevel}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            {expanded ? 'Show less' : 'View details'}
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBadge icon="📅" label="Classes" value={stats.classesCompleted} />
          <StatBadge icon="📝" label="Exams" value={stats.examsCount} />
          <StatBadge icon="📚" label="Materials read" value={stats.studyMaterialsRead} />
          <StatBadge icon="💰" label="Fee" value={formatCurrency(course.feePerMonth ?? 0)} />
        </div>

        {expanded && (
          <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
            {/* Course details */}
            <Section title="Course">
              <ul className="space-y-1 text-sm text-gray-700">
                <li>
                  <strong>Subject:</strong> {course.subject}
                </li>
                {course.duration != null && (
                  <li>
                    <strong>Duration:</strong> {course.duration} months
                  </li>
                )}
                {course.startDate && (
                  <li>
                    <strong>Start:</strong> {formatDate(course.startDate)}
                  </li>
                )}
                {course.endDate && (
                  <li>
                    <strong>End:</strong> {formatDate(course.endDate)}
                  </li>
                )}
                <li>
                  <strong>Fee:</strong> {formatCurrency(course.feePerMonth ?? 0)}/month
                </li>
              </ul>
            </Section>

            {/* Parent details */}
            {parent && (
              <Section title="Parent">
                <ul className="space-y-1 text-sm text-gray-700">
                  {parent.name && <li>{parent.name}</li>}
                  {parent.phone && <li>📞 {parent.phone}</li>}
                  {parent.email && <li>✉️ {parent.email}</li>}
                </ul>
              </Section>
            )}

            {/* Exam history */}
            {stats.exams.length > 0 && (
              <Section title="Recent exams">
                <div className="space-y-2">
                  {stats.exams.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span>{ex.subject}</span>
                      <span className="font-medium text-brand-700">
                        {ex.score}/{ex.totalMarks}
                      </span>
                      <span className="text-gray-500">{formatDateTime(ex.attemptedAt)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </ContentCard>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <span className="text-lg" aria-hidden>
        {icon}
      </span>
      <p className="mt-0.5 text-xs font-medium text-gray-600">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-600">{title}</h4>
      {children}
    </div>
  );
}
