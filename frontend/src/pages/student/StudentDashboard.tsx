import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

interface Profile {
  name?: string;
  studentId?: string;
  classLevel?: string;
  board?: string;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchProfile = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<Profile>('/api/student/profile')
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchProfile} fullPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('dashboard')}</h1>
      <p className="mb-4 text-lg">{t('welcome')}, {profile?.name || profile?.studentId || 'Student'}!</p>
      <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Profile</h2>
        <p><strong>Name:</strong> {profile?.name || '-'}</p>
        <p><strong>Student ID:</strong> {profile?.studentId || '-'}</p>
        <p><strong>Class:</strong> {profile?.classLevel || '-'}</p>
        <p><strong>Board:</strong> {profile?.board || '-'}</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link to="/student/courses" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          Courses
        </Link>
        <Link to="/student/classes" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          {t('myClasses')}
        </Link>
        <Link to="/student/exams" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          {t('exams')}
        </Link>
      </div>
    </div>
  );
}
