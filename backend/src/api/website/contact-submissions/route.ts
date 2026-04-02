import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ContactSubmission } from '@/lib/models/ContactSubmission';
import { sendTemplatedEmail } from '@/lib/mailgun-service';
import { verifyRecaptcha } from '@/lib/recaptcha';

/** Public: Submit contact form (concern, suggestion, feedback, etc.) */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; phone?: string; type?: string; subject?: string; message?: string; recaptchaToken?: string };
    
    const recaptcha = await verifyRecaptcha(body.recaptchaToken || '', request);
    if (!recaptcha.success) {
      return NextResponse.json({ error: recaptcha.error || 'reCAPTCHA verification failed' }, { status: 400 });
    }

    const name = (body.name as string)?.trim() || '';
    const email = (body.email as string)?.trim() || '';
    const phone = (body.phone as string)?.trim() || '';
    const type = (body.type as string) || 'other';
    const subject = (body.subject as string)?.trim() || '';
    const message = (body.message as string)?.trim() || '';

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    const validTypes = ['concern', 'suggestion', 'feedback', 'other'];
    const submissionType = validTypes.includes(type) ? type : 'other';

    await connectDB();
    const submission = await ContactSubmission.create({
      name,
      email,
      phone: phone || undefined,
      type: submissionType,
      subject,
      message,
      status: 'open',
    });

    sendTemplatedEmail({
      to: email,
      templateCode: 'contact_form_confirmation',
      variables: { name, subject },
    }).catch((err) => console.error('[Contact] Confirmation email failed:', err));

    return NextResponse.json({
      message: 'Thank you! Your submission has been received. Our team will get back to you soon.',
      id: submission._id.toString(),
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
