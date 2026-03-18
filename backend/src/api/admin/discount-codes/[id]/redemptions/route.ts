import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DiscountCode } from '@/lib/models/DiscountCode';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const doc = await DiscountCode.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({ discountCodeId: id })
      .populate({ path: 'studentId', select: 'name studentId classLevel parentId', populate: { path: 'parentId', select: 'name phone' } })
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const redemptions = enrollments.map((e) => {
      const student = e.studentId as unknown as { _id?: string; name?: string; studentId?: string; classLevel?: string; parentId?: { name?: string; phone?: string } } | null;
      const teacher = e.teacherId as unknown as { _id?: string; name?: string } | null;
      return {
        _id: e._id,
        studentName: student?.name,
        studentId: student?.studentId,
        studentClassLevel: student?.classLevel,
        parentName: student?.parentId?.name,
        parentPhone: student?.parentId?.phone,
        teacherName: teacher?.name,
        subject: e.subject,
        board: e.board,
        classLevel: e.classLevel,
        batchId: e.batchId,
        duration: e.duration,
        feePerMonth: e.feePerMonth,
        totalAmount: e.totalAmount,
        discountCodeAmount: e.discountCodeAmount,
        paymentStatus: e.paymentStatus,
        status: e.status,
        createdAt: e.createdAt,
      };
    });

    return NextResponse.json({
      code: doc,
      redemptions,
    });
  } catch (error) {
    console.error('Discount code redemptions error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
