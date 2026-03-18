import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({ teacherId: teacher._id, status: 'active' })
      .populate({ path: 'studentId', select: 'name studentId classLevel parentId', populate: { path: 'parentId', select: 'name phone' } })
      .lean();

    const students = enrollments.map((e) => {
      const s = e.studentId as { parentId?: { name?: string; phone?: string }; name?: string; studentId?: string; classLevel?: string };
      return {
        student: s ? { name: s.name, studentId: s.studentId, classLevel: s.classLevel } : null,
        parent: s?.parentId ? { name: (s.parentId as { name?: string }).name, phone: (s.parentId as { phone?: string }).phone } : null,
        subject: e.subject,
        batchId: e.batchId,
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Teacher students error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
