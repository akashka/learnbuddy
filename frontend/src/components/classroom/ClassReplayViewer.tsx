import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

interface Alert {
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

interface TranscriptEntry {
  text: string;
  timestamp: string;
  role: 'student' | 'teacher';
}

interface SessionReplay {
  _id: string;
  subject?: string;
  classLevel?: string;
  board?: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  teacher?: { name?: string };
  student?: { name?: string };
  recordingUrl?: string;
  boardSnapshotUrl?: string;
  boardHistory?: { url: string; timestamp: string }[];
  transcript?: TranscriptEntry[];
  aiMonitoringAlerts?: Alert[];
  warningCounts?: { teacher: number; student: number };
}

interface ClassReplayViewerProps {
  sessionId: string;
  onClose: () => void;
}

type Tab = 'recording' | 'transcript' | 'violations' | 'board';

export default function ClassReplayViewer({ sessionId, onClose }: ClassReplayViewerProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionReplay | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('recording');

  useEffect(() => {
    apiJson<{ session: SessionReplay }>(`/api/classroom/session/replay?sessionId=${sessionId}`)
      .then((d) => setSession(d.session))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'recording', label: 'Video', icon: '🎬' },
    { id: 'transcript', label: 'Transcript', icon: '📝', count: session?.transcript?.length },
    { id: 'violations', label: 'Violations', icon: '⚠️', count: session?.aiMonitoringAlerts?.length },
    { id: 'board', label: 'Board', icon: '🖼️', count: session?.boardHistory?.length },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-6 py-4 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-white">
              📚 {session?.subject || 'Class Replay'}
            </h2>
            {session && (
              <p className="text-sm text-gray-400">
                {session.teacher?.name} · {session.student?.name} ·{' '}
                {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                }) : '-'}
                {session.duration ? ` · ${session.duration}min` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Warning counts banner */}
        {session && (session.warningCounts?.teacher || session.warningCounts?.student) ? (
          <div className="flex items-center gap-4 border-b border-amber-500/20 bg-amber-950/40 px-6 py-2 text-sm">
            <span className="text-amber-400 font-semibold">⚠️ Violations during this class:</span>
            {(session.warningCounts?.teacher ?? 0) > 0 && (
              <span className="rounded-full bg-orange-500/20 px-3 py-0.5 text-orange-300">
                Teacher: {session.warningCounts!.teacher} warning{session.warningCounts!.teacher !== 1 ? 's' : ''}
              </span>
            )}
            {(session.warningCounts?.student ?? 0) > 0 && (
              <span className="rounded-full bg-red-500/20 px-3 py-0.5 text-red-300">
                Student: {session.warningCounts!.student} warning{session.warningCounts!.student !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : null}

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-white/10 bg-slate-800/50 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-brand-400 text-brand-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count != null && tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.id ? 'bg-brand-500/30 text-brand-200' : 'bg-white/10 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex h-64 items-center justify-center gap-3 text-gray-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-brand-400" />
              Loading class replay...
            </div>
          )}

          {error && (
            <div className="m-6 rounded-xl border border-red-500/30 bg-red-950/40 p-6 text-center text-red-300">
              <p className="text-3xl mb-2">⚠️</p>
              <p className="font-semibold">Failed to load replay</p>
              <p className="text-sm mt-1 text-red-400/80">{error}</p>
            </div>
          )}

          {!loading && !error && session && (
            <>
              {/* Recording Tab */}
              {activeTab === 'recording' && (
                <div className="p-6 space-y-4">
                  {session.recordingUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <video
                        src={session.recordingUrl}
                        controls
                        className="w-full max-h-[55vh] object-contain"
                        poster={session.boardSnapshotUrl}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-16 text-center">
                      <p className="text-5xl mb-4">🎥</p>
                      <p className="text-white font-semibold text-lg">No recording available</p>
                      <p className="text-gray-400 text-sm mt-2">
                        The recording for this class session is not available yet.
                      </p>
                    </div>
                  )}

                  {/* Session metadata */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Subject', value: session.subject },
                      { label: 'Class Level', value: session.classLevel },
                      { label: 'Board', value: session.board },
                      { label: 'Duration', value: session.duration ? `${session.duration} min` : '-' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-white">{item.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Tab */}
              {activeTab === 'transcript' && (
                <div className="p-6">
                  {session.transcript && session.transcript.length > 0 ? (
                    <div className="space-y-3">
                      {session.transcript.map((entry, i) => (
                        <div
                          key={i}
                          className={`flex gap-3 ${entry.role === 'teacher' ? 'flex-row' : 'flex-row-reverse'}`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                            entry.role === 'teacher' ? 'bg-brand-600' : 'bg-emerald-600'
                          }`}>
                            {entry.role === 'teacher' ? '👩‍🏫' : '🧑‍🎓'}
                          </div>
                          <div className={`flex-1 ${entry.role !== 'teacher' ? 'text-right' : ''}`}>
                            <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                              entry.role === 'teacher'
                                ? 'rounded-tl-none bg-slate-700 text-gray-100'
                                : 'rounded-tr-none bg-emerald-900/50 text-emerald-100'
                            }`}>
                              {entry.text}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}
                              <span className="capitalize">{entry.role}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                      <p className="text-5xl mb-4">📝</p>
                      <p className="text-white font-semibold text-lg">No transcript available</p>
                      <p className="text-gray-400 text-sm mt-2">Live transcription data was not recorded for this session.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Violations Tab */}
              {activeTab === 'violations' && (
                <div className="p-6">
                  {session.aiMonitoringAlerts && session.aiMonitoringAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {session.aiMonitoringAlerts.map((alert, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 rounded-xl border p-4 ${
                            alert.severity === 'critical'
                              ? 'border-red-500/30 bg-red-950/40'
                              : 'border-amber-500/30 bg-amber-950/40'
                          }`}
                        >
                          <span className="text-xl mt-0.5">
                            {alert.severity === 'critical' ? '🚨' : '⚠️'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                alert.severity === 'critical'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {alert.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400 uppercase tracking-wide">{alert.type}</span>
                            </div>
                            <p className={`mt-1 text-sm font-medium ${
                              alert.severity === 'critical' ? 'text-red-200' : 'text-amber-200'
                            }`}>
                              {alert.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                      <p className="text-5xl mb-4">✅</p>
                      <p className="text-white font-semibold text-lg">No violations detected</p>
                      <p className="text-gray-400 text-sm mt-2">The AI monitoring system did not flag any issues during this session.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Board History Tab */}
              {activeTab === 'board' && (
                <div className="p-6">
                  {session.boardSnapshotUrl || (session.boardHistory && session.boardHistory.length > 0) ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {session.boardSnapshotUrl && (
                        <div className="col-span-full">
                          <p className="mb-2 text-sm font-semibold text-gray-300">Final Board State</p>
                          <img
                            src={session.boardSnapshotUrl}
                            alt="Final board snapshot"
                            className="w-full rounded-xl border border-white/10 bg-white"
                          />
                        </div>
                      )}
                      {session.boardHistory?.map((snap, i) => (
                        <div key={i}>
                          <p className="mb-1.5 text-xs text-gray-400">
                            Snapshot {i + 1} · {new Date(snap.timestamp).toLocaleTimeString('en-IN')}
                          </p>
                          <img
                            src={snap.url}
                            alt={`Board snapshot ${i + 1}`}
                            className="w-full rounded-xl border border-white/10 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                      <p className="text-5xl mb-4">🖼️</p>
                      <p className="text-white font-semibold text-lg">No board snapshots</p>
                      <p className="text-gray-400 text-sm mt-2">No whiteboard snapshots were saved during this session.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
