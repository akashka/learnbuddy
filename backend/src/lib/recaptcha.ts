import { NextRequest } from './next-compat';

export async function verifyRecaptcha(token: string, request?: NextRequest): Promise<{ success: boolean; score?: number; error?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('RECAPTCHA_SECRET_KEY is missing in production!');
      return { success: false, error: 'Configuration error' };
    }
    console.warn('RECAPTCHA_SECRET_KEY is missing. Skipping verification in development.');
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'reCAPTCHA token is required' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}${request ? `&remoteip=${request.headers.get('x-forwarded-for')?.split(',')[0] || ''}` : ''}`,
    });

    const data = (await response.json()) as { success: boolean; score?: number; 'error-codes'?: string[] };
    
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Internal server error during verification' };
  }
}
