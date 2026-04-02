import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';

const MIN_PASSWORD_LENGTH = 6;

export default function AdminLogin() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === 'admin') {
      navigate('/dashboard', { replace: true });
    } else if (user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setLoading(true);
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.trim(), 
          password,
          recaptchaToken: recaptchaToken || undefined 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      if (data.user?.role !== 'admin') {
        setError('Admin access only. Please use admin credentials.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch {
      setError('Login failed');
      toast.error('Login failed');
    } finally {
      setLoading(false);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent-50">
        <p className="text-accent-600">Loading...</p>
      </div>
    );
  }
  if (user?.role === 'admin') return null;
  if (user) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-100 via-accent-50 to-accent-100" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute bottom-32 right-20 h-40 w-40 rounded-full bg-accent-400 blur-3xl" />
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-4 py-12 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <div>
            <div className="mb-6">
              <BrandLogo variant="admin" showTagline size="lg" className="justify-center lg:justify-start" />
            </div>
            <p className="mx-auto max-w-md text-accent-800/90 lg:mx-0">
              Admin portal for managing teachers, students, enrollments, and platform settings.
            </p>
          </div>
          <div className="mt-8 hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl border-4 border-accent-200 bg-white/80 p-8 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-center gap-4">
                <span className="text-7xl">⚙️</span>
                <div className="text-left">
                  <p className="font-bold text-accent-800">Admin Dashboard</p>
                  <p className="text-sm text-accent-600">Secure admin access</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md flex-shrink-0">
          <div className="rounded-3xl border-4 border-accent-200 bg-white/90 p-8 shadow-xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-accent-800">Admin Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-semibold text-accent-800">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border-2 border-accent-200 px-4 py-3 transition focus:border-accent-400"
                />
              </div>
              <div>
                <label className="mb-2 block font-semibold text-accent-800">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={MIN_PASSWORD_LENGTH}
                    className="w-full rounded-xl border-2 border-accent-200 px-4 py-3 pr-12 transition focus:border-accent-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-600 hover:text-accent-800"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-accent-500 px-4 py-3 font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
