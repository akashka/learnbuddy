import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

interface Profile {
  name?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  profession?: string;
  bio?: string;
}

export default function TeacherProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const fetchProfile = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<Profile>('/api/teacher/profile')
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
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Profile & Settings</h1>

      <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Profile</h2>
        <p><strong>Name:</strong> {profile?.name || '-'}</p>
        <p><strong>Email:</strong> {profile?.email || '-'}</p>
        <p><strong>Phone:</strong> {profile?.phone || '-'}</p>
        <p><strong>Qualification:</strong> {profile?.qualification || '-'}</p>
        <p><strong>Profession:</strong> {profile?.profession || '-'}</p>
      </div>

      <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Agreements</h2>
        <p className="mb-3 text-sm text-gray-600">
          Sign Commission Model, Payment Terms, and Code of Conduct agreements.
        </p>
        <Link
          to="/teacher/agreements"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-100 px-4 py-2 text-brand-700 hover:bg-brand-200"
        >
          <span>📄</span> View & Sign Agreements
        </Link>
      </div>

      <div className="rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Privacy & Data</h2>
        <p className="mb-3 text-sm text-gray-600">
          View your data, download your data, or delete your account.
        </p>
        <Link
          to="/teacher/privacy"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-100 px-4 py-2 text-brand-700 hover:bg-brand-200"
        >
          <span>🔒</span> Privacy & Data
        </Link>
      </div>
    </div>
  );
}
