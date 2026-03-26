import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { incrementDiscountCodeUsage } from '@/lib/discount-utils';
import { User } from '@/lib/models/User';
import { Parent } from '@/lib/models/Parent';
import { hashPassword } from '@/lib/auth';
import { verifyDocumentPhoto } from '@/lib/ai';
import { addJob, JOB_NAMES } from '@/lib/queue';
import { logAIUsage } from '@/lib/ai-audit';
import { createNotification } from '@/lib/notification-service';
import { sendTemplatedEmail } from '@/lib/mailgun-service';

/** Batch start date: min = tomorrow, max = 30 days from today */
function getValidBatchStartDate(batchStartDate?: Date | string | null): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (batchStartDate) {
    const d = new Date(batchStartDate);
    d.setHours(0, 0, 0, 0);
    if (d >= minDate && d <= maxDate) return d;
  }
  return minDate;
}

function generateStudentId(): string {
  return 'STU' + Date.now().toString(36).toUpperCase().slice(-6);
}

export type FinalizePendingEnrollmentBody = {
  pendingId: string;
  parentUserId: string;
  /** From POST /student-details — optional when using checkout-only data */
  studentId?: string;
  name?: string;
  classLevel?: string;
  schoolName?: string;
  photoUrl?: string;
  idProofUrl?: string;
};

export type FinalizePendingEnrollmentResult = {
  enrollmentId: string;
  studentMongoId: string;
  studentDisplayId: string;
  alreadyFinalized: boolean;
  message: string;
};

/**
 * Creates Enrollment + links student after payment. Idempotent if `convertedToEnrollmentId` is set.
 * Used by payment/complete (checkout already selected student) and legacy POST /student-details.
 */
export async function finalizePendingEnrollment(
  input: FinalizePendingEnrollmentBody
): Promise<FinalizePendingEnrollmentResult> {
  await connectDB();
  const { pendingId, parentUserId } = input;

  const pending = await PendingEnrollment.findById(pendingId).populate('teacherId');
  if (!pending) {
    throw new Error('Pending enrollment not found');
  }

  if (pending.paymentStatus !== 'completed') {
    throw new Error('Payment is not completed for this enrollment');
  }

  const parent = await Parent.findOne({ userId: parentUserId });
  if (!parent || pending.parentId.toString() !== parent._id.toString()) {
    throw new Error('Unauthorized');
  }

  if (pending.convertedToEnrollmentId) {
    const existingEnr = await Enrollment.findById(pending.convertedToEnrollmentId).lean();
    const stu = existingEnr?.studentId
      ? await Student.findById(existingEnr.studentId).lean()
      : null;
    return {
      enrollmentId: String(pending.convertedToEnrollmentId),
      studentMongoId: stu?._id ? String(stu._id) : '',
      studentDisplayId: stu?.studentId || String(stu?._id || ''),
      alreadyFinalized: true,
      message: 'Enrollment already active.',
    };
  }

  const renewalOfId = (pending as { renewalOfEnrollmentId?: mongoose.Types.ObjectId }).renewalOfEnrollmentId;
  if (renewalOfId) {
    if (!pending.intendedStudentId) {
      throw new Error('Renewal checkout is missing the learner link.');
    }
    const enr = await Enrollment.findOne({
      _id: renewalOfId,
      studentId: pending.intendedStudentId,
      paymentStatus: 'completed',
      status: 'active',
    }).lean();
    if (!enr) {
      throw new Error('Enrollment not found for this renewal.');
    }
    if (String(enr.studentId) !== String(pending.intendedStudentId)) {
      throw new Error('Unauthorized');
    }
    const childOk = parent.children.some((c) => String(c) === String(pending.intendedStudentId));
    if (!childOk) {
      throw new Error('Unauthorized');
    }

    const months = pending.duration === '3months' ? 3 : pending.duration === '6months' ? 6 : 12;
    const newEnd = new Date(enr.endDate || new Date());
    newEnd.setMonth(newEnd.getMonth() + months);

    await Enrollment.findByIdAndUpdate(renewalOfId, {
      $set: {
        endDate: newEnd,
        paymentId: pending.paymentId,
        totalAmount: (enr.totalAmount ?? 0) + (pending.totalAmount ?? 0),
      },
    });

    await PendingEnrollment.findByIdAndUpdate(pendingId, {
      convertedToEnrollmentId: renewalOfId,
    });

    if (pending.discountCodeId) {
      incrementDiscountCodeUsage(pending.discountCodeId).catch((err) =>
        console.error('Discount code usage increment error:', err)
      );
    }

    addJob(JOB_NAMES.ENROLLMENT_CONFIRMATION, { enrollmentId: String(renewalOfId) }).catch((err) =>
      console.error('Enqueue enrollment confirmation after renewal:', err)
    );

    const stu = await Student.findById(enr.studentId).lean();
    return {
      enrollmentId: String(renewalOfId),
      studentMongoId: String(enr.studentId),
      studentDisplayId: stu?.studentId || String(stu?._id || ''),
      alreadyFinalized: false,
      message: 'Renewal confirmed — your course period has been extended.',
    };
  }

  const teacher = pending.teacherId as unknown as {
    batches: {
      name?: string;
      subject: string;
      board: string;
      classLevel: string;
      feePerMonth: number;
      slots: unknown[];
      startDate?: Date;
    }[];
  };
  const batch = teacher?.batches?.[pending.batchIndex];
  if (!batch) {
    throw new Error('Batch not found');
  }

  const existingStudentIdFromBody = input.studentId;
  const resolvedStudentId =
    existingStudentIdFromBody || (pending.intendedStudentId ? String(pending.intendedStudentId) : undefined);
  const cp = pending.checkoutChildProfile as { name?: string; classLevel?: string; schoolName?: string } | undefined;
  const resolvedName = (input.name || cp?.name || '').trim();
  const resolvedClass = (input.classLevel || cp?.classLevel || '').trim();
  const resolvedSchool = input.schoolName ?? cp?.schoolName;

  let student: { _id: mongoose.Types.ObjectId };
  let studentIdStr: string;

  if (resolvedStudentId) {
    const existing = await Student.findOne({ _id: resolvedStudentId, parentId: parent._id });
    if (!existing) {
      throw new Error('Student not found or not linked to your account');
    }
    student = existing;
    studentIdStr = existing.studentId || String(existing._id);
  } else if (resolvedName && resolvedClass) {
    const newStudentId = generateStudentId();
    const tempPassword = 'Temp' + Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);

    const user = await User.create({
      email: `${newStudentId.toLowerCase()}@guruchakra.local`,
      password: hashedPassword,
      role: 'student',
    });

    const newStudent = await Student.create({
      studentId: newStudentId,
      userId: user._id,
      parentId: parent._id,
      name: resolvedName,
      classLevel: resolvedClass,
      schoolName: resolvedSchool,
      photoUrl: input.photoUrl,
      idProofUrl: input.idProofUrl,
      board: batch.board || 'CBSE',
      enrollments: [],
    });

    await Parent.findByIdAndUpdate(parent._id, { $push: { children: newStudent._id } });
    student = newStudent;
    studentIdStr = newStudentId;

    let aiVerified = true;
    if (input.photoUrl && input.idProofUrl) {
      const start = Date.now();
      let verification: string;
      try {
        verification = await verifyDocumentPhoto(input.idProofUrl, input.photoUrl);
      } catch (err) {
        await logAIUsage({
          operationType: 'verify_document_photo',
          userId: parentUserId,
          userRole: 'parent',
          entityType: 'student',
          inputMetadata: {},
          durationMs: Date.now() - start,
          success: false,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      }
      await logAIUsage({
        operationType: 'verify_document_photo',
        userId: parentUserId,
        userRole: 'parent',
        entityType: 'student',
        inputMetadata: {},
        outputMetadata: { result: verification },
        durationMs: Date.now() - start,
        success: true,
      });
      aiVerified = verification === 'verified' || verification === 'partially_verified';
    }
    await PendingEnrollment.findByIdAndUpdate(pendingId, {
      studentDetails: {
        name: resolvedName,
        classLevel: resolvedClass,
        schoolName: resolvedSchool,
        photoUrl: input.photoUrl,
        idProofUrl: input.idProofUrl,
        aiVerified,
      },
    });
  } else {
    throw new Error(
      'No learner linked to this checkout. Select a student before payment, or complete student details (name & class).'
    );
  }

  const months = pending.duration === '3months' ? 3 : pending.duration === '6months' ? 6 : 12;
  const startDate = getValidBatchStartDate(batch.startDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  const replacesId = (pending as { replacesEnrollmentId?: mongoose.Types.ObjectId }).replacesEnrollmentId;
  let previousTeacherChangeCount = 0;
  if (replacesId) {
    const oldEnr = await Enrollment.findOne({
      _id: replacesId,
      studentId: student._id,
      paymentStatus: 'completed',
      status: 'active',
    });
    if (!oldEnr) {
      throw new Error('Original enrollment could not be replaced. Please contact support.');
    }
    previousTeacherChangeCount = oldEnr.teacherChangeCount ?? 0;
    await Enrollment.findByIdAndUpdate(oldEnr._id, { status: 'cancelled' });
    await Student.findByIdAndUpdate(student._id, { $pull: { enrollments: oldEnr._id } });
  }

  const enrollment = await Enrollment.create({
    studentId: student._id,
    teacherId: pending.teacherId,
    batchId: batch.name || 'Batch 1',
    subject: batch.subject,
    board: batch.board,
    classLevel: batch.classLevel,
    slots: (batch.slots || []) as { day: string; startTime: string; endTime: string }[],
    feePerMonth: batch.feePerMonth,
    duration: pending.duration,
    discount: pending.discount,
    totalAmount: pending.totalAmount,
    discountCode: pending.discountCode,
    discountCodeId: pending.discountCodeId,
    discountCodeAmount: pending.discountCodeAmount,
    paymentStatus: 'completed',
    paymentId: pending.paymentId,
    status: 'active',
    startDate,
    endDate,
    teacherChangeCount: replacesId ? previousTeacherChangeCount + 1 : 0,
  });

  await Student.findByIdAndUpdate(student._id, { $push: { enrollments: enrollment._id } });

  await PendingEnrollment.findByIdAndUpdate(pendingId, {
    convertedToEnrollmentId: enrollment._id,
  });

  if (pending.discountCodeId) {
    incrementDiscountCodeUsage(pending.discountCodeId).catch((err) =>
      console.error('Discount code usage increment error:', err)
    );
  }

  addJob(JOB_NAMES.ENROLLMENT_CONFIRMATION, { enrollmentId: String(enrollment._id) }).catch((err) =>
    console.error('Enqueue enrollment confirmation after enrollment:', err)
  );

  const teacherIdRef = (pending.teacherId as { _id?: mongoose.Types.ObjectId })?._id ?? pending.teacherId;
  const teacherDoc = await Teacher.findById(teacherIdRef).select('userId').lean();
  const studentDoc = await Student.findById(student._id).select('name').lean();
  const studentName = studentDoc?.name || 'A student';
  const subject = batch.subject || 'batch';
  if (teacherDoc?.userId) {
    createNotification({
      userId: teacherDoc.userId as mongoose.Types.ObjectId,
      type: 'course_purchased',
      title: 'New student enrolled!',
      message: `${studentName} has joined your ${subject} batch.`,
      ctaLabel: 'View Classes',
      ctaUrl: '/teacher/classes',
      entityType: 'enrollment',
      entityId: String(enrollment._id),
    }).catch((err) => console.error('Notification error:', err));
    const teacherUser = await User.findById(teacherDoc.userId).select('email').lean();
    const teacherEmail = (teacherUser as { email?: string })?.email;
    if (teacherEmail) {
      const appUrl = process.env.APP_URL || process.env.BACKEND_URL || 'https://guruchakra.com';
      sendTemplatedEmail({
        to: teacherEmail,
        templateCode: 'course_purchased',
        variables: { studentName, subject, ctaUrl: `${appUrl}/teacher/classes` },
      }).catch((err) => console.error('Email error:', err));
    }
  }

  return {
    enrollmentId: String(enrollment._id),
    studentMongoId: String(student._id),
    studentDisplayId: studentIdStr,
    alreadyFinalized: false,
    message: resolvedStudentId
      ? 'Course linked to your learner successfully.'
      : 'Enrollment complete. Student can log in with Learner ID and password.',
  };
}
