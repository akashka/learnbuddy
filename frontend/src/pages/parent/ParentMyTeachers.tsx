import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';

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

export default function ParentMyTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [switchModal, setSwitchModal] = useState<{ course: CourseEntry; teacher: Teacher } | null>(null);
  const [switchReason, setSwitchReason] = useState('');
  const [submittingReason, setSubmittingReason] = useState(false);
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
    setSwitchModal({ course, teacher });
    setSwitchReason('');
  };

  const handleSwitchConfirm = () => {
    if (!switchModal || !switchReason.trim()) return;
    setSubmittingReason(true);
    // Save reason to sessionStorage for when they complete the switch on marketplace
    try {
      sessionStorage.setItem(
        'switchTeacherRequest',
        JSON.stringify({
          enrollmentId: switchModal.course.enrollmentId,
          reason: switchReason.trim(),
          subject: switchModal.course.subject,
          board: switchModal.course.board,
          classLevel: switchModal.course.classLevel,
        })
      );
    } catch {
      /* ignore */
    }
    setSubmittingReason(false);
    setSwitchModal(null);
    // Redirect to marketplace with same subject, board, class (exclude current teacher)
    const params = new URLSearchParams();
    params.set('subject', switchModal.course.subject);
    params.set('board', switchModal.course.board);
    params.set('class', switchModal.course.classLevel);
    params.set('switchEnrollmentId', switchModal.course.enrollmentId);
    navigate(`/parent/marketplace?${params.toString()}`);
  };

  const [reviewModal, setReviewModal] = useState<Teacher | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleReviewClick = (teacher: Teacher) => {
    setReviewModal(teacher);
    setReviewRating(teacher.myReview?.rating ?? 5);
    setReviewText(teacher.myReview?.review ?? '');
    setReviewError(null);
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await apiJson('/api/parent/reviews', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: reviewModal._id,
          rating: reviewRating,
          review: reviewText.trim() || undefined,
          enrollmentId: reviewModal.courses[0]?.enrollmentId,
        }),
      });
      setReviewModal(null);
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
        subtitle="Teachers your kids are learning from — switch, review & rate"
      />

      {teachers.length === 0 ? (
        <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-8 text-center">
          <p className="mb-4 text-brand-700">No teachers yet. Purchase a course to get started.</p>
          <Link
            to="/parent/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700"
          >
            Browse Teachers
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {teachers.map((t) => (
            <div
              key={t._id}
              className="rounded-2xl border-2 border-brand-200/80 bg-white p-6 shadow-lg"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Link
                  to={`/parent/teacher/${t._id}`}
                  className="flex shrink-0 items-center gap-3"
                >
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt=""
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">
                      {t.name?.[0] || 'T'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-brand-800 hover:underline">{t.name}</h3>
                    {t.qualification && (
                      <p className="text-sm text-gray-600">{t.qualification}</p>
                    )}
                    {t.myReview && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-amber-500">
                          {'★'.repeat(Math.round(t.myReview.rating))}
                          {'☆'.repeat(5 - Math.round(t.myReview.rating))}
                        </span>
                        <span className="text-sm text-gray-600">({t.myReview.rating})</span>
                      </div>
                    )}
                  </div>
                </Link>
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {!t.myReview ? (
                      <button
                        type="button"
                        onClick={() => handleReviewClick(t)}
                        className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
                      >
                        Give Review & Rating
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReviewClick(t)}
                        className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-800 transition hover:bg-green-200"
                      >
                        Update Review
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-brand-100 pt-4">
                <p className="text-sm font-medium text-gray-700">Courses with this teacher</p>
                {t.courses.map((course) => (
                  <div
                    key={course.enrollmentId}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4"
                  >
                    <div>
                      <p className="font-medium text-brand-800">
                        {course.subject} • Class {course.classLevel}
                      </p>
                      <p className="text-sm text-gray-600">
                        {course.studentName && `Student: ${course.studentName}`}
                        {course.board && ` • ${course.board}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {course.canSwitch ? (
                        <button
                          type="button"
                          onClick={() => handleSwitchClick(course, t)}
                          className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                        >
                          Switch Teacher
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Switch limit reached ({MAX_TEACHER_CHANGES}/{MAX_TEACHER_CHANGES})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        overlayClassName="bg-black/50 backdrop-blur-sm"
        maxWidth="max-w-md"
      >
        {reviewModal && (
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-brand-800">
              Review {reviewModal.name}
            </h3>
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReviewRating(r)}
                    className={`text-2xl ${r <= reviewRating ? 'text-amber-500' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Review (optional)</p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                rows={3}
              />
            </div>
            {reviewError && (
              <p className="mb-4 text-sm text-red-600">{reviewError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="rounded-xl border-2 border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={submittingReview}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!switchModal}
        onClose={() => setSwitchModal(null)}
        overlayClassName="bg-black/50 backdrop-blur-sm"
        maxWidth="max-w-md"
      >
        {switchModal && (
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-brand-800">Switch Teacher</h3>
            <p className="mb-4 text-sm text-gray-600">
              You're switching for {switchModal.course.subject} Class {switchModal.course.classLevel}.
              You'll be redirected to find another teacher for the same course.
            </p>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Why are you changing the teacher? <span className="text-red-500">*</span>
            </p>
            <textarea
              value={switchReason}
              onChange={(e) => setSwitchReason(e.target.value)}
              placeholder="e.g. Scheduling conflict, teaching style, etc."
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={3}
            />
            <p className="mb-4 text-xs text-gray-500">
              Note: If the new teacher's fee is higher, you'll pay the difference. If lower, no refund.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSwitchModal(null)}
                className="rounded-xl border-2 border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwitchConfirm}
                disabled={!switchReason.trim() || submittingReason}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                Continue to Marketplace
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
