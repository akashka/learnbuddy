import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { LocationSearch } from '@/components/LocationSearch';

interface Profile {
  name?: string;
  email?: string;
  emailVerifiedAt?: string;
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

export default function ParentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', location: '' });

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
        setForm({ name: p.name || '', email: p.email || '', location: p.location || '' });
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiJson('/api/parent/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: form.name, email: form.email, location: form.location }),
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    setError(null);
    try {
      const res = await apiJson<{ devLink?: string }>('/api/auth/send-email-verification', {
        method: 'POST',
      });
      if (res.devLink) {
        window.alert(`Verification link (dev): ${res.devLink}`);
      } else {
        window.alert('Verification link sent to your email.');
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    }
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error && !profile) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;

  const emailVerified = !!profile?.emailVerifiedAt;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Profile & Settings</h1>

      {checklist.length > 0 && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-brand-800">Getting Started</h2>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className={item.done ? 'text-green-600' : 'text-gray-400'}>
                  {item.done ? '✓' : '○'}
                </span>
                <Link to={item.href} className="flex-1 text-brand-600 hover:underline">
                  {item.label}
                </Link>
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
        <h2 className="mb-3 font-semibold text-brand-800">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />
              {!emailVerified && form.email && (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600"
                >
                  Verify
                </button>
              )}
            </div>
            {emailVerified && (
              <p className="mt-1 text-sm text-green-600">✓ Email verified</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={profile?.phone || ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Phone cannot be changed</p>
          </div>
          <LocationSearch
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            label="Location"
            placeholder="Search for an address..."
          />
          {error && <p className="text-sm text-red-600">{String(error)}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Privacy & Data</h2>
        <p className="mb-3 text-sm text-gray-600">
          View your data, consent history, download your data, or delete your account.
        </p>
        <Link
          to="/parent/privacy"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-100 px-4 py-2 text-brand-700 hover:bg-brand-200"
        >
          <span>🔒</span> Privacy & Data
        </Link>
      </div>
    </div>
  );
}
