import mongoose from 'mongoose';
import { User } from './models/User';
import { Parent } from './models/Parent';
import { Teacher } from './models/Teacher';
import { Student } from './models/Student';
import { Enrollment } from './models/Enrollment';
import { ParentWishlist } from './models/ParentWishlist';
import { PendingEnrollment } from './models/PendingEnrollment';
import { TeacherReview } from './models/TeacherReview';
import { ConsentLog } from './models/ConsentLog';
import { StudentExam } from './models/StudentExam';
import { ClassSession } from './models/ClassSession';
import type { DeleteScope } from './models/DeleteAccountRequest';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createDeleteRequest(
  userId: string,
  role: 'parent' | 'teacher',
  scope: DeleteScope,
  studentIds?: string[]
): Promise<{ otp: string; expiresAt: Date }> {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { DeleteAccountRequest } = await import('./models/DeleteAccountRequest');
  await DeleteAccountRequest.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  await DeleteAccountRequest.create({
    userId,
    role,
    scope,
    studentIds: studentIds?.map((id) => new mongoose.Types.ObjectId(id)),
    otp,
    expiresAt,
  });

  return { otp, expiresAt };
}

async function deleteStudentAndRelated(studentId: mongoose.Types.ObjectId): Promise<void> {
  const student = await Student.findById(studentId);
  if (!student) return;

  const userId = student.userId;
  const enrollments = await Enrollment.find({ studentId }).select('_id');

  await StudentExam.deleteMany({ studentId });
  await ConsentLog.deleteMany({ studentId });
  await Enrollment.deleteMany({ studentId });
  await TeacherReview.deleteMany({ enrollmentId: { $in: enrollments.map((e) => e._id) } });

  await ClassSession.updateMany(
    { studentIds: studentId },
    { $pull: { studentIds: studentId } }
  );
  await ClassSession.updateMany(
    { studentId },
    { $unset: { studentId: '' } }
  );

  await Student.findByIdAndDelete(studentId);
  await User.findByIdAndDelete(userId);
}

export async function executeDeletion(
  userId: string,
  role: 'parent' | 'teacher',
  scope: DeleteScope,
  studentIds?: string[]
): Promise<void> {
  const userIdObj = new mongoose.Types.ObjectId(userId);

  if (role === 'parent') {
    const parent = await Parent.findOne({ userId: userIdObj });
    if (!parent) throw new Error('Parent not found');

    if (scope === 'students' && studentIds && studentIds.length > 0) {
      for (const sid of studentIds) {
        const student = await Student.findOne({ _id: sid, parentId: parent._id });
        if (student) {
          await deleteStudentAndRelated(student._id);
          await Parent.findByIdAndUpdate(parent._id, { $pull: { children: student._id } });
        }
      }
    } else if (scope === 'full') {
      const children = await Student.find({ parentId: parent._id });
      for (const child of children) {
        await deleteStudentAndRelated(child._id);
      }
      await ParentWishlist.deleteMany({ parentId: parent._id });
      await PendingEnrollment.deleteMany({ parentId: parent._id });
      await TeacherReview.deleteMany({ parentId: parent._id });
      await ConsentLog.deleteMany({ parentId: parent._id });
      await Parent.findByIdAndDelete(parent._id);
      await User.findByIdAndDelete(userIdObj);
    }
  } else if (role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: userIdObj });
    if (!teacher) throw new Error('Teacher not found');

    const enrollments = await Enrollment.find({ teacherId: teacher._id }).select('_id');
    await TeacherReview.deleteMany({ enrollmentId: { $in: enrollments.map((e) => e._id) } });
    await Enrollment.deleteMany({ teacherId: teacher._id });
    await PendingEnrollment.deleteMany({ teacherId: teacher._id });
    await ClassSession.deleteMany({ teacherId: teacher._id });

    await Teacher.findByIdAndDelete(teacher._id);
    await User.findByIdAndDelete(userIdObj);
  }
}
