import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface SessionDetail {
  _id: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  scheduledAt: string;
  duration?: number;
  status: string;
  teacher?: { name?: string; photoUrl?: string };
  student?: { name?: string; photoUrl?: string };
}

interface DeviceStatus {
  camera: 'checking' | 'ok' | 'error';
  microphone: 'checking' | 'ok' | 'error';
  speaker: 'checking' | 'ok' | 'error';
  notifications: 'checking' | 'ok' | 'error';
}

export default function PreJoinLobby() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [devices, setDevices] = useState<DeviceStatus>({
    camera: 'checking',
    microphone: 'checking',
    speaker: 'checking',
    notifications: 'checking',
  });
  const [showInstructions, setShowInstructions] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micLevelRef = useRef<HTMLDivElement>(null);

  // Fetch session details
  useEffect(() => {
    if (!sessionId) return;
    apiJson<{ session: SessionDetail }>(`/api/classroom/session/detail?sessionId=${sessionId}`)
      .then((data) => setSession(data.session))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const scheduled = new Date(session.scheduledAt).getTime();
      const windowStart = scheduled - 5 * 60 * 1000;
      if (now >= windowStart) {
        setCanJoin(true);
        setCountdown('');
      } else {
        const diff = windowStart - now;
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        setCountdown(`${min}m ${sec}s`);
        setCanJoin(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Check camera + mic
  useEffect(() => {
    checkCamera();
    checkNotifications();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const checkCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setDevices((d) => ({ ...d, camera: 'ok', microphone: 'ok' }));

      // Setup mic level meter
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      animateMicLevel();
    } catch {
      setDevices((d) => ({ ...d, camera: 'error', microphone: 'error' }));
    }
  };

  const animateMicLevel = useCallback(() => {
    if (!analyserRef.current || !micLevelRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const pct = Math.min(100, (avg / 128) * 100);
    micLevelRef.current.style.width = `${pct}%`;
    requestAnimationFrame(animateMicLevel);
  }, []);

  const testSpeaker = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 500);
      setDevices((d) => ({ ...d, speaker: 'ok' }));
    } catch {
      setDevices((d) => ({ ...d, speaker: 'error' }));
    }
  };

  const checkNotifications = async () => {
    if (!('Notification' in window)) {
      setDevices((d) => ({ ...d, notifications: 'error' }));
      return;
    }
    const perm = await Notification.requestPermission();
    setDevices((d) => ({ ...d, notifications: perm === 'granted' ? 'ok' : 'error' }));
  };

  const handleJoinClass = async () => {
    if (!sessionId || !user || joining) return;
    setJoining(true);
    try {
      const endpoint =
        user.role === 'teacher'
          ? '/api/classroom/session/start'
          : '/api/classroom/session/join';
      await apiJson(endpoint, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      navigate(`/classroom/${sessionId}`);
    } catch (e) {
      setError((e as Error).message);
      setJoining(false);
    }
  };

  const allDevicesReady = devices.camera === 'ok' && devices.microphone === 'ok' && devices.speaker === 'ok';

  const statusIcon = (s: string) => {
    if (s === 'ok') return '✅';
    if (s === 'error') return '❌';
    return '⏳';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-brand-400" />
        <p className="text-sm font-medium text-gray-400">Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 p-4">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/50 p-6 text-center">
          <p className="text-lg font-semibold text-red-400">⚠️ {error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            🎓 Pre-Join Lobby
          </h1>
          <p className="mt-2 text-gray-400">
            {session?.subject} • {session?.classLevel} • {session?.board}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Scheduled: {session?.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : '—'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Camera Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold">📷 Camera Preview</h2>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              {devices.camera === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/80">
                  <p className="text-sm text-red-300">Camera access denied. Please allow camera.</p>
                </div>
              )}
            </div>

            {/* Mic Level */}
            <div className="mt-4">
              <p className="mb-2 text-sm text-gray-400">🎤 Microphone Level</p>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  ref={micLevelRef}
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Device Checks + Instructions */}
          <div className="space-y-4">
            {/* Device Checklist */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold">🔧 Device Checks</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                  <span>Camera</span>
                  <span>{statusIcon(devices.camera)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                  <span>Microphone</span>
                  <span>{statusIcon(devices.microphone)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                  <span>Speaker</span>
                  <div className="flex items-center gap-2">
                    {devices.speaker === 'checking' || devices.speaker === 'error' ? (
                      <button
                        onClick={testSpeaker}
                        className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium hover:bg-brand-500"
                      >
                        Test
                      </button>
                    ) : null}
                    <span>{statusIcon(devices.speaker)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                  <span>Notifications</span>
                  <span>{statusIcon(devices.notifications)}</span>
                </div>
              </div>
              {devices.camera === 'error' && (
                <button
                  onClick={checkCamera}
                  className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium hover:bg-amber-500"
                >
                  Retry Camera & Mic
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex w-full items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold">📋 Class Instructions</h2>
                <span className="text-gray-400">{showInstructions ? '▲' : '▼'}</span>
              </button>
              {showInstructions && (
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  <li>• Stay visible on camera throughout the class</li>
                  <li>• AI monitoring is active — only you should be visible</li>
                  <li>• Do not switch tabs, apps, or minimize the browser</li>
                  <li>• Screenshots are not allowed during the session</li>
                  <li>• Use appropriate language at all times</li>
                  <li>• The session is being recorded for quality & review</li>
                  <li>• After 3 warnings, parents will be notified</li>
                  <li>• After 5 warnings, admin will be alerted</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Join Button */}
        <div className="mt-8 text-center">
          {!canJoin ? (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/40 px-8 py-4">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-amber-200">Class not open yet</p>
                <p className="text-sm text-amber-400">Opens in {countdown}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleJoinClass}
              disabled={!allDevicesReady || joining}
              className={`rounded-2xl px-12 py-4 text-lg font-bold shadow-lg transition-all ${
                allDevicesReady && !joining
                  ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white hover:from-brand-500 hover:to-emerald-400 hover:shadow-brand-500/30'
                  : 'cursor-not-allowed bg-gray-700 text-gray-400'
              }`}
            >
              {joining ? 'Joining...' : '🚀 Enter Class'}
            </button>
          )}
          {canJoin && !allDevicesReady && (
            <p className="mt-3 text-sm text-amber-400">
              Please ensure camera, mic, and speaker are working before joining.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
