import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { useTablePreferences } from '@/hooks/useTablePreferences';

const LOG_COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'operation', label: 'Operation' },
  { key: 'user', label: 'User' },
  { key: 'source', label: 'Source' },
  { key: 'entity', label: 'Entity' },
  { key: 'input', label: 'Input' },
  { key: 'output', label: 'Output' },
  { key: 'duration', label: 'Duration' },
  { key: 'status', label: 'Status' },
] as const;

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
  createdAt: string;
};

export default function AIUsageLogs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    logs: Log[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [operationFilter, setOperationFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [visibleColumns, setVisibleColumns] = useTablePreferences('ai_usage_logs', LOG_COLUMNS.map((c) => c.key));

  const fetchLogs = useCallback(() => {
    setLoading(true);
    adminApi.aiUsageLogs.list({
      operationType: operationFilter || undefined,
      success: successFilter || undefined,
      sort: 'createdAt',
      order: 'desc',
      limit: 50,
    })
      .then((d) => setData(d as { logs: Log[]; total: number; page: number; limit: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [operationFilter, successFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">AI Usage Logs</h1>
      <p className="mb-4 text-accent-700">
        Audit trail of all AI invocations. Metadata is logged for compliance; no raw PII or media stored.
      </p>

      <FilterBar
        filters={[
          { key: 'operation', label: 'Operation', value: operationFilter, onChange: (v) => updateParams({ operation: v }), options: [
            { value: '', label: 'All' },
            { value: 'generate_study_material', label: 'Study Material' },
            { value: 'answer_doubt', label: 'Answer Doubt' },
            { value: 'generate_exam_questions', label: 'Exam Questions' },
            { value: 'evaluate_student_exam', label: 'Evaluate Exam' },
            { value: 'analyze_classroom_frame', label: 'Classroom Frame' },
            { value: 'analyze_exam_frame', label: 'Exam Frame' },
            { value: 'analyze_exam_frame_with_audio', label: 'Exam Frame + Audio' },
            { value: 'generate_qualification_exam', label: 'Qualification Exam' },
            { value: 'generate_teacher_qualification_exam', label: 'Teacher Qual Exam' },
            { value: 'evaluate_teacher_exam', label: 'Evaluate Teacher Exam' },
            { value: 'verify_document_photo', label: 'Verify Document' },
          ]},
          { key: 'success', label: 'Success', value: successFilter, onChange: setSuccessFilter, options: [
            { value: '', label: 'All' },
            { value: 'true', label: 'Success' },
            { value: 'false', label: 'Failed' },
          ]},
        ]}
        extra={
          <ColumnSelector pageKey="ai_usage_logs" columns={[...LOG_COLUMNS]} visibleColumns={visibleColumns.length ? visibleColumns : LOG_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumns} />
        }
      />

      <DataState loading={loading} error={error}>
        {data && (
          <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-accent-50">
                <tr>
                  {(visibleColumns.includes('time') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Time</th>}
                  {(visibleColumns.includes('operation') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Operation</th>}
                  {(visibleColumns.includes('user') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">User</th>}
                  {(visibleColumns.includes('source') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Source</th>}
                  {(visibleColumns.includes('entity') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Entity</th>}
                  {(visibleColumns.includes('input') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Input</th>}
                  {(visibleColumns.includes('output') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Output</th>}
                  {(visibleColumns.includes('duration') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Duration</th>}
                  {(visibleColumns.includes('status') || visibleColumns.length === 0) && <th className="px-4 py-2 text-left">Status</th>}
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => {
                  const col = (k: string) => visibleColumns.includes(k) || visibleColumns.length === 0;
                  return (
                  <tr key={log._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                    {col('time') && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link to={`/ai-usage-logs/${log._id}`} state={{ from: location.pathname + location.search }} className="text-accent-600 hover:underline">
                          {new Date(log.createdAt).toLocaleString()}
                        </Link>
                      </td>
                    )}
                    {col('operation') && <td className="px-4 py-2">{log.operationType}</td>}
                    {col('user') && <td className="px-4 py-2">
                      {(log.userId as { email?: string })?.email || (log.userId as { phone?: string })?.phone || '-'}
                      {log.userRole && ` (${log.userRole})`}
                    </td>}
                    {col('source') && <td className="px-4 py-2">{log.source}</td>}
                    {col('entity') && <td className="px-4 py-2">
                      {log.entityType || '-'}
                      {log.entityId && ` ${String(log.entityId).slice(-8)}`}
                    </td>}
                    {col('input') && <td className="px-4 py-2 max-w-[150px] truncate" title={JSON.stringify(log.inputMetadata)}>
                      {log.inputMetadata ? JSON.stringify(log.inputMetadata).slice(0, 60) + '...' : '-'}
                    </td>}
                    {col('output') && <td className="px-4 py-2 max-w-[150px] truncate" title={JSON.stringify(log.outputMetadata)}>
                      {log.outputMetadata ? JSON.stringify(log.outputMetadata).slice(0, 60) + '...' : '-'}
                    </td>}
                    {col('duration') && <td className="px-4 py-2">{log.durationMs != null ? `${log.durationMs}ms` : '-'}</td>}
                    {col('status') && <td className="px-4 py-2">
                      <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                        {log.success ? 'OK' : log.errorMessage || 'Failed'}
                      </span>
                    </td>}
                  </tr>
                );})}
                {data.logs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No AI usage logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
