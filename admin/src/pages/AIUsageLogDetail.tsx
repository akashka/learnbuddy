import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import BackLink from '@/components/BackLink';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';

type Log = {
  _id: string;
  operationType: string;
  userId?: { email?: string; phone?: string };
  userRole?: string;
  source: string;
  entityId?: string;
  entityType?: string;
  inputMetadata?: Record<string, unknown>;
  outputMetadata?: Record<string, unknown>;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  modelId?: string;
  createdAt: string;
};

const OPERATION_LABELS: Record<string, string> = {
  generate_study_material: 'Study Material',
  answer_doubt: 'Answer Doubt',
  generate_exam_questions: 'Exam Questions',
  evaluate_student_exam: 'Evaluate Exam',
  analyze_classroom_frame: 'Classroom Frame',
  analyze_exam_frame: 'Exam Frame',
  analyze_exam_frame_with_audio: 'Exam Frame + Audio',
  generate_qualification_exam: 'Qualification Exam',
  generate_teacher_qualification_exam: 'Teacher Qual Exam',
  evaluate_teacher_exam: 'Evaluate Teacher Exam',
  verify_document_photo: 'Verify Document',
};

export default function AIUsageLogDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Log | null>(null);

  const fetchLog = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.aiUsageLogs
      .get(id)
      .then((d) => setLog(d as Log))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  if (!id) {
    return (
      <div className="p-8">
        <p className="text-accent-600">Invalid log ID</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <BackLink to="/ai-usage-logs" label="Back to AI Usage Logs" />
      </div>

      <h1 className="mb-6 text-2xl font-bold text-accent-800">AI Usage Log Detail</h1>

      <DataState loading={loading} error={error} onRetry={fetchLog}>
        {log && (
          <div className="space-y-6">
            <div className="rounded-xl border-2 border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Summary</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-accent-600">Time</dt>
                  <dd className="text-accent-800">{new Date(log.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-accent-600">Operation</dt>
                  <dd className="text-accent-800">
                    {OPERATION_LABELS[log.operationType] || log.operationType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-accent-600">User</dt>
                  <dd className="text-accent-800">
                    {(log.userId as { email?: string })?.email ||
                      (log.userId as { phone?: string })?.phone ||
                      '-'}
                    {log.userRole && ` (${log.userRole})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-accent-600">Source</dt>
                  <dd className="text-accent-800">{log.source}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-accent-600">Entity</dt>
                  <dd className="text-accent-800">
                    {log.entityType || '-'}
                    {log.entityId && ` ${String(log.entityId).slice(-8)}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-accent-600">Duration</dt>
                  <dd className="text-accent-800">
                    {log.durationMs != null ? `${log.durationMs}ms` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-accent-600">Status</dt>
                  <dd>
                    <span
                      className={
                        log.success
                          ? 'rounded px-2 py-0.5 text-sm font-medium text-green-800 bg-green-100'
                          : 'rounded px-2 py-0.5 text-sm font-medium text-red-800 bg-red-100'
                      }
                    >
                      {log.success ? 'Success' : log.errorMessage || 'Failed'}
                    </span>
                  </dd>
                </div>
                {log.modelId && (
                  <div>
                    <dt className="text-sm font-medium text-accent-600">Model</dt>
                    <dd className="text-accent-800">{log.modelId}</dd>
                  </div>
                )}
              </dl>
            </div>

            {log.inputMetadata && Object.keys(log.inputMetadata).length > 0 && (
              <div className="rounded-xl border-2 border-accent-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-accent-800">Input metadata</h2>
                <pre className="overflow-x-auto rounded-lg bg-accent-50 p-4 text-sm text-accent-800">
                  {JSON.stringify(log.inputMetadata, null, 2)}
                </pre>
              </div>
            )}

            {log.outputMetadata && Object.keys(log.outputMetadata).length > 0 && (
              <div className="rounded-xl border-2 border-accent-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-accent-800">Output metadata</h2>
                <pre className="overflow-x-auto rounded-lg bg-accent-50 p-4 text-sm text-accent-800">
                  {JSON.stringify(log.outputMetadata, null, 2)}
                </pre>
              </div>
            )}

            {log.errorMessage && !log.success && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
                <h2 className="mb-2 text-lg font-semibold text-red-800">Error message</h2>
                <p className="text-red-700">{log.errorMessage}</p>
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
