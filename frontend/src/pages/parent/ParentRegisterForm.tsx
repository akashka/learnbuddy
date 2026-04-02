import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPageLayout } from '@/components/AuthPageLayout';
import { LocationSearch } from '@/components/LocationSearch';
import { PolicyTermsCheckbox } from '@/components/PolicyTermsCheckbox';
import ReCAPTCHA from 'react-google-recaptcha';

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
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    if (!phone) navigate('/parent/register');
  }, [phone, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptedPolicy) {
      setError('Please accept the Privacy Policy and Terms & Conditions to continue.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiJson<{
        success?: boolean;
        isComplete?: boolean;
        token?: string;
        user?: { id: string; email: string; role: string };
      }>('/api/parent-registration/save', {
        method: 'POST',
        body: JSON.stringify({ phone, data: form, complete: true, recaptchaToken }),
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
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    }
  };

  if (!phone) return null;

  return (
    <AuthPageLayout title="" subtitle="" wide card={false}>
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-brand-200 shadow-xl">
        <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-6 sm:px-8 sm:py-7">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Create your account</h2>
          <p className="mt-1.5 text-sm text-white/90 sm:text-base">
            A few details to help us connect you with the right tutors for your child.
          </p>
        </div>
        <div className="bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Location</label>
            <LocationSearch
              value={form.location}
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
              label=""
              placeholder="Start typing to search (City, State or area)"
              inputClassName="rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <PolicyTermsCheckbox
            checked={acceptedPolicy}
            onChange={setAcceptedPolicy}
            error={error && !acceptedPolicy ? error : undefined}
          />

          <div className="flex justify-center py-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
            />
          </div>

          {error && acceptedPolicy && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-4 disabled:opacity-50">
            <span className="btn-text">{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>
        </div>
      </div>
    </AuthPageLayout>
  );
}
