import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { BulkActionBar } from '@/components/BulkActionBar';
import { BulkCheckbox } from '@/components/BulkCheckbox';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { useTablePreferences } from '@/hooks/useTablePreferences';

const INCIDENT_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'children', label: 'Children' },
  { key: 'detected', label: 'Detected' },
  { key: 'board', label: 'Board' },
  { key: 'users', label: 'Users' },
  { key: 'actions', label: 'Actions' },
] as const;

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

export default function SecurityIncidents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ incidents: Incident[]; total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const statusFilter = searchParams.get('status') ?? '';
  const severityFilter = searchParams.get('severity') ?? '';
  const updateParams = (updates: { status?: string; severity?: string }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };
  const [editForm, setEditForm] = useState({
    status: '',
    boardNotifiedAt: '',
    usersNotifiedAt: '',
    actionsTaken: '',
    affectedUserCount: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useTablePreferences('security_incidents', INCIDENT_COLUMNS.map((c) => c.key));
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'data_breach',
    severity: 'high',
    childrenDataAffected: false,
    detectedAt: new Date().toISOString().slice(0, 16),
    affectedDataTypes: '',
    affectedUserCount: '',
    actionsTaken: '',
  });

  const fetchIncidents = useCallback(() => {
    setLoading(true);
    adminApi.securityIncidents.list({
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      sort: 'detectedAt',
      order: 'desc',
    })
      .then((d) => setData(d as { incidents: Incident[]; total: number; page: number; limit: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (!editingId || !data) return;
    const incident = data.incidents.find((i) => i._id === editingId);
    if (incident) {
      setEditForm({
        status: incident.status ?? '',
        boardNotifiedAt: incident.boardNotifiedAt ? new Date(incident.boardNotifiedAt).toISOString().slice(0, 16) : '',
        usersNotifiedAt: incident.usersNotifiedAt ? new Date(incident.usersNotifiedAt).toISOString().slice(0, 16) : '',
        actionsTaken: (incident.actionsTaken ?? []).join('\n'),
        affectedUserCount: incident.affectedUserCount != null ? String(incident.affectedUserCount) : '',
      });
    }
    setSaveError(null);
  }, [editingId, data]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.securityIncidents.update(editingId, {
        status: editForm.status || undefined,
        boardNotifiedAt: editForm.boardNotifiedAt ? new Date(editForm.boardNotifiedAt).toISOString() : undefined,
        usersNotifiedAt: editForm.usersNotifiedAt ? new Date(editForm.usersNotifiedAt).toISOString() : undefined,
        actionsTaken: editForm.actionsTaken ? editForm.actionsTaken.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
        affectedUserCount: editForm.affectedUserCount ? parseInt(editForm.affectedUserCount, 10) : undefined,
      });
      setEditingId(null);
      toast.success('Incident updated');
      fetchIncidents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.securityIncidents.create({
        title: form.title,
        description: form.description,
        type: form.type,
        severity: form.severity,
        childrenDataAffected: form.childrenDataAffected,
        detectedAt: form.detectedAt ? new Date(form.detectedAt).toISOString() : undefined,
        affectedDataTypes: form.affectedDataTypes ? form.affectedDataTypes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        affectedUserCount: form.affectedUserCount ? parseInt(form.affectedUserCount, 10) : undefined,
        actionsTaken: form.actionsTaken ? form.actionsTaken.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      });
      setShowForm(false);
      setForm({ title: '', description: '', type: 'data_breach', severity: 'high', childrenDataAffected: false, detectedAt: new Date().toISOString().slice(0, 16), affectedDataTypes: '', affectedUserCount: '', actionsTaken: '' });
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const col = (key: string) => visibleColumns.includes(key) || visibleColumns.length === 0;
  const searchLower = search.trim().toLowerCase();
  const filteredIncidents = searchLower
    ? (data?.incidents ?? []).filter(
        (i) =>
          (i.title ?? '').toLowerCase().includes(searchLower) ||
          (i.type ?? '').toLowerCase().includes(searchLower) ||
          (i.description ?? '').toLowerCase().includes(searchLower) ||
          (i.status ?? '').toLowerCase().includes(searchLower)
      )
    : (data?.incidents ?? []);

  const bulk = useBulkSelect(filteredIncidents);
  const bulkUpdateStatus = (status: string) => async (ids: string[]) => {
    try {
      for (const id of ids) {
        await adminApi.securityIncidents.update(id, { status });
      }
      toast.success(`${ids.length} incident(s) updated`);
      fetchIncidents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const severityColor: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-800">Security Incidents</h1>
        <div className="flex gap-2">
          <ExportButton
            entity="security-incidents"
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'type', label: 'Type' },
              { key: 'severity', label: 'Severity' },
              { key: 'status', label: 'Status' },
              { key: 'childrenDataAffected', label: 'Children Affected' },
              { key: 'detectedAt', label: 'Detected' },
              { key: 'boardNotifiedAt', label: 'Board Notified' },
              { key: 'usersNotifiedAt', label: 'Users Notified' },
              { key: 'affectedUserCount', label: 'Users Affected' },
              { key: 'createdAt', label: 'Created' },
            ]}
            params={{
              ...(statusFilter && { status: statusFilter }),
              ...(severityFilter && { severity: severityFilter }),
            }}
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700"
          >
            {showForm ? 'Cancel' : 'Report Incident'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-lg border border-accent-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-accent-800">Report Security Incident</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="data_breach">Data Breach</option>
                <option value="unauthorized_access">Unauthorized Access</option>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Severity *</label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Detected At</label>
              <input
                type="datetime-local"
                value={form.detectedAt}
                onChange={(e) => setForm((f) => ({ ...f, detectedAt: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.childrenDataAffected}
                  onChange={(e) => setForm((f) => ({ ...f, childrenDataAffected: e.target.checked }))}
                />
                <span className="text-sm font-medium text-gray-700">Children&apos;s data affected (DPDP: triggers Board + parent notification)</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Affected data types (comma-separated)</label>
              <input
                type="text"
                value={form.affectedDataTypes}
                onChange={(e) => setForm((f) => ({ ...f, affectedDataTypes: e.target.value }))}
                placeholder="e.g. names, emails, payment info"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Affected user count (approx)</label>
              <input
                type="number"
                value={form.affectedUserCount}
                onChange={(e) => setForm((f) => ({ ...f, affectedUserCount: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Actions taken (one per line)</label>
              <textarea
                value={form.actionsTaken}
                onChange={(e) => setForm((f) => ({ ...f, actionsTaken: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Containment steps, remediation..."
              />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700">
              Report Incident
            </button>
          </div>
        </form>
      )}

      <FilterBar
        searchPlaceholder="Search title, type, status..."
        search={search}
        onSearchChange={setSearch}
        filters={[
          { key: 'status', label: 'Status', value: statusFilter, onChange: (v) => updateParams({ status: v }), options: [
            { value: '', label: 'All' },
            { value: 'open', label: 'Open' },
            { value: 'investigating', label: 'Investigating' },
            { value: 'contained', label: 'Contained' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'reported', label: 'Reported' },
          ]},
          { key: 'severity', label: 'Severity', value: severityFilter, onChange: (v) => updateParams({ severity: v }), options: [
            { value: '', label: 'All' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]},
        ]}
        extra={
          <ColumnSelector pageKey="security_incidents" columns={[...INCIDENT_COLUMNS]} visibleColumns={visibleColumns.length ? visibleColumns : INCIDENT_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumns} />
        }
      />

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingId(null)}>
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Update Incident</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
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
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Users Notified At</label>
                <input
                  type="datetime-local"
                  value={editForm.usersNotifiedAt}
                  onChange={(e) => setEditForm((f) => ({ ...f, usersNotifiedAt: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Affected User Count</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.affectedUserCount}
                  onChange={(e) => setEditForm((f) => ({ ...f, affectedUserCount: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Actions Taken (one per line)</label>
                <textarea
                  value={editForm.actionsTaken}
                  onChange={(e) => setEditForm((f) => ({ ...f, actionsTaken: e.target.value }))}
                  rows={3}
                  placeholder="Containment steps, remediation..."
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataState loading={loading} error={error}>
        {data && (
          <>
            {bulk.someSelected && (
              <div className="mb-4">
                <BulkActionBar
                  selectedIds={bulk.selectedIds}
                  entityLabel="incidents"
                  actions={[
                    {
                      id: 'investigating',
                      label: 'Mark Investigating',
                      confirm: true,
                      confirmTitle: 'Update status to Investigating',
                      confirmMessage: 'The selected incidents will be marked as under investigation.',
                      onExecute: bulkUpdateStatus('investigating'),
                    },
                    {
                      id: 'resolved',
                      label: 'Mark Resolved',
                      variant: 'success',
                      confirm: true,
                      confirmTitle: 'Update status to Resolved',
                      confirmMessage: 'The selected incidents will be marked as resolved.',
                      onExecute: bulkUpdateStatus('resolved'),
                    },
                  ]}
                  onClear={bulk.clearSelection}
                />
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-accent-50">
                  <tr>
                    <th className="w-10 px-2 py-2">
                      <BulkCheckbox
                        checked={bulk.allSelectableSelected}
                        indeterminate={bulk.someSelected && !bulk.allSelectableSelected}
                        onChange={bulk.toggleAll}
                        aria-label="Select all incidents"
                      />
                    </th>
                    {col('title') && <th className="px-4 py-2 text-left">Title</th>}
                  {col('type') && <th className="px-4 py-2 text-left">Type</th>}
                  {col('severity') && <th className="px-4 py-2 text-left">Severity</th>}
                  {col('status') && <th className="px-4 py-2 text-left">Status</th>}
                  {col('children') && <th className="px-4 py-2 text-left">Children</th>}
                  {col('detected') && <th className="px-4 py-2 text-left">Detected</th>}
                  {col('board') && <th className="px-4 py-2 text-left">Board</th>}
                  {col('users') && <th className="px-4 py-2 text-left">Users</th>}
                  {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((i) => (
                  <tr key={i._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                    <td className="w-10 px-2 py-2">
                      <BulkCheckbox
                        checked={bulk.isSelected(i._id)}
                        onChange={() => bulk.toggle(i._id)}
                        aria-label={`Select ${i.title}`}
                      />
                    </td>
                    {col('title') && (
                      <td className="px-4 py-2">
                        <Link
                          to={`/security-incidents/${i._id}`}
                          state={{ from: location.pathname + location.search }}
                          className="text-accent-600 hover:underline"
                        >
                          {i.title}
                        </Link>
                      </td>
                    )}
                    {col('type') && <td className="px-4 py-2">{i.type}</td>}
                    {col('severity') && <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 ${severityColor[i.severity] || 'bg-gray-100'}`}>
                        {i.severity}
                      </span>
                    </td>}
                    {col('status') && <td className="px-4 py-2">{i.status}</td>}
                    {col('children') && <td className="px-4 py-2">{i.childrenDataAffected ? 'Yes' : 'No'}</td>}
                    {col('detected') && <td className="px-4 py-2">{i.detectedAt ? new Date(i.detectedAt).toLocaleString() : '-'}</td>}
                    {col('board') && <td className="px-4 py-2">{i.boardNotifiedAt ? new Date(i.boardNotifiedAt).toLocaleDateString() : '-'}</td>}
                    {col('users') && <td className="px-4 py-2">{i.usersNotifiedAt ? new Date(i.usersNotifiedAt).toLocaleDateString() : '-'}</td>}
                    {col('actions') && <td className="px-4 py-2">
                      <Link
                        to={`/security-incidents/${i._id}`}
                        state={{ from: location.pathname + location.search }}
                        className="mr-2 text-accent-600 hover:underline"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingId(i._id)}
                        className="text-accent-600 hover:underline"
                      >
                        Update
                      </button>
                    </td>}
                  </tr>
                ))}
                {filteredIncidents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No security incidents reported. Use &quot;Report Incident&quot; to log one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </DataState>
    </div>
  );
}
