import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { useTablePreferences } from '@/hooks/useTablePreferences';

const LOG_COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'actor', label: 'Actor' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'method', label: 'Method' },
  { key: 'path', label: 'Path' },
  { key: 'status', label: 'Status' },
  { key: 'success', label: 'Success' },
  { key: 'ip', label: 'IP' },
] as const;

type AuditLogEntry = {
  _id: string;
  createdAt: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode?: number;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
};

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

const RESOURCE_OPTIONS = [
  { value: '', label: 'All resources' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'students', label: 'Students' },
  { value: 'parents', label: 'Parents' },
  { value: 'topics', label: 'Topics' },
  { value: 'enrollments', label: 'Enrollments' },
  { value: 'staff', label: 'Staff' },
  { value: 'cms_pages', label: 'CMS Pages' },
  { value: 'website_settings', label: 'Website Settings' },
  { value: 'documents', label: 'Documents' },
  { value: 'job_positions', label: 'Job Positions' },
  { value: 'job_applications', label: 'Job Applications' },
  { value: 'contact_submissions', label: 'Contact Submissions' },
  { value: 'security_incidents', label: 'Security Incidents' },
  { value: 'ai_review_requests', label: 'AI Review Requests' },
  { value: 'ai_data', label: 'AI Data' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'masters', label: 'Masters' },
  { value: 'teacher_payments', label: 'Teacher Payments' },
];

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    logs: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const actionFilter = searchParams.get('action') ?? '';
  const resourceFilter = searchParams.get('resourceType') ?? '';
  const successFilter = searchParams.get('success') ?? '';
  const fromFilter = searchParams.get('from') ?? '';
  const toFilter = searchParams.get('to') ?? '';
  const page = parseInt(searchParams.get('page') || '1');

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    });
    if (updates.page === undefined) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const [visibleColumns, setVisibleColumns] = useTablePreferences('audit_logs', LOG_COLUMNS.map((c) => c.key));

  const fetchLogs = useCallback(() => {
    setLoading(true);
    adminApi.auditLogs.list({
      action: actionFilter || undefined,
      resourceType: resourceFilter || undefined,
      success: successFilter || undefined,
      from: fromFilter || undefined,
      to: toFilter || undefined,
      sort: 'createdAt',
      order: 'desc',
      page,
      limit: 50,
    })
      .then((d) => setData(d as { logs: AuditLogEntry[]; total: number; page: number; limit: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [actionFilter, resourceFilter, successFilter, fromFilter, toFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const col = (k: string) => visibleColumns.includes(k) || visibleColumns.length === 0;

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Audit Log</h1>
          <p className="mt-1 text-sm text-accent-700">
            Compliance and auditing trail. Records admin logins, logouts, and all data mutations.
          </p>
        </div>
        <ExportButton
          entity="audit-logs"
          fields={[
            { key: 'createdAt', label: 'Timestamp' },
            { key: 'actorEmail', label: 'Actor' },
            { key: 'action', label: 'Action' },
            { key: 'resourceType', label: 'Resource' },
            { key: 'path', label: 'Path' },
            { key: 'statusCode', label: 'Status' },
            { key: 'success', label: 'Success' },
          ]}
          params={Object.fromEntries(
            Object.entries({
              action: actionFilter,
              resourceType: resourceFilter,
              from: fromFilter,
              to: toFilter,
            }).filter(([, v]) => v)
          ) as Record<string, string>}
          label="Export CSV"
        />
      </div>

      <FilterBar
        filters={[
          {
            key: 'action',
            label: 'Action',
            value: actionFilter,
            onChange: (v) => updateParams({ action: v }),
            options: ACTION_OPTIONS,
          },
          {
            key: 'resourceType',
            label: 'Resource',
            value: resourceFilter,
            onChange: (v) => updateParams({ resourceType: v }),
            options: RESOURCE_OPTIONS,
          },
          {
            key: 'success',
            label: 'Success',
            value: successFilter,
            onChange: (v) => updateParams({ success: v }),
            options: [
              { value: '', label: 'All' },
              { value: 'true', label: 'Success' },
              { value: 'false', label: 'Failed' },
            ],
          },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => updateParams({ from: e.target.value })}
              className="rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              title="From date"
            />
            <span className="text-accent-600">to</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => updateParams({ to: e.target.value })}
              className="rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              title="To date"
            />
            <ColumnSelector
              pageKey="audit_logs"
              columns={[...LOG_COLUMNS]}
              visibleColumns={visibleColumns.length ? visibleColumns : LOG_COLUMNS.map((c) => c.key)}
              onVisibleChange={setVisibleColumns}
            />
          </div>
        }
      />

      <DataState loading={loading} error={error}>
        {data && (
          <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-accent-50">
                <tr>
                  {col('time') && <th className="px-4 py-3 text-left font-medium text-accent-700">Time</th>}
                  {col('actor') && <th className="px-4 py-3 text-left font-medium text-accent-700">Actor</th>}
                  {col('action') && <th className="px-4 py-3 text-left font-medium text-accent-700">Action</th>}
                  {col('resource') && <th className="px-4 py-3 text-left font-medium text-accent-700">Resource</th>}
                  {col('method') && <th className="px-4 py-3 text-left font-medium text-accent-700">Method</th>}
                  {col('path') && <th className="px-4 py-3 text-left font-medium text-accent-700">Path</th>}
                  {col('status') && <th className="px-4 py-3 text-left font-medium text-accent-700">Status</th>}
                  {col('success') && <th className="px-4 py-3 text-left font-medium text-accent-700">Success</th>}
                  {col('ip') && <th className="px-4 py-3 text-left font-medium text-accent-700">IP</th>}
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                    {col('time') && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          to={`/audit-logs/${log._id}`}
                          state={{ from: location.pathname + location.search }}
                          className="text-accent-600 hover:underline"
                        >
                          {new Date(log.createdAt).toLocaleString()}
                        </Link>
                      </td>
                    )}
                    {col('actor') && (
                      <td className="px-4 py-3">
                        {log.actorEmail || '-'}
                        {log.actorRole && (
                          <span className="ml-1 text-accent-500">({log.actorRole})</span>
                        )}
                      </td>
                    )}
                    {col('action') && (
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            log.action === 'login' || log.action === 'logout'
                              ? 'bg-blue-100 text-blue-800'
                              : log.action === 'create'
                                ? 'bg-green-100 text-green-800'
                                : log.action === 'update'
                                  ? 'bg-amber-100 text-amber-800'
                                  : log.action === 'delete'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-accent-100 text-accent-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                    )}
                    {col('resource') && (
                      <td className="px-4 py-3">
                        {log.resourceType || '-'}
                        {log.resourceId && (
                          <span className="ml-1 text-accent-500">({log.resourceId.slice(0, 8)}…)</span>
                        )}
                      </td>
                    )}
                    {col('method') && <td className="px-4 py-3 font-mono text-xs">{log.method}</td>}
                    {col('path') && <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs" title={log.path}>{log.path}</td>}
                    {col('status') && <td className="px-4 py-3">{log.statusCode ?? '-'}</td>}
                    {col('success') && (
                      <td className="px-4 py-3">
                        <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                          {log.success !== undefined ? (log.success ? 'Yes' : 'No') : '-'}
                        </span>
                      </td>
                    )}
                    {col('ip') && <td className="px-4 py-3 font-mono text-xs">{log.ipAddress || '-'}</td>}
                  </tr>
                ))}
                {data.logs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-accent-600">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-accent-200 px-4 py-3">
                <p className="text-sm text-accent-600">
                  Showing page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateParams({ page: String(data.page - 1) })}
                    disabled={data.page <= 1}
                    className="rounded-lg border border-accent-200 px-3 py-1 text-sm disabled:opacity-50 hover:bg-accent-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => updateParams({ page: String(data.page + 1) })}
                    disabled={data.page >= data.totalPages}
                    className="rounded-lg border border-accent-200 px-3 py-1 text-sm disabled:opacity-50 hover:bg-accent-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
