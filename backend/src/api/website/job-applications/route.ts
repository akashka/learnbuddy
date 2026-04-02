import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobApplication } from '@/lib/models/JobApplication';
import { JobPosition } from '@/lib/models/JobPosition';
import { verifyRecaptcha } from '@/lib/recaptcha';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

/** Public: Submit job application. Expects multipart/form-data: name, email, phone, positionId, coverLetter (optional), resume (file), recaptchaToken. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const positionId = formData.get('positionId') as string;
    const coverLetter = (formData.get('coverLetter') as string) || '';
    const resumeFile = formData.get('resume') as File | null;
    const recaptchaToken = formData.get('recaptchaToken') as string;

    const recaptcha = await verifyRecaptcha(recaptchaToken, request);
    if (!recaptcha.success) {
      return NextResponse.json({ error: recaptcha.error || 'reCAPTCHA verification failed' }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !positionId) {
      return NextResponse.json(
        { error: 'Name, email, phone, and position are required' },
        { status: 400 }
      );
    }
    if (!resumeFile || resumeFile.size === 0) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Resume must be PDF or Word document' }, { status: 400 });
    }
    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume must be under 10MB' }, { status: 400 });
    }

    await connectDB();
    const position = await JobPosition.findById(positionId).lean();
    if (!position || position.status !== 'open') {
      return NextResponse.json({ error: 'Position not found or closed' }, { status: 404 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = resumeFile.name ? path.extname(resumeFile.name) : '.pdf';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    await writeFile(filepath, buffer);

    const resumeUrl = `/api/uploads/${filename}`;

    const app = await JobApplication.create({
      positionId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      resumeUrl,
      coverLetter: coverLetter.trim(),
      status: 'new',
    });

    return NextResponse.json({
      message: 'Application submitted successfully',
      id: app._id.toString(),
    });
  } catch (error) {
    console.error('Job application submit error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
