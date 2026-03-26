import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Enrollment } from '@/lib/models/Enrollment';
import { incrementDiscountCodeUsage } from '@/lib/discount-utils';
import { Student } from '@/lib/models/Student';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { getAuthFromRequest } from '@/lib/auth';
import { generateClassSchedules } from '@/lib/generate-class-schedules';
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

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { action, parentId, teacherId, batchIndex, studentId, studentDetails, paymentId, paymentStatus, pendingId } = body;

    if (action === 'add_student') {
      if (!parentId || !studentDetails?.name || !studentDetails?.classLevel) {
        return NextResponse.json({ error: 'Parent and student details required' }, { status: 400 });
      }
      const parent = await Parent.findById(parentId);
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

      const studentId = generateStudentId();
      const user = await User.create({
        email: `${studentId.toLowerCase()}@guruchakra.local`,
        password: await hashPassword('Temp' + Math.random().toString(36).slice(-8)),
        role: 'student',
      });

      const student = await Student.create({
        studentId,
        userId: user._id,
        parentId: parent._id,
        name: studentDetails.name,
        classLevel: studentDetails.classLevel,
        schoolName: studentDetails.schoolName,
        board: studentDetails.board || 'CBSE',
        photoUrl: studentDetails.photoUrl,
        idProofUrl: studentDetails.idProofUrl,
        enrollments: [],
      });

      await Parent.findByIdAndUpdate(parentId, { $push: { children: student._id } });

      return NextResponse.json({ success: true, studentId, student: student._id });
    }

    if (action === 'map_teacher_batch') {
      if (!parentId || !teacherId || !batchIndex || !studentId) {
        return NextResponse.json({ error: 'Parent, teacher, batch and student required' }, { status: 400 });
      }
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      const batch = teacher.batches[body.batchIndex];
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

      const months = body.duration === '6months' ? 6 : body.duration === '12months' ? 12 : 3;
      const discount = body.duration === '6months' ? 5 : body.duration === '12months' ? 10 : 0;
      const totalAmount = Math.round(batch.feePerMonth * months * (1 - discount / 100));

      const startDate = body.startDate ? getValidBatchStartDate(body.startDate) : getValidBatchStartDate(batch.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);

      const enrollment = await Enrollment.create({
        studentId: body.studentId,
        teacherId,
        batchId: batch.name,
        subject: batch.subject,
        board: batch.board,
        classLevel: batch.classLevel,
        slots: batch.slots,
        feePerMonth: batch.feePerMonth,
        duration: body.duration || '3months',
        discount,
        totalAmount,
        paymentStatus: body.paymentStatus || 'completed',
        paymentId: body.paymentId,
        status: 'active',
        startDate,
        endDate,
      });

      await Student.findByIdAndUpdate(body.studentId, { $push: { enrollments: enrollment._id } });

      const student = await Student.findById(body.studentId).select('name').lean();
      const teacherDoc = await Teacher.findById(teacherId).select('userId').lean();
      if (teacherDoc?.userId) {
        const studentName = (student as { name?: string })?.name || 'A student';
        createNotification({
          userId: teacherDoc.userId as mongoose.Types.ObjectId,
          type: 'course_purchased',
          title: 'New student enrolled!',
          message: `${studentName} has joined your ${batch.subject} batch.`,
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
            variables: {
              studentName,
              subject: batch.subject,
              ctaUrl: `${appUrl}/teacher/classes`,
            },
          }).catch((err) => console.error('Email error:', err));
        }
      }

      generateClassSchedules().catch((err) => console.error('Schedule generation after map_teacher_batch:', err));
      return NextResponse.json({ success: true, enrollmentId: enrollment._id });
    }

    if (action === 'update_payment') {
      if (!pendingId) return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
      await PendingEnrollment.findByIdAndUpdate(pendingId, {
        paymentStatus: paymentStatus || 'pending',
        paymentId: paymentId || undefined,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'generate_payment_link') {
      if (!pendingId) return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
      const pending = await PendingEnrollment.findById(pendingId);
      if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/payment?pendingId=${pendingId}`;
      return NextResponse.json({ paymentLink: link, pendingId });
    }

    if (action === 'complete_from_pending') {
      if (!pendingId) return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
      const pending = await PendingEnrollment.findById(pendingId).populate('teacherId');
      if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const teacher = pending.teacherId as unknown as { _id: unknown; batches: { name: string; subject: string; board: string; classLevel: string; slots: unknown[]; feePerMonth: number }[] };
      const batch = teacher?.batches?.[pending.batchIndex];
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

      const parentId = pending.parentId;
      const sd = pending.studentDetails as { name?: string; classLevel?: string; schoolName?: string; board?: string; photoUrl?: string; idProofUrl?: string } | undefined;
      if (!sd?.name || !sd?.classLevel) {
        return NextResponse.json({ error: 'Student details required. Add student first or ensure pending has name and classLevel.' }, { status: 400 });
      }

      const existingStudent = await Student.findOne({ parentId, name: sd.name, classLevel: sd.classLevel });
      let studentDoc = existingStudent;
      if (!studentDoc) {
        const newStudentId = generateStudentId();
        const user = await User.create({
          email: `${newStudentId.toLowerCase()}@guruchakra.local`,
          password: await hashPassword('Temp' + Math.random().toString(36).slice(-8)),
          role: 'student',
        });
        studentDoc = await Student.create({
          studentId: newStudentId,
          userId: user._id,
          parentId,
          name: sd.name,
          classLevel: sd.classLevel,
          schoolName: sd.schoolName,
          board: sd.board || 'CBSE',
          photoUrl: sd.photoUrl,
          idProofUrl: sd.idProofUrl,
          enrollments: [],
        });
        await Parent.findByIdAndUpdate(parentId, { $push: { children: studentDoc._id } });
      }

      const months = pending.duration === '6months' ? 6 : pending.duration === '12months' ? 12 : 3;
      const discount = pending.discount || 0;
      const totalAmount = pending.totalAmount || Math.round(batch.feePerMonth * months * (1 - discount / 100));

      const startDate = getValidBatchStartDate((batch as { startDate?: Date }).startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);

      const enrollment = await Enrollment.create({
        studentId: studentDoc._id,
        teacherId: teacher._id as mongoose.Types.ObjectId,
        batchId: batch.name,
        subject: batch.subject,
        board: batch.board,
        classLevel: batch.classLevel,
        slots: (batch.slots || []) as { day: string; startTime: string; endTime: string }[],
        feePerMonth: batch.feePerMonth,
        duration: pending.duration,
        discount,
        totalAmount,
        discountCode: pending.discountCode,
        discountCodeId: pending.discountCodeId,
        discountCodeAmount: pending.discountCodeAmount,
        paymentStatus: pending.paymentStatus === 'completed' ? 'completed' : (body.paymentStatus || 'completed'),
        paymentId: pending.paymentId || body.paymentId,
        status: 'active',
        startDate,
        endDate,
      });

      await Student.findByIdAndUpdate(studentDoc._id, { $push: { enrollments: enrollment._id } });
      await PendingEnrollment.findByIdAndUpdate(pendingId, { $set: { convertedToEnrollmentId: enrollment._id } });

      if (pending.discountCodeId) {
        incrementDiscountCodeUsage(pending.discountCodeId).catch((err) =>
          console.error('Discount code usage increment error:', err)
        );
      }

      const teacherDoc = await Teacher.findById(teacher._id).select('userId').lean();
      if (teacherDoc?.userId) {
        createNotification({
          userId: teacherDoc.userId as mongoose.Types.ObjectId,
          type: 'course_purchased',
          title: 'New student enrolled!',
          message: `${sd.name} has joined your ${batch.subject} batch.`,
          ctaLabel: 'View Classes',
          ctaUrl: '/teacher/classes',
          entityType: 'enrollment',
          entityId: String(enrollment._id),
        }).catch((err) => console.error('Notification error:', err));
      }

      generateClassSchedules().catch((err) => console.error('Schedule generation after complete_from_pending:', err));
      return NextResponse.json({ success: true, enrollmentId: enrollment._id, studentId: studentDoc._id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Manage error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
