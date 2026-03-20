import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AddEditStudentForm from './AddEditStudentForm';
import { formatCurrency } from '@shared/formatters';

interface Child {
  _id: string;
  name?: string;
  studentId?: string;
  dateOfBirth?: string;
  classLevel?: string;
  board?: string;
  schoolName?: string;
  enrollments?: Array<{
    _id: string;
    subject?: string;
    teacher?: { name?: string };
    feePerMonth?: number;
    status?: string;
  }>;
}

interface Response {
  children: Child[];
}

export default function ParentStudents() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const { t } = useLanguage();

  const fetchStudents = () => {
    setLoading(true);
    apiJson<Response>('/api/parent/students')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  if (loading && !data) return <div className="text-brand-600">Loading...</div>;
  if (error && !data) return <div className="text-red-600">Error: {error}</div>;

  const children = data?.children || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-800">{t('myKids')}</h1>
        <button
          onClick={() => { setShowAdd(true); setEditing(null); }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
        >
          {t('addStudent')}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-brand-800">
            {editing ? 'Edit Student' : 'Add Student'}
          </h2>
          <AddEditStudentForm
            mode={editing ? 'edit' : 'add'}
            student={editing || undefined}
            onSuccess={() => { setShowAdd(false); setEditing(null); fetchStudents(); }}
            onCancel={() => { setShowAdd(false); setEditing(null); }}
          />
        </div>
      )}

      <div className="space-y-4">
        {children.map((c) => (
          <div key={c._id} className="rounded-xl border border-brand-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-brand-800">{c.name || c.studentId || 'Student'}</h3>
                <p className="text-sm text-gray-600">
                  {c.classLevel && c.board && `${c.board} - ${c.classLevel}`}
                </p>
                {c.enrollments && c.enrollments.length > 0 && (
                  <ul className="mt-2 text-sm">
                    {c.enrollments.map((e) => (
                      <li key={e._id}>
                        {e.subject} - {e.teacher?.name || 'Teacher'} ({formatCurrency(e.feePerMonth ?? 0)}/mo)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => { setEditing(c); setShowAdd(false); }}
                className="text-sm text-brand-600 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      {children.length === 0 && !showAdd && <p className="text-gray-600">No students added yet.</p>}
    </div>
  );
}
