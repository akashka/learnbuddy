import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import { useTablePreferences } from '@/hooks/useTablePreferences';

const AI_DATA_COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'board', label: 'Board' },
  { key: 'class', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'topic', label: 'Topic' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: 'Actions' },
] as const;

type AiItem = { _id: string; type?: string; board?: string; classLevel?: string; subject?: string; topic?: string; createdAt?: string };

export default function AiData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ items: AiItem[]; total: number; page: number; totalPages: number } | null>(null);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const typeFilter = searchParams.get('type') ?? '';
  const boardFilter = searchParams.get('board') ?? '';
  const classFilter = searchParams.get('class') ?? '';
  const subjectFilter = searchParams.get('subject') ?? '';
  const updateParams = (updates: Record<string, string | number>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === 0) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };
  const [visibleColumns, setVisibleColumns] = useTablePreferences('ai_data', AI_DATA_COLUMNS.map((c) => c.key));

  useEffect(() => {
    setLoading(true);
    adminApi.aiData.list({
      page,
      limit: 20,
      type: typeFilter || undefined,
      board: boardFilter || undefined,
      class: classFilter || undefined,
      subject: subjectFilter || undefined,
    })
      .then((d) => setData({ ...d, items: d.items as AiItem[] }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [page, typeFilter, boardFilter, classFilter, subjectFilter]);

  const col = (key: string) => visibleColumns.includes(key) || visibleColumns.length === 0;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">AI Data</h1>
      <FilterBar
        filters={[
          { key: 'type', label: 'Type', value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); }, options: [
            { value: '', label: 'All' },
            { value: 'study_material', label: 'Study Material' },
            { value: 'exam_questions', label: 'Exam Questions' },
            { value: 'doubt_answer', label: 'Doubt Answer' },
          ]},
          { key: 'board', label: 'Board', value: boardFilter, onChange: (v) => { updateParams({ board: v, page: 1 }); }, options: [
            { value: '', label: 'All' },
            { value: 'CBSE', label: 'CBSE' },
            { value: 'ICSE', label: 'ICSE' },
            { value: 'State', label: 'State' },
          ]},
          { key: 'class', label: 'Class', value: classFilter, onChange: (v) => { setClassFilter(v); setPage(1); }, options: [
            { value: '', label: 'All' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            { value: '7', label: '7' },
            { value: '8', label: '8' },
            { value: '9', label: '9' },
            { value: '10', label: '10' },
          ]},
          { key: 'subject', label: 'Subject', value: subjectFilter, onChange: (v) => { updateParams({ subject: v, page: 1 }); }, options: [
            { value: '', label: 'All' },
            { value: 'Mathematics', label: 'Mathematics' },
            { value: 'Science', label: 'Science' },
            { value: 'English', label: 'English' },
          ]},
        ]}
        extra={
          <ColumnSelector pageKey="ai_data" columns={[...AI_DATA_COLUMNS]} visibleColumns={visibleColumns.length ? visibleColumns : AI_DATA_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumns} />
        }
      />
      <DataState loading={loading} error={error}>
        {data && (
          <>
            <p className="mb-4 text-sm text-accent-700">Total: {data.total} resources</p>
            <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-accent-50">
                  <tr>
                    {col('type') && <th className="px-4 py-2 text-left">Type</th>}
                    {col('board') && <th className="px-4 py-2 text-left">Board</th>}
                    {col('class') && <th className="px-4 py-2 text-left">Class</th>}
                    {col('subject') && <th className="px-4 py-2 text-left">Subject</th>}
                    {col('topic') && <th className="px-4 py-2 text-left">Topic</th>}
                    {col('created') && <th className="px-4 py-2 text-left">Created</th>}
                    {col('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                      {col('type') && <td className="px-4 py-2">{item.type ?? '-'}</td>}
                      {col('board') && <td className="px-4 py-2">{item.board ?? '-'}</td>}
                      {col('class') && <td className="px-4 py-2">{item.classLevel ?? '-'}</td>}
                      {col('subject') && <td className="px-4 py-2">{item.subject ?? '-'}</td>}
                      {col('topic') && <td className="px-4 py-2">{item.topic ?? (item as { topics?: string[] }).topics?.join(', ') ?? '-'}</td>}
                      {col('created') && <td className="px-4 py-2">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>}
                      {col('actions') && (
                        <td className="px-4 py-2">
                          <Link
                            to={`/ai-data/${item._id}`}
                            state={{ from: location.pathname + location.search }}
                            className="text-accent-600 hover:underline"
                          >
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
                  onClick={() => updateParams({ page: page - 1 })}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="py-2 text-sm">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => updateParams({ page: page + 1 })}
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
