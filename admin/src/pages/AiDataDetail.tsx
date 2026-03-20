import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import BackLink from '@/components/BackLink';
import { formatDateTime } from '@shared/formatters';

type AiItem = {
  _id: string;
  type?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  topic?: string;
  topics?: string[];
  question?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  adminFeedback?: { whatWasWrong: string; flaggedAt: string; flaggedBy?: { name?: string; email?: string } }[];
  createdAt?: string;
};

const TYPE_LABELS: Record<string, string> = {
  resource: 'Study Material',
  doubt_answer: 'Doubt Answer',
  exam_questions: 'Exam Questions',
  qualification_exam: 'Qualification Exam',
};

function getAskLabel(item: AiItem): string {
  switch (item.type) {
    case 'doubt_answer':
      return item.question ?? 'No question recorded';
    case 'resource':
      return `Generate study material for "${item.topic ?? 'topic'}" in ${item.subject ?? ''} (${item.board ?? ''} Class ${item.classLevel ?? ''})`;
    case 'generate_flashcards':
      return `Generate flashcards for "${item.topic ?? 'topic'}" in ${item.subject ?? ''} (${item.board ?? ''} Class ${item.classLevel ?? ''})`;
    case 'exam_questions':
      return `Generate exam questions for ${item.subject ?? ''} (${item.board ?? ''} Class ${item.classLevel ?? ''})${item.topics?.length ? ` - Topics: ${item.topics.join(', ')}` : ''}`;
    case 'qualification_exam':
      return `Generate qualification exam for ${item.subject ?? ''} (${item.board ?? ''} Class ${item.classLevel ?? ''})`;
    default:
      return `${item.type ?? 'Unknown'} - ${item.subject ?? ''} ${item.topic ?? ''}`;
  }
}

function renderContent(content: Record<string, unknown> | undefined, type: string): React.ReactNode {
  if (!content) return <p className="text-accent-600">No content</p>;

  if (type === 'doubt_answer' && typeof content.answer === 'string') {
    return (
      <div className="prose max-w-none rounded-lg border border-accent-200 bg-accent-50/50 p-4">
        <p className="whitespace-pre-wrap text-accent-800">{content.answer}</p>
        {content.sentimentScore != null && (
          <p className="mt-2 text-sm text-accent-600">Sentiment score: {String(content.sentimentScore)}</p>
        )}
      </div>
    );
  }

  if (type === 'resource') {
    const title = content.title as string;
    const summary = content.summary as string;
    const sections = content.sections as { heading?: string; body?: string }[] | undefined;
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold text-accent-800">{title}</h3>}
        {summary && <p className="text-accent-700">{summary}</p>}
        {sections?.map((s, i) => (
          <div key={i} className="rounded-lg border border-accent-200 p-4">
            {s.heading && <h4 className="mb-2 font-medium text-accent-800">{s.heading}</h4>}
            {s.body && <p className="whitespace-pre-wrap text-accent-700">{s.body}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'exam_questions' || type === 'qualification_exam') {
    const questions = content.questions as Array<{ question?: string; options?: string[]; correctAnswer?: string; marks?: number }> | undefined;
    const timeLimit = content.timeLimit as number | undefined;
    const totalMarks = content.totalMarks as number | undefined;
    return (
      <div className="space-y-4">
        {(timeLimit != null || totalMarks != null) && (
          <p className="text-sm text-accent-600">
            {timeLimit != null && `Time limit: ${timeLimit} min`}
            {timeLimit != null && totalMarks != null && ' • '}
            {totalMarks != null && `Total marks: ${totalMarks}`}
          </p>
        )}
        {questions?.map((q, i) => (
          <div key={i} className="rounded-lg border border-accent-200 p-4">
            <p className="font-medium text-accent-800">{i + 1}. {q.question ?? '(No question)'}</p>
            {q.options?.length ? (
              <ul className="mt-2 list-inside list-disc text-accent-700">
                {q.options.map((o, j) => (
                  <li key={j}>{o}</li>
                ))}
              </ul>
            ) : null}
            {q.correctAnswer && <p className="mt-1 text-sm text-green-700">Correct: {q.correctAnswer}</p>}
            {q.marks != null && <p className="text-sm text-accent-600">Marks: {q.marks}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

export default function AiDataDetail() {
  const { id } = useParams<{ id: string }>();
  useLocation(); // Ensures router context is available for BackLink
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<AiItem | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItem = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.aiData
      .get(id)
      .then((d) => setItem(d as AiItem))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !feedbackText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await adminApi.aiData.submitFeedback(id, feedbackText.trim());
      setItem(updated as AiItem);
      setFeedbackText('');
      toast.success('Feedback submitted. AI team will use this to improve.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="p-8">
        <p className="text-accent-600">Invalid AI content ID</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <BackLink to="/ai-data" label="Back to AI Data" />
      </div>

      <h1 className="mb-6 text-2xl font-bold text-accent-800">AI Content Detail</h1>

      <DataState loading={loading} error={error} onRetry={fetchItem}>
        {item && (
          <div className="space-y-8">
            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Context</h2>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div><dt className="text-sm font-medium text-accent-600">Type</dt><dd>{TYPE_LABELS[item.type ?? ''] ?? item.type}</dd></div>
                <div><dt className="text-sm font-medium text-accent-600">Board</dt><dd>{item.board ?? '-'}</dd></div>
                <div><dt className="text-sm font-medium text-accent-600">Class</dt><dd>{item.classLevel ?? '-'}</dd></div>
                <div><dt className="text-sm font-medium text-accent-600">Subject</dt><dd>{item.subject ?? '-'}</dd></div>
                <div><dt className="text-sm font-medium text-accent-600">Topic</dt><dd>{item.topic ?? (item.topics?.join(', ')) ?? '-'}</dd></div>
                <div><dt className="text-sm font-medium text-accent-600">Created</dt><dd>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</dd></div>
              </dl>
            </section>

            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">The Ask</h2>
              <p className="whitespace-pre-wrap rounded-lg border border-accent-200 bg-accent-50/50 p-4 text-accent-800">
                {getAskLabel(item)}
              </p>
            </section>

            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">AI Response</h2>
              {renderContent(item.content, item.type ?? '')}
            </section>

            {item.adminFeedback && item.adminFeedback.length > 0 && (
              <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-amber-800">Flagged Feedback ({item.adminFeedback.length})</h2>
                <ul className="space-y-3">
                  {item.adminFeedback.map((f, i) => (
                    <li key={i} className="rounded-lg border border-amber-200 bg-white p-4">
                      <p className="text-amber-900">{f.whatWasWrong}</p>
                      <p className="mt-1 text-sm text-amber-700">
                        {f.flaggedAt ? formatDateTime(f.flaggedAt) : ''}
                        {f.flaggedBy && (f.flaggedBy as { name?: string }).name && ` • by ${(f.flaggedBy as { name?: string }).name}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Flag an Issue (Inform AI to Improve)</h2>
              <p className="mb-4 text-sm text-accent-600">
                Content reviewers and teachers can flag issues here. This feedback helps improve AI quality over time.
              </p>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label htmlFor="feedback" className="mb-1 block text-sm font-medium text-accent-700">
                    What was wrong? Describe the issue so AI can improve.
                  </label>
                  <textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    placeholder="e.g. The explanation for quadratic equations was incorrect. The formula should be..."
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </section>
          </div>
        )}
      </DataState>
    </div>
  );
}
