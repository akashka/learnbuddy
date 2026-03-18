import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrustBadges } from '@/components/TrustBadges';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResendOtpTimer } from '@/hooks/useResendOtpTimer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [useStudentId, setUseStudentId] = useState(false);
  const [usePhoneOtp, setUsePhoneOtp] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    return map[role] || '/';
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
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
      const result = await sendOtp(phone.trim());
      if (result?.success) {
        startResendTimer();
      } else {
        setError('Failed to resend OTP.');
      }
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
      const ok = await loginWithOtp(phone.trim(), otp.trim());
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
      if (useStudentId) {
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

  if (usePhoneOtp) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('login')}</h1>
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="10-digit mobile number"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">
              OTP sent to ******{phone.slice(-4)}. Enter the 6-digit code.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                className="text-sm text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
              >
                {canResend ? 'Resend OTP' : `Resend OTP in ${secondsLeft}s`}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={() => {
            setUsePhoneOtp(false);
            setOtpSent(false);
            setOtp('');
            setError('');
          }}
          className="mt-4 w-full text-sm text-brand-600 hover:underline"
        >
          Back to email login
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account? <Link to="/register" className="text-brand-600 hover:underline">{t('register')}</Link>
        </p>
        <TrustBadges variant="compact" className="mt-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">{t('login')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {useStudentId ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="e.g. LB12345"
              required
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="you@example.com"
              required
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUseStudentId(!useStudentId)}
            className="text-sm text-brand-600 hover:underline"
          >
            {useStudentId ? 'Use email instead' : 'Login with Student ID'}
          </button>
          <span className="text-gray-400">|</span>
          <button
            type="button"
            onClick={() => setUsePhoneOtp(true)}
            className="text-sm text-brand-600 hover:underline"
          >
            Login with Phone (OTP)
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : t('login')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account? <Link to="/register" className="text-brand-600 hover:underline">{t('register')}</Link>
      </p>
      <TrustBadges variant="compact" className="mt-6" />
    </div>
  );
}
