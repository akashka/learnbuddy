import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { ReadAloudButton } from '@/components/ReadAloudButton';
import { Modal } from '@/components/Modal';
import { formatDateTime } from '@shared/formatters';

interface IAIFeedback {
  good?: string[];
  bad?: string[];
  overall?: string;
  questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[];
  lowSentimentWarning?: boolean;
}

interface IExamQuestion {
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  imageUrl?: string;
}

interface Exam {
  _id: string;
  subject?: string;
  topic?: string;
  score?: number;
  totalMarks?: number;
  status?: string;
  attemptedAt?: string;
  completedAt?: string;
  aiFeedback?: IAIFeedback;
  questions?: IExamQuestion[];
  answers?: (number | string | { value: unknown })[];
}

/* ─── Helpers ─────────────────────────────────────── */

function getAnswerDisplay(
  q: IExamQuestion,
  raw: number | string | { value: unknown } | undefined
): string {
  if (raw === undefined || raw === null || raw === '') return '—';

  let val: unknown = raw;
  if (typeof raw === 'object' && 'value' in raw) val = raw.value;

  if (q.type === 'mcq' && q.options && typeof val === 'number') {
    return q.options[val] ?? `Option ${val + 1}`;
  }
  return String(val);
}

function getCorrectAnswerDisplay(q: IExamQuestion): string {
  if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === '') return '—';
  if (q.type === 'mcq' && q.options && typeof q.correctAnswer === 'number') {
    return q.options[q.correctAnswer] ?? `Option ${q.correctAnswer + 1}`;
  }
  return String(q.correctAnswer);
}

function getScoreEmoji(pct: number) {
  if (pct >= 90) return { emoji: '🏆', label: 'Champion!', color: 'from-yellow-400 to-orange-400' };
  if (pct >= 75) return { emoji: '⭐', label: 'Great Job!', color: 'from-purple-400 to-pink-400' };
  if (pct >= 50) return { emoji: '🎯', label: 'Good Try!', color: 'from-blue-400 to-cyan-400' };
  return { emoji: '💪', label: 'Keep Going!', color: 'from-rose-400 to-pink-400' };
}

/* ─── Review Modal ────────────────────────────────── */

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  questions: IExamQuestion[];
  initialQuestionIndex?: number | null;
}

function ReviewModal({ isOpen, onClose, examId, questions, initialQuestionIndex }: ReviewModalProps) {
  const [scope, setScope] = useState<'overall' | 'question'>(() =>
    initialQuestionIndex !== null && initialQuestionIndex !== undefined ? 'question' : 'overall'
  );
  const [selectedQuestion, setSelectedQuestion] = useState<number>(initialQuestionIndex ?? 0);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Sync when modal opens for a specific question
  useEffect(() => {
    if (isOpen) {
      if (initialQuestionIndex !== null && initialQuestionIndex !== undefined) {
        setScope('question');
        setSelectedQuestion(initialQuestionIndex);
      } else {
        setScope('overall');
      }
      setRemark('');
      setSubmitError('');
      setSubmitSuccess(false);
    }
  }, [isOpen, initialQuestionIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remark.trim().length < 10) {
      setSubmitError('Please provide at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const fullRemark =
        scope === 'question'
          ? `[Question ${selectedQuestion + 1}] ${remark.trim()}`
          : remark.trim();

      await apiJson<{ success: boolean; message: string }>('/api/ai-review', {
        method: 'POST',
        body: JSON.stringify({ entityType: 'exam', entityId: examId, remark: fullRemark }),
      });
      setSubmitSuccess(true);
      setRemark('');
      setTimeout(() => { onClose(); setSubmitSuccess(false); }, 2200);
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to submit review request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRemark('');
    setSubmitError('');
    setSubmitSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Colourful header strip */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-4">
          <span className="text-2xl">🔍</span>
          <h2 className="text-lg font-bold text-white">Request Human Review</h2>
        </div>

        <div className="p-6">
          {submitSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="text-5xl animate-bounce">✅</span>
              <p className="text-lg font-semibold text-green-700">Request submitted!</p>
              <p className="text-sm text-gray-600">An admin will review it shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Think the AI got something wrong? Ask a human to double-check!
              </p>

              {/* Scope toggle */}
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">Review scope:</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setScope('overall')}
                    className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all ${scope === 'overall'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:border-violet-300'
                      }`}
                  >
                    🗒️ Overall Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('question')}
                    disabled={questions.length === 0}
                    className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all ${scope === 'question'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      } disabled:opacity-40`}
                  >
                    ❓ Specific Question
                  </button>
                </div>
              </div>

              {/* Question selector */}
              {scope === 'question' && questions.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-gray-700">Select question:</p>
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(Number(e.target.value))}
                    className="w-full rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {questions.map((q, i) => (
                      <option key={i} value={i}>
                        Q{i + 1}: {q.question.length > 70 ? q.question.slice(0, 70) + '…' : q.question}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="mb-1 text-sm font-semibold text-gray-700">Your concern:</p>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Explain why you think the AI evaluation needs a human review…"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  rows={4}
                  minLength={10}
                  required
                />
                <p className="mt-1 text-right text-xs text-gray-400">{remark.trim().length} / 10 min</p>
              </div>

              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || remark.trim().length < 10}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? '⏳ Submitting…' : '🚀 Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Main Component ──────────────────────────────── */

function StudentExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    apiJson<Exam>(`/api/student/exam/${id}`)
      .then(setExam)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const feedback = exam?.aiFeedback;

  const readAloudText = useMemo(() => {
    if (!exam) return '';
    const parts: string[] = [];
    if (exam.questions?.length) {
      parts.push(exam.questions.map((q, i) => `Question ${i + 1}: ${q.question}`).join(' '));
    }
    if (feedback?.overall) parts.push(feedback.overall);
    if (feedback?.good?.length) parts.push('Strengths: ' + feedback.good.join('. '));
    if (feedback?.bad?.length) parts.push('Areas to improve: ' + feedback.bad.join('. '));
    if (feedback?.questionFeedback?.length) {
      parts.push(
        feedback.questionFeedback
          .map((qf, i) => `Question ${i + 1}: ${qf.correct ? 'Correct' : 'Incorrect'}. ${qf.feedback}`)
          .join('. ')
      );
    }
    return parts.filter(Boolean).join(' ');
  }, [exam, feedback]);

  const openReviewModal = (questionIndex: number | null = null) => {
    setReviewQuestionIndex(questionIndex);
    setShowReviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500" />
        </div>
        <p className="text-lg font-semibold text-purple-600 animate-pulse">Loading your results… ✨</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <span className="text-5xl">😟</span>
        <p className="text-lg font-semibold text-red-600">Error: {error || 'Exam not found'}</p>
      </div>
    );
  }

  const pct = exam.totalMarks ? Math.round(((exam.score ?? 0) / exam.totalMarks) * 100) : 0;
  const scoreInfo = getScoreEmoji(pct);

  const questions = exam.questions ?? [];
  const answers = exam.answers ?? [];

  return (
    <div className="min-h-screen from-indigo-50 via-purple-50 to-pink-50 pb-12" style={{ marginTop: "-1rem" }}>
      {/* Back btn */}
      <div className="mx-auto px-4" style={{
        zIndex: 100,
        position: "absolute",
        paddingLeft: "3rem",
        paddingTop: "1rem",
      }}>
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur transition hover:bg-indigo-50"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> Back
        </button>
      </div>

      {/* Hero Score Card */}
      <div className="mx-auto mt-6 px-4">
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${scoreInfo.color} p-8 text-white shadow-2xl`}>
          {/* Background circles for decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-6">
            {/* Left: emoji + label */}
            <div className="flex items-center gap-4">
              <span className="text-6xl drop-shadow-lg" style={{ animation: 'float 3s ease-in-out infinite' }}>
                {scoreInfo.emoji}
              </span>
              <div>
                <p className="text-3xl font-black tracking-tight">{scoreInfo.label}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{exam.subject || exam.topic || 'Exam'}</p>
                <p className="text-xs text-white/70">
                  📅 {exam.attemptedAt ? formatDateTime(exam.attemptedAt) : '—'}
                </p>
              </div>
            </div>

            {/* Right: score ring */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="white" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                  />
                </svg>
                <div className="text-center">
                  <span className="block text-2xl font-black">{pct}%</span>
                  <span className="block text-xs font-bold text-white/80">{exam.score ?? 0}/{exam.totalMarks ?? 0}</span>
                </div>
              </div>
              {readAloudText && (
                <ReadAloudButton text={readAloudText} preferFemaleVoice aria-label="Read feedback aloud" />
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-white" />
            {exam.status?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Sentiment warning */}
      {feedback?.lowSentimentWarning && (
        <div className="mx-auto mt-4 px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            <span className="text-xl">⚠️</span>
            <p>Some content in your answers was automatically masked for inappropriate language. Please keep responses respectful and on-topic.</p>
          </div>
        </div>
      )}

      {/* Overall AI Feedback */}
      {feedback && (
        <div className="mx-auto mt-6 px-4">
          <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-800">
              <span className="text-2xl">🤖</span> AI Feedback Summary
            </h2>
            {feedback.overall && (
              <p className="rounded-2xl bg-purple-50 px-4 py-3 text-sm text-gray-700">{feedback.overall}</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {feedback.good && feedback.good.length > 0 && (
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="mb-2 flex items-center gap-1 text-sm font-bold text-green-700">
                    <span>✅</span> Strengths
                  </p>
                  <ul className="space-y-1">
                    {feedback.good.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="mt-0.5 text-green-500">•</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.bad && feedback.bad.length > 0 && (
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="mb-2 flex items-center gap-1 text-sm font-bold text-orange-700">
                    <span>📈</span> Areas to Improve
                  </p>
                  <ul className="space-y-1">
                    {feedback.bad.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-orange-800">
                        <span className="mt-0.5 text-orange-400">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overall Review Button */}
      {exam.status === 'completed' && (
        <div className="mx-auto mt-4 px-4 flex justify-end">
          <button
            onClick={() => openReviewModal(null)}
            className="flex items-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
          >
            <span>🧑‍🏫</span> Request Human Review (Overall)
          </button>
        </div>
      )}

      {/* Questions Section */}
      {questions.length > 0 && (
        <div className="mx-auto mt-6 space-y-5 px-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-indigo-800">
            <span className="text-2xl">📝</span> Question Breakdown
          </h2>

          {questions.map((q, i) => {
            const qFeedback = feedback?.questionFeedback?.find((qf) => qf.questionIndex === i);
            const studentAns = getAnswerDisplay(q, answers[i]);
            const correctAns = getCorrectAnswerDisplay(q);
            const isCorrect = qFeedback?.correct;
            const hasAns = answers[i] !== undefined && answers[i] !== null && answers[i] !== '';

            return (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-white shadow-md transition-shadow hover:shadow-xl ${isCorrect === true
                  ? 'border-green-300'
                  : isCorrect === false
                    ? 'border-red-300'
                    : 'border-indigo-200'
                  }`}
              >
                {/* Top accent bar */}
                <div
                  className={`h-1.5 w-full ${isCorrect === true
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                    : isCorrect === false
                      ? 'bg-gradient-to-r from-red-400 to-rose-400'
                      : 'bg-gradient-to-r from-indigo-400 to-purple-400'
                    }`}
                />

                <div className="p-6">
                  {/* Question header */}
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${isCorrect === true
                          ? 'bg-green-500'
                          : isCorrect === false
                            ? 'bg-red-500'
                            : 'bg-indigo-500'
                          }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{q.question}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 font-medium">{q.type.toUpperCase()}</span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 font-medium">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status chip */}
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isCorrect === true
                        ? 'bg-green-100 text-green-700'
                        : isCorrect === false
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {isCorrect === true ? '✅ Correct' : isCorrect === false ? '❌ Incorrect' : '—'}
                    </span>
                  </div>

                  {/* MCQ options (read-only display) */}
                  {q.type === 'mcq' && q.options && q.options.length > 0 && (
                    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        let raw = answers[i];
                        let selectedIndex: number | null = null;
                        if (typeof raw === 'object' && raw !== null && 'value' in raw) raw = raw.value as number | string;
                        if (typeof raw === 'number') selectedIndex = raw;

                        const isSelected = selectedIndex === oi;
                        const isCorrectOption = q.correctAnswer === oi;

                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${isSelected && isCorrectOption
                              ? 'border-green-400 bg-green-50 text-green-800'
                              : isSelected && !isCorrectOption
                                ? 'border-red-400 bg-red-50 text-red-800'
                                : isCorrectOption
                                  ? 'border-green-300 bg-green-50/50 text-green-700'
                                  : 'border-gray-200 text-gray-600'
                              }`}
                          >
                            <span className="text-xs font-bold">
                              {isSelected && isCorrectOption ? '✅' : isSelected ? '❌' : isCorrectOption ? '☑️' : '○'}
                            </span>
                            {opt}
                            {isSelected && <span className="ml-auto text-xs font-medium">(Your answer)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer grid for non-MCQ */}
                  {q.type !== 'mcq' && (
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-2xl p-3 ${hasAns ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <p className="mb-1 text-xs font-bold text-blue-600">✏️ Your Answer</p>
                        <p className="text-sm text-gray-800">{studentAns}</p>
                      </div>
                      {correctAns !== '—' && (
                        <div className="rounded-2xl bg-green-50 p-3">
                          <p className="mb-1 text-xs font-bold text-green-600">💡 Expected Answer</p>
                          <p className="text-sm text-gray-800">{correctAns}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI analysis for the question */}
                  {qFeedback?.feedback && (
                    <div className="mb-4 flex gap-3 rounded-2xl bg-purple-50 p-3">
                      <span className="mt-0.5 text-lg">🤖</span>
                      <div>
                        <p className="text-xs font-bold text-purple-700">AI Analysis</p>
                        <p className="mt-0.5 text-sm text-purple-900">{qFeedback.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Per-question review button */}
                  {exam.status === 'completed' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => openReviewModal(i)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        <span>🧑‍🏫</span> Request Review for Q{i + 1}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Human Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        examId={id!}
        questions={questions}
        initialQuestionIndex={reviewQuestionIndex}
      />

      {/* Keyframe animations via style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

export default StudentExamDetail;
