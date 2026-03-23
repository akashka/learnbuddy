import { NextRequest, NextResponse } from '@/lib/next-compat';
import { Teacher } from '@/lib/models/Teacher';
import { Student } from '@/lib/models/Student';
import { getAuthFromRequest } from '@/lib/auth';
import { getEnrollmentSwitchContext } from '@/lib/enrollment-switch-validation';
import { computeSwitchProrata } from '@/lib/teacher-switch-prorata';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const teacherId = searchParams.get('teacherId');
    const batchIndexRaw = searchParams.get('batchIndex');
    const durationParam = searchParams.get('duration') || '3months';

    if (!enrollmentId || !teacherId) {
      return NextResponse.json({ error: 'enrollmentId and teacherId required' }, { status: 400 });
    }

    const batchIndex = parseInt(batchIndexRaw ?? '0', 10);
    if (Number.isNaN(batchIndex) || batchIndex < 0) {
      return NextResponse.json({ error: 'Invalid batchIndex' }, { status: 400 });
    }

    const duration =
      durationParam === '6months' || durationParam === '12months' ? durationParam : '3months';

    const sw = await getEnrollmentSwitchContext({
      parentUserId: decoded.userId,
      replacesEnrollmentId: enrollmentId,
      newTeacherId: teacherId,
      batchIndex,
    });

    if (sw.ok === false) {
      return NextResponse.json({ error: sw.message }, { status: sw.status });
    }

    const { data } = sw;
    const batch = data.newTeacher.batches?.[batchIndex];
    const newFee = batch?.feePerMonth ?? 0;
    const oldFee = data.oldEnrollment.feePerMonth ?? 0;

    const [oldTeacher, learner] = await Promise.all([
      Teacher.findById(data.oldEnrollment.teacherId).select('name').lean(),
      Student.findById(data.oldEnrollment.studentId).select('name').lean(),
    ]);

    const prorata = computeSwitchProrata({
      oldFeeMonthly: oldFee,
      newFeeMonthly: newFee,
      duration,
    });

    return NextResponse.json({
      success: true,
      oldTeacherName: oldTeacher?.name,
      newTeacherName: data.newTeacher.name,
      subject: batch?.subject,
      board: batch?.board,
      classLevel: batch?.classLevel,
      studentId: String(data.oldEnrollment.studentId),
      studentName: learner?.name,
      prorataBreakdown: {
        ...prorata,
        oldTeacherId: String(data.oldEnrollment.teacherId),
        newTeacherId: String(data.newTeacher._id),
      },
    });
  } catch (error) {
    console.error('switch-prorata-preview error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
