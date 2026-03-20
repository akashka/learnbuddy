import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { ImportButton } from '@/components/ImportButton';
import { BulkActionBar } from '@/components/BulkActionBar';
import { BulkCheckbox } from '@/components/BulkCheckbox';
import { PhotoUpload } from '@/components/PhotoUpload';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { useBulkSelect } from '@/hooks/useBulkSelect';

const STAFF_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hr', label: 'HR' },
  { value: 'finance', label: 'Finance' },
] as const;

const USER_COLUMNS = [
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'position', label: 'Position' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
] as const;

type Staff = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;
  staffRole?: string;
  position?: string;
  department?: string;
  isActive?: boolean;
  userId?: { email?: string; isActive?: boolean };
};

export default function Users() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ staff: Staff[]; total: number; page: number; totalPages: number } | null>(null);
  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useTablePreferences('users', USER_COLUMNS.map((c) => c.key));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    staffRole: 'sales',
    position: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmToggleStaff, setConfirmToggleStaff] = useState<Staff | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.staff
      .list({
        search: search || undefined,
        staffRole: staffRoleFilter || undefined,
        isActive: statusFilter !== '' ? statusFilter : undefined,
        sort,
        order,
        page,
        limit: 20,
      })
      .then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [search, staffRoleFilter, statusFilter, sort, order, page, refreshKey]);

  useEffect(() => {
    if (!editingId || !data) return;
    const s = data.staff.find((x) => x._id === editingId);
    if (s) {
      setForm({
        name: s.name ?? '',
        email: s.email ?? '',
        phone: s.phone ?? '',
        photo: s.photo ?? '',
        staffRole: s.staffRole ?? 'sales',
        position: s.position ?? '',
        department: s.department ?? '',
        password: '',
        confirmPassword: '',
      });
    }
    setSaveError(null);
  }, [editingId, data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      setSaveError('Passwords do not match');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.staff.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        photo: form.photo.trim() || undefined,
        staffRole: form.staffRole,
        position: form.position.trim() || undefined,
        department: form.department.trim() || undefined,
        password: form.password || undefined,
      });
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', photo: '', staffRole: 'sales', position: '', department: '', password: '', confirmPassword: '' });
      setShowPassword(false);
      setShowConfirmPassword(false);
      toast.success('User created successfully');
      setPage(1);
      setLoading(true);
      adminApi.staff
        .list({ page: 1, limit: 20 })
        .then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number }))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.staff.update(editingId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        photo: form.photo != null && form.photo.trim() ? form.photo.trim() : null,
        staffRole: form.staffRole,
      });
      setEditingId(null);
      setLoading(true);
      adminApi.staff
        .list({ search, staffRole: staffRoleFilter, page, limit: 20 })
        .then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number }))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiveClick = (s: Staff) => {
    setConfirmToggleStaff(s);
  };

  const handleToggleActiveConfirm = async () => {
    if (!confirmToggleStaff) return;
    setToggling(true);
    try {
      await adminApi.staff.update(confirmToggleStaff._id, { isActive: !confirmToggleStaff.isActive });
      toast.success(confirmToggleStaff.isActive !== false ? 'User deactivated' : 'User activated');
      setConfirmToggleStaff(null);
      setLoading(true);
      adminApi.staff
        .list({ search, staffRole: staffRoleFilter, isActive: statusFilter !== '' ? statusFilter : undefined, page, limit: 20 })
        .then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number }))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false));
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  const col = (key: string) => visibleColumns.includes(key) || visibleColumns.length === 0;
  const staff = data?.staff ?? [];
  const bulk = useBulkSelect(staff);

  const bulkActivate = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await adminApi.staff.update(id, { isActive: true });
      }
      toast.success(`${ids.length} user(s) activated`);
      setLoading(true);
      adminApi.staff
        .list({ search, staffRole: staffRoleFilter, isActive: statusFilter || undefined, page, limit: 20 })
        .then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number }))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate');
    }
  };

  const bulkDeactivate = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await adminApi.staff.update(id, { isActive: false });
      }
      toast.success(`${ids.length} user(s) deactivated`);
      setLoading(true);
      adminApi.staff
        .list({ search, staffRole: staffRoleFilter, isActive: statusFilter || undefined, page, limit: 20 })
        .then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number }))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-800">Users</h1>
        <div className="flex gap-2">
          <ExportButton
            entity="staff"
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'staffRole', label: 'Role' },
              { key: 'isActive', label: 'Active' },
              { key: 'createdAt', label: 'Created' },
            ]}
          />
          <ImportButton
            entity="staff"
            templateFilename="staff-import-template"
            label="Import"
            onSuccess={() => {
              toast.success('Staff imported successfully');
              setPage(1);
              setLoading(true);
              adminApi.staff.list({ page: 1, limit: 20 }).then((d) => setData(d as { staff: Staff[]; total: number; page: number; totalPages: number })).catch((e) => setError(e instanceof Error ? e.message : 'Failed')).finally(() => setLoading(false));
            }}
          />
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm({ name: '', email: '', phone: '', photo: '', staffRole: 'sales', position: '', department: '', password: '', confirmPassword: '' });
              setShowPassword(false);
              setShowConfirmPassword(false);
            }}
            className="rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700"
          >
            Add User
          </button>
        </div>
      </div>
      {/* <p className="mb-4 text-sm text-accent-700">
        Company employees who access the admin portal. Roles: Admin (full access), Sales, Marketing, HR, Finance.
      </p> */}

      <FilterBar
        searchPlaceholder="Search name, email, phone..."
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearchParams((p) => {
            const next = new URLSearchParams(p);
            if (v) next.set('search', v);
            else next.delete('search');
            return next;
          });
        }}
        filters={[
          {
            key: 'role',
            label: 'Role',
            value: staffRoleFilter,
            onChange: (v) => {
              setStaffRoleFilter(v);
              setPage(1);
            },
            options: [{ value: '', label: 'All' }, ...STAFF_ROLES],
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { value: '', label: 'All' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
        sortOptions={[
          { value: 'createdAt', label: 'Created' },
          { value: 'name', label: 'Name' },
          { value: 'email', label: 'Email' },
          { value: 'staffRole', label: 'Role' },
        ]}
        sort={sort}
        order={order}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        onOrderChange={(v) => {
          setOrder(v);
          setPage(1);
        }}
        extra={
          <ColumnSelector
            pageKey="users"
            columns={[...USER_COLUMNS]}
            visibleColumns={visibleColumns.length ? visibleColumns : USER_COLUMNS.map((c) => c.key)}
            onVisibleChange={setVisibleColumns}
          />
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Add User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <PhotoUpload
                label="Profile photo"
                value={form.photo && String(form.photo).trim() ? form.photo : undefined}
                onChange={(dataUrl) => setForm((f) => ({ ...f, photo: dataUrl ?? '' }))}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Role *</label>
                <select
                  value={form.staffRole}
                  onChange={(e) => setForm((f) => ({ ...f, staffRole: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Position</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="e.g. Senior Manager"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Password (optional, default: Welcome123)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank for default"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-accent-500 hover:bg-accent-100 hover:text-accent-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {form.password && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                      className={`w-full rounded-lg border px-3 py-2 pr-10 ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-accent-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-accent-500 hover:bg-accent-100 hover:text-accent-700"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!!form.password && form.password !== form.confirmPassword)}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingId(null)}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <PhotoUpload
                label="Profile photo"
                value={form.photo && String(form.photo).trim() ? form.photo : undefined}
                onChange={(dataUrl) => setForm((f) => ({ ...f, photo: dataUrl ?? '' }))}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Role *</label>
                <select
                  value={form.staffRole}
                  onChange={(e) => setForm((f) => ({ ...f, staffRole: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Position</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="e.g. Senior Manager"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
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
                  entityLabel="users"
                  actions={[
                    {
                      id: 'activate',
                      label: 'Activate',
                      variant: 'success',
                      confirm: true,
                      confirmTitle: 'Activate selected users',
                      confirmMessage: 'The selected users will be able to access the admin portal again.',
                      onExecute: bulkActivate,
                    },
                    {
                      id: 'deactivate',
                      label: 'Deactivate',
                      variant: 'danger',
                      confirm: true,
                      confirmTitle: 'Deactivate selected users',
                      confirmMessage: 'The selected users will lose access to the admin portal.',
                      onExecute: bulkDeactivate,
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
                        aria-label="Select all users"
                      />
                    </th>
                    {col('photo') && <th className="px-4 py-2 text-left">Photo</th>}
                    {col('name') && <th className="px-4 py-2 text-left">Name</th>}
                    {col('email') && <th className="px-4 py-2 text-left">Email</th>}
                    {col('phone') && <th className="px-4 py-2 text-left">Phone</th>}
                    {col('role') && <th className="px-4 py-2 text-left">Role</th>}
                    {col('position') && <th className="px-4 py-2 text-left">Position</th>}
                    {col('department') && <th className="px-4 py-2 text-left">Department</th>}
                    {col('status') && <th className="px-4 py-2 text-left">Status</th>}
                    {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.staff.map((s) => (
                    <tr key={s._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                      <td className="w-10 px-2 py-2">
                        <BulkCheckbox
                          checked={bulk.isSelected(s._id)}
                          onChange={() => bulk.toggle(s._id)}
                          aria-label={`Select ${s.name ?? 'user'}`}
                        />
                      </td>
                      {col('photo') && (
                        <td className="px-4 py-2">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-200 text-accent-600">
                              {(s.name || '?')[0]}
                            </div>
                          )}
                        </td>
                      )}
                      {col('name') && <td className="px-4 py-2 font-medium">{s.name ?? '-'}</td>}
                      {col('email') && <td className="px-4 py-2">{s.email ?? '-'}</td>}
                      {col('phone') && <td className="px-4 py-2">{s.phone ?? '-'}</td>}
                      {col('role') && (
                        <td className="px-4 py-2">
                          <span className="rounded bg-accent-100 px-2 py-0.5 text-accent-800">{STAFF_ROLES.find((r) => r.value === s.staffRole)?.label ?? s.staffRole}</span>
                        </td>
                      )}
                      {col('position') && <td className="px-4 py-2">{s.position ?? '-'}</td>}
                      {col('department') && <td className="px-4 py-2">{s.department ?? '-'}</td>}
                      {col('status') && (
                        <td className="px-4 py-2">
                          <span className={s.isActive !== false ? 'text-green-600' : 'text-gray-500'}>{s.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </td>
                      )}
                      {col('actions') && (
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(s._id)}
                              className="text-accent-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActiveClick(s)}
                              className={s.isActive !== false ? 'text-amber-600 hover:underline' : 'text-green-600 hover:underline'}
                            >
                              {s.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {data.staff.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        No users yet. Add a user manually.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="mt-4 flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="py-2 text-sm">
                  Page {page} of {data.totalPages} (Total: {data.total})
                </span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </DataState>

      {confirmToggleStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && !toggling && setConfirmToggleStaff(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="toggle-confirm-title"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-accent-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="toggle-confirm-title" className="mb-2 text-lg font-semibold text-accent-800">
              {confirmToggleStaff.isActive !== false ? 'Deactivate user' : 'Activate user'}
            </h2>
            <p className="mb-4 text-sm text-accent-700">
              {confirmToggleStaff.isActive !== false ? (
                <>
                  <strong>{confirmToggleStaff.name || confirmToggleStaff.email}</strong> will lose access to the admin portal.
                </>
              ) : (
                <>
                  <strong>{confirmToggleStaff.name || confirmToggleStaff.email}</strong> will be able to access the admin portal again.
                </>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !toggling && setConfirmToggleStaff(null)}
                disabled={toggling}
                className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleActiveConfirm}
                disabled={toggling}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                  confirmToggleStaff.isActive !== false ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {toggling ? 'Processing...' : confirmToggleStaff.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
