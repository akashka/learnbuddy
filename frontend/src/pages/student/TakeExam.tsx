import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';

interface Question {
  question: string;
  type: string;
  options?: string[];
  marks: number;
  imageUrl?: string;
  requiresDrawing?: boolean;
}

type AnswerInputType = 'typed' | 'photo' | 'audio';
type AnswerCell = number | string | { value?: number | string; photoUrl?: string };

interface ExamPayload {
  _id: string;
  status?: string;
  questions?: Question[];
  timeLimit?: number;
  totalMarks?: number;
  answerInputType?: AnswerInputType;
  subject?: string;
  board?: string;
  classLevel?: string;
}

const MONITOR_INTERVAL_MS = 20000;
const AUDIO_RECORD_MS = 5000;

export default function TakeExam() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examIdParam = searchParams.get('examId') || '';
  const subject = searchParams.get('subject') || '';
  const board = searchParams.get('board') || '';
  const classLevel = searchParams.get('classLevel') || '';

  const [step, setStep] = useState<'pre' | 'ready' | 'exam' | 'submitted'>('pre');
  const [examId, setExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<AnswerCell[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingExamDoc, setLoadingExamDoc] = useState(!!examIdParam);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState(0);
  const [monitorError, setMonitorError] = useState('');
  const [answerInputType, setAnswerInputType] = useState<AnswerInputType>('typed');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerRecorderRef = useRef<MediaRecorder | null>(null);
  const answerStreamRef = useRef<MediaStream | null>(null);
  const [answerRecording, setAnswerRecording] = useState(false);

  const captureFrame = useCallback((): Promise<string | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return Promise.resolve(null);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    ctx.drawImage(video, 0, 0);
    return Promise.resolve(canvas.toDataURL('image/jpeg', 0.7));
  }, []);

  const captureAudio = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) {
        resolve(null);
        return;
      }
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (!audioTrack) {
        resolve(null);
        return;
      }
      const audioStream = new MediaStream([audioTrack]);
      const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setTimeout(() => recorder.stop(), Math.min(AUDIO_RECORD_MS, 4000));
    });
  }, []);

  const sendMonitor = useCallback(async () => {
    if (!examId) return;
    const frame = await captureFrame();
    if (!frame) return;
    const audio = await captureAudio();
    try {
      const res = await apiJson<{ alert?: boolean; transcript?: string; transcriptWarning?: boolean; warnings?: number }>(
        '/api/student/exam/monitor',
        {
          method: 'POST',
          body: JSON.stringify({ examId, frame, audio: audio || undefined }),
        }
      );
      if (res.alert) setWarnings((w) => w + 1);
      if (res.transcriptWarning) setMonitorError('Inappropriate speech detected. Keep your responses respectful.');
    } catch (err) {
      setMonitorError((err as Error).message);
    }
  }, [examId, captureFrame, captureAudio]);

  useEffect(() => {
    if (!examIdParam) {
      setLoadingExamDoc(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingExamDoc(true);
      setError('');
      try {
        const ex = await apiJson<ExamPayload>(`/api/student/exam/${examIdParam}`);
        if (cancelled) return;
        const terminal = ['completed', 'evaluating', 'terminated'].includes(ex.status || '');
        if (terminal) {
          navigate(`/student/exams/${examIdParam}`);
          return;
        }
        setExamId(String(ex._id));
        setQuestions(ex.questions || []);
        const tl = ex.timeLimit || 30;
        setTimeLimit(tl);
        setTimeLeft(tl * 60);
        setAnswerInputType(ex.answerInputType || 'typed');
        setAnswers(new Array((ex.questions || []).length).fill(''));
        setStep('ready');
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Failed to load exam');
      } finally {
        if (!cancelled) setLoadingExamDoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examIdParam, navigate]);

  const startExam = async () => {
    if (!subject || !board || !classLevel) {
      setError('Subject, board, and class are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiJson<{
        examId: string;
        questions: Question[];
        timeLimit: number;
        totalMarks: number;
        answerInputType?: AnswerInputType;
      }>('/api/student/exam/start', {
        method: 'POST',
        body: JSON.stringify({ subject, board, classLevel, examType: 'class_test', answerInputType: 'typed' }),
      });
      setExamId(res.examId);
      setQuestions(res.questions || []);
      const tl = res.timeLimit || 30;
      setTimeLimit(tl);
      setTimeLeft(tl * 60);
      setAnswerInputType(res.answerInputType || 'typed');
      setAnswers(new Array((res.questions || []).length).fill(''));
      setStep('ready');
    } catch (err) {
      setError((err as Error).message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const startWithMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStep('exam');
      setMonitorError('');
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      setTimeout(() => sendMonitor(), 3000);
      monitorIntervalRef.current = setInterval(sendMonitor, MONITOR_INTERVAL_MS);
    } catch (err) {
      setError('Camera and microphone access required for exam monitoring.');
    }
  };

  const stopAnswerRecording = () => {
    if (answerRecorderRef.current && answerRecorderRef.current.state !== 'inactive') {
      answerRecorderRef.current.stop();
    }
    answerRecorderRef.current = null;
    if (answerStreamRef.current) {
      answerStreamRef.current.getTracks().forEach((t) => t.stop());
      answerStreamRef.current = null;
    }
    setAnswerRecording(false);
  };

  const startAnswerRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      answerStreamRef.current = stream;
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        answerStreamRef.current = null;
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const a = [...answers];
          a[currentQ] = { value: reader.result as string };
          setAnswers(a);
        };
        reader.readAsDataURL(blob);
      };
      rec.start();
      answerRecorderRef.current = rec;
      setAnswerRecording(true);
    } catch {
      setError('Microphone access is required to record spoken answers.');
    }
  };

  const serializeAnswers = (): (number | string | { value?: number | string; photoUrl?: string })[] => {
    return answers.map((a, i) => {
      const q = questions[i];
      if (q?.type === 'mcq') {
        return typeof a === 'number' ? a : 0;
      }
      if (answerInputType === 'photo') {
        if (typeof a === 'object' && a !== null && 'photoUrl' in a && typeof a.photoUrl === 'string' && a.photoUrl.startsWith('data:image')) {
          return { value: '', photoUrl: a.photoUrl };
        }
        return { value: typeof a === 'string' ? a : '', photoUrl: '' };
      }
      if (answerInputType === 'audio') {
        if (typeof a === 'object' && a !== null && typeof a.value === 'string' && a.value.startsWith('data:audio')) {
          return { value: a.value };
        }
        if (typeof a === 'string' && a.startsWith('data:audio')) return { value: a };
        return { value: String(a ?? '') };
      }
      if (typeof a === 'object' && a !== null && 'value' in a && typeof (a as { value?: unknown }).value === 'string') {
        return (a as { value: string }).value;
      }
      return String(a ?? '');
    });
  };

  const handleSubmit = async () => {
    stopAnswerRecording();
    if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStep('submitted');
    if (!examId) return;
    try {
      await apiJson('/api/student/exam/submit', {
        method: 'POST',
        body: JSON.stringify({
          examId,
          answers: serializeAnswers(),
          timeTaken: Math.max(1, Math.round((timeLimit * 60 - timeLeft) / 60)),
          warnings,
        }),
      });
      await apiJson('/api/student/exam/evaluate', {
        method: 'POST',
        body: JSON.stringify({ examId }),
      });
      navigate(`/student/exams/${examId}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit');
      setStep('exam');
    }
  };

  useEffect(() => {
    return () => {
      stopAnswerRecording();
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loadingExamDoc) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm text-gray-600">Loading exam…</p>
      </div>
    );
  }

  if (step === 'pre') {
    return (
      <div>
        <button type="button" onClick={() => navigate(-1)} className="mb-4 text-brand-600 hover:underline">
          ← Back
        </button>
        <h1 className="mb-6 text-2xl font-bold text-brand-800">Take Exam</h1>
        {subject && board && classLevel ? (
          <div className="rounded-xl border border-brand-200 bg-white p-6">
            <p className="mb-4 text-gray-700">
              <strong>{subject}</strong> • {board} Class {classLevel}
            </p>
            <p className="mb-4 text-sm text-gray-600">
              You will need to allow camera and microphone for AI monitoring. Your speech may be transcribed for security.
            </p>
            {error && <p className="mb-4 text-red-600">{error}</p>}
            <button
              type="button"
              onClick={startExam}
              disabled={loading}
              className="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Exam'}
            </button>
          </div>
        ) : (
          <p className="text-gray-600">
            Open an exam from the Exams page, or pick a course that links here with subject, board, and class.
          </p>
        )}
      </div>
    );
  }

  if (step === 'ready') {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-brand-800">Ready to Start</h1>
        <div className="rounded-xl border border-brand-200 bg-white p-6">
          <p className="mb-2">
            {questions.length} questions • {timeLimit} minutes
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Answer mode: <strong>{answerInputType}</strong>. Allow camera and microphone when prompted. AI monitoring runs during the exam.
          </p>
          <button
            type="button"
            onClick={startWithMonitoring}
            className="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700"
          >
            Begin Exam
          </button>
        </div>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-brand-800">Submitting...</h1>
        <p className="text-gray-600">Redirecting to results...</p>
      </div>
    );
  }

  const q = questions[currentQ];
  const photoAns = typeof answers[currentQ] === 'object' && answers[currentQ] && 'photoUrl' in answers[currentQ]
    ? (answers[currentQ] as { photoUrl?: string }).photoUrl
    : '';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-brand-600 hover:underline">
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-amber-600">Time: {formatTime(timeLeft)}</span>
          {warnings > 0 && (
            <span className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-800">
              {warnings} warning{warnings > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {monitorError && <p className="mb-2 text-sm text-amber-700">Monitoring: {monitorError}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="mb-6 flex gap-6">
        <div className="flex-1">
          <div className="rounded-xl border border-brand-200 bg-white p-6">
            <p className="mb-2 text-sm text-gray-500">
              Question {currentQ + 1} of {questions.length}
            </p>
            {q?.imageUrl && (
              <img src={q.imageUrl} alt="" className="mb-4 max-h-48 w-auto rounded border border-gray-200" />
            )}
            <h2 className="mb-4 text-lg font-semibold text-brand-800">{q?.question}</h2>
            {q?.type === 'mcq' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name={`q${currentQ}`}
                      checked={answers[currentQ] === i}
                      onChange={() => {
                        const a = [...answers];
                        a[currentQ] = i;
                        setAnswers(a);
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {q?.type !== 'mcq' && answerInputType === 'typed' && (
              <textarea
                value={String(answers[currentQ] ?? '')}
                onChange={(e) => {
                  const a = [...answers];
                  a[currentQ] = e.target.value;
                  setAnswers(a);
                }}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={4}
                placeholder="Type your answer..."
              />
            )}
            {q?.type !== 'mcq' && answerInputType === 'photo' && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const a = [...answers];
                      a[currentQ] = { value: '', photoUrl: reader.result as string };
                      setAnswers(a);
                    };
                    reader.readAsDataURL(f);
                  }}
                />
                {photoAns ? (
                  <img src={photoAns} alt="Your answer" className="max-h-56 rounded border border-gray-200" />
                ) : (
                  <p className="text-sm text-gray-500">Upload a clear photo of your handwritten work or diagram.</p>
                )}
              </div>
            )}
            {q?.type !== 'mcq' && answerInputType === 'audio' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {!answerRecording ? (
                    <button
                      type="button"
                      onClick={startAnswerRecording}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
                    >
                      Record answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopAnswerRecording}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      Stop recording
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Record a short spoken answer (a few sentences). It will be transcribed when you submit.
                </p>
                {typeof answers[currentQ] === 'object' &&
                  answers[currentQ] &&
                  typeof (answers[currentQ] as { value?: string }).value === 'string' &&
                  (answers[currentQ] as { value: string }).value.startsWith('data:audio') && (
                    <p className="text-sm font-medium text-green-700">Recording saved for this question.</p>
                  )}
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
              >
                Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQ((c) => c + 1)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="w-80 shrink-0">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="mb-2 text-sm font-medium text-brand-800">AI Monitoring</p>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded border border-brand-200"
              style={{ transform: 'scaleX(-1)' }}
            />
            <p className="mt-2 text-xs text-gray-600">Camera & mic active for proctoring</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentQ(i)}
                className={`h-8 w-8 rounded text-sm ${
                  currentQ === i ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-800'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
