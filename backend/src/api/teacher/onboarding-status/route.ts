import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
    if (!teacher) return NextResponse.json({ checklist: [], allDone: false });

    const signed = teacher.signedAgreements || [];
    const hasCommission = signed.some((s) => s.type === 'commission_model');
    const hasPaymentTerms = signed.some((s) => s.type === 'payment_terms');
    const hasConductRules = signed.some((s) => s.type === 'conduct_rules');
    const allAgreementsSigned = hasCommission && hasPaymentTerms && hasConductRules;

    const items: ChecklistItem[] = [
      {
        id: 'basic',
        label: 'Enter basic details',
        done: !!(teacher.name?.trim() && teacher.phone),
        href: '/teacher/profile',
        cta: 'Complete profile',
      },
      {
        id: 'agreements',
        label: 'Sign agreements (Commission Model, Payment Terms, Conduct Rules)',
        done: allAgreementsSigned,
        href: '/teacher/agreements',
        cta: 'Sign agreements',
      },
      {
        id: 'teaching',
        label: 'Enter teaching details',
        done: !!(
          (teacher.board?.length ?? 0) > 0 &&
          (teacher.classes?.length ?? 0) > 0 &&
          (teacher.subjects?.length ?? 0) > 0
        ),
        href: '/teacher/profile',
        cta: 'Update teaching details',
      },
      {
        id: 'documents',
        label: 'Upload documents',
        done: (teacher.documents?.length ?? 0) > 0,
        href: '/teacher/profile',
        cta: 'Upload documents',
      },
      {
        id: 'bank',
        label: 'Enter bank details',
        done: !!(
          teacher.bankDetails?.accountNumber &&
          teacher.bankDetails?.ifsc &&
          teacher.bankDetails?.bankName
        ),
        href: '/teacher/payments',
        cta: 'Add bank details',
      },
      {
        id: 'batches',
        label: 'Create minimum one batch',
        done: (teacher.batches?.length ?? 0) > 0,
        href: '/teacher/batches',
        cta: 'Create batch',
      },
      {
        id: 'demo',
        label: 'Upload demo video',
        done: !!(teacher.demoVideoUrl?.trim()),
        href: '/teacher/profile',
        cta: 'Upload demo video',
      },
      {
        id: 'complete',
        label: 'Update complete details (about me, experience, qualification)',
        done: !!(
          teacher.bio?.trim() &&
          teacher.qualification?.trim()
        ),
        href: '/teacher/profile',
        cta: 'Complete profile',
      },
      {
        id: 'photo',
        label: 'Add profile photo',
        done: !!(teacher.photoUrl?.trim()),
        href: '/teacher/profile',
        cta: 'Add photo',
      },
    ];

    const allDone = items.every((i) => i.done);

    return NextResponse.json({ checklist: items, allDone });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
