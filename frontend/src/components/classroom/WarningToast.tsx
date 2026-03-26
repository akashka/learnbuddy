import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface Warning {
  level: number;
  reason: string;
  targetRole: string;
  timestamp: number;
}

interface WarningToastProps {
  socket: Socket | null;
  myRole: string;
  sessionId: string;
}

/**
 * Warning toast component that listens for real-time warnings from AI proctoring.
 * Shows a toast to BOTH participants when any violation is detected —
 * the person warned gets a direct warning, while the other party gets an info notice.
 * Shows escalation modals at level 4 and 5.
 */
export default function WarningToast({ socket, myRole, sessionId: _sessionId }: WarningToastProps) {
  const [visibleToast, setVisibleToast] = useState<Warning | null>(null);
  const [showEscalationModal, setShowEscalationModal] = useState<null | 'parent' | 'admin'>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleWarning = (data: { level: number; reason: string; targetRole: string }) => {
      const warning: Warning = { ...data, timestamp: Date.now() };

      // Show toast to BOTH parties — the warned person and the other side
      // This ensures teacher sees student violations and vice versa
      setVisibleToast(warning);

      // Clear previous auto-hide timer
      if (autoHideTimer) clearTimeout(autoHideTimer);
      const timer = setTimeout(() => setVisibleToast(null), 6000);
      setAutoHideTimer(timer);

      // Show escalation modals only to the person being warned
      if (data.targetRole === myRole) {
        if (data.level === 4) {
          setShowEscalationModal('parent');
        } else if (data.level >= 5) {
          setShowEscalationModal('admin');
        }
      }
    };

    socket.on('warning:issued', handleWarning);
    return () => {
      socket.off('warning:issued', handleWarning);
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [socket, myRole]);

  const isDirectWarning = visibleToast?.targetRole === myRole;

  return (
    <>
      {/* Toast — shown to both parties, styled differently */}
      {visibleToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-2xl animate-slide-up transition-all ${
            isDirectWarning
              ? 'border-red-500/40 bg-gradient-to-r from-red-950 to-slate-900'
              : 'border-amber-500/30 bg-gradient-to-r from-amber-950 to-slate-900'
          }`}
        >
          <span className="mt-0.5 text-2xl">
            {isDirectWarning ? '🚨' : '⚠️'}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isDirectWarning ? 'text-red-300' : 'text-amber-200'}`}>
              {isDirectWarning
                ? `Warning #${visibleToast.level} — Focus Required`
                : `${visibleToast.targetRole === 'student' ? 'Student' : 'Teacher'} Behaviour Notice`}
            </p>
            <p className="mt-1 text-xs text-gray-300/80">{visibleToast.reason}</p>
            {!isDirectWarning && (
              <p className="mt-1.5 text-xs text-amber-400/80">
                The AI monitoring system has issued warning #{visibleToast.level} to the {visibleToast.targetRole}.
              </p>
            )}
            {isDirectWarning && visibleToast.level >= 3 && visibleToast.level < 4 && (
              <p className="mt-2 text-xs font-medium text-red-400">
                ⚡ One more warning will notify your parent
              </p>
            )}
          </div>
          <button
            onClick={() => setVisibleToast(null)}
            className="shrink-0 text-gray-400 hover:text-white text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Escalation Modal — only for the person being warned */}
      {showEscalationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 text-center shadow-2xl animate-slide-up">
            {showEscalationModal === 'parent' ? (
              <>
                <p className="text-4xl">🔔</p>
                <h3 className="mt-3 text-lg font-bold text-amber-200">Behaviour Escalated</h3>
                <p className="mt-2 text-sm text-gray-300">
                  You have received <strong>4 warnings</strong>. Your parent/guardian and the{' '}
                  {myRole === 'student' ? 'teacher' : 'student'} have been notified about your behaviour during this session.
                </p>
                <p className="mt-3 text-xs text-red-400">
                  One more warning will alert the admin for immediate action.
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl">🚨</p>
                <h3 className="mt-3 text-lg font-bold text-red-300">Admin Alerted</h3>
                <p className="mt-2 text-sm text-gray-300">
                  You have received <strong>5+ warnings</strong>. The platform admin has been alerted and may take immediate action, including terminating this session.
                </p>
              </>
            )}
            <button
              onClick={() => setShowEscalationModal(null)}
              className="mt-5 rounded-lg bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
}
