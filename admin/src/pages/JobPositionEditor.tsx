import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/lib/api';

type JobApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  status: string;
  remarks: string;
  createdAt: string;
};

const STATUS_OPTIONS = ['new', 'viewed', 'in_process', 'approved', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-800',
  viewed: 'bg-blue-100 text-blue-800',
  in_process: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function JobPositionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingJd, setUploadingJd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('');
  const [type, setType] = useState('Full-time');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [jdUrl, setJdUrl] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<Record<string, { status: string; remarks: string }>>({});
  const [savingAppId, setSavingAppId] = useState<string | null>(null);

  const fetchApplications = () => {
    if (!id || id === 'new') return;
    setApplicationsLoading(true);
    adminApi.jobApplications
      .list({ positionId: id })
      .then((d) => setApplications(d.applications))
      .catch(() => setApplications([]))
      .finally(() => setApplicationsLoading(false));
  };

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    setError(null);
    adminApi.jobPositions
      .get(id)
      .then((p: unknown) => {
        const pos = p as { title: string; team: string; type: string; location: string; description: string; jdUrl: string | null; status: string };
        setTitle(pos.title);
        setTeam(pos.team);
        setType(pos.type);
        setLocation(pos.location);
        setDescription(pos.description || '');
        setStatus(pos.status as 'open' | 'closed');
        setJdUrl(pos.jdUrl);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  useEffect(() => {
    fetchApplications();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !team.trim() || !type.trim() || !location.trim()) {
      toast.error('Title, team, type, and location are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const created = await adminApi.jobPositions.create({ title: title.trim(), team: team.trim(), type: type.trim(), location: location.trim(), description: description.trim() });
        toast.success('Position created');
        navigate(`/job-positions/${(created as { id: string }).id}`);
      } else if (id) {
        await adminApi.jobPositions.update(id, { title: title.trim(), team: team.trim(), type: type.trim(), location: location.trim(), description: description.trim(), status });
        toast.success('Position updated');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || id === 'new') return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('JD must be under 25MB');
      return;
    }
    setUploadingJd(true);
    try {
      const { jdUrl: url } = await adminApi.jobPositions.uploadJd(id, file);
      setJdUrl(url);
      toast.success('JD uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingJd(false);
      e.target.value = '';
    }
  };

  const handleAppStatusChange = (appId: string, status: string, remarks: string) => {
    setEditingApp((prev) => ({ ...prev, [appId]: { status, remarks } }));
  };

  const handleSaveApplication = async (appId: string) => {
    const edit = editingApp[appId];
    if (!edit) return;
    setSavingAppId(appId);
    try {
      await adminApi.jobApplications.update(appId, { status: edit.status, remarks: edit.remarks });
      toast.success('Application updated');
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: edit.status, remarks: edit.remarks } : a))
      );
      setExpandedAppId(null);
      setEditingApp((prev) => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingAppId(null);
    }
  };

  const getEditState = (app: JobApplication) =>
    editingApp[app.id] ?? { status: app.status, remarks: app.remarks || '' };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded bg-accent-100 font-medium text-accent-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-800">{isNew ? 'Add Job Position' : `Edit: ${title || 'Position'}`}</h1>
        <Link to="/job-positions" className="text-sm font-medium text-accent-600 hover:text-accent-800">
          ← Back to list
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-accent-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-accent-800">Position details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                placeholder="e.g. Senior Full-Stack Engineer"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Team *</label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                placeholder="e.g. Remote / Bangalore"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                placeholder="Brief description of the role..."
              />
            </div>
            {!isNew && (
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {!isNew && id && (
          <div className="rounded-xl border border-accent-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-accent-800">Job Description (JD)</h2>
            <p className="mb-4 text-sm text-accent-600">Upload a PDF (max 25MB). Applicants can download it from the Careers page.</p>
            {jdUrl ? (
              <div className="flex items-center gap-4">
                <a
                  href={`${API_BASE}${jdUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-accent-100 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-200"
                >
                  Download current JD
                </a>
                <label className="cursor-pointer rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">
                  {uploadingJd ? 'Uploading...' : 'Replace JD'}
                  <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleJdUpload} disabled={uploadingJd} />
                </label>
              </div>
            ) : (
              <label className="inline-block cursor-pointer rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-100">
                {uploadingJd ? 'Uploading...' : 'Upload JD (PDF, max 25MB)'}
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleJdUpload} disabled={uploadingJd} />
              </label>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </form>

      {!isNew && id && (
        <div className="mt-10 rounded-xl border border-accent-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-accent-800">Applicants ({applications.length})</h2>
          {applicationsLoading ? (
            <div className="animate-pulse rounded bg-accent-100 py-8 text-center text-sm text-accent-600">
              Loading applicants...
            </div>
          ) : applications.length === 0 ? (
            <p className="py-8 text-center text-accent-600">No applications yet.</p>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => {
                const isExpanded = expandedAppId === app.id;
                const edit = getEditState(app);
                return (
                  <div
                    key={app.id}
                    className="rounded-lg border border-accent-200 bg-accent-50/30 transition hover:border-accent-300"
                  >
                    <div
                      className="flex cursor-pointer items-center justify-between px-4 py-3"
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-accent-800">{app.name}</span>
                        <span className="text-sm text-accent-600">{app.email}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {app.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-accent-500">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`${API_BASE}${app.resumeUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded px-2 py-1 text-sm font-medium text-accent-600 hover:bg-accent-100"
                        >
                          Resume
                        </a>
                        <svg
                          className={`h-5 w-5 text-accent-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-accent-200 bg-white px-4 py-4">
                        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-accent-500">Phone</dt>
                            <dd>
                              <a href={`tel:${app.phone}`} className="text-accent-600 hover:underline">{app.phone}</a>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-accent-500">Applied</dt>
                            <dd>{app.createdAt ? new Date(app.createdAt).toLocaleString() : '-'}</dd>
                          </div>
                          {app.coverLetter && (
                            <div className="sm:col-span-2">
                              <dt className="text-accent-500">Cover letter</dt>
                              <dd className="mt-1 whitespace-pre-wrap rounded bg-accent-50 p-2 text-accent-700">
                                {app.coverLetter}
                              </dd>
                            </div>
                          )}
                        </dl>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-accent-600">Status</label>
                            <select
                              value={edit.status}
                              onChange={(e) => handleAppStatusChange(app.id, e.target.value, edit.remarks)}
                              className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-accent-600">Remarks</label>
                            <textarea
                              value={edit.remarks}
                              onChange={(e) => handleAppStatusChange(app.id, edit.status, e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm"
                              placeholder="Internal notes..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveApplication(app.id)}
                            disabled={savingAppId === app.id}
                            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                          >
                            {savingAppId === app.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
