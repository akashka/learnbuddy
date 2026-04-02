import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { AuthPageLayout } from '@/components/AuthPageLayout';
import { useResendOtpTimer } from '@/hooks/useResendOtpTimer';
import ReCAPTCHA from 'react-google-recaptcha';

export default function TeacherRegister() {
  const [searchParams] = useSearchParams();
  const skipped = searchParams.get('skipped') === '1';
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    exists?: boolean;
    step?: number;
    fullyRegistered?: boolean;
  } | null>(null);
  const navigate = useNavigate();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCheckResult(null);
    setOtpSent(false);
    try {
      const checkRes = await apiJson<{
        exists?: boolean;
        step?: number;
        fullyRegistered?: boolean;
        error?: string;
      }>('/api/teacher-registration/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      setCheckResult(checkRes);

      if (checkRes.fullyRegistered) {
        setLoading(false);
        return;
      }

      const otpRes = await apiJson<{ success?: boolean; error?: string }>(
        '/api/registration/send-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalizedPhone, type: 'teacher', recaptchaToken }) }
      );
      if (otpRes.success) {
        setOtpSent(true);
        setOtp('');
        startResendTimer();
      } else {
        setError((otpRes as { error?: string }).error || 'Failed to send OTP');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed');
    } finally {
      setLoading(false);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiJson('/api/registration/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: normalizedPhone, otp: String(otp).trim(), type: 'teacher' }),
      });

      const checkRes = await apiJson<{
        exists?: boolean;
        step?: number;
        fullyRegistered?: boolean;
      }>('/api/teacher-registration/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      if (checkRes.fullyRegistered) {
        navigate('/?from=teacher-register');
      } else {
        const step = checkRes.step ?? checkResult?.step ?? 1;
        navigate(`/teacher/register/step/${step}?phone=${encodeURIComponent(normalizedPhone)}`);
      }
    } catch (err) {
      setError((err as Error).message || 'Verification failed');
    }
    setLoading(false);
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setCheckResult(null);
  };

  if (checkResult?.fullyRegistered) {
    return (
      <AuthPageLayout title="Become a Teacher" subtitle="You are already registered">
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 text-center">
          <p className="mb-4 text-lg font-semibold text-green-800">You are already registered on our portal.</p>
          <p className="mb-6 text-green-700">Please login to access your teacher dashboard.</p>
          <Link
            to="/?from=teacher-register"
            className="btn-primary inline-block"
          >
            <span className="btn-text">Login</span>
          </Link>
        </div>
        <p className="mt-6 text-center text-lg text-gray-600">
          Already have an account?{' '}
          <Link to="/" className="font-bold text-brand-600 underline underline-offset-2 hover:underline">
            Login
          </Link>
        </p>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="Become a Teacher" subtitle={otpSent ? 'Verify your phone number to continue' : 'Enter your phone number to start or continue'}>
      {skipped && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-base text-amber-800">
          You skipped the final step. Enter your number again to complete your registration.
        </div>
      )}
      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              required
              maxLength={10}
              className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          
          <div className="flex justify-center py-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            <span className="btn-text">{loading ? 'Sending OTP...' : 'Send OTP'}</span>
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
              onClick={handleChangeNumber}
              className="mt-2 text-base font-medium text-brand-600 hover:underline"
            >
              Change number
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!canResend || loading) return;
                setError('');
                setLoading(true);
                try {
                  const res = await apiJson<{ success?: boolean }>(
                    '/api/registration/send-otp',
                    { method: 'POST', body: JSON.stringify({ phone: normalizedPhone, type: 'teacher' }) }
                  );
                  if (res.success) startResendTimer();
                  else setError('Failed to resend OTP');
                } catch {
                  setError('Failed to resend OTP');
                }
                setLoading(false);
              }}
              disabled={!canResend || loading}
              className="text-base font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            >
              {canResend ? 'Resend OTP' : `Resend in ${secondsLeft}s`}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            <span className="btn-text">{loading ? 'Verifying...' : 'Verify & Continue'}</span>
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-lg text-gray-600">
        Already have an account?{' '}
        <Link to="/" className="font-bold text-brand-600 underline underline-offset-2 hover:underline">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
