import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { StudentExam } from '@/lib/models/StudentExam';
import { Student } from '@/lib/models/Student';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const exam = await StudentExam.findById(id)
      .populate('studentId', 'name studentId classLevel')
      .populate('enrollmentId')
      .lean();

    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const studentId = (exam.studentId as { _id?: unknown })?._id ?? exam.studentId;

    if (decoded.role === 'student') {
      const stu = await Student.findOne({ userId: decoded.userId }).select('_id').lean();
      if (!stu || String(stu._id) !== String(studentId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role === 'parent') {
      const parent = await Parent.findOne({ userId: decoded.userId });
      const sid = String((exam.studentId as { _id?: unknown })?._id ?? exam.studentId);
      if (!parent || !parent.children.some((c) => c.toString() === sid)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const sid = (exam.studentId as { _id?: unknown })?._id ?? exam.studentId;
      const enrollment = exam.enrollmentId as { teacherId?: unknown } | null;
      const hasEnrollmentMatch = enrollment && String((enrollment as { teacherId?: unknown }).teacherId) === String(teacher._id);
      const { Enrollment } = await import('@/lib/models/Enrollment');
      const enrollmentForStudent = await Enrollment.findOne({ teacherId: teacher._id, studentId: sid }).lean();
      if (!hasEnrollmentMatch && !enrollmentForStudent) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Exam get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
