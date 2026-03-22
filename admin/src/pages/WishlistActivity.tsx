import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';

type WishlistActivityItem = {
  _id: string;
  parentId: string;
  teacherId: string;
  action: 'add' | 'remove';
  createdAt: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  teacherName?: string;
  teacherPhone?: string;
};

const ACTION_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'add', label: 'Added' },
  { value: 'remove', label: 'Removed' },
];

export default function WishlistActivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    items: WishlistActivityItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const actionFilter = searchParams.get('action') ?? '';
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

  const fetchActivity = useCallback(() => {
    setLoading(true);
    adminApi.wishlistActivity
      .list({
        action: actionFilter || undefined,
        from: fromFilter || undefined,
        to: toFilter || undefined,
        sort: 'createdAt',
        order: 'desc',
        page,
        limit: 50,
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [actionFilter, fromFilter, toFilter, page]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-accent-800">Wishlist Updates</h1>
        <p className="mt-1 text-sm text-accent-700">
          Recent wishlist additions and removals. Use this to follow up with parents or track teacher interest.
        </p>
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
          </div>
        }
      />

      <DataState loading={loading} error={error}>
        {data && (
          <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-accent-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Parent</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-accent-700">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          item.action === 'add' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.action === 'add' ? 'Added' : 'Removed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/parents/${item.parentId}`}
                        className="text-accent-600 hover:underline"
                      >
                        {item.parentName || '-'}
                      </Link>
                      <div className="text-xs text-accent-500">
                        {item.parentEmail || item.parentPhone || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/teachers/${item.teacherId}`}
                        className="text-accent-600 hover:underline"
                      >
                        {item.teacherName || '-'}
                      </Link>
                      {item.teacherPhone && (
                        <div className="text-xs text-accent-500">{item.teacherPhone}</div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-accent-600">
                      No wishlist updates found.
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
