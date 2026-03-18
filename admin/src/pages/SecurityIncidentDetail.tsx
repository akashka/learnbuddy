import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import BackLink from '@/components/BackLink';

type Incident = {
  _id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  childrenDataAffected: boolean;
  detectedAt: string;
  affectedDataTypes?: string[];
  affectedUserCount?: number;
  boardNotifiedAt?: string;
  usersNotifiedAt?: string;
  actionsTaken?: string[];
  reportedBy?: { email?: string };
  createdAt: string;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="w-40 shrink-0 font-medium text-accent-700">{label}:</span>
      <span className="text-accent-800">{value ?? '-'}</span>
    </div>
  );
}

const severityColor: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function SecurityIncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    boardNotifiedAt: '',
    usersNotifiedAt: '',
    actionsTaken: '',
    affectedUserCount: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchIncident = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.securityIncidents
      .get(id)
      .then((d) => {
        const inc = d as Incident;
        setIncident(inc);
        setEditForm({
          status: inc.status ?? '',
          boardNotifiedAt: inc.boardNotifiedAt ? new Date(inc.boardNotifiedAt).toISOString().slice(0, 16) : '',
          usersNotifiedAt: inc.usersNotifiedAt ? new Date(inc.usersNotifiedAt).toISOString().slice(0, 16) : '',
          actionsTaken: (inc.actionsTaken ?? []).join('\n'),
          affectedUserCount: inc.affectedUserCount != null ? String(inc.affectedUserCount) : '',
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.securityIncidents.update(id, {
        status: editForm.status || undefined,
        boardNotifiedAt: editForm.boardNotifiedAt ? new Date(editForm.boardNotifiedAt).toISOString() : undefined,
        usersNotifiedAt: editForm.usersNotifiedAt ? new Date(editForm.usersNotifiedAt).toISOString() : undefined,
        actionsTaken: editForm.actionsTaken ? editForm.actionsTaken.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
        affectedUserCount: editForm.affectedUserCount ? parseInt(editForm.affectedUserCount, 10) : undefined,
      });
      toast.success('Incident updated');
      fetchIncident();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <div className="p-8">
        <p className="text-accent-600">Invalid incident ID</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <BackLink to="/security-incidents" label="Back to Security Incidents" />
      </div>

      <h1 className="mb-6 text-2xl font-bold text-accent-800">Security Incident Detail</h1>

      <DataState loading={loading} error={error} onRetry={fetchIncident}>
        {incident && (
          <div className="space-y-8">
            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Details</h2>
              <div className="space-y-1">
                <DetailRow label="Title" value={incident.title} />
                <DetailRow label="Type" value={incident.type} />
                <DetailRow label="Severity" value={
                  <span className={`rounded px-2 py-0.5 ${severityColor[incident.severity] || 'bg-gray-100'}`}>
                    {incident.severity}
                  </span>
                } />
                <DetailRow label="Status" value={incident.status} />
                <DetailRow label="Children Data Affected" value={incident.childrenDataAffected ? 'Yes' : 'No'} />
                <DetailRow label="Detected At" value={incident.detectedAt ? new Date(incident.detectedAt).toLocaleString() : undefined} />
                <DetailRow label="Board Notified" value={incident.boardNotifiedAt ? new Date(incident.boardNotifiedAt).toLocaleString() : undefined} />
                <DetailRow label="Users Notified" value={incident.usersNotifiedAt ? new Date(incident.usersNotifiedAt).toLocaleString() : undefined} />
                <DetailRow label="Affected User Count" value={incident.affectedUserCount} />
                <DetailRow label="Reported By" value={(incident.reportedBy as { email?: string })?.email} />
                <DetailRow label="Created" value={incident.createdAt ? new Date(incident.createdAt).toLocaleString() : undefined} />
              </div>
              {incident.description && (
                <div className="mt-4">
                  <span className="font-medium text-accent-700">Description:</span>
                  <p className="mt-1 text-accent-800">{incident.description}</p>
                </div>
              )}
              {incident.affectedDataTypes && incident.affectedDataTypes.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-accent-700">Affected Data Types:</span>
                  <p className="mt-1 text-accent-800">{incident.affectedDataTypes.join(', ')}</p>
                </div>
              )}
              {incident.actionsTaken && incident.actionsTaken.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-accent-700">Actions Taken:</span>
                  <ul className="mt-1 list-inside list-disc text-accent-800">
                    {incident.actionsTaken.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-accent-800">Update Incident</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="contained">Contained</option>
                    <option value="resolved">Resolved</option>
                    <option value="reported">Reported</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Board Notified At</label>
                  <input
                    type="datetime-local"
                    value={editForm.boardNotifiedAt}
                    onChange={(e) => setEditForm((f) => ({ ...f, boardNotifiedAt: e.target.value }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Users Notified At</label>
                  <input
                    type="datetime-local"
                    value={editForm.usersNotifiedAt}
                    onChange={(e) => setEditForm((f) => ({ ...f, usersNotifiedAt: e.target.value }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Affected User Count</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.affectedUserCount}
                    onChange={(e) => setEditForm((f) => ({ ...f, affectedUserCount: e.target.value }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Actions Taken (one per line)</label>
                  <textarea
                    value={editForm.actionsTaken}
                    onChange={(e) => setEditForm((f) => ({ ...f, actionsTaken: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </form>
            </section>
          </div>
        )}
      </DataState>
    </div>
  );
}
