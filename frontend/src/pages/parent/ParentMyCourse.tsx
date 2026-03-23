import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiJson, resolveMediaUrl } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { LearnerFilterChips } from '@/components/LearnerFilterChips';
import { useParentLearnerOptions } from '@/hooks/useParentLearnerOptions';
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
  student?: { _id: string; name?: string; studentId?: string; photoUrl?: string } | null;
  teacher?: { _id: string; name?: string; photoUrl?: string; profileUrl: string } | null;
};

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const;

function subjectEmoji(subject?: string): string {
  const s = (subject || '').toLowerCase();
  if (s.includes('math')) return '🔢';
  if (s.includes('science') || s.includes('physics') || s.includes('chem') || s.includes('bio')) return '🔬';
  if (s.includes('english')) return '📖';
  if (s.includes('hindi') || s.includes('sanskrit')) return '✍️';
  if (s.includes('computer') || s.includes('coding')) return '💻';
  if (s.includes('social')) return '🌍';
  return '📚';
}

function formatSlots(slots?: { day: string; startTime: string; endTime: string }[]): string {
  if (!slots?.length) return '—';
  return slots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ');
}

function formatDate(d?: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DetailChip({
  icon,
  label,
  value,
  className = '',
}: {
  icon: string;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-white/70 bg-white/55 px-3.5 py-3 shadow-sm backdrop-blur-sm transition group-hover:bg-white/75 ${className}`}
    >
      <span className="text-xl leading-none select-none" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600/80">{label}</p>
        <p className="text-sm font-semibold text-brand-900">{value}</p>
      </div>
    </div>
  );
}

export default function ParentMyCourse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStudentId = searchParams.get('studentId') || '';
  const { options: learnerOptions } = useParentLearnerOptions();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const filteredCourses = useMemo(() => {
    if (!filterStudentId) return courses;
    return courses.filter((c) => c.student?._id === filterStudentId);
  }, [courses, filterStudentId]);

  const setStudentFilter = (studentId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (studentId) next.set('studentId', studentId);
      else next.delete('studentId');
      return next;
    });
  };

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

      {learnerOptions.length > 0 && (
        <LearnerFilterChips
          className="mb-6"
          options={learnerOptions}
          selectedId={filterStudentId}
          onChange={setStudentFilter}
        />
      )}

      {filteredCourses.length === 0 && courses.length > 0 ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-10 text-center shadow-lg">
          <span className="mb-3 block text-4xl" aria-hidden>
            🔭
          </span>
          <p className="text-lg font-bold text-brand-800">No enrollments for this learner yet</p>
          <p className="mt-2 text-sm text-brand-700/80">Pick another learner above or find a new batch.</p>
          <Link
            to="/parent/marketplace"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
          >
            Browse teachers ✨
          </Link>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200/90 p-10 text-center shadow-xl my-course-card-gradient">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-cyan-300/25 blur-3xl" />
          <span className="relative mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-4xl shadow-lg ring-2 ring-white animate-float">
            📖
          </span>
          <p className="relative text-lg font-bold text-brand-800">You haven&apos;t purchased any courses yet</p>
          <p className="relative mt-2 text-sm text-brand-700/85">Explore tutors and enroll your children in a few taps.</p>
          <Link
            to="/parent/marketplace"
            className="relative mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.03] hover:shadow-xl"
          >
            <span aria-hidden>🚀</span> Browse teachers
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCourses.map((c, index) => {
            const studentPhotoSrc = c.student ? resolveMediaUrl(c.student.photoUrl) : undefined;
            const teacherPhotoSrc = c.teacher ? resolveMediaUrl(c.teacher.photoUrl) : undefined;
            const stagger = STAGGER[index % STAGGER.length];
            const emoji = subjectEmoji(c.subject);

            return (
              <article
                key={c._id}
                className="group relative overflow-hidden rounded-3xl border border-white/80 bg-brand-50/30 shadow-xl shadow-indigo-500/10 card-funky"
              >
                {/* Shifting gradient lives here so it never overrides animate-slide-up on content */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl my-course-card-gradient"
                  aria-hidden
                />
                {/* Soft glow orbs */}
                <div
                  className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl transition duration-700 group-hover:bg-fuchsia-400/30"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl transition duration-700 group-hover:bg-cyan-400/25"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full bg-violet-400/10 blur-2xl sm:left-auto sm:right-12 sm:translate-x-0"
                  aria-hidden
                />

                <div className={`relative z-10 p-6 sm:p-8 animate-slide-up ${stagger}`}>
                  {/* Title row */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div
                        className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-lg ring-2 ring-white/90 animate-float"
                        style={{ animationDelay: `${(index % 3) * 0.15}s` }}
                      >
                        <span aria-hidden>{emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-extrabold leading-tight text-brand-900 sm:text-2xl">
                          {c.subject || 'Course'}
                          <span className="text-brand-600"> · </span>
                          <span className="text-brand-800">Class {c.classLevel ?? '—'}</span>
                        </h3>
                        <p className="mt-1.5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700/90">
                          <span className="rounded-lg bg-white/70 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200/80">
                            {c.board || 'Board'}
                          </span>
                        </p>
                      </div>
                    </div>
                    {c.batchId && (
                      <div className="shrink-0 rounded-2xl border border-dashed border-brand-300/80 bg-white/50 px-4 py-2 text-center backdrop-blur-sm sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Batch ID</p>
                        <p className="font-mono text-sm font-bold text-brand-900">{c.batchId}</p>
                      </div>
                    )}
                  </div>

                  {/* Detail chips */}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <DetailChip icon="📅" label="Schedule" value={formatSlots(c.slots)} />
                    <DetailChip icon="💰" label="Monthly fee" value={`${formatCurrency(c.feePerMonth ?? 0)}/mo`} />
                    <DetailChip
                      icon="🗓️"
                      label="Period"
                      value={`${formatDate(c.startDate)} → ${formatDate(c.endDate)}`}
                      className="sm:col-span-2"
                    />
                  </div>

                  {/* Learner ↔ Teacher — fun duo strip */}
                  {(c.student || c.teacher) && (
                    <div className="mt-8">
                      <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600/90">
                        <span className="text-base" aria-hidden>
                          🎯
                        </span>
                        Your learning duo
                      </p>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        {c.student && (
                          <Link
                            to="/parent/students"
                            className="relative flex-1 overflow-hidden rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-emerald-50/80 p-4 shadow-md ring-1 ring-sky-100/80 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg"
                          >
                            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-300/20 blur-2xl" aria-hidden />
                            <div className="relative flex items-center gap-4">
                              <div className="relative shrink-0">
                                <div
                                  className="absolute -inset-1 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 opacity-80 blur-[2px]"
                                  aria-hidden
                                />
                                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-lg">
                                  {studentPhotoSrc ? (
                                    <img src={studentPhotoSrc} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100 text-2xl">
                                      🎒
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">Your learner</p>
                                <p className="truncate text-lg font-extrabold text-brand-950">
                                  {c.student.name || c.student.studentId || 'Student'}
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-sky-600">Open student hub →</p>
                              </div>
                            </div>
                          </Link>
                        )}

                        {c.student && c.teacher && (
                          <div className="flex flex-row items-center justify-center gap-2 py-1 sm:w-auto sm:flex-col sm:justify-center sm:px-2 sm:py-4">
                            <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 to-transparent sm:block sm:h-auto sm:w-px sm:flex-none sm:bg-gradient-to-b" />
                            <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-white/70 px-3 py-2 shadow-sm ring-2 ring-violet-200/60 backdrop-blur-sm">
                              <span className="text-xl animate-pulse-soft" aria-hidden>
                                ✨
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600">with</span>
                            </div>
                            <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 to-transparent sm:block sm:h-auto sm:w-px sm:flex-none sm:bg-gradient-to-b" />
                          </div>
                        )}

                        {c.teacher && (
                          <Link
                            to={c.teacher.profileUrl}
                            className="relative flex-1 overflow-hidden rounded-2xl border-2 border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-amber-50/90 p-4 shadow-md ring-1 ring-violet-100/80 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
                          >
                            <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-amber-300/15 blur-2xl" aria-hidden />
                            <div className="relative flex items-center gap-4">
                              <div className="relative shrink-0">
                                <div
                                  className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-75 blur-[2px]"
                                  aria-hidden
                                />
                                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-lg">
                                  {teacherPhotoSrc ? (
                                    <img src={teacherPhotoSrc} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl" aria-hidden>
                                      🎓
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-700">Teacher</p>
                                <p className="truncate text-lg font-extrabold text-brand-950">{c.teacher.name || 'Teacher'}</p>
                                <p className="mt-0.5 text-xs font-bold text-violet-600">View profile & batches →</p>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
