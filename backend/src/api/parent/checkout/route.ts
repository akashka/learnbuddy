import mongoose from 'mongoose';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { PurchaseConsentLog } from '@/lib/models/PurchaseConsentLog';
import { getAuthFromRequest } from '@/lib/auth';
import { validateDiscountCode } from '@/lib/discount-utils';
import { getBatchOccupiedSeatCount, shouldHideBatchFromParents } from '@/lib/batch-seat-utils';
import { getEnrollmentSwitchContext } from '@/lib/enrollment-switch-validation';
import { computeSwitchProrata } from '@/lib/teacher-switch-prorata';

const DISCOUNTS: Record<string, number> = { '3months': 0, '6months': 5, '12months': 10 };
const CONSENT_VERSION = '1.0';

/**
 * Advance / renewal installment: extends existing enrollment period. Same billing length & discounts as original enrollment.
 * No new enrollment row; consents assumed from prior purchase (logged as renewal).
 */
async function handleRenewalCheckout(
  request: NextRequest,
  decoded: { userId: string },
  body: Record<string, unknown>
): Promise<Response> {
  const parent = await Parent.findOne({ userId: decoded.userId });
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

  if (body.replacesEnrollmentId) {
    return NextResponse.json({ error: 'Cannot combine renewal with teacher switch' }, { status: 400 });
  }

  let renewalEnrId: mongoose.Types.ObjectId;
  try {
    renewalEnrId = new mongoose.Types.ObjectId(String(body.renewalEnrollmentId));
  } catch {
    return NextResponse.json({ error: 'Invalid enrollment id' }, { status: 400 });
  }

  const enrollment = await Enrollment.findOne({
    _id: renewalEnrId,
    studentId: { $in: parent.children },
    paymentStatus: 'completed',
    status: 'active',
  }).lean();

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found or not eligible for renewal' }, { status: 400 });
  }

  const teacher = await Teacher.findById(enrollment.teacherId);
  if (!teacher || teacher.status !== 'qualified') {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const batchIndex = (teacher.batches || []).findIndex((b) => (b.name || '') === (enrollment.batchId || ''));
  if (batchIndex < 0) {
    return NextResponse.json({ error: 'Batch no longer available for this enrollment' }, { status: 400 });
  }
  const batch = teacher.batches[batchIndex];

  const durationNorm =
    enrollment.duration === '6months' || enrollment.duration === '12months'
      ? enrollment.duration
      : '3months';
  const months = durationNorm === '3months' ? 3 : durationNorm === '6months' ? 6 : 12;
  const amountAfterDuration = Math.round(
    (batch.feePerMonth ?? 0) * months * (1 - (DISCOUNTS[durationNorm] || 0) / 100)
  );

  let finalTotal = amountAfterDuration;
  let discountCodeUsed: string | undefined;
  let discountCodeIdUsed: string | undefined;
  let discountCodeAmountUsed: number | undefined;

  const discountCodeInput = body.discountCode;
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
    duration: durationNorm,
    discount: DISCOUNTS[durationNorm] ?? 0,
    totalAmount: (body.totalAmount as number | undefined) ?? finalTotal,
    discountCode: discountCodeUsed,
    discountCodeId: discountCodeIdUsed,
    discountCodeAmount: discountCodeAmountUsed,
    paymentStatus: 'pending',
    termsAccepted: true,
    platformTermsAccepted: true,
    refundPolicyAccepted: true,
    courseOwnershipRulesAccepted: true,
    teacherChangeCount: 0,
    intendedStudentId: enrollment.studentId as mongoose.Types.ObjectId,
    renewalOfEnrollmentId: renewalEnrId,
  });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
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
      metadata: { renewal: true, enrollmentId: String(renewalEnrId), teacherId: String(teacher._id), batchIndex },
    },
    {
      parentId: parent._id,
      pendingEnrollmentId: pending._id,
      consentType: 'refund_policy',
      version: CONSENT_VERSION,
      grantedAt: new Date(),
      ipAddress: ip,
      userAgent,
      metadata: { renewal: true, enrollmentId: String(renewalEnrId) },
    },
    {
      parentId: parent._id,
      pendingEnrollmentId: pending._id,
      consentType: 'course_ownership_rules',
      version: CONSENT_VERSION,
      grantedAt: new Date(),
      ipAddress: ip,
      userAgent,
      metadata: { renewal: true, enrollmentId: String(renewalEnrId) },
    },
  ]);

  return NextResponse.json({
    pendingId: pending._id,
    paymentUrl: `/parent/payment?pendingId=${pending._id}`,
    totalAmount: pending.totalAmount,
  });
}

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;

    if (body.renewalEnrollmentId) {
      return handleRenewalCheckout(request, decoded, body);
    }
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
      studentId: studentIdFromBody,
      checkoutChildProfile: checkoutChildProfileBody,
      replacesEnrollmentId: replacesEnrollmentIdRaw,
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
    if (!batch) {
      return NextResponse.json({ error: 'Batch not available' }, { status: 400 });
    }

    const maxStudents = batch.maxStudents ?? 3;
    const occupied = await getBatchOccupiedSeatCount(teacher._id, batchIndex, batch.name || '');
    if (shouldHideBatchFromParents(batch, occupied, maxStudents)) {
      return NextResponse.json(
        { error: 'This batch is not open for enrollment (full, closed, inactive, or starting within a week).' },
        { status: 400 }
      );
    }

    let intendedStudentId: mongoose.Types.ObjectId | undefined;
    let checkoutChildProfile: { name: string; classLevel: string; schoolName?: string } | undefined;
    let prorataBreakdown: Record<string, unknown> | undefined;
    let replacesEnrollmentId: mongoose.Types.ObjectId | undefined;

    const durationNorm =
      duration === '6months' || duration === '12months' ? duration : '3months';

    if (replacesEnrollmentIdRaw) {
      const sw = await getEnrollmentSwitchContext({
        parentUserId: decoded.userId,
        replacesEnrollmentId: String(replacesEnrollmentIdRaw),
        newTeacherId: String(teacherId),
        batchIndex: Number(batchIndex),
      });
      if (sw.ok === false) {
        return NextResponse.json({ error: sw.message }, { status: sw.status });
      }
      const forcedStudentId = sw.data.oldEnrollment.studentId;
      if (studentIdFromBody && String(studentIdFromBody) !== String(forcedStudentId)) {
        return NextResponse.json(
          { error: 'Teacher switch must use the same learner as the current enrollment.' },
          { status: 400 }
        );
      }
      intendedStudentId = forcedStudentId;
      replacesEnrollmentId = new mongoose.Types.ObjectId(String(replacesEnrollmentIdRaw));

      const oldFee = sw.data.oldEnrollment.feePerMonth ?? 0;
      const newFee = batch.feePerMonth ?? 0;
      const prorata = computeSwitchProrata({
        oldFeeMonthly: oldFee,
        newFeeMonthly: newFee,
        duration: durationNorm,
      });
      const oldT = await Teacher.findById(sw.data.oldEnrollment.teacherId).select('name').lean();
      prorataBreakdown = {
        ...prorata,
        oldTeacherId: String(sw.data.oldEnrollment.teacherId),
        newTeacherId: String(teacher._id),
        oldTeacherName: oldT?.name,
        newTeacherName: teacher.name,
        replacesEnrollmentId: String(replacesEnrollmentIdRaw),
      };
    } else if (studentIdFromBody) {
      const child = await Student.findOne({ _id: studentIdFromBody, parentId: parent._id });
      if (!child) {
        return NextResponse.json({ error: 'Selected student not found or not linked to your account' }, { status: 400 });
      }
      intendedStudentId = child._id;
    } else if (checkoutChildProfileBody && typeof checkoutChildProfileBody === 'object') {
      const nm = String(checkoutChildProfileBody.name || '').trim();
      const cl = String(checkoutChildProfileBody.classLevel || '').trim();
      if (nm && cl) {
        checkoutChildProfile = {
          name: nm,
          classLevel: cl,
          schoolName: checkoutChildProfileBody.schoolName
            ? String(checkoutChildProfileBody.schoolName).trim()
            : undefined,
        };
      }
    }

    if (!intendedStudentId && !checkoutChildProfile) {
      return NextResponse.json(
        { error: 'Please select a learner for this enrollment before checkout.' },
        { status: 400 }
      );
    }

    const months = durationNorm === '3months' ? 3 : durationNorm === '6months' ? 6 : 12;
    let amountAfterDuration = Math.round(batch.feePerMonth * months * (1 - (DISCOUNTS[durationNorm] || 0) / 100));
    if (prorataBreakdown) {
      amountAfterDuration = (prorataBreakdown.subtotalAfterCredit as number) ?? amountAfterDuration;
    }
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
      duration: durationNorm,
      discount: discount ?? DISCOUNTS[durationNorm] ?? 0,
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
      intendedStudentId,
      checkoutChildProfile,
      replacesEnrollmentId,
      prorataBreakdown,
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
