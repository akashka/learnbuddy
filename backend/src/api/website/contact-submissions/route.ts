import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ContactSubmission } from '@/lib/models/ContactSubmission';

/** Public: Submit contact form (concern, suggestion, feedback, etc.) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name as string;
    const email = body.email as string;
    const phone = (body.phone as string) || '';
    const type = (body.type as string) || 'other';
    const subject = body.subject as string;
    const message = body.message as string;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    const validTypes = ['concern', 'suggestion', 'feedback', 'other'];
    const submissionType = validTypes.includes(type) ? type : 'other';

    await connectDB();
    const submission = await ContactSubmission.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      type: submissionType,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
    });

    return NextResponse.json({
      message: 'Thank you! Your submission has been received. Our team will get back to you soon.',
      id: submission._id.toString(),
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
