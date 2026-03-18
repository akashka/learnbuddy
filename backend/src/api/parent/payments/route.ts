import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

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
      .populate('studentId', 'name')
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
        student: e.studentId,
        teacher: e.teacherId,
        subject: e.subject,
        startDate: e.startDate,
        endDate: e.endDate,
      }));

    const now = new Date();
    const upcoming = enrollments
      .filter((e) => e.status === 'active' && e.endDate && new Date(e.endDate) > now)
      .map((e) => ({
        _id: e._id,
        totalAmount: e.feePerMonth,
        student: e.studentId,
        teacher: e.teacherId,
        subject: e.subject,
        endDate: e.endDate,
      }));

    return NextResponse.json({ payments, upcoming });
  } catch (error) {
    console.error('Parent payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
