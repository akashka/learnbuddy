import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { incrementDiscountCodeUsage } from '@/lib/discount-utils';
import { User } from '@/lib/models/User';
import { Parent } from '@/lib/models/Parent';
import { hashPassword, getAuthFromRequest } from '@/lib/auth';
import { verifyDocumentPhoto } from '@/lib/ai';
import { generateClassSchedules } from '@/lib/generate-class-schedules';
import { logAIUsage } from '@/lib/ai-audit';

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

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { pendingId, studentId: existingStudentId, name, classLevel, schoolName, photoUrl, idProofUrl } = body;

    if (!pendingId) {
      return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
    }

    const pending = await PendingEnrollment.findById(pendingId).populate('teacherId');
    if (!pending || pending.paymentStatus !== 'completed') {
      return NextResponse.json({ error: 'Invalid or unpaid enrollment' }, { status: 400 });
    }

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent || pending.parentId.toString() !== parent._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = pending.teacherId as unknown as { batches: { name?: string; subject: string; board: string; classLevel: string; feePerMonth: number; slots: unknown[]; startDate?: Date }[] };
    const batch = teacher?.batches?.[pending.batchIndex];
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 400 });
    }

    let student: { _id: mongoose.Types.ObjectId };
    let studentIdStr: string;

    if (existingStudentId) {
      const existing = await Student.findOne({ _id: existingStudentId, parentId: parent._id });
      if (!existing) return NextResponse.json({ error: 'Student not found or not yours' }, { status: 404 });
      student = existing;
      studentIdStr = existing.studentId || String(existing._id);
    } else if (name && classLevel) {
      const newStudentId = generateStudentId();
      const tempPassword = 'Temp' + Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(tempPassword);

      const user = await User.create({
        email: `${newStudentId.toLowerCase()}@learnbuddy.local`,
        password: hashedPassword,
        role: 'student',
      });

      const newStudent = await Student.create({
        studentId: newStudentId,
        userId: user._id,
        parentId: parent._id,
        name,
        classLevel,
        schoolName,
        photoUrl,
        idProofUrl,
        board: batch.board || 'CBSE',
        enrollments: [],
      });

      await Parent.findByIdAndUpdate(parent._id, { $push: { children: newStudent._id } });
      student = newStudent;
      studentIdStr = newStudentId;

      let aiVerified = true;
      if (photoUrl && idProofUrl) {
        const start = Date.now();
        let verification: string;
        try {
          verification = await verifyDocumentPhoto(idProofUrl, photoUrl);
        } catch (err) {
          await logAIUsage({
            operationType: 'verify_document_photo',
            userId: decoded.userId,
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
          userId: decoded.userId,
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
        studentDetails: { name, classLevel, schoolName, photoUrl, idProofUrl, aiVerified },
      });
    } else {
      return NextResponse.json({ error: 'Either studentId (existing) or name and classLevel (new student) required' }, { status: 400 });
    }

    const months = pending.duration === '3months' ? 3 : pending.duration === '6months' ? 6 : 12;
    const startDate = getValidBatchStartDate(batch.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

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
    });

    await Student.findByIdAndUpdate(student._id, { $push: { enrollments: enrollment._id } });

    if (pending.discountCodeId) {
      incrementDiscountCodeUsage(pending.discountCodeId).catch((err) =>
        console.error('Discount code usage increment error:', err)
      );
    }

    generateClassSchedules().catch((err) => console.error('Schedule generation after enrollment:', err));

    return NextResponse.json({
      success: true,
      studentId: studentIdStr,
      message: existingStudentId ? 'Course tagged with student successfully.' : 'Enrollment complete. Student can login with Student ID and password (sent to parent).',
    });
  } catch (error) {
    console.error('Student details error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
