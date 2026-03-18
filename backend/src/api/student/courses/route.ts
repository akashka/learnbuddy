import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student, Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

/** GET: Student's enrolled courses with schedule (slots), teacher, and next session info */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'active',
    })
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const courses = enrollments.map((e) => ({
      _id: e._id,
      subject: e.subject,
      board: e.board,
      classLevel: e.classLevel,
      batchId: e.batchId,
      slots: e.slots || [],
      startDate: e.startDate,
      endDate: e.endDate,
      teacher: (e.teacherId as { name?: string })?.name,
      feePerMonth: e.feePerMonth,
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Student courses error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
