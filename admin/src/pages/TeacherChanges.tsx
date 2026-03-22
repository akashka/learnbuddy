import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';

type TeacherChangeItem = {
  _id: string;
  enrollmentId: string;
  parentId?: string;
  studentId?: string;
  oldTeacherId?: string;
  newTeacherId?: string;
  parent: { name?: string; phone?: string; email?: string };
  student: { name?: string; studentId?: string };
  oldTeacher: { name?: string; phone?: string };
  newTeacher: { name?: string; phone?: string };
  reason: string;
  feeDifference?: number;
  oldFeePerMonth?: number;
  newFeePerMonth?: number;
  daysWithOldTeacher?: number;
  daysWithNewTeacher?: number;
  adminRemarks?: string;
  createdAt: string;
};

export default function TeacherChanges() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    items: TeacherChangeItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const fetchChanges = useCallback(() => {
    setLoading(true);
    adminApi.teacherChanges
      .list({ sort: 'createdAt', order: 'desc', page: 1, limit: 100 })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-accent-800">Teacher Changes</h1>
        <p className="mt-1 text-sm text-accent-700">
          History of parent-initiated teacher switches. Includes parent, student, old & new teacher details, reason, and payment split info.
        </p>
      </div>

      <DataState loading={loading} error={error}>
        {data && (
          <div className="overflow-x-auto rounded-lg border border-accent-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-accent-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Parent</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Old Teacher</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">New Teacher</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Fee Diff</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Days Split</th>
                  <th className="px-4 py-3 text-left font-medium text-accent-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-accent-700">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.parentId ? (
                        <Link to={`/parents/${item.parentId}`} className="text-accent-600 hover:underline">
                          {item.parent.name || '-'}
                        </Link>
                      ) : (
                        item.parent.name || '-'
                      )}
                      <div className="text-xs text-accent-500">{item.parent.email || item.parent.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.student.name || item.student.studentId || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.oldTeacherId ? (
                        <Link to={`/teachers/${item.oldTeacherId}`} className="text-accent-600 hover:underline">
                          {item.oldTeacher.name || '-'}
                        </Link>
                      ) : (
                        item.oldTeacher.name || '-'
                      )}
                      {item.oldFeePerMonth != null && (
                        <div className="text-xs text-accent-500">₹{item.oldFeePerMonth}/mo</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.newTeacherId ? (
                        <Link to={`/teachers/${item.newTeacherId}`} className="text-accent-600 hover:underline">
                          {item.newTeacher.name || '-'}
                        </Link>
                      ) : (
                        item.newTeacher.name || '-'
                      )}
                      {item.newFeePerMonth != null && (
                        <div className="text-xs text-accent-500">₹{item.newFeePerMonth}/mo</div>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3" title={item.reason}>
                      {item.reason || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.feeDifference != null
                        ? item.feeDifference >= 0
                          ? `+₹${item.feeDifference}`
                          : `₹${item.feeDifference} (no refund)`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.daysWithOldTeacher != null && item.daysWithNewTeacher != null
                        ? `${item.daysWithOldTeacher}d / ${item.daysWithNewTeacher}d`
                        : '-'}
                    </td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-accent-600" title={item.adminRemarks}>
                      {item.adminRemarks || '-'}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-accent-600">
                      No teacher changes yet. Changes appear when parents complete a teacher switch from My Teachers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
