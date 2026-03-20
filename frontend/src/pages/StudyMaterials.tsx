import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReadAloudButton } from '@/components/ReadAloudButton';
import { StudyMaterialFlashcards } from '@/components/StudyMaterialFlashcards';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import StudyMaterialLoadingOverlay from '@/components/StudyMaterialLoadingOverlay';
import StudyMaterialBook from '@/components/StudyMaterialBook';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

interface MaterialSection {
  type?: string;
  heading?: string;
  content?: string;
  caption?: string;
}

interface Material {
  title?: string;
  summary?: string;
  sections?: MaterialSection[];
  flashcards?: { front: string; back: string }[];
}

interface MaterialWithId extends Material {
  contentId?: string;
}

type EligibleCombo = { subject: string; board: string; classLevel: string };

export default function StudyMaterials() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [eligibility, setEligibility] = useState<EligibleCombo[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [board, setBoard] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [material, setMaterial] = useState<MaterialWithId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState<string | null>(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtError, setDoubtError] = useState('');
  const [questionWarning, setQuestionWarning] = useState(false);
  const [answerWarning, setAnswerWarning] = useState(false);

  const fetchEligibility = useCallback(() => {
    setEligibilityLoading(true);
    setEligibilityError(null);
    apiJson<{ subjects: EligibleCombo[] }>('/api/study/eligibility')
      .then((r) => setEligibility(r.subjects || []))
      .catch((e) => setEligibilityError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setEligibilityLoading(false));
  }, []);

  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'teacher')) {
      fetchEligibility();
    }
  }, [user, fetchEligibility]);

  const boards = useMemo(() => [...new Set(eligibility.map((e) => e.board))].sort(), [eligibility]);
  const classesForBoard = useMemo(
    () => [...new Set(eligibility.filter((e) => e.board === board).map((e) => e.classLevel))].sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
    [eligibility, board]
  );
  const subjectsForBoardClass = useMemo(
    () => [...new Set(eligibility.filter((e) => e.board === board && e.classLevel === classLevel).map((e) => e.subject))].sort(),
    [eligibility, board, classLevel]
  );

  useAutoSelectSingleOption(board, setBoard, boards);
  useAutoSelectSingleOption(classLevel, setClassLevel, classesForBoard);
  useAutoSelectSingleOption(subject, setSubject, subjectsForBoardClass);
  useAutoSelectSingleOption(topic, setTopic, topics);

  useEffect(() => {
    setClassLevel('');
    setSubject('');
    setTopic('');
    setTopics([]);
  }, [board]);

  useEffect(() => {
    setSubject('');
    setTopic('');
    setTopics([]);
  }, [classLevel]);

  useEffect(() => {
    setTopic('');
    if (!subject || !board || !classLevel) {
      setTopics([]);
      return;
    }
    setTopicsLoading(true);
    apiJson<{ topics: string[] }>(
      `/api/study/topics?subject=${encodeURIComponent(subject)}&board=${encodeURIComponent(board)}&classLevel=${encodeURIComponent(classLevel)}`
    )
      .then((r) => setTopics(r.topics || []))
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, [subject, board, classLevel]);

  const [readAloudCurrentPageText, setReadAloudCurrentPageText] = useState('');
  const handleCurrentPageTextChange = useCallback((text: string) => {
    setReadAloudCurrentPageText(text);
  }, []);

  useEffect(() => {
    setReadAloudCurrentPageText('');
  }, [material]);

  const textOnlySections = useMemo(() => {
    if (!material?.sections) return [];
    return material.sections.filter((s) => s.type === 'text' || !s.type);
  }, [material]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !board || !classLevel || !topic) {
      setError('Please select all fields');
      return;
    }
    setLoading(true);
    setError('');
    setMaterial(null);
    try {
      const res = await apiJson<MaterialWithId>('/api/study/generate', {
        method: 'POST',
        body: JSON.stringify({ subject, board, classLevel, topic }),
      });
      setMaterial(res);
    } catch (err) {
      setError((err as Error).message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !board || !classLevel || !doubtQuestion.trim()) {
      setDoubtError('Subject, board, class, and question are required');
      return;
    }
    setDoubtLoading(true);
    setDoubtError('');
    setDoubtAnswer(null);
    setQuestionWarning(false);
    setAnswerWarning(false);
    try {
      const res = await apiJson<{ answer: string; questionWarning?: boolean; answerWarning?: boolean }>('/api/study/ask', {
        method: 'POST',
        body: JSON.stringify({ question: doubtQuestion.trim(), subject, board, classLevel, topic: topic || 'General' }),
      });
      setDoubtAnswer(res.answer);
      setQuestionWarning(res.questionWarning ?? false);
      setAnswerWarning(res.answerWarning ?? false);
    } catch (err) {
      setDoubtError((err as Error).message || 'Failed to get answer');
    } finally {
      setDoubtLoading(false);
    }
  };

  const handleRequestReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material?.contentId || !remark.trim() || remark.trim().length < 10) {
      setSubmitError('Please provide a remark of at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiJson('/api/ai-review', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'course_material',
          entityId: material.contentId,
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

  const handleNewMaterial = () => {
    setMaterial(null);
    setDoubtAnswer(null);
    setDoubtQuestion('');
  };

  const canUseStudyMaterials = eligibility.length > 0;
  const formDisabled = !canUseStudyMaterials;
  const hasMaterial = !!material;

  if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
    return null;
  }

  if (eligibilityLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading...</p>
      </div>
    );
  }

  if (eligibilityError) {
    return <InlineErrorDisplay error={eligibilityError} onRetry={fetchEligibility} fullPage />;
  }

  return (
    <div className="w-full animate-fade-in">
      {loading && <StudyMaterialLoadingOverlay />}

      {!hasMaterial ? (
        <>
          <PageHeader
            icon="📚"
            title={t('studyMaterials') || 'Study Materials'}
            subtitle="AI-powered study content from your enrolled courses"
          />

          <ContentCard className="mb-6 stagger-1" decorative={false}>
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">ℹ️</div>
                <div>
                  <h3 className="font-semibold text-brand-800">Who can use this?</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {user.role === 'student'
                      ? 'Generate study materials for subjects you are enrolled in.'
                      : 'Generate study materials for subjects you teach.'}
                  </p>
                  {!canUseStudyMaterials && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">
                      {user.role === 'student'
                        ? 'No active enrollments. Enroll in a course to use AI study materials.'
                        : 'Complete your teacher profile to use AI study materials.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ContentCard>

          <ContentCard className="mb-6 stagger-2">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-brand-200 text-2xl shadow-md">🤖</div>
                <div>
                  <h2 className="text-xl font-bold text-brand-800">Generate AI Study Material</h2>
                  <p className="text-sm text-gray-600">Choose your course and topic</p>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Board</label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      disabled={formDisabled}
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                    >
                      <option value="">Select board</option>
                      {boards.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      disabled={formDisabled || !board}
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                    >
                      <option value="">Select class</option>
                      {classesForBoard.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={formDisabled || !classLevel}
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                    >
                      <option value="">Select subject</option>
                      {subjectsForBoardClass.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Topic</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={formDisabled || !subject || topicsLoading}
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                    >
                      <option value="">{topicsLoading ? 'Loading...' : 'Select topic'}</option>
                      {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || formDisabled || !topic}
                  className="rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-brand-600 hover:to-violet-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : '✨ Generate'}
                </button>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              </form>
            </div>
          </ContentCard>
        </>
      ) : (
        <>
          <PageHeader
            icon="📚"
            title={material?.title || 'Study Material'}
            subtitle={`${topic} • ${subject}`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                {readAloudCurrentPageText && (
                  <ReadAloudButton
                    text={readAloudCurrentPageText}
                    preferFemaleVoice
                    aria-label="Read aloud"
                    className="!border-white/60 !bg-white/20 !text-white hover:!bg-white/30"
                  />
                )}
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="rounded-xl border-2 border-white/60 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
                >
                  Request human review
                </button>
                <button
                  onClick={handleNewMaterial}
                  className="rounded-xl border-2 border-white/60 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
                >
                  New material
                </button>
              </div>
            }
          />

          <div className="space-y-8">
            {textOnlySections.length > 0 && (
              <StudyMaterialBook
                sections={textOnlySections}
                title={material?.title}
                onCurrentPageTextChange={handleCurrentPageTextChange}
              />
            )}

            {material?.flashcards && material.flashcards.length > 0 && (
              <StudyMaterialFlashcards
                cards={material.flashcards}
                title="Test what you understood!"
              />
            )}

            <ContentCard>
              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-200 text-2xl shadow-md">💬</div>
                  <div>
                    <h2 className="text-xl font-bold text-brand-800">Ask a Doubt</h2>
                    <p className="text-sm text-gray-600">Ask a question about this topic</p>
                  </div>
                </div>

                <form onSubmit={handleAskDoubt} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Your question</label>
                    <textarea
                      value={doubtQuestion}
                      onChange={(e) => setDoubtQuestion(e.target.value)}
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      rows={3}
                      placeholder="e.g. What is the quadratic formula?"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={doubtLoading}
                    className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {doubtLoading ? 'Getting answer...' : 'Ask Doubt'}
                  </button>
                  {doubtError && <p className="text-sm text-red-600">{doubtError}</p>}
                  {doubtAnswer && (
                    <div className="mt-4 rounded-xl border-2 border-brand-100 bg-brand-50/50 p-4">
                      {(questionWarning || answerWarning) && (
                        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                          ⚠️ Some content was automatically masked. Please keep questions respectful.
                        </div>
                      )}
                      <h3 className="mb-2 font-medium text-brand-800">Answer</h3>
                      <div className="whitespace-pre-wrap text-gray-700">{doubtAnswer}</div>
                    </div>
                  )}
                </form>
              </div>
            </ContentCard>
          </div>
        </>
      )}

      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setRemark(''); setSubmitError(''); setSubmitSuccess(false); }}
        maxWidth="max-w-lg"
      >
        <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">✋</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Request Human Review</h2>
                  <p className="text-sm text-white/90">Report errors in AI-generated content</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowReviewModal(false); setRemark(''); setSubmitError(''); setSubmitSuccess(false); }}
                className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            {submitSuccess ? (
              <div className="rounded-xl bg-green-50 p-6 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-semibold text-green-800">Review request submitted</p>
                <p className="mt-1 text-sm text-green-700">An admin will review it shortly. Track status in Review Requests.</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  If you believe the AI-generated content has errors, describe your concern below. An admin will review and correct it.
                </p>
                <form onSubmit={handleRequestReview}>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Explain what needs to be corrected (min 10 characters)..."
                    className="mb-4 w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    rows={4}
                    minLength={10}
                    required
                  />
                  {submitError && <p className="mb-2 text-sm text-red-600">{submitError}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowReviewModal(false); setRemark(''); setSubmitError(''); }}
                      className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || remark.trim().length < 10}
                      className="flex-1 rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
