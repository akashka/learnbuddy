import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import Tabs from '@/components/Tabs';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { LocationSearch } from '@/components/LocationSearch';

const DRAFT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'lastSaved', label: 'Last Saved' },
  { key: 'actions', label: 'Actions' },
] as const;

type TeacherDraft = { _id: string; phone?: string; step1Data?: { name?: string; email?: string; phone?: string; location?: string }; lastSavedAt?: string };
type ParentDraft = { _id: string; phone?: string; data?: { name?: string; email?: string; phone?: string; location?: string }; lastSavedAt?: string };

function getDraftDisplay(d: TeacherDraft | ParentDraft) {
  const name = (d as TeacherDraft).step1Data?.name ?? (d as ParentDraft).data?.name ?? '-';
  const email = (d as TeacherDraft).step1Data?.email ?? (d as ParentDraft).data?.email ?? '-';
  const phone = (d as TeacherDraft).step1Data?.phone ?? (d as ParentDraft).data?.phone ?? (d as TeacherDraft).phone ?? (d as ParentDraft).phone ?? '-';
  return { name, email, phone };
}

export default function Drafts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ teacherDrafts: TeacherDraft[]; parentDrafts: ParentDraft[] } | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'teacher' | 'parent'>('teacher');
  const toast = useToast();
  const [visibleColumns, setVisibleColumns] = useTablePreferences('drafts', DRAFT_COLUMNS.map((c) => c.key));
  const [editing, setEditing] = useState<{ type: 'teacher' | 'parent'; id: string } | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    adminApi.drafts()
      .then((d) => setData(d as { teacherDrafts: TeacherDraft[]; parentDrafts: ParentDraft[] }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!editing || !data) return;
    if (editing.type === 'teacher') {
      const d = data.teacherDrafts.find((x) => x._id === editing.id);
      if (d) {
        const s = (d as TeacherDraft).step1Data;
        setEditForm({
          name: s?.name ?? '',
          email: s?.email ?? '',
          phone: s?.phone ?? (d as TeacherDraft).phone ?? '',
          location: s?.location ?? '',
        });
      }
    } else {
      const d = data.parentDrafts.find((x) => x._id === editing.id);
      if (d) {
        const pd = (d as ParentDraft).data;
        setEditForm({
          name: pd?.name ?? '',
          email: pd?.email ?? '',
          phone: pd?.phone ?? (d as ParentDraft).phone ?? '',
          location: pd?.location ?? '',
        });
      }
    }
    setSaveError(null);
  }, [editing, data]);

  const searchLower = search.trim().toLowerCase();
  const filterDraft = (d: TeacherDraft | ParentDraft) => {
    if (!searchLower) return true;
    const { name, email, phone } = getDraftDisplay(d);
    return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower) || phone.includes(search);
  };

  const filteredTeacher = useMemo(() => (data?.teacherDrafts ?? []).filter(filterDraft), [data?.teacherDrafts, searchLower]);
  const filteredParent = useMemo(() => (data?.parentDrafts ?? []).filter(filterDraft), [data?.parentDrafts, searchLower]);

  const col = (key: string) => visibleColumns.includes(key) || visibleColumns.length === 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing.type === 'teacher') {
        await adminApi.draftsUpdate({
          type: 'teacher',
          id: editing.id,
          data: { step1Data: { name: editForm.name.trim(), email: editForm.email.trim(), phone: editForm.phone.trim(), location: editForm.location.trim() || undefined } },
        });
      } else {
        await adminApi.draftsUpdate({
          type: 'parent',
          id: editing.id,
          data: { data: { name: editForm.name.trim(), email: editForm.email.trim(), phone: editForm.phone.trim(), location: editForm.location.trim() || undefined } },
        });
      }
      setEditing(null);
      toast.success('Draft updated');
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Drafts</h1>
      <FilterBar
        searchPlaceholder="Search name, email, phone..."
        search={search}
        onSearchChange={setSearch}
        extra={
          <ColumnSelector pageKey="drafts" columns={[...DRAFT_COLUMNS]} visibleColumns={visibleColumns.length ? visibleColumns : DRAFT_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumns} />
        }
      />
      <Tabs
        tabs={[
          { id: 'teacher', label: 'Teacher Drafts', count: filteredTeacher.length },
          { id: 'parent', label: 'Parent Drafts', count: filteredParent.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'teacher' | 'parent')}
        ariaLabel="Draft type tabs"
      />
      <DataState loading={loading} error={error}>
        {data && (
          <div className="rounded-lg border border-accent-200 bg-white">
            {activeTab === 'teacher' && (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      {col('name') && <th className="px-4 py-2 text-left">Name</th>}
                      {col('email') && <th className="px-4 py-2 text-left">Email</th>}
                      {col('phone') && <th className="px-4 py-2 text-left">Phone</th>}
                      {col('lastSaved') && <th className="px-4 py-2 text-left">Last Saved</th>}
                      {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeacher.map((d) => {
                      const disp = getDraftDisplay(d);
                      return (
                      <tr key={d._id} className="border-t border-accent-100">
                        {col('name') && <td className="px-4 py-2">{disp.name}</td>}
                        {col('email') && <td className="px-4 py-2">{disp.email}</td>}
                        {col('phone') && <td className="px-4 py-2">{disp.phone}</td>}
                        {col('lastSaved') && <td className="px-4 py-2">{d.lastSavedAt ? new Date(d.lastSavedAt).toLocaleString() : '-'}</td>}
                        {col('actions') && (
                          <td className="px-4 py-2">
                            <button type="button" onClick={() => setEditing({ type: 'teacher', id: d._id })} className="text-accent-600 hover:underline">
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    );})}
                    {filteredTeacher.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                          No teacher drafts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
            )}
            {activeTab === 'parent' && (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      {col('name') && <th className="px-4 py-2 text-left">Name</th>}
                      {col('email') && <th className="px-4 py-2 text-left">Email</th>}
                      {col('phone') && <th className="px-4 py-2 text-left">Phone</th>}
                      {col('lastSaved') && <th className="px-4 py-2 text-left">Last Saved</th>}
                      {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParent.map((d) => {
                      const disp = getDraftDisplay(d);
                      return (
                      <tr key={d._id} className="border-t border-accent-100">
                        {col('name') && <td className="px-4 py-2">{disp.name}</td>}
                        {col('email') && <td className="px-4 py-2">{disp.email}</td>}
                        {col('phone') && <td className="px-4 py-2">{disp.phone}</td>}
                        {col('lastSaved') && <td className="px-4 py-2">{d.lastSavedAt ? new Date(d.lastSavedAt).toLocaleString() : '-'}</td>}
                        {col('actions') && (
                          <td className="px-4 py-2">
                            <button type="button" onClick={() => setEditing({ type: 'parent', id: d._id })} className="text-accent-600 hover:underline">
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    );})}
                    {filteredParent.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                          No parent drafts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
            )}
          </div>
        )}
      </DataState>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-accent-800">
              Edit {editing.type === 'teacher' ? 'Teacher' : 'Parent'} Draft
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Phone *</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <LocationSearch
                value={editForm.location}
                onChange={(v) => setEditForm((f) => ({ ...f, location: v }))}
                label="Location"
                placeholder="Search for an address (optional)"
              />
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
