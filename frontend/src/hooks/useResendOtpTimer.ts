import { useState, useEffect, useCallback } from 'react';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Hook for OTP resend countdown. Call start() when OTP is sent.
 * Returns secondsLeft, canResend, and start function.
 */
export function useResendOtpTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const start = useCallback(() => {
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  }, []);

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    start,
  };
}
