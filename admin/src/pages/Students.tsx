import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { useTablePreferences } from '@/hooks/useTablePreferences';

const STUDENT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'email', label: 'Email' },
  { key: 'board', label: 'Board' },
  { key: 'class', label: 'Class' },
  { key: 'parent', label: 'Parent' },
  { key: 'actions', label: 'Actions' },
] as const;

type Student = { _id: string; name?: string; studentId?: string; board?: string; classLevel?: string; parentId?: { name?: string }; userId?: { email?: string } };

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ students: Student[]; total: number; page: number; totalPages: number } | null>(null);
  const [search, setSearch] = useState('');
  const [board, setBoard] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useTablePreferences('students', STUDENT_COLUMNS.map((c) => c.key));

  useEffect(() => {
    setLoading(true);
    adminApi.students.list({ search: search || undefined, board: board || undefined, sort, order, page, limit: 20 })
      .then((d) => setData(d as { students: Student[]; total: number; page: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [search, board, sort, order, page]);

  const col = (key: string) => visibleColumns.includes(key);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Students</h1>
      <FilterBar
        searchPlaceholder="Search name, student ID, parent..."
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        filters={[
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
          { value: 'studentId', label: 'Student ID' },
          { value: 'board', label: 'Board' },
          { value: 'classLevel', label: 'Class' },
        ]}
        sort={sort}
        order={order}
        onSortChange={(v) => { setSort(v); setPage(1); }}
        onOrderChange={(v) => { setOrder(v); setPage(1); }}
        extra={
          <div className="flex gap-2">
            <ExportButton
              entity="students"
              fields={[
                { key: 'name', label: 'Name' },
                { key: 'studentId', label: 'Student ID' },
                { key: 'email', label: 'Email' },
                { key: 'parentName', label: 'Parent' },
                { key: 'board', label: 'Board' },
                { key: 'classLevel', label: 'Class' },
                { key: 'schoolName', label: 'School' },
                { key: 'createdAt', label: 'Created' },
              ]}
              params={{
                ...(search && { search }),
                ...(board && { board }),
              }}
            />
            <ColumnSelector
              pageKey="students"
              columns={[...STUDENT_COLUMNS]}
              visibleColumns={visibleColumns.length ? visibleColumns : STUDENT_COLUMNS.map((c) => c.key)}
              onVisibleChange={setVisibleColumns}
            />
          </div>
        }
      />
      <DataState loading={loading} error={error}>
        {data && (
          <>
            <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-accent-50">
                  <tr>
                    {col('name') && <th className="px-4 py-2 text-left">Name</th>}
                    {col('studentId') && <th className="px-4 py-2 text-left">Student ID</th>}
                    {col('email') && <th className="px-4 py-2 text-left">Email</th>}
                    {col('board') && <th className="px-4 py-2 text-left">Board</th>}
                    {col('class') && <th className="px-4 py-2 text-left">Class</th>}
                    {col('parent') && <th className="px-4 py-2 text-left">Parent</th>}
                    {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s._id} className="border-t border-accent-100">
                      {col('name') && <td className="px-4 py-2">{s.name ?? '-'}</td>}
                      {col('studentId') && <td className="px-4 py-2">{s.studentId ?? '-'}</td>}
                      {col('email') && <td className="px-4 py-2">{(s.userId as { email?: string })?.email ?? '-'}</td>}
                      {col('board') && <td className="px-4 py-2">{s.board ?? '-'}</td>}
                      {col('class') && <td className="px-4 py-2">{s.classLevel ?? '-'}</td>}
                      {col('parent') && (
                        <td className="px-4 py-2">
                          {(s.parentId as { _id?: string })?._id ? (
                            <Link to={`/parents/${(s.parentId as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                              {(s.parentId as { name?: string })?.name ?? '-'}
                            </Link>
                          ) : (
                            (s.parentId as { name?: string })?.name ?? '-'
                          )}
                        </td>
                      )}
                      {col('actions') && (
                        <td className="px-4 py-2">
                          <Link to={`/students/${s._id}`} className="text-accent-600 hover:underline">
                            View
                          </Link>
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
