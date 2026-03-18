import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') setStatus('success');
    else if (error) setStatus('error');
    else setStatus('loading');
  }, [success, error]);

  const errorMessages: Record<string, string> = {
    missing_token: 'Verification link is invalid.',
    invalid_or_expired: 'Verification link has expired or is invalid.',
    failed: 'Verification failed. Please try again.',
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-lg text-center">
      {status === 'success' && (
        <>
          <div className="mb-4 text-5xl">✓</div>
          <h1 className="mb-2 text-xl font-bold text-brand-800">Email Verified</h1>
          <p className="mb-6 text-gray-600">Your email has been verified successfully.</p>
          <Link to="/parent/dashboard" className="text-brand-600 hover:underline">
            Go to Dashboard
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-4 text-5xl text-red-500">✕</div>
          <h1 className="mb-2 text-xl font-bold text-brand-800">Verification Failed</h1>
          <p className="mb-6 text-gray-600">
            {errorMessages[error || ''] || 'Something went wrong.'}
          </p>
          <Link to="/parent/dashboard" className="text-brand-600 hover:underline">
            Go to Dashboard
          </Link>
        </>
      )}
      {status === 'loading' && (
        <p className="text-gray-600">Verifying...</p>
      )}
    </div>
  );
}
