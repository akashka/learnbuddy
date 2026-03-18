import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { LocationSearch } from '@/components/LocationSearch';

interface FormData {
  name: string;
  email: string;
  location: string;
}

export default function ParentRegisterForm() {
  const location = useLocation();
  const state = location.state as { phone?: string; existing?: boolean } | null;
  const phone = state?.phone || '';
  const [form, setForm] = useState<FormData>({ name: '', email: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    if (!phone) navigate('/parent/register');
  }, [phone, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiJson<{
        success?: boolean;
        isComplete?: boolean;
        token?: string;
        user?: { id: string; email: string; role: string };
      }>('/api/parent-registration/save', {
        method: 'POST',
        body: JSON.stringify({ phone, data: form, complete: true }),
      });
      if (res.isComplete && res.token && res.user) {
        loginWithToken(res.token, res.user);
        navigate('/parent/dashboard', { replace: true });
      } else {
        setError('Registration could not be completed');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Complete Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />
        </div>
        <LocationSearch
          value={form.location}
          onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          label="Location (optional)"
          placeholder="Search for an address..."
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
}
