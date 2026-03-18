import { useState, useMemo } from 'react';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { ReadAloudButton } from '@/components/ReadAloudButton';

interface Material {
  title?: string;
  summary?: string;
  sections?: { heading: string; content: string }[];
}

interface MaterialWithId extends Material {
  contentId?: string;
}

export default function StudyMaterials() {
  const [subject, setSubject] = useState('');
  const [board, setBoard] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [topic, setTopic] = useState('');
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
  const { t } = useLanguage();

  const readAloudText = useMemo(() => {
    if (!material) return '';
    return [
      material.title,
      material.summary,
      ...(material.sections ?? []).flatMap((s) => [s.heading, s.content]),
    ]
      .filter(Boolean)
      .join('. ');
  }, [material]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !board || !classLevel || !topic) {
      setError('Please fill all fields');
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
      const res = await apiJson<{ answer: string; questionWarning?: boolean; answerWarning?: boolean; sentimentScore?: number }>('/api/study/ask', {
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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">
        {t('studyMaterials') || 'Study Materials'}
      </h1>

      <form onSubmit={handleGenerate} className="mb-8 rounded-xl border border-brand-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-brand-800">Generate AI Study Material</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g. Mathematics"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Board</label>
            <input
              type="text"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g. CBSE"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Class</label>
            <input
              type="text"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g. 10"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g. Quadratic Equations"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form onSubmit={handleAskDoubt} className="mb-8 rounded-xl border border-brand-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-brand-800">Ask a Doubt</h2>
        <p className="mb-4 text-sm text-gray-600">Ask a question about your subject. Use the same subject, board, class, and topic above.</p>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-600">Your question</label>
          <textarea
            value={doubtQuestion}
            onChange={(e) => setDoubtQuestion(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="e.g. What is the quadratic formula?"
            required
          />
        </div>
        <button
          type="submit"
          disabled={doubtLoading || !subject || !board || !classLevel}
          className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {doubtLoading ? 'Getting answer...' : 'Ask Doubt'}
        </button>
        {doubtError && <p className="mt-2 text-red-600">{doubtError}</p>}
        {doubtAnswer && (
          <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50/50 p-4">
            {(questionWarning || answerWarning) && (
              <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                ⚠️ Some content was automatically masked for inappropriate language. Please keep questions and answers respectful.
              </div>
            )}
            <h3 className="mb-2 font-medium text-brand-800">Answer</h3>
            <div className="whitespace-pre-wrap text-gray-700">{doubtAnswer}</div>
          </div>
        )}
      </form>

      {material && (
        <div className="rounded-xl border border-brand-200 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-brand-800">{material.title}</h2>
              {readAloudText && (
                <ReadAloudButton
                  text={readAloudText}
                  preferFemaleVoice
                  aria-label="Read study material aloud"
                />
              )}
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="shrink-0 rounded-lg border border-amber-500 bg-amber-50 px-4 py-2 text-sm text-amber-800 hover:bg-amber-100"
            >
              Request human review
            </button>
          </div>
          {material.summary && (
            <p className="mb-4 text-gray-700">{material.summary}</p>
          )}
          {material.sections?.map((s, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-medium text-brand-700">{s.heading}</h3>
              <p className="mt-1 text-gray-600">{s.content}</p>
            </div>
          ))}

          {showReviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-semibold text-brand-800">Request Human Review</h2>
                <p className="mb-4 text-sm text-gray-600">
                  If you believe the AI-generated content has errors, request a human admin to review
                  and correct it. Please explain your concern (at least 10 characters).
                </p>
                {submitSuccess ? (
                  <div className="rounded-lg bg-green-50 p-4 text-green-800">
                    Your review request has been submitted. An admin will review it shortly. Track
                    status in &quot;Review Requests&quot;.
                  </div>
                ) : (
                  <form onSubmit={handleRequestReview}>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Explain what needs to be corrected..."
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
