import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';

export const MAX_TEACHER_CHANGES_PER_ENROLLMENT = 2;

export type SwitchContextOk = {
  parent: mongoose.Document & { _id: mongoose.Types.ObjectId; children: mongoose.Types.ObjectId[] };
  oldEnrollment: {
    _id: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    feePerMonth?: number;
    teacherChangeCount?: number;
    studentId: mongoose.Types.ObjectId;
  };
  newTeacher: {
    _id: mongoose.Types.ObjectId;
    name?: string;
    batches?: Array<{
      name?: string;
      subject?: string;
      board?: string;
      classLevel?: string;
      feePerMonth?: number;
      slots?: { day: string; startTime: string; endTime: string }[];
      startDate?: Date;
    }>;
  };
  batchIndex: number;
};

export type SwitchContext = { ok: true; data: SwitchContextOk } | { ok: false; status: number; message: string };

/**
 * Validates that a parent may switch from an existing enrollment to a new teacher/batch.
 */
export async function getEnrollmentSwitchContext(params: {
  parentUserId: string;
  replacesEnrollmentId: string;
  newTeacherId: string;
  batchIndex: number;
}): Promise<SwitchContext> {
  await connectDB();
  const parent = await Parent.findOne({ userId: params.parentUserId });
  if (!parent) return { ok: false, status: 404, message: 'Parent not found' };

  let oldId: mongoose.Types.ObjectId;
  try {
    oldId = new mongoose.Types.ObjectId(params.replacesEnrollmentId);
  } catch {
    return { ok: false, status: 400, message: 'Invalid enrollment id' };
  }

  const oldEnrollment = await Enrollment.findOne({
    _id: oldId,
    studentId: { $in: parent.children },
    paymentStatus: 'completed',
    status: 'active',
  }).lean();

  if (!oldEnrollment) {
    return { ok: false, status: 400, message: 'Enrollment not found or cannot be switched' };
  }

  if (String(oldEnrollment.teacherId) === String(params.newTeacherId)) {
    return { ok: false, status: 400, message: 'Choose a different teacher than your current one' };
  }

  const changeCount = (oldEnrollment as { teacherChangeCount?: number }).teacherChangeCount ?? 0;
  if (changeCount >= MAX_TEACHER_CHANGES_PER_ENROLLMENT) {
    return { ok: false, status: 400, message: 'Maximum teacher switches reached for this enrollment' };
  }

  const newTeacher = await Teacher.findById(params.newTeacherId).lean();
  if (!newTeacher || newTeacher.status !== 'qualified') {
    return { ok: false, status: 404, message: 'Teacher not found' };
  }

  const batch = newTeacher.batches?.[params.batchIndex];
  if (!batch) {
    return { ok: false, status: 400, message: 'Batch not available' };
  }

  const data: SwitchContextOk = {
    parent: parent as SwitchContextOk['parent'],
    oldEnrollment: {
      _id: oldEnrollment._id as mongoose.Types.ObjectId,
      teacherId: oldEnrollment.teacherId as mongoose.Types.ObjectId,
      feePerMonth: oldEnrollment.feePerMonth,
      teacherChangeCount: oldEnrollment.teacherChangeCount,
      studentId: oldEnrollment.studentId as mongoose.Types.ObjectId,
    },
    newTeacher: {
      _id: newTeacher._id as mongoose.Types.ObjectId,
      name: newTeacher.name,
      batches: newTeacher.batches as SwitchContextOk['newTeacher']['batches'],
    },
    batchIndex: params.batchIndex,
  };

  return { ok: true, data };
}
