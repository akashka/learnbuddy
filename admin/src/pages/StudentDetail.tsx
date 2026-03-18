import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

type Enrollment = {
  _id?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  status?: string;
  teacherId?: { _id?: string; name?: string };
  startDate?: string;
  endDate?: string;
};

function StudentEditForm({
  studentId,
  initial,
  onSaved,
}: {
  studentId: string;
  initial: { name?: string; classLevel?: string; schoolName?: string; board?: string };
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial.name ?? '');
  const [classLevel, setClassLevel] = useState(initial.classLevel ?? '');
  const [schoolName, setSchoolName] = useState(initial.schoolName ?? '');
  const [board, setBoard] = useState(initial.board ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial.name ?? '');
    setClassLevel(initial.classLevel ?? '');
    setSchoolName(initial.schoolName ?? '');
    setBoard(initial.board ?? '');
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminApi.students.update(studentId, {
        name: name.trim() || undefined,
        classLevel: classLevel.trim() || undefined,
        schoolName: schoolName.trim() || undefined,
        board: board.trim() || undefined,
      });
      toast.success('Student updated');
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-accent-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-accent-700">Class</label>
        <input
          type="text"
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          placeholder="e.g. 10"
          className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-accent-700">School Name</label>
        <input
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-accent-700">Board</label>
        <input
          type="text"
          value={board}
          onChange={(e) => setBoard(e.target.value)}
          placeholder="e.g. CBSE"
          className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    adminApi.students
      .get(id)
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Student Detail</h1>
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold">Basic Info</h2>
              <p><strong>Student ID:</strong> {String(data.studentId ?? '-')}</p>
              <p><strong>Name:</strong> {String(data.name ?? '-')}</p>
              <p><strong>Email:</strong> {String((data.userId as { email?: string })?.email ?? '-')}</p>
              <p><strong>Board:</strong> {String(data.board ?? '-')}</p>
              <p><strong>Class:</strong> {String(data.classLevel ?? '-')}</p>
              <p><strong>School:</strong> {String(data.schoolName ?? '-')}</p>
              {data.dateOfBirth && (
                <p><strong>Date of Birth:</strong> {new Date(String(data.dateOfBirth)).toLocaleDateString()}</p>
              )}
              <p><strong>Parent:</strong>{' '}
                {data.parentId
                  ? (
                    <Link
                      to={`/parents/${(data.parentId as { _id?: string })._id}`}
                      className="text-accent-600 hover:underline"
                    >
                      {(data.parentId as { name?: string }).name ?? '-'}
                    </Link>
                  )
                  : '-'}
              </p>
            </div>

            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold">Edit Student</h2>
              <StudentEditForm
                studentId={id!}
                initial={{
                  name: data.name as string,
                  classLevel: data.classLevel as string,
                  schoolName: data.schoolName as string,
                  board: data.board as string,
                }}
                onSaved={fetchData}
              />
            </div>

            {Array.isArray(data.enrollments) && (data.enrollments as Enrollment[]).length > 0 && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold">Enrollments</h2>
                <div className="space-y-2">
                  {(data.enrollments as Enrollment[]).map((e) => (
                    <div key={e._id} className="rounded border border-accent-100 p-3">
                      <p><strong>{e.subject ?? '-'}</strong> – {e.board ?? '-'} / {e.classLevel ?? '-'}</p>
                      <p className="text-sm text-accent-600">
                        Teacher:{' '}
                        {(e.teacherId as { _id?: string })?._id ? (
                          <Link to={`/teachers/${(e.teacherId as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                            {(e.teacherId as { name?: string })?.name ?? '-'}
                          </Link>
                        ) : (
                          (e.teacherId as { name?: string })?.name ?? '-'
                        )}
                        {' '}| Status: {e.status ?? '-'}
                      </p>
                      {e.startDate && e.endDate && (
                        <p className="text-xs text-accent-500">
                          {new Date(e.startDate).toLocaleDateString()} – {new Date(e.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
