import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import Tabs from '@/components/Tabs';
import { BulkActionBar } from '@/components/BulkActionBar';
import { BulkCheckbox } from '@/components/BulkCheckbox';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { useBulkSelect } from '@/hooks/useBulkSelect';

type Pending = {
  _id?: string;
  parentId?: { _id?: string; name?: string } | string;
  teacherId?: { _id?: string; name?: string; batches?: unknown[] } | string;
  subject?: string;
  batchIndex?: number;
  studentDetails?: { name?: string; classLevel?: string; schoolName?: string; board?: string };
  createdAt?: string;
};
type Completed = { _id?: string; studentId?: { _id?: string; name?: string }; teacherId?: { _id?: string; name?: string }; subject?: string; createdAt?: string };

const PENDING_COLUMNS = [
  { key: 'parent', label: 'Parent' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'subject', label: 'Subject' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: 'Actions' },
] as const;

const COMPLETED_COLUMNS = [
  { key: 'student', label: 'Student' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'subject', label: 'Subject' },
  { key: 'created', label: 'Created' },
] as const;

function getId(ref: { _id?: string } | string | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return ref;
  return ref._id;
}

export default function Enrollments() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ pendings: Pending[]; completed: Completed[] } | null>(null);
  const search = searchParams.get('search') ?? '';
  const activeTab = (searchParams.get('section') as 'pending' | 'completed') || 'pending';
  const sort = searchParams.get('sort') ?? 'createdAt';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  const updateParams = (updates: { search?: string; section?: string; sort?: string; order?: string }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '' || (k === 'section' && v === 'pending')) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };
  const [visibleColumnsPending, setVisibleColumnsPending] = useTablePreferences('enrollments_pending', PENDING_COLUMNS.map((c) => c.key));
  const [visibleColumnsCompleted, setVisibleColumnsCompleted] = useTablePreferences('enrollments_completed', COMPLETED_COLUMNS.map((c) => c.key));

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showMapBatch, setShowMapBatch] = useState(false);
  const [paymentLinkModal, setPaymentLinkModal] = useState<{ pendingId: string; link: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [parents, setParents] = useState<{ _id: string; name?: string }[]>([]);
  const [teachers, setTeachers] = useState<{ _id: string; name?: string; batches?: unknown[] }[]>([]);

  const [addStudentForm, setAddStudentForm] = useState({
    parentId: '',
    name: '',
    classLevel: '',
    schoolName: '',
    board: 'CBSE',
  });
  const [mapForm, setMapForm] = useState({
    parentId: '',
    teacherId: '',
    batchIndex: 0,
    studentId: '',
    duration: '3months' as '3months' | '6months' | '12months',
  });
  const [parentChildren, setParentChildren] = useState<{ _id: string; name?: string; studentId?: string }[]>([]);
  const [teacherBatches, setTeacherBatches] = useState<{ batchIndex: number; name: string; subject: string; feePerMonth?: number }[]>([]);

  const fetchData = () => {
    setLoading(true);
    adminApi.enrollments.list()
      .then((d) => setData(d as { pendings: Pending[]; completed: Completed[] }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    adminApi.parents.list({ limit: 500 }).then((r) => setParents((r as { parents: { _id: string; name?: string }[] }).parents));
    adminApi.teachers.list({ limit: 500 }).then((r) => setTeachers((r as { teachers: { _id: string; name?: string; batches?: unknown[] }[] }).teachers));
  }, []);

  useEffect(() => {
    if (!mapForm.parentId) {
      setParentChildren([]);
      setMapForm((f) => ({ ...f, studentId: '' }));
      return;
    }
    adminApi.parents.get(mapForm.parentId).then((p) => {
      const children = ((p as { children?: { _id: string; name?: string; studentId?: string }[] }).children ?? []).map((c) => ({
        _id: c._id,
        name: c.name,
        studentId: (c as { studentId?: string }).studentId,
      }));
      setParentChildren(children);
      setMapForm((f) => ({ ...f, studentId: children[0]?._id ?? '' }));
    }).catch(() => setParentChildren([]));
  }, [mapForm.parentId]);

  useEffect(() => {
    if (!mapForm.teacherId) {
      setTeacherBatches([]);
      setMapForm((f) => ({ ...f, batchIndex: 0 }));
      return;
    }
    adminApi.teachers.get(mapForm.teacherId).then((t) => {
      const batches = ((t as { batchesWithEnrollments?: { batchIndex: number; name: string; subject: string; feePerMonth?: number }[] }).batchesWithEnrollments ?? []);
      setTeacherBatches(batches);
      setMapForm((f) => ({ ...f, batchIndex: batches[0]?.batchIndex ?? 0 }));
    }).catch(() => setTeacherBatches([]));
  }, [mapForm.teacherId]);

  const filterRow = (row: Pending | Completed, searchLower: string) => {
    if (!searchLower) return true;
    const parent = (row as Pending).parentId as { name?: string } | undefined;
    const teacher = (row as Pending).teacherId as { name?: string } | undefined;
    const student = (row as Completed).studentId as { name?: string } | undefined;
    const subject = (row as Pending).subject ?? '';
    return (
      (parent?.name ?? '').toLowerCase().includes(searchLower) ||
      (teacher?.name ?? '').toLowerCase().includes(searchLower) ||
      (student?.name ?? '').toLowerCase().includes(searchLower) ||
      subject.toLowerCase().includes(searchLower)
    );
  };

  const sortRows = <T extends Pending | Completed>(rows: T[]) => {
    return [...rows].sort((a, b) => {
      const aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const searchLower = search.trim().toLowerCase();
  const filteredPending = useMemo(() => sortRows(data?.pendings.filter((p) => filterRow(p, searchLower)) ?? []), [data?.pendings, searchLower, order]);
  const filteredCompleted = useMemo(() => sortRows(data?.completed.filter((c) => filterRow(c, searchLower)) ?? []), [data?.completed, searchLower, order]);

  const colP = (key: string) => visibleColumnsPending.includes(key) || visibleColumnsPending.length === 0;
  const colC = (key: string) => visibleColumnsCompleted.includes(key) || visibleColumnsCompleted.length === 0;

  const pendingWithIds = filteredPending.filter((p): p is Pending & { _id: string } => !!(p as { _id?: string })._id);
  const bulkPending = useBulkSelect(pendingWithIds);

  const bulkComplete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await adminApi.enrollmentsManage({ action: 'complete_from_pending', pendingId: id });
      }
      toast.success(`${ids.length} enrollment(s) completed`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete enrollments');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionLoading('add_student');
    try {
      await adminApi.enrollmentsManage({
        action: 'add_student',
        parentId: addStudentForm.parentId,
        studentDetails: {
          name: addStudentForm.name,
          classLevel: addStudentForm.classLevel,
          schoolName: addStudentForm.schoolName || undefined,
          board: addStudentForm.board,
        },
      });
      setShowAddStudent(false);
      setAddStudentForm({ parentId: '', name: '', classLevel: '', schoolName: '', board: 'CBSE' });
      toast.success('Student added successfully');
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMapBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionLoading('map_batch');
    try {
      await adminApi.enrollmentsManage({
        action: 'map_teacher_batch',
        parentId: mapForm.parentId,
        teacherId: mapForm.teacherId,
        batchIndex: mapForm.batchIndex,
        studentId: mapForm.studentId,
        duration: mapForm.duration,
      });
      setShowMapBatch(false);
      setMapForm({ parentId: '', teacherId: '', batchIndex: 0, studentId: '', duration: '3months' });
      fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateLink = async (pendingId: string) => {
    setActionError(null);
    setActionLoading(pendingId);
    try {
      const res = await adminApi.enrollmentsManage({ action: 'generate_payment_link', pendingId }) as { paymentLink: string };
      setPaymentLinkModal({ pendingId, link: res.paymentLink });
      toast.success('Payment link generated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (pendingId: string) => {
    if (!confirm('Complete this pending enrollment? This will create the student (if needed) and enrollment.')) return;
    setActionError(null);
    setActionLoading(pendingId);
    try {
      await adminApi.enrollmentsManage({ action: 'complete_from_pending', pendingId });
      setPaymentLinkModal(null);
      fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Enrollments</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setShowAddStudent(true); setActionError(null); }}
          className="rounded-lg border border-accent-200 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
        >
          Add student to parent
        </button>
        <button
          type="button"
          onClick={() => { setShowMapBatch(true); setActionError(null); }}
          className="rounded-lg border border-accent-200 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
        >
          Map teacher batch to student
        </button>
      </div>
      {actionError && <p className="mb-2 text-sm text-red-600">{actionError}</p>}

      <FilterBar
        searchPlaceholder="Search parent, teacher, student, subject..."
        search={search}
        onSearchChange={(v) => updateParams({ search: v })}
        sortOptions={[{ value: 'createdAt', label: 'Created' }]}
        sort={sort}
        order={order}
        onSortChange={(v) => updateParams({ sort: v })}
        onOrderChange={(v) => updateParams({ order: v })}
        extra={
          <div className="flex gap-2">
            <ColumnSelector pageKey="enrollments_pending" columns={[...PENDING_COLUMNS]} visibleColumns={visibleColumnsPending.length ? visibleColumnsPending : PENDING_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsPending} />
            <ColumnSelector pageKey="enrollments_completed" columns={[...COMPLETED_COLUMNS]} visibleColumns={visibleColumnsCompleted.length ? visibleColumnsCompleted : COMPLETED_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsCompleted} />
          </div>
        }
      />
      <Tabs
        tabs={[
          { id: 'pending', label: 'Pending', count: filteredPending.length },
          { id: 'completed', label: 'Completed', count: filteredCompleted.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => updateParams({ section: id as 'pending' | 'completed' })}
        ariaLabel="Enrollment type tabs"
      />
      <DataState loading={loading} error={error} onRetry={fetchData}>
        {data && (
          <div className="rounded-lg border border-accent-200 bg-white">
            {activeTab === 'pending' && (
            <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        {colP('parent') && <th className="px-4 py-2 text-left">Parent</th>}
                        {colP('teacher') && <th className="px-4 py-2 text-left">Teacher</th>}
                        {colP('subject') && <th className="px-4 py-2 text-left">Subject</th>}
                        {colP('created') && <th className="px-4 py-2 text-left">Created</th>}
                        {colP('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                    {filteredPending.map((p, i) => {
                      const pid = (p as { _id?: string })._id;
                      const parentId = getId(p.parentId as { _id?: string });
                      return (
                      <tr key={pid ?? i} className="border-t border-accent-100 hover:bg-accent-50/50">
                        <td className="w-10 px-2 py-2">
                          {pid ? (
                            <BulkCheckbox
                              checked={bulkPending.isSelected(pid)}
                              onChange={() => bulkPending.toggle(pid)}
                              aria-label={`Select pending ${(p.parentId as { name?: string })?.name ?? 'enrollment'}`}
                            />
                          ) : null}
                        </td>
                        {colP('parent') && (
                          <td className="px-4 py-2">
                            {parentId ? (
                              <Link to={`/parents/${parentId}`} className="text-accent-600 hover:underline">
                                {(p.parentId as { name?: string })?.name ?? '-'}
                              </Link>
                            ) : (
                              (p.parentId as { name?: string })?.name ?? '-'
                            )}
                          </td>
                        )}
                        {colP('teacher') && (
                          <td className="px-4 py-2">
                            {getId(p.teacherId as { _id?: string }) ? (
                              <Link to={`/teachers/${getId(p.teacherId as { _id?: string })}`} className="text-accent-600 hover:underline">
                                {(p.teacherId as { name?: string })?.name ?? '-'}
                              </Link>
                            ) : (
                              (p.teacherId as { name?: string })?.name ?? '-'
                            )}
                          </td>
                        )}
                        {colP('subject') && <td className="px-4 py-2">{p.subject ?? '-'}</td>}
                        {colP('created') && <td className="px-4 py-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>}
                        {colP('actions') && pid && (
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                to={`/enrollments/pending/${pid}`}
                                state={{ from: location.pathname + location.search }}
                                className="text-accent-600 hover:underline"
                              >
                                View
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleGenerateLink(pid)}
                                disabled={actionLoading === pid}
                                className="text-accent-600 hover:underline disabled:opacity-50"
                              >
                                {actionLoading === pid ? '...' : 'Payment link'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleComplete(pid)}
                                disabled={actionLoading === pid}
                                className="text-green-600 hover:underline disabled:opacity-50"
                              >
                                {actionLoading === pid ? '...' : 'Complete'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );})}
                    {filteredPending.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No pending enrollments</td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
            )}
            {activeTab === 'completed' && (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50">
                    <tr>
                      {colC('student') && <th className="px-4 py-2 text-left">Student</th>}
                      {colC('teacher') && <th className="px-4 py-2 text-left">Teacher</th>}
                      {colC('subject') && <th className="px-4 py-2 text-left">Subject</th>}
                      {colC('created') && <th className="px-4 py-2 text-left">Created</th>}
                      {colC('actions') && <th className="px-4 py-2 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompleted.map((c, i) => {
                      const cid = (c as { _id?: string })._id;
                      return (
                      <tr key={cid ?? i} className="border-t border-accent-100 hover:bg-accent-50/50">
                        {colC('student') && (
                          <td className="px-4 py-2">
                            {(c.studentId as { _id?: string })?._id ? (
                              <Link to={`/students/${(c.studentId as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                                {(c.studentId as { name?: string })?.name ?? '-'}
                              </Link>
                            ) : (
                              (c.studentId as { name?: string })?.name ?? '-'
                            )}
                          </td>
                        )}
                        {colC('teacher') && (
                          <td className="px-4 py-2">
                            {(c.teacherId as { _id?: string })?._id ? (
                              <Link to={`/teachers/${(c.teacherId as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                                {(c.teacherId as { name?: string })?.name ?? '-'}
                              </Link>
                            ) : (
                              (c.teacherId as { name?: string })?.name ?? '-'
                            )}
                          </td>
                        )}
                        {colC('subject') && <td className="px-4 py-2">{c.subject ?? '-'}</td>}
                        {colC('created') && <td className="px-4 py-2">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>}
                        {colC('actions') && (
                          <td className="px-4 py-2">
                            {cid ? (
                              <Link
                                to={`/enrollments/completed/${cid}`}
                                state={{ from: location.pathname + location.search }}
                                className="text-accent-600 hover:underline"
                              >
                                View
                              </Link>
                            ) : '-'}
                          </td>
                        )}
                      </tr>
                    );})}
                    {filteredCompleted.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No completed enrollments</td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
            )}
          </div>
        )}
      </DataState>

      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddStudent(false)}>
          <div className="max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Add student to parent</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Parent *</label>
                <select
                  value={addStudentForm.parentId}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                >
                  <option value="">Select parent</option>
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>{p.name ?? p._id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Student name *</label>
                <input
                  type="text"
                  value={addStudentForm.name}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Class *</label>
                <input
                  type="text"
                  value={addStudentForm.classLevel}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, classLevel: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">School name</label>
                <input
                  type="text"
                  value={addStudentForm.schoolName}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, schoolName: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Board</label>
                <select
                  value={addStudentForm.board}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, board: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State">State</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">Cancel</button>
                <button type="submit" disabled={!!actionLoading} className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-700 disabled:opacity-50">
                  {actionLoading === 'add_student' ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMapBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMapBatch(false)}>
          <div className="max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Map teacher batch to student</h2>
            <form onSubmit={handleMapBatch} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Parent *</label>
                <select
                  value={mapForm.parentId}
                  onChange={(e) => setMapForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                >
                  <option value="">Select parent</option>
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>{p.name ?? p._id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Student *</label>
                <select
                  value={mapForm.studentId}
                  onChange={(e) => setMapForm((f) => ({ ...f, studentId: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                  disabled={!mapForm.parentId || parentChildren.length === 0}
                >
                  <option value="">Select student</option>
                  {parentChildren.map((c) => (
                    <option key={c._id} value={c._id}>{c.name ?? c.studentId ?? c._id}</option>
                  ))}
                  {mapForm.parentId && parentChildren.length === 0 && <option value="">No children - add student first</option>}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Teacher *</label>
                <select
                  value={mapForm.teacherId}
                  onChange={(e) => setMapForm((f) => ({ ...f, teacherId: e.target.value }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.name ?? t._id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Batch *</label>
                <select
                  value={mapForm.batchIndex}
                  onChange={(e) => setMapForm((f) => ({ ...f, batchIndex: parseInt(e.target.value, 10) }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  required
                  disabled={!mapForm.teacherId || teacherBatches.length === 0}
                >
                  {teacherBatches.map((b) => (
                    <option key={b.batchIndex} value={b.batchIndex}>
                      {b.name} – {b.subject} (₹{b.feePerMonth ?? '-'}/mo)
                    </option>
                  ))}
                  {mapForm.teacherId && teacherBatches.length === 0 && <option value="">No batches</option>}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Duration</label>
                <select
                  value={mapForm.duration}
                  onChange={(e) => setMapForm((f) => ({ ...f, duration: e.target.value as '3months' | '6months' | '12months' }))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                >
                  <option value="3months">3 months</option>
                  <option value="6months">6 months (5% off)</option>
                  <option value="12months">12 months (10% off)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMapBatch(false)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">Cancel</button>
                <button type="submit" disabled={!!actionLoading} className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-700 disabled:opacity-50">
                  {actionLoading === 'map_batch' ? 'Mapping...' : 'Map'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPaymentLinkModal(null)}>
          <div className="max-w-lg rounded-xl border border-accent-200 bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Payment link</h2>
            <p className="mb-2 text-sm text-accent-700">Share this link with the parent to complete payment:</p>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                readOnly
                value={paymentLinkModal.link}
                className="flex-1 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(paymentLinkModal.link);
                }}
                className="rounded-lg bg-accent-600 px-3 py-2 text-sm text-white hover:bg-accent-700"
              >
                Copy
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleComplete(paymentLinkModal.pendingId)}
                disabled={!!actionLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === paymentLinkModal.pendingId ? '...' : 'Complete enrollment'}
              </button>
              <button type="button" onClick={() => setPaymentLinkModal(null)} className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
