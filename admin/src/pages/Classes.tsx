import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';
import { FilterBar } from '@/components/FilterBar';
import { ColumnSelector } from '@/components/ColumnSelector';
import Tabs from '@/components/Tabs';
import { useTablePreferences } from '@/hooks/useTablePreferences';

type Session = { teacherId?: { name?: string }; studentId?: { name?: string }; enrollmentId?: { subject?: string }; scheduledAt?: string; status?: string };
type Enrollment = { teacher?: string; teacherId?: string; student?: string; studentDocId?: string; subject?: string; classLevel?: string; startDate?: string; endDate?: string };

const SESSION_COLUMNS = [
  { key: 'teacher', label: 'Teacher' },
  { key: 'student', label: 'Student' },
  { key: 'subject', label: 'Subject' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'status', label: 'Status' },
] as const;

const ENROLLMENT_COLUMNS = [
  { key: 'teacher', label: 'Teacher' },
  { key: 'student', label: 'Student' },
  { key: 'subject', label: 'Subject' },
  { key: 'class', label: 'Class' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
] as const;

export default function Classes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ sessions: Session[]; enrollments: Enrollment[] } | null>(null);
  const [search, setSearch] = useState('');
  const statusFilter = searchParams.get('status') ?? '';
  const activeTab = (searchParams.get('section') as 'sessions' | 'enrollments') || 'sessions';
  const updateParams = (updates: { status?: string; section?: string }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '' || (k === 'section' && v === 'sessions')) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };
  const [visibleColumnsSessions, setVisibleColumnsSessions] = useTablePreferences('classes_sessions', SESSION_COLUMNS.map((c) => c.key));
  const [visibleColumnsEnrollments, setVisibleColumnsEnrollments] = useTablePreferences('classes_enrollments', ENROLLMENT_COLUMNS.map((c) => c.key));

  useEffect(() => {
    adminApi.classes.list({ status: statusFilter || undefined })
      .then((d) => setData(d as { sessions: Session[]; enrollments: Enrollment[] }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const searchLower = search.trim().toLowerCase();
  const filterSession = (s: Session) => {
    if (!searchLower) return true;
    const t = (s.teacherId as { name?: string })?.name ?? '';
    const st = (s.studentId as { name?: string })?.name ?? '';
    const sub = (s.enrollmentId as { subject?: string })?.subject ?? '';
    return t.toLowerCase().includes(searchLower) || st.toLowerCase().includes(searchLower) || sub.toLowerCase().includes(searchLower);
  };
  const filterEnrollment = (e: Enrollment) => {
    if (!searchLower) return true;
    return (e.teacher ?? '').toLowerCase().includes(searchLower) || (e.student ?? '').toLowerCase().includes(searchLower) || (e.subject ?? '').toLowerCase().includes(searchLower) || (e.classLevel ?? '').toLowerCase().includes(searchLower);
  };

  const filteredSessions = useMemo(() => (data?.sessions ?? []).filter(filterSession), [data?.sessions, searchLower]);
  const filteredEnrollments = useMemo(() => (data?.enrollments ?? []).filter(filterEnrollment), [data?.enrollments, searchLower]);

  const colS = (key: string) => visibleColumnsSessions.includes(key) || visibleColumnsSessions.length === 0;
  const colE = (key: string) => visibleColumnsEnrollments.includes(key) || visibleColumnsEnrollments.length === 0;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Classes</h1>
      <FilterBar
        searchPlaceholder="Search teacher, student, subject..."
        search={search}
        onSearchChange={setSearch}
        filters={[
          { key: 'status', label: 'Session Status', value: statusFilter, onChange: (v) => updateParams({ status: v }), options: [
            { value: '', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]},
        ]}
        extra={
          <div className="flex gap-2">
            <ColumnSelector pageKey="classes_sessions" columns={[...SESSION_COLUMNS]} visibleColumns={visibleColumnsSessions.length ? visibleColumnsSessions : SESSION_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsSessions} />
            <ColumnSelector pageKey="classes_enrollments" columns={[...ENROLLMENT_COLUMNS]} visibleColumns={visibleColumnsEnrollments.length ? visibleColumnsEnrollments : ENROLLMENT_COLUMNS.map((c) => c.key)} onVisibleChange={setVisibleColumnsEnrollments} />
          </div>
        }
      />
      <Tabs
        tabs={[
          { id: 'sessions', label: 'Sessions', count: filteredSessions.length },
          { id: 'enrollments', label: 'Active Enrollments', count: filteredEnrollments.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => updateParams({ section: id as 'sessions' | 'enrollments' })}
        ariaLabel="Classes tabs"
      />
      <DataState loading={loading} error={error}>
        {data && (
          <div className="rounded-lg border border-accent-200 bg-white">
            {activeTab === 'sessions' && (
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        {colS('teacher') && <th className="px-4 py-2 text-left">Teacher</th>}
                        {colS('student') && <th className="px-4 py-2 text-left">Student</th>}
                        {colS('subject') && <th className="px-4 py-2 text-left">Subject</th>}
                        {colS('scheduled') && <th className="px-4 py-2 text-left">Scheduled</th>}
                        {colS('status') && <th className="px-4 py-2 text-left">Status</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((s, i) => {
                        const sid = (s as { _id?: string })._id;
                        return (
                        <tr key={sid ?? i} className="border-t border-accent-100 hover:bg-accent-50/50">
                          {colS('teacher') && <td className="px-4 py-2">{(s.teacherId as { name?: string })?.name ?? '-'}</td>}
                          {colS('student') && <td className="px-4 py-2">{(s.studentId as { name?: string })?.name ?? '-'}</td>}
                          {colS('subject') && (
                            <td className="px-4 py-2">
                              {sid ? (
                                <Link
                                  to={`/classes/${sid}`}
                                  state={{ from: location.pathname + location.search }}
                                  className="text-accent-600 hover:underline"
                                >
                                  {(s.enrollmentId as { subject?: string })?.subject ?? '-'}
                                </Link>
                              ) : (s.enrollmentId as { subject?: string })?.subject ?? '-'}
                            </td>
                          )}
                          {colS('scheduled') && <td className="px-4 py-2">{s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : '-'}</td>}
                          {colS('status') && <td className="px-4 py-2">{s.status ?? '-'}</td>}
                        </tr>
                      );})}
                      {filteredSessions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No sessions</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            )}
            {activeTab === 'enrollments' && (
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-accent-50">
                      <tr>
                        {colE('teacher') && <th className="px-4 py-2 text-left">Teacher</th>}
                        {colE('student') && <th className="px-4 py-2 text-left">Student</th>}
                        {colE('subject') && <th className="px-4 py-2 text-left">Subject</th>}
                        {colE('class') && <th className="px-4 py-2 text-left">Class</th>}
                        {colE('start') && <th className="px-4 py-2 text-left">Start</th>}
                        {colE('end') && <th className="px-4 py-2 text-left">End</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((e, i) => (
                        <tr key={i} className="border-t border-accent-100">
                          {colE('teacher') && (
                            <td className="px-4 py-2">
                              {e.teacherId ? (
                                <Link to={`/teachers/${e.teacherId}`} className="text-accent-600 hover:underline">
                                  {e.teacher ?? '-'}
                                </Link>
                              ) : (
                                e.teacher ?? '-'
                              )}
                            </td>
                          )}
                          {colE('student') && (
                            <td className="px-4 py-2">
                              {e.studentDocId ? (
                                <Link to={`/students/${e.studentDocId}`} className="text-accent-600 hover:underline">
                                  {e.student ?? '-'}
                                </Link>
                              ) : (
                                e.student ?? '-'
                              )}
                            </td>
                          )}
                          {colE('subject') && <td className="px-4 py-2">{e.subject ?? '-'}</td>}
                          {colE('class') && <td className="px-4 py-2">{e.classLevel ?? '-'}</td>}
                          {colE('start') && <td className="px-4 py-2">{e.startDate ? new Date(e.startDate).toLocaleDateString() : '-'}</td>}
                          {colE('end') && <td className="px-4 py-2">{e.endDate ? new Date(e.endDate).toLocaleDateString() : '-'}</td>}
                        </tr>
                      ))}
                      {filteredEnrollments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No enrollments</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
