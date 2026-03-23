import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { BulkActionBar } from '@/components/BulkActionBar';
import { BulkCheckbox } from '@/components/BulkCheckbox';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { useBulkSelect } from '@/hooks/useBulkSelect';

const TEACHER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'gender', label: 'Gender' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'status', label: 'Status' },
  { key: 'bgv', label: 'BGV' },
  { key: 'board', label: 'Board' },
  { key: 'batches', label: 'Batches' },
  { key: 'students', label: 'Students' },
  { key: 'actions', label: 'Actions' },
] as const;

type Teacher = { _id: string; name?: string; phone?: string; gender?: string; dateOfBirth?: string | Date; status?: string; board?: string; batchCount?: number; totalStudents?: number; userId?: { email?: string }; bgvVerified?: boolean };

function BGVCell({ teacher, onApproved }: { teacher: Teacher; onApproved: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (teacher.bgvVerified) {
    return (
      <span
        className="inline-flex items-center text-blue-600"
        title="Background verification completed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.teachers.approveBgv(teacher._id);
      onApproved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleApprove}
        disabled={loading}
        className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Approve BGV'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export default function Teachers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ teachers: Teacher[]; total: number; page: number; totalPages: number } | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [board, setBoard] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useTablePreferences('teachers', TEACHER_COLUMNS.map((c) => c.key));
  const teachers = data?.teachers ?? [];
  const bulk = useBulkSelect(teachers, { selectable: (t) => !t.bgvVerified });

  useEffect(() => {
    setLoading(true);
    adminApi.teachers.list({
      search: search || undefined,
      status: status || undefined,
      board: board || undefined,
      sort,
      order,
      page,
      limit: 20,
    })
      .then((d) => setData(d as { teachers: Teacher[]; total: number; page: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [search, status, board, sort, order, page]);

  const col = (key: string) => visibleColumns.includes(key);

  const toast = useToast();
  const bulkApproveBgv = async (ids: string[]) => {
    const toApprove = ids.filter((id) => {
      const t = teachers.find((x) => x._id === id);
      return t && !t.bgvVerified;
    });
    try {
      for (const id of toApprove) {
        await adminApi.teachers.approveBgv(id);
      }
      toast.success(`${toApprove.length} BGV(s) approved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
      return;
    }
    setData((prev) =>
      prev
        ? {
            ...prev,
            teachers: prev.teachers.map((t) =>
              toApprove.includes(t._id) ? { ...t, bgvVerified: true } : t
            ),
          }
        : null
    );
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Teachers</h1>
      <FilterBar
        searchPlaceholder="Search name, phone, email..."
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        filters={[
          { key: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: [
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'qualified', label: 'Qualified' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'suspended', label: 'Suspended' },
          ]},
          { key: 'board', label: 'Board', value: board, onChange: (v) => { setBoard(v); setPage(1); }, options: [
            { value: '', label: 'All' },
            { value: 'CBSE', label: 'CBSE' },
            { value: 'ICSE', label: 'ICSE' },
            { value: 'State', label: 'State' },
          ]},
        ]}
        sortOptions={[
          { value: 'createdAt', label: 'Created' },
          { value: 'name', label: 'Name' },
          { value: 'status', label: 'Status' },
          { value: 'batchCount', label: 'Batches' },
          { value: 'totalStudents', label: 'Students' },
        ]}
        sort={sort}
        order={order}
        onSortChange={(v) => { setSort(v); setPage(1); }}
        onOrderChange={(v) => { setOrder(v); setPage(1); }}
        extra={
          <div className="flex gap-2">
            <ExportButton
              entity="teachers"
              fields={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'gender', label: 'Gender' },
                { key: 'dateOfBirth', label: 'Date of Birth' },
                { key: 'status', label: 'Status' },
                { key: 'board', label: 'Board' },
                { key: 'bgvVerified', label: 'BGV Verified' },
                { key: 'batchCount', label: 'Batches' },
                { key: 'totalStudents', label: 'Students' },
                { key: 'createdAt', label: 'Created' },
              ]}
              params={{
                ...(search && { search }),
                ...(status && { status }),
                ...(board && { board }),
              }}
            />
            <ColumnSelector
              pageKey="teachers"
              columns={[...TEACHER_COLUMNS]}
              visibleColumns={visibleColumns.length ? visibleColumns : TEACHER_COLUMNS.map((c) => c.key)}
              onVisibleChange={setVisibleColumns}
            />
          </div>
        }
      />
      <DataState loading={loading} error={error}>
        {data && (
          <>
            {bulk.someSelected && (
              <div className="mb-4">
                <BulkActionBar
                  selectedIds={bulk.selectedIds}
                  entityLabel="teachers"
                  actions={[
                    {
                      id: 'approve-bgv',
                      label: 'Approve BGV',
                      variant: 'success',
                      confirm: true,
                      confirmTitle: 'Approve BGV for selected teachers',
                      confirmMessage: 'Background verification will be marked as completed for the selected teachers.',
                      onExecute: bulkApproveBgv,
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
                        aria-label="Select all teachers"
                      />
                    </th>
                    {col('name') && <th className="px-4 py-2 text-left">Name</th>}
                    {col('email') && <th className="px-4 py-2 text-left">Email</th>}
                    {col('phone') && <th className="px-4 py-2 text-left">Phone</th>}
                    {col('gender') && <th className="px-4 py-2 text-left">Gender</th>}
                    {col('dateOfBirth') && <th className="px-4 py-2 text-left">Date of Birth</th>}
                    {col('status') && <th className="px-4 py-2 text-left">Status</th>}
                    {col('bgv') && <th className="px-4 py-2 text-left">BGV</th>}
                    {col('board') && <th className="px-4 py-2 text-left">Board</th>}
                    {col('batches') && <th className="px-4 py-2 text-left">Batches</th>}
                    {col('students') && <th className="px-4 py-2 text-left">Students</th>}
                    {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.teachers.map((t) => (
                    <tr key={t._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                      <td className="w-10 px-2 py-2">
                        <BulkCheckbox
                          checked={bulk.isSelected(t._id)}
                          onChange={() => bulk.toggle(t._id)}
                          disabled={!bulk.isSelectable(t._id)}
                          aria-label={`Select ${t.name ?? 'teacher'}`}
                        />
                      </td>
                      {col('name') && <td className="px-4 py-2">{t.name ?? '-'}</td>}
                      {col('email') && <td className="px-4 py-2">{(t.userId as { email?: string })?.email ?? '-'}</td>}
                      {col('phone') && <td className="px-4 py-2">{t.phone ?? '-'}</td>}
                      {col('gender') && <td className="px-4 py-2">{t.gender ?? '-'}</td>}
                      {col('dateOfBirth') && (
                        <td className="px-4 py-2">
                          {t.dateOfBirth
                            ? typeof t.dateOfBirth === 'string'
                              ? t.dateOfBirth.slice(0, 10)
                              : new Date(t.dateOfBirth).toISOString().slice(0, 10)
                            : '-'}
                        </td>
                      )}
                      {col('status') && <td className="px-4 py-2">{t.status ?? '-'}</td>}
                      {col('bgv') && (
                        <td className="px-4 py-2">
                          <BGVCell teacher={t} onApproved={() => {
                            setData((prev) => prev ? {
                              ...prev,
                              teachers: prev.teachers.map((x) =>
                                x._id === t._id ? { ...x, bgvVerified: true } : x
                              ),
                            } : null);
                          }} />
                        </td>
                      )}
                      {col('board') && <td className="px-4 py-2">{t.board ?? '-'}</td>}
                      {col('batches') && (
                        <td className="px-4 py-2">
                          <Link
                            to={`/teachers/${t._id}#batches`}
                            className={(t.batchCount ?? 0) > 0 ? 'text-accent-600 hover:underline' : 'text-accent-400'}
                          >
                            {t.batchCount ?? 0}
                          </Link>
                        </td>
                      )}
                      {col('students') && <td className="px-4 py-2">{t.totalStudents ?? 0}</td>}
                      {col('actions') && (
                        <td className="px-4 py-2">
                          <span className="flex gap-2">
                            <Link to={`/teachers/${t._id}`} className="text-accent-600 hover:underline">
                              View
                            </Link>
                            <Link to={`/teachers/${t._id}#batches`} className="text-accent-600 hover:underline">
                              Batches
                            </Link>
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
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
    </div>
  );
}
