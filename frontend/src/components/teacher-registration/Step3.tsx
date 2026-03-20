import { useState, useEffect, useRef } from 'react';
import { apiJson, API_BASE } from '@/lib/api';
import { formatDuration } from '@shared/formatters';

interface Question {
  question: string;
  type: 'mcq' | 'short';
  options?: string[];
  correctAnswer?: number | string;
}

interface Step3Props {
  phone: string;
  onNext: (step: number, data?: Record<string, unknown>) => void;
  onBack: () => void;
  onSave: (step: number, data: Record<string, unknown>) => Promise<void>;
  onExamActiveChange?: (active: boolean) => void;
  leaveExamRef?: React.MutableRefObject<{ confirmLeave: (navigateAfter?: boolean) => Promise<void> } | null>;
}

const MONITOR_INTERVAL_MS = 5000;
const AUDIO_RECORD_MS = 5000;

const EXAM_RULES = [
  'Camera and microphone must be ON throughout the exam.',
  'You must be alone in the room. No one else should be visible.',
  'No use of phones, books, or external help.',
  'Stay on the exam tab—do not switch tabs or applications.',
  'Right-click and Developer Tools (Inspect) are disabled and will result in warnings.',
  '3 warnings for any violation will result in exam termination.',
  'Your photo will be captured for profile verification.',
  'You can navigate between questions anytime.',
];

type SetupStatus = 'pending' | 'ok' | 'denied' | 'error';

export default function TeacherStep3({ phone, onNext, onBack, onExamActiveChange, leaveExamRef }: Step3Props) {
  const [phase, setPhase] = useState<'rules' | 'setup' | 'exam' | 'result'>('rules');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [cameraOn, setCameraOn] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score?: number; reason?: string } | null>(null);
  const [cameraStatus, setCameraStatus] = useState<SetupStatus>('pending');
  const [audioStatus, setAudioStatus] = useState<SetupStatus>('pending');
  const [notificationStatus, setNotificationStatus] = useState<SetupStatus>('pending');
  const [setupError, setSetupError] = useState<string>('');
  const [prefetchedExam, setPrefetchedExam] = useState<{ questions: Question[]; durationMinutes: number } | null>(null);
  const [prefetchError, setPrefetchError] = useState<string>('');
  const [prefetchRetry, setPrefetchRetry] = useState(0);
  const [examLoaderVisible, setExamLoaderVisible] = useState(false);
  const [examStatus, setExamStatus] = useState<'eligible' | 'retry_wait' | 'max_attempts_exceeded' | null>(null);
  const [retryAfterAt, setRetryAfterAt] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<{ h: number; m: number; s: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const devtoolsCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibilityWarnedRef = useRef(false);
  const devtoolsWarnedRef = useRef(false);
  const cameraBlankWarnedRef = useRef(false);
  const audioNoiseWarnedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const answersRef = useRef<(number | string)[]>([]);
  const questionsRef = useRef<Question[]>([]);
  const warningsRef = useRef(0);
  const warningLastCountedAtRef = useRef<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const submittedRef = useRef(false);

  const WARNING_COOLDOWN_MS = 60 * 1000;

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 4500);
  };

  const captureAudio = (): Promise<string | null> => {
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
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(audioStream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setTimeout(() => recorder.stop(), Math.min(AUDIO_RECORD_MS, 4000));
    });
  };

  const captureProfilePhoto = (): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  answersRef.current = answers;
  questionsRef.current = questions;
  warningsRef.current = warnings;

  const allSetupOk = cameraStatus === 'ok' && audioStatus === 'ok' && notificationStatus === 'ok';

  const terminateExam = (reason: string) => {
    if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    if (clientCheckIntervalRef.current) clearInterval(clientCheckIntervalRef.current);
    if (devtoolsCheckIntervalRef.current) clearInterval(devtoolsCheckIntervalRef.current);
    setResult({ passed: false, reason });
    setPhase('result');
    submitToApi(3, false);
    stopCamera();
  };

  const addWarning = (reason: string, type: string) => {
    showToast(reason);
    const now = Date.now();
    const lastAt = warningLastCountedAtRef.current[type] ?? 0;
    if (now - lastAt < WARNING_COOLDOWN_MS) return;
    warningLastCountedAtRef.current[type] = now;
    setWarnings((prev) => {
      const next = prev + 1;
      if (next >= 3) terminateExam('Too many warnings');
      return next;
    });
  };

  const stopCamera = () => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const submitToApi = async (warnCount: number, abandoned: boolean, options?: { skipResult?: boolean }) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      const profilePhotoUrl = captureProfilePhoto();
      const data = await apiJson<{ passed?: boolean; score?: number; reason?: string }>(
        '/api/teacher-registration/exam',
        {
          method: 'POST',
          body: JSON.stringify({
            phone,
            questions,
            answers,
            warnings: warnCount,
            closedDueToCheating: warnCount >= 3,
            profilePhotoUrl: profilePhotoUrl || undefined,
            abandoned,
          }),
        }
      );
      stopCamera();
      if (!options?.skipResult) {
        setResult({ passed: data.passed ?? false, score: data.score, reason: data.reason });
        setPhase('result');
      }
    } catch {
      submittedRef.current = false;
    }
  };

  const sendAbandonedBeacon = () => {
    if (submittedRef.current || !questionsRef.current.length) return;
    const profilePhotoUrl = captureProfilePhoto();
    const payload = JSON.stringify({
      phone,
      questions: questionsRef.current,
      answers: answersRef.current,
      warnings: warningsRef.current,
      abandoned: true,
      profilePhotoUrl: profilePhotoUrl || undefined,
    });
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon?.(`${API_BASE}/api/teacher-registration/exam`, blob);
    submittedRef.current = true;
  };

  const formatTimeLeft = (s: number) => formatDuration(s);

  const confirmLeaveImplRef = useRef<((navigateAfter?: boolean) => Promise<void>) | undefined>(undefined);
  confirmLeaveImplRef.current = async (navigateAfter = true) => {
    if (phase !== 'exam') return;
    setLoading(true);
    await submitToApi(warnings, true, { skipResult: true });
    setLoading(false);
    if (navigateAfter) onBack();
  };

  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  useEffect(() => {
    onExamActiveChange?.(phase === 'exam');
  }, [phase, onExamActiveChange]);

  useEffect(() => {
    if (leaveExamRef) {
      leaveExamRef.current = {
        confirmLeave: (navigateAfter = true) => confirmLeaveImplRef.current?.(navigateAfter) ?? Promise.resolve(),
      };
    }
    return () => { if (leaveExamRef) leaveExamRef.current = null; };
  }, [leaveExamRef]);

  useEffect(() => {
    if (phase === 'exam' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase, cameraOn]);

  useEffect(() => {
    if (phase === 'exam' && questions.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setLoading(true);
            const profilePhotoUrl = captureProfilePhoto();
            apiJson<{ passed?: boolean; score?: number; reason?: string }>('/api/teacher-registration/exam', {
              method: 'POST',
              body: JSON.stringify({
                phone,
                questions,
                answers: answersRef.current,
                warnings: warningsRef.current,
                profilePhotoUrl: profilePhotoUrl || undefined,
              }),
            })
              .then((data) => {
                setResult({ passed: data.passed ?? false, score: data.score, reason: data.reason });
                setPhase('result');
                stopCamera();
              })
              .catch(() => {})
              .finally(() => setLoading(false));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, questions.length]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You are in the middle of an exam. Leaving will count as one failed attempt. Are you sure?';
    };
    const onUnload = () => sendAbandonedBeacon();
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('unload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('unload', onUnload);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exam' || warnings >= 3) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !visibilityWarnedRef.current) {
        visibilityWarnedRef.current = true;
        addWarning('You switched away from the exam tab. Stay on this tab.', 'tab_switch');
      }
      if (document.visibilityState === 'visible') visibilityWarnedRef.current = false;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [phase, warnings]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        addWarning('Developer tools are not allowed during the exam. This will count as a violation.', 'devtools_shortcut');
      }
    };
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const onBlur = () => {
      if (document.visibilityState === 'visible' && !visibilityWarnedRef.current) {
        visibilityWarnedRef.current = true;
        addWarning('You switched to another application. Stay on the exam window.', 'window_blur');
      }
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exam' || warnings >= 3) return;
    const checkDevTools = () => {
      if (warningsRef.current >= 3) return;
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        if (!devtoolsWarnedRef.current) {
          devtoolsWarnedRef.current = true;
          addWarning('Developer tools detected. Close Inspect Element / DevTools immediately or the exam will be terminated.', 'devtools_open');
          showToast('⚠️ Close Developer Tools now! This is a serious violation.');
        }
      } else {
        devtoolsWarnedRef.current = false;
      }
    };
    devtoolsCheckIntervalRef.current = setInterval(checkDevTools, 1000);
    return () => {
      if (devtoolsCheckIntervalRef.current) clearInterval(devtoolsCheckIntervalRef.current);
    };
  }, [phase, warnings]);

  useEffect(() => {
    if (phase !== 'exam' || warnings >= 3) return;
    clientCheckIntervalRef.current = setInterval(() => {
      if (warningsRef.current >= 3) return;
      const video = videoRef.current;
      const stream = streamRef.current;
      const videoTrack = stream?.getVideoTracks()[0];
      const videoReady = video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
      const trackActive = videoTrack?.readyState === 'live' && videoTrack?.enabled;
      if (!videoReady || !trackActive) {
        if (!cameraBlankWarnedRef.current) {
          cameraBlankWarnedRef.current = true;
          addWarning('Camera not visible or inactive. Keep camera on and facing you.', 'camera_blank');
        }
      } else {
        cameraBlankWarnedRef.current = false;
      }
      const analyser = analyserRef.current;
      if (analyser && !audioNoiseWarnedRef.current) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 180) {
          audioNoiseWarnedRef.current = true;
          addWarning('Excessive background noise detected. Ensure you are alone in a quiet room.', 'audio_noise');
        }
      } else if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg < 100) audioNoiseWarnedRef.current = false;
      }
    }, 2000);
    return () => {
      if (clientCheckIntervalRef.current) clearInterval(clientCheckIntervalRef.current);
    };
  }, [phase, warnings]);

  useEffect(() => {
    if (phase !== 'exam' || !phone || !videoRef.current || !streamRef.current || warnings >= 3) return;
    const captureAndSend = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || warningsRef.current >= 3) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        const audio = await captureAudio();
        const data = await apiJson<{ alert?: boolean; message?: string; type?: string }>(
          '/api/teacher-registration/exam/monitor',
          { method: 'POST', body: JSON.stringify({ phone, frame: dataUrl, audio: audio || undefined }) }
        );
        if (data.alert) {
          addWarning(data.message || data.type || 'Suspicious activity detected', data.type || 'ai_suspicious');
        }
      } catch {
        // ignore
      }
    };
    monitorIntervalRef.current = setInterval(captureAndSend, MONITOR_INTERVAL_MS);
    captureAndSend();
    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    };
  }, [phase, phone, warnings]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch {
        /* ignore */
      }
    } catch {
      alert('Please allow camera and microphone access to continue.');
    }
  };

  const checkCameraAndAudio = async () => {
    setSetupError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      setCameraStatus(videoTracks.length > 0 ? 'ok' : 'denied');
      setAudioStatus(audioTracks.length > 0 ? 'ok' : 'denied');
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setCameraStatus('denied');
      setAudioStatus('denied');
      setSetupError('Camera and microphone access are required. Please enable them in your browser settings.');
    }
  };

  const checkNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('ok');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationStatus('ok');
        setSetupError('');
      } else {
        setNotificationStatus('denied');
        setSetupError('Notifications must be enabled for exam monitoring.');
      }
    } catch {
      setNotificationStatus('denied');
      setSetupError('Please enable notifications.');
    }
  };

  const goToSetup = () => {
    setPhase('setup');
    setSetupError('');
    setPrefetchError('');
  };

  useEffect(() => {
    if (!phone) return;
    apiJson<{ eligible?: boolean; reason?: string; retryAfterAt?: string }>(
      `/api/teacher-registration/exam/status?phone=${encodeURIComponent(phone)}`
    )
      .then((data) => {
        if (data.eligible) setExamStatus('eligible');
        else if (data.reason === 'max_attempts_exceeded') setExamStatus('max_attempts_exceeded');
        else if (data.reason === 'retry_wait' && data.retryAfterAt) {
          setExamStatus('retry_wait');
          setRetryAfterAt(data.retryAfterAt);
        } else setExamStatus('eligible');
      })
      .catch(() => setExamStatus('eligible'));
  }, [phone]);

  useEffect(() => {
    if (examStatus !== 'retry_wait' || !retryAfterAt) return;
    const update = () => {
      const target = new Date(retryAfterAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setRetryCountdown({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [examStatus, retryAfterAt]);

  useEffect(() => {
    if ((phase !== 'rules' && phase !== 'setup') || !phone) return;
    setPrefetchError('');
    setPrefetchedExam(null);
    apiJson<{ questions?: Question[]; durationMinutes?: number; error?: string }>(
      `/api/teacher-registration/exam?phone=${encodeURIComponent(phone)}`
    )
      .then((data) => {
        if (data.questions?.length) {
          setPrefetchedExam({ questions: data.questions, durationMinutes: data.durationMinutes ?? 15 });
        } else {
          setPrefetchError(data.error || 'No questions returned. Please try again.');
        }
      })
      .catch((err) => {
        setPrefetchError(err instanceof Error ? err.message : 'Failed to prepare exam');
      });
  }, [phase, phone, prefetchRetry]);

  const doStartExam = async (exam: { questions: Question[]; durationMinutes: number }) => {
    setLoading(true);
    setSetupError('');
    try {
      setQuestions(exam.questions);
      setAnswers(new Array(exam.questions.length).fill(''));
      setTimeLeft(exam.durationMinutes * 60);
      setPhase('exam');
      setPrefetchedExam(null);
      await startCamera();
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examLoaderVisible && prefetchedExam) {
      setExamLoaderVisible(false);
      doStartExam(prefetchedExam);
    }
  }, [examLoaderVisible, prefetchedExam]);

  const startExam = async () => {
    if (!allSetupOk) return;
    const exam = prefetchedExam;
    if (exam) {
      await doStartExam(exam);
      return;
    }
    setSetupError('');
    setPrefetchError('');
    setExamLoaderVisible(true);
  };

  const handleSubmitExam = async (autoSubmit = false) => {
    if (warnings >= 3) {
      setResult({ passed: false, reason: 'Too many warnings' });
      setPhase('result');
      await submitToApi(3, false);
      return;
    }
    if (autoSubmit) {
      setLoading(true);
      await submitToApi(warnings, false);
      setLoading(false);
      return;
    }
    if (timeLeft > 0) {
      setShowSubmitConfirm(true);
      return;
    }
    setLoading(true);
    await submitToApi(warnings, false);
    setLoading(false);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    try {
      await submitToApi(warnings, false);
      setShowSubmitConfirm(false);
    } catch {
      showToast('Failed to submit exam. Please check your connection and try again.');
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (examStatus === 'max_attempts_exceeded') {
    return (
      <div className="rounded-3xl border-2 border-red-200 bg-white p-8 shadow-xl text-center">
        <div className="mb-6 text-6xl">🚫</div>
        <h2 className="mb-4 text-2xl font-bold text-red-800">We Cannot Onboard You at This Time</h2>
        <p className="mb-6 text-lg text-gray-700">
          Unfortunately, you did not qualify in the teacher qualification exam after 3 attempts.
        </p>
        <button type="button" onClick={onBack} className="btn-secondary">
          <span className="btn-text">Go Back</span>
        </button>
      </div>
    );
  }

  if (examStatus === 'retry_wait') {
    const canRetry = retryCountdown && retryCountdown.h === 0 && retryCountdown.m === 0 && retryCountdown.s === 0;
    return (
      <div className="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h2 className="mb-4 text-2xl font-bold text-amber-800">Please Wait Before Your Next Attempt</h2>
        <p className="mb-6 text-lg text-gray-700">
          You can try the qualification exam again after 24 hours from your previous attempt.
        </p>
        {canRetry ? (
          <p className="mb-6 text-xl font-semibold text-green-600">You can now take the exam again!</p>
        ) : retryCountdown ? (
          <div className="mb-8">
            <p className="mb-4 text-sm font-medium text-gray-600">Time until you can retry:</p>
            <div className="flex justify-center gap-4">
              <div className="rounded-xl bg-amber-100 px-6 py-4">
                <span className="block text-4xl font-bold tabular-nums text-amber-800">{String(retryCountdown.h).padStart(2, '0')}</span>
                <span className="text-sm text-amber-700">Hours</span>
              </div>
              <div className="rounded-xl bg-amber-100 px-6 py-4">
                <span className="block text-4xl font-bold tabular-nums text-amber-800">{String(retryCountdown.m).padStart(2, '0')}</span>
                <span className="text-sm text-amber-700">Minutes</span>
              </div>
              <div className="rounded-xl bg-amber-100 px-6 py-4">
                <span className="block text-4xl font-bold tabular-nums text-amber-800">{String(retryCountdown.s).padStart(2, '0')}</span>
                <span className="text-sm text-amber-700">Seconds</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mb-8 text-amber-600">Calculating...</p>
        )}
        {canRetry ? (
          <button type="button" onClick={() => { setExamStatus('eligible'); setPhase('rules'); }} className="btn-primary">
            <span className="btn-text">Continue to Exam</span>
          </button>
        ) : (
          <button type="button" onClick={onBack} className="btn-secondary">
            <span className="btn-text">Go Back</span>
          </button>
        )}
      </div>
    );
  }

  if (phase === 'rules') {
    const canProceed = examStatus === 'eligible';
    return (
      <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-brand-800">Step 3: Qualification Exam</h2>
        <h3 className="mb-4 font-semibold">Rules & Terms</h3>
        <ul className="mb-6 list-inside list-disc space-y-2 text-brand-700">
          {EXAM_RULES.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        {examStatus === null && <p className="mb-4 text-sm text-brand-600">Checking eligibility...</p>}
        <div className="flex gap-4">
          <button type="button" onClick={onBack} className="btn-secondary">
            <span className="btn-text">Back</span>
          </button>
          <button
            type="button"
            onClick={goToSetup}
            disabled={!canProceed}
            className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="btn-text">I Agree - Continue to Setup</span>
          </button>
        </div>
      </div>
    );
  }

  const ExamLoaderOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-8 flex items-center justify-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-3xl animate-bounce-subtle">
            🤖
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-200/80 text-3xl animate-float stagger-2">
            📝
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-3xl animate-bounce-subtle stagger-4">
            📚
          </div>
        </div>
        <h3 className="mb-3 text-xl font-bold text-brand-800">AI is preparing your question paper</h3>
        <p className="mb-6 text-brand-600">
          Please wait a few seconds. Our AI is crafting personalized questions based on your teaching subjects.
        </p>
        <p className="mb-8 text-sm font-medium text-brand-500">Expected time: 30–60 seconds</p>
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse stagger-2" />
          <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse stagger-4" />
        </div>
        {prefetchError ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-red-600">{prefetchError}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setExamLoaderVisible(false)}
                className="rounded-xl border-2 border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setPrefetchError(''); setPrefetchRetry((r) => r + 1); }}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExamLoaderVisible(false)}
            className="mt-6 text-sm font-medium text-brand-600 underline hover:no-underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  if (phase === 'setup') {
    return (
      <>
        {examLoaderVisible && <ExamLoaderOverlay />}
        <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-brand-800">Step 3: Enable Camera, Microphone & Notifications</h2>
        <p className="mb-6 text-brand-600">
          All of the following must be enabled before you can start the exam.
        </p>
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-brand-50/50 p-4">
            <div>
              <span className="font-semibold text-brand-800">Camera</span>
              <p className="text-sm text-brand-600">Required for identity verification</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${cameraStatus === 'ok' ? 'text-green-600' : cameraStatus === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
                {cameraStatus === 'ok' ? '✓ Enabled' : cameraStatus === 'denied' ? '✗ Denied' : 'Pending'}
              </span>
              {cameraStatus !== 'ok' && (
                <button type="button" onClick={checkCameraAndAudio} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
                  Enable
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-brand-50/50 p-4">
            <div>
              <span className="font-semibold text-brand-800">Microphone</span>
              <p className="text-sm text-brand-600">Required for exam monitoring</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${audioStatus === 'ok' ? 'text-green-600' : audioStatus === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
                {audioStatus === 'ok' ? '✓ Enabled' : audioStatus === 'denied' ? '✗ Denied' : 'Pending'}
              </span>
              {audioStatus !== 'ok' && (
                <button type="button" onClick={checkCameraAndAudio} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
                  Enable
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-brand-50/50 p-4">
            <div>
              <span className="font-semibold text-brand-800">Notifications</span>
              <p className="text-sm text-brand-600">Required for exam alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${notificationStatus === 'ok' ? 'text-green-600' : notificationStatus === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
                {notificationStatus === 'ok' ? '✓ Enabled' : notificationStatus === 'denied' ? '✗ Denied' : 'Pending'}
              </span>
              {notificationStatus !== 'ok' && (
                <button type="button" onClick={checkNotifications} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>
        {(setupError || (prefetchError && !examLoaderVisible)) && (
          <div className="mb-4 flex items-center gap-2">
            <p className="text-sm text-red-600">{setupError || prefetchError}</p>
            {prefetchError && !examLoaderVisible && (
              <button type="button" onClick={() => setPrefetchRetry((r) => r + 1)} className="text-sm font-medium text-brand-600 underline hover:no-underline">
                Retry
              </button>
            )}
          </div>
        )}
        <div className="flex gap-4">
          <button type="button" onClick={() => setPhase('rules')} className="btn-secondary">
            <span className="btn-text">Back</span>
          </button>
          <button
            type="button"
            onClick={startExam}
            disabled={!allSetupOk || loading}
            className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="btn-text">{loading ? 'Starting...' : 'Start Exam'}</span>
          </button>
        </div>
      </div>
      </>
    );
  }

  if (phase === 'exam') {
    const q = questions[currentQ];
    if (!q) return null;

    const getButtonClass = (i: number) =>
      i === currentQ ? 'bg-brand-500 text-white' : answers[i] !== '' && answers[i] !== undefined ? 'bg-green-200' : 'bg-gray-200';

    return (
      <div className="relative">
        {toastMessage && (
          <div role="status" aria-live="polite" className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
            <p className="text-sm font-medium text-amber-800">⚠ {toastMessage}</p>
          </div>
        )}
        <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-800">Question {currentQ + 1} of {questions.length}</span>
              <span className="ml-4 rounded bg-amber-100 px-2 py-1 text-amber-800">⏱ {formatTimeLeft(timeLeft)}</span>
              {warnings > 0 && (
                <span className="ml-4 rounded bg-red-100 px-2 py-1 font-medium text-red-700">⚠ Warnings: {warnings}/3</span>
              )}
            </div>
            <div className="mb-4 flex flex-col items-end">
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-brand-200 bg-brand-100">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                {!cameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-600">Starting camera...</div>
                )}
              </div>
              <span className="mt-1 text-xs text-brand-600">Live camera — photo captured for profile verification</span>
            </div>
          </div>
          <div className="mb-6 rounded-xl bg-brand-50 p-4">
            <p className="mb-4 font-semibold">{q.question}</p>
            {q.type === 'mcq' && q.options && (
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
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'short' && (
              <input
                type="text"
                value={answers[currentQ] || ''}
                onChange={(e) => {
                  const a = [...answers];
                  a[currentQ] = e.target.value;
                  setAnswers(a);
                }}
                placeholder="Your answer"
                className="w-full rounded-xl border-2 border-brand-200 px-4 py-3"
              />
            )}
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {questions.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrentQ(i)} className={`h-10 w-10 rounded-lg ${getButtonClass(i)}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50">
              Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button type="button" onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary">
                <span className="btn-text">Next</span>
              </button>
            ) : (
              <button type="button" onClick={() => handleSubmitExam()} disabled={loading} className="btn-primary">
                <span className="btn-text">{loading ? 'Submitting...' : 'Submit Exam'}</span>
              </button>
            )}
          </div>
        </div>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-3 text-lg font-semibold text-brand-800">Submit Exam?</h3>
              <p className="mb-6 text-brand-700">
                You have {formatTimeLeft(timeLeft)} left. Are you sure you want to submit now?
              </p>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowSubmitConfirm(false)} disabled={loading} className="btn-secondary disabled:opacity-50">
                  <span className="btn-text">Cancel</span>
                </button>
                <button type="button" onClick={confirmSubmit} disabled={loading} className="btn-primary disabled:cursor-wait disabled:opacity-90">
                  <span className="btn-text">{loading ? 'Submitting...' : 'Yes, Submit'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'result' && result) {
    const passed = result.passed;
    return (
      <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 text-center shadow-xl">
        <div className="mb-6 text-6xl">{passed ? '🎉' : '😔'}</div>
        <h2 className="mb-4 text-2xl font-bold">{passed ? 'Congratulations! You Qualified!' : 'Sorry, You Did Not Qualify'}</h2>
        {!passed && <p className="mb-6 text-brand-600">You can try again after 24 hours. Maximum 3 attempts allowed.</p>}
        {passed && (
          <button type="button" onClick={() => onNext(4)} className="btn-primary">
            <span className="btn-text">Continue to Documents & Banking</span>
          </button>
        )}
        {!passed && (
          <button type="button" onClick={onBack} className="btn-secondary">
            <span className="btn-text">Back</span>
          </button>
        )}
      </div>
    );
  }

  return null;
}
