import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';
import { DataState } from '@/components/DataState';
import { ColumnSelector } from '@/components/ColumnSelector';
import { ExportButton } from '@/components/ExportButton';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { useToast } from '@/contexts/ToastContext';

const MASTER_COLUMNS = [
  { key: 'value', label: 'Value' },
  { key: 'label', label: 'Label' },
  { key: 'active', label: 'Active' },
] as const;

const MAPPING_COLUMNS = [
  { key: 'board', label: 'Board' },
  { key: 'class', label: 'Class' },
  { key: 'subject', label: 'Subject' },
] as const;

const TOPIC_COLUMNS = [
  { key: 'board', label: 'Board' },
  { key: 'class', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'topic', label: 'Topic' },
  { key: 'displayOrder', label: 'Order' },
  { key: 'active', label: 'Active' },
] as const;

type Master = { _id: string; type: string; value: string; label?: string; isActive?: boolean };
type Mapping = { board?: string; classLevel?: string; subjects?: string[] };
type MappingRow = { board: string; classLevel: string; subject: string };
type TopicItem = { _id: string; board: string; classLevel: string; subject: string; topic: string; displayOrder: number; isActive: boolean };

export default function Masters() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ boards: Master[]; classes: Master[]; subjects: Master[]; mappings: Mapping[] } | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'boards' | 'classes' | 'subjects' | 'mappings' | 'topics'>('boards');
  const [visibleColumnsMaster, setVisibleColumnsMaster] = useTablePreferences('masters', MASTER_COLUMNS.map((c) => c.key));
  const [visibleColumnsMapping, setVisibleColumnsMapping] = useTablePreferences('masters_mappings', MAPPING_COLUMNS.map((c) => c.key));
  const [visibleColumnsTopic, setVisibleColumnsTopic] = useTablePreferences('masters_topics', TOPIC_COLUMNS.map((c) => c.key));

  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<TopicItem | null>(null);
  const [deleteTopic, setDeleteTopic] = useState<TopicItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTopics = useCallback(() => {
    setTopicsLoading(true);
    adminApi.topics.list({ includeInactive: true })
      .then((d) => setTopics(d.topics))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to fetch topics'))
      .finally(() => setTopicsLoading(false));
  }, [toast]);

  const fetchMasters = useCallback(() => {
    adminApi.masters()
      .then((d) => setData(d as { boards: Master[]; classes: Master[]; subjects: Master[]; mappings: Mapping[] }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    if (activeTab === 'topics') fetchTopics();
  }, [activeTab, fetchTopics]);

  const searchLower = search.trim().toLowerCase();
  const filterMaster = (m: Master) => !searchLower || (m.value ?? '').toLowerCase().includes(searchLower) || (m.label ?? m.value ?? '').toLowerCase().includes(searchLower);
  const filterMappingRow = (r: MappingRow) => !searchLower || (r.board ?? '').toLowerCase().includes(searchLower) || (r.classLevel ?? '').toLowerCase().includes(searchLower) || (r.subject ?? '').toLowerCase().includes(searchLower);
  const filterTopicItem = (t: TopicItem) => !searchLower || (t.board ?? '').toLowerCase().includes(searchLower) || (t.classLevel ?? '').toLowerCase().includes(searchLower) || (t.subject ?? '').toLowerCase().includes(searchLower) || (t.topic ?? '').toLowerCase().includes(searchLower);

  const mappingRows = useMemo((): MappingRow[] => {
    const mappings = (data?.mappings ?? []) as Mapping[];
    return mappings.flatMap((m) =>
      (m.subjects ?? []).map((subject) => ({
        board: m.board ?? '-',
        classLevel: m.classLevel ?? '-',
        subject,
      }))
    );
  }, [data?.mappings]);

  const filteredBoards = useMemo(() => (data?.boards ?? []).filter(filterMaster), [data?.boards, searchLower]);
  const filteredClasses = useMemo(() => (data?.classes ?? []).filter(filterMaster), [data?.classes, searchLower]);
  const filteredSubjects = useMemo(() => (data?.subjects ?? []).filter(filterMaster), [data?.subjects, searchLower]);
  const filteredMappings = useMemo(() => mappingRows.filter(filterMappingRow), [mappingRows, searchLower]);
  const filteredTopics = useMemo(() => topics.filter(filterTopicItem), [topics, searchLower]);

  const colM = (key: string) => visibleColumnsMaster.includes(key) || visibleColumnsMaster.length === 0;
  const colMap = (key: string) => visibleColumnsMapping.includes(key) || visibleColumnsMapping.length === 0;
  const colT = (key: string) => visibleColumnsTopic.includes(key) || visibleColumnsTopic.length === 0;

  const tabs = [
    { id: 'boards' as const, label: 'Boards', count: filteredBoards.length },
    { id: 'classes' as const, label: 'Classes', count: filteredClasses.length },
    { id: 'subjects' as const, label: 'Subjects', count: filteredSubjects.length },
    { id: 'topics' as const, label: 'Topics', count: filteredTopics.length },
    { id: 'mappings' as const, label: 'Mappings', count: filteredMappings.length },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-accent-800">Masters</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 sm:w-48"
            />
          </div>
          <ExportButton
            entity="masters"
            fields={[{ key: 'all', label: 'All data' }]}
            params={{ type: 'all' }}
            label="Download"
          />
          {activeTab === 'topics' ? (
            <>
              <button
                type="button"
                onClick={() => setAddTopicOpen(true)}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700"
              >
                Add topic
              </button>
              <ColumnSelector pageKey="masters_topics" columns={[...TOPIC_COLUMNS]} visibleColumns={visibleColumnsTopic.length ? visibleColumnsTopic : TOPIC_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsTopic} />
            </>
          ) : activeTab === 'mappings' ? (
            <ColumnSelector pageKey="masters_mappings" columns={[...MAPPING_COLUMNS]} visibleColumns={visibleColumnsMapping.length ? visibleColumnsMapping : MAPPING_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsMapping} />
          ) : (
            <ColumnSelector pageKey="masters" columns={[...MASTER_COLUMNS]} visibleColumns={visibleColumnsMaster.length ? visibleColumnsMaster : MASTER_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsMaster} />
          )}
        </div>
      </div>

      <div className="mb-4 border-b border-accent-200">
        <nav className="-mb-px flex gap-1" aria-label="Masters tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-accent-600 hover:border-accent-300 hover:text-accent-700'
              }`}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? 'bg-accent-100 text-accent-700' : 'bg-accent-100/70 text-accent-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <DataState loading={loading} error={error}>
        {data && (
          <div className="rounded-lg border border-accent-200 bg-white">
            {activeTab === 'boards' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      {colM('value') && <th className="px-4 py-3 text-left font-medium text-accent-700">Value</th>}
                      {colM('label') && <th className="px-4 py-3 text-left font-medium text-accent-700">Label</th>}
                      {colM('active') && <th className="px-4 py-3 text-left font-medium text-accent-700">Active</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBoards.map((b) => (
                      <tr key={b._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                        {colM('value') && <td className="px-4 py-3">{b.value}</td>}
                        {colM('label') && <td className="px-4 py-3">{b.label ?? b.value}</td>}
                        {colM('active') && <td className="px-4 py-3">{b.isActive ? 'Yes' : 'No'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'classes' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      {colM('value') && <th className="px-4 py-3 text-left font-medium text-accent-700">Value</th>}
                      {colM('label') && <th className="px-4 py-3 text-left font-medium text-accent-700">Label</th>}
                      {colM('active') && <th className="px-4 py-3 text-left font-medium text-accent-700">Active</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((c) => (
                      <tr key={c._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                        {colM('value') && <td className="px-4 py-3">{c.value}</td>}
                        {colM('label') && <td className="px-4 py-3">{c.label ?? c.value}</td>}
                        {colM('active') && <td className="px-4 py-3">{c.isActive ? 'Yes' : 'No'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'subjects' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      {colM('value') && <th className="px-4 py-3 text-left font-medium text-accent-700">Value</th>}
                      {colM('label') && <th className="px-4 py-3 text-left font-medium text-accent-700">Label</th>}
                      {colM('active') && <th className="px-4 py-3 text-left font-medium text-accent-700">Active</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((s) => (
                      <tr key={s._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                        {colM('value') && <td className="px-4 py-3">{s.value}</td>}
                        {colM('label') && <td className="px-4 py-3">{s.label ?? s.value}</td>}
                        {colM('active') && <td className="px-4 py-3">{s.isActive ? 'Yes' : 'No'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'topics' && (
              <div className="overflow-x-auto">
                {topicsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
                    <p className="mt-4 text-sm text-accent-600">Loading topics...</p>
                  </div>
                ) : filteredTopics.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        {colT('board') && <th className="px-4 py-3 text-left font-medium text-accent-700">Board</th>}
                        {colT('class') && <th className="px-4 py-3 text-left font-medium text-accent-700">Class</th>}
                        {colT('subject') && <th className="px-4 py-3 text-left font-medium text-accent-700">Subject</th>}
                        {colT('topic') && <th className="px-4 py-3 text-left font-medium text-accent-700">Topic</th>}
                        {colT('displayOrder') && <th className="px-4 py-3 text-left font-medium text-accent-700">Order</th>}
                        {colT('active') && <th className="px-4 py-3 text-left font-medium text-accent-700">Active</th>}
                        <th className="px-4 py-3 text-right font-medium text-accent-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTopics.map((t) => (
                        <tr key={t._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                          {colT('board') && <td className="px-4 py-3">{t.board}</td>}
                          {colT('class') && <td className="px-4 py-3">{t.classLevel}</td>}
                          {colT('subject') && <td className="px-4 py-3">{t.subject}</td>}
                          {colT('topic') && <td className="px-4 py-3">{t.topic}</td>}
                          {colT('displayOrder') && <td className="px-4 py-3">{t.displayOrder}</td>}
                          {colT('active') && <td className="px-4 py-3">{t.isActive ? 'Yes' : 'No'}</td>}
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setEditTopic(t)}
                              className="mr-2 text-accent-600 hover:text-accent-800 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTopic(t)}
                              className="text-red-600 hover:text-red-800 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-12 text-center text-accent-600">No topics found. Add one to get started.</div>
                )}
              </div>
            )}
            {activeTab === 'mappings' && (
              <div className="overflow-x-auto">
                {filteredMappings.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        {colMap('board') && <th className="px-4 py-3 text-left font-medium text-accent-700">Board</th>}
                        {colMap('class') && <th className="px-4 py-3 text-left font-medium text-accent-700">Class</th>}
                        {colMap('subject') && <th className="px-4 py-3 text-left font-medium text-accent-700">Subject</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMappings.map((m, i) => (
                        <tr key={`${m.board}-${m.classLevel}-${m.subject}-${i}`} className="border-t border-accent-100 hover:bg-accent-50/50">
                          {colMap('board') && <td className="px-4 py-3">{m.board}</td>}
                          {colMap('class') && <td className="px-4 py-3">{m.classLevel}</td>}
                          {colMap('subject') && <td className="px-4 py-3">{m.subject}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-12 text-center text-accent-600">No mappings found</div>
                )}
              </div>
            )}
          </div>
        )}
      </DataState>

      {addTopicOpen && (
        <TopicAddModal
          boards={data?.boards ?? []}
          classes={data?.classes ?? []}
          subjects={data?.subjects ?? []}
          saving={saving}
          onClose={() => setAddTopicOpen(false)}
          onSave={async (form) => {
            setSaving(true);
            try {
              await adminApi.topics.create(form);
              toast.success('Topic added');
              setAddTopicOpen(false);
              fetchTopics();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Failed to add topic');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {editTopic && (
        <TopicEditModal
          topic={editTopic}
          saving={saving}
          onClose={() => setEditTopic(null)}
          onSave={async (form) => {
            setSaving(true);
            try {
              await adminApi.topics.update(editTopic._id, form);
              toast.success('Topic updated');
              setEditTopic(null);
              fetchTopics();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Failed to update topic');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {deleteTopic && (
        <TopicDeleteModal
          topic={deleteTopic}
          saving={saving}
          onClose={() => setDeleteTopic(null)}
          onConfirm={async () => {
            setSaving(true);
            try {
              await adminApi.topics.delete(deleteTopic._id);
              toast.success('Topic deleted');
              setDeleteTopic(null);
              fetchTopics();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Failed to delete topic');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

function TopicAddModal({
  boards,
  classes,
  subjects,
  saving,
  onClose,
  onSave,
}: {
  boards: Master[];
  classes: Master[];
  subjects: Master[];
  saving: boolean;
  onClose: () => void;
  onSave: (form: { board: string; classLevel: string; subject: string; topic: string; displayOrder?: number }) => void;
}) {
  const [board, setBoard] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [displayOrder, setDisplayOrder] = useState(999);

  const boardOptions = boards.filter((b) => b.isActive !== false).map((b) => b.value);
  const classOptions = classes.filter((c) => c.isActive !== false).map((c) => c.value);
  const subjectOptions = subjects.filter((s) => s.isActive !== false).map((s) => s.value);
  useAutoSelectSingleOption(board, setBoard, boardOptions);
  useAutoSelectSingleOption(classLevel, setClassLevel, classOptions);
  useAutoSelectSingleOption(subject, setSubject, subjectOptions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !classLevel || !subject || !topic.trim()) return;
    onSave({ board, classLevel, subject, topic: topic.trim(), displayOrder });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-accent-800">Add Topic</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Board</label>
            <select value={board} onChange={(e) => setBoard(e.target.value)} required className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400">
              <option value="">Select board</option>
              {boards.filter((b) => b.isActive !== false).map((b) => (
                <option key={b._id} value={b.value}>{b.label ?? b.value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Class</label>
            <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} required className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400">
              <option value="">Select class</option>
              {classes.filter((c) => c.isActive !== false).map((c) => (
                <option key={c._id} value={c.value}>{c.label ?? c.value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400">
              <option value="">Select subject</option>
              {subjects.filter((s) => s.isActive !== false).map((s) => (
                <option key={s._id} value={s.value}>{s.label ?? s.value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder="e.g. Algebra" className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Display Order</label>
            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)} min={0} className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TopicEditModal({
  topic,
  saving,
  onClose,
  onSave,
}: {
  topic: TopicItem;
  saving: boolean;
  onClose: () => void;
  onSave: (form: { topic?: string; displayOrder?: number; isActive?: boolean }) => void;
}) {
  const [topicName, setTopicName] = useState(topic.topic);
  const [displayOrder, setDisplayOrder] = useState(topic.displayOrder);
  const [isActive, setIsActive] = useState(topic.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    onSave({ topic: topicName.trim(), displayOrder, isActive });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-accent-800">Edit Topic</h2>
        <p className="mb-4 text-sm text-accent-600">{topic.board} • {topic.classLevel} • {topic.subject}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Topic</label>
            <input type="text" value={topicName} onChange={(e) => setTopicName(e.target.value)} required className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Display Order</label>
            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)} min={0} className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-accent-300" />
            <label htmlFor="isActive" className="text-sm font-medium text-accent-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TopicDeleteModal({
  topic,
  saving,
  onClose,
  onConfirm,
}: {
  topic: TopicItem;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold text-accent-800">Delete Topic</h2>
        <p className="mb-4 text-sm text-accent-600">
          Are you sure you want to delete &quot;{topic.topic}&quot; ({topic.board} • {topic.classLevel} • {topic.subject})?
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {saving ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
