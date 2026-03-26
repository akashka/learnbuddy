import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import BackLink from '@/components/BackLink';

type Session = {
  _id: string;
  enrollmentId?: { subject?: string; batchId?: string; classLevel?: string; slots?: { day: string; startTime: string; endTime: string }[] };
  teacherId?: { _id?: string; name?: string; phone?: string };
  studentId?: { _id?: string; name?: string; studentId?: string };
  studentIds?: { _id?: string; name?: string; studentId?: string }[];
  enrollmentIds?: { subject?: string; batchId?: string }[];
  batchId?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  cancelledBy?: { role?: string; profileId?: string };
  cancelledReason?: string;
  cancelledAt?: string;
  rescheduledToSessionId?: string;
  aiMonitoringAlerts?: { type: string; severity: string; message: string; timestamp: string }[];
  transcript?: { text: string; timestamp: string; role: string }[];
  recordingUrl?: string;
  boardSnapshotUrl?: string;
  boardHistory?: { url: string; timestamp: string }[];
  warningCounts?: { teacher: number; student: number };
  createdAt?: string;
};

type ReplayTab = 'recording' | 'transcript' | 'violations' | 'board';

function getId(ref: { _id?: string } | undefined): string | undefined {
  return ref?._id;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="w-40 shrink-0 font-medium text-accent-700">{label}:</span>
      <span className="text-accent-800">{value ?? '-'}</span>
    </div>
  );
}

const statusColor: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ClassSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [replayTab, setReplayTab] = useState<ReplayTab>('recording');

  const fetchSession = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.classes
      .get(id)
      .then((d) => setSession(d as Session))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (!id) {
    return (
      <div className="p-8">
        <p className="text-accent-600">Invalid session ID</p>
      </div>
    );
  }

  const students = session?.studentIds?.length
    ? session.studentIds
    : session?.studentId
      ? [session.studentId]
      : [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <BackLink to="/classes" label="Back to Classes" />
      </div>

      <h1 className="mb-6 text-2xl font-bold text-accent-800">Class Session Detail</h1>

      <DataState loading={loading} error={error} onRetry={fetchSession}>
        {session && (
          <div className="space-y-8">
            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Details</h2>
              <div className="space-y-1">
                <DetailRow label="Teacher" value={
                  getId(session.teacherId) ? (
                    <Link to={`/teachers/${getId(session.teacherId)}`} className="text-accent-600 hover:underline">
                      {(session.teacherId as { name?: string })?.name}
                    </Link>
                  ) : (session.teacherId as { name?: string })?.name
                } />
                <DetailRow label="Subject" value={session.subject ?? (session.enrollmentId as { subject?: string })?.subject} />
                <DetailRow label="Board" value={session.board} />
                <DetailRow label="Class" value={session.classLevel ?? (session.enrollmentId as { classLevel?: string })?.classLevel} />
                <DetailRow label="Batch" value={session.batchId ?? (session.enrollmentId as { batchId?: string })?.batchId} />
                <DetailRow label="Scheduled At" value={session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : undefined} />
                <DetailRow label="Duration" value={session.duration != null ? `${session.duration} min` : undefined} />
                <DetailRow label="Status" value={
                  <span className={`rounded px-2 py-0.5 ${statusColor[session.status ?? ''] || 'bg-gray-100'}`}>
                    {session.status}
                  </span>
                } />
                <DetailRow label="Created" value={session.createdAt ? new Date(session.createdAt).toLocaleString() : undefined} />
              </div>
              {students.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-accent-700">Students:</span>
                  <ul className="mt-1 list-inside list-disc text-accent-800">
                    {students.map((s, i) => (
                      <li key={i}>
                        {getId(s) ? (
                          <Link to={`/students/${getId(s)}`} className="text-accent-600 hover:underline">
                            {(s as { name?: string })?.name ?? (s as { studentId?: string })?.studentId}
                          </Link>
                        ) : (s as { name?: string })?.name ?? (s as { studentId?: string })?.studentId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {session.enrollmentId && (() => {
                const slots = (session.enrollmentId as { slots?: { day: string; startTime: string; endTime: string }[] }).slots;
                if (!slots?.length) return null;
                return (
                  <div className="mt-4">
                    <span className="font-medium text-accent-700">Slots:</span>
                    <ul className="mt-1 list-inside list-disc text-accent-800">
                      {slots.map((s, i) => (
                        <li key={i}>{s.day} {s.startTime}–{s.endTime}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
              {session.cancelledReason && (
                <div className="mt-4">
                  <DetailRow label="Cancelled Reason" value={session.cancelledReason} />
                  {session.cancelledAt && <DetailRow label="Cancelled At" value={new Date(session.cancelledAt).toLocaleString()} />}
                </div>
              )}
            </section>

            {/* Violation Summary Badges */}
            {(session.warningCounts?.teacher || session.warningCounts?.student) ? (
              <div className="flex flex-wrap gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="font-semibold text-amber-800">⚠️ Violations:</span>
                {(session.warningCounts?.teacher ?? 0) > 0 && (
                  <span className="rounded-full bg-orange-100 px-3 py-0.5 text-sm font-bold text-orange-700">
                    Teacher: {session.warningCounts!.teacher} warning{session.warningCounts!.teacher !== 1 ? 's' : ''}
                  </span>
                )}
                {(session.warningCounts?.student ?? 0) > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-0.5 text-sm font-bold text-red-700">
                    Student: {session.warningCounts!.student} warning{session.warningCounts!.student !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ) : null}

            {/* Class Replay Section */}
            <section className="rounded-lg border border-accent-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-accent-100 bg-accent-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-accent-800">📽️ Class Replay</h2>
                {session.status && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor[session.status] || 'bg-gray-100'}`}>
                    {session.status}
                  </span>
                )}
              </div>

              {/* Replay Tabs */}
              <div className="flex gap-1 border-b border-accent-100 bg-white px-4">
                {(['recording', 'transcript', 'violations', 'board'] as ReplayTab[]).map((tab) => {
                  const icons: Record<ReplayTab, string> = { recording: '🎬', transcript: '📝', violations: '⚠️', board: '🖼️' };
                  const labels: Record<ReplayTab, string> = { recording: 'Recording', transcript: 'Transcript', violations: 'AI Alerts', board: 'Board' };
                  const counts: Record<ReplayTab, number | undefined> = {
                    recording: undefined,
                    transcript: session.transcript?.length,
                    violations: session.aiMonitoringAlerts?.length,
                    board: session.boardHistory?.length,
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setReplayTab(tab)}
                      className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                        replayTab === tab
                          ? 'border-accent-600 text-accent-700'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {icons[tab]} {labels[tab]}
                      {counts[tab] != null && counts[tab]! > 0 && (
                        <span className="rounded-full bg-accent-100 px-1.5 py-0.5 text-xs text-accent-700">{counts[tab]}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {/* Recording */}
                {replayTab === 'recording' && (
                  session.recordingUrl ? (
                    <div className="overflow-hidden rounded-xl border border-accent-100 bg-black">
                      <video
                        src={session.recordingUrl}
                        controls
                        className="w-full max-h-[60vh] object-contain"
                        poster={session.boardSnapshotUrl}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent-200 bg-accent-50 p-12 text-center">
                      <p className="text-4xl mb-3">🎥</p>
                      <p className="font-semibold text-accent-700">No recording available</p>
                      <p className="text-sm text-accent-500 mt-1">Recording was not saved for this session.</p>
                    </div>
                  )
                )}

                {/* Transcript */}
                {replayTab === 'transcript' && (
                  session.transcript && session.transcript.length > 0 ? (
                    <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
                      {session.transcript.map((entry, i) => (
                        <div key={i} className={`flex gap-2 ${entry.role === 'teacher' ? '' : 'flex-row-reverse'}`}>
                          <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                            entry.role === 'teacher' ? 'bg-accent-100 text-accent-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {entry.role === 'teacher' ? '👩‍🏫' : '🧑‍🎓'}
                          </div>
                          <div className={`flex-1 ${entry.role !== 'teacher' ? 'text-right' : ''}`}>
                            <div className={`inline-block max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              entry.role === 'teacher'
                                ? 'rounded-tl-none bg-accent-50 text-accent-800'
                                : 'rounded-tr-none bg-emerald-50 text-emerald-800'
                            }`}>
                              {entry.text}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(entry.timestamp).toLocaleTimeString()} · <span className="capitalize">{entry.role}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">No transcript for this session.</div>
                  )
                )}

                {/* AI Alerts */}
                {replayTab === 'violations' && (
                  session.aiMonitoringAlerts && session.aiMonitoringAlerts.length > 0 ? (
                    <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {session.aiMonitoringAlerts.map((a, i) => (
                        <li key={i} className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
                          a.severity === 'critical' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          <span className="text-xl mt-0.5">{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                          <div>
                            <p className="font-medium">{a.type}: {a.message}</p>
                            {a.timestamp && <p className="text-xs opacity-70 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-4xl mb-3">✅</p>
                      <p className="font-semibold text-gray-600">No AI violations detected</p>
                    </div>
                  )
                )}

                {/* Board */}
                {replayTab === 'board' && (
                  session.boardSnapshotUrl || (session.boardHistory && session.boardHistory.length > 0) ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[50vh] overflow-y-auto">
                      {session.boardSnapshotUrl && (
                        <div className="col-span-full">
                          <p className="mb-1.5 text-sm font-semibold text-accent-700">Final Board Snapshot</p>
                          <img src={session.boardSnapshotUrl} alt="Board" className="w-full rounded-xl border border-accent-100 bg-white" />
                        </div>
                      )}
                      {session.boardHistory?.map((snap, i) => (
                        <div key={i}>
                          <p className="mb-1 text-xs text-gray-400">Snapshot {i + 1} · {new Date(snap.timestamp).toLocaleString()}</p>
                          <img src={snap.url} alt={`Board snapshot ${i + 1}`} className="w-full rounded-xl border border-accent-100 bg-white" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">No board snapshots for this session.</div>
                  )
                )}
              </div>
            </section>
          </div>
        )}
      </DataState>
    </div>
  );
}
