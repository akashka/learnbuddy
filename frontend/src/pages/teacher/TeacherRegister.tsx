import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPageLayout } from '@/components/AuthPageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResendOtpTimer } from '@/hooks/useResendOtpTimer';

export default function TeacherRegister() {
  const [step, setStep] = useState<'phone' | 'otp' | 'form'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      const otpRes = await apiJson<{ success?: boolean; error?: string }>(
        '/api/registration/send-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, type: 'teacher' }) }
      );
      if (otpRes.success) {
        setStep('otp');
        startResendTimer();
      } else {
        setError((otpRes as { error?: string }).error || 'Failed to send OTP');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      const otpRes = await apiJson<{ success?: boolean; error?: string }>(
        '/api/registration/send-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, type: 'teacher' }) }
      );
      if (otpRes.success) {
        startResendTimer();
      } else {
        setError((otpRes as { error?: string }).error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      await apiJson<{ success?: boolean }>(
        '/api/registration/verify-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, otp: otp.trim(), type: 'teacher' }) }
      );
      setStep('form');
    } catch (err) {
      setError((err as Error).message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await register({
        email: email.trim(),
        password,
        role: 'teacher',
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      if (ok) {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        setError('Registration failed. Email may already be in use.');
      }
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <AuthPageLayout title="Become a Teacher" subtitle="Enter your phone to start or continue">
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="mb-2 block font-semibold text-brand-800">{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
              className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            <span className="btn-text">{loading ? 'Sending OTP...' : 'Send OTP'}</span>
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </AuthPageLayout>
    );
  }

  if (step === 'otp') {
    const normalized = String(phone).replace(/\D/g, '').slice(-4);
    return (
      <AuthPageLayout title="Verify Phone" subtitle="Enter the OTP sent to your number">
        <p className="mb-4 text-sm text-brand-600">
          OTP sent to ******{normalized}. Enter the 6-digit code.
        </p>
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
              required
            />
            <button
              type="button"
              onClick={() => setStep('phone')}
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
            <span className="btn-text">{loading ? 'Verifying...' : 'Verify & Continue'}</span>
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="Complete Profile" subtitle="Phone verified. Enter your details.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block font-semibold text-brand-800">{t('name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            required
          />
        </div>
        <div>
          <label className="mb-2 block font-semibold text-brand-800">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            required
          />
        </div>
        <div>
          <label className="mb-2 block font-semibold text-brand-800">{t('phone')}</label>
          <input
            type="tel"
            value={phone}
            readOnly
            className="w-full rounded-xl border-2 border-brand-100 bg-brand-50 px-4 py-3 text-gray-600"
          />
        </div>
        <div>
          <label className="mb-2 block font-semibold text-brand-800">{t('password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          <span className="btn-text">{loading ? 'Registering...' : t('register')}</span>
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
