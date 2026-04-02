import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResendOtpTimer } from '@/hooks/useResendOtpTimer';
import { BrandLogo } from '@/components/BrandLogo';
import ReCAPTCHA from 'react-google-recaptcha';

type LoginMode = 'student' | 'otp';

export default function Login() {
  const [searchParams] = useSearchParams();
  const fromRegister = searchParams.get('from') === 'register' || searchParams.get('from') === 'parent-register' || searchParams.get('from') === 'teacher-register';
  const [mode, setMode] = useState<LoginMode>(fromRegister ? 'otp' : 'student');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithStudentId, sendOtp, loginWithOtp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

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
      const result = await sendOtp(phone.replace(/\D/g, '').slice(-10), recaptchaToken || undefined);
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
      const ok = await loginWithStudentId(studentId.trim(), password, recaptchaToken || undefined);
      if (ok) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navigate(getRedirectByRole(user.role || 'student'), { replace: true });
      } else {
        setError('Invalid Student ID or password. Please try again.');
      }
    } finally {
      setLoading(false);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full items-center justify-center px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 sm:flex-row sm:gap-12 lg:gap-16">
        {/* Left: Brand logo, welcome text, image */}
        <div className="flex flex-1 flex-col items-center lg:items-start">
          <div className="animate-slide-up opacity-0 [animation-fill-mode:forwards]">
            <BrandLogo size="large" iconSize={112} showTagline={true} compact={false} className="mb-6 justify-center lg:justify-start" />
            <h2 className="mb-8 text-center text-3xl font-bold text-brand-800 sm:text-4xl lg:text-left">
              Welcome back
            </h2>
            <div className="flex justify-center lg:justify-start">
              <img
                src="/images/kids-learning.svg"
                alt="Kids learning with GuruChakra"
                className="h-56 w-full max-w-sm object-contain sm:h-64 lg:h-72"
              />
            </div>
          </div>
        </div>

        {/* Right: Login Card - wider, properly aligned */}
        <div className="flex w-full max-w-lg shrink-0 justify-center lg:max-w-xl">
          <div className="card w-full animate-slide-up px-6 py-8 opacity-0 sm:px-8 sm:py-10 [animation-delay:0.15s] [animation-fill-mode:forwards]">
            <h3 className="mb-6 text-xl font-bold text-brand-800 sm:text-2xl">Sign in</h3>
            {fromRegister && (
              <div className="mb-4 rounded-xl bg-green-50 p-3 text-center text-base text-green-800">
                You&apos;re already registered! Please login with your phone number below. 📱
              </div>
            )}
            <div className="mb-6 flex gap-2" role="group" aria-label="Login method">
              <button
                type="button"
                onClick={() => resetMode('student')}
                aria-pressed={mode === 'student'}
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
                aria-pressed={mode === 'otp'}
                className={`flex-1 rounded-xl py-3 font-semibold transition-all ${
                  mode === 'otp'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                }`}
              >
                👨‍👩‍👧 Parent / 👩‍🏫 Teacher
              </button>
            </div>
            {mode === 'student' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="student-id" className="mb-2 block font-semibold text-brand-800">Student ID</label>
                  <input
                    id="student-id"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    placeholder="e.g. STU001234"
                    maxLength={9}
                    autoComplete="username"
                    className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="student-password" className="mb-2 block font-semibold text-brand-800">{t('password')}</label>
                  <div className="relative">
                    <input
                      id="student-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 pr-12 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:text-brand-800"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-controls="student-password"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>

                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  <span className="btn-text">{loading ? 'Loading...' : t('login')}</span>
                </button>
              </form>
            )}

            {mode === 'otp' && (
              <>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="phone-number" className="mb-2 block font-semibold text-brand-800">Phone Number</label>
                      <input
                        id="phone-number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        autoComplete="tel"
                        className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                      <span className="btn-text">{loading ? 'Sending...' : 'Send OTP'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label htmlFor="otp-input" className="mb-2 block font-semibold text-brand-800">Enter OTP</label>
                      <input
                        id="otp-input"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
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
                        aria-live="polite"
                      >
                        {canResend ? 'Resend OTP' : `Resend in ${secondsLeft}s`}
                      </button>
                    </div>
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                      <span className="btn-text">{loading ? 'Verifying...' : t('login')}</span>
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="mt-6 border-t border-brand-100 pt-6">
              <p className="text-center text-lg text-brand-700">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-bold text-brand-600 underline underline-offset-2 hover:underline">
                  {t('register')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
