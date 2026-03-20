import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { ReadAloudButton } from '@/components/ReadAloudButton';
import { Modal } from '@/components/Modal';

interface IAIFeedback {
  good?: string[];
  bad?: string[];
  overall?: string;
  questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[];
  lowSentimentWarning?: boolean;
}

interface Exam {
  _id: string;
  subject?: string;
  topic?: string;
  score?: number;
  totalMarks?: number;
  status?: string;
  attemptedAt?: string;
  studentId?: { name?: string };
  aiFeedback?: IAIFeedback;
  questions?: { question: string; type: string; marks: number }[];
}

export default function ParentExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiJson<Exam>(`/api/student/exam/${id}`)
      .then(setExam)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequestReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !remark.trim() || remark.trim().length < 10) {
      setSubmitError('Please provide a remark of at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiJson('/api/ai-review', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'exam',
          entityId: id,
          remark: remark.trim(),
        }),
      });
      setSubmitSuccess(true);
      setRemark('');
      setTimeout(() => {
        setShowReviewModal(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error || !exam) return <div className="text-red-600">Error: {error || 'Exam not found'}</div>;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');
  const feedback = exam.aiFeedback;

  const readAloudText = useMemo(() => {
    const parts: string[] = [];
    if (exam.questions?.length) {
      parts.push(exam.questions.map((q, i) => `Question ${i + 1}: ${q.question}`).join(' '));
    }
    if (feedback?.overall) parts.push(feedback.overall);
    if (feedback?.good?.length) parts.push('Strengths: ' + feedback.good.join('. '));
    if (feedback?.bad?.length) parts.push('Areas to improve: ' + feedback.bad.join('. '));
    if (feedback?.questionFeedback?.length) {
      parts.push(
        feedback.questionFeedback.map((qf, i) => `Question ${i + 1}: ${qf.correct ? 'Correct' : 'Incorrect'}. ${qf.feedback}`).join('. ')
      );
    }
    return parts.filter(Boolean).join(' ');
  }, [exam.questions, feedback]);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 text-brand-600 hover:underline">
        ← Back
      </button>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">
        Exam Result: {exam.studentId && typeof exam.studentId === 'object' && 'name' in exam.studentId
          ? (exam.studentId as { name?: string }).name
          : ''} – {exam.subject || exam.topic || 'Exam'}
      </h1>

      <div className="mb-6 rounded-xl border border-brand-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-brand-800">
                Score: {exam.score ?? '-'} / {exam.totalMarks ?? '-'}
              </p>
              {readAloudText && (
                <ReadAloudButton text={readAloudText} preferFemaleVoice aria-label="Read exam aloud" />
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Attempted: {formatDate(exam.attemptedAt)} • Status: {exam.status}
            </p>
          </div>
          {exam.status === 'completed' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="rounded-lg border border-amber-500 bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
            >
              Request human review
            </button>
          )}
        </div>

        {feedback?.lowSentimentWarning && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            ⚠️ Some content in your child&apos;s answers was automatically masked for inappropriate language.
          </div>
        )}
        {feedback && (
          <div className="mt-4 space-y-4 border-t border-brand-100 pt-4">
            <h3 className="font-semibold text-brand-800">AI Feedback</h3>
            {feedback.overall && <p className="text-gray-700">{feedback.overall}</p>}
            {feedback.good && feedback.good.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700">Strengths:</p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {feedback.good.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.bad && feedback.bad.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-700">Areas to improve:</p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {feedback.bad.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setRemark(''); setSubmitError(''); setSubmitSuccess(false); }}
        maxWidth="max-w-lg"
      >
        <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brand-800">Request Human Review</h2>
            <p className="mb-4 text-sm text-gray-600">
              If you believe the AI evaluation is incorrect for your child&apos;s exam, request a
              human admin to review it. Please explain your concern (at least 10 characters).
            </p>
            {submitSuccess ? (
              <div className="rounded-lg bg-green-50 p-4 text-green-800">
                Your review request has been submitted. An admin will review it shortly. Track status
                in &quot;Review Requests&quot;.
              </div>
            ) : (
              <form onSubmit={handleRequestReview}>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Explain why you think the AI evaluation needs human review..."
                  className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
                  rows={4}
                  minLength={10}
                  required
                />
                {submitError && <p className="mb-2 text-sm text-red-600">{submitError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setRemark('');
                      setSubmitError('');
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || remark.trim().length < 10}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
        </div>
      </Modal>
    </div>
  );
}
