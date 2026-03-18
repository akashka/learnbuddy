import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Enrollment } from '@/lib/models/Enrollment';
import { PurchaseConsentLog } from '@/lib/models/PurchaseConsentLog';
import { getAuthFromRequest } from '@/lib/auth';
import { validateDiscountCode } from '@/lib/discount-utils';

const DISCOUNTS: Record<string, number> = { '3months': 0, '6months': 5, '12months': 10 };
const CONSENT_VERSION = '1.0';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const {
      teacherId,
      batchIndex,
      duration,
      totalAmount,
      feePerMonth,
      discount,
      discountCode: discountCodeInput,
      termsAccepted,
      platformTermsAccepted,
      refundPolicyAccepted,
      courseOwnershipRulesAccepted,
    } = body;

    if (!teacherId || batchIndex === undefined) {
      return NextResponse.json({ error: 'Teacher and batch required' }, { status: 400 });
    }

    const pt = platformTermsAccepted === true;
    const rp = refundPolicyAccepted === true;
    const co = courseOwnershipRulesAccepted === true;

    if (!pt || !rp || !co) {
      return NextResponse.json(
        {
          error: 'You must accept Platform Terms, Refund Policy, and Course Ownership Rules to proceed with the purchase.',
          required: { platformTermsAccepted: !pt, refundPolicyAccepted: !rp, courseOwnershipRulesAccepted: !co },
        },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher || teacher.status !== 'qualified') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const batch = teacher.batches[batchIndex];
    if (!batch || !batch.isActive) {
      return NextResponse.json({ error: 'Batch not available' }, { status: 400 });
    }

    const maxStudents = batch.maxStudents ?? 3;
    const enrolledCount = await Enrollment.countDocuments({
      teacherId: teacher._id,
      batchId: batch.name,
      status: 'active',
    });
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const blockedCount = await PendingEnrollment.countDocuments({
      teacherId: teacher._id,
      batchIndex,
      $or: [
        { paymentStatus: 'completed', convertedToEnrollmentId: null },
        { paymentStatus: 'pending', createdAt: { $gte: fifteenMinAgo } },
      ],
    });
    if (enrolledCount + blockedCount >= maxStudents) {
      return NextResponse.json({ error: 'Batch is full. All seats are taken or reserved.' }, { status: 400 });
    }

    const months = duration === '3months' ? 3 : duration === '6months' ? 6 : 12;
    let amountAfterDuration = Math.round(batch.feePerMonth * months * (1 - (DISCOUNTS[duration] || 0) / 100));
    let finalTotal = amountAfterDuration;
    let discountCodeUsed: string | undefined;
    let discountCodeIdUsed: string | undefined;
    let discountCodeAmountUsed: number | undefined;

    if (discountCodeInput && String(discountCodeInput).trim()) {
      const validation = await validateDiscountCode({
        code: String(discountCodeInput).trim(),
        amountBeforeCode: amountAfterDuration,
        board: batch.board || '',
        classLevel: batch.classLevel || '',
      });
      if (validation.valid && validation.finalAmount != null && validation.discountAmount != null) {
        finalTotal = validation.finalAmount;
        discountCodeUsed = validation.discountCode;
        discountCodeIdUsed = validation.discountCodeId;
        discountCodeAmountUsed = validation.discountAmount;
      }
    }

    const pending = await PendingEnrollment.create({
      parentId: parent._id,
      teacherId: teacher._id,
      batchIndex,
      subject: batch.subject,
      board: batch.board,
      classLevel: batch.classLevel,
      slots: batch.slots,
      feePerMonth: batch.feePerMonth,
      duration: duration || '3months',
      discount: discount ?? DISCOUNTS[duration] ?? 0,
      totalAmount: totalAmount ?? finalTotal,
      discountCode: discountCodeUsed,
      discountCodeId: discountCodeIdUsed,
      discountCodeAmount: discountCodeAmountUsed,
      paymentStatus: 'pending',
      termsAccepted: true,
      platformTermsAccepted: pt,
      refundPolicyAccepted: rp,
      courseOwnershipRulesAccepted: co,
      teacherChangeCount: 0,
    });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    await PurchaseConsentLog.insertMany([
      {
        parentId: parent._id,
        pendingEnrollmentId: pending._id,
        consentType: 'platform_terms',
        version: CONSENT_VERSION,
        grantedAt: new Date(),
        ipAddress: ip,
        userAgent,
        metadata: { teacherId: String(teacher._id), batchIndex, subject: batch.subject },
      },
      {
        parentId: parent._id,
        pendingEnrollmentId: pending._id,
        consentType: 'refund_policy',
        version: CONSENT_VERSION,
        grantedAt: new Date(),
        ipAddress: ip,
        userAgent,
        metadata: { teacherId: String(teacher._id), batchIndex, subject: batch.subject },
      },
      {
        parentId: parent._id,
        pendingEnrollmentId: pending._id,
        consentType: 'course_ownership_rules',
        version: CONSENT_VERSION,
        grantedAt: new Date(),
        ipAddress: ip,
        userAgent,
        metadata: { teacherId: String(teacher._id), batchIndex, subject: batch.subject },
      },
    ]);

    return NextResponse.json({
      pendingId: pending._id,
      paymentUrl: `/parent/payment?pendingId=${pending._id}`,
      totalAmount: pending.totalAmount,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
