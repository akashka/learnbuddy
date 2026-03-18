import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { useTablePreferences } from '@/hooks/useTablePreferences';

const PARENT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'children', label: 'Children' },
  { key: 'actions', label: 'Actions' },
] as const;

type Parent = { _id: string; name?: string; phone?: string; childrenCount?: number; userId?: { email?: string } };

export default function Parents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ parents: Parent[]; total: number; page: number; totalPages: number } | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useTablePreferences('parents', PARENT_COLUMNS.map((c) => c.key));

  useEffect(() => {
    setLoading(true);
    adminApi.parents.list({ search: search || undefined, sort, order, page, limit: 20 })
      .then((d) => setData(d as { parents: Parent[]; total: number; page: number; totalPages: number }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [search, sort, order, page]);

  const col = (key: string) => visibleColumns.includes(key);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Parents</h1>
      <FilterBar
        searchPlaceholder="Search name, phone, email..."
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sortOptions={[
          { value: 'createdAt', label: 'Created' },
          { value: 'name', label: 'Name' },
          { value: 'childrenCount', label: 'Children' },
        ]}
        sort={sort}
        order={order}
        onSortChange={(v) => { setSort(v); setPage(1); }}
        onOrderChange={(v) => { setOrder(v); setPage(1); }}
        extra={
          <div className="flex gap-2">
            <ExportButton
              entity="parents"
              fields={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'location', label: 'Location' },
                { key: 'childrenCount', label: 'Children' },
                { key: 'createdAt', label: 'Created' },
              ]}
              params={search ? { search } : {}}
            />
            <ColumnSelector
              pageKey="parents"
              columns={[...PARENT_COLUMNS]}
              visibleColumns={visibleColumns.length ? visibleColumns : PARENT_COLUMNS.map((c) => c.key)}
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
                    {col('email') && <th className="px-4 py-2 text-left">Email</th>}
                    {col('phone') && <th className="px-4 py-2 text-left">Phone</th>}
                    {col('children') && <th className="px-4 py-2 text-left">Children</th>}
                    {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.parents.map((p) => (
                    <tr key={p._id} className="border-t border-accent-100">
                      {col('name') && <td className="px-4 py-2">{p.name ?? '-'}</td>}
                      {col('email') && <td className="px-4 py-2">{(p.userId as { email?: string })?.email ?? '-'}</td>}
                      {col('phone') && <td className="px-4 py-2">{p.phone ?? '-'}</td>}
                      {col('children') && <td className="px-4 py-2">{p.childrenCount ?? 0}</td>}
                      {col('actions') && (
                        <td className="px-4 py-2">
                          <Link to={`/parents/${p._id}`} className="text-accent-600 hover:underline">
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
