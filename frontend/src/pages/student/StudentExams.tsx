import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';

interface Exam {
  _id: string;
  subject?: string;
  topic?: string;
  score?: number;
  totalMarks?: number;
  status?: string;
  attemptedAt?: string;
}

interface Response {
  exams?: Exam[];
}

type EligibleCombo = { subject: string; board: string; classLevel: string };
type AnswerMode = 'typed' | 'photo' | 'audio';

export default function StudentExams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [eligibility, setEligibility] = useState<EligibleCombo[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [board, setBoard] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [examType, setExamType] = useState<'quick_test' | 'class_test' | 'preparatory'>('class_test');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('typed');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const { t } = useLanguage();

  const fetchEligibility = useCallback(() => {
    setEligibilityLoading(true);
    setEligibilityError(null);
    apiJson<{ subjects: EligibleCombo[] }>('/api/student/exam/eligibility')
      .then((r) => setEligibility(r.subjects || []))
      .catch((e) => setEligibilityError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setEligibilityLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'student') fetchEligibility();
  }, [user, fetchEligibility]);

  useEffect(() => {
    apiJson<Exam[] | Response>('/api/student/exams')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as Response).exams || [];
        setExams(list);
      })
      .catch((e) => setListError((e as Error).message))
      .finally(() => setListLoading(false));
  }, []);

  const boards = useMemo(() => [...new Set(eligibility.map((e) => e.board))].sort(), [eligibility]);
  const classesForBoard = useMemo(
    () =>
      [...new Set(eligibility.filter((e) => e.board === board).map((e) => e.classLevel))].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      ),
    [eligibility, board]
  );
  const subjectsForBoardClass = useMemo(
    () =>
      [...new Set(eligibility.filter((e) => e.board === board && e.classLevel === classLevel).map((e) => e.subject))].sort(),
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
      `/api/student/exam/topics?subject=${encodeURIComponent(subject)}&board=${encodeURIComponent(board)}&class=${encodeURIComponent(classLevel)}`
    )
      .then((r) => setTopics(r.topics || []))
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, [subject, board, classLevel]);

  const canStart = eligibility.length > 0;

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !board || !classLevel || !topic) {
      setStartError('Select board, class, subject, and topic.');
      return;
    }
    setStarting(true);
    setStartError('');
    try {
      const res = await apiJson<{ examId: string }>('/api/student/exam/start', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          board,
          classLevel,
          examType,
          topics: [topic],
          answerInputType: answerMode,
        }),
      });
      navigate(`/student/exam/take?examId=${encodeURIComponent(res.examId)}`);
    } catch (err) {
      setStartError((err as Error).message || 'Failed to start exam');
    } finally {
      setStarting(false);
    }
  };

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

  if (!user || user.role !== 'student') {
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
      <PageHeader
        icon="📝"
        title={t('exams')}
        subtitle="AI-generated exams from your enrolled courses — same flow as study resources"
      />

      <ContentCard className="mb-6 stagger-1" decorative={false}>
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-brand-800">Who can take exams?</h3>
              <p className="mt-1 text-sm text-gray-600">Exams are limited to subjects you have an active enrollment in.</p>
              {!canStart && (
                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">
                  No active enrollments. Enroll in a course to take exams.
                </p>
              )}
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard className="mb-8 stagger-2">
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-brand-200 text-2xl shadow-md">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-800">Start a new exam</h2>
              <p className="text-sm text-gray-600">Pick course, topic, format, and how you will answer</p>
            </div>
          </div>

          <form onSubmit={handleStartExam} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  disabled={!canStart}
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                >
                  <option value="">Select board</option>
                  {boards.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  disabled={!canStart || !board}
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                >
                  <option value="">Select class</option>
                  {classesForBoard.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!canStart || !classLevel}
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                >
                  <option value="">Select subject</option>
                  {subjectsForBoardClass.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={!canStart || !subject || topicsLoading}
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                >
                  <option value="">{topicsLoading ? 'Loading...' : 'Select topic'}</option>
                  {topics.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Exam format</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as typeof examType)}
                  disabled={!canStart}
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                >
                  <option value="quick_test">Quick test (short)</option>
                  <option value="class_test">Class test</option>
                  <option value="preparatory">Preparatory (long)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Answer mode</label>
                <select
                  value={answerMode}
                  onChange={(e) => setAnswerMode(e.target.value as AnswerMode)}
                  disabled={!canStart}
                  className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100"
                >
                  <option value="typed">Typed text</option>
                  <option value="photo">Photo / sketch upload</option>
                  <option value="audio">Spoken (recorded)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={starting || !canStart || !topic}
              className="rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-brand-600 hover:to-violet-700 disabled:opacity-50"
            >
              {starting ? 'Starting…' : '✨ Start exam'}
            </button>
            {startError && <p className="text-sm text-red-600">{startError}</p>}
          </form>
        </div>
      </ContentCard>

      <PageHeader icon="📋" title="Your attempts" subtitle={`${exams.length} saved exam${exams.length !== 1 ? 's' : ''}`} />

      {listLoading ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <p className="text-sm font-medium text-gray-500">Loading exams...</p>
        </div>
      ) : listError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Error: {listError}</div>
      ) : exams.length === 0 ? (
        <ContentCard decorative={false}>
          <div className="p-8 text-center text-gray-600">No exams yet. Start one above.</div>
        </ContentCard>
      ) : (
        <div className="space-y-4">
          {exams.map((e, idx) => (
            <Link
              key={e._id}
              to={`/student/exams/${e._id}`}
              className="block animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <ContentCard>
                <div className="flex items-center gap-4 p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-xl">
                    📝
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-brand-800">{e.subject || e.topic || 'Exam'}</h3>
                    <p className="text-sm text-gray-600">
                      {e.score != null && e.totalMarks != null ? `Score: ${e.score}/${e.totalMarks}` : ''}
                      {e.status && ` • ${e.status}`}
                    </p>
                    <p className="text-sm text-gray-500">Attempted: {formatDate(e.attemptedAt)}</p>
                  </div>
                  <span className="text-brand-600">View →</span>
                </div>
              </ContentCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
