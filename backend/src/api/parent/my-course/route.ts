import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List all purchased batches (courses) for parent with student and teacher links */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({
      studentId: { $in: parent.children },
      paymentStatus: 'completed',
      status: 'active',
    })
      .populate('studentId', 'name studentId photoUrl')
      .populate('teacherId', 'name photoUrl userId')
      .sort({ createdAt: -1 })
      .lean();

    const teacherIds = [...new Set(enrollments.map((e) => String((e.teacherId as { _id?: unknown })?._id)).filter(Boolean))];
    const teachers = teacherIds.length
      ? await Teacher.find({ _id: { $in: teacherIds } })
          .select('name photoUrl _id')
          .lean()
      : [];

    const teacherMap = new Map(teachers.map((t) => [String(t._id), t]));

    const courses = enrollments.map((e) => {
      const teacher = teacherMap.get(String((e.teacherId as { _id?: unknown })?._id));
      const student = e.studentId as { _id?: unknown; name?: string; studentId?: string; photoUrl?: string };
      return {
        _id: e._id,
        batchId: e.batchId,
        subject: e.subject,
        board: e.board,
        classLevel: e.classLevel,
        feePerMonth: e.feePerMonth,
        slots: e.slots,
        startDate: e.startDate,
        endDate: e.endDate,
        student: student
          ? { _id: student._id, name: student.name, studentId: student.studentId, photoUrl: student.photoUrl }
          : null,
        teacher: teacher
          ? {
              _id: teacher._id,
              name: teacher.name,
              photoUrl: teacher.photoUrl,
              profileUrl: `/parent/teacher/${teacher._id}`,
            }
          : null,
      };
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Parent my-course error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
