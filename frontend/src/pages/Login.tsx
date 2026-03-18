import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrustBadges } from '@/components/TrustBadges';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResendOtpTimer } from '@/hooks/useResendOtpTimer';
import { BRAND } from '@shared/brand';

type LoginMode = 'student' | 'email' | 'otp';

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithStudentId, sendOtp, loginWithOtp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();

  const getRedirectByRole = (role: string) => {
    const map: Record<string, string> = {
      parent: '/parent/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      admin: '/admin',
    };
    return map[role] || '/login';
  };

  const resetMode = (m: LoginMode) => {
    setMode(m);
    setError('');
    setOtpSent(false);
    setOtp('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(phone.replace(/\D/g, '').slice(-10));
      if (result?.success) {
        setOtpSent(true);
        startResendTimer();
      } else {
        setError('Failed to send OTP. Phone may not be registered.');
      }
    } catch {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(phone.replace(/\D/g, '').slice(-10));
      if (result?.success) startResendTimer();
      else setError('Failed to resend OTP.');
    } catch {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await loginWithOtp(phone.replace(/\D/g, '').slice(-10), otp.trim());
      if (ok) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navigate(getRedirectByRole(user.role || 'parent'), { replace: true });
      } else {
        setError('Invalid or expired OTP. Please try again.');
      }
    } catch {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let ok = false;
      if (mode === 'student') {
        ok = await loginWithStudentId(studentId.trim(), password);
      } else {
        ok = await login(email.trim(), password);
      }
      if (ok) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navigate(getRedirectByRole(user.role || 'parent'), { replace: true });
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Animated background - Copy style */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-purple-50 to-pink-100" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-brand-400 blur-3xl animate-float" />
          <div className="absolute bottom-32 right-20 h-40 w-40 rounded-full bg-purple-400 blur-3xl animate-float stagger-2" />
          <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300 blur-2xl animate-pulse-soft" />
        </div>
        <div className="absolute top-10 right-10 text-6xl opacity-20 animate-float">📚</div>
        <div className="absolute bottom-20 left-10 text-5xl opacity-20 animate-float stagger-2">✨</div>
        <div className="absolute top-1/3 right-1/4 text-4xl opacity-15 animate-float stagger-3">🎓</div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center justify-center gap-8 px-4 py-12 lg:flex-row lg:gap-16">
        {/* Left: Branding & Image - Copy style */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <div className="animate-slide-up opacity-0 [animation-fill-mode:forwards]">
            <div className="mb-6 flex items-center gap-3">
              <img src="/logo.svg" alt={BRAND.name} className="h-14 w-14 animate-bounce-subtle sm:h-16 sm:w-16" />
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-800 sm:text-3xl">
                  {BRAND.name}
                </h1>
                <p className="text-sm font-medium text-brand-600 sm:text-base">{BRAND.tagline}</p>
              </div>
            </div>
            <p className="mx-auto max-w-md text-brand-700/90 lg:mx-0">
              One-to-one online tuition for kids with AI monitoring. Safe, fun, and effective learning!
            </p>
          </div>
          <div className="mt-8 hidden animate-slide-up opacity-0 [animation-delay:0.2s] [animation-fill-mode:forwards] lg:block">
            <div className="relative overflow-hidden rounded-3xl border-4 border-brand-200 bg-white/80 p-8 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-center gap-4">
                <span className="text-7xl">👩‍🏫</span>
                <div className="text-left">
                  <p className="font-bold text-brand-800">Learn with expert teachers</p>
                  <p className="text-sm text-brand-600">AI-monitored safe classes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="w-full max-w-md flex-shrink-0">
          <div className="card animate-slide-up opacity-0 [animation-delay:0.15s] [animation-fill-mode:forwards]">
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => resetMode('student')}
                className={`flex-1 rounded-xl py-3 font-semibold transition-all ${
                  mode === 'student'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                }`}
              >
                👦 Student
              </button>
              <button
                type="button"
                onClick={() => resetMode('otp')}
                className={`flex-1 rounded-xl py-3 font-semibold transition-all ${
                  mode === 'otp'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                }`}
              >
                👨‍👩‍👧 Parent / 👩‍🏫 Teacher
              </button>
            </div>
            {(mode === 'otp' || mode === 'email') && (
              <p className="-mt-4 mb-2 text-center">
                <button
                  type="button"
                  onClick={() => (mode === 'otp' ? resetMode('email') : resetMode('otp'))}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {mode === 'otp' ? 'Use email & password instead' : 'Back to phone (OTP)'}
                </button>
              </p>
            )}

            {mode === 'student' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block font-semibold text-brand-800">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    placeholder="e.g. STU001234"
                    maxLength={9}
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-semibold text-brand-800">{t('password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 pr-12 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:text-brand-800"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  <span className="btn-text">{loading ? 'Loading...' : t('login')}</span>
                </button>
              </form>
            )}

            {mode === 'email' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block font-semibold text-brand-800">{t('email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-semibold text-brand-800">{t('password')}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  <span className="btn-text">{loading ? 'Signing in...' : t('login')}</span>
                </button>
              </form>
            )}

            {mode === 'otp' && (
              <>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="mb-2 block font-semibold text-brand-800">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                      <span className="btn-text">{loading ? 'Sending...' : 'Send OTP'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="mb-2 block font-semibold text-brand-800">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 text-center text-2xl tracking-[0.5em] transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setError(''); }}
                        className="mt-2 text-sm font-medium text-brand-600 hover:underline"
                      >
                        Change number
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend || loading}
                        className="text-sm font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                      >
                        {canResend ? 'Resend OTP' : `Resend in ${secondsLeft}s`}
                      </button>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                      <span className="btn-text">{loading ? 'Verifying...' : t('login')}</span>
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="mt-6 border-t border-brand-100 pt-6">
              <p className="text-center text-sm text-brand-700">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-bold text-brand-600 underline-offset-2 hover:underline">
                  {t('register')}
                </Link>
              </p>
            </div>
            <TrustBadges variant="compact" className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
