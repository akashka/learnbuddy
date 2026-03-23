import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

/** Lean populate may set teacherId/studentId to `{ _id, ... }` — normalize for queries and JSON. */
function refId(ref: unknown): string {
  if (ref == null) return '';
  if (typeof ref === 'object' && ref !== null && '_id' in ref) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

export async function GET(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({ studentId: { $in: parent.children } })
      .populate('studentId', 'name studentId')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const payments = enrollments
      .filter((e) => e.paymentStatus === 'completed')
      .map((e) => ({
        _id: e._id,
        totalAmount: e.totalAmount,
        paymentStatus: e.paymentStatus,
        paymentId: e.paymentId,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        student: e.studentId,
        teacher: e.teacherId,
        subject: e.subject,
        startDate: e.startDate,
        endDate: e.endDate,
        batchId: e.batchId,
        board: e.board,
        classLevel: e.classLevel,
        duration: e.duration,
        feePerMonth: e.feePerMonth,
        discount: e.discount,
        discountCode: e.discountCode,
        discountCodeAmount: e.discountCodeAmount,
        slots: e.slots,
      }));

    const now = new Date();
    const upcomingRaw = enrollments.filter(
      (e) => e.status === 'active' && e.endDate && new Date(e.endDate) > now
    );

    const upcomingTeacherIds = [...new Set(upcomingRaw.map((e) => refId(e.teacherId)).filter(Boolean))];
    const teachersForUpcoming =
      upcomingTeacherIds.length > 0
        ? await Teacher.find({ _id: { $in: upcomingTeacherIds } })
            .select('batches')
            .lean()
        : [];
    const teacherBatchMap = new Map(
      teachersForUpcoming.map((t) => [String(t._id), t.batches || []])
    );

    const upcoming = upcomingRaw.map((e) => {
      const tId = refId(e.teacherId);
      const batches = teacherBatchMap.get(tId) || [];
      const batchIndex = batches.findIndex((b) => b.name === e.batchId);
      const safeBatchIndex = batchIndex >= 0 ? batchIndex : 0;
      return {
        _id: e._id,
        totalAmount: e.feePerMonth,
        student: e.studentId,
        teacher: e.teacherId,
        subject: e.subject,
        endDate: e.endDate,
        teacherId: tId,
        batchIndex: safeBatchIndex,
        duration: e.duration || '3months',
        board: e.board,
        classLevel: e.classLevel,
        batchId: e.batchId,
      };
    });

    return NextResponse.json({ payments, upcoming });
  } catch (error) {
    console.error('Parent payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
