import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { CmsPage } from '@/lib/models/CmsPage';
import { getAuthFromRequest } from '@/lib/auth';

const AGREEMENT_TYPES = [
  { type: 'commission_model', slug: 'teacher-commission-model', label: 'Commission Model Agreement' },
  { type: 'payment_terms', slug: 'teacher-payment-terms', label: 'Payment Terms' },
  { type: 'conduct_rules', slug: 'teacher-conduct-rules', label: 'Code of Conduct' },
] as const;

/** GET - List agreements with content and signed status */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const signed = (teacher.signedAgreements || []).reduce(
      (acc: Record<string, { version: string; signedAt: string; ipAddress?: string }>, a) => {
        acc[a.type] = {
          version: a.version,
          signedAt: a.signedAt?.toISOString() || '',
          ipAddress: a.ipAddress,
        };
        return acc;
      },
      {}
    );

    const agreements: { type: string; label: string; content: string; signed?: { version: string; signedAt: string; ipAddress?: string } }[] = [];

    for (const a of AGREEMENT_TYPES) {
      const page = await CmsPage.findOne({ slug: a.slug }).lean();
      agreements.push({
        type: a.type,
        label: a.label,
        content: (page as { content?: string })?.content || '',
        signed: signed[a.type],
      });
    }

    return NextResponse.json({
      agreements,
      commissionPercent: teacher.commissionPercent ?? 10,
    });
  } catch (error) {
    console.error('Teacher agreements get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
