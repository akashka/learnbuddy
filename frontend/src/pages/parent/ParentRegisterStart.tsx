import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useResendOtpTimer } from '@/hooks/useResendOtpTimer';

export default function ParentRegisterStart() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { secondsLeft, canResend, start: startResendTimer } = useResendOtpTimer();

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiJson<{ exists?: boolean; isComplete?: boolean; redirect?: string }>(
        '/api/parent-registration/check-phone',
        { method: 'POST', body: JSON.stringify({ phone }) }
      );
      if (res.isComplete && res.redirect) {
        navigate('/parent/dashboard');
        return;
      }
      const normalized = String(phone).replace(/\D/g, '').slice(-10);
      setExisting(res.exists ?? false);
      const otpRes = await apiJson<{ success?: boolean; error?: string }>(
        '/api/registration/send-otp',
        { method: 'POST', body: JSON.stringify({ phone: normalized, type: 'parent' }) }
      );
      if (otpRes.success) {
        setStep('otp');
        startResendTimer();
      } else {
        setError((otpRes as { error?: string }).error || 'Failed to send OTP');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to check phone');
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
        { method: 'POST', body: JSON.stringify({ phone: normalized, type: 'parent' }) }
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
        { method: 'POST', body: JSON.stringify({ phone: normalized, otp: otp.trim(), type: 'parent' }) }
      );
      navigate('/parent/register/form', { state: { phone: normalized, existing } });
    } catch (err) {
      setError((err as Error).message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    const normalized = String(phone).replace(/\D/g, '').slice(-4);
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-brand-800">Verify Phone</h1>
        <p className="mb-4 text-sm text-gray-600">
          OTP sent to ******{normalized}. Enter the 6-digit code.
        </p>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
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
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="mt-4 w-full text-sm text-brand-600 hover:underline"
        >
          Change phone number
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Parent Registration</h1>
      <form onSubmit={handleSubmitPhone} className="space-y-4">
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
    </div>
  );
}
