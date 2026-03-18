import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

interface Profile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

export default function ParentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      apiJson<Profile>('/api/parent/profile'),
      apiJson<{ checklist: ChecklistItem[] }>('/api/parent/onboarding-status'),
    ])
      .then(([p, o]) => {
        setProfile(p);
        setChecklist(o.checklist || []);
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;

  const pendingItems = checklist.filter((i) => !i.done);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('dashboard')}</h1>
      <p className="mb-4 text-lg">{t('welcome')}, {profile?.name || profile?.email || 'Parent'}!</p>

      {pendingItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-brand-800">Getting Started</h2>
          <ul className="space-y-2">
            {pendingItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span>{item.label}</span>
                <Link
                  to={item.href}
                  className="rounded bg-brand-100 px-2 py-1 text-sm text-brand-700 hover:bg-brand-200"
                >
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Profile</h2>
        <p><strong>Name:</strong> {profile?.name || '-'}</p>
        <p><strong>Email:</strong> {profile?.email || '-'}</p>
        <p><strong>Phone:</strong> {profile?.phone || '-'}</p>
        <p><strong>Location:</strong> {profile?.location || '-'}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/parent/profile" className="text-sm text-brand-600 hover:underline">
            Edit profile & settings
          </Link>
          <Link to="/parent/privacy" className="text-sm text-brand-600 hover:underline">
            🔒 Privacy & Data
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link to="/parent/marketplace" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          {t('marketplace')}
        </Link>
        <Link to="/parent/students" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          {t('myKids')}
        </Link>
        <Link to="/parent/classes" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          {t('myClasses')}
        </Link>
      </div>
    </div>
  );
}
