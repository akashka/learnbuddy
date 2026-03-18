import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPageLayout } from '@/components/AuthPageLayout';
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
    <AuthPageLayout title="Create your account" subtitle="A few details to help us connect you with the right tutors" wide card={false}>
      <div className="rounded-3xl border-2 border-brand-200 bg-white p-6 shadow-2xl sm:p-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Enter your full name"
              className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="your@email.com"
              className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Phone</label>
            <input
              type="text"
              value={phone}
              readOnly
              className="w-full rounded-xl border-2 border-brand-100 bg-brand-50 px-4 py-3 text-gray-600"
            />
          </div>
          <LocationSearch
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            label="Location"
            placeholder="Start typing to search (City, State or area)"
            inputClassName="rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-4 disabled:opacity-50">
            <span className="btn-text">{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
