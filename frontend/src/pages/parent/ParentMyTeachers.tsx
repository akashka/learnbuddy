import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson, resolveMediaUrl } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { Drawer } from '@/components/Drawer';
import { formatCurrency } from '@shared/formatters';

type CourseEntry = {
  enrollmentId: string;
  subject: string;
  board: string;
  classLevel: string;
  studentName?: string;
  studentId: string;
  feePerMonth: number;
  teacherChangeCount: number;
  canSwitch: boolean;
};

type Teacher = {
  _id: string;
  name?: string;
  photoUrl?: string;
  qualification?: string;
  subjects?: string[];
  classes?: string[];
  board?: string[];
  bio?: string;
  courses: CourseEntry[];
  myReview?: {
    rating: number;
    review: string;
    createdAt: string;
    updatedAt?: string;
  } | null;
};

const MAX_TEACHER_CHANGES = 2;
const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const;

function StarRow({ rating }: { rating: number }) {
  const r = Math.round(Math.min(5, Math.max(1, rating)));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-hidden>
      {Array.from({ length: r }, (_, i) => (
        <span key={i} className="text-lg drop-shadow-sm">
          ★
        </span>
      ))}
      {Array.from({ length: 5 - r }, (_, i) => (
        <span key={`e-${i}`} className="text-lg text-gray-300">
          ★
        </span>
      ))}
    </span>
  );
}

export default function ParentMyTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [switchDrawer, setSwitchDrawer] = useState<{ course: CourseEntry; teacher: Teacher } | null>(null);
  const [switchReason, setSwitchReason] = useState('');
  const [submittingReason, setSubmittingReason] = useState(false);
  const [switchStep, setSwitchStep] = useState<'form' | 'done'>('form');
  const navigate = useNavigate();

  const fetchTeachers = useCallback(() => {
    setLoading(true);
    setError(null);
    apiJson<{ teachers: Teacher[] }>('/api/parent/my-teachers')
      .then((d) => setTeachers(d.teachers || []))
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSwitchClick = (course: CourseEntry, teacher: Teacher) => {
    setSwitchDrawer({ course, teacher });
    setSwitchReason('');
    setSwitchStep('form');
  };

  const handleSwitchConfirm = () => {
    if (!switchDrawer || !switchReason.trim()) return;
    setSubmittingReason(true);
    try {
      sessionStorage.setItem(
        'switchTeacherRequest',
        JSON.stringify({
          enrollmentId: switchDrawer.course.enrollmentId,
          reason: switchReason.trim(),
          subject: switchDrawer.course.subject,
          board: switchDrawer.course.board,
          classLevel: switchDrawer.course.classLevel,
        })
      );
    } catch {
      /* ignore */
    }
    setSubmittingReason(false);
    setSwitchStep('done');
    window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set('subject', switchDrawer.course.subject);
      params.set('board', switchDrawer.course.board);
      params.set('class', switchDrawer.course.classLevel);
      params.set('switchEnrollmentId', switchDrawer.course.enrollmentId);
      setSwitchDrawer(null);
      setSwitchStep('form');
      navigate(`/parent/marketplace?${params.toString()}`);
    }, 900);
  };

  const [reviewDrawer, setReviewDrawer] = useState<Teacher | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleReviewClick = (teacher: Teacher) => {
    setReviewDrawer(teacher);
    setReviewRating(teacher.myReview?.rating ?? 5);
    setReviewText(teacher.myReview?.review ?? '');
    setReviewError(null);
  };

  const handleReviewSubmit = async () => {
    if (!reviewDrawer) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await apiJson('/api/parent/reviews', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: reviewDrawer._id,
          rating: reviewRating,
          review: reviewText.trim() || undefined,
          enrollmentId: reviewDrawer.courses[0]?.enrollmentId,
        }),
      });
      setReviewDrawer(null);
      fetchTeachers();
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading your teachers...</p>
      </div>
    );
  }

  if (error && teachers.length === 0) {
    return <InlineErrorDisplay error={error} onRetry={fetchTeachers} fullPage />;
  }

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👩‍🏫"
        title="My Teachers"
        subtitle="Your learning champions — rate, review & switch when you need to"
      />

      {teachers.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200/90 p-10 text-center shadow-xl my-course-card-gradient">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-300/30 blur-3xl" />
          <span className="relative mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-4xl shadow-lg ring-2 ring-white animate-float">
            🎓
          </span>
          <p className="relative text-lg font-bold text-brand-800">No teachers yet</p>
          <p className="relative mt-2 text-sm text-brand-700/85">Purchase a course to see your tutors here.</p>
          <Link
            to="/parent/marketplace"
            className="relative mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.03] hover:shadow-xl"
          >
            <span aria-hidden>🚀</span> Browse Teachers
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {teachers.map((t, ti) => {
            const stagger = STAGGER[ti % STAGGER.length];
            const photo = resolveMediaUrl(t.photoUrl);
            return (
              <article
                key={t._id}
                className={`group relative overflow-hidden rounded-3xl border border-white/80 bg-brand-50/30 shadow-xl shadow-indigo-500/10 card-funky animate-slide-up ${stagger}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl my-course-card-gradient"
                  aria-hidden
                />
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-fuchsia-400/15 blur-3xl transition group-hover:bg-fuchsia-400/25" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-cyan-400/12 blur-3xl" />

                <div className="relative z-10 p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="relative shrink-0">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-400 to-brand-400 opacity-70 blur-[2px]" />
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white ring-4 ring-white shadow-xl sm:h-24 sm:w-24">
                          {photo ? (
                            <img src={photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-violet-200 text-3xl">
                              👩‍🏫
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/parent/teacher/${t._id}`}
                          className="font-display text-xl font-extrabold text-brand-950 hover:underline sm:text-2xl"
                        >
                          {t.name || 'Teacher'}
                        </Link>
                        {t.qualification && (
                          <p className="mt-1 text-sm font-semibold text-brand-700/90">{t.qualification}</p>
                        )}
                        {t.myReview ? (
                          <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-inner">
                            <div className="flex flex-wrap items-center gap-2">
                              <StarRow rating={t.myReview.rating} />
                              <span className="text-sm font-bold text-amber-900">{t.myReview.rating.toFixed(1)} / 5</span>
                            </div>
                            {t.myReview.review ? (
                              <p className="mt-2 text-sm leading-relaxed text-amber-950/90 line-clamp-4">{t.myReview.review}</p>
                            ) : (
                              <p className="mt-2 text-xs font-medium text-amber-800/80">Rated — add a few words anytime.</p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-violet-800 ring-1 ring-violet-200/80">
                            <span aria-hidden>✨</span> You haven&apos;t rated this teacher yet
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
                      <button
                        type="button"
                        onClick={() => handleReviewClick(t)}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-extrabold shadow-md transition hover:scale-[1.02] ${
                          t.myReview
                            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 hover:border-emerald-400'
                            : 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 hover:border-amber-400'
                        }`}
                      >
                        <span aria-hidden>{t.myReview ? '✏️' : '⭐'}</span>
                        {t.myReview ? 'Update review' : 'Rate & review'}
                      </button>
                      <Link
                        to={`/parent/teacher/${t._id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-white/90 px-5 py-3 text-sm font-bold text-brand-800 shadow-sm transition hover:border-brand-400"
                      >
                        Profile <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/60 pt-6">
                    <p className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600/90">
                      <span className="text-base" aria-hidden>
                        📚
                      </span>
                      Courses with this teacher
                    </p>
                    <div className="space-y-4">
                      {t.courses.map((course, ci) => (
                        <div
                          key={course.enrollmentId}
                          className="animate-slide-up flex flex-col gap-4 rounded-2xl border-2 border-white/70 bg-white/55 p-4 shadow-md backdrop-blur-sm transition hover:bg-white/80 sm:flex-row sm:items-center sm:justify-between"
                          style={{ animationDelay: `${0.05 + ci * 0.05}s` }}
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold text-brand-900">
                              {course.subject} · Class {course.classLevel}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {course.studentName && (
                                <>
                                  <span className="font-semibold text-brand-700">🎒 {course.studentName}</span>
                                  {' · '}
                                </>
                              )}
                              {course.board} · {formatCurrency(course.feePerMonth)}/mo
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {course.canSwitch ? (
                              <button
                                type="button"
                                onClick={() => handleSwitchClick(course, t)}
                                className="inline-flex items-center gap-2 rounded-2xl border-2 border-amber-400/90 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 text-sm font-extrabold text-amber-950 shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                              >
                                <span aria-hidden>🔁</span> Switch teacher
                              </button>
                            ) : (
                              <span className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                                Switch limit reached ({MAX_TEACHER_CHANGES}/{MAX_TEACHER_CHANGES})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Drawer
        isOpen={!!reviewDrawer}
        onClose={() => setReviewDrawer(null)}
        title={reviewDrawer?.myReview ? 'Update your review' : 'Rate your teacher'}
        subtitle={reviewDrawer?.name}
        headerIcon={<span className="text-2xl">⭐</span>}
        widthClassName="max-w-md"
      >
        {reviewDrawer && (
          <div className="space-y-5 px-1 pb-6">
            <div>
              <p className="mb-2 text-sm font-bold text-gray-700">Rating</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReviewRating(r)}
                    className={`rounded-xl px-3 py-2 text-2xl transition hover:scale-110 ${
                      r <= reviewRating ? 'text-amber-500 drop-shadow' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-gray-700">Review (optional)</p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What went well? What should others know?"
                className="w-full rounded-2xl border-2 border-brand-100 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                rows={4}
              />
            </div>
            {reviewError && <p className="text-sm font-medium text-red-600">{reviewError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewDrawer(null)}
                className="rounded-2xl border-2 border-brand-200 px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReviewSubmit()}
                disabled={submittingReview}
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
              >
                {submittingReview ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        isOpen={!!switchDrawer}
        onClose={() => {
          setSwitchDrawer(null);
          setSwitchStep('form');
        }}
        title="Switch teacher"
        subtitle={switchDrawer ? `${switchDrawer.course.subject} · Class ${switchDrawer.course.classLevel}` : undefined}
        headerIcon={<span className="text-2xl">🔁</span>}
        widthClassName="max-w-lg"
      >
        {switchDrawer && (
          <div className="space-y-5 px-1 pb-8">
            {switchStep === 'form' ? (
              <>
                <div className="rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 text-sm text-brand-900 shadow-inner">
                  <p className="font-extrabold">Smooth handoff</p>
                  <p className="mt-2 leading-relaxed text-gray-700">
                    You&apos;ll pick a new teacher for the same subject &amp; class. Checkout applies a{' '}
                    <strong>calendar pro-rata</strong> for this month — your previous teacher is credited for unused days,
                    and you pay the adjusted total for the new package.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-800">
                    Why switch? <span className="text-red-500">*</span>
                  </p>
                  <textarea
                    value={switchReason}
                    onChange={(e) => setSwitchReason(e.target.value)}
                    placeholder="e.g. schedule change, teaching style, travel…"
                    className="w-full rounded-2xl border-2 border-brand-100 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSwitchDrawer(null)}
                    className="rounded-2xl border-2 border-brand-200 px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchConfirm}
                    disabled={!switchReason.trim() || submittingReason}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    {submittingReason ? '…' : 'Continue'}
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl animate-scale-in">
                  ✓
                </div>
                <p className="text-lg font-extrabold text-brand-900">Off to the marketplace…</p>
                <p className="text-sm text-gray-600">Hang tight — we&apos;re taking you to choose your next teacher.</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
