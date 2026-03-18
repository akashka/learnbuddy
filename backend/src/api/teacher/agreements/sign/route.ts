import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

const VALID_TYPES = ['commission_model', 'payment_terms', 'conduct_rules'] as const;
const VERSION = '1.0';

/** POST - Sign an agreement */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { type } = body;

    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json(
        { error: 'type must be one of: commission_model, payment_terms, conduct_rules' },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const signed = teacher.signedAgreements || [];
    if (signed.some((s) => s.type === type)) {
      return NextResponse.json({ error: 'Agreement already signed' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;

    const newEntry = { type, version: VERSION, signedAt: new Date(), ipAddress: ip };
    await Teacher.findByIdAndUpdate(teacher._id, {
      $push: { signedAgreements: newEntry },
    });

    return NextResponse.json({
      success: true,
      message: 'Agreement signed successfully',
      signed: { type, version: VERSION, signedAt: newEntry.signedAt.toISOString() },
    });
  } catch (error) {
    console.error('Teacher agreement sign error:', error);
    return NextResponse.json({ error: 'Failed to sign' }, { status: 500 });
  }
}
