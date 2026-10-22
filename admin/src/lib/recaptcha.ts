/** Public reCAPTCHA site key. It is meant to be embedded in the client. */
const FALLBACK_SITE_KEY = '6Ld9Gp8sAAAAAPYgHKZQqKJC8dUhYm1MRAvKpc62';

export const recaptchaSiteKey =
  (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() || FALLBACK_SITE_KEY;
