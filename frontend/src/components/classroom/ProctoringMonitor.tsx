import { useEffect, useRef, useState } from 'react';
import { apiJson } from '@/lib/api';

interface ProctoringMonitorProps {
  sessionId: string;
  role: string;
  localStream: MediaStream | null;
}

/**
 * AI Proctoring monitor:
 * - Captures video frame every 30s and sends to /api/classroom/monitor
 * - Detects tab/window switch via visibilitychange + blur
 * - Issues warnings via /api/classroom/session/warning
 */
export default function ProctoringMonitor({ sessionId, role, localStream }: ProctoringMonitorProps) {
  const [status, setStatus] = useState<'active' | 'away'>('active');
  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awayStartRef = useRef<number | null>(null);
  const warningCooldownRef = useRef(false);

  // Frame capture + AI analysis every 30s
  useEffect(() => {
    if (!localStream) return;

    const interval = setInterval(() => {
      captureAndAnalyze();
    }, 30000);

    // Initial analysis after 5s
    const initial = setTimeout(() => captureAndAnalyze(), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [localStream, sessionId, role]);

  const captureAndAnalyze = async () => {
    if (!localStream) return;
    try {
      const videoTrack = localStream.getVideoTracks()[0];
      if (!videoTrack) return;

      // Use ImageCapture if available, else fallback to canvas
      let frame: string;
      if ('ImageCapture' in window) {
        const capture = new (window as any).ImageCapture(videoTrack);
        const bitmap = await capture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        frame = canvas.toDataURL('image/jpeg', 0.5);
        bitmap.close();
      } else {
        const video = document.createElement('video');
        video.srcObject = localStream;
        video.muted = true;
        await video.play();
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, 320, 240);
        frame = canvas.toDataURL('image/jpeg', 0.5);
        video.pause();
      }

      const result = await apiJson<{ alert?: boolean; type?: string; message?: string }>(
        '/api/classroom/monitor',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId, frame, role }),
        }
      );

      if (result.alert) {
        await issueWarning(result.message || result.type || 'AI detected suspicious activity');
      }
    } catch (err) {
      console.error('Proctoring frame analysis failed:', err);
    }
  };

  // Tab switch / visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        awayStartRef.current = Date.now();
        setStatus('away');
        // If away for more than 2 minutes, trigger warning
        awayTimerRef.current = setTimeout(() => {
          issueWarning('User switched away from the classroom for more than 2 minutes');
        }, 2 * 60 * 1000);
      } else {
        setStatus('active');
        if (awayTimerRef.current) {
          clearTimeout(awayTimerRef.current);
          awayTimerRef.current = null;
        }
        // Even a short switch triggers a warning
        if (awayStartRef.current) {
          const awaySec = (Date.now() - awayStartRef.current) / 1000;
          if (awaySec > 3) {
            issueWarning(`Tab/window switch detected (${Math.round(awaySec)}s away)`);
          }
          awayStartRef.current = null;
        }
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        awayStartRef.current = Date.now();
        setStatus('away');
      }
    };

    const handleFocus = () => {
      setStatus('active');
      if (awayStartRef.current) {
        const awaySec = (Date.now() - awayStartRef.current) / 1000;
        if (awaySec > 3) {
          issueWarning(`Window focus lost (${Math.round(awaySec)}s away)`);
        }
        awayStartRef.current = null;
      }
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
    };
  }, [sessionId, role]);

  const issueWarning = async (reason: string) => {
    // Cooldown to prevent rapid-fire warnings
    if (warningCooldownRef.current) return;
    warningCooldownRef.current = true;
    setTimeout(() => { warningCooldownRef.current = false; }, 10000);

    try {
      await apiJson('/api/classroom/session/warning', {
        method: 'POST',
        body: JSON.stringify({ sessionId, targetRole: role, reason }),
      });
    } catch (err) {
      console.error('Failed to issue warning:', err);
    }
  };

  return (
    <div className="absolute right-2 top-2 z-30 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur-sm">
      <span className={`h-2 w-2 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
      <span className="text-white/70">
        {status === 'active' ? 'AI Monitoring' : '⚠️ Away'}
      </span>
    </div>
  );
}
