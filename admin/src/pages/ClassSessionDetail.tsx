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
  createdAt?: string;
};

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

            {session.aiMonitoringAlerts && session.aiMonitoringAlerts.length > 0 && (
              <section className="rounded-lg border border-accent-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-accent-800">AI Monitoring Alerts</h2>
                <ul className="space-y-2">
                  {session.aiMonitoringAlerts.map((a, i) => (
                    <li key={i} className={`rounded px-3 py-2 ${a.severity === 'critical' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                      <span className="font-medium">{a.type}:</span> {a.message}
                      {a.timestamp && <span className="ml-2 text-sm opacity-80">{new Date(a.timestamp).toLocaleString()}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {session.recordingUrl && (
              <section className="rounded-lg border border-accent-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-accent-800">Recording</h2>
                <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                  View recording
                </a>
              </section>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
