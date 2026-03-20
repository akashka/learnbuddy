import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { getAuthFromRequest } from '@/lib/auth';

/** Teacher: Get next payment schedule - active batches, students, and upcoming payment months */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const activeEnrollments = await Enrollment.find({
      teacherId: teacher._id,
      status: 'active',
      paymentStatus: 'completed',
    })
      .populate('studentId', 'name studentId')
      .lean();

    const batches = new Map<
      string,
      { batchId: string; subject: string; students: { name: string; studentId?: string }[]; feePerMonth: number }
    >();

    for (const e of activeEnrollments) {
      const batchKey = ((e as { batchId?: string }).batchId ?? '') + '|' + ((e as { subject?: string }).subject ?? '');
      const student = e.studentId as { name?: string; studentId?: string } | null;
      const feePerMonth = (e as { feePerMonth?: number }).feePerMonth ?? 0;

      if (!batches.has(batchKey)) {
        batches.set(batchKey, {
          batchId: (e as { batchId?: string }).batchId ?? '-',
          subject: (e as { subject?: string }).subject ?? '-',
          students: [],
          feePerMonth: 0,
        });
      }
      const b = batches.get(batchKey)!;
      if (student) {
        b.students.push({ name: student.name ?? 'Student', studentId: student.studentId });
      }
      b.feePerMonth += feePerMonth;
    }

    const scheduleItems = Array.from(batches.values()).map((b) => ({
      batchId: b.batchId,
      subject: b.subject,
      students: b.students,
      feePerMonth: b.feePerMonth,
    }));

    const lastPayment = await TeacherPayment.findOne({ teacherId: teacher._id })
      .sort({ periodEnd: -1 })
      .select('periodEnd periodStart')
      .lean();

    const nextPaymentMonth = lastPayment
      ? (() => {
          const end = new Date((lastPayment as { periodEnd?: Date }).periodEnd ?? 0);
          const y = end.getFullYear();
          const m = end.getMonth() + 1;
          if (m >= 12) return { year: y + 1, month: 1 };
          return { year: y, month: m + 1 };
        })()
      : { year: currentYear, month: currentMonth };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return NextResponse.json({
      batches: scheduleItems,
      nextPaymentMonth: {
        ...nextPaymentMonth,
        label: `${monthNames[nextPaymentMonth.month - 1]} ${nextPaymentMonth.year}`,
      },
      message:
        scheduleItems.length > 0
          ? `Payments are processed monthly based on completed classes. Next period: ${monthNames[nextPaymentMonth.month - 1]} ${nextPaymentMonth.year}.`
          : 'No active batches. Payments are calculated when you complete classes.',
    });
  } catch (error) {
    console.error('Teacher payment schedule error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
