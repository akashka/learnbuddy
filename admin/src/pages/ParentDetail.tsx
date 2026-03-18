import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { LocationSearch } from '@/components/LocationSearch';

export default function ParentDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminApi.parents.get(id)
      .then((d) => {
        const parent = d as Record<string, unknown>;
        setData(parent);
        setName(String(parent.name ?? ''));
        setPhone(String(parent.phone ?? ''));
        setLocation(String(parent.location ?? ''));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await adminApi.parents.update(id, {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
      });
      setData(updated as Record<string, unknown>);
      toast.success('Parent updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Parent Detail</h1>
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Basic Info</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone"
                    className="w-full max-w-md rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div className="max-w-md">
                  <LocationSearch
                    value={location}
                    onChange={setLocation}
                    label="Location"
                    placeholder="Search for an address..."
                  />
                </div>
                <p className="text-sm text-accent-600">Email: {(data.userId as { email?: string })?.email ?? '-'} (managed via User)</p>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
            {Array.isArray(data.children) && (data.children as unknown[]).length > 0 && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold">Children</h2>
                <div className="space-y-2">
                  {(data.children as { _id?: string; name?: string; studentId?: string; board?: string; classLevel?: string }[]).map((c) => (
                    <div key={c._id ?? c.studentId} className="rounded border border-accent-100 p-2">
                      <p>
                        {c._id ? (
                          <Link to={`/students/${c._id}`} className="font-medium text-accent-600 hover:underline">
                            {c.name}
                          </Link>
                        ) : (
                          <strong>{c.name}</strong>
                        )}
                        {' '}- {c.studentId ?? '-'} | {c.board ?? '-'} / {c.classLevel ?? '-'}
                      </p>
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
