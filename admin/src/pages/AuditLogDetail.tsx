import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import BackLink from '@/components/BackLink';

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
  requestId?: string;
  details?: Record<string, unknown>;
};

export default function AuditLogDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi.auditLogs
      .get(id)
      .then((d) => setLog(d as AuditLogEntry))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  const from = (location.state as { from?: string })?.from || '/audit-logs';

  return (
    <div className="p-8">
      <BackLink to={from} label="Back to Audit Log" />

      <DataState loading={loading} error={error}>
        {log && (
          <div className="mt-6 rounded-lg border border-accent-200 bg-white">
            <div className="border-b border-accent-200 bg-accent-50 px-6 py-4">
              <h1 className="text-lg font-semibold text-accent-800">Audit Log Entry</h1>
              <p className="mt-1 text-sm text-accent-600">
                {new Date(log.createdAt).toLocaleString()} • {log.action} • {log.method} {log.path}
              </p>
            </div>
            <dl className="divide-y divide-accent-100">
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Timestamp</dt>
                <dd>{new Date(log.createdAt).toLocaleString()}</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Actor</dt>
                <dd>
                  {log.actorEmail || '-'}
                  {log.actorRole && <span className="ml-2 text-accent-500">({log.actorRole})</span>}
                </dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Action</dt>
                <dd>{log.action}</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Resource</dt>
                <dd>
                  {log.resourceType || '-'}
                  {log.resourceId && <span className="ml-2 font-mono text-accent-600">{log.resourceId}</span>}
                </dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Method</dt>
                <dd className="font-mono">{log.method}</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Path</dt>
                <dd className="break-all font-mono text-sm">{log.path}</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Status Code</dt>
                <dd>{log.statusCode ?? '-'}</dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">Success</dt>
                <dd>
                  <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                    {log.success !== undefined ? (log.success ? 'Yes' : 'No') : '-'}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-accent-600">IP Address</dt>
                <dd className="font-mono text-sm">{log.ipAddress || '-'}</dd>
              </div>
              {log.userAgent && (
                <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                  <dt className="text-sm font-medium text-accent-600">User Agent</dt>
                  <dd className="break-all text-sm">{log.userAgent}</dd>
                </div>
              )}
              {log.requestId && (
                <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                  <dt className="text-sm font-medium text-accent-600">Request ID</dt>
                  <dd className="font-mono text-sm">{log.requestId}</dd>
                </div>
              )}
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4">
                  <dt className="text-sm font-medium text-accent-600">Details</dt>
                  <dd>
                    <pre className="overflow-x-auto rounded bg-accent-50 p-3 text-xs">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </DataState>
    </div>
  );
}
